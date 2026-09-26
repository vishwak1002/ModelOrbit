import SwiftUI
import UniformTypeIdentifiers

@main
@available(iOS 27.0, *)
struct ModelOrbitDevicesApp: App {
    var body: some Scene {
        WindowGroup { ModelPOCScreen() }
    }
}

@available(iOS 27.0, *)
private struct ModelPOCScreen: View {
    @State private var selected = ModelCatalog.records[0]
    @State private var prompt = "Describe this input."
    @State private var inputURL: URL?
    @State private var useFixture = true
    @State private var isImporting = false
    @State private var isRunning = false
    @State private var status = "Select a model and run a fixture or add a local model bundle."
    @State private var output = ""

    var body: some View {
        NavigationStack {
            Form {
                Section("Model") {
                    Picker("Checkpoint", selection: $selected) {
                        ForEach(ModelCatalog.records) { record in Text(record.label).tag(record) }
                    }
                    Text("Revision: \(selected.revision)")
                        .font(.caption.monospaced())
                        .textSelection(.enabled)
                    Toggle("Fixture mode", isOn: $useFixture)
                }
                Section("Input") {
                    if selected.modality != .textGeneration {
                        Button("Choose \(selected.modality == .speechToText ? "audio" : "image") file") { isImporting = true }
                        Text(inputURL?.lastPathComponent ?? "No file selected")
                            .foregroundStyle(.secondary)
                    }
                    if selected.modality != .speechToText {
                        TextField("Prompt", text: $prompt, axis: .vertical).lineLimit(2...5)
                    }
                }
                Section {
                    Button(isRunning ? "Running…" : "Run POC") { Task { await run() } }
                        .disabled(isRunning)
                    Text(status).font(.caption)
                    if !output.isEmpty { Text(output).textSelection(.enabled) }
                }
            }
            .navigationTitle("ModelOrbit devices")
            .fileImporter(isPresented: $isImporting, allowedContentTypes: selected.modality == .speechToText ? [.audio] : [.image]) { result in
                switch result {
                case .success(let url): inputURL = url
                case .failure(let error): status = "File selection failed: \(error.localizedDescription)"
                }
            }
        }
    }

    private func run() async {
        isRunning = true
        defer { isRunning = false }
        output = ""
        guard let input = makeInput() else {
            status = "Select a local \(selected.modality == .speechToText ? "audio" : "image") file."
            return
        }
        let scopedURL = inputURL
        let hasAccess = scopedURL?.startAccessingSecurityScopedResource() ?? false
        defer { if hasAccess { scopedURL?.stopAccessingSecurityScopedResource() } }
        do {
            let adapter: any ModelAdapter = useFixture ? FixtureModelAdapter() : NativeModelRouter()
            let result = try await adapter.run(input, model: selected, resourceURL: ModelCatalog.resourceURL(for: selected))
            output = result.text
            status = result.isFixture ? "Fixture passed. No model inference or device benchmark was measured." : "Native inference completed on this device. Quality, latency, and memory are unmeasured."
        } catch {
            status = "Blocked: \(error.localizedDescription)"
        }
    }

    private func makeInput() -> ModelInput? {
        switch selected.modality {
        case .textGeneration: return .text(prompt)
        case .speechToText: return inputURL.map { .audio($0) }
        case .imageToText: return inputURL.map { .image($0, prompt: prompt) }
        }
    }
}
