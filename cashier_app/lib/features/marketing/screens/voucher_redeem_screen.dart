import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gap/gap.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/currency_utils.dart';
import '../../../core/api/api_client.dart';
import '../models/marketing_models.dart';
import '../providers/marketing_provider.dart';
import 'voucher_order_screen.dart';

class VoucherRedeemScreen extends ConsumerWidget {
  final String token;
  const VoucherRedeemScreen({super.key, required this.token});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final voucherAsync = ref.watch(scannedVoucherProvider(token));
    final topPadding = MediaQuery.of(context).padding.top;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: Column(
        children: [
          // ── Header ────────────────────────────────────────────────────────
          Container(
            padding: EdgeInsets.fromLTRB(8, topPadding + 8, 16, 8),
            decoration: const BoxDecoration(
              color: AppColors.surface,
              border: Border(
                  bottom:
                      BorderSide(color: AppColors.borderBright, width: 1)),
            ),
            child: Row(
              children: [
                IconButton(
                  onPressed: () => context.pop(),
                  icon: const Icon(Icons.arrow_back_ios_new_rounded,
                      color: AppColors.textPrimary, size: 20),
                ),
                const Gap(4),
                Text(
                  'Utiliser un bon',
                  style: GoogleFonts.poppins(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: AppColors.purple.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                        color: AppColors.purple.withValues(alpha: 0.3)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.local_activity_rounded,
                          color: AppColors.purple, size: 14),
                      const Gap(5),
                      Text(
                        'Marketing',
                        style: GoogleFonts.poppins(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: AppColors.purple,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // ── Body ──────────────────────────────────────────────────────────
          Expanded(
            child: voucherAsync.when(
              data: (voucher) => _VoucherBody(voucher: voucher),
              loading: () => Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const CircularProgressIndicator(
                        color: AppColors.purple),
                    const Gap(20),
                    Text(
                      'Chargement du bon...',
                      style: GoogleFonts.poppins(
                          color: AppColors.textSecondary),
                    ),
                  ],
                ),
              ),
              error: (e, _) =>
                  _ErrorBody(error: e, onRetry: () => context.pop()),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Error state ──────────────────────────────────────────────────────────────

class _ErrorBody extends StatelessWidget {
  final Object error;
  final VoidCallback onRetry;

  const _ErrorBody({required this.error, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(32),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: AppColors.brand.withValues(alpha: 0.1),
              shape: BoxShape.circle,
              border: Border.all(
                  color: AppColors.brand.withValues(alpha: 0.3),
                  width: 1.5),
            ),
            child: const Icon(Icons.local_activity_outlined,
                color: AppColors.brand, size: 52),
          )
              .animate()
              .fadeIn(duration: 400.ms)
              .scale(begin: const Offset(0.8, 0.8)),
          const Gap(24),
          Text(
            'Bon invalide',
            style: GoogleFonts.poppins(
              fontSize: 22,
              fontWeight: FontWeight.w700,
              color: AppColors.brand,
            ),
          ).animate().fadeIn(duration: 400.ms, delay: 100.ms),
          const Gap(10),
          Text(
            extractErrorMessage(error),
            textAlign: TextAlign.center,
            style: GoogleFonts.poppins(
              fontSize: 14,
              color: AppColors.textSecondary,
              height: 1.5,
            ),
          ).animate().fadeIn(duration: 400.ms, delay: 150.ms),
          const Gap(32),
          GestureDetector(
            onTap: onRetry,
            child: Container(
              padding: const EdgeInsets.symmetric(
                  horizontal: 28, vertical: 14),
              decoration: BoxDecoration(
                gradient: AppColors.brandGradient,
                borderRadius: BorderRadius.circular(14),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.brand.withValues(alpha: 0.35),
                    blurRadius: 16,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.qr_code_scanner_rounded,
                      color: AppColors.textPrimary, size: 18),
                  const Gap(8),
                  Text(
                    'Retour au scanner',
                    style: GoogleFonts.poppins(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textPrimary,
                    ),
                  ),
                ],
              ),
            ),
          ).animate().fadeIn(duration: 400.ms, delay: 200.ms),
        ],
      ),
    );
  }
}

// ─── Voucher body ─────────────────────────────────────────────────────────────

class _VoucherBody extends StatelessWidget {
  final MarketingVoucher voucher;
  const _VoucherBody({required this.voucher});

  @override
  Widget build(BuildContext context) {
    final dateFormat = DateFormat('dd/MM/yyyy');
    DateTime? fromDate;
    DateTime? untilDate;
    try {
      fromDate = DateTime.parse(voucher.validFrom);
      untilDate = DateTime.parse(voucher.validUntil);
    } catch (_) {}

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        // ── Voucher info card ────────────────────────────────────────────
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                AppColors.purple.withValues(alpha: 0.15),
                AppColors.purple.withValues(alpha: 0.05),
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
                color: AppColors.purple.withValues(alpha: 0.3),
                width: 1.5),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: AppColors.purple.withValues(alpha: 0.15),
                      shape: BoxShape.circle,
                      border: Border.all(
                          color:
                              AppColors.purple.withValues(alpha: 0.3)),
                    ),
                    child: Icon(voucher.eventType.icon,
                        color: AppColors.purple, size: 22),
                  ),
                  const Gap(14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          voucher.eventType.label,
                          style: GoogleFonts.poppins(
                            fontSize: 12,
                            color: AppColors.purple,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        Text(
                          voucher.label,
                          style: GoogleFonts.poppins(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: AppColors.textPrimary,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                  _StatusBadge(status: voucher.status),
                ],
              ),
              const Gap(16),
              const Divider(color: AppColors.borderBright, height: 1),
              const Gap(14),
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Valeur du bon',
                          style: GoogleFonts.poppins(
                              fontSize: 12,
                              color: AppColors.textMuted),
                        ),
                        Text(
                          CurrencyUtils.formatAmount(voucher.amount),
                          style: GoogleFonts.poppins(
                            fontSize: 26,
                            fontWeight: FontWeight.w800,
                            color: AppColors.emerald,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        'Validité',
                        style: GoogleFonts.poppins(
                            fontSize: 12,
                            color: AppColors.textMuted),
                      ),
                      Text(
                        fromDate != null && untilDate != null
                            ? '${dateFormat.format(fromDate)} → ${dateFormat.format(untilDate)}'
                            : '${voucher.validFrom} → ${voucher.validUntil}',
                        style: GoogleFonts.poppins(
                          fontSize: 12,
                          color: AppColors.textSecondary,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const Gap(4),
                      Text(
                        voucher.maxUsages != null
                            ? '${voucher.usageCount}/${voucher.maxUsages} utilisations'
                            : '${voucher.usageCount} utilisation(s)',
                        style: GoogleFonts.poppins(
                            fontSize: 11,
                            color: AppColors.textMuted),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
        ).animate().fadeIn(duration: 400.ms).slideY(
              begin: 0.1,
              curve: Curves.easeOutCubic,
            ),

        const Gap(24),

        // ── Cannot redeem warning ────────────────────────────────────────
        if (!voucher.canRedeem) ...[
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.brand.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                  color: AppColors.brand.withValues(alpha: 0.3)),
            ),
            child: Row(
              children: [
                const Icon(Icons.block_rounded,
                    color: AppColors.brand, size: 22),
                const Gap(12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        voucher.isExpired
                            ? 'Bon expiré'
                            : 'Quota atteint',
                        style: GoogleFonts.poppins(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: AppColors.brand,
                        ),
                      ),
                      Text(
                        voucher.isExpired
                            ? 'Ce bon a dépassé sa date de validité.'
                            : 'Ce bon a atteint son nombre maximal d\'utilisations.',
                        style: GoogleFonts.poppins(
                          fontSize: 12,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ).animate().fadeIn(duration: 300.ms),
        ] else ...[
          // ── CTA : prendre la commande sur le bon ────────────────────────
          GestureDetector(
            onTap: () => context.push(
              '/marketing/vouchers/order',
              extra: voucher,
            ),
            child: Container(
              height: 56,
              decoration: BoxDecoration(
                gradient: AppColors.brandGradient,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.brand.withValues(alpha: 0.35),
                    blurRadius: 16,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: Center(
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.restaurant_menu_rounded,
                        color: AppColors.textPrimary, size: 20),
                    const Gap(10),
                    Text(
                      'Prendre la commande',
                      style: GoogleFonts.poppins(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const Gap(6),
                    const Icon(Icons.arrow_forward_rounded,
                        color: AppColors.textPrimary, size: 18),
                  ],
                ),
              ),
            ),
          ).animate().fadeIn(duration: 350.ms, delay: 200.ms),
        ],

        const Gap(40),
      ],
    );
  }
}

// ─── Status badge ─────────────────────────────────────────────────────────────

class _StatusBadge extends StatelessWidget {
  final VoucherStatus status;
  const _StatusBadge({required this.status});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: status.color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: status.color.withValues(alpha: 0.3)),
      ),
      child: Text(
        status.label,
        style: GoogleFonts.poppins(
          fontSize: 11,
          fontWeight: FontWeight.w700,
          color: status.color,
        ),
      ),
    );
  }
}
