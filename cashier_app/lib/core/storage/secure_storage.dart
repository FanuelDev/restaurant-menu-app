import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

const _tokenKey = 'auth_token';
const _slugKey = 'tenant_slug';
const _userIdKey = 'user_id';
const _userEmailKey = 'user_email';
const _userNameKey = 'user_name';
const _userRoleKey = 'user_role';
const _restaurantIdKey = 'restaurant_id';
const _restaurantNameKey = 'restaurant_name';

class SecureStorageService {
  final FlutterSecureStorage _storage;

  SecureStorageService()
      : _storage = const FlutterSecureStorage(
          aOptions: AndroidOptions(encryptedSharedPreferences: true),
        );

  Future<void> saveToken(String token) =>
      _storage.write(key: _tokenKey, value: token);

  Future<String?> getToken() => _storage.read(key: _tokenKey);

  Future<void> saveSlug(String slug) =>
      _storage.write(key: _slugKey, value: slug);

  Future<String?> getSlug() => _storage.read(key: _slugKey);

  Future<void> saveUserInfo({
    required int id,
    required String email,
    required String fullName,
    required String role,
    required int restaurantId,
    required String restaurantName,
  }) async {
    await _storage.write(key: _userIdKey, value: id.toString());
    await _storage.write(key: _userEmailKey, value: email);
    await _storage.write(key: _userNameKey, value: fullName);
    await _storage.write(key: _userRoleKey, value: role);
    await _storage.write(
        key: _restaurantIdKey, value: restaurantId.toString());
    await _storage.write(key: _restaurantNameKey, value: restaurantName);
  }

  Future<Map<String, String?>> getUserInfo() async {
    return {
      'id': await _storage.read(key: _userIdKey),
      'email': await _storage.read(key: _userEmailKey),
      'fullName': await _storage.read(key: _userNameKey),
      'role': await _storage.read(key: _userRoleKey),
      'restaurantId': await _storage.read(key: _restaurantIdKey),
      'restaurantName': await _storage.read(key: _restaurantNameKey),
    };
  }

  Future<void> clearAll() => _storage.deleteAll();
}

final secureStorageProvider = Provider<SecureStorageService>((ref) {
  return SecureStorageService();
});
