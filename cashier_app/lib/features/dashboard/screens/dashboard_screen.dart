import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gap/gap.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/date_utils.dart';
import '../../../core/utils/currency_utils.dart';
import '../../auth/providers/auth_provider.dart';
import '../../orders/providers/orders_provider.dart';
import '../../orders/models/order_models.dart';
import '../providers/dashboard_provider.dart';
import '../../../shared/widgets/status_badge.dart';
import '../../../shared/widgets/loading_shimmer.dart';
import '../../../shared/widgets/error_widget.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider).valueOrNull;
    final statsAsync = ref.watch(dashboardStatsProvider);
    final recentOrdersAsync = ref.watch(recentOrdersProvider);

    final firstName = authState?.user.firstName ?? '';
    final restaurantName = authState?.restaurant.name ?? '';
    final hasOrders = authState?.restaurant.hasOrders ?? false;
    final hasReservations = authState?.restaurant.hasReservations ?? false;
    final topPadding = MediaQuery.of(context).padding.top;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: RefreshIndicator(
        color: AppColors.brand,
        backgroundColor: AppColors.surfaceHigh,
        onRefresh: () async {
          ref.invalidate(dashboardStatsProvider);
          ref.invalidate(recentOrdersProvider);
        },
        child: CustomScrollView(
          slivers: [
            // Custom App Bar
            SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.fromLTRB(20, topPadding + 16, 20, 0),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Tableau de bord',
                            style: GoogleFonts.poppins(
                              fontSize: 22,
                              fontWeight: FontWeight.w700,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          Text(
                            restaurantName,
                            style: GoogleFonts.poppins(
                              fontSize: 13,
                              color: AppColors.textMuted,
                            ),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.refresh_rounded,
                          color: AppColors.textSecondary),
                      onPressed: () {
                        ref.invalidate(dashboardStatsProvider);
                        ref.invalidate(recentOrdersProvider);
                      },
                    ),
                  ],
                ),
              ),
            ),

            SliverPadding(
              padding: const EdgeInsets.all(20),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  // Greeting Card
                  _GreetingCard(
                    firstName: firstName,
                    restaurantName: restaurantName,
                  )
                      .animate()
                      .fadeIn(duration: 400.ms)
                      .slideY(begin: 0.1, curve: Curves.easeOutCubic),

                  const Gap(20),

                  // Stats grid
                  statsAsync.when(
                    data: (stats) => _StatsSection(
                      pendingOrders: stats.pendingOrders,
                      totalOrders: stats.totalOrders,
                      totalReservations: stats.totalReservations,
                      hasReservations: hasReservations,
                    )
                        .animate()
                        .fadeIn(duration: 400.ms, delay: 100.ms)
                        .slideY(
                            begin: 0.1,
                            delay: 100.ms,
                            curve: Curves.easeOutCubic),
                    loading: () => _StatsLoadingSection(
                        hasReservations: hasReservations),
                    error: (e, _) => const SizedBox.shrink(),
                  ),

                  const Gap(24),

                  // Quick actions
                  Text(
                    'Actions rapides',
                    style: GoogleFonts.poppins(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textSecondary,
                    ),
                  )
                      .animate()
                      .fadeIn(duration: 400.ms, delay: 200.ms),
                  const Gap(12),
                  Row(
                    children: [
                      if (hasOrders) ...[
                        Expanded(
                          child: _QuickActionCard(
                            icon: Icons.add_shopping_cart_rounded,
                            label: 'Nouvelle\ncommande',
                            color: AppColors.brand,
                            onTap: () => context.push('/orders/create'),
                          )
                              .animate()
                              .fadeIn(duration: 400.ms, delay: 250.ms)
                              .slideY(begin: 0.15, delay: 250.ms),
                        ),
                        const Gap(12),
                      ],
                      if (hasReservations) ...[
                        Expanded(
                          child: _QuickActionCard(
                            icon: Icons.calendar_today_rounded,
                            label: 'Nouvelle\nréservation',
                            color: AppColors.info,
                            onTap: () => context.push('/reservations/create'),
                          )
                              .animate()
                              .fadeIn(duration: 400.ms, delay: 300.ms)
                              .slideY(begin: 0.15, delay: 300.ms),
                        ),
                        const Gap(12),
                      ],
                      Expanded(
                        child: _QuickActionCard(
                          icon: Icons.qr_code_scanner_rounded,
                          label: 'Scanner\nQR cadeau',
                          color: AppColors.emerald,
                          onTap: () => context.go('/scanner'),
                        )
                            .animate()
                            .fadeIn(duration: 400.ms, delay: 350.ms)
                            .slideY(begin: 0.15, delay: 350.ms),
                      ),
                    ],
                  ),

                  const Gap(28),

                  // Recent orders
                  if (hasOrders) ...[
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Dernières commandes',
                          style: GoogleFonts.poppins(
                            fontSize: 15,
                            fontWeight: FontWeight.w600,
                            color: AppColors.textSecondary,
                          ),
                        ),
                        TextButton(
                          onPressed: () => context.go('/orders'),
                          child: Text(
                            'Voir tout',
                            style: GoogleFonts.poppins(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: AppColors.brand,
                            ),
                          ),
                        ),
                      ],
                    )
                        .animate()
                        .fadeIn(duration: 400.ms, delay: 400.ms),
                    const Gap(10),
                    recentOrdersAsync.when(
                      data: (orders) => orders.isEmpty
                          ? Padding(
                              padding:
                                  const EdgeInsets.symmetric(vertical: 16),
                              child: Center(
                                child: Text(
                                  'Aucune commande récente',
                                  style: GoogleFonts.poppins(
                                      color: AppColors.textMuted,
                                      fontSize: 14),
                                ),
                              ),
                            )
                          : Column(
                              children: List.generate(orders.length, (i) {
                                return Padding(
                                  padding: const EdgeInsets.only(bottom: 10),
                                  child: _RecentOrderCard(order: orders[i])
                                      .animate()
                                      .fadeIn(
                                          duration: 400.ms,
                                          delay: (450 + i * 50).ms)
                                      .slideY(
                                          begin: 0.1,
                                          delay: (450 + i * 50).ms,
                                          curve: Curves.easeOutCubic),
                                );
                              }),
                            ),
                      loading: () =>
                          const LoadingShimmer(itemCount: 3, itemHeight: 80),
                      error: (e, _) => AppErrorWidget(
                        message: e.toString(),
                        onRetry: () => ref.invalidate(recentOrdersProvider),
                      ),
                    ),
                  ],

                  const Gap(100),
                ]),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _GreetingCard extends StatelessWidget {
  final String firstName;
  final String restaurantName;

  const _GreetingCard(
      {required this.firstName, required this.restaurantName});

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final formatter = DateFormat('EEEE d MMMM', 'fr_FR');
    final dateStr = formatter.format(now);
    final timeStr = DateFormat('HH:mm').format(now);

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: AppColors.brandGradient,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: AppColors.brand.withValues(alpha: 0.3),
            blurRadius: 24,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Bonjour, $firstName',
                  style: GoogleFonts.poppins(
                    fontSize: 22,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
                const Gap(4),
                Text(
                  restaurantName,
                  style: GoogleFonts.poppins(
                    fontSize: 13,
                    color: AppColors.textPrimary.withValues(alpha: 0.7),
                  ),
                ),
                const Gap(8),
                Text(
                  '$dateStr · $timeStr',
                  style: GoogleFonts.poppins(
                    fontSize: 12,
                    color: AppColors.textPrimary.withValues(alpha: 0.6),
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Icon(
              Icons.restaurant_menu,
              color: AppColors.textPrimary,
              size: 28,
            ),
          ),
        ],
      ),
    );
  }
}

class _StatsSection extends StatelessWidget {
  final int pendingOrders;
  final int totalOrders;
  final int totalReservations;
  final bool hasReservations;

  const _StatsSection({
    required this.pendingOrders,
    required this.totalOrders,
    required this.totalReservations,
    required this.hasReservations,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _StatCard(
            title: 'En attente',
            value: pendingOrders,
            icon: Icons.pending_actions_rounded,
            color: AppColors.amber,
            accentColor: AppColors.amber,
          ),
        ),
        const Gap(12),
        Expanded(
          child: _StatCard(
            title: 'Commandes',
            value: totalOrders,
            icon: Icons.receipt_long_rounded,
            color: AppColors.brand,
            accentColor: AppColors.brand,
          ),
        ),
        if (hasReservations) ...[
          const Gap(12),
          Expanded(
            child: _StatCard(
              title: 'Réservations',
              value: totalReservations,
              icon: Icons.calendar_month_rounded,
              color: AppColors.info,
              accentColor: AppColors.info,
            ),
          ),
        ],
      ],
    );
  }
}

class _StatCard extends StatelessWidget {
  final String title;
  final int value;
  final IconData icon;
  final Color color;
  final Color accentColor;

  const _StatCard({
    required this.title,
    required this.value,
    required this.icon,
    required this.color,
    required this.accentColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border(
          left: BorderSide(color: accentColor, width: 3),
          top: const BorderSide(color: AppColors.border),
          right: const BorderSide(color: AppColors.border),
          bottom: const BorderSide(color: AppColors.border),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 20),
          const Gap(10),
          TweenAnimationBuilder<double>(
            tween: Tween(begin: 0, end: value.toDouble()),
            duration: const Duration(milliseconds: 800),
            curve: Curves.easeOutCubic,
            builder: (context, animVal, _) => Text(
              animVal.round().toString(),
              style: GoogleFonts.poppins(
                fontSize: 28,
                fontWeight: FontWeight.w800,
                color: color,
                height: 1,
              ),
            ),
          ),
          const Gap(4),
          Text(
            title,
            style: GoogleFonts.poppins(
              fontSize: 11,
              color: AppColors.textMuted,
            ),
          ),
        ],
      ),
    );
  }
}

class _StatsLoadingSection extends StatelessWidget {
  final bool hasReservations;
  const _StatsLoadingSection({required this.hasReservations});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const Expanded(child: StatCardShimmer()),
        const Gap(12),
        const Expanded(child: StatCardShimmer()),
        if (hasReservations) ...[
          const Gap(12),
          const Expanded(child: StatCardShimmer()),
        ],
      ],
    );
  }
}

class _QuickActionCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _QuickActionCard({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.border),
          ),
          child: Column(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.12),
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, color: color, size: 22),
              ),
              const Gap(10),
              Text(
                label,
                style: GoogleFonts.poppins(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textSecondary,
                  height: 1.3,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _RecentOrderCard extends StatelessWidget {
  final Order order;

  const _RecentOrderCard({required this.order});

  @override
  Widget build(BuildContext context) {
    final statusColor = AppColors.statusColor(order.status.value);

    return Material(
      color: Colors.transparent,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        onTap: () => context.push('/orders/${order.id}'),
        borderRadius: BorderRadius.circular(14),
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(14),
            border: Border(
              left: BorderSide(color: statusColor, width: 3),
              top: const BorderSide(color: AppColors.border),
              right: const BorderSide(color: AppColors.border),
              bottom: const BorderSide(color: AppColors.border),
            ),
          ),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      order.orderNumber,
                      style: GoogleFonts.poppins(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const Gap(3),
                    Text(
                      order.customerName,
                      style: GoogleFonts.poppins(
                        fontSize: 12,
                        color: AppColors.textSecondary,
                      ),
                    ),
                    const Gap(3),
                    Text(
                      AppDateUtils.formatRelative(order.createdAt),
                      style: GoogleFonts.poppins(
                        fontSize: 11,
                        color: AppColors.textMuted,
                      ),
                    ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  OrderStatusBadge(status: order.status, compact: true),
                  const Gap(6),
                  Text(
                    CurrencyUtils.formatAmount(order.total),
                    style: GoogleFonts.poppins(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: AppColors.brand,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
