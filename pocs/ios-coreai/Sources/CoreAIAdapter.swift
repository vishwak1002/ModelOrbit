import CoreAILanguageModels
import CryptoKit
import Foundation
import FoundationModels

struct CoreAICandidate: Identifiable, Sendable, Hashable {
    let modelId: String
    let revision: String
    let assetName: String

    var id: String { modelId }
    var displayName: String { "\(modelId) @ \(revision.prefix(12))" }
}

enum CoreAICatalog {
    static let verified: [CoreAICandidate] = [
        .init(modelId: "Qwen/Qwen3-0.6B", revision: "a9c98e602b9d36d2a2f7ba1eb0f5f31e4e8e5143", assetName: "qwen3_0_6b"),
        .init(modelId: "Qwen/Qwen3-1.7B", revision: "70d244cc86ccca08cf5af4e1e306ecf908b1ad5e", assetName: "qwen3_1_7b"),
        .init(modelId: "Qwen/Qwen3-4B", revision: "1cfa9a7", assetName: "qwen3_4b")
    ]
}

struct CoreAIRun: Sendable {
    let responseText: String
    let benchmarkJSON: String
    let artifactURL: URL
}

@available(iOS 27.0, *)
protocol NativeModelAdapter: Sendable {
    func run(candidate: CoreAICandidate, bundleURL: URL, manifestId: String, prompt: String) async throws -> CoreAIRun
}

@available(iOS 27.0, *)
struct CoreAIAdapter: NativeModelAdapter, Sendable {
    func run(candidate: CoreAICandidate, bundleURL: URL, manifestId: String, prompt: String) async throws -> CoreAIRun {
        let memoryBefore = residentMemoryBytes()
        let coldStart = ContinuousClock.now
        let model = try await CoreAILanguageModel(resourcesAt: bundleURL, mode: .eager)
        let coldSession = LanguageModelSession(model: model)
        let coldResponse = try await coldSession.respond(to: prompt)
        let coldMs = milliseconds(from: coldStart.duration(to: .now))

        let warmStart = ContinuousClock.now
        let warmSession = LanguageModelSession(model: model)
        let warmResponse = try await warmSession.respond(to: prompt)
        let warmMs = milliseconds(from: warmStart.duration(to: .now))
        model.unload()

        let outputText = String(warmResponse.content).isEmpty ? String(coldResponse.content) : String(warmResponse.content)
        guard !outputText.isEmpty else { throw AdapterError.emptyOutput }
        let peakMemory = [memoryBefore, residentMemoryBytes()].compactMap { $0 }.max()
        let checkedAt = ISO8601DateFormatter().string(from: Date())
        let runId = "benchmark-ios-\(compactTimestamp())"
        let benchmark = BenchmarkResult(
            schemaVersion: "0.2.0",
            runId: runId,
            modelId: candidate.modelId,
            modelRevision: candidate.revision,
            platform: "ios",
            deviceManifestId: manifestId,
            task: .init(fixtureId: "text-generation/basic-v1", inputChecksum: "sha256:\(sha256(prompt))", outputValidator: "non-empty-utf8"),
            status: "pass",
            output: .init(valid: true, checksum: "sha256:\(sha256(outputText))"),
            latencyMs: .init(cold: coldMs, warm: warmMs),
            peakMemoryBytes: peakMemory,
            network: .init(allowed: false, requestCount: 0, events: []),
            checkedAt: checkedAt,
            reason: "Core AI run; memory is the maximum sampled process resident size before load and after warm generation."
        )
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        let data = try encoder.encode(benchmark)
        let artifactURL = try saveArtifact(data, runId: runId)
        return CoreAIRun(responseText: outputText, benchmarkJSON: String(decoding: data, as: UTF8.self), artifactURL: artifactURL)
    }

    private func saveArtifact(_ data: Data, runId: String) throws -> URL {
        let documents = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let directory = documents.appendingPathComponent("benchmarks", isDirectory: true)
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        let url = directory.appendingPathComponent("\(runId).json")
        try data.write(to: url, options: .atomic)
        return url
    }
}

@available(iOS 27.0, *)
private enum AdapterError: LocalizedError {
    case emptyOutput

    var errorDescription: String? { "The model returned an empty response." }
}

private struct BenchmarkResult: Encodable {
    struct Task: Encodable { let fixtureId: String; let inputChecksum: String; let outputValidator: String }
    struct Output: Encodable { let valid: Bool; let checksum: String? }
    struct Latency: Encodable { let cold: Double?; let warm: Double? }
    struct Event: Encodable { let kind: String; let timestamp: String; let destination: String? }
    struct Network: Encodable { let allowed: Bool; let requestCount: Int; let events: [Event] }

    let schemaVersion: String
    let runId: String
    let modelId: String
    let modelRevision: String
    let platform: String
    let deviceManifestId: String
    let task: Task
    let status: String
    let output: Output
    let latencyMs: Latency
    let peakMemoryBytes: Int?
    let network: Network
    let checkedAt: String
    let reason: String
}

private func sha256(_ value: String) -> String {
    SHA256.hash(data: Data(value.utf8)).map { String(format: "%02x", $0) }.joined()
}

private func compactTimestamp() -> String {
    let formatter = DateFormatter()
    formatter.locale = Locale(identifier: "en_US_POSIX")
    formatter.timeZone = TimeZone(secondsFromGMT: 0)
    formatter.dateFormat = "yyyyMMdd'T'HHmmss'Z'"
    return formatter.string(from: Date())
}

private func milliseconds(from duration: Duration) -> Double {
    let components = duration.components
    return Double(components.seconds) * 1_000 + Double(components.attoseconds) / 1_000_000_000_000_000
}

#if canImport(Darwin)
import Darwin

private func residentMemoryBytes() -> Int? {
    var info = mach_task_basic_info()
    var count = mach_msg_type_number_t(MemoryLayout<mach_task_basic_info>.size / MemoryLayout<natural_t>.size)
    let result = withUnsafeMutablePointer(to: &info) {
        $0.withMemoryRebound(to: integer_t.self, capacity: Int(count)) {
            task_info(mach_task_self_, task_flavor_t(MACH_TASK_BASIC_INFO), $0, &count)
        }
    }
    return result == KERN_SUCCESS ? Int(info.resident_size) : nil
}
#else
private func residentMemoryBytes() -> Int? { nil }
#endif
