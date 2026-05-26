import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../models/order_models.dart';

// Orders list provider with filters
final ordersFilterProvider =
    StateProvider<Map<String, dynamic>>((ref) => {
          'page': 1,
          'perPage': 20,
          'status': '',
          'search': '',
        });

final ordersProvider =
    FutureProvider.autoDispose<PaginatedOrders>((ref) async {
  final api = ref.watch(apiClientProvider);
  final filters = ref.watch(ordersFilterProvider);

  final queryParams = <String, dynamic>{
    'page': filters['page'],
    'perPage': filters['perPage'],
  };
  if ((filters['status'] as String).isNotEmpty) {
    queryParams['status'] = filters['status'];
  }
  if ((filters['search'] as String).isNotEmpty) {
    queryParams['search'] = filters['search'];
  }

  final response =
      await api.get(ApiEndpoints.orders, queryParameters: queryParams);
  return PaginatedOrders.fromJson(response.data as Map<String, dynamic>);
});

// Single order detail
final orderDetailProvider =
    FutureProvider.autoDispose.family<Order, int>((ref, id) async {
  final api = ref.watch(apiClientProvider);
  final response = await api.get('${ApiEndpoints.orders}/$id');
  return Order.fromJson(response.data as Map<String, dynamic>);
});

// Recent orders for dashboard
final recentOrdersProvider =
    FutureProvider.autoDispose<List<Order>>((ref) async {
  final api = ref.watch(apiClientProvider);
  final response = await api.get(
    ApiEndpoints.orders,
    queryParameters: {'page': 1, 'perPage': 5},
  );
  final paginated =
      PaginatedOrders.fromJson(response.data as Map<String, dynamic>);
  return paginated.data;
});

// Today's orders count
final todayOrdersCountProvider =
    FutureProvider.autoDispose<int>((ref) async {
  final api = ref.watch(apiClientProvider);
  final response = await api.get(
    ApiEndpoints.orders,
    queryParameters: {
      'page': 1,
      'perPage': 1,
    },
  );
  final paginated =
      PaginatedOrders.fromJson(response.data as Map<String, dynamic>);
  return paginated.total;
});

// Pending orders count
final pendingOrdersCountProvider =
    FutureProvider.autoDispose<int>((ref) async {
  final api = ref.watch(apiClientProvider);
  final response = await api.get(
    ApiEndpoints.orders,
    queryParameters: {'page': 1, 'perPage': 1, 'status': 'pending'},
  );
  final paginated =
      PaginatedOrders.fromJson(response.data as Map<String, dynamic>);
  return paginated.total;
});

// Categories for order creation
final categoriesProvider =
    FutureProvider.autoDispose<List<MenuCategory>>((ref) async {
  final api = ref.watch(apiClientProvider);
  final response = await api.get(ApiEndpoints.categories);
  final data = response.data;
  List<dynamic> list;
  if (data is List) {
    list = data;
  } else if (data is Map && data['data'] is List) {
    list = data['data'] as List;
  } else {
    list = [];
  }
  return list
      .map((e) => MenuCategory.fromJson(e as Map<String, dynamic>))
      .where((cat) => cat.items.isNotEmpty)
      .toList();
});

// Order status update notifier
class OrderStatusNotifier extends StateNotifier<AsyncValue<void>> {
  OrderStatusNotifier(this._api) : super(const AsyncValue.data(null));

  final ApiClient _api;

  Future<void> updateStatus(int orderId, String status) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      await _api.patch(
        ApiEndpoints.orderStatus(orderId),
        data: {'status': status},
      );
    });
  }
}

final orderStatusNotifierProvider =
    StateNotifierProvider.autoDispose<OrderStatusNotifier, AsyncValue<void>>(
  (ref) => OrderStatusNotifier(ref.watch(apiClientProvider)),
);

// Create order notifier
class CreateOrderNotifier extends StateNotifier<AsyncValue<Order?>> {
  CreateOrderNotifier(this._api) : super(const AsyncValue.data(null));

  final ApiClient _api;

  Future<Order?> createOrder({
    required String customerName,
    String? customerPhone,
    String? customerEmail,
    String? notes,
    required String status,
    required List<Map<String, dynamic>> items,
  }) async {
    state = const AsyncValue.loading();
    Order? created;
    state = await AsyncValue.guard(() async {
      final response = await _api.post(
        ApiEndpoints.orders,
        data: {
          'customerName': customerName,
          if (customerPhone != null && customerPhone.isNotEmpty)
            'customerPhone': customerPhone,
          if (customerEmail != null && customerEmail.isNotEmpty)
            'customerEmail': customerEmail,
          if (notes != null && notes.isNotEmpty) 'notes': notes,
          'status': status,
          'items': items,
        },
      );
      created = Order.fromJson(response.data as Map<String, dynamic>);
      return created;
    });
    return created;
  }
}

final createOrderNotifierProvider =
    StateNotifierProvider.autoDispose<CreateOrderNotifier, AsyncValue<Order?>>(
  (ref) => CreateOrderNotifier(ref.watch(apiClientProvider)),
);

// Gift order scan
final giftOrderProvider =
    FutureProvider.autoDispose.family<Order, String>((ref, token) async {
  final api = ref.watch(apiClientProvider);
  final response = await api.get(ApiEndpoints.orderScan(token));
  return Order.fromJson(response.data as Map<String, dynamic>);
});
