import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gap/gap.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/currency_utils.dart';
import '../models/marketing_models.dart';
import '../providers/marketing_provider.dart';
import '../../../shared/widgets/empty_state.dart';

class MarketingScreen extends ConsumerStatefulWidget {
  const MarketingScreen({super.key});

  @override
  ConsumerState<MarketingScreen> createState() => _MarketingScreenState();
}

class _MarketingScreenState extends ConsumerState<MarketingScreen> {
  // 0 = all, 1 = active, 2 = expired
  int _filterIndex = 0;

  final _dateDisplayFormat = DateFormat('dd/MM/yy');

  @override
  Widget build(BuildContext context) {
    final topPadding = MediaQuery.of(context).padding.top;
    final statsAsync = ref.watch(marketingStatsProvider);
    final vouchersAsync = ref.watch(marketingVouchersProvider);

    return Column(
      children: [
        // ── Header ────────────────────────────────────────────────────────────
        Container(
          padding: EdgeInsets.fromLTRB(20, topPadding + 16, 20, 16),
          decoration: const BoxDecoration(
            color: AppColors.surface,
            border: Border(
              bottom: BorderSide(color: AppColors.borderBright, width: 1),
            ),
          ),
          child: Row(
            children: [
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  color: AppColors.purple.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                      color: AppColors.purple.withValues(alpha: 0.25)),
                ),
                child: const Icon(Icons.local_activity_rounded,
                    color: AppColors.purple, size: 20),
              ),
              const Gap(12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Marketing',
                    style: GoogleFonts.poppins(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  Text(
                    'Bons de commande',
                    style: GoogleFonts.poppins(
                      fontSize: 12,
                      color: AppColors.textMuted,
                    ),
                  ),
                ],
              ),
              const Spacer(),
              IconButton(
                onPressed: () {
                  ref.invalidate(marketingStatsProvider);
                  ref.invalidate(marketingVouchersProvider);
                },
                icon: const Icon(Icons.refresh_rounded,
                    color: AppColors.textMuted, size: 20),
              ),
            ],
          ),
        ),

        Expanded(
          child: RefreshIndicator(
            color: AppColors.purple,
            backgroundColor: AppColors.surface,
            onRefresh: () async {
              ref.invalidate(marketingStatsProvider);
              ref.invalidate(marketingVouchersProvider);
            },
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                // ── Stats cards ───────────────────────────────────────────────
                statsAsync.when(
                  data: (stats) => _StatsRow(stats: stats),
                  loading: () => const _StatsRowSkeleton(),
                  error: (_, __) => const SizedBox.shrink(),
                ),
                const Gap(20),

                // ── Filter chips ──────────────────────────────────────────────
                Row(
                  children: [
                    _FilterChip(
                      label: 'Tous',
                      selected: _filterIndex == 0,
                      onTap: () => setState(() => _filterIndex = 0),
                    ),
                    const Gap(8),
                    _FilterChip(
                      label: 'Actifs',
                      selected: _filterIndex == 1,
                      color: AppColors.emerald,
                      onTap: () => setState(() => _filterIndex = 1),
                    ),
                    const Gap(8),
                    _FilterChip(
                      label: 'Expirés',
                      selected: _filterIndex == 2,
                      color: AppColors.textMuted,
                      onTap: () => setState(() => _filterIndex = 2),
                    ),
                  ],
                ),
                const Gap(16),

                // ── Voucher list ──────────────────────────────────────────────
                vouchersAsync.when(
                  data: (paginated) {
                    final all = paginated.data;
                    final filtered = _filterIndex == 0
                        ? all
                        : _filterIndex == 1
                            ? all
                                .where((v) => v.status == VoucherStatus.active)
                                .toList()
                            : all
                                .where((v) =>
                                    v.status != VoucherStatus.active)
                                .toList();

                    if (filtered.isEmpty) {
                      return const Padding(
                        padding: EdgeInsets.symmetric(vertical: 40),
                        child: EmptyState(
                          icon: Icons.local_activity_outlined,
                          title: 'Aucun bon trouvé',
                          subtitle:
                              'Créez vos bons de commande depuis le panel web',
                        ),
                      );
                    }

                    return Column(
                      children: filtered
                          .asMap()
                          .entries
                          .map((entry) => Padding(
                                padding: const EdgeInsets.only(bottom: 12),
                                child: _VoucherCard(
                                  voucher: entry.value,
                                  dateFormat: _dateDisplayFormat,
                                )
                                    .animate()
                                    .fadeIn(
                                        duration: 350.ms,
                                        delay: (entry.key * 50).ms)
                                    .slideY(
                                        begin: 0.1,
                                        duration: 350.ms,
                                        delay: (entry.key * 50).ms,
                                        curve: Curves.easeOutCubic),
                              ))
                          .toList(),
                    );
                  },
                  loading: () => Column(
                    children: List.generate(
                      3,
                      (i) => Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: _VoucherCardSkeleton(),
                      ),
                    ),
                  ),
                  error: (e, _) => Padding(
                    padding: const EdgeInsets.symmetric(vertical: 40),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.error_outline_rounded,
                            color: AppColors.brand, size: 48),
                        const Gap(16),
                        Text(
                          'Impossible de charger les bons',
                          style: GoogleFonts.poppins(
                            color: AppColors.textSecondary,
                            fontSize: 14,
                          ),
                        ),
                        const Gap(12),
                        TextButton.icon(
                          onPressed: () =>
                              ref.invalidate(marketingVouchersProvider),
                          icon: const Icon(Icons.refresh_rounded,
                              color: AppColors.purple),
                          label: Text(
                            'Réessayer',
                            style: GoogleFonts.poppins(
                                color: AppColors.purple),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                // ── Web note ──────────────────────────────────────────────────
                const Gap(8),
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppColors.purple.withValues(alpha: 0.07),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                        color: AppColors.purple.withValues(alpha: 0.2)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.info_outline_rounded,
                          color: AppColors.purple, size: 18),
                      const Gap(10),
                      Expanded(
                        child: Text(
                          'Créez et gérez vos bons depuis le panel web administrateur',
                          style: GoogleFonts.poppins(
                            fontSize: 12,
                            color: AppColors.purple.withValues(alpha: 0.8),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const Gap(24),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

// ─── Stats row ────────────────────────────────────────────────────────────────

class _StatsRow extends StatelessWidget {
  final MarketingStats stats;
  const _StatsRow({required this.stats});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _StatCard(
            label: 'Total bons',
            value: '${stats.totalVouchers}',
            icon: Icons.local_activity_rounded,
            color: AppColors.purple,
          ),
        ),
        const Gap(10),
        Expanded(
          child: _StatCard(
            label: 'Actifs',
            value: '${stats.activeVouchers}',
            icon: Icons.check_circle_outline_rounded,
            color: AppColors.emerald,
          ),
        ),
        const Gap(10),
        Expanded(
          child: _StatCard(
            label: 'Utilisations',
            value: '${stats.totalRedemptions}',
            icon: Icons.qr_code_scanner_rounded,
            color: AppColors.info,
          ),
        ),
      ],
    );
  }
}

class _StatCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;

  const _StatCard({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.borderBright),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 20),
          const Gap(8),
          Text(
            value,
            style: GoogleFonts.poppins(
              fontSize: 22,
              fontWeight: FontWeight.w800,
              color: AppColors.textPrimary,
            ),
          ),
          Text(
            label,
            style: GoogleFonts.poppins(
              fontSize: 11,
              color: AppColors.textMuted,
            ),
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    ).animate().fadeIn(duration: 400.ms).scale(
          begin: const Offset(0.95, 0.95),
          curve: Curves.easeOutBack,
        );
  }
}

class _StatsRowSkeleton extends StatelessWidget {
  const _StatsRowSkeleton();

  @override
  Widget build(BuildContext context) {
    return Row(
      children: List.generate(3, (i) {
        return Expanded(
          child: Container(
            margin: EdgeInsets.only(right: i < 2 ? 10 : 0),
            height: 90,
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppColors.borderBright),
            ),
          ),
        );
      }),
    );
  }
}

// ─── Filter chip ──────────────────────────────────────────────────────────────

class _FilterChip extends StatelessWidget {
  final String label;
  final bool selected;
  final Color color;
  final VoidCallback onTap;

  const _FilterChip({
    required this.label,
    required this.selected,
    this.color = AppColors.purple,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: selected ? color.withValues(alpha: 0.15) : AppColors.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: selected ? color : AppColors.borderBright,
            width: selected ? 1.5 : 1,
          ),
        ),
        child: Text(
          label,
          style: GoogleFonts.poppins(
            fontSize: 13,
            fontWeight: selected ? FontWeight.w600 : FontWeight.w400,
            color: selected ? color : AppColors.textMuted,
          ),
        ),
      ),
    );
  }
}

// ─── Voucher card ─────────────────────────────────────────────────────────────

class _VoucherCard extends StatelessWidget {
  final MarketingVoucher voucher;
  final DateFormat dateFormat;

  const _VoucherCard({required this.voucher, required this.dateFormat});

  @override
  Widget build(BuildContext context) {
    final et = voucher.eventType;
    final statusColor = switch (voucher.status) {
      VoucherStatus.active => AppColors.emerald,
      VoucherStatus.expired => AppColors.textMuted,
      VoucherStatus.fullyUsed => AppColors.brand,
    };
    final statusLabel = voucher.status.label;

    DateTime? fromDate;
    DateTime? untilDate;
    try {
      fromDate = DateTime.parse(voucher.validFrom);
      untilDate = DateTime.parse(voucher.validUntil);
    } catch (_) {}

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: voucher.canRedeem
              ? AppColors.borderBright
              : AppColors.borderBright.withValues(alpha: 0.5),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Top row: event badge + amount + status
          Row(
            children: [
              // Event type badge
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: _eventColor(et).withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(et.icon, size: 13, color: _eventColor(et)),
                    const Gap(5),
                    Text(
                      et.label,
                      style: GoogleFonts.poppins(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: _eventColor(et),
                      ),
                    ),
                  ],
                ),
              ),
              const Spacer(),
              // Status badge
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  statusLabel,
                  style: GoogleFonts.poppins(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    color: statusColor,
                  ),
                ),
              ),
            ],
          ),
          const Gap(12),

          // Label
          Text(
            voucher.label,
            style: GoogleFonts.poppins(
              fontSize: 15,
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimary,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const Gap(4),

          // Amount
          Text(
            CurrencyUtils.formatAmount(voucher.amount),
            style: GoogleFonts.poppins(
              fontSize: 20,
              fontWeight: FontWeight.w800,
              color: AppColors.emerald,
            ),
          ),
          const Gap(10),
          const Divider(color: AppColors.borderBright, height: 1),
          const Gap(10),

          // Footer: dates + usage
          Row(
            children: [
              const Icon(Icons.calendar_today_outlined,
                  size: 13, color: AppColors.textMuted),
              const Gap(5),
              Text(
                fromDate != null && untilDate != null
                    ? '${dateFormat.format(fromDate)} → ${dateFormat.format(untilDate)}'
                    : '${voucher.validFrom} → ${voucher.validUntil}',
                style: GoogleFonts.poppins(
                    fontSize: 11, color: AppColors.textMuted),
              ),
              const Spacer(),
              const Icon(Icons.qr_code_scanner_rounded,
                  size: 13, color: AppColors.textMuted),
              const Gap(5),
              Text(
                voucher.maxUsages != null
                    ? '${voucher.usageCount}/${voucher.maxUsages}'
                    : '${voucher.usageCount} util.',
                style: GoogleFonts.poppins(
                    fontSize: 11, color: AppColors.textMuted),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Color _eventColor(VoucherEventType et) {
    if (et == VoucherEventType.afterWork) return AppColors.purple;
    if (et == VoucherEventType.christmas) return AppColors.emerald;
    if (et == VoucherEventType.easter) return AppColors.amber;
    if (et == VoucherEventType.newYear) return AppColors.info;
    if (et == VoucherEventType.birthday) return AppColors.orange;
    return AppColors.brand;
  }
}

class _VoucherCardSkeleton extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      height: 140,
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.borderBright),
      ),
    );
  }
}
