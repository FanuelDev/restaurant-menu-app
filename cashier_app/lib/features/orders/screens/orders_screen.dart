import 'package:flutter/material.dart';
import '../../../core/utils/currency_provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gap/gap.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/date_utils.dart';
import '../../../core/utils/currency_utils.dart';
import '../models/order_models.dart';
import '../providers/orders_provider.dart';
import '../../../shared/widgets/status_badge.dart';
import '../../../shared/widgets/loading_shimmer.dart';
import '../../../shared/widgets/error_widget.dart';
import '../../../shared/widgets/empty_state.dart';

class OrdersScreen extends ConsumerStatefulWidget {
  const OrdersScreen({super.key});

  @override
  ConsumerState<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends ConsumerState<OrdersScreen> {
  final _searchController = TextEditingController();
  String _search = '';
  String _activeStatus = '';

  final _filters = [
    ('Tous', ''),
    ('En attente', 'pending'),
    ('Confirmé', 'confirmed'),
    ('En préparation', 'preparing'),
    ('Prêt', 'ready'),
    ('Terminé', 'delivered'),
    ('Annulé', 'cancelled'),
  ];

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _applyFilter(String status) {
    setState(() => _activeStatus = status);
    ref.read(ordersFilterProvider.notifier).state = {
      'page': 1,
      'perPage': 20,
      'status': status,
      'search': _search,
    };
    ref.invalidate(ordersProvider);
  }

  void _onSearchChanged(String value) {
    setState(() => _search = value);
    ref.read(ordersFilterProvider.notifier).state = {
      'page': 1,
      'perPage': 20,
      'status': _activeStatus,
      'search': value,
    };
    ref.invalidate(ordersProvider);
  }

  @override
  Widget build(BuildContext context) {
    final ordersAsync = ref.watch(ordersProvider);
    final topPadding = MediaQuery.of(context).padding.top;
    final currency = ref.watch(currencyProvider);

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
                        'Commandes',
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
                      onPressed: () => ref.invalidate(ordersProvider),
                    ),
                    const Gap(4),
                    GestureDetector(
                      onTap: () => context.push('/orders/create'),
                      child: Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          gradient: AppColors.brandGradient,
                          borderRadius: BorderRadius.circular(12),
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.brand.withValues(alpha: 0.35),
                              blurRadius: 12,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: const Icon(Icons.add_rounded,
                            color: AppColors.textOnDark, size: 22),
                      ),
                    ),
                  ],
                ),
                const Gap(14),
                // Search bar
                Container(
                  height: 44,
                  decoration: BoxDecoration(
                    color: AppColors.surfaceHigh,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: TextField(
                    controller: _searchController,
                    onChanged: _onSearchChanged,
                    style: GoogleFonts.poppins(
                        fontSize: 14, color: AppColors.textPrimary),
                    decoration: InputDecoration(
                      hintText: 'Rechercher...',
                      hintStyle: GoogleFonts.poppins(
                          fontSize: 14, color: AppColors.textMuted),
                      prefixIcon: const Icon(Icons.search_rounded,
                          size: 18, color: AppColors.textMuted),
                      suffixIcon: _search.isNotEmpty
                          ? IconButton(
                              icon: const Icon(Icons.clear,
                                  size: 16, color: AppColors.textMuted),
                              onPressed: () {
                                _searchController.clear();
                                _onSearchChanged('');
                              },
                            )
                          : null,
                      border: InputBorder.none,
                      isDense: true,
                      contentPadding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 12),
                    ),
                  ),
                ),
                const Gap(12),
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
                                ? AppColors.brand
                                : AppColors.surfaceHigh,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: isActive
                                  ? AppColors.brand
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

          // Order list
          Expanded(
            child: ordersAsync.when(
              data: (paginated) => paginated.data.isEmpty
                  ? EmptyState(
                      icon: Icons.receipt_long_outlined,
                      title: 'Aucune commande',
                      subtitle: 'Les commandes apparaîtront ici',
                      actionLabel: 'Nouvelle commande',
                      onAction: () => context.push('/orders/create'),
                    )
                  : RefreshIndicator(
                      color: AppColors.brand,
                      backgroundColor: AppColors.surfaceHigh,
                      onRefresh: () async =>
                          ref.invalidate(ordersProvider),
                      child: ListView.builder(
                        padding: const EdgeInsets.fromLTRB(16, 4, 16, 100),
                        itemCount: paginated.data.length,
                        itemBuilder: (_, index) => Padding(
                          padding: const EdgeInsets.only(bottom: 10),
                          child: _OrderCard(order: paginated.data[index], currency: currency)
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
                onRetry: () => ref.invalidate(ordersProvider),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _OrderCard extends StatelessWidget {
  final Order order;
  final String currency;

  const _OrderCard({required this.order, required this.currency});

  @override
  Widget build(BuildContext context) {
    final statusColor = AppColors.statusColor(order.status.value);

    return Material(
      color: Colors.transparent,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        onTap: () => context.push('/orders/${order.id}'),
        borderRadius: BorderRadius.circular(14),
        child: Stack(
          children: [
            Container(
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.border),
              ),
              padding: const EdgeInsets.fromLTRB(20, 16, 16, 16),
              child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          order.orderNumber,
                          style: GoogleFonts.poppins(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        if (order.isGift) ...[
                          const Gap(6),
                          const Icon(Icons.card_giftcard_rounded,
                              size: 15, color: AppColors.purple),
                        ],
                        const Spacer(),
                        Text(
                          AppDateUtils.formatRelative(order.createdAt),
                          style: GoogleFonts.poppins(
                            fontSize: 11,
                            color: AppColors.textMuted,
                          ),
                        ),
                      ],
                    ),
                    const Gap(4),
                    Text(
                      order.customerName,
                      style: GoogleFonts.poppins(
                        fontSize: 13,
                        color: AppColors.textSecondary,
                      ),
                    ),
                    const Gap(6),
                    Row(
                      children: [
                        if (order.items.isNotEmpty)
                          Text(
                            '${order.items.length} article${order.items.length > 1 ? 's' : ''}',
                            style: GoogleFonts.poppins(
                              fontSize: 11,
                              color: AppColors.textMuted,
                            ),
                          ),
                        const Spacer(),
                        OrderStatusBadge(
                            status: order.status, compact: true),
                      ],
                    ),
                  ],
                ),
              ),
              const Gap(12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    CurrencyUtils.formatAmount(order.total, currency: currency),
                    style: GoogleFonts.poppins(
                      fontSize: 17,
                      fontWeight: FontWeight.w700,
                      color: AppColors.brand,
                    ),
                  ),
                  const Gap(4),
                  const Icon(Icons.chevron_right_rounded,
                      color: AppColors.textMuted, size: 18),
                ],
              ),
            ],
              ),
            ),
            // Left accent bar
            Positioned(
              left: 0,
              top: 0,
              bottom: 0,
              child: Container(
                width: 4,
                decoration: BoxDecoration(
                  color: statusColor,
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(14),
                    bottomLeft: Radius.circular(14),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
