// lib/features/menu/widgets/shared_widgets.dart
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/models/models.dart';
import '../../../core/providers/providers.dart';
import '../../../core/utils/price_formatter.dart';
import '../../cart/cart_sheet.dart';

// â”€â”€ Cart FAB â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class CartFab extends ConsumerWidget {
  final Color brandColor;
  const CartFab({super.key, required this.brandColor});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final count = ref.watch(cartCountProvider);
    if (count == 0) return const SizedBox.shrink();
    final restaurant = ref.watch(restaurantProvider).restaurant;
    final total = ref.watch(cartProvider.notifier).total;
    return Positioned(
      bottom: 20,
      left: 20,
      right: 20,
      child: GestureDetector(
        onTap: () => CartSheet.show(context),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          decoration: BoxDecoration(
            color: brandColor,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [BoxShadow(color: brandColor.withValues(alpha: 0.4), blurRadius: 16, offset: const Offset(0, 6))],
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                    color: Colors.white24, borderRadius: BorderRadius.circular(8)),
                child: Text('$count',
                    style: const TextStyle(
                        color: Colors.white, fontWeight: FontWeight.w800, fontSize: 13)),
              ),
              const SizedBox(width: 12),
              const Expanded(
                child: Text('Voir mon panier',
                    style: TextStyle(
                        color: Colors.white, fontWeight: FontWeight.w700, fontSize: 15)),
              ),
              Text(
                formatPrice(total, restaurant?.currency ?? 'XOF'),
                style: const TextStyle(
                    color: Colors.white, fontWeight: FontWeight.w800, fontSize: 15),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// â”€â”€ Dish image â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
    if (url == null || url!.isEmpty) {
      return Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: Colors.grey[100],
          borderRadius: borderRadius,
        ),
        child: const Center(
            child: Text('ðŸ½ï¸', style: TextStyle(fontSize: 32))),
      );
    }
    Widget img = CachedNetworkImage(
      imageUrl: url!,
      width: width,
      height: height,
      fit: fit,
      placeholder: (_, __) => Container(
        color: Colors.grey[100],
        child: const Center(child: CircularProgressIndicator(strokeWidth: 2)),
      ),
      errorWidget: (_, __, ___) => Container(
        color: Colors.grey[100],
        child: const Center(child: Text('ðŸ½ï¸', style: TextStyle(fontSize: 32))),
      ),
    );
    if (borderRadius != null) {
      img = ClipRRect(borderRadius: borderRadius!, child: img);
    }
    return img;
  }
}

// â”€â”€ Badge chip â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class BadgeChip extends StatelessWidget {
  final String badge;
  final bool dark;
  const BadgeChip({super.key, required this.badge, this.dark = false});

  static const _labels = {
    'new': 'Nouveau',
    'popular': 'Populaire',
    'vegetarian': 'VÃ©gÃ©tarien',
    'spicy': 'Ã‰picÃ©',
  };

  static const _colors = {
    'new': Color(0xFF3B82F6),
    'popular': Color(0xFFF59E0B),
    'vegetarian': Color(0xFF10B981),
    'spicy': Color(0xFFEF4444),
  };

  @override
  Widget build(BuildContext context) {
    final label = _labels[badge] ?? badge;
    final color = _colors[badge] ?? Colors.grey;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: dark ? color.withValues(alpha: 0.9) : color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(6),
        border: dark ? null : Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: dark ? Colors.white : color,
          fontSize: 10,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.3,
        ),
      ),
    );
  }
}

// â”€â”€ Qty control â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class QtyControl extends ConsumerWidget {
  final MenuItem item;
  final Color brandColor;
  const QtyControl({super.key, required this.item, required this.brandColor});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final qty = ref.watch(cartProvider.notifier).qty(item.id);
    if (qty == 0) {
      return GestureDetector(
        onTap: () => ref.read(cartProvider.notifier).add(item),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          decoration: BoxDecoration(
            color: brandColor,
            borderRadius: BorderRadius.circular(10),
          ),
          child: const Text('+ Ajouter',
              style: TextStyle(
                  color: Colors.white,
                  fontSize: 13,
                  fontWeight: FontWeight.w700)),
        ),
      );
    }
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        _QtyBtn(
            icon: Icons.remove,
            color: brandColor,
            onTap: () => ref.read(cartProvider.notifier).remove(item.id)),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 10),
          child: Text('$qty',
              style:
                  TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: brandColor)),
        ),
        _QtyBtn(
            icon: Icons.add,
            color: brandColor,
            onTap: () => ref.read(cartProvider.notifier).add(item)),
      ],
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
      child: Container(
        width: 32,
        height: 32,
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(icon, size: 16, color: color),
      ),
    );
  }
}

// â”€â”€ Hours bottom widget â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class HoursBand extends StatelessWidget {
  final Restaurant restaurant;
  final Color? bgColor;
  final Color? textColor;
  const HoursBand({super.key, required this.restaurant, this.bgColor, this.textColor});

  static const _days = [
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
  ];
  static const _labels = {
    'monday': 'LUN', 'tuesday': 'MAR', 'wednesday': 'MER',
    'thursday': 'JEU', 'friday': 'VEN', 'saturday': 'SAM', 'sunday': 'DIM',
  };

  String _todayKey() {
    final w = DateTime.now().weekday; // 1=Mon â€¦ 7=Sun
    return _days[w - 1];
  }

  @override
  Widget build(BuildContext context) {
    final hours = restaurant.openingHours;
    if (hours == null || hours.isEmpty) return const SizedBox.shrink();

    final todayKey = _todayKey();
    final bg = bgColor ?? Colors.black.withValues(alpha: 0.04);
    final txt = textColor ?? Colors.black;

    return Container(
      color: bg,
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(vertical: 10),
        child: Row(
          children: _days.map((day) {
            final h = hours[day];
            final isToday = day == todayKey;
            final isClosed = h?.closed ?? (h == null);
            return Container(
              width: 72,
              padding: const EdgeInsets.symmetric(horizontal: 4),
              decoration: BoxDecoration(
                border: Border(right: BorderSide(color: txt.withValues(alpha: 0.08))),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    _labels[day]!,
                    style: TextStyle(
                      fontSize: 9,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 0.8,
                      color: isToday
                          ? restaurant.brandColorValue
                          : txt.withValues(alpha: 0.38),
                    ),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    isClosed ? 'FermÃ©' : '${h!.open}â€“${h.close}',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: isToday ? FontWeight.w700 : FontWeight.w500,
                      color: isClosed
                          ? txt.withValues(alpha: 0.25)
                          : isToday
                              ? txt
                              : txt.withValues(alpha: 0.6),
                    ),
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

// â”€â”€ Reservation & back buttons â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
    final color = iconColor ?? Colors.black87;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (showReservation)
          IconButton(
            onPressed: () => context.push('/reservation/${restaurant.slug}'),
            icon: Icon(Icons.calendar_today_outlined, color: color),
            tooltip: 'RÃ©server',
          ),
        IconButton(
          onPressed: () => context.go('/'),
          icon: Icon(Icons.qr_code_scanner_rounded, color: color),
          tooltip: 'Scanner un autre QR',
        ),
        IconButton(
          onPressed: () => context.push('/profile'),
          icon: Icon(Icons.person_outline_rounded, color: color),
          tooltip: 'Mon profil',
        ),
      ],
    );
  }
}

