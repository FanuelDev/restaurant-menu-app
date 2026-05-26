import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/theme/app_colors.dart';
import '../../features/orders/models/order_models.dart';
import '../../features/reservations/models/reservation_models.dart';

class OrderStatusBadge extends StatelessWidget {
  final OrderStatus status;
  final bool compact;

  const OrderStatusBadge({
    super.key,
    required this.status,
    this.compact = false,
  });

  @override
  Widget build(BuildContext context) {
    return _StatusPill(
      label: status.label,
      color: AppColors.statusColor(status.value),
      compact: compact,
    );
  }
}

class ReservationStatusBadge extends StatelessWidget {
  final ReservationStatus status;
  final bool compact;

  const ReservationStatusBadge({
    super.key,
    required this.status,
    this.compact = false,
  });

  @override
  Widget build(BuildContext context) {
    return _StatusPill(
      label: status.label,
      color: AppColors.reservationStatusColor(status.value),
      compact: compact,
    );
  }
}

class _StatusPill extends StatelessWidget {
  final String label;
  final Color color;
  final bool compact;

  const _StatusPill({
    required this.label,
    required this.color,
    required this.compact,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: compact ? 10 : 12,
        vertical: compact ? 4 : 6,
      ),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withValues(alpha: 0.4)),
      ),
      child: Text(
        label,
        style: GoogleFonts.poppins(
          fontSize: compact ? 11 : 12,
          fontWeight: FontWeight.w600,
          color: color,
        ),
      ),
    );
  }
}
