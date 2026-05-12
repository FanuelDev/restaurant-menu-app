// lib/features/cart/cart_sheet.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/models/models.dart';
import '../../core/providers/providers.dart';
import '../../core/utils/price_formatter.dart';

class CartSheet extends ConsumerWidget {
  const CartSheet({super.key});

  static Future<void> show(BuildContext context) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
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
      initialChildSize: 0.6,
      minChildSize: 0.4,
      maxChildSize: 0.92,
      builder: (_, scrollCtrl) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          children: [
            // Handle
            Container(
              margin: const EdgeInsets.only(top: 12, bottom: 4),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                  color: Colors.black12,
                  borderRadius: BorderRadius.circular(2)),
            ),

            // Header
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 8, 8, 8),
              child: Row(
                children: [
                  const Text('Mon panier',
                      style: TextStyle(
                          fontSize: 18, fontWeight: FontWeight.w800)),
                  const Spacer(),
                  if (items.isNotEmpty)
                    TextButton(
                      onPressed: () =>
                          ref.read(cartProvider.notifier).clear(),
                      child: const Text('Vider',
                          style: TextStyle(color: Colors.black38)),
                    ),
                  IconButton(
                    icon: const Icon(Icons.close_rounded),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
            ),

            const Divider(height: 1),

            // Items
            if (items.isEmpty)
              Expanded(
                child: Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text('ðŸ›’', style: TextStyle(fontSize: 48)),
                      const SizedBox(height: 12),
                      const Text('Votre panier est vide',
                          style: TextStyle(
                              fontSize: 16, fontWeight: FontWeight.w600)),
                      const SizedBox(height: 8),
                      const Text('Ajoutez des plats depuis le menu',
                          style:
                              TextStyle(color: Colors.black38, fontSize: 13)),
                    ],
                  ),
                ),
              )
            else
              Expanded(
                child: ListView.separated(
                  controller: scrollCtrl,
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  itemCount: items.length,
                  separatorBuilder: (_, __) =>
                      const Divider(height: 1, indent: 76),
                  itemBuilder: (_, i) => _CartItemTile(
                    cartItem: items[i],
                    brandColor: brand,
                    currency: currency,
                  ),
                ),
              ),

            // Footer
            if (items.isNotEmpty) ...[
              const Divider(height: 1),
              SafeArea(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 12, 20, 12),
                  child: Column(
                    children: [
                      // Total row
                      Row(
                        children: [
                          const Text('Total',
                              style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                  color: Colors.black54)),
                          const Spacer(),
                          Text(
                            formatPrice(total, currency),
                            style: TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.w800,
                                color: brand),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      // Checkout button
                      SizedBox(
                        width: double.infinity,
                        child: FilledButton(
                          onPressed: hasOrders
                              ? () {
                                  Navigator.pop(context);
                                  context.push(
                                      '/checkout/${restaurant?.slug ?? ''}');
                                }
                              : null,
                          style: FilledButton.styleFrom(
                            backgroundColor: brand,
                            padding:
                                const EdgeInsets.symmetric(vertical: 16),
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(14)),
                          ),
                          child: const Text(
                            'Passer la commande',
                            style: TextStyle(
                                fontSize: 16, fontWeight: FontWeight.w700),
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

// â”€â”€ Cart item tile â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class _CartItemTile extends ConsumerWidget {
  final CartItem cartItem;
  final Color brandColor;
  final String currency;
  const _CartItemTile({
    required this.cartItem,
    required this.brandColor,
    required this.currency,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final item = cartItem.item;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      child: Row(
        children: [
          // Image
          ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: item.imageUrl != null
                ? Image.network(item.imageUrl!,
                    width: 52,
                    height: 52,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => _PlaceholderImg())
                : _PlaceholderImg(),
          ),
          const SizedBox(width: 12),
          // Name + price
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(item.name,
                    style: const TextStyle(
                        fontSize: 14, fontWeight: FontWeight.w700),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis),
                Text(
                  item.priceFormatted ?? formatPrice(item.price, currency),
                  style:
                      TextStyle(fontSize: 13, color: brandColor.withValues(alpha: 0.8)),
                ),
              ],
            ),
          ),
          // Qty controls
          Row(
            children: [
              _SmallBtn(
                icon: Icons.remove,
                color: brandColor,
                onTap: () =>
                    ref.read(cartProvider.notifier).remove(item.id),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: Text(
                  '${cartItem.qty}',
                  style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                      color: brandColor),
                ),
              ),
              _SmallBtn(
                icon: Icons.add,
                color: brandColor,
                onTap: () => ref.read(cartProvider.notifier).add(item),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _PlaceholderImg extends StatelessWidget {
  @override
  Widget build(BuildContext context) => Container(
        width: 52,
        height: 52,
        color: Colors.grey[100],
        child: const Center(
            child: Text('ðŸ½ï¸', style: TextStyle(fontSize: 20))),
      );
}

class _SmallBtn extends StatelessWidget {
  final IconData icon;
  final Color color;
  final VoidCallback onTap;
  const _SmallBtn(
      {required this.icon, required this.color, required this.onTap});
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 28,
        height: 28,
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(7),
        ),
        child: Icon(icon, size: 14, color: color),
      ),
    );
  }
}

