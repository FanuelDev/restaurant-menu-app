import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gap/gap.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/date_utils.dart';
import '../models/reservation_models.dart';
import '../providers/reservations_provider.dart';
import '../../../shared/widgets/status_badge.dart';
import '../../../shared/widgets/loading_shimmer.dart';
import '../../../shared/widgets/error_widget.dart';
import '../../../shared/widgets/empty_state.dart';

class ReservationsScreen extends ConsumerStatefulWidget {
  const ReservationsScreen({super.key});

  @override
  ConsumerState<ReservationsScreen> createState() =>
      _ReservationsScreenState();
}

class _ReservationsScreenState extends ConsumerState<ReservationsScreen> {
  String _activeStatus = '';

  final _filters = [
    ('Toutes', ''),
    ('En attente', 'pending'),
    ('Confirmées', 'confirmed'),
    ('Annulées', 'cancelled'),
    ('Terminées', 'no_show'),
  ];

  void _applyFilter(String status) {
    setState(() => _activeStatus = status);
    ref.read(reservationsFilterProvider.notifier).state = {
      'page': 1,
      'perPage': 20,
      'status': status,
    };
    ref.invalidate(reservationsProvider);
  }

  @override
  Widget build(BuildContext context) {
    final reservationsAsync = ref.watch(reservationsProvider);
    final topPadding = MediaQuery.of(context).padding.top;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: Column(
        children: [
          // Custom header
          Container(
            color: AppColors.background,
            padding: EdgeInsets.fromLTRB(16, topPadding + 12, 16, 0),
            child: Column(
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        'Réservations',
                        style: GoogleFonts.poppins(
                          fontSize: 22,
                          fontWeight: FontWeight.w700,
                          color: AppColors.textPrimary,
                        ),
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.refresh_rounded,
                          color: AppColors.textSecondary),
                      onPressed: () =>
                          ref.invalidate(reservationsProvider),
                    ),
                    const Gap(4),
                    GestureDetector(
                      onTap: () =>
                          context.push('/reservations/create'),
                      child: Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: AppColors.info,
                          borderRadius: BorderRadius.circular(12),
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.info.withValues(alpha: 0.35),
                              blurRadius: 12,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: const Icon(Icons.add_rounded,
                            color: AppColors.textPrimary, size: 22),
                      ),
                    ),
                  ],
                ),
                const Gap(14),
                // Filter chips
                SizedBox(
                  height: 36,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    itemCount: _filters.length,
                    separatorBuilder: (_, __) => const Gap(8),
                    itemBuilder: (_, i) {
                      final (label, status) = _filters[i];
                      final isActive = _activeStatus == status;
                      return GestureDetector(
                        onTap: () => _applyFilter(status),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          padding: const EdgeInsets.symmetric(
                              horizontal: 16, vertical: 6),
                          decoration: BoxDecoration(
                            color: isActive
                                ? AppColors.info
                                : AppColors.surfaceHigh,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: isActive
                                  ? AppColors.info
                                  : AppColors.border,
                            ),
                          ),
                          child: Text(
                            label,
                            style: GoogleFonts.poppins(
                              fontSize: 12,
                              fontWeight: isActive
                                  ? FontWeight.w600
                                  : FontWeight.w400,
                              color: isActive
                                  ? AppColors.textPrimary
                                  : AppColors.textSecondary,
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),
                const Gap(12),
              ],
            ),
          ),

          // Reservation list
          Expanded(
            child: reservationsAsync.when(
              data: (paginated) => paginated.data.isEmpty
                  ? EmptyState(
                      icon: Icons.calendar_today_outlined,
                      title: 'Aucune réservation',
                      subtitle: 'Les réservations apparaîtront ici',
                      actionLabel: 'Nouvelle réservation',
                      onAction: () =>
                          context.push('/reservations/create'),
                    )
                  : RefreshIndicator(
                      color: AppColors.info,
                      backgroundColor: AppColors.surfaceHigh,
                      onRefresh: () async =>
                          ref.invalidate(reservationsProvider),
                      child: ListView.builder(
                        padding:
                            const EdgeInsets.fromLTRB(16, 4, 16, 100),
                        itemCount: paginated.data.length,
                        itemBuilder: (_, index) => Padding(
                          padding: const EdgeInsets.only(bottom: 10),
                          child: _ReservationCard(
                                  reservation: paginated.data[index])
                              .animate()
                              .fadeIn(
                                  duration: 350.ms,
                                  delay: (index * 40).ms)
                              .slideY(
                                  begin: 0.08,
                                  delay: (index * 40).ms,
                                  curve: Curves.easeOutCubic),
                        ),
                      ),
                    ),
              loading: () => const LoadingShimmer(),
              error: (e, _) => AppErrorWidget(
                message: e.toString(),
                onRetry: () => ref.invalidate(reservationsProvider),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ReservationCard extends StatelessWidget {
  final Reservation reservation;

  const _ReservationCard({required this.reservation});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        onTap: () =>
            context.push('/reservations/${reservation.id}'),
        borderRadius: BorderRadius.circular(14),
        child: Container(
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(14),
            border: const Border(
              left: BorderSide(color: AppColors.info, width: 4),
              top: BorderSide(color: AppColors.border),
              right: BorderSide(color: AppColors.border),
              bottom: BorderSide(color: AppColors.border),
            ),
          ),
          padding: const EdgeInsets.all(14),
          child: Row(
            children: [
              // Date block
              Container(
                width: 52,
                height: 52,
                decoration: BoxDecoration(
                  color: AppColors.info.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                      color: AppColors.info.withValues(alpha: 0.3)),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      _dayNumber(reservation.reservedDate),
                      style: GoogleFonts.poppins(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: AppColors.info,
                        height: 1,
                      ),
                    ),
                    Text(
                      _monthAbbr(reservation.reservedDate),
                      style: GoogleFonts.poppins(
                        fontSize: 10,
                        color: AppColors.info,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
              const Gap(14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      reservation.customerName,
                      style: GoogleFonts.poppins(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const Gap(4),
                    Row(
                      children: [
                        const Icon(Icons.access_time_rounded,
                            size: 13, color: AppColors.textMuted),
                        const Gap(4),
                        Text(
                          AppDateUtils.formatTimeOnly(
                              reservation.reservedTime),
                          style: GoogleFonts.poppins(
                            fontSize: 12,
                            color: AppColors.textSecondary,
                          ),
                        ),
                        const Gap(12),
                        const Icon(Icons.people_outline_rounded,
                            size: 13, color: AppColors.textMuted),
                        const Gap(4),
                        Text(
                          '${reservation.guestsCount} couvert${reservation.guestsCount > 1 ? 's' : ''}',
                          style: GoogleFonts.poppins(
                            fontSize: 12,
                            color: AppColors.textSecondary,
                          ),
                        ),
                      ],
                    ),
                    if (reservation.customerPhone != null &&
                        reservation.customerPhone!.isNotEmpty) ...[
                      const Gap(2),
                      Text(
                        reservation.customerPhone!,
                        style: GoogleFonts.poppins(
                          fontSize: 11,
                          color: AppColors.textMuted,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  ReservationStatusBadge(
                      status: reservation.status, compact: true),
                  const Gap(6),
                  const Icon(Icons.chevron_right_rounded,
                      color: AppColors.textMuted, size: 18),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _dayNumber(String dateStr) {
    try {
      return DateTime.parse(dateStr).day.toString();
    } catch (_) {
      return '--';
    }
  }

  String _monthAbbr(String dateStr) {
    try {
      final date = DateTime.parse(dateStr);
      const months = [
        'jan', 'fév', 'mar', 'avr', 'mai', 'jun',
        'jul', 'aoû', 'sep', 'oct', 'nov', 'déc'
      ];
      return months[date.month - 1];
    } catch (_) {
      return '--';
    }
  }
}
