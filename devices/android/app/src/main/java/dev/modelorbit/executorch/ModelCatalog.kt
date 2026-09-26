package dev.modelorbit.executorch

internal enum class InputKind { TEXT, WAV, IMAGE_TEXT }

internal data class ModelSpec(
    val id: String,
    val revision: String,
    val assetDirectory: String,
    val inputKind: InputKind,
    val requiredFiles: List<String>,
    val nativeBinding: String?
) {
    override fun toString(): String = "$id (${revision.take(8)})"
}

/** The exact revisions are mirrored in devices/android/model-pocs.json. */
internal object ModelCatalog {
    val selected = listOf(
        ModelSpec(
            "nvidia/parakeet-tdt-0.6b-v3",
            "541d1f99c6b0c3cd0b11a95167540bb8edefd82b",
            "parakeet_tdt_0_6b_v3",
            InputKind.WAV,
            listOf("model.pte", "tokenizer.model"),
            "org.pytorch.executorch.extension.parakeet.ParakeetModule"
        ),
        ModelSpec(
            "openai/whisper-large-v3-turbo",
            "41f01f3fe87f28c78e2fbf8b568835947dd65ed9",
            "whisper_large_v3_turbo",
            InputKind.WAV,
            listOf("model.pte", "whisper_preprocessor.pte", "tokenizer.json"),
            "org.pytorch.executorch.extension.asr.AsrModule"
        ),
        ModelSpec(
            "Qwen/Qwen3-0.6B",
            "a9c98e602b9d36d2a2f7ba1eb0f5f31e4e8e5143",
            "qwen3_0_6b",
            InputKind.TEXT,
            listOf("model.pte", "tokenizer.json"),
            "org.pytorch.executorch.extension.llm.LlmModule"
        ),
        ModelSpec(
            "Qwen/Qwen3-1.7B",
            "70d244cc86ccca08cf5af4e1e306ecf908b1ad5e",
            "qwen3_1_7b",
            InputKind.TEXT,
            listOf("model.pte", "tokenizer.json"),
            "org.pytorch.executorch.extension.llm.LlmModule"
        ),
        ModelSpec(
            "Qwen/Qwen3-4B",
            "1cfa9a7208912126459214e8b04321603b3df60c",
            "qwen3_4b",
            InputKind.TEXT,
            listOf("model.pte", "tokenizer.json"),
            "org.pytorch.executorch.extension.llm.LlmModule"
        ),
        ModelSpec(
            "HuggingFaceTB/SmolLM2-135M-Instruct",
            "12fd25f77366fa6b3b4b768ec3050bf629380bac",
            "smollm2_135m_instruct",
            InputKind.TEXT,
            listOf("model.pte", "tokenizer.json"),
            "org.pytorch.executorch.extension.llm.LlmModule"
        ),
        ModelSpec(
            "meta-llama/Llama-3.2-1B-Instruct",
            "9213176726f574b556790deb65791e0c5aa438b6",
            "llama3_2_1b_instruct",
            InputKind.TEXT,
            listOf("model.pte", "tokenizer.model"),
            "org.pytorch.executorch.extension.llm.LlmModule"
        )
    )

    // Research lane only: full Android VLM export is still under upstream review.
    val blockedVision = ModelSpec(
        "Qwen/Qwen3-VL-2B-Instruct",
        "89644892e4d85e24eaac8bacfd4f463576704203",
        "qwen3_vl_2b_instruct",
        InputKind.IMAGE_TEXT,
        emptyList(),
        null
    )
}
