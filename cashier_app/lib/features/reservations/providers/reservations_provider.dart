import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../models/reservation_models.dart';

final reservationsFilterProvider =
    StateProvider<Map<String, dynamic>>((ref) => {
          'page': 1,
          'perPage': 20,
          'status': '',
        });

final reservationsProvider =
    FutureProvider.autoDispose<PaginatedReservations>((ref) async {
  final api = ref.watch(apiClientProvider);
  final filters = ref.watch(reservationsFilterProvider);

  final queryParams = <String, dynamic>{
    'page': filters['page'],
    'perPage': filters['perPage'],
  };
  if ((filters['status'] as String).isNotEmpty) {
    queryParams['status'] = filters['status'];
  }

  final response = await api.get(ApiEndpoints.reservations,
      queryParameters: queryParams);
  return PaginatedReservations.fromJson(
      response.data as Map<String, dynamic>);
});

final reservationDetailProvider =
    FutureProvider.autoDispose.family<Reservation, int>((ref, id) async {
  final api = ref.watch(apiClientProvider);
  final response = await api.get('${ApiEndpoints.reservations}/$id');
  return Reservation.fromJson(response.data as Map<String, dynamic>);
});

// Today reservations count for dashboard
final todayReservationsCountProvider =
    FutureProvider.autoDispose<int>((ref) async {
  final api = ref.watch(apiClientProvider);
  final response = await api.get(
    ApiEndpoints.reservations,
    queryParameters: {'page': 1, 'perPage': 1},
  );
  final paginated =
      PaginatedReservations.fromJson(response.data as Map<String, dynamic>);
  return paginated.total;
});

// Reservation status update
class ReservationStatusNotifier extends StateNotifier<AsyncValue<void>> {
  ReservationStatusNotifier(this._api) : super(const AsyncValue.data(null));

  final ApiClient _api;

  Future<void> updateStatus(int reservationId, String status) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      await _api.patch(
        ApiEndpoints.reservationStatus(reservationId),
        data: {'status': status},
      );
    });
  }
}

final reservationStatusNotifierProvider = StateNotifierProvider.autoDispose<
    ReservationStatusNotifier, AsyncValue<void>>(
  (ref) => ReservationStatusNotifier(ref.watch(apiClientProvider)),
);

// Create reservation
class CreateReservationNotifier
    extends StateNotifier<AsyncValue<Reservation?>> {
  CreateReservationNotifier(this._api) : super(const AsyncValue.data(null));

  final ApiClient _api;

  Future<Reservation?> createReservation({
    required String customerName,
    String? customerPhone,
    String? customerEmail,
    required String reservedDate,
    required String reservedTime,
    required int guestsCount,
    String? specialRequests,
    String? notes,
    String status = 'pending',
  }) async {
    state = const AsyncValue.loading();
    Reservation? created;
    state = await AsyncValue.guard(() async {
      final response = await _api.post(
        ApiEndpoints.reservations,
        data: {
          'customerName': customerName,
          if (customerPhone != null && customerPhone.isNotEmpty)
            'customerPhone': customerPhone,
          if (customerEmail != null && customerEmail.isNotEmpty)
            'customerEmail': customerEmail,
          'reservedDate': reservedDate,
          'reservedTime': reservedTime,
          'guestsCount': guestsCount,
          if (specialRequests != null && specialRequests.isNotEmpty)
            'specialRequests': specialRequests,
          if (notes != null && notes.isNotEmpty) 'notes': notes,
          'status': status,
        },
      );
      created = Reservation.fromJson(response.data as Map<String, dynamic>);
      return created;
    });
    return created;
  }
}

final createReservationNotifierProvider = StateNotifierProvider.autoDispose<
    CreateReservationNotifier, AsyncValue<Reservation?>>(
  (ref) => CreateReservationNotifier(ref.watch(apiClientProvider)),
);
