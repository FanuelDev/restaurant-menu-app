// lib/core/api/api_client.dart
import 'package:dio/dio.dart';
import '../models/models.dart';

// Changez cette URL selon votre environnement
const String _baseUrl = 'https://api.saemenus.com'; // production
// const String _baseUrl = 'http://10.0.2.2:3333'; // Android emulator
// const String _baseUrl = 'http://localhost:3333'; // iOS simulator

class ApiClient {
  final Dio _dio;
  String? _tenantSlug;

  ApiClient()
      : _dio = Dio(BaseOptions(
          baseUrl: _baseUrl,
          connectTimeout: const Duration(seconds: 10),
          receiveTimeout: const Duration(seconds: 15),
          headers: {'Content-Type': 'application/json'},
        )) {
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) {
        if (_tenantSlug != null) {
          options.headers['X-Tenant-Slug'] = _tenantSlug!;
        }
        return handler.next(options);
      },
      onError: (error, handler) {
        return handler.next(error);
      },
    ));
  }

  void setTenant(String slug) => _tenantSlug = slug;
  void clearTenant() => _tenantSlug = null;

  // ── Restaurant public ─────────────────────────────────────────────────────

  Future<Restaurant> getRestaurant() async {
    final res = await _dio.get('/api/public/restaurant');
    return Restaurant.fromJson(res.data as Map<String, dynamic>);
  }

  Future<RestaurantFeatures> getFeatures() async {
    final res = await _dio.get('/api/public/features');
    return RestaurantFeatures.fromJson(res.data as Map<String, dynamic>);
  }

  // ── Menu ─────────────────────────────────────────────────────────────────

  Future<List<Category>> getCategories() async {
    final res = await _dio.get('/api/public/categories');
    final list = res.data as List<dynamic>;
    return list.map((e) => Category.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<List<MenuItem>> getMenuItems() async {
    final res = await _dio.get('/api/public/menu-items');
    final list = res.data as List<dynamic>;
    return list.map((e) => MenuItem.fromJson(e as Map<String, dynamic>)).toList();
  }

  // Returns categories with their items merged
  Future<List<Category>> getCategoriesWithItems() async {
    final results = await Future.wait([getCategories(), getMenuItems()]);
    final cats = results[0] as List<Category>;
    final items = results[1] as List<MenuItem>;
    return cats.map((cat) {
      final catItems = items.where((i) => i.categoryId == cat.id && i.isAvailable).toList()
        ..sort((a, b) => a.sortOrder.compareTo(b.sortOrder));
      return Category(
        id: cat.id,
        name: cat.name,
        description: cat.description,
        sortOrder: cat.sortOrder,
        menuItems: catItems,
      );
    }).where((c) => c.menuItems.isNotEmpty).toList()
      ..sort((a, b) => a.sortOrder.compareTo(b.sortOrder));
  }

  // ── Orders ────────────────────────────────────────────────────────────────

  /// [payload] keys expected by the backend:
  ///   customer_name, customer_phone, customer_email?, notes?, table_number?, items[]
  Future<PlacedOrder> placeOrder(Map<String, dynamic> payload) async {
    final res = await _dio.post('/api/public/orders', data: payload);
    return PlacedOrder.fromJson(res.data as Map<String, dynamic>);
  }

  // ── Reservations ─────────────────────────────────────────────────────────

  /// [payload] keys expected by the backend:
  ///   customer_name, customer_phone, customer_email?, date_time, guests, notes?
  Future<void> placeReservation(Map<String, dynamic> payload) async {
    await _dio.post('/api/public/reservations', data: payload);
  }
}
