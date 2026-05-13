// lib/features/menu/widgets/shared_widgets.dart
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shimmer/shimmer.dart';
import '../../../core/models/models.dart';
import '../../../core/providers/providers.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/price_formatter.dart';
import '../../cart/cart_sheet.dart';
import '../../checkout/checkout_screen.dart';

// ── Cart FAB ──────────────────────────────────────────────────────────────────

class CartFab extends ConsumerWidget {
  final Color brandColor;
  const CartFab({super.key, required this.brandColor});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cart = ref.watch(cartProvider);
    final count = ref.watch(cartCountProvider);
    final total = cart.fold<double>(0, (sum, c) => sum + c.subtotal);
    final restaurant = ref.watch(restaurantProvider).restaurant;
    final hasOrders =
        ref.watch(restaurantProvider).features?.ordersAndReservations ?? false;
    final currency = restaurant?.currency ?? 'XOF';

    return IgnorePointer(
      ignoring: count == 0,
      child: AnimatedSlide(
        offset: count == 0 ? const Offset(0, 0.3) : Offset.zero,
        duration: AppTheme.normal,
        curve: AppTheme.spring,
        child: AnimatedOpacity(
          opacity: count == 0 ? 0 : 1,
          duration: AppTheme.quick,
          child: Container(
            decoration: BoxDecoration(
              color: AppTheme.charcoal,
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: AppTheme.charcoal.withValues(alpha: 0.30),
                  blurRadius: 24,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: Row(
              children: [
                // ── Left: cart preview (tap to review) ──────────────────────
                Expanded(
                  child: GestureDetector(
                    onTap: () => CartSheet.show(context),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 18, vertical: 15),
                      child: Row(
                        children: [
                          // Count badge
                          TweenAnimationBuilder<double>(
                            tween: Tween(begin: 0.7, end: 1),
                            duration: AppTheme.quick,
                            curve: Curves.elasticOut,
                            builder: (_, v, child) =>
                                Transform.scale(scale: v, child: child),
                            child: Container(
                              width: 26,
                              height: 26,
                              decoration: BoxDecoration(
                                color: brandColor,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Center(
                                child: Text('$count',
                                    style: AppTheme.label(Colors.white)
                                        .copyWith(fontSize: 12)),
                              ),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  '$count article${count > 1 ? 's' : ''}',
                                  style: AppTheme.label(Colors.white70)
                                      .copyWith(fontSize: 11),
                                ),
                                Text(
                                  formatPrice(total, currency),
                                  style: AppTheme.bodyBold(Colors.white)
                                      .copyWith(fontSize: 15),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),

                // ── Divider ──────────────────────────────────────────────────
                Container(
                  width: 1,
                  height: 36,
                  color: Colors.white.withValues(alpha: 0.12),
                ),

                // ── Right: Commander button ──────────────────────────────────
                GestureDetector(
                  onTap: hasOrders
                      ? () => CheckoutScreen.show(context)
                      : () => CartSheet.show(context),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 20, vertical: 15),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          'Commander',
                          style: AppTheme.bodyBold(
                                  hasOrders ? brandColor : Colors.white54)
                              .copyWith(fontSize: 15),
                        ),
                        const SizedBox(width: 6),
                        Icon(
                          Icons.arrow_forward_rounded,
                          size: 16,
                          color: hasOrders ? brandColor : Colors.white54,
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ── Dish image ────────────────────────────────────────────────────────────────

class DishImage extends StatelessWidget {
  final String? url;
  final double? width;
  final double? height;
  final BoxFit fit;
  final BorderRadius? borderRadius;

  const DishImage({
    super.key,
    this.url,
    this.width,
    this.height,
    this.fit = BoxFit.cover,
    this.borderRadius,
  });

  @override
  Widget build(BuildContext context) {
    Widget content;
    if (url == null || url!.isEmpty) {
      content = _Placeholder(width: width, height: height);
    } else {
      content = CachedNetworkImage(
        imageUrl: url!,
        width: width,
        height: height,
        fit: fit,
        placeholder: (_, __) => _ShimmerPlaceholder(width: width, height: height),
        errorWidget: (_, __, ___) =>
            _Placeholder(width: width, height: height),
      );
    }
    if (borderRadius != null) {
      content = ClipRRect(borderRadius: borderRadius!, child: content);
    }
    return content;
  }
}

class _ShimmerPlaceholder extends StatelessWidget {
  final double? width;
  final double? height;
  const _ShimmerPlaceholder({this.width, this.height});

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: AppTheme.border,
      highlightColor: AppTheme.cream,
      child: Container(
        width: width, height: height,
        color: AppTheme.border,
      ),
    );
  }
}

class _Placeholder extends StatelessWidget {
  final double? width;
  final double? height;
  const _Placeholder({this.width, this.height});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      height: height,
      color: AppTheme.cream,
      child: const Center(
        child: Icon(Icons.restaurant_rounded,
            color: AppTheme.grey4, size: 28),
      ),
    );
  }
}

// ── Badge chip ────────────────────────────────────────────────────────────────

class BadgeChip extends StatelessWidget {
  final String badge;
  final bool dark;
  const BadgeChip({super.key, required this.badge, this.dark = false});

  static const _labels = {
    'new': 'Nouveau',
    'popular': 'Populaire',
    'vegetarian': 'Végétarien',
    'spicy': 'Épicé',
  };

  static const _colors = {
    'new': AppTheme.badgeNew,
    'popular': AppTheme.badgePopular,
    'vegetarian': AppTheme.badgeVeg,
    'spicy': AppTheme.badgeSpicy,
  };

  @override
  Widget build(BuildContext context) {
    final label = _labels[badge] ?? badge;
    final color = _colors[badge] ?? AppTheme.grey2;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: dark ? color : color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(label,
          style: AppTheme.label(dark ? Colors.white : color)
              .copyWith(fontSize: 10)),
    );
  }
}

// ── Qty control ───────────────────────────────────────────────────────────────

class QtyControl extends ConsumerWidget {
  final MenuItem item;
  final Color brandColor;
  final bool compact;
  const QtyControl({
    super.key,
    required this.item,
    required this.brandColor,
    this.compact = false,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cart = ref.watch(cartProvider);
    final qty = cart.fold<int>(0, (q, c) => c.menuItem.id == item.id ? c.quantity : q);

    if (qty == 0) {
      return GestureDetector(
        onTap: () => ref.read(cartProvider.notifier).add(item),
        child: AnimatedContainer(
          duration: AppTheme.quick,
          curve: AppTheme.spring,
          padding: EdgeInsets.symmetric(
              horizontal: compact ? 10 : 14, vertical: compact ? 6 : 8),
          decoration: BoxDecoration(
            color: brandColor,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Text('+ Ajouter',
              style: AppTheme.label(Colors.white)
                  .copyWith(fontSize: compact ? 11 : 12)),
        ),
      );
    }

    return AnimatedContainer(
      duration: AppTheme.quick,
      curve: AppTheme.spring,
      decoration: BoxDecoration(
        color: brandColor.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _QtyBtn(
            icon: qty == 1 ? Icons.delete_outline_rounded : Icons.remove_rounded,
            color: brandColor,
            onTap: () => ref.read(cartProvider.notifier).remove(item.id),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 10),
            child: Text('$qty',
                style: AppTheme.bodyBold(brandColor).copyWith(fontSize: 15)),
          ),
          _QtyBtn(
            icon: Icons.add_rounded,
            color: brandColor,
            onTap: () => ref.read(cartProvider.notifier).add(item),
          ),
        ],
      ),
    );
  }
}

class _QtyBtn extends StatelessWidget {
  final IconData icon;
  final Color color;
  final VoidCallback onTap;
  const _QtyBtn({required this.icon, required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.all(6),
        child: Icon(icon, size: 16, color: color),
      ),
    );
  }
}

// ── Hours band ────────────────────────────────────────────────────────────────

class HoursBand extends StatelessWidget {
  final Restaurant restaurant;
  final Color? bgColor;
  final Color? textColor;
  const HoursBand({super.key, required this.restaurant, this.bgColor, this.textColor});

  static const _days = [
    'monday', 'tuesday', 'wednesday', 'thursday',
    'friday', 'saturday', 'sunday'
  ];
  static const _labels = {
    'monday': 'LUN', 'tuesday': 'MAR', 'wednesday': 'MER',
    'thursday': 'JEU', 'friday': 'VEN', 'saturday': 'SAM', 'sunday': 'DIM',
  };

  String _todayKey() => _days[DateTime.now().weekday - 1];

  @override
  Widget build(BuildContext context) {
    final hours = restaurant.openingHours;
    if (hours == null || hours.isEmpty) return const SizedBox.shrink();
    final todayKey = _todayKey();
    final bg = bgColor ?? AppTheme.cream;
    final txt = textColor ?? AppTheme.charcoal;

    return Container(
      color: bg,
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
        child: Row(
          children: _days.map((day) {
            final h = hours[day];
            final isToday = day == todayKey;
            final isClosed = h?.closed ?? (h == null);
            return Padding(
              padding: const EdgeInsets.only(right: 20),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(_labels[day]!,
                      style: AppTheme.label(
                          isToday ? restaurant.brandColorValue : txt.withValues(alpha: 0.35))
                          .copyWith(fontSize: 9)),
                  const SizedBox(height: 2),
                  if (isClosed)
                    Text('Fermé',
                        style: AppTheme.caption(txt.withValues(alpha: 0.25))
                            .copyWith(fontSize: 11))
                  else
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(h!.open,
                            style: AppTheme.caption(
                                isToday ? txt : txt.withValues(alpha: 0.55))
                                .copyWith(
                                fontWeight: isToday ? FontWeight.w700 : FontWeight.w500,
                                fontSize: 11)),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 3),
                          child: Icon(Icons.arrow_forward_rounded,
                              size: 9,
                              color: isToday
                                  ? restaurant.brandColorValue
                                  : txt.withValues(alpha: 0.35)),
                        ),
                        Text(h.close,
                            style: AppTheme.caption(
                                isToday ? txt : txt.withValues(alpha: 0.55))
                                .copyWith(
                                fontWeight: isToday ? FontWeight.w700 : FontWeight.w500,
                                fontSize: 11)),
                      ],
                    ),
                ],
              ),
            );
          }).toList(),
        ),
      ),
    );
  }
}

// ── App bar actions ───────────────────────────────────────────────────────────

class MenuAppBarActions extends ConsumerWidget {
  final Restaurant restaurant;
  final bool showReservation;
  final Color? iconColor;
  const MenuAppBarActions({
    super.key,
    required this.restaurant,
    this.showReservation = false,
    this.iconColor,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final color = iconColor ?? AppTheme.charcoal;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (showReservation)
          IconButton(
            onPressed: () =>
                context.push('/reservation/${restaurant.slug}'),
            icon: Icon(Icons.calendar_month_outlined, color: color, size: 22),
            tooltip: 'Réserver',
          ),
        IconButton(
          onPressed: () => context.go('/'),
          icon: Icon(Icons.qr_code_scanner_rounded, color: color, size: 22),
          tooltip: 'Scanner un autre QR',
        ),
      ],
    );
  }
}
