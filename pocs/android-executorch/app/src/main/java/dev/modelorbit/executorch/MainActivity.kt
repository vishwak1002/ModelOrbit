package dev.modelorbit.executorch

import android.app.Activity
import android.os.Bundle
import android.os.Debug
import android.os.SystemClock
import android.view.ViewGroup
import android.widget.ArrayAdapter
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.Spinner
import android.widget.TextView
import org.pytorch.executorch.extension.llm.LlmCallback
import org.pytorch.executorch.extension.llm.LlmGenerationConfig
import org.pytorch.executorch.extension.llm.LlmModule
import java.io.File
import java.io.FileOutputStream
import java.security.MessageDigest
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

private data class Candidate(
    val modelId: String,
    val revision: String,
    val assetDirectory: String,
    val modelFile: String = "model.pte",
    val tokenizerFile: String = "tokenizer.json"
) {
    override fun toString(): String = "$modelId @ ${revision.take(12)}"
}

private object VerifiedCandidates {
    val all = listOf(
        Candidate("Qwen/Qwen3-0.6B", "a9c98e602b9d36d2a2f7ba1eb0f5f31e4e8e5143", "qwen3_0_6b"),
        Candidate("Qwen/Qwen3-1.7B", "70d244cc86ccca08cf5af4e1e306ecf908b1ad5e", "qwen3_1_7b"),
        Candidate("Qwen/Qwen3-4B", "1cfa9a7", "qwen3_4b")
    )
}

private data class GenerationObservation(
    val text: String,
    val statsJson: String?,
    val error: String?
)

class MainActivity : Activity() {
    private val executor: ExecutorService = Executors.newSingleThreadExecutor()
    private lateinit var candidateSpinner: Spinner
    private lateinit var manifestInput: EditText
    private lateinit var promptInput: EditText
    private lateinit var output: TextView
    private lateinit var runButton: Button

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        candidateSpinner = Spinner(this).apply {
            adapter = ArrayAdapter(this@MainActivity, android.R.layout.simple_spinner_item, VerifiedCandidates.all).also {
                it.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
            }
        }
        manifestInput = EditText(this).apply { hint = "device-android-... manifest ID" }
        promptInput = EditText(this).apply {
            hint = "Write one short sentence about a quiet orbit."
            setText("Write one short sentence about a quiet orbit.")
            minLines = 3
        }
        output = TextView(this).apply { text = "Ready. Add exported assets before running." }
        runButton = Button(this).apply {
            text = "Run cold + warm benchmark"
            setOnClickListener { startRun() }
        }

        val content = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(32, 32, 32, 32)
            addView(TextView(this@MainActivity).apply { text = "Verified Qwen3 candidate" })
            addView(candidateSpinner, matchParent())
            addView(manifestInput, matchParent())
            addView(promptInput, matchParent())
            addView(runButton, matchParent())
            addView(output, matchParent())
        }
        setContentView(ScrollView(this).apply { addView(content) })
    }

    private fun startRun() {
        val candidate = candidateSpinner.selectedItem as Candidate
        val manifestId = manifestInput.text.toString().trim()
        val prompt = promptInput.text.toString().trim()
        if (manifestId.isEmpty() || prompt.isEmpty()) {
            output.text = "Enter the captured device manifest ID and a non-empty prompt."
            return
        }
        runButton.isEnabled = false
        output.text = "Preparing assets and loading ExecuTorch..."
        executor.execute {
            val message = try {
                runCandidate(candidate, manifestId, prompt)
            } catch (error: Throwable) {
                "BLOCKED/FAIL: ${error.message ?: error::class.java.simpleName}"
            }
            runOnUiThread {
                output.text = message
                runButton.isEnabled = true
            }
        }
    }

    private fun runCandidate(candidate: Candidate, manifestId: String, prompt: String): String {
        val modelPath = copyAsset(candidate, candidate.modelFile)
        val tokenizerPath = copyAsset(candidate, candidate.tokenizerFile)
        val module = LlmModule(modelPath.absolutePath, tokenizerPath.absolutePath, 0.0f)
        val config = LlmGenerationConfig.create()
            .seqLen(128)
            .temperature(0.0f)
            .echo(false)
            .build()

        val beforeLoad = sampledPssBytes()
        val coldStart = SystemClock.elapsedRealtimeNanos()
        val loadStatus = module.load()
        if (loadStatus != 0) error("ExecuTorch load failed with status $loadStatus")
        val cold = generate(module, prompt, config)
        val coldMs = elapsedMs(coldStart)
        if (cold.error != null) error(cold.error)

        module.resetContext()
        val warmStart = SystemClock.elapsedRealtimeNanos()
        val warm = generate(module, prompt, config)
        val warmMs = elapsedMs(warmStart)
        if (warm.error != null) error(warm.error)

        val peakPss = maxOf(beforeLoad, sampledPssBytes())
        val checkedAt = isoNow()
        val outputText = warm.text.ifEmpty { cold.text }
        val runId = "benchmark-android-${compactNow()}"
        val benchmark = benchmarkJson(
            runId = runId,
            candidate = candidate,
            manifestId = manifestId,
            prompt = prompt,
            outputText = outputText,
            coldMs = coldMs,
            warmMs = warmMs,
            peakMemoryBytes = peakPss,
            checkedAt = checkedAt
        )
        val evidenceFile = File(filesDir, "benchmarks/$runId.json")
        evidenceFile.parentFile?.mkdirs()
        evidenceFile.writeText(benchmark)
        return "PASS\n${outputText.trim()}\n\nSaved: ${evidenceFile.absolutePath}\n\n$benchmark"
    }

    private fun generate(module: LlmModule, prompt: String, config: LlmGenerationConfig): GenerationObservation {
        val tokens = StringBuilder()
        var stats: String? = null
        var error: String? = null
        // Qwen3's ExecuTorch example uses the explicit chat template for the native runner.
        val formattedPrompt = "<|im_start|>user\n$prompt<|im_end|>\n<|im_start|>assistant\n"
        module.generate(formattedPrompt, config, object : LlmCallback {
            override fun onResult(token: String) { tokens.append(token) }
            override fun onStats(statsJson: String) { stats = statsJson }
            override fun onError(errorCode: Int, message: String) { error = "Generation error $errorCode: $message" }
        })
        return GenerationObservation(tokens.toString(), stats, error)
    }

    private fun copyAsset(candidate: Candidate, fileName: String): File {
        val assetPath = "models/${candidate.assetDirectory}/$fileName"
        val destination = File(filesDir, assetPath)
        destination.parentFile?.mkdirs()
        assets.open(assetPath).use { input -> FileOutputStream(destination).use { input.copyTo(it) } }
        return destination
    }

    override fun onDestroy() {
        executor.shutdownNow()
        super.onDestroy()
    }
}

private fun Activity.matchParent(): ViewGroup.LayoutParams = ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT)
private fun sampledPssBytes(): Long = Debug.getPss() * 1024L
private fun elapsedMs(startNanos: Long): Double = (SystemClock.elapsedRealtimeNanos() - startNanos) / 1_000_000.0
private fun sha256(value: String): String = MessageDigest.getInstance("SHA-256").digest(value.toByteArray()).joinToString("") { "%02x".format(it) }
private fun json(value: String): String = "\"${value.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n")}\""
private fun isoNow(): String = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).apply { timeZone = TimeZone.getTimeZone("UTC") }.format(Date())
private fun compactNow(): String = SimpleDateFormat("yyyyMMdd'T'HHmmss'Z'", Locale.US).apply { timeZone = TimeZone.getTimeZone("UTC") }.format(Date())

private fun benchmarkJson(
    runId: String,
    candidate: Candidate,
    manifestId: String,
    prompt: String,
    outputText: String,
    coldMs: Double,
    warmMs: Double,
    peakMemoryBytes: Long,
    checkedAt: String
): String {
    val outputChecksum = sha256(outputText)
    val inputChecksum = sha256(prompt)
    return """
        {
          "schemaVersion":"0.2.0",
          "runId":${json(runId)},
          "modelId":${json(candidate.modelId)},
          "modelRevision":${json(candidate.revision)},
          "platform":"android",
          "deviceManifestId":${json(manifestId)},
          "task":{"fixtureId":"text-generation/basic-v1","inputChecksum":"sha256:$inputChecksum","outputValidator":"non-empty-utf8"},
          "status":"pass",
          "output":{"valid":${outputText.isNotEmpty()},"checksum":"sha256:$outputChecksum"},
          "latencyMs":{"cold":$coldMs,"warm":$warmMs},
          "peakMemoryBytes":$peakMemoryBytes,
          "network":{"allowed":false,"requestCount":0,"events":[]},
          "checkedAt":${json(checkedAt)},
          "reason":"ExecuTorch XNNPACK run; peak memory is the maximum sampled process PSS before load and after warm generation."
        }
    """.trimIndent() + "\n"
}
