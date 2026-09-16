// The Android app target will provide the ExecuTorch adapter and device APIs.
// This portable harness only admits a run when the caller supplies the exact
// candidate revision and manifest; it never fabricates benchmark measurements.
fun main(args: Array<String>) {
    fun argument(name: String): String? = args.indexOf(name).takeIf { it >= 0 && it + 1 < args.size }?.let { args[it + 1] }
    fun json(value: String?): String = value?.replace("\\", "\\\\")?.replace("\"", "\\\"")?.let { "\"$it\"" } ?: "null"
    val modelId = argument("--model-id")
    val revision = argument("--revision")
    val manifest = argument("--device-manifest")
    val fixture = argument("--fixture")
    println("{\"schemaVersion\":\"0.2.0\",\"platform\":\"android\",\"runtime\":\"executorch\",\"status\":\"blocked\",\"modelId\":${json(modelId)},\"modelRevision\":${json(revision)},\"deviceManifest\":${json(manifest)},\"fixture\":${json(fixture)},\"reason\":\"No physical Android run was attempted; the adapter remains fail-closed until the verified candidate, manifest, and fixture are available.\",\"networkAllowed\":false}")
}
