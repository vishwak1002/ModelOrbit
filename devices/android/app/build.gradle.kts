plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "dev.modelorbit.executorch"
    compileSdk = 35

    defaultConfig {
        applicationId = "dev.modelorbit.executorch"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "0.1.0"
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    packaging {
        resources.excludes += "/META-INF/{AL2.0,LGPL2.1}"
    }
}

dependencies {
    // Custom ASR bindings are supplied by an ExecuTorch AAR built from the
    // same source revision as the exported .pte files. The Maven AAR keeps
    // the text POC buildable when the optional ASR AAR is absent.
    val customAar = providers.gradleProperty("executorchAar").orNull
    if (customAar != null) {
        implementation(files(customAar))
        implementation("com.facebook.fbjni:fbjni:0.7.0")
        implementation("com.facebook.soloader:nativeloader:0.10.5")
        implementation("androidx.core:core-ktx:1.13.1")
    } else {
        implementation("org.pytorch:executorch-android:1.4.1")
    }
}
