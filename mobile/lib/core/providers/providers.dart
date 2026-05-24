// lib/core/providers/providers.dart
import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../api/api_client.dart';
import '../models/models.dart';

// ─── Cache helpers ────────────────────────────────────────────────────────────

const _cacheVersion = 'v2'; // bump to invalidate old caches

String _cacheKey(String slug) => 'menu_cache_${_cacheVersion}_$slug';

class _CachedMenu {
  final Restaurant restaurant;
  final RestaurantFeatures features;
  final List<Category> categories;
  final DateTime savedAt;
  _CachedMenu({required this.restaurant, required this.features,
    required this.categories, required this.savedAt});
}

Future<void> _saveMenuCache(SharedPreferences prefs, String slug,
    Restaurant restaurant, RestaurantFeatures features, List<Category> categories) async {
  try {
    final payload = jsonEncode({
      'restaurant': restaurant.toJson(),
      'features': features.toJson(),
      'categories': categories.map((c) => c.toJson()).toList(),
      'savedAt': DateTime.now().toIso8601String(),
    });
    await prefs.setString(_cacheKey(slug), payload);
  } catch (_) {}
}

_CachedMenu? _loadMenuCache(SharedPreferences prefs, String slug) {
  try {
    final raw = prefs.getString(_cacheKey(slug));
    if (raw == null) return null;
    final j = jsonDecode(raw) as Map<String, dynamic>;
    return _CachedMenu(
      restaurant: Restaurant.fromJson(j['restaurant'] as Map<String, dynamic>),
      features: RestaurantFeatures.fromJson(j['features'] as Map<String, dynamic>),
      categories: (j['categories'] as List<dynamic>)
          .map((e) => Category.fromJson(e as Map<String, dynamic>))
          .toList(),
      savedAt: DateTime.parse(j['savedAt'] as String),
    );
  } catch (_) {
    return null;
  }
}

// ─── API Client singleton ─────────────────────────────────────────────────────

final apiClientProvider = Provider<ApiClient>((ref) => ApiClient());

// ─── Tenant (slug du restaurant scann�) ──────────────────────────────────────

final currentSlugProvider = StateProvider<String?>((ref) => null);

// ─── Restaurant data ──────────────────────────────────────────────────────────

class RestaurantState {
  final Restaurant? restaurant;
  final RestaurantFeatures? features;
  final List<Category> categories;
  final bool loading;
  final String? error;
  /// true quand les données viennent du cache local (hors ligne)
  final bool isOffline;
  /// horodatage de la dernière sauvegarde en cache
  final DateTime? cachedAt;

  const RestaurantState({
    this.restaurant,
    this.features,
    this.categories = const [],
    this.loading = false,
    this.error,
    this.isOffline = false,
    this.cachedAt,
  });

  RestaurantState copyWith({
    Restaurant? restaurant,
    RestaurantFeatures? features,
    List<Category>? categories,
    bool? loading,
    String? error,
    bool? isOffline,
    DateTime? cachedAt,
  }) =>
      RestaurantState(
        restaurant: restaurant ?? this.restaurant,
        features: features ?? this.features,
        categories: categories ?? this.categories,
        loading: loading ?? this.loading,
        error: error,
        isOffline: isOffline ?? this.isOffline,
        cachedAt: cachedAt ?? this.cachedAt,
      );
}

class RestaurantNotifier extends StateNotifier<RestaurantState> {
  final ApiClient _api;
  final SharedPreferences _prefs;

  RestaurantNotifier(this._api, this._prefs) : super(const RestaurantState());

  Future<void> load(String slug) async {
    state = state.copyWith(loading: true, error: null, isOffline: false);
    _api.setTenant(slug);
    try {
      final results = await Future.wait([
        _api.getRestaurant(),
        _api.getFeatures(),
        _api.getCategoriesWithItems(),
      ]);
      final restaurant = results[0] as Restaurant;
      final features   = results[1] as RestaurantFeatures;
      final categories = results[2] as List<Category>;

      // Sauvegarde en cache pour usage hors ligne ultérieur
      await _saveMenuCache(_prefs, slug, restaurant, features, categories);

      state = RestaurantState(
        restaurant: restaurant,
        features:   features,
        categories: categories,
        loading:    false,
      );
    } on Exception catch (e) {
      // Échec réseau → tenter le cache local
      final cached = _loadMenuCache(_prefs, slug);
      if (cached != null) {
        state = RestaurantState(
          restaurant: cached.restaurant,
          features:   cached.features,
          categories: cached.categories,
          loading:    false,
          isOffline:  true,
          cachedAt:   cached.savedAt,
        );
      } else {
        state = state.copyWith(loading: false, error: e.toString());
      }
    }
  }

  void clear() {
    state = const RestaurantState();
    _api.clearTenant();
  }
}

final restaurantProvider =
    StateNotifierProvider<RestaurantNotifier, RestaurantState>((ref) {
  return RestaurantNotifier(
    ref.watch(apiClientProvider),
    ref.watch(sharedPrefsProvider),
  );
});

// ─── Cart ─────────────────────────────────────────────────────────────────────

class CartNotifier extends StateNotifier<List<CartItem>> {
  CartNotifier() : super([]);

  void add(MenuItem item) {
    final idx = state.indexWhere((c) => c.menuItem.id == item.id);
    if (idx >= 0) {
      state = [
        for (int i = 0; i < state.length; i++)
          if (i == idx) state[i].copyWith(quantity: state[i].quantity + 1) else state[i],
      ];
    } else {
      state = [...state, CartItem(menuItem: item, quantity: 1)];
    }
  }

  void remove(int itemId) {
    final idx = state.indexWhere((c) => c.menuItem.id == itemId);
    if (idx < 0) return;
    if (state[idx].quantity <= 1) {
      state = state.where((c) => c.menuItem.id != itemId).toList();
    } else {
      state = [
        for (int i = 0; i < state.length; i++)
          if (i == idx) state[i].copyWith(quantity: state[i].quantity - 1) else state[i],
      ];
    }
  }

  void updateInstructions(int itemId, String instructions) {
    state = [
      for (final c in state)
        if (c.menuItem.id == itemId) c.copyWith(specialInstructions: instructions) else c,
    ];
  }

  void clear() => state = [];

  int qty(int itemId) => state.firstWhere((c) => c.menuItem.id == itemId,
          orElse: () => CartItem(menuItem: _dummyItem, quantity: 0))
      .quantity;

  double get total => state.fold(0, (sum, c) => sum + c.subtotal);
  int get itemCount => state.fold(0, (sum, c) => sum + c.quantity);
  bool get isEmpty => state.isEmpty;

  static final _dummyItem = MenuItem(id: -1, categoryId: -1, name: '', price: 0);
}

final cartProvider = StateNotifierProvider<CartNotifier, List<CartItem>>(
    (ref) => CartNotifier());

final cartCountProvider = Provider<int>((ref) {
  return ref.watch(cartProvider).fold(0, (sum, c) => sum + c.quantity);
});

// ─── Customer profile (stored locally) ───────────────────────────────────────

class ProfileNotifier extends StateNotifier<CustomerProfile> {
  final SharedPreferences _prefs;
  static const _key = 'customer_profile';

  ProfileNotifier(this._prefs) : super(_load(_prefs));

  static CustomerProfile _load(SharedPreferences prefs) {
    final raw = prefs.getString(_key);
    if (raw == null) return const CustomerProfile();
    try {
      return CustomerProfile.fromJson(jsonDecode(raw) as Map<String, dynamic>);
    } catch (_) {
      return const CustomerProfile();
    }
  }

  Future<void> save(CustomerProfile profile) async {
    state = profile;
    await _prefs.setString(_key, jsonEncode(profile.toJson()));
  }

  Future<void> clear() async {
    state = const CustomerProfile();
    await _prefs.remove(_key);
  }
}

final sharedPrefsProvider = Provider<SharedPreferences>((ref) {
  throw UnimplementedError('Override in main');
});

final profileProvider = StateNotifierProvider<ProfileNotifier, CustomerProfile>((ref) {
  return ProfileNotifier(ref.watch(sharedPrefsProvider));
});

// ─── Recent restaurants (history) ────────────────────────────────────────────

class RecentRestaurantsNotifier extends StateNotifier<List<String>> {
  final SharedPreferences _prefs;
  static const _key = 'recent_slugs';

  RecentRestaurantsNotifier(this._prefs)
      : super((_prefs.getStringList(_key) ?? []));

  Future<void> addSlug(String slug) async {
    final list = [slug, ...state.where((s) => s != slug)].take(5).toList();
    state = list;
    await _prefs.setStringList(_key, list);
  }

  Future<void> clear() async {
    state = [];
    await _prefs.remove(_key);
  }
}

final recentRestaurantsProvider =
    StateNotifierProvider<RecentRestaurantsNotifier, List<String>>((ref) {
  return RecentRestaurantsNotifier(ref.watch(sharedPrefsProvider));
});
