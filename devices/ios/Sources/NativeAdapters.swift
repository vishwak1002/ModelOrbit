import CoreAI
import CoreAILanguageModels
import CoreAISpeech
import CoreAIShared
import Foundation
import FoundationModels
import Tokenizers
import WhisperKit

@available(iOS 27.0, *)
struct NativeModelRouter: ModelAdapter {
    func run(_ input: ModelInput, model: ModelRecord, resourceURL: URL?) async throws -> ModelOutput {
        guard let resourceURL else {
            throw ModelRunError.missingAsset("Missing Models/\(model.assetName). Export the pinned revision and add its complete bundle to the Xcode project.")
        }
        switch model.id {
        case "nvidia/parakeet-tdt-0.6b-v3":
            guard case .audio(let url) = input else { throw ModelRunError.wrongInput("Choose an audio file for Parakeet.") }
            return try await ParakeetAdapter().transcribe(audioURL: url, bundleURL: resourceURL)
        case "Qwen/Qwen3-0.6B", "Qwen/Qwen3-1.7B", "Qwen/Qwen3-4B":
            guard case .text(let prompt) = input else { throw ModelRunError.wrongInput("Enter text for Qwen3.") }
            return try await QwenTextAdapter().generate(prompt: prompt, bundleURL: resourceURL)
        case "Qwen/Qwen3-VL-2B-Instruct":
            guard case .image(let url, let prompt) = input else { throw ModelRunError.wrongInput("Choose an image for Qwen3-VL.") }
            return try await QwenVisionAdapter().describe(imageURL: url, prompt: prompt, bundleURL: resourceURL)
        case "openai/whisper-large-v3-turbo":
            guard case .audio(let url) = input else { throw ModelRunError.wrongInput("Choose an audio file for Whisper.") }
            return try await WhisperAdapter().transcribe(audioURL: url, modelFolder: resourceURL)
        default:
            throw ModelRunError.unsupportedRuntime("No iOS adapter is registered for \(model.id).")
        }
    }
}

@available(iOS 27.0, *)
struct ParakeetAdapter {
    func transcribe(audioURL: URL, bundleURL: URL) async throws -> ModelOutput {
        let model = try await SpeechRecognitionModel(resourcesAt: bundleURL)
        let (text, _) = try await model.transcribe(audioURL: audioURL)
        guard !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { throw ModelRunError.emptyOutput }
        return ModelOutput(text: text, isFixture: false)
    }
}

@available(iOS 27.0, *)
struct WhisperAdapter {
    func transcribe(audioURL: URL, modelFolder: URL) async throws -> ModelOutput {
        // WhisperKit's Core ML bundle is distinct from Apple's single .aimodel export.
        // `download: false` keeps the native POC fully offline.
        let pipe = try await WhisperKit(modelFolder: modelFolder.path, download: false)
        let results = try await pipe.transcribe(audioPath: audioURL.path)
        let text = results.map(\.text).joined(separator: " ")
        guard !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { throw ModelRunError.emptyOutput }
        return ModelOutput(text: text, isFixture: false)
    }
}

@available(iOS 27.0, *)
struct QwenTextAdapter {
    func generate(prompt: String, bundleURL: URL) async throws -> ModelOutput {
        let model = try await CoreAILanguageModel(resourcesAt: bundleURL, mode: .eager)
        defer { model.unload() }
        let session = LanguageModelSession(model: model)
        let response = try await session.respond(to: prompt)
        let text = String(response.content)
        guard !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { throw ModelRunError.emptyOutput }
        return ModelOutput(text: text, isFixture: false)
    }
}

@available(iOS 27.0, *)
struct QwenVisionAdapter {
    func describe(imageURL: URL, prompt: String, bundleURL: URL) async throws -> ModelOutput {
        // This follows Apple's llm-runner VLM path. All three components must be
        // present: a text decoder, token embedding, and vision encoder.
        let bundle = try LanguageBundle(from: bundleURL.path)
        try bundle.bundle.verify()
        guard bundle.bundle.kind == .vlm, let visionConfig = bundle.visionConfig else {
            throw ModelRunError.missingAsset("Qwen3-VL requires a complete kind=vlm bundle with vision metadata.")
        }
        let decoderURL = try bundle.requireModelURL(for: ModelBundle.ComponentKey.main)
        let embeddingURL = try bundle.requireModelURL(for: ModelBundle.ComponentKey.embedding)
        let visionURL = try bundle.requireModelURL(for: ModelBundle.ComponentKey.vision)
        let baseConfig = ModelConfig(
            name: bundle.name,
            tokenizer: bundle.tokenizer,
            vocabSize: bundle.vocabSize,
            maxContextLength: bundle.maxContextLength,
            serializedModel: [decoderURL.path],
            function: bundle.language.functionMap?.name(for: "main") ?? "main"
        )
        let visionModel = try await PreparedModel.prepare(at: visionURL)
        let embeddingModel = try await PreparedModel.prepare(at: embeddingURL)
        let decoderModel = try await PreparedModel.prepare(at: decoderURL)
        let engine = try await CoreAISequentialVLMEngine(
            config: VLMModelConfig(base: baseConfig, visionConfig: visionConfig),
            visionModel: visionModel,
            embedModel: embeddingModel,
            llmModel: decoderModel,
            options: EngineOptions(variant: "default", kvCacheStrategy: .auto, kvCacheSize: nil)
        )
        let tokenizer = try await bundle.loadTokenizer()
        let image = try await engine.encodeImage(at: imageURL)
        var tokens = tokenizer.encode(text: "USER: ", addSpecialTokens: true).map { Int32($0) }
        tokens.append(contentsOf: repeatElement(visionConfig.imageTokenId, count: image.tokenCount))
        tokens.append(contentsOf: tokenizer.encode(text: "\n\(prompt)\nASSISTANT:", addSpecialTokens: false).map { Int32($0) })
        let stream = try await engine.generate(
            with: image,
            tokens: tokens,
            samplingConfiguration: SamplingConfiguration(temperature: 0),
            inferenceOptions: InferenceOptions(maxTokens: 128, includeLogits: false)
        )
        var outputTokens: [Int] = []
        for try await output in stream {
            if let eos = tokenizer.eosTokenId, output.tokenId == Int32(eos) { break }
            outputTokens.append(Int(output.tokenId))
        }
        let text = tokenizer.decode(tokens: outputTokens)
        guard !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { throw ModelRunError.emptyOutput }
        return ModelOutput(text: text, isFixture: false)
    }
}
