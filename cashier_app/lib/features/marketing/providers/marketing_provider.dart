import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../models/marketing_models.dart';

// ─── Stats ────────────────────────────────────────────────────────────────────

final marketingStatsProvider =
    FutureProvider.autoDispose<MarketingStats>((ref) async {
  final api = ref.watch(apiClientProvider);
  final response = await api.get(ApiEndpoints.marketingStats);
  return MarketingStats.fromJson(response.data as Map<String, dynamic>);
});

// ─── Vouchers list ────────────────────────────────────────────────────────────

final marketingVouchersProvider =
    FutureProvider.autoDispose<PaginatedVouchers>((ref) async {
  final api = ref.watch(apiClientProvider);
  final response = await api.get(
    ApiEndpoints.marketingVouchers,
    queryParameters: {'page': 1, 'perPage': 50},
  );
  return PaginatedVouchers.fromJson(response.data as Map<String, dynamic>);
});

// ─── Scan voucher ─────────────────────────────────────────────────────────────

final scannedVoucherProvider = FutureProvider.autoDispose
    .family<MarketingVoucher, String>((ref, token) async {
  final api = ref.watch(apiClientProvider);
  final response = await api.get(ApiEndpoints.marketingVoucherScan(token));
  return MarketingVoucher.fromJson(response.data as Map<String, dynamic>);
});

// ─── Redeem voucher ───────────────────────────────────────────────────────────

class RedeemVoucherNotifier
    extends StateNotifier<AsyncValue<Map<String, dynamic>?>> {
  RedeemVoucherNotifier(this._api) : super(const AsyncValue.data(null));

  final ApiClient _api;

  Future<Map<String, dynamic>?> redeem({
    required int voucherId,
    required String customerName,
    required double orderTotal,
    int? orderId,
  }) async {
    state = const AsyncValue.loading();
    Map<String, dynamic>? result;
    state = await AsyncValue.guard(() async {
      final response = await _api.post(
        ApiEndpoints.marketingVoucherRedeem(voucherId),
        data: {
          'customer_name': customerName,
          'order_total': orderTotal,
          if (orderId != null) 'order_id': orderId,
        },
      );
      result = response.data as Map<String, dynamic>?;
      return result;
    });
    return result;
  }
}

final redeemVoucherProvider = StateNotifierProvider.autoDispose<
    RedeemVoucherNotifier, AsyncValue<Map<String, dynamic>?>>(
  (ref) => RedeemVoucherNotifier(ref.watch(apiClientProvider)),
);

// ─── Create order + redeem voucher (combined, for VoucherOrderScreen) ─────────

class VoucherOrderNotifier
    extends StateNotifier<AsyncValue<Map<String, dynamic>?>> {
  VoucherOrderNotifier(this._api) : super(const AsyncValue.data(null));

  final ApiClient _api;

  Future<Map<String, dynamic>?> submit({
    required int voucherId,
    required String customerName,
    required double orderTotal,
    required List<Map<String, dynamic>> items,
  }) async {
    state = const AsyncValue.loading();
    Map<String, dynamic>? result;
    state = await AsyncValue.guard(() async {
      // 1. Create the order
      final orderRes = await _api.post(
        ApiEndpoints.orders,
        data: {
          'customerName': customerName,
          'status': 'completed',
          'items': items,
        },
      );
      final orderId =
          (orderRes.data as Map<String, dynamic>)['id'] as int;

      // 2. Redeem the voucher, linking it to the order
      final redeemRes = await _api.post(
        ApiEndpoints.marketingVoucherRedeem(voucherId),
        data: {
          'customer_name': customerName,
          'order_total': orderTotal,
          'order_id': orderId,
        },
      );
      result = redeemRes.data as Map<String, dynamic>?;
      return result;
    });
    return result;
  }
}

final voucherOrderNotifierProvider = StateNotifierProvider.autoDispose<
    VoucherOrderNotifier, AsyncValue<Map<String, dynamic>?>>(
  (ref) => VoucherOrderNotifier(ref.watch(apiClientProvider)),
);
