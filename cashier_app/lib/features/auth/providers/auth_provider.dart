import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../core/storage/secure_storage.dart';
import '../models/auth_models.dart';

final authProvider =
    AsyncNotifierProvider<AuthNotifier, AuthState?>(() => AuthNotifier());

class AuthNotifier extends AsyncNotifier<AuthState?> {
  @override
  Future<AuthState?> build() async {
    return _tryAutoLogin();
  }

  Future<AuthState?> _tryAutoLogin() async {
    final storage = ref.read(secureStorageProvider);
    final token = await storage.getToken();
    final slug = await storage.getSlug();

    if (token == null || token.isEmpty || slug == null || slug.isEmpty) {
      return null;
    }

    final userInfo = await storage.getUserInfo();
    final id = int.tryParse(userInfo['id'] ?? '');
    final restaurantId = int.tryParse(userInfo['restaurantId'] ?? '');

    if (id == null || restaurantId == null) {
      await storage.clearAll();
      return null;
    }

    final user = AuthUser(
      id: id,
      email: userInfo['email'] ?? '',
      fullName: userInfo['fullName'] ?? '',
      role: userInfo['role'] ?? '',
      restaurantId: restaurantId,
    );

    // Fetch fresh restaurant data
    try {
      final api = ref.read(apiClientProvider);
      final response = await api.get(ApiEndpoints.restaurant);
      final restaurantData = response.data as Map<String, dynamic>;
      final restaurant = Restaurant.fromJson(restaurantData);

      return AuthState(
        user: user,
        token: AuthToken(value: token),
        restaurant: restaurant,
        slug: slug,
      );
    } catch (_) {
      // Return minimal state from storage if API fails
      final restaurant = Restaurant(
        id: restaurantId,
        slug: slug,
        name: userInfo['restaurantName'] ?? '',
        subscriptionStatus: 'active',
      );

      return AuthState(
        user: user,
        token: AuthToken(value: token),
        restaurant: restaurant,
        slug: slug,
      );
    }
  }

  Future<void> login(String slug, String email, String password) async {
    state = const AsyncValue.loading();

    state = await AsyncValue.guard(() async {
      final api = ref.read(apiClientProvider);
      final storage = ref.read(secureStorageProvider);

      // First save slug so interceptor can add X-Tenant-Slug header
      await storage.saveSlug(slug);

      final response = await api.post(
        ApiEndpoints.login,
        data: {'email': email, 'password': password},
      );

      final data = response.data as Map<String, dynamic>;
      final token = AuthToken.fromJson(data['token'] as Map<String, dynamic>);
      final user = AuthUser.fromJson(data['user'] as Map<String, dynamic>);
      final restaurant =
          Restaurant.fromJson(data['restaurant'] as Map<String, dynamic>);

      // Check role
      if (user.role != 'cashier' && user.role != 'admin') {
        await storage.clearAll();
        throw Exception(
            'Accès refusé. Ce compte n\'est pas autorisé à utiliser la caisse.');
      }

      // Save credentials
      await storage.saveToken(token.value);
      await storage.saveSlug(slug);
      await storage.saveUserInfo(
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        restaurantId: user.restaurantId,
        restaurantName: restaurant.name,
      );

      return AuthState(
        user: user,
        token: token,
        restaurant: restaurant,
        slug: slug,
      );
    });
  }

  Future<void> logout() async {
    final storage = ref.read(secureStorageProvider);
    try {
      final api = ref.read(apiClientProvider);
      await api.delete(ApiEndpoints.logout);
    } catch (_) {
      // Ignore API error on logout
    }
    await storage.clearAll();
    state = const AsyncValue.data(null);
  }
}
