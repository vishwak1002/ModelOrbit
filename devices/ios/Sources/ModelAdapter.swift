import Foundation

enum ModelInput: Sendable {
    case text(String)
    case audio(URL)
    case image(URL, prompt: String)
}

struct ModelOutput: Sendable {
    let text: String
    let isFixture: Bool
}

enum ModelRunError: LocalizedError {
    case wrongInput(String)
    case missingAsset(String)
    case unsupportedRuntime(String)
    case emptyOutput

    var errorDescription: String? {
        switch self {
        case .wrongInput(let message), .missingAsset(let message), .unsupportedRuntime(let message): message
        case .emptyOutput: "The model returned no text."
        }
    }
}

protocol ModelAdapter: Sendable {
    func run(_ input: ModelInput, model: ModelRecord, resourceURL: URL?) async throws -> ModelOutput
}

struct FixtureModelAdapter: ModelAdapter {
    func run(_ input: ModelInput, model: ModelRecord, resourceURL: URL?) async throws -> ModelOutput {
        let description: String
        switch input {
        case .text(let prompt): description = "text:\(prompt)"
        case .audio(let url): description = "audio:\(url.lastPathComponent)"
        case .image(let url, let prompt): description = "image:\(url.lastPathComponent):\(prompt)"
        }
        return ModelOutput(text: "[fixture:\(model.id)@\(model.revision)] \(description)", isFixture: true)
    }
}
