class AppConfig {
  /// URL de base de l'API.
  ///
  /// Par défaut → production (https://backend.saemenus.com/api).
  /// Override pour le dev local :
  ///   flutter run --dart-define=BASE_URL=http://192.168.x.x:3333/api
  static const String baseUrl = String.fromEnvironment(
    'BASE_URL',
    defaultValue: 'https://backend.saemenus.com/api',
  );

  static const Duration connectTimeout = Duration(seconds: 15);
  static const Duration receiveTimeout = Duration(seconds: 30);
}
