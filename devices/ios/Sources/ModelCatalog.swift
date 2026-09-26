import Foundation

enum ModelModality: String, Sendable {
    case speechToText
    case textGeneration
    case imageToText
}

struct ModelRecord: Identifiable, Hashable, Sendable {
    let id: String
    let revision: String
    let assetName: String
    let modality: ModelModality

    var label: String { "\(id) · \(modality.rawValue)" }
}

enum ModelCatalog {
    // Keep these immutable revisions aligned with the research inventory. An exported
    // asset must be produced from the matching revision before native inference.
    static let records: [ModelRecord] = [
        .init(id: "nvidia/parakeet-tdt-0.6b-v3", revision: "541d1f99c6b0c3cd0b11a95167540bb8edefd82b", assetName: "parakeet_tdt_0_6b_v3", modality: .speechToText),
        .init(id: "openai/whisper-large-v3-turbo", revision: "41f01f3fe87f28c78e2fbf8b568835947dd65ed9", assetName: "whisper_large_v3_turbo", modality: .speechToText),
        .init(id: "Qwen/Qwen3-0.6B", revision: "a9c98e602b9d36d2a2f7ba1eb0f5f31e4e8e5143", assetName: "qwen3_0_6b", modality: .textGeneration),
        .init(id: "Qwen/Qwen3-1.7B", revision: "70d244cc86ccca08cf5af4e1e306ecf908b1ad5e", assetName: "qwen3_1_7b", modality: .textGeneration),
        .init(id: "Qwen/Qwen3-4B", revision: "1cfa9a7208912126459214e8b04321603b3df60c", assetName: "qwen3_4b", modality: .textGeneration),
        .init(id: "HuggingFaceTB/SmolLM2-135M-Instruct", revision: "12fd25f77366fa6b3b4b768ec3050bf629380bac", assetName: "smollm2_135m_instruct", modality: .textGeneration),
        .init(id: "meta-llama/Llama-3.2-1B-Instruct", revision: "9213176726f574b556790deb65791e0c5aa438b6", assetName: "llama_3_2_1b_instruct", modality: .textGeneration),
        .init(id: "Qwen/Qwen3-VL-2B-Instruct", revision: "89644892e4d85e24eaac8bacfd4f463576704203", assetName: "qwen3_vl_2b", modality: .imageToText)
    ]

    static func resourceURL(for record: ModelRecord, in bundle: Bundle = .main) -> URL? {
        bundle.url(forResource: record.assetName, withExtension: nil, subdirectory: "Models")
    }
}
