# Android ExecuTorch POC

The Kotlin harness documents the ExecuTorch boundary and is fail-closed. It is parameterized for each verified inventory candidate through the model ID, immutable revision, device manifest, and shared fixture inputs. An Android target must supply a same-repository, immutable-revision candidate, exact device manifest, and the same canonical fixture before model loading. With no Android SDK/ADB/Gradle/Java/Kotlin toolchain or Android device on the current host, no device run is claimed and no benchmark values are emitted.

Current research status: the three verified candidates are represented in `evidence/runs/research-poc-status.json`, but Android execution is blocked until the toolchain, a physical device, an ExecuTorch export, and a captured manifest are available.
