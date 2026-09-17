import Observation
import SwiftUI

private struct ChatMessage: Identifiable, Equatable {
    enum Role: Equatable {
        case user
        case assistant
    }

    let id = UUID()
    let role: Role
    let text: String
}

@available(iOS 27.0, *)
@MainActor
@Observable
private final class ChatViewModel {
    var selectedModel: CoreAICandidate
    var manifestId = ""
    var prompt = ""
    private(set) var status = "Ready. Add a device manifest and exported Core AI bundle to start chatting."
    private(set) var isRunning = false
    private(set) var messages: [ChatMessage] = [
        ChatMessage(role: .assistant, text: "Core AI chat is ready. Ask a question and I’ll run it through the selected on-device model, then save the benchmark evidence.")
    ]

    private let adapter: any NativeModelAdapter

    init(selectedModel: CoreAICandidate = CoreAICatalog.verified[0], adapter: any NativeModelAdapter = CoreAIAdapter()) {
        self.selectedModel = selectedModel
        self.adapter = adapter
    }

    func send() async {
        let userPrompt = prompt.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !userPrompt.isEmpty, !isRunning else { return }

        messages.append(ChatMessage(role: .user, text: userPrompt))
        prompt = ""

        let cleanManifestId = manifestId.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !cleanManifestId.isEmpty else {
            appendBlockedMessage("This chat is wired to the native POC, but it is blocked until you enter the captured device-ios-… manifest ID. No model load was attempted.")
            status = "Blocked: device manifest required."
            return
        }

        isRunning = true
        status = "Loading \(selectedModel.modelId)…"
        defer { isRunning = false }

        do {
            guard let bundleURL = Bundle.main.url(forResource: selectedModel.assetName, withExtension: nil, subdirectory: "Models") else {
                throw NSError(domain: "ModelOrbit", code: 1, userInfo: [NSLocalizedDescriptionKey: "Missing resource folder \(selectedModel.assetName). Export the candidate and copy it under Resources/Models."])
            }
            let result = try await adapter.run(candidate: selectedModel, bundleURL: bundleURL, manifestId: cleanManifestId, prompt: userPrompt)
            messages.append(ChatMessage(role: .assistant, text: result.responseText))
            status = "Saved benchmark artifact: \(result.artifactURL.path)"
        } catch {
            let message = "POC blocked/failed: \(error.localizedDescription)"
            appendBlockedMessage(message)
            status = message
        }
    }

    private func appendBlockedMessage(_ message: String) {
        messages.append(ChatMessage(role: .assistant, text: message))
    }
}

@main
@available(iOS 27.0, *)
struct ModelOrbitCoreAIApp: App {
    var body: some Scene {
        WindowGroup { ContentView() }
    }
}

@available(iOS 27.0, *)
@MainActor
private struct ContentView: View {
    @State private var viewModel: ChatViewModel

    init(viewModel: ChatViewModel = ChatViewModel()) {
        _viewModel = State(initialValue: viewModel)
    }

    var body: some View {
        NavigationStack {
            ChatScreen(viewModel: viewModel)
        }
    }
}

@available(iOS 27.0, *)
@MainActor
private struct ChatScreen: View {
    @Bindable private var viewModel: ChatViewModel

    init(viewModel: ChatViewModel) {
        self.viewModel = viewModel
    }

    var body: some View {
        VStack(spacing: 0) {
            ChatContextPanel(
                selectedModel: $viewModel.selectedModel,
                manifestId: $viewModel.manifestId,
                status: viewModel.status,
                isRunning: viewModel.isRunning
            )
            Divider()
            ConversationView(messages: viewModel.messages)
            ChatComposer(
                prompt: $viewModel.prompt,
                isRunning: viewModel.isRunning,
                onSend: { Task { await viewModel.send() } }
            )
        }
        .background(Color(uiColor: .systemGroupedBackground))
        .navigationTitle("ModelOrbit Chat")
        .navigationBarTitleDisplayMode(.inline)
    }
}

@available(iOS 27.0, *)
private struct ChatContextPanel: View {
    @Binding var selectedModel: CoreAICandidate
    @Binding var manifestId: String
    let status: String
    let isRunning: Bool

    var body: some View {
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
            .disabled(isRunning)
            TextField("device-ios-... manifest ID", text: $manifestId)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
                .textFieldStyle(.roundedBorder)
                .disabled(isRunning)
            Text(status)
                .font(.caption)
                .foregroundStyle(.secondary)
                .lineLimit(2)
        }
        .padding()
        .background(.background)
    }
}

@available(iOS 27.0, *)
private struct ConversationView: View {
    let messages: [ChatMessage]

    var body: some View {
        ScrollViewReader { proxy in
            ScrollView {
                LazyVStack(alignment: .leading, spacing: 14) {
                    ForEach(messages) { message in
                        MessageBubble(message: message)
                    }
                }
                .padding()
            }
            .onChange(of: messages.count) { _, _ in
                guard let lastMessage = messages.last else { return }
                withAnimation { proxy.scrollTo(lastMessage.id, anchor: .bottom) }
            }
        }
    }
}

@available(iOS 27.0, *)
private struct MessageBubble: View {
    let message: ChatMessage

    var body: some View {
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
}

@available(iOS 27.0, *)
private struct ChatComposer: View {
    @Binding var prompt: String
    let isRunning: Bool
    let onSend: () -> Void

    var body: some View {
        HStack(alignment: .bottom, spacing: 8) {
            TextField("Ask the selected model…", text: $prompt, axis: .vertical)
                .lineLimit(1...5)
                .textFieldStyle(.roundedBorder)
            Button(action: onSend) {
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
}

#Preview("Core AI chat") {
    ContentView()
}
