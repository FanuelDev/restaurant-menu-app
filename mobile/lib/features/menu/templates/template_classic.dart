// lib/features/menu/templates/template_classic.dart
// Template 1 â€” Classique : grille, filtres par catÃ©gorie, recherche
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';
import '../../../core/models/models.dart';
import '../../../core/utils/price_formatter.dart';
import '../widgets/shared_widgets.dart';

class TemplateClassic extends ConsumerStatefulWidget {
  final Restaurant restaurant;
  final List<Category> categories;
  final RestaurantFeatures? features;
  const TemplateClassic({
    super.key,
    required this.restaurant,
    required this.categories,
    this.features,
  });

  @override
  ConsumerState<TemplateClassic> createState() => _State();
}

class _State extends ConsumerState<TemplateClassic> {
  int? _activeCatId;
  String _search = '';
  final _scroll = ScrollController();

  @override
  void dispose() {
    _scroll.dispose();
    super.dispose();
  }

  List<Category> get _filtered {
    final cats = _activeCatId == null
        ? widget.categories
        : widget.categories.where((c) => c.id == _activeCatId).toList();
    if (_search.isEmpty) return cats;
    final q = _search.toLowerCase();
    return cats
        .map((c) => Category(
              id: c.id,
              name: c.name,
              description: c.description,
              sortOrder: c.sortOrder,
              menuItems: c.menuItems
                  .where((i) =>
                      i.name.toLowerCase().contains(q) ||
                      (i.description?.toLowerCase().contains(q) ?? false))
                  .toList(),
            ))
        .where((c) => c.menuItems.isNotEmpty)
        .toList();
  }

  @override
  Widget build(BuildContext context) {
    final brand = widget.restaurant.brandColorValue;
    final hasReservation = widget.features?.ordersAndReservations ?? false;
    final isTablet = MediaQuery.sizeOf(context).width > 700;

    return Scaffold(
      backgroundColor: const Color(0xFFF8F6F2),
      body: Stack(
        children: [
          CustomScrollView(
            controller: _scroll,
            slivers: [
              // â”€â”€ Hero header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
              SliverAppBar(
                expandedHeight: 220,
                floating: false,
                pinned: true,
                backgroundColor: brand,
                leading: IconButton(
                  icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white),
                  onPressed: () => context.go('/'),
                ),
                actions: [
                  MenuAppBarActions(
                      restaurant: widget.restaurant,
                      showReservation: hasReservation,
                      iconColor: Colors.white),
                ],
                flexibleSpace: FlexibleSpaceBar(
                  background: Stack(
                    fit: StackFit.expand,
                    children: [
                      if (widget.restaurant.coverImageUrl != null)
                        CachedNetworkImage(
                          imageUrl: widget.restaurant.coverImageUrl!,
                          fit: BoxFit.cover,
                        ),
                      Container(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [
                              brand.withValues(alpha: 0.7),
                              brand.withValues(alpha: 0.95),
                            ],
                          ),
                        ),
                      ),
                      Positioned(
                        bottom: 20,
                        left: 20,
                        right: 20,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            if (widget.restaurant.logoUrl != null) ...[
                              ClipRRect(
                                borderRadius: BorderRadius.circular(12),
                                child: CachedNetworkImage(
                                  imageUrl: widget.restaurant.logoUrl!,
                                  width: 52,
                                  height: 52,
                                  fit: BoxFit.cover,
                                ),
                              ),
                              const SizedBox(height: 8),
                            ],
                            Text(
                              widget.restaurant.name,
                              style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 26,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: -0.5),
                            ),
                            if (widget.restaurant.slogan != null)
                              Text(widget.restaurant.slogan!,
                                  style: const TextStyle(
                                      color: Colors.white70, fontSize: 13)),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // â”€â”€ Hours â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
              SliverToBoxAdapter(
                child: HoursBand(restaurant: widget.restaurant),
              ),

              // â”€â”€ Search bar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
              SliverPersistentHeader(
                pinned: true,
                delegate: _SearchDelegate(
                  onChanged: (v) => setState(() => _search = v),
                ),
              ),

              // â”€â”€ Category filter tabs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
              SliverToBoxAdapter(
                child: _CategoryTabs(
                  categories: widget.categories,
                  activeId: _activeCatId,
                  brandColor: brand,
                  onSelect: (id) => setState(() => _activeCatId = id),
                ),
              ),

              // â”€â”€ Items grid â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
              if (_filtered.isEmpty)
                const SliverFillRemaining(
                  child: Center(
                    child: Text('Aucun plat trouvÃ© ðŸ½ï¸',
                        style: TextStyle(color: Colors.black38, fontSize: 15)),
                  ),
                )
              else
                for (final cat in _filtered) ...[
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(20, 24, 20, 12),
                      child: Text(cat.name,
                          style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w800,
                              letterSpacing: -0.3)),
                    ),
                  ),
                  SliverPadding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    sliver: SliverGrid.builder(
                      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: isTablet ? 3 : 2,
                        childAspectRatio: 0.75,
                        crossAxisSpacing: 12,
                        mainAxisSpacing: 12,
                      ),
                      itemCount: cat.menuItems.length,
                      itemBuilder: (_, i) => _DishCard(
                        item: cat.menuItems[i],
                        brandColor: brand,
                        currency: widget.restaurant.currency,
                        hasOrders: widget.features?.ordersAndReservations ?? false,
                      ),
                    ),
                  ),
                ],

              const SliverToBoxAdapter(child: SizedBox(height: 100)),
            ],
          ),
          CartFab(brandColor: brand),
        ],
      ),
    );
  }
}

class _SearchDelegate extends SliverPersistentHeaderDelegate {
  final ValueChanged<String> onChanged;
  _SearchDelegate({required this.onChanged});
  @override double get minExtent => 64;
  @override double get maxExtent => 64;
  @override bool shouldRebuild(_) => false;
  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    return Container(
      color: const Color(0xFFF8F6F2),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: TextField(
        onChanged: onChanged,
        decoration: InputDecoration(
          hintText: 'Rechercher un platâ€¦',
          prefixIcon: const Icon(Icons.search_rounded, size: 20),
          filled: true,
          fillColor: Colors.white,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide.none,
          ),
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 0),
        ),
      ),
    );
  }
}

class _CategoryTabs extends StatelessWidget {
  final List<Category> categories;
  final int? activeId;
  final Color brandColor;
  final ValueChanged<int?> onSelect;
  const _CategoryTabs({
    required this.categories,
    required this.activeId,
    required this.brandColor,
    required this.onSelect,
  });
  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 44,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        children: [
          _Tab(label: 'Tout', active: activeId == null, color: brandColor,
              onTap: () => onSelect(null)),
          ...categories.map((c) => _Tab(
                label: c.name,
                active: activeId == c.id,
                color: brandColor,
                onTap: () => onSelect(c.id),
              )),
        ],
      ),
    );
  }
}

class _Tab extends StatelessWidget {
  final String label;
  final bool active;
  final Color color;
  final VoidCallback onTap;
  const _Tab({required this.label, required this.active, required this.color, required this.onTap});
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(right: 8),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        decoration: BoxDecoration(
          color: active ? color : Colors.white,
          borderRadius: BorderRadius.circular(99),
          border: Border.all(color: active ? color : Colors.black12),
        ),
        child: Text(label,
            style: TextStyle(
                color: active ? Colors.white : Colors.black87,
                fontSize: 13,
                fontWeight: FontWeight.w600)),
      ),
    );
  }
}

class _DishCard extends ConsumerWidget {
  final MenuItem item;
  final Color brandColor;
  final String currency;
  final bool hasOrders;
  const _DishCard({
    required this.item,
    required this.brandColor,
    required this.currency,
    required this.hasOrders,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final unavailable = !item.isAvailable;
    return Opacity(
      opacity: unavailable ? 0.5 : 1,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(color: Colors.black.withValues(alpha: 0.06), blurRadius: 10, offset: const Offset(0, 3))
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              flex: 5,
              child: Stack(
                children: [
                  ClipRRect(
                    borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                    child: DishImage(url: item.imageUrl, width: double.infinity, height: double.infinity),
                  ),
                  if (item.badge != null)
                    Positioned(top: 8, left: 8, child: BadgeChip(badge: item.badge!)),
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
                    Text(item.name,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                            fontSize: 13, fontWeight: FontWeight.w700)),
                    const Spacer(),
                    Row(
                      children: [
                        Text(
                          item.priceFormatted ?? formatPrice(item.price, currency),
                          style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w800,
                              color: brandColor),
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
    );
  }
}

