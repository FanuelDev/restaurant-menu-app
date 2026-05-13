// lib/features/menu/templates/template_lumiere.dart
// Template 5 — Lumière : thème crème clair, bento grid, navigation pill sticky
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';
import '../../../core/models/models.dart';
import '../../../core/utils/price_formatter.dart';
import '../widgets/shared_widgets.dart';

class TemplateLumiere extends ConsumerStatefulWidget {
  final Restaurant restaurant;
  final List<Category> categories;
  final RestaurantFeatures? features;
  final VoidCallback? onRefresh;
  const TemplateLumiere({
    super.key,
    required this.restaurant,
    required this.categories,
    this.features,
    this.onRefresh,
  });

  @override
  ConsumerState<TemplateLumiere> createState() => _State();
}

class _State extends ConsumerState<TemplateLumiere> {
  int? _activeCatId;
  String _search = '';
  final _scroll = ScrollController();

  // Map category id → GlobalKey for scroll-to-section
  final Map<int, GlobalKey> _catKeys = {};

  @override
  void initState() {
    super.initState();
    for (final cat in widget.categories) {
      _catKeys[cat.id] = GlobalKey();
    }
  }

  @override
  void dispose() {
    _scroll.dispose();
    super.dispose();
  }

  void _scrollToCategory(int id) {
    final key = _catKeys[id];
    if (key == null) return;
    final ctx = key.currentContext;
    if (ctx == null) return;
    Scrollable.ensureVisible(ctx,
        duration: const Duration(milliseconds: 500), curve: Curves.easeInOut);
    setState(() => _activeCatId = id);
  }

  List<Category> get _filtered {
    if (_search.isEmpty) return widget.categories;
    final q = _search.toLowerCase();
    return widget.categories
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
    final hasOrders = widget.features?.ordersAndReservations ?? false;

    return Scaffold(
      backgroundColor: const Color(0xFFFAF9F5),
      body: Stack(
        children: [
          RefreshIndicator(
            onRefresh: () async => widget.onRefresh?.call(),
            color: brand,
          child: CustomScrollView(
            controller: _scroll,
            physics: const AlwaysScrollableScrollPhysics(),
            slivers: [
              // ── Hero ─────────────────────────────────────────────────────
              SliverAppBar(
                expandedHeight: 300,
                pinned: false,
                floating: false,
                backgroundColor: const Color(0xFFFAF9F5),
                leading: IconButton(
                  icon: const Icon(Icons.arrow_back_ios_new_rounded,
                      color: Colors.black87),
                  onPressed: () => context.go('/'),
                ),
                actions: [
                  if (widget.onRefresh != null)
                    IconButton(
                      icon: const Icon(Icons.refresh_rounded, color: Colors.black87),
                      onPressed: widget.onRefresh,
                      tooltip: 'Actualiser',
                    ),
                  MenuAppBarActions(
                    restaurant: widget.restaurant,
                    showReservation: hasOrders,
                  ),
                ],
                flexibleSpace: FlexibleSpaceBar(
                  background: _LumiereHero(restaurant: widget.restaurant),
                ),
              ),

              // ── Hours band ────────────────────────────────────────────────
              SliverToBoxAdapter(
                child: HoursBand(restaurant: widget.restaurant),
              ),

              // ── Sticky pill nav ───────────────────────────────────────────
              SliverPersistentHeader(
                pinned: true,
                delegate: _PillNavDelegate(
                  categories: widget.categories,
                  activeId: _activeCatId,
                  brandColor: brand,
                  onSelect: _scrollToCategory,
                ),
              ),

              // ── Search bar ────────────────────────────────────────────────
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
                  child: TextField(
                    onChanged: (v) => setState(() => _search = v),
                    decoration: InputDecoration(
                      hintText: 'Rechercher un plat...',
                      prefixIcon:
                          const Icon(Icons.search_rounded, size: 18),
                      filled: true,
                      fillColor: Colors.white,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none,
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 0),
                      hintStyle: const TextStyle(fontSize: 13),
                    ),
                    style: const TextStyle(fontSize: 13),
                  ),
                ),
              ),

              // ── Bento content ─────────────────────────────────────────────
              if (_filtered.isEmpty)
                const SliverFillRemaining(
                  child: Center(
                    child: Text('Aucun plat trouve ?',
                        style:
                            TextStyle(color: Colors.black38, fontSize: 15)),
                  ),
                )
              else
                for (final cat in _filtered) ...[
                  SliverToBoxAdapter(
                    key: _catKeys[cat.id],
                    child: _LumiereSectionHeader(
                      label: cat.name,
                      description: cat.description,
                      brandColor: brand,
                    ),
                  ),
                  SliverPadding(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
                    sliver: _BentoGrid(
                      items: cat.menuItems,
                      brandColor: brand,
                      currency: widget.restaurant.currency,
                      hasOrders: hasOrders,
                    ),
                  ),
                ],

              const SliverToBoxAdapter(child: SizedBox(height: 100)),
            ],
          ),
          ), // RefreshIndicator

          // ── Cart FAB ──────────────────────────────────────────────────────
          Positioned(
            bottom: 20,
            left: 16,
            right: 16,
            child: CartFab(brandColor: brand),
          ),
        ],
      ),
    );
  }
}

// ── Hero ──────────────────────────────────────────────────────────────────────

class _LumiereHero extends StatelessWidget {
  final Restaurant restaurant;
  const _LumiereHero({required this.restaurant});

  @override
  Widget build(BuildContext context) {
    final brand = restaurant.brandColorValue;
    return Stack(
      fit: StackFit.expand,
      children: [
        if (restaurant.coverImageUrl != null)
          CachedNetworkImage(
              imageUrl: restaurant.coverImageUrl!, fit: BoxFit.cover)
        else
          Container(color: const Color(0xFFEDE8DC)),
        // Light gradient overlay
        Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [Color(0x33FFFFFF), Color(0xCCFAF9F5)],
              stops: [0.3, 1],
            ),
          ),
        ),
        // Content
        Positioned(
          bottom: 28,
          left: 24,
          right: 24,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              if (restaurant.logoUrl != null) ...[
                Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(14),
                    boxShadow: [
                      BoxShadow(
                          color: brand.withValues(alpha: 0.2),
                          blurRadius: 16,
                          offset: const Offset(0, 4))
                    ],
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(14),
                    child: CachedNetworkImage(
                        imageUrl: restaurant.logoUrl!,
                        width: 56,
                        height: 56,
                        fit: BoxFit.cover),
                  ),
                ),
                const SizedBox(height: 12),
              ],
              Text(
                restaurant.name,
                style: const TextStyle(
                    color: Colors.black87,
                    fontSize: 30,
                    fontWeight: FontWeight.w900,
                    letterSpacing: -1,
                    height: 1.1),
              ),
              if (restaurant.slogan != null) ...[
                const SizedBox(height: 6),
                Text(
                  restaurant.slogan!,
                  style: const TextStyle(
                      color: Colors.black45,
                      fontSize: 14,
                      fontStyle: FontStyle.italic),
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }
}

// ── Sticky pill nav ───────────────────────────────────────────────────────────

class _PillNavDelegate extends SliverPersistentHeaderDelegate {
  final List<Category> categories;
  final int? activeId;
  final Color brandColor;
  final ValueChanged<int> onSelect;
  _PillNavDelegate({
    required this.categories,
    required this.activeId,
    required this.brandColor,
    required this.onSelect,
  });

  @override
  double get minExtent => 52;
  @override
  double get maxExtent => 52;
  @override
  bool shouldRebuild(_PillNavDelegate old) =>
      old.activeId != activeId || old.categories != categories;

  @override
  Widget build(
      BuildContext context, double shrinkOffset, bool overlapsContent) {
    return Container(
      color: const Color(0xFFFAF9F5),
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        children: categories.map((cat) {
          final isActive = activeId == cat.id;
          return GestureDetector(
            onTap: () => onSelect(cat.id),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              margin: const EdgeInsets.only(right: 8),
              padding:
                  const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
              decoration: BoxDecoration(
                color: isActive ? brandColor : Colors.white,
                borderRadius: BorderRadius.circular(99),
                border: Border.all(
                    color: isActive ? brandColor : Colors.black12),
                boxShadow: isActive
                    ? [
                        BoxShadow(
                            color: brandColor.withValues(alpha: 0.25),
                            blurRadius: 8,
                            offset: const Offset(0, 2))
                      ]
                    : [],
              ),
              child: Text(
                cat.name,
                style: TextStyle(
                    color: isActive ? Colors.white : Colors.black54,
                    fontSize: 13,
                    fontWeight: FontWeight.w700),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}

// ── Section header ────────────────────────────────────────────────────────────

class _LumiereSectionHeader extends StatelessWidget {
  final String label;
  final String? description;
  final Color brandColor;
  const _LumiereSectionHeader(
      {required this.label, this.description, required this.brandColor});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 28, 16, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 4,
                height: 20,
                decoration: BoxDecoration(
                    color: brandColor,
                    borderRadius: BorderRadius.circular(2)),
              ),
              const SizedBox(width: 10),
              Text(
                label,
                style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w900,
                    letterSpacing: -0.5,
                    color: Colors.black87),
              ),
            ],
          ),
          if (description != null) ...[
            const SizedBox(height: 4),
            Padding(
              padding: const EdgeInsets.only(left: 14),
              child: Text(
                description!,
                style: const TextStyle(
                    color: Colors.black38, fontSize: 13, height: 1.4),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

// ── Bento grid sliver ─────────────────────────────────────────────────────────

class _BentoGrid extends StatelessWidget {
  final List<MenuItem> items;
  final Color brandColor;
  final String currency;
  final bool hasOrders;
  const _BentoGrid({
    required this.items,
    required this.brandColor,
    required this.currency,
    required this.hasOrders,
  });

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) return const SliverToBoxAdapter(child: SizedBox());

    // Build pairs: first item is featured (full width), then pairs of 2
    final widgets = <Widget>[];

    for (int i = 0; i < items.length; i++) {
      if (i == 0) {
        // Featured card — full width
        widgets.add(
          _LumiereCard(
            item: items[i],
            brandColor: brandColor,
            currency: currency,
            hasOrders: hasOrders,
            featured: true,
          ),
        );
      } else if (i % 2 == 1) {
        // Pair
        final a = items[i];
        final b = i + 1 < items.length ? items[i + 1] : null;
        widgets.add(
          Row(
            children: [
              Expanded(
                child: _LumiereCard(
                  item: a,
                  brandColor: brandColor,
                  currency: currency,
                  hasOrders: hasOrders,
                ),
              ),
              if (b != null) ...[
                const SizedBox(width: 12),
                Expanded(
                  child: _LumiereCard(
                    item: b,
                    brandColor: brandColor,
                    currency: currency,
                    hasOrders: hasOrders,
                  ),
                ),
              ] else
                const Expanded(child: SizedBox()),
            ],
          ),
        );
        if (b != null) i++; // skip b in outer loop
      }
    }

    return SliverList(
      delegate: SliverChildBuilderDelegate(
        (_, i) => Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: widgets[i],
        ),
        childCount: widgets.length,
      ),
    );
  }
}

// ── Card ──────────────────────────────────────────────────────────────────────

class _LumiereCard extends ConsumerWidget {
  final MenuItem item;
  final Color brandColor;
  final String currency;
  final bool hasOrders;
  final bool featured;
  const _LumiereCard({
    required this.item,
    required this.brandColor,
    required this.currency,
    required this.hasOrders,
    this.featured = false,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final unavailable = !item.isAvailable;

    return Opacity(
      opacity: unavailable ? 0.5 : 1,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
          boxShadow: [
            BoxShadow(
                color: Colors.black.withValues(alpha: 0.06),
                blurRadius: 12,
                offset: const Offset(0, 3))
          ],
        ),
        child: featured
            ? _FeaturedLayout(
                item: item,
                brandColor: brandColor,
                currency: currency,
                hasOrders: hasOrders,
                unavailable: unavailable,
              )
            : _GridLayout(
                item: item,
                brandColor: brandColor,
                currency: currency,
                hasOrders: hasOrders,
                unavailable: unavailable,
              ),
      ),
    );
  }
}

class _FeaturedLayout extends ConsumerWidget {
  final MenuItem item;
  final Color brandColor;
  final String currency;
  final bool hasOrders;
  final bool unavailable;
  const _FeaturedLayout({
    required this.item,
    required this.brandColor,
    required this.currency,
    required this.hasOrders,
    required this.unavailable,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Row(
      children: [
        // Image
        ClipRRect(
          borderRadius:
              const BorderRadius.horizontal(left: Radius.circular(18)),
          child: DishImage(
              url: item.imageUrl, width: 140, height: 140),
        ),
        Expanded(
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                if (item.badge != null) ...[
                  BadgeChip(badge: item.badge!),
                  const SizedBox(height: 6),
                ],
                Text(
                  item.name,
                  style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                      letterSpacing: -0.3,
                      height: 1.2),
                ),
                if (item.description != null) ...[
                  const SizedBox(height: 6),
                  Text(
                    item.description!,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                        color: Colors.black45, fontSize: 12, height: 1.4),
                  ),
                ],
                const SizedBox(height: 10),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Expanded(
                      child: Text(
                        item.priceFormatted ??
                            formatPrice(item.price, currency),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                            color: brandColor,
                            fontSize: 15,
                            fontWeight: FontWeight.w800),
                      ),
                    ),
                    if (hasOrders && !unavailable)
                      QtyControl(item: item, brandColor: brandColor, compact: true),
                  ],
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _GridLayout extends ConsumerWidget {
  final MenuItem item;
  final Color brandColor;
  final String currency;
  final bool hasOrders;
  final bool unavailable;
  const _GridLayout({
    required this.item,
    required this.brandColor,
    required this.currency,
    required this.hasOrders,
    required this.unavailable,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Image
        ClipRRect(
          borderRadius:
              const BorderRadius.vertical(top: Radius.circular(18)),
          child: DishImage(
              url: item.imageUrl,
              width: double.infinity,
              height: 120),
        ),
        Padding(
          padding: const EdgeInsets.all(10),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (item.badge != null) ...[
                BadgeChip(badge: item.badge!),
                const SizedBox(height: 4),
              ],
              Text(
                item.name,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    height: 1.3),
              ),
              const SizedBox(height: 8),
              Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Expanded(
                    child: Text(
                      item.priceFormatted ??
                          formatPrice(item.price, currency),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                          color: brandColor,
                          fontSize: 13,
                          fontWeight: FontWeight.w800),
                    ),
                  ),
                  if (hasOrders && !unavailable)
                    QtyControl(item: item, brandColor: brandColor, compact: true),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }
}

