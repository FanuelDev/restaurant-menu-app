// lib/features/menu/templates/template_immersive.dart
// Template 3 — Immersif : swipe plein ecran (PageView vertical)
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';
import '../../../core/models/models.dart';
import '../../../core/providers/providers.dart';
import '../../../core/utils/price_formatter.dart';
import '../widgets/shared_widgets.dart';
import '../../cart/cart_sheet.dart';

class TemplateImmersive extends ConsumerStatefulWidget {
  final Restaurant restaurant;
  final List<Category> categories;
  final RestaurantFeatures? features;
  final VoidCallback? onRefresh;
  const TemplateImmersive({super.key, required this.restaurant, required this.categories, this.features, this.onRefresh});

  @override
  ConsumerState<TemplateImmersive> createState() => _State();
}

class _FlatDish {
  final MenuItem item;
  final String catName;
  final int index;
  final int total;
  _FlatDish({required this.item, required this.catName, required this.index, required this.total});
}

class _State extends ConsumerState<TemplateImmersive> {
  late List<_FlatDish> _dishes;
  final _pageCtrl = PageController();
  int _current = 0;
  bool _drawerOpen = false;

  @override
  void initState() {
    super.initState();
    _buildFlat();
  }

  void _buildFlat() {
    _dishes = [];
    for (final cat in widget.categories) {
      for (int i = 0; i < cat.menuItems.length; i++) {
        _dishes.add(_FlatDish(
          item: cat.menuItems[i],
          catName: cat.name,
          index: i,
          total: cat.menuItems.length,
        ));
      }
    }
  }

  @override
  void dispose() {
    _pageCtrl.dispose();
    super.dispose();
  }

  double get _progress => _dishes.isEmpty ? 0 : (_current + 1) / _dishes.length;

  void _navigate(int dir) {
    final next = (_current + dir).clamp(0, _dishes.length - 1);
    _pageCtrl.animateToPage(next,
        duration: const Duration(milliseconds: 400), curve: Curves.easeInOut);
  }

  @override
  Widget build(BuildContext context) {
    final brand = widget.restaurant.brandColorValue;
    final hasOrders = widget.features?.ordersAndReservations ?? false;
    final size = MediaQuery.sizeOf(context);

    if (_dishes.isEmpty) {
      return Scaffold(
        backgroundColor: Colors.black,
        body: Center(child: Text('Aucun plat disponible',
            style: TextStyle(color: Colors.white54, fontSize: 16))),
      );
    }

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // ── PageView ─────────────────────────────────────────────────────
          PageView.builder(
            controller: _pageCtrl,
            scrollDirection: Axis.vertical,
            itemCount: _dishes.length,
            onPageChanged: (i) => setState(() => _current = i),
            itemBuilder: (_, i) => _SlideCard(
              dish: _dishes[i],
              restaurant: widget.restaurant,
              hasOrders: hasOrders,
              brandColor: brand,
            ),
          ),

          // ── Progress bar ─────────────────────────────────────────────────
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: LinearProgressIndicator(
              value: _progress,
              backgroundColor: Colors.transparent,
              color: brand,
              minHeight: 3,
            ),
          ),

          // ── Top bar ──────────────────────────────────────────────────────
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: SafeArea(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Row(
                  children: [
                    GestureDetector(
                      onTap: () => setState(() => _drawerOpen = true),
                      child: Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: Colors.white12,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(Icons.menu_rounded, color: Colors.white, size: 20),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(widget.restaurant.name,
                          style: const TextStyle(
                              color: Colors.white, fontWeight: FontWeight.w700, fontSize: 16)),
                    ),
                    if (hasOrders && ref.watch(cartCountProvider) > 0)
                      GestureDetector(
                        onTap: () => CartSheet.show(context),
                        child: Stack(
                          clipBehavior: Clip.none,
                          children: [
                            Container(
                              width: 40,
                              height: 40,
                              decoration: BoxDecoration(
                                color: Colors.white12,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Icon(Icons.shopping_bag_outlined,
                                  color: Colors.white, size: 20),
                            ),
                            Positioned(
                              top: -4,
                              right: -4,
                              child: Container(
                                width: 18,
                                height: 18,
                                decoration: BoxDecoration(color: brand, shape: BoxShape.circle),
                                child: Center(
                                  child: Text('${ref.watch(cartCountProvider)}',
                                      style: const TextStyle(
                                          color: Colors.white, fontSize: 10, fontWeight: FontWeight.w800)),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    const SizedBox(width: 8),
                    if (widget.onRefresh != null) ...[
                      GestureDetector(
                        onTap: widget.onRefresh,
                        child: Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            color: Colors.white12,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Icon(Icons.refresh_rounded,
                              color: Colors.white, size: 20),
                        ),
                      ),
                      const SizedBox(width: 8),
                    ],
                    GestureDetector(
                      onTap: () => context.go('/'),
                      child: Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: Colors.white12,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(Icons.qr_code_scanner_rounded,
                            color: Colors.white, size: 20),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // ── Nav arrows (tablet) ───────────────────────────────────────────
          if (size.width > 600) ...[
            Positioned(
              right: 20,
              bottom: size.height / 2 + 30,
              child: _NavArrow(
                up: true,
                enabled: _current > 0,
                onTap: () => _navigate(-1),
              ),
            ),
            Positioned(
              right: 20,
              bottom: size.height / 2 - 70,
              child: _NavArrow(
                up: false,
                enabled: _current < _dishes.length - 1,
                onTap: () => _navigate(1),
              ),
            ),
          ],

          // ── Swipe hint on first slide ─────────────────────────────────────
          if (_current == 0)
            Positioned(
              bottom: 200,
              left: 0,
              right: 0,
              child: Column(
                children: [
                  const Icon(Icons.keyboard_arrow_down_rounded,
                      color: Colors.white38, size: 32),
                  const Text('Swipez pour explorer',
                      style: TextStyle(color: Colors.white38, fontSize: 12)),
                ],
              ),
            ),

          // ── Floating cart bar ────────────────────────────────────────────
          Positioned(
            bottom: 20,
            left: 16,
            right: 16,
            child: CartFab(brandColor: brand),
          ),

          // ── Category drawer ───────────────────────────────────────────────
          if (_drawerOpen) ...[
            GestureDetector(
              onTap: () => setState(() => _drawerOpen = false),
              child: Container(color: Colors.black54),
            ),
            _CategoryDrawer(
              restaurant: widget.restaurant,
              categories: widget.categories,
              dishes: _dishes,
              current: _current,
              pageCtrl: _pageCtrl,
              onClose: () => setState(() => _drawerOpen = false),
              onJump: (i) {
                setState(() => _drawerOpen = false);
                _pageCtrl.animateToPage(i,
                    duration: const Duration(milliseconds: 400),
                    curve: Curves.easeInOut);
              },
            ),
          ],
        ],
      ),
    );
  }
}

class _SlideCard extends ConsumerWidget {
  final _FlatDish dish;
  final Restaurant restaurant;
  final bool hasOrders;
  final Color brandColor;
  const _SlideCard({
    required this.dish,
    required this.restaurant,
    required this.hasOrders,
    required this.brandColor,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return SizedBox.expand(
      child: Stack(
        fit: StackFit.expand,
        children: [
          // Background image
          if (dish.item.imageUrl != null)
            CachedNetworkImage(imageUrl: dish.item.imageUrl!, fit: BoxFit.cover)
          else
            Container(color: const Color(0xFF1A1A2E)),

          // Gradient
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [Colors.transparent, Colors.transparent, Color(0xCC000000), Color(0xEE000000)],
                stops: [0, 0.3, 0.7, 1],
              ),
            ),
          ),

          // Counter
          Positioned(
            top: 80,
            right: 20,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.white12,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                '${dish.index + 1}/${dish.total}',
                style: const TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.w600),
              ),
            ),
          ),

          // Content overlay
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: SafeArea(
              top: false,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(24, 0, 24, 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: brandColor,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(dish.catName,
                          style: const TextStyle(
                              color: Colors.white, fontSize: 11, fontWeight: FontWeight.w700)),
                    ),
                    if (dish.item.badge != null) ...[
                      const SizedBox(height: 6),
                      BadgeChip(badge: dish.item.badge!, dark: true),
                    ],
                    const SizedBox(height: 8),
                    Text(dish.item.name,
                        style: const TextStyle(
                            color: Colors.white,
                            fontSize: 28,
                            fontWeight: FontWeight.w800,
                            letterSpacing: -0.5,
                            height: 1.15)),
                    if (dish.item.description != null) ...[
                      const SizedBox(height: 8),
                      Text(dish.item.description!,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(color: Colors.white60, fontSize: 14, height: 1.5)),
                    ],
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Text(
                          dish.item.priceFormatted ??
                              formatPrice(dish.item.price, restaurant.currency),
                          style: TextStyle(
                              color: brandColor,
                              fontSize: 24,
                              fontWeight: FontWeight.w800),
                        ),
                        const Spacer(),
                        if (hasOrders)
                          QtyControl(item: dish.item, brandColor: brandColor),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _NavArrow extends StatelessWidget {
  final bool up;
  final bool enabled;
  final VoidCallback onTap;
  const _NavArrow({required this.up, required this.enabled, required this.onTap});
  @override
  Widget build(BuildContext context) {
    return Opacity(
      opacity: enabled ? 1.0 : 0.3,
      child: GestureDetector(
        onTap: enabled ? onTap : null,
        child: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.15),
            shape: BoxShape.circle,
            border: Border.all(color: Colors.white24),
          ),
          child: Icon(
            up ? Icons.keyboard_arrow_up_rounded : Icons.keyboard_arrow_down_rounded,
            color: Colors.white,
          ),
        ),
      ),
    );
  }
}

class _CategoryDrawer extends StatelessWidget {
  final Restaurant restaurant;
  final List<Category> categories;
  final List<_FlatDish> dishes;
  final int current;
  final PageController pageCtrl;
  final VoidCallback onClose;
  final ValueChanged<int> onJump;
  const _CategoryDrawer({
    required this.restaurant,
    required this.categories,
    required this.dishes,
    required this.current,
    required this.pageCtrl,
    required this.onClose,
    required this.onJump,
  });

  @override
  Widget build(BuildContext context) {
    return Positioned(
      left: 0,
      top: 0,
      bottom: 0,
      width: 300,
      child: Container(
        color: const Color(0xF00A0A0A),
        child: SafeArea(
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    if (restaurant.logoUrl != null)
                      ClipRRect(
                        borderRadius: BorderRadius.circular(10),
                        child: CachedNetworkImage(
                            imageUrl: restaurant.logoUrl!,
                            width: 40,
                            height: 40,
                            fit: BoxFit.cover),
                      ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(restaurant.name,
                          style: const TextStyle(
                              color: Colors.white, fontWeight: FontWeight.w700, fontSize: 16)),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close_rounded, color: Colors.white60),
                      onPressed: onClose,
                    ),
                  ],
                ),
              ),
              Expanded(
                child: ListView(
                  children: categories.map((cat) {
                    final firstIdx = dishes.indexWhere((d) => d.catName == cat.name);
                    final isActive = firstIdx != -1 &&
                        current >= firstIdx &&
                        current < firstIdx + cat.menuItems.length;
                    return ListTile(
                      onTap: firstIdx >= 0 ? () => onJump(firstIdx) : null,
                      leading: cat.menuItems.isNotEmpty && cat.menuItems[0].imageUrl != null
                          ? ClipRRect(
                              borderRadius: BorderRadius.circular(8),
                              child: CachedNetworkImage(
                                  imageUrl: cat.menuItems[0].imageUrl!,
                                  width: 44,
                                  height: 44,
                                  fit: BoxFit.cover))
                          : Container(
                              width: 44,
                              height: 44,
                              decoration: BoxDecoration(
                                color: Colors.white10,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Center(
                                  child: Text('?', style: TextStyle(fontSize: 20))),
                            ),
                      title: Text(cat.name,
                          style: TextStyle(
                              color: isActive
                                  ? restaurant.brandColorValue
                                  : Colors.white70,
                              fontWeight:
                                  isActive ? FontWeight.w700 : FontWeight.w500,
                              fontSize: 14)),
                      subtitle: Text('${cat.menuItems.length} plat${cat.menuItems.length > 1 ? 's' : ''}',
                          style: const TextStyle(color: Colors.white30, fontSize: 12)),
                      trailing: const Icon(Icons.chevron_right_rounded,
                          color: Colors.white24, size: 18),
                    );
                  }).toList(),
                ),
              ),
              // Hours in drawer
              HoursBand(
                restaurant: restaurant,
                bgColor: Colors.white.withValues(alpha: 0.04),
                textColor: Colors.white,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

