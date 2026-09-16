# Android ExecuTorch POC

The Kotlin harness documents the ExecuTorch boundary and is fail-closed. An Android target must supply a same-repository, immutable-revision candidate, exact device manifest, and the same canonical fixture before model loading. With no Android SDK/ADB/Kotlin toolchain on the current host, no device run is claimed and no benchmark values are emitted.
