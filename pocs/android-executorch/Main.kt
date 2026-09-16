// The Android app target will provide the ExecuTorch adapter and device APIs.
// This portable harness only admits a run when the caller supplies the exact
// candidate revision and manifest; it never fabricates benchmark measurements.
fun main(args: Array<String>) {
    println("{\"schemaVersion\":\"0.2.0\",\"platform\":\"android\",\"runtime\":\"executorch\",\"status\":\"blocked\",\"reason\":\"No verified ExecuTorch candidate and physical Android manifest were supplied; no model load or network request was attempted.\",\"networkAllowed\":false}")
}
