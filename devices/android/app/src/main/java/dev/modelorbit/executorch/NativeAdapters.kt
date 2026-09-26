package dev.modelorbit.executorch

import android.content.Context
import org.pytorch.executorch.extension.llm.LlmCallback
import org.pytorch.executorch.extension.llm.LlmGenerationConfig
import org.pytorch.executorch.extension.llm.LlmModule
import java.io.File
import java.io.FileOutputStream
import java.io.RandomAccessFile
import java.lang.reflect.InvocationTargetException
import java.lang.reflect.Proxy

internal data class PocInput(val prompt: String = "", val wav: File? = null)
internal data class PocResult(val status: String, val text: String, val reason: String? = null)

internal interface ModelAdapter {
    fun run(context: Context, model: ModelSpec, input: PocInput): PocResult
}

internal class FixtureAdapter : ModelAdapter {
    override fun run(context: Context, model: ModelSpec, input: PocInput): PocResult = PocResult(
        "blocked",
        "Fixture reached ${model.id}@${model.revision.take(12)} with ${model.inputKind} input.",
        "No model ran. Fixture output contains no device quality, latency, memory, or export evidence."
    )
}

/** Only native inference reaches a pass result; asset and binding failures remain blocked. */
internal class DeviceAdapter : ModelAdapter {
    override fun run(context: Context, model: ModelSpec, input: PocInput): PocResult {
        if (model == ModelCatalog.blockedVision) return PocResult(
            "blocked", "", "Qwen3-VL Android export/vision encoder is under upstream review; no complete on-device runner is available."
        )
        val missing = model.requiredFiles.filterNot { assetExists(context, model, it) }
        if (missing.isNotEmpty()) return PocResult(
            "blocked", "", "Missing assets for ${model.id}: ${missing.joinToString()}. See devices/android/README.md."
        )
        if (model.inputKind == InputKind.WAV) {
            val wav = input.wav ?: return PocResult("blocked", "", "Select a 16 kHz mono PCM16 WAV file.")
            val wavError = validateWav(wav)
            if (wavError != null) return PocResult("blocked", "", wavError)
        }
        return try {
            when (model.inputKind) {
                InputKind.TEXT -> runText(context, model, input.prompt)
                InputKind.WAV -> runSpeech(context, model, input.wav!!)
                InputKind.IMAGE_TEXT -> PocResult("blocked", "", "No released full Android Qwen3-VL runner is wired.")
            }
        } catch (error: ClassNotFoundException) {
            PocResult("blocked", "", "Native ${model.nativeBinding} binding is absent from the ExecuTorch AAR. Install a matching custom AAR.")
        } catch (error: UnsatisfiedLinkError) {
            PocResult("blocked", "", "Native ExecuTorch library could not load: ${error.message}")
        } catch (error: InvocationTargetException) {
            PocResult("fail", "", "Native runner failed: ${error.targetException.message ?: error.targetException.javaClass.simpleName}")
        } catch (error: Exception) {
            PocResult("fail", "", "Inference failed: ${error.message ?: error.javaClass.simpleName}")
        }
    }

    private fun runText(context: Context, model: ModelSpec, prompt: String): PocResult {
        if (prompt.isBlank()) return PocResult("blocked", "", "Enter a prompt for the Qwen3 text POC.")
        val modelPath = copyAsset(context, model, "model.pte")
        val tokenizerPath = copyAsset(context, model, "tokenizer.json")
        val module = LlmModule(modelPath.absolutePath, tokenizerPath.absolutePath, 0.0f)
        check(module.load() == 0) { "ExecuTorch could not load ${model.id}" }
        val output = StringBuilder()
        var failure: String? = null
        val config = LlmGenerationConfig.create().seqLen(128).temperature(0.0f).echo(false).build()
        val formatted = "<|im_start|>user\n$prompt<|im_end|>\n<|im_start|>assistant\n"
        module.generate(formatted, config, object : LlmCallback {
            override fun onResult(token: String) { output.append(token) }
            override fun onStats(statsJson: String) = Unit
            override fun onError(errorCode: Int, message: String) { failure = "$errorCode: $message" }
        })
        if (failure != null) return PocResult("fail", "", "Generation error $failure")
        if (output.isBlank()) return PocResult("fail", "", "The native model returned empty text.")
        return PocResult("pass", output.toString())
    }

    private fun runSpeech(context: Context, model: ModelSpec, wav: File): PocResult {
        val modelPath = copyAsset(context, model, "model.pte").absolutePath
        val tokenizerName = if (model.id.startsWith("nvidia/")) "tokenizer.model" else "tokenizer.json"
        val tokenizerPath = copyAsset(context, model, tokenizerName).absolutePath
        val output = when (model.id) {
            "nvidia/parakeet-tdt-0.6b-v3" -> {
                val clazz = Class.forName(model.nativeBinding!!)
                val module = clazz.getConstructor(String::class.java, String::class.java, String::class.java)
                    .newInstance(modelPath, tokenizerPath, null)
                try {
                    clazz.getMethod("transcribe", String::class.java).invoke(module, wav.absolutePath) as String
                } finally {
                    clazz.getMethod("close").invoke(module)
                }
            }
            "openai/whisper-large-v3-turbo" -> {
                val processorPath = copyAsset(context, model, "whisper_preprocessor.pte").absolutePath
                val clazz = Class.forName(model.nativeBinding!!)
                val callbackType = Class.forName("org.pytorch.executorch.extension.asr.AsrCallback")
                val pieces = StringBuilder()
                val callback = Proxy.newProxyInstance(callbackType.classLoader, arrayOf(callbackType)) { _, method, args ->
                    if (method.name == "onToken") pieces.append(args?.firstOrNull() as? String ?: "")
                    null
                }
                val module = clazz.getConstructor(
                    String::class.java, String::class.java, String::class.java, String::class.java
                ).newInstance(modelPath, tokenizerPath, null, processorPath)
                clazz.getMethod("transcribe", String::class.java, callbackType).invoke(module, wav.absolutePath, callback)
                pieces.toString()
            }
            else -> return PocResult("blocked", "", "No speech adapter is registered for ${model.id}.")
        }
        if (output.isBlank()) return PocResult("fail", "", "Native ASR returned no text.")
        // Preserve raw tokens: the upstream demo's fixed substring trimming is unsafe
        // across tokenizer versions. A device validation must review the output.
        return PocResult("pass", output)
    }

    private fun assetExists(context: Context, model: ModelSpec, name: String): Boolean = try {
        context.assets.open("models/${model.assetDirectory}/$name").close()
        true
    } catch (_: Exception) { false }

    private fun copyAsset(context: Context, model: ModelSpec, name: String): File {
        val target = File(context.filesDir, "models/${model.assetDirectory}/$name")
        if (target.length() > 0) return target
        target.parentFile?.mkdirs()
        context.assets.open("models/${model.assetDirectory}/$name").use { input ->
            FileOutputStream(target).use { output -> input.copyTo(output) }
        }
        return target
    }
}

/** Reject incompatible audio before entering a native ASR runner. */
internal fun validateWav(file: File): String? {
    if (!file.isFile || file.length() < 44) return "WAV file is missing or too short."
    RandomAccessFile(file, "r").use { wav ->
        val header = ByteArray(44)
        wav.readFully(header)
        fun little16(at: Int) = (header[at].toInt() and 255) or ((header[at + 1].toInt() and 255) shl 8)
        fun little32(at: Int) = (0..3).fold(0L) { value, offset -> value or ((header[at + offset].toLong() and 255) shl (8 * offset)) }
        if (String(header, 0, 4) != "RIFF" || String(header, 8, 4) != "WAVE" || String(header, 12, 4) != "fmt ")
            return "Expected RIFF/WAVE with a leading fmt chunk."
        if (little16(20) != 1 || little16(22) != 1 || little32(24) != 16000L || little16(34) != 16)
            return "Expected 16 kHz mono PCM16 WAV audio."
    }
    return null
}
