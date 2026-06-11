# Flutter
-keep class io.flutter.** { *; }
-keep class io.flutter.plugins.** { *; }
-dontwarn io.flutter.**

# Dio / OkHttp
-dontwarn okhttp3.**
-dontwarn okio.**
-keep class okhttp3.** { *; }
-keep class retrofit2.** { *; }

# Riverpod / Flutter state
-keep class com.saemenus.** { *; }

# Google Fonts — keep font metadata
-keep class com.google.** { *; }

# Kotlin
-keep class kotlin.** { *; }
-dontwarn kotlin.**

# JSON serialization — keep field names
-keepclassmembers class * {
    @com.google.gson.annotations.SerializedName <fields>;
}

# mobile_scanner / camera
-keep class com.google.zxing.** { *; }
-keep class com.journeyapps.** { *; }
