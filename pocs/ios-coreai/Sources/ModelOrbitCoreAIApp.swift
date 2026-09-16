import SwiftUI

private struct ChatMessage: Identifiable {
    enum Role: Equatable {
        case user
        case assistant
    }

    let id = UUID()
    let role: Role
    let text: String
}

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
    @State private var prompt = ""
    @State private var status = "Ready. Add a device manifest and exported Core AI bundle to start chatting."
    @State private var isRunning = false
    @State private var messages = [ChatMessage(role: .assistant, text: "Core AI chat is ready. Ask a question and I’ll run it through the selected on-device model, then save the benchmark evidence.")]

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                contextPanel
                Divider()
                ScrollViewReader { proxy in
                    ScrollView {
                        LazyVStack(alignment: .leading, spacing: 14) {
                            ForEach(messages) { message in
                                messageBubble(message)
                            }
                        }
                        .padding()
                    }
                    .onChange(of: messages.count) { _, _ in
                        if let last = messages.last { withAnimation { proxy.scrollTo(last.id, anchor: .bottom) } }
                    }
                }
                composer
            }
            .background(Color(uiColor: .systemGroupedBackground))
            .navigationTitle("ModelOrbit Chat")
            .navigationBarTitleDisplayMode(.inline)
        }
    }

    private var contextPanel: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Label("Core AI · offline", systemImage: "iphone")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.green)
                Spacer()
                Text(isRunning ? "GENERATING" : "READY")
                    .font(.caption2.monospaced())
                    .foregroundStyle(.secondary)
            }
            Picker("Model record", selection: $selectedModel) {
                ForEach(CoreAICatalog.verified) { candidate in
                    Text(candidate.displayName).tag(candidate)
                }
            }
            .pickerStyle(.menu)
            TextField("device-ios-... manifest ID", text: $manifestId)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
                .textFieldStyle(.roundedBorder)
            Text(status)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding()
        .background(.background)
    }

    private var composer: some View {
        HStack(alignment: .bottom, spacing: 8) {
            TextField("Ask the selected model…", text: $prompt, axis: .vertical)
                .lineLimit(1...5)
                .textFieldStyle(.roundedBorder)
            Button {
                send()
            } label: {
                Image(systemName: isRunning ? "hourglass" : "arrow.up.circle.fill")
                    .font(.title2)
            }
            .buttonStyle(.borderedProminent)
            .disabled(isRunning || prompt.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
            .accessibilityLabel("Send message")
        }
        .padding()
        .background(.background)
    }

    @ViewBuilder
    private func messageBubble(_ message: ChatMessage) -> some View {
        HStack {
            if message.role == .user { Spacer(minLength: 36) }
            VStack(alignment: message.role == .user ? .trailing : .leading, spacing: 4) {
                Text(message.role == .user ? "You" : "Core AI")
                    .font(.caption2.weight(.semibold))
                    .foregroundStyle(message.role == .user ? .secondary : .green)
                Text(message.text)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(12)
                    .background(message.role == .user ? Color.accentColor.opacity(0.14) : Color(uiColor: .secondarySystemGroupedBackground))
                    .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                    .textSelection(.enabled)
            }
            if message.role == .assistant { Spacer(minLength: 36) }
        }
        .id(message.id)
    }

    private func send() {
        let userPrompt = prompt.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !userPrompt.isEmpty else { return }
        messages.append(ChatMessage(role: .user, text: userPrompt))
        prompt = ""

        let cleanManifestId = manifestId.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !cleanManifestId.isEmpty else {
            let message = "This chat is wired to the native POC, but it is blocked until you enter the captured device-ios-… manifest ID. No model load was attempted."
            messages.append(ChatMessage(role: .assistant, text: message))
            status = "Blocked: device manifest required."
            return
        }

        isRunning = true
        status = "Loading \(selectedModel.modelId)…"
        Task {
            do {
                guard let bundleURL = Bundle.main.url(forResource: selectedModel.assetName, withExtension: nil, subdirectory: "Models") else {
                    throw NSError(domain: "ModelOrbit", code: 1, userInfo: [NSLocalizedDescriptionKey: "Missing resource folder \(selectedModel.assetName). Export the candidate and copy it under Resources/Models."])
                }
                let result = try await CoreAIAdapter().run(candidate: selectedModel, bundleURL: bundleURL, manifestId: cleanManifestId, prompt: userPrompt)
                messages.append(ChatMessage(role: .assistant, text: result.responseText))
                status = "Saved benchmark artifact: \(result.artifactURL.path)"
            } catch {
                let message = "POC blocked/failed: \(error.localizedDescription)"
                messages.append(ChatMessage(role: .assistant, text: message))
                status = message
            }
            isRunning = false
        }
    }
}
