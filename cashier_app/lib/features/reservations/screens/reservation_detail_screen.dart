import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gap/gap.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/date_utils.dart';
import '../../../core/api/api_client.dart';
import '../models/reservation_models.dart';
import '../providers/reservations_provider.dart';
import '../../../shared/widgets/status_badge.dart';
import '../../../shared/widgets/loading_shimmer.dart';
import '../../../shared/widgets/error_widget.dart';
import '../../../shared/widgets/confirm_dialog.dart';

class ReservationDetailScreen extends ConsumerWidget {
  final int reservationId;

  const ReservationDetailScreen({super.key, required this.reservationId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final reservationAsync =
        ref.watch(reservationDetailProvider(reservationId));

    return Scaffold(
      backgroundColor: AppColors.background,
      body: reservationAsync.when(
        data: (reservation) =>
            _ReservationDetailView(reservation: reservation),
        loading: () => const LoadingShimmer(itemCount: 4),
        error: (e, _) => Scaffold(
          backgroundColor: AppColors.background,
          appBar: AppBar(
            leading: IconButton(
              icon: const Icon(Icons.arrow_back_rounded,
                  color: AppColors.textPrimary),
              onPressed: () => context.pop(),
            ),
          ),
          body: AppErrorWidget(
            message: extractErrorMessage(e),
            onRetry: () =>
                ref.invalidate(reservationDetailProvider(reservationId)),
          ),
        ),
      ),
    );
  }
}

class _ReservationDetailView extends ConsumerWidget {
  final Reservation reservation;

  const _ReservationDetailView({required this.reservation});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final statusNotifier =
        ref.watch(reservationStatusNotifierProvider.notifier);
    final statusState = ref.watch(reservationStatusNotifierProvider);

    final canConfirm = reservation.status == ReservationStatus.pending;
    final canCancel = reservation.status == ReservationStatus.pending ||
        reservation.status == ReservationStatus.confirmed;
    final canMarkNoShow =
        reservation.status == ReservationStatus.confirmed ||
            reservation.status == ReservationStatus.pending;

    return Stack(
      children: [
        CustomScrollView(
          slivers: [
            // Header
            SliverAppBar(
              expandedHeight: 140,
              pinned: true,
              backgroundColor: AppColors.background,
              leading: IconButton(
                icon: const Icon(Icons.arrow_back_rounded,
                    color: AppColors.textPrimary),
                onPressed: () => context.pop(),
              ),
              flexibleSpace: FlexibleSpaceBar(
                background: Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        AppColors.info.withValues(alpha: 0.6),
                        AppColors.info.withValues(alpha: 0.2),
                        AppColors.background,
                      ],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                  ),
                  child: SafeArea(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(20, 48, 20, 12),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          Text(
                            _formatDate(reservation.reservedDate),
                            style: GoogleFonts.poppins(
                              fontSize: 22,
                              fontWeight: FontWeight.w800,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          Row(
                            children: [
                              Text(
                                AppDateUtils.formatTimeOnly(
                                    reservation.reservedTime),
                                style: GoogleFonts.poppins(
                                  fontSize: 14,
                                  color: AppColors.textSecondary,
                                ),
                              ),
                              const Gap(12),
                              ReservationStatusBadge(
                                  status: reservation.status),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
              title: Text(
                'Réservation #${reservation.id}',
                style: GoogleFonts.poppins(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
              ),
            ),

            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 160),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  // Reservation details card
                  _SectionCard(
                    title: 'Détails',
                    icon: Icons.calendar_today_rounded,
                    children: [
                      _InfoTile(
                        icon: Icons.calendar_today_rounded,
                        label: 'Date',
                        value: AppDateUtils.formatReservationDate(
                            reservation.reservedDate),
                      ),
                      const Gap(12),
                      _InfoTile(
                        icon: Icons.access_time_rounded,
                        label: 'Heure',
                        value: AppDateUtils.formatTimeOnly(
                            reservation.reservedTime),
                      ),
                      const Gap(12),
                      _InfoTile(
                        icon: Icons.people_outline_rounded,
                        label: 'Couverts',
                        value:
                            '${reservation.guestsCount} couvert${reservation.guestsCount > 1 ? 's' : ''}',
                      ),
                      if (reservation.specialRequests != null &&
                          reservation.specialRequests!.isNotEmpty) ...[
                        const Gap(12),
                        _InfoTile(
                          icon: Icons.star_outline_rounded,
                          label: 'Demandes spéciales',
                          value: reservation.specialRequests!,
                        ),
                      ],
                      if (reservation.notes != null &&
                          reservation.notes!.isNotEmpty) ...[
                        const Gap(12),
                        _InfoTile(
                          icon: Icons.notes_rounded,
                          label: 'Notes',
                          value: reservation.notes!,
                        ),
                      ],
                    ],
                  )
                      .animate()
                      .fadeIn(duration: 400.ms)
                      .slideY(begin: 0.1, curve: Curves.easeOutCubic),

                  const Gap(14),

                  // Client card
                  _SectionCard(
                    title: 'Client',
                    icon: Icons.person_outline_rounded,
                    children: [
                      _InfoTile(
                        icon: Icons.person_outline_rounded,
                        label: 'Nom',
                        value: reservation.customerName,
                      ),
                      if (reservation.customerPhone != null &&
                          reservation.customerPhone!.isNotEmpty) ...[
                        const Gap(12),
                        _InfoTile(
                          icon: Icons.phone_outlined,
                          label: 'Téléphone',
                          value: reservation.customerPhone!,
                        ),
                      ],
                      if (reservation.customerEmail != null &&
                          reservation.customerEmail!.isNotEmpty) ...[
                        const Gap(12),
                        _InfoTile(
                          icon: Icons.email_outlined,
                          label: 'Email',
                          value: reservation.customerEmail!,
                        ),
                      ],
                    ],
                  )
                      .animate()
                      .fadeIn(duration: 400.ms, delay: 100.ms)
                      .slideY(
                          begin: 0.1,
                          delay: 100.ms,
                          curve: Curves.easeOutCubic),
                ]),
              ),
            ),
          ],
        ),

        // Bottom actions
        if (canConfirm || canCancel || canMarkNoShow)
          Align(
            alignment: Alignment.bottomCenter,
            child: Container(
              decoration: const BoxDecoration(
                color: AppColors.surface,
                border: Border(top: BorderSide(color: AppColors.border)),
              ),
              padding: EdgeInsets.fromLTRB(16, 12, 16,
                  MediaQuery.of(context).padding.bottom + 12),
              child: statusState is AsyncLoading
                  ? const Center(
                      child: CircularProgressIndicator(
                          color: AppColors.info))
                  : Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        if (canConfirm)
                          _InfoActionButton(
                            label: 'Confirmer la réservation',
                            icon: Icons.check_rounded,
                            color: AppColors.emerald,
                            onPressed: () => _updateStatus(
                              context,
                              ref,
                              statusNotifier,
                              'confirmed',
                              'Confirmer',
                            ),
                          ),
                        if (canMarkNoShow) ...[
                          if (canConfirm) const Gap(10),
                          OutlinedButton.icon(
                            onPressed: () => _updateStatus(
                              context,
                              ref,
                              statusNotifier,
                              'no_show',
                              'No-show',
                              isDangerous: true,
                            ),
                            icon: const Icon(Icons.person_off_outlined,
                                color: AppColors.textSecondary),
                            label: Text('Marquer no-show',
                                style: GoogleFonts.poppins(
                                    color: AppColors.textSecondary,
                                    fontWeight: FontWeight.w600)),
                            style: OutlinedButton.styleFrom(
                                side: const BorderSide(
                                    color: AppColors.borderBright)),
                          ),
                        ],
                        if (canCancel) ...[
                          const Gap(10),
                          OutlinedButton.icon(
                            onPressed: () => _updateStatus(
                              context,
                              ref,
                              statusNotifier,
                              'cancelled',
                              'Annuler',
                              isDangerous: true,
                            ),
                            icon: const Icon(Icons.cancel_outlined,
                                color: AppColors.brand),
                            label: Text('Annuler la réservation',
                                style: GoogleFonts.poppins(
                                    color: AppColors.brand,
                                    fontWeight: FontWeight.w600)),
                            style: OutlinedButton.styleFrom(
                                side: const BorderSide(
                                    color: AppColors.brand)),
                          ),
                        ],
                      ],
                    ),
            ),
          ),
      ],
    );
  }

  String _formatDate(String dateStr) {
    try {
      final date = DateTime.parse(dateStr);
      const days = [
        'Lun',
        'Mar',
        'Mer',
        'Jeu',
        'Ven',
        'Sam',
        'Dim'
      ];
      const months = [
        'jan',
        'fév',
        'mar',
        'avr',
        'mai',
        'jun',
        'jul',
        'aoû',
        'sep',
        'oct',
        'nov',
        'déc'
      ];
      return '${days[date.weekday - 1]} ${date.day} ${months[date.month - 1]}. ${date.year}';
    } catch (_) {
      return dateStr;
    }
  }

  Future<void> _updateStatus(
    BuildContext context,
    WidgetRef ref,
    ReservationStatusNotifier notifier,
    String status,
    String label, {
    bool isDangerous = false,
  }) async {
    final confirmed = await ConfirmDialog.show(
      context,
      title: 'Changer le statut',
      message: 'Confirmer le passage du statut à "$label" ?',
      confirmLabel: label,
      isDangerous: isDangerous,
    );

    if (confirmed != true) return;

    await notifier.updateStatus(reservation.id, status);

    if (context.mounted) {
      final state = ref.read(reservationStatusNotifierProvider);
      if (state is AsyncError) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(extractErrorMessage(state.error)),
            backgroundColor: AppColors.brand,
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Statut mis à jour avec succès')),
        );
        ref.invalidate(reservationDetailProvider(reservation.id));
        ref.invalidate(reservationsProvider);
      }
    }
  }
}

class _SectionCard extends StatelessWidget {
  final String title;
  final IconData icon;
  final List<Widget> children;

  const _SectionCard({
    required this.title,
    required this.icon,
    required this.children,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 16, color: AppColors.info),
              const Gap(8),
              Text(
                title,
                style: GoogleFonts.poppins(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textPrimary,
                ),
              ),
            ],
          ),
          const Gap(14),
          const Divider(color: AppColors.border, height: 1),
          const Gap(14),
          ...children,
        ],
      ),
    );
  }
}

class _InfoTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _InfoTile({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 16, color: AppColors.textMuted),
        const Gap(10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: GoogleFonts.poppins(
                  fontSize: 11,
                  color: AppColors.textMuted,
                ),
              ),
              Text(
                value,
                style: GoogleFonts.poppins(
                  fontSize: 14,
                  color: AppColors.textPrimary,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _InfoActionButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final Color color;
  final VoidCallback onPressed;

  const _InfoActionButton({
    required this.label,
    required this.icon,
    required this.color,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onPressed,
      child: Container(
        height: 50,
        decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: color.withValues(alpha: 0.35),
              blurRadius: 14,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: AppColors.textPrimary, size: 18),
            const Gap(8),
            Text(
              label,
              style: GoogleFonts.poppins(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: AppColors.textPrimary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
