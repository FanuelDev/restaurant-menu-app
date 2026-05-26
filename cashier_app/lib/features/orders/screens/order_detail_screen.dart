import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gap/gap.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/date_utils.dart';
import '../../../core/utils/currency_utils.dart';
import '../../../core/api/api_client.dart';
import '../models/order_models.dart';
import '../providers/orders_provider.dart';
import '../../../shared/widgets/status_badge.dart';
import '../../../shared/widgets/loading_shimmer.dart';
import '../../../shared/widgets/error_widget.dart';
import '../../../shared/widgets/confirm_dialog.dart';

class OrderDetailScreen extends ConsumerWidget {
  final int orderId;

  const OrderDetailScreen({super.key, required this.orderId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final orderAsync = ref.watch(orderDetailProvider(orderId));

    return Scaffold(
      backgroundColor: AppColors.background,
      body: orderAsync.when(
        data: (order) => _OrderDetailView(order: order),
        loading: () => const LoadingShimmer(itemCount: 3),
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
            onRetry: () => ref.invalidate(orderDetailProvider(orderId)),
          ),
        ),
      ),
    );
  }
}

class _OrderDetailView extends ConsumerWidget {
  final Order order;

  const _OrderDetailView({required this.order});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final statusNotifier = ref.watch(orderStatusNotifierProvider.notifier);
    final statusState = ref.watch(orderStatusNotifierProvider);
    final headerColor = AppColors.statusColor(order.status.value);

    final steps = [
      OrderStatus.pending,
      OrderStatus.confirmed,
      OrderStatus.preparing,
      OrderStatus.ready,
      OrderStatus.delivered,
    ];
    final currentStepIndex = steps.indexOf(order.status);

    return Stack(
      children: [
        CustomScrollView(
          slivers: [
            // Collapsible header
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
                        headerColor.withValues(alpha: 0.7),
                        headerColor.withValues(alpha: 0.3),
                        AppColors.background,
                      ],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                  ),
                  child: SafeArea(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(20, 48, 20, 12),
                      child: Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisAlignment: MainAxisAlignment.end,
                              children: [
                                Text(
                                  order.orderNumber,
                                  style: GoogleFonts.poppins(
                                    fontSize: 26,
                                    fontWeight: FontWeight.w800,
                                    color: AppColors.textPrimary,
                                  ),
                                ),
                                Text(
                                  AppDateUtils.formatDateTime(order.createdAt),
                                  style: GoogleFonts.poppins(
                                    fontSize: 12,
                                    color: AppColors.textSecondary,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          OrderStatusBadge(status: order.status),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
              title: Text(
                order.orderNumber,
                style: GoogleFonts.poppins(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
              ),
            ),

            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 120),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  // Status stepper
                  if (order.status != OrderStatus.cancelled)
                    _StatusStepper(
                      steps: steps,
                      currentIndex: currentStepIndex,
                    )
                        .animate()
                        .fadeIn(duration: 400.ms)
                        .slideY(begin: 0.1, curve: Curves.easeOutCubic),

                  const Gap(16),

                  // Client card
                  _SectionCard(
                    title: 'Client',
                    icon: Icons.person_outline_rounded,
                    children: [
                      _InfoRow(
                          icon: Icons.person_outline_rounded,
                          label: 'Nom',
                          value: order.customerName),
                      if (order.customerPhone != null &&
                          order.customerPhone!.isNotEmpty) ...[
                        const Gap(10),
                        _InfoRow(
                            icon: Icons.phone_outlined,
                            label: 'Téléphone',
                            value: order.customerPhone!),
                      ],
                      if (order.customerEmail != null &&
                          order.customerEmail!.isNotEmpty) ...[
                        const Gap(10),
                        _InfoRow(
                            icon: Icons.email_outlined,
                            label: 'Email',
                            value: order.customerEmail!),
                      ],
                      if (order.notes != null &&
                          order.notes!.isNotEmpty) ...[
                        const Gap(10),
                        _InfoRow(
                            icon: Icons.notes_rounded,
                            label: 'Notes',
                            value: order.notes!),
                      ],
                    ],
                  )
                      .animate()
                      .fadeIn(duration: 400.ms, delay: 100.ms)
                      .slideY(
                          begin: 0.1,
                          delay: 100.ms,
                          curve: Curves.easeOutCubic),

                  const Gap(14),

                  // Articles card
                  _SectionCard(
                    title: 'Articles (${order.items.length})',
                    icon: Icons.restaurant_rounded,
                    children: [
                      ...order.items
                          .map((item) => _OrderItemRow(item: item)),
                      const Divider(color: AppColors.border, height: 24),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Total',
                            style: GoogleFonts.poppins(
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          Text(
                            CurrencyUtils.formatAmount(order.total),
                            style: GoogleFonts.poppins(
                              fontSize: 20,
                              fontWeight: FontWeight.w800,
                              color: AppColors.brand,
                            ),
                          ),
                        ],
                      ),
                    ],
                  )
                      .animate()
                      .fadeIn(duration: 400.ms, delay: 200.ms)
                      .slideY(
                          begin: 0.1,
                          delay: 200.ms,
                          curve: Curves.easeOutCubic),

                  // Gift section
                  if (order.isGift) ...[
                    const Gap(14),
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppColors.purple.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                            color: AppColors.purple.withValues(alpha: 0.3)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.card_giftcard_rounded,
                              color: AppColors.purple, size: 28),
                          const Gap(14),
                          Text(
                            'Commande cadeau',
                            style: GoogleFonts.poppins(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: AppColors.purple,
                            ),
                          ),
                        ],
                      ),
                    )
                        .animate()
                        .fadeIn(duration: 400.ms, delay: 300.ms),
                  ],
                ]),
              ),
            ),
          ],
        ),

        // Bottom action buttons
        if (order.status != OrderStatus.delivered &&
            order.status != OrderStatus.cancelled)
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
                      child: CircularProgressIndicator(color: AppColors.brand))
                  : Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        if (order.status.nextStatus != null)
                          _GradientActionButton(
                            label:
                                'Passer à : ${order.status.nextLabel}',
                            icon: Icons.arrow_forward_rounded,
                            onPressed: () => _updateStatus(
                              context,
                              ref,
                              statusNotifier,
                              order.status.nextStatus!.value,
                              order.status.nextLabel!,
                            ),
                          ),
                        if (order.status != OrderStatus.cancelled) ...[
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
                            label: Text('Annuler la commande',
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

  Future<void> _updateStatus(
    BuildContext context,
    WidgetRef ref,
    OrderStatusNotifier notifier,
    String status,
    String label, {
    bool isDangerous = false,
  }) async {
    final confirmed = await ConfirmDialog.show(
      context,
      title: isDangerous ? 'Annuler la commande ?' : 'Changer le statut',
      message: isDangerous
          ? 'Voulez-vous vraiment annuler cette commande ?'
          : 'Confirmer le passage du statut à "$label" ?',
      confirmLabel: label,
      isDangerous: isDangerous,
    );

    if (confirmed != true) return;

    await notifier.updateStatus(order.id, status);

    if (context.mounted) {
      final state = ref.read(orderStatusNotifierProvider);
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
        ref.invalidate(orderDetailProvider(order.id));
        ref.invalidate(ordersProvider);
        ref.invalidate(recentOrdersProvider);
      }
    }
  }
}

class _StatusStepper extends StatelessWidget {
  final List<OrderStatus> steps;
  final int currentIndex;

  const _StatusStepper(
      {required this.steps, required this.currentIndex});

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
          Text(
            'Progression',
            style: GoogleFonts.poppins(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: AppColors.textSecondary,
            ),
          ),
          const Gap(14),
          Row(
            children: List.generate(steps.length * 2 - 1, (i) {
              if (i.isOdd) {
                // Connector line
                final stepIndex = i ~/ 2;
                final isPast = stepIndex < currentIndex;
                return Expanded(
                  child: Container(
                    height: 2,
                    color: isPast ? AppColors.emerald : AppColors.border,
                  ),
                );
              }
              final stepIndex = i ~/ 2;
              final isPast = stepIndex < currentIndex;
              final isCurrent = stepIndex == currentIndex;
              final step = steps[stepIndex];

              return Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 28,
                    height: 28,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: isPast
                          ? AppColors.emerald
                          : isCurrent
                              ? AppColors.brand
                              : AppColors.surfaceHigh,
                      border: Border.all(
                        color: isPast
                            ? AppColors.emerald
                            : isCurrent
                                ? AppColors.brand
                                : AppColors.border,
                        width: 2,
                      ),
                    ),
                    child: Center(
                      child: isPast
                          ? const Icon(Icons.check_rounded,
                              color: AppColors.textPrimary, size: 14)
                          : Text(
                              '${stepIndex + 1}',
                              style: GoogleFonts.poppins(
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                                color: isCurrent
                                    ? AppColors.textPrimary
                                    : AppColors.textMuted,
                              ),
                            ),
                    ),
                  ),
                  const Gap(4),
                  Text(
                    _stepLabel(step),
                    style: GoogleFonts.poppins(
                      fontSize: 9,
                      fontWeight: isCurrent
                          ? FontWeight.w700
                          : FontWeight.w400,
                      color: isCurrent
                          ? AppColors.brand
                          : isPast
                              ? AppColors.emerald
                              : AppColors.textMuted,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              );
            }),
          ),
        ],
      ),
    );
  }

  String _stepLabel(OrderStatus status) {
    switch (status) {
      case OrderStatus.pending:
        return 'Reçue';
      case OrderStatus.confirmed:
        return 'Confirmée';
      case OrderStatus.preparing:
        return 'Préparation';
      case OrderStatus.ready:
        return 'Prête';
      case OrderStatus.delivered:
        return 'Terminée';
      default:
        return status.label;
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
              Icon(icon, size: 16, color: AppColors.brand),
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

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _InfoRow({
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

class _OrderItemRow extends StatelessWidget {
  final OrderItem item;

  const _OrderItemRow({required this.item});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 30,
            height: 30,
            decoration: BoxDecoration(
              color: AppColors.brand.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Center(
              child: Text(
                '${item.quantity}x',
                style: GoogleFonts.poppins(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: AppColors.brand,
                ),
              ),
            ),
          ),
          const Gap(12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.menuItemName,
                  style: GoogleFonts.poppins(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    color: AppColors.textPrimary,
                  ),
                ),
                if (item.specialInstructions != null &&
                    item.specialInstructions!.isNotEmpty)
                  Text(
                    item.specialInstructions!,
                    style: GoogleFonts.poppins(
                      fontSize: 12,
                      color: AppColors.textMuted,
                      fontStyle: FontStyle.italic,
                    ),
                  ),
              ],
            ),
          ),
          const Gap(8),
          Text(
            CurrencyUtils.formatAmount(item.subtotal),
            style: GoogleFonts.poppins(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }
}

class _GradientActionButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final VoidCallback onPressed;

  const _GradientActionButton({
    required this.label,
    required this.icon,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onPressed,
      child: Container(
        height: 50,
        decoration: BoxDecoration(
          gradient: AppColors.brandGradient,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: AppColors.brand.withValues(alpha: 0.35),
              blurRadius: 16,
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
