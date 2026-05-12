// lib/features/menu/templates/template_obsidian.dart
// Template 4 â€” Obsidian : thÃ¨me sombre luxueux, grille de cartes, detail en BottomSheet
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';
import '../../../core/models/models.dart';
import '../../../core/providers/providers.dart';
import '../../../core/utils/price_formatter.dart';
import '../widgets/shared_widgets.dart';
import '../../cart/cart_sheet.dart';

class TemplateObsidian extends ConsumerStatefulWidget {
  final Restaurant restaurant;
  final List<Category> categories;
  final RestaurantFeatures? features;
  const TemplateObsidian({
    super.key,
    required this.restaurant,
    required this.categories,
    this.features,
  });

  @override
  ConsumerState<TemplateObsidian> createState() => _State();
}

class _State extends ConsumerState<TemplateObsidian>
    with SingleTickerProviderStateMixin {
  late TabController _tabCtrl;
  String _search = '';

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(
        length: widget.categories.length, vsync: this);
  }

  @override
  void dispose() {
    _tabCtrl.dispose();
    super.dispose();
  }

  List<MenuItem> _itemsFor(Category cat) {
    if (_search.isEmpty) return cat.menuItems;
    final q = _search.toLowerCase();
    return cat.menuItems
        .where((i) =>
            i.name.toLowerCase().contains(q) ||
            (i.description?.toLowerCase().contains(q) ?? false))
        .toList();
  }

  void _showDetail(BuildContext context, MenuItem item, Color brand,
      bool hasOrders) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _DishDetailSheet(
        item: item,
        restaurant: widget.restaurant,
        brandColor: brand,
        hasOrders: hasOrders,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final brand = widget.restaurant.brandColorValue;
    final hasOrders = widget.features?.ordersAndReservations ?? false;
    final isTablet = MediaQuery.sizeOf(context).width > 700;

    if (widget.categories.isEmpty) {
      return const Scaffold(
        backgroundColor: Color(0xFF080808),
        body: Center(
          child: Text('Aucun plat disponible',
              style: TextStyle(color: Colors.white54)),
        ),
      );
    }

    return Scaffold(
      backgroundColor: const Color(0xFF080808),
      body: NestedScrollView(
        headerSliverBuilder: (context, innerBoxIsScrolled) => [
          // â”€â”€ App bar + hero â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
          SliverAppBar(
            expandedHeight: 260,
            pinned: true,
            backgroundColor: const Color(0xFF080808),
            foregroundColor: Colors.white,
            leading: IconButton(
              icon: const Icon(Icons.arrow_back_ios_new_rounded),
              onPressed: () => context.go('/'),
            ),
            actions: [
              if (hasOrders && ref.watch(cartCountProvider) > 0)
                IconButton(
                  icon: Stack(
                    clipBehavior: Clip.none,
                    children: [
                      const Icon(Icons.shopping_bag_outlined,
                          color: Colors.white),
                      Positioned(
                        top: -4,
                        right: -4,
                        child: Container(
                          width: 14,
                          height: 14,
                          decoration: BoxDecoration(
                              color: brand, shape: BoxShape.circle),
                          child: Center(
                            child: Text(
                              '${ref.watch(cartCountProvider)}',
                              style: const TextStyle(
                                  fontSize: 8,
                                  color: Colors.white,
                                  fontWeight: FontWeight.w800),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                  onPressed: () => CartSheet.show(context),
                ),
              IconButton(
                icon: const Icon(Icons.qr_code_scanner_rounded),
                onPressed: () => context.go('/'),
              ),
            ],
            flexibleSpace: FlexibleSpaceBar(
              background: _ObsidianHero(restaurant: widget.restaurant),
            ),
          ),

          // â”€â”€ Hours band â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
          SliverToBoxAdapter(
            child: HoursBand(
              restaurant: widget.restaurant,
              bgColor: Colors.white.withValues(alpha: 0.03),
              textColor: Colors.white,
            ),
          ),

          // â”€â”€ Search bar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
              child: TextField(
                onChanged: (v) => setState(() => _search = v),
                style: const TextStyle(color: Colors.white, fontSize: 13),
                decoration: InputDecoration(
                  hintText: 'Rechercherâ€¦',
                  hintStyle: const TextStyle(color: Colors.white38),
                  prefixIcon: const Icon(Icons.search_rounded,
                      color: Colors.white38, size: 18),
                  filled: true,
                  fillColor: Colors.white.withValues(alpha: 0.07),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide.none,
                  ),
                  contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16, vertical: 10),
                ),
              ),
            ),
          ),

          // â”€â”€ Category tabs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
          SliverToBoxAdapter(
            child: TabBar(
              controller: _tabCtrl,
              isScrollable: true,
              dividerColor: Colors.transparent,
              indicatorColor: brand,
              labelColor: Colors.white,
              unselectedLabelColor: Colors.white38,
              labelStyle: const TextStyle(
                  fontSize: 13, fontWeight: FontWeight.w700),
              unselectedLabelStyle:
                  const TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
              tabAlignment: TabAlignment.start,
              padding: const EdgeInsets.symmetric(horizontal: 8),
              tabs: widget.categories
                  .map((c) => Tab(text: c.name))
                  .toList(),
            ),
          ),
        ],
        body: TabBarView(
          controller: _tabCtrl,
          children: widget.categories.map((cat) {
            final items = _itemsFor(cat);
            if (items.isEmpty) {
              return const Center(
                child: Text('Aucun plat trouvÃ©',
                    style: TextStyle(color: Colors.white38)),
              );
            }
            return GridView.builder(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
              gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: isTablet ? 3 : 2,
                childAspectRatio: 0.72,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
              ),
              itemCount: items.length,
              itemBuilder: (_, i) => _ObsidianCard(
                item: items[i],
                brandColor: brand,
                currency: widget.restaurant.currency,
                hasOrders: hasOrders,
                onTap: () => _showDetail(context, items[i], brand, hasOrders),
              ),
            );
          }).toList(),
        ),
      ),
    );
  }
}

// â”€â”€ Hero â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class _ObsidianHero extends StatelessWidget {
  final Restaurant restaurant;
  const _ObsidianHero({required this.restaurant});

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        if (restaurant.coverImageUrl != null)
          CachedNetworkImage(
            imageUrl: restaurant.coverImageUrl!,
            fit: BoxFit.cover,
            color: Colors.black.withValues(alpha: 0.45),
            colorBlendMode: BlendMode.darken,
          )
        else
          Container(color: const Color(0xFF111111)),
        Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [Colors.transparent, Color(0xEE080808)],
              stops: [0.4, 1],
            ),
          ),
        ),
        Positioned(
          bottom: 24,
          left: 20,
          right: 20,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              if (restaurant.logoUrl != null) ...[
                ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: CachedNetworkImage(
                      imageUrl: restaurant.logoUrl!,
                      width: 44,
                      height: 44,
                      fit: BoxFit.cover),
                ),
                const SizedBox(height: 8),
              ],
              Text(
                restaurant.name,
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 26,
                  fontWeight: FontWeight.w800,
                  letterSpacing: -0.5,
                  shadows: [
                    Shadow(
                        color: restaurant.brandColorValue.withValues(alpha: 0.5),
                        blurRadius: 20),
                  ],
                ),
              ),
              if (restaurant.slogan != null)
                Text(
                  restaurant.slogan!,
                  style:
                      const TextStyle(color: Colors.white54, fontSize: 12),
                ),
            ],
          ),
        ),
      ],
    );
  }
}

// â”€â”€ Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class _ObsidianCard extends ConsumerWidget {
  final MenuItem item;
  final Color brandColor;
  final String currency;
  final bool hasOrders;
  final VoidCallback onTap;
  const _ObsidianCard({
    required this.item,
    required this.brandColor,
    required this.currency,
    required this.hasOrders,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final unavailable = !item.isAvailable;
    return GestureDetector(
      onTap: onTap,
      child: Opacity(
        opacity: unavailable ? 0.4 : 1,
        child: Container(
          decoration: BoxDecoration(
            color: const Color(0xFF111111),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                flex: 5,
                child: Stack(
                  children: [
                    ClipRRect(
                      borderRadius:
                          const BorderRadius.vertical(top: Radius.circular(16)),
                      child: DishImage(
                          url: item.imageUrl,
                          width: double.infinity,
                          height: double.infinity),
                    ),
                    if (item.badge != null)
                      Positioned(
                          top: 8,
                          left: 8,
                          child: BadgeChip(badge: item.badge!, dark: true)),
                    // Gradient
                    Positioned.fill(
                      child: DecoratedBox(
                        decoration: BoxDecoration(
                          borderRadius: const BorderRadius.vertical(
                              top: Radius.circular(16)),
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [
                              Colors.transparent,
                              const Color(0xFF111111).withValues(alpha: 0.4),
                            ],
                            stops: const [0.5, 1],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              Expanded(
                flex: 4,
                child: Padding(
                  padding: const EdgeInsets.all(10),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item.name,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                            color: Colors.white,
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            height: 1.3),
                      ),
                      const Spacer(),
                      Row(
                        children: [
                          Text(
                            item.priceFormatted ??
                                formatPrice(item.price, currency),
                            style: TextStyle(
                                color: brandColor,
                                fontSize: 14,
                                fontWeight: FontWeight.w800),
                          ),
                          const Spacer(),
                          if (hasOrders && !unavailable)
                            QtyControl(item: item, brandColor: brandColor),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// â”€â”€ Detail bottom sheet â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class _DishDetailSheet extends ConsumerWidget {
  final MenuItem item;
  final Restaurant restaurant;
  final Color brandColor;
  final bool hasOrders;
  const _DishDetailSheet({
    required this.item,
    required this.restaurant,
    required this.brandColor,
    required this.hasOrders,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final unavailable = !item.isAvailable;
    return Container(
      decoration: const BoxDecoration(
        color: Color(0xFF111111),
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Handle
          Container(
            margin: const EdgeInsets.only(top: 12),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
                color: Colors.white24,
                borderRadius: BorderRadius.circular(2)),
          ),
          // Image
          if (item.imageUrl != null)
            ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: CachedNetworkImage(
                imageUrl: item.imageUrl!,
                height: 220,
                width: double.infinity,
                fit: BoxFit.cover,
              ),
            )
          else
            Container(
              height: 160,
              margin: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white10,
                borderRadius: BorderRadius.circular(16),
              ),
              child: const Center(
                  child: Text('ðŸ½ï¸', style: TextStyle(fontSize: 48))),
            ),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (item.badge != null) ...[
                  BadgeChip(badge: item.badge!, dark: true),
                  const SizedBox(height: 8),
                ],
                Text(
                  item.name,
                  style: const TextStyle(
                      color: Colors.white,
                      fontSize: 22,
                      fontWeight: FontWeight.w800),
                ),
                if (item.description != null) ...[
                  const SizedBox(height: 10),
                  Text(
                    item.description!,
                    style: const TextStyle(
                        color: Colors.white60, fontSize: 14, height: 1.6),
                  ),
                ],
                const SizedBox(height: 20),
                Row(
                  children: [
                    Text(
                      item.priceFormatted ??
                          formatPrice(item.price, restaurant.currency),
                      style: TextStyle(
                          color: brandColor,
                          fontSize: 24,
                          fontWeight: FontWeight.w800),
                    ),
                    const Spacer(),
                    if (hasOrders && !unavailable)
                      QtyControl(item: item, brandColor: brandColor),
                  ],
                ),
                if (hasOrders && ref.watch(cartCountProvider) > 0) ...[
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      onPressed: () {
                        Navigator.pop(context);
                        CartSheet.show(context);
                      },
                      style: FilledButton.styleFrom(
                        backgroundColor: brandColor,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12)),
                      ),
                      child: Text(
                          'Voir le panier (${ref.watch(cartCountProvider)})',
                          style: const TextStyle(
                              fontSize: 15, fontWeight: FontWeight.w700)),
                    ),
                  ),
                ],
                SizedBox(
                    height: MediaQuery.paddingOf(context).bottom + 8),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

