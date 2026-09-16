import Foundation

// This runner is intentionally conservative: the Core AI adapter is injected at
// the device target. Without a verified candidate and device manifest it emits a
// blocked result instead of pretending that a host build is device evidence.
struct POCResult: Codable {
    let schemaVersion: String
    let platform: String
    let runtime: String
    let status: String
    let modelId: String?
    let modelRevision: String?
    let reason: String
    let networkAllowed: Bool
}

let arguments = CommandLine.arguments
let modelId = arguments.firstIndex(of: "--model-id").flatMap { arguments[safe: $0 + 1] }
let revision = arguments.firstIndex(of: "--revision").flatMap { arguments[safe: $0 + 1] }
let manifest = arguments.firstIndex(of: "--device-manifest").flatMap { arguments[safe: $0 + 1] }
let result = POCResult(schemaVersion: "0.2.0", platform: "ios", runtime: "core-ai", status: "blocked", modelId: modelId, modelRevision: revision, reason: "No verified Core AI candidate and physical iPhone manifest were supplied; no model load or network request was attempted.", networkAllowed: false)
let encoder = JSONEncoder(); encoder.outputFormatting = [.sortedKeys]
print(String(data: try encoder.encode(result), encoding: .utf8)!)

extension Array {
    subscript(safe index: Int) -> Element? { indices.contains(index) ? self[index] : nil }
}
