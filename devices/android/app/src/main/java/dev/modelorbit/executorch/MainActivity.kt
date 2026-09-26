package dev.modelorbit.executorch

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.view.ViewGroup
import android.widget.ArrayAdapter
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.Spinner
import android.widget.TextView
import java.io.File
import java.util.concurrent.Executors

/** Small offline host for the model-specific adapters in NativeAdapters.kt. */
class MainActivity : Activity() {
    private val worker = Executors.newSingleThreadExecutor()
    private val nativeAdapter: ModelAdapter = DeviceAdapter()
    private val fixtureAdapter: ModelAdapter = FixtureAdapter()
    private lateinit var modelSpinner: Spinner
    private lateinit var promptInput: EditText
    private lateinit var fileLabel: TextView
    private lateinit var resultLabel: TextView
    private lateinit var runButton: Button
    private var selectedWav: File? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val models = ModelCatalog.selected + ModelCatalog.blockedVision
        modelSpinner = Spinner(this).apply {
            adapter = ArrayAdapter(this@MainActivity, android.R.layout.simple_spinner_dropdown_item, models)
        }
        promptInput = EditText(this).apply { hint = "Text model prompt" }
        fileLabel = TextView(this).apply { text = "No WAV selected (16 kHz mono PCM16 required)" }
        resultLabel = TextView(this).apply { text = "Select a model. Fixture runs need no weights." }
        runButton = Button(this).apply { text = "Run on device"; setOnClickListener { run(false) } }
        val pickButton = Button(this).apply {
            text = "Choose WAV"
            setOnClickListener {
                startActivityForResult(Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
                    type = "audio/*"
                    addCategory(Intent.CATEGORY_OPENABLE)
                }, PICK_WAV)
            }
        }
        val fixtureButton = Button(this).apply { text = "Run fixture"; setOnClickListener { run(true) } }
        val content = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(32, 32, 32, 32)
            addView(TextView(this@MainActivity).apply { text = "ModelOrbit · Android on-device POCs"; textSize = 22f })
            addView(TextView(this@MainActivity).apply {
                text = "Offline ExecuTorch. Pass means native output was returned; inspect output and validate on a physical device."
            })
            addView(modelSpinner, this@MainActivity.fullWidth())
            addView(promptInput, this@MainActivity.fullWidth())
            addView(pickButton, this@MainActivity.fullWidth())
            addView(fileLabel, this@MainActivity.fullWidth())
            addView(runButton, this@MainActivity.fullWidth())
            addView(fixtureButton, this@MainActivity.fullWidth())
            addView(resultLabel, this@MainActivity.fullWidth())
        }
        setContentView(ScrollView(this).apply { addView(content) })
    }

    @Deprecated("Uses the platform document picker without an AndroidX dependency")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode != PICK_WAV || resultCode != RESULT_OK || data?.data == null) return
        val destination = File(filesDir, "inputs/selected.wav")
        destination.parentFile?.mkdirs()
        try {
            contentResolver.openInputStream(data.data!!)?.use { input ->
                destination.outputStream().use { output -> input.copyTo(output) }
            } ?: error("Document could not be opened")
            selectedWav = destination
            fileLabel.text = "Selected: ${destination.length()} bytes · ${validateWav(destination) ?: "WAV format valid"}"
        } catch (error: Exception) {
            selectedWav = null
            fileLabel.text = "WAV import failed: ${error.message}"
        }
    }

    private fun run(fixture: Boolean) {
        val model = modelSpinner.selectedItem as ModelSpec
        val input = PocInput(promptInput.text.toString(), selectedWav)
        runButton.isEnabled = false
        resultLabel.text = "${if (fixture) "Fixture" else "Native"} run: ${model.id}@${model.revision.take(12)}..."
        worker.execute {
            val result = (if (fixture) fixtureAdapter else nativeAdapter).run(this, model, input)
            runOnUiThread {
                resultLabel.text = "${result.status.uppercase()} · ${model.id}@${model.revision}\n${result.reason ?: ""}\n${result.text}"
                runButton.isEnabled = true
            }
        }
    }

    override fun onDestroy() {
        worker.shutdownNow()
        super.onDestroy()
    }

    companion object { private const val PICK_WAV = 41 }
}

private fun Activity.fullWidth(): ViewGroup.LayoutParams = ViewGroup.LayoutParams(
    ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT
)
