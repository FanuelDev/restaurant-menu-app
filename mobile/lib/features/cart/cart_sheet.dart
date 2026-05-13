// lib/features/cart/cart_sheet.dart
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/models/models.dart';
import '../../core/providers/providers.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/price_formatter.dart';
import '../checkout/checkout_screen.dart';

class CartSheet extends ConsumerWidget {
  const CartSheet({super.key});

  static Future<void> show(BuildContext context) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      useSafeArea: true,
      builder: (_) => const CartSheet(),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final items = ref.watch(cartProvider);
    final total = ref.watch(cartProvider.notifier).total;
    final restaurant = ref.watch(restaurantProvider).restaurant;
    final brand = restaurant?.brandColorValue ?? const Color(0xFFC0392B);
    final currency = restaurant?.currency ?? 'XOF';
    final hasOrders =
        ref.watch(restaurantProvider).features?.ordersAndReservations ?? false;

    return DraggableScrollableSheet(
      initialChildSize: 0.55,
      minChildSize: 0.35,
      maxChildSize: 0.92,
      snap: true,
      snapSizes: const [0.55, 0.92],
      builder: (_, scrollCtrl) => Container(
        decoration: const BoxDecoration(
          color: AppTheme.surface,
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        child: Column(
          children: [
            // Handle
            Container(
              margin: const EdgeInsets.only(top: 12, bottom: 8),
              width: 36, height: 4,
              decoration: BoxDecoration(
                color: AppTheme.border,
                borderRadius: BorderRadius.circular(2),
              ),
            ),

            // Header
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 4, 12, 12),
              child: Row(
                children: [
                  Text('Mon panier', style: AppTheme.heading(AppTheme.charcoal)),
                  const Spacer(),
                  if (items.isNotEmpty)
                    TextButton(
                      onPressed: () {
                        HapticFeedback.lightImpact();
                        ref.read(cartProvider.notifier).clear();
                      },
                      style: TextButton.styleFrom(
                        foregroundColor: AppTheme.grey3,
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      ),
                      child: Text('Vider', style: AppTheme.caption(AppTheme.grey3)),
                    ),
                  IconButton(
                    icon: const Icon(Icons.close_rounded, color: AppTheme.grey2, size: 20),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
            ),

            const Divider(height: 1, color: AppTheme.border),

            // Content
            if (items.isEmpty)
              Expanded(child: _EmptyCart())
            else
              Expanded(
                child: ListView.separated(
                  controller: scrollCtrl,
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  itemCount: items.length,
                  separatorBuilder: (_, __) =>
                      const Divider(height: 1, color: AppTheme.border, indent: 80),
                  itemBuilder: (_, i) => _CartTile(
                    cartItem: items[i],
                    brandColor: brand,
                    currency: currency,
                  ),
                ),
              ),

            // Footer
            if (items.isNotEmpty) ...[
              const Divider(height: 1, color: AppTheme.border),
              SafeArea(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
                  child: Column(
                    children: [
                      Row(
                        children: [
                          Text('Total',
                              style: AppTheme.body(AppTheme.grey2).copyWith(fontSize: 15)),
                          const Spacer(),
                          TweenAnimationBuilder<double>(
                            tween: Tween(begin: total * 0.9, end: total),
                            duration: AppTheme.normal,
                            curve: AppTheme.spring,
                            builder: (_, v, __) => Text(
                              formatPrice(v, currency),
                              style: AppTheme.heading(brand).copyWith(fontSize: 20),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),
                      SizedBox(
                        width: double.infinity,
                        child: FilledButton(
                          onPressed: hasOrders
                              ? () {
                                  Navigator.pop(context);
                                  CheckoutScreen.show(context);
                                }
                              : null,
                          style: FilledButton.styleFrom(
                            backgroundColor: brand,
                            disabledBackgroundColor: AppTheme.grey4,
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(16)),
                            padding: const EdgeInsets.symmetric(vertical: 17),
                          ),
                          child: Text(
                            hasOrders ? 'Passer la commande' : 'Commandes non disponibles',
                            style: AppTheme.bodyBold(Colors.white).copyWith(fontSize: 16),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _EmptyCart extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 80, height: 80,
            decoration: const BoxDecoration(color: AppTheme.cream, shape: BoxShape.circle),
            child: const Icon(Icons.shopping_bag_outlined, size: 36, color: AppTheme.grey3),
          ),
          const SizedBox(height: 16),
          Text('Votre panier est vide', style: AppTheme.title(AppTheme.charcoal)),
          const SizedBox(height: 6),
          Text('Ajoutez des plats depuis le menu', style: AppTheme.caption(AppTheme.grey3)),
        ],
      ),
    );
  }
}

class _CartTile extends ConsumerWidget {
  final CartItem cartItem;
  final Color brandColor;
  final String currency;
  const _CartTile({required this.cartItem, required this.brandColor, required this.currency});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final item = cartItem.item;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: item.imageUrl != null
                ? Image.network(item.imageUrl!, width: 58, height: 58, fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => _Placeholder())
                : _Placeholder(),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(item.name,
                    style: AppTheme.caption(AppTheme.charcoal)
                        .copyWith(fontWeight: FontWeight.w700, fontSize: 14),
                    maxLines: 1, overflow: TextOverflow.ellipsis),
                const SizedBox(height: 3),
                Text(
                  item.priceFormatted ?? formatPrice(item.price, currency),
                  style: AppTheme.caption(brandColor).copyWith(fontWeight: FontWeight.w600),
                ),
              ],
            ),
          ),
          Row(
            children: [
              _SmallBtn(
                icon: cartItem.qty <= 1 ? Icons.delete_outline_rounded : Icons.remove_rounded,
                color: brandColor,
                onTap: () {
                  HapticFeedback.selectionClick();
                  ref.read(cartProvider.notifier).remove(item.id);
                },
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: Text('${cartItem.qty}',
                    style: AppTheme.bodyBold(brandColor).copyWith(fontSize: 16)),
              ),
              _SmallBtn(
                icon: Icons.add_rounded,
                color: brandColor,
                onTap: () {
                  HapticFeedback.selectionClick();
                  ref.read(cartProvider.notifier).add(item);
                },
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _Placeholder extends StatelessWidget {
  @override
  Widget build(BuildContext context) => Container(
        width: 58, height: 58,
        color: AppTheme.cream,
        child: const Icon(Icons.restaurant_rounded, color: AppTheme.grey4, size: 22),
      );
}

class _SmallBtn extends StatelessWidget {
  final IconData icon;
  final Color color;
  final VoidCallback onTap;
  const _SmallBtn({required this.icon, required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 30, height: 30,
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(9),
        ),
        child: Icon(icon, size: 15, color: color),
      ),
    );
  }
}
