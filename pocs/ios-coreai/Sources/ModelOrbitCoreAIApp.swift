import SwiftUI

@main
@available(iOS 27.0, *)
struct ModelOrbitCoreAIApp: App {
    var body: some Scene {
        WindowGroup { ContentView() }
    }
}

@available(iOS 27.0, *)
private struct ContentView: View {
    @State private var selectedModel = CoreAICatalog.verified[0]
    @State private var manifestId = ""
    @State private var prompt = "Write one short sentence about a quiet orbit."
    @State private var response = ""
    @State private var status = "Ready. Add one exported Core AI bundle to the app resources."
    @State private var isRunning = false

    var body: some View {
        NavigationStack {
            Form {
                Section("Candidate") {
                    Picker("Model", selection: $selectedModel) {
                        ForEach(CoreAICatalog.verified) { candidate in
                            Text(candidate.displayName).tag(candidate)
                        }
                    }
                    TextField("device-ios-... manifest ID", text: $manifestId)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                }
                Section("Canonical fixture") {
                    TextEditor(text: $prompt).frame(minHeight: 90)
                    Button(isRunning ? "Running…" : "Run cold + warm benchmark") { run() }
                        .disabled(isRunning || manifestId.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
                Section("Response") {
                    Text(response.isEmpty ? "No response yet." : response)
                    Text(status).font(.footnote).foregroundStyle(.secondary)
                }
            }
            .navigationTitle("ModelOrbit Core AI")
        }
    }

    private func run() {
        isRunning = true
        status = "Loading \(selectedModel.modelId)…"
        Task {
            do {
                guard let bundleURL = Bundle.main.url(forResource: selectedModel.assetName, withExtension: nil, subdirectory: "Models") else {
                    throw NSError(domain: "ModelOrbit", code: 1, userInfo: [NSLocalizedDescriptionKey: "Missing resource folder \(selectedModel.assetName). Export the candidate and copy it under Resources/Models."])
                }
                let result = try await CoreAIAdapter().run(candidate: selectedModel, bundleURL: bundleURL, manifestId: manifestId, prompt: prompt)
                response = result.responseText
                status = "Saved benchmark artifact: \(result.artifactURL.path)"
            } catch {
                response = ""
                status = "BLOCKED/FAIL: \(error.localizedDescription)"
            }
            isRunning = false
        }
    }
}
