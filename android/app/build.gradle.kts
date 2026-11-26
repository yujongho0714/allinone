plugins {
    id("com.android.application")
}

android {
    namespace = "kr.jungdo.allinone"
    compileSdk = 34

    defaultConfig {
        applicationId = "kr.jungdo.allinone"
        minSdk = 26
        targetSdk = 34
        // 깃허브 빌드 번호(= Releases 의 vN) 를 버전 번호로 → 새 버전인지 비교
        versionCode = (System.getenv("GITHUB_RUN_NUMBER") ?: "1").toInt()
        versionName = "1." + (System.getenv("GITHUB_RUN_NUMBER") ?: "0")
    }

    // 매번 같은 서명 → 새 버전이 기존 앱 위에 바로 업데이트
    signingConfigs {
        getByName("debug") {
            storeFile = file("jungdo-debug.keystore")
            storePassword = "android"
            keyAlias = "androiddebugkey"
            keyPassword = "android"
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

dependencies {
    implementation("androidx.core:core:1.12.0")
    implementation("androidx.browser:browser:1.8.0")
    implementation(platform("org.jetbrains.kotlin:kotlin-bom:1.8.22"))
}
