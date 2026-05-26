import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../orders/providers/orders_provider.dart';
import '../../reservations/providers/reservations_provider.dart';

class DashboardStats {
  final int pendingOrders;
  final int totalOrders;
  final int totalReservations;

  const DashboardStats({
    required this.pendingOrders,
    required this.totalOrders,
    required this.totalReservations,
  });
}

final dashboardStatsProvider =
    FutureProvider.autoDispose<DashboardStats>((ref) async {
  final pendingFuture = ref.watch(pendingOrdersCountProvider.future);
  final totalFuture = ref.watch(todayOrdersCountProvider.future);
  final reservationsFuture = ref.watch(todayReservationsCountProvider.future);

  final results = await Future.wait([
    pendingFuture,
    totalFuture,
    reservationsFuture,
  ]);

  return DashboardStats(
    pendingOrders: results[0],
    totalOrders: results[1],
    totalReservations: results[2],
  );
});
