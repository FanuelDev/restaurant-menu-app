import java.util.Properties
import java.io.FileInputStream

plugins {
    id("com.android.application")
    id("kotlin-android")
    id("dev.flutter.flutter-gradle-plugin")
}

// Charge key.properties si présent (dev local), sinon utilise les variables d'env (CI/CD)
val keyPropertiesFile = rootProject.file("key.properties")
val keyProperties = Properties()
if (keyPropertiesFile.exists()) {
    keyProperties.load(FileInputStream(keyPropertiesFile))
}

fun signingProp(key: String): String? =
    if (keyPropertiesFile.exists()) keyProperties[key] as String?
    else System.getenv("ANDROID_$key".uppercase())

android {
    namespace = "com.saemenus.saemenus_client"
    compileSdk = 36
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }

    kotlinOptions {
        jvmTarget = JavaVersion.VERSION_11.toString()
    }

    signingConfigs {
        create("release") {
            val alias    = signingProp("keyAlias")
            val keyPass  = signingProp("keyPassword")
            val store    = signingProp("storeFile")
            val storePass = signingProp("storePassword")
            if (alias != null && keyPass != null && store != null && storePass != null) {
                keyAlias = alias
                keyPassword = keyPass
                storeFile = file(store)
                storePassword = storePass
            }
        }
    }

    defaultConfig {
        applicationId = "com.saemenus.saemenus_client"
        minSdk = flutter.minSdkVersion
        targetSdk = 36
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    buildTypes {
        release {
            val hasSigningConfig = signingProp("keyAlias") != null
            signingConfig = if (hasSigningConfig)
                signingConfigs.getByName("release")
            else
                signingConfigs.getByName("debug")
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
        debug {
            isMinifyEnabled = false
        }
    }
}

flutter {
    source = "../.."
}
