// lib/features/menu/templates/template_magazine.dart
// Template 2 — Magazine : hero editorial + sidebar categories + liste articles
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';
import '../../../core/models/models.dart';
import '../../../core/providers/providers.dart';
import '../../../core/utils/price_formatter.dart';
import '../widgets/shared_widgets.dart';
import '../../cart/cart_sheet.dart';

class TemplateMagazine extends ConsumerStatefulWidget {
  final Restaurant restaurant;
  final List<Category> categories;
  final RestaurantFeatures? features;
  final VoidCallback? onRefresh;
  const TemplateMagazine({
    super.key,
    required this.restaurant,
    required this.categories,
    this.features,
    this.onRefresh,
  });

  @override
  ConsumerState<TemplateMagazine> createState() => _State();
}

class _State extends ConsumerState<TemplateMagazine> {
  int? _activeCatId;
  String _search = '';
  bool _drawerOpen = false;
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
    final hasOrders = widget.features?.ordersAndReservations ?? false;
    final isTablet = MediaQuery.sizeOf(context).width > 700;

    return Scaffold(
      backgroundColor: const Color(0xFFF5F0E8),
      body: Stack(
        children: [
          RefreshIndicator(
            onRefresh: () async => widget.onRefresh?.call(),
            color: brand,
          child: CustomScrollView(
            controller: _scroll,
            physics: const AlwaysScrollableScrollPhysics(),
            slivers: [
              // ── App bar ──────────────────────────────────────────────────
              SliverAppBar(
                expandedHeight: 280,
                pinned: true,
                backgroundColor: const Color(0xFF1A1A1A),
                leading: IconButton(
                  icon: const Icon(Icons.menu_rounded, color: Colors.white),
                  onPressed: () => setState(() => _drawerOpen = true),
                ),
                actions: [
                  if (hasOrders && ref.watch(cartCountProvider) > 0)
                    _CartBadge(
                      count: ref.watch(cartCountProvider),
                      brandColor: brand,
                      onTap: () => CartSheet.show(context),
                    ),
                  if (hasOrders)
                    IconButton(
                      icon: const Icon(Icons.calendar_month_outlined,
                          color: Colors.white),
                      onPressed: () =>
                          context.push('/reservation/${widget.restaurant.slug}'),
                      tooltip: 'Réserver',
                    ),
                  if (widget.onRefresh != null)
                    IconButton(
                      icon: const Icon(Icons.refresh_rounded, color: Colors.white),
                      onPressed: widget.onRefresh,
                      tooltip: 'Actualiser',
                    ),
                  IconButton(
                    icon: const Icon(Icons.qr_code_scanner_rounded,
                        color: Colors.white),
                    onPressed: () => context.go('/'),
                  ),
                ],
                flexibleSpace: FlexibleSpaceBar(
                  background: _MagazineHero(restaurant: widget.restaurant),
                ),
              ),

              // ── Hours band ───────────────────────────────────────────────
              SliverToBoxAdapter(
                child: HoursBand(restaurant: widget.restaurant),
              ),

              // ── Search ───────────────────────────────────────────────────
              SliverPersistentHeader(
                pinned: true,
                delegate: _SearchBarDelegate(
                  onChanged: (v) => setState(() => _search = v),
                ),
              ),

              // ── Category chips ───────────────────────────────────────────
              SliverToBoxAdapter(
                child: _CategoryChips(
                  categories: widget.categories,
                  activeId: _activeCatId,
                  brandColor: brand,
                  onSelect: (id) => setState(() => _activeCatId = id),
                ),
              ),

              // ── Content ──────────────────────────────────────────────────
              if (_filtered.isEmpty)
                const SliverFillRemaining(
                  child: Center(
                    child: Text('Aucun plat trouve ?',
                        style: TextStyle(color: Colors.black38)),
                  ),
                )
              else
                for (final cat in _filtered) ...[
                  SliverToBoxAdapter(
                    child: _SectionHeader(
                        label: cat.name, count: cat.menuItems.length),
                  ),
                  if (isTablet)
                    SliverPadding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      sliver: SliverGrid.builder(
                        gridDelegate:
                            const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          childAspectRatio: 3.0,
                          crossAxisSpacing: 12,
                          mainAxisSpacing: 10,
                        ),
                        itemCount: cat.menuItems.length,
                        itemBuilder: (_, i) => _ArticleCard(
                          item: cat.menuItems[i],
                          brandColor: brand,
                          currency: widget.restaurant.currency,
                          hasOrders: hasOrders,
                          horizontal: true,
                        ),
                      ),
                    )
                  else
                    SliverList.builder(
                      itemCount: cat.menuItems.length,
                      itemBuilder: (_, i) => Padding(
                        padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
                        child: _ArticleCard(
                          item: cat.menuItems[i],
                          brandColor: brand,
                          currency: widget.restaurant.currency,
                          hasOrders: hasOrders,
                          horizontal: true,
                        ),
                      ),
                    ),
                ],

              const SliverToBoxAdapter(child: SizedBox(height: 100)),
            ],
          ),
          ), // RefreshIndicator

          // ── Cart FAB ─────────────────────────────────────────────────────
          Positioned(
            bottom: 20,
            left: 16,
            right: 16,
            child: CartFab(brandColor: brand),
          ),

          // ── Sidebar drawer ───────────────────────────────────────────────
          if (_drawerOpen) ...[
            GestureDetector(
              onTap: () => setState(() => _drawerOpen = false),
              child: Container(color: Colors.black45),
            ),
            _SideDrawer(
              restaurant: widget.restaurant,
              categories: widget.categories,
              activeId: _activeCatId,
              onClose: () => setState(() => _drawerOpen = false),
              onSelect: (id) {
                setState(() {
                  _activeCatId = id;
                  _drawerOpen = false;
                });
              },
            ),
          ],
        ],
      ),
    );
  }
}

// ── Hero ──────────────────────────────────────────────────────────────────────

class _MagazineHero extends StatelessWidget {
  final Restaurant restaurant;
  const _MagazineHero({required this.restaurant});

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        if (restaurant.coverImageUrl != null)
          CachedNetworkImage(
              imageUrl: restaurant.coverImageUrl!, fit: BoxFit.cover)
        else
          Container(color: const Color(0xFF1A1A1A)),
        Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [Color(0x661A1A1A), Color(0xEE1A1A1A)],
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
                      width: 48,
                      height: 48,
                      fit: BoxFit.cover),
                ),
                const SizedBox(height: 10),
              ],
              Text(
                restaurant.name,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 28,
                  fontWeight: FontWeight.w900,
                  letterSpacing: -1,
                  height: 1.1,
                ),
              ),
              if (restaurant.slogan != null) ...[
                const SizedBox(height: 6),
                Text(
                  restaurant.slogan!,
                  style: const TextStyle(
                      color: Colors.white60,
                      fontSize: 13,
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

// ── Search delegate ───────────────────────────────────────────────────────────

class _SearchBarDelegate extends SliverPersistentHeaderDelegate {
  final ValueChanged<String> onChanged;
  _SearchBarDelegate({required this.onChanged});
  @override
  double get minExtent => 60;
  @override
  double get maxExtent => 60;
  @override
  bool shouldRebuild(_) => false;
  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    return Container(
      color: const Color(0xFFF5F0E8),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: TextField(
        onChanged: onChanged,
        decoration: InputDecoration(
          hintText: 'Rechercher dans la carte...',
          prefixIcon: const Icon(Icons.search_rounded, size: 18),
          filled: true,
          fillColor: Colors.white,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: BorderSide.none,
          ),
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 16, vertical: 0),
          hintStyle: const TextStyle(fontSize: 13),
        ),
        style: const TextStyle(fontSize: 13),
      ),
    );
  }
}

// ── Category chips ────────────────────────────────────────────────────────────

class _CategoryChips extends StatelessWidget {
  final List<Category> categories;
  final int? activeId;
  final Color brandColor;
  final ValueChanged<int?> onSelect;
  const _CategoryChips({
    required this.categories,
    required this.activeId,
    required this.brandColor,
    required this.onSelect,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 40,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        children: [
          _Chip(
            label: 'Tout',
            active: activeId == null,
            color: brandColor,
            onTap: () => onSelect(null),
          ),
          ...categories.map((c) => _Chip(
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

class _Chip extends StatelessWidget {
  final String label;
  final bool active;
  final Color color;
  final VoidCallback onTap;
  const _Chip(
      {required this.label,
      required this.active,
      required this.color,
      required this.onTap});
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(right: 6, bottom: 4, top: 4),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
        decoration: BoxDecoration(
          color: active ? color : Colors.white,
          borderRadius: BorderRadius.circular(99),
          border: Border.all(color: active ? color : Colors.black12),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: active ? Colors.white : Colors.black54,
            fontSize: 12,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }
}

// ── Section header ────────────────────────────────────────────────────────────

class _SectionHeader extends StatelessWidget {
  final String label;
  final int count;
  const _SectionHeader({required this.label, required this.count});
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 24, 16, 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.baseline,
        textBaseline: TextBaseline.alphabetic,
        children: [
          Text(
            label,
            style: const TextStyle(
                fontSize: 20, fontWeight: FontWeight.w900, letterSpacing: -0.5),
          ),
          const SizedBox(width: 8),
          Text(
            '$count plat${count > 1 ? 's' : ''}',
            style: const TextStyle(
                fontSize: 12, color: Colors.black38, fontWeight: FontWeight.w500),
          ),
        ],
      ),
    );
  }
}

// ── Article card ──────────────────────────────────────────────────────────────

class _ArticleCard extends ConsumerWidget {
  final MenuItem item;
  final Color brandColor;
  final String currency;
  final bool hasOrders;
  final bool horizontal;
  const _ArticleCard({
    required this.item,
    required this.brandColor,
    required this.currency,
    required this.hasOrders,
    this.horizontal = true,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final unavailable = !item.isAvailable;
    return Opacity(
      opacity: unavailable ? 0.5 : 1,
      child: Container(
        // Pas de hauteur fixe — la card s'adapte au contenu
        constraints: const BoxConstraints(minHeight: 90),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          boxShadow: [
            BoxShadow(
                color: Colors.black.withValues(alpha: 0.05),
                blurRadius: 8,
                offset: const Offset(0, 2))
          ],
        ),
        child: IntrinsicHeight(
          child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Image — largeur fixe, hauteur étirée sur celle du contenu
            ClipRRect(
              borderRadius:
                  const BorderRadius.horizontal(left: Radius.circular(14)),
              child: DishImage(
                url: item.imageUrl,
                width: 100,
                height: null,
                fit: BoxFit.cover,
              ),
            ),
            // Text content
            Expanded(
              child: Padding(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Badge + nom sur la même ligne si badge court
                    if (item.badge != null) ...[
                      BadgeChip(badge: item.badge!),
                      const SizedBox(height: 4),
                    ],
                    Text(
                      item.name,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                          fontSize: 14, fontWeight: FontWeight.w800, height: 1.3),
                    ),
                    if (item.description != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        item.description!,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                            fontSize: 11, color: Colors.black45, height: 1.4),
                      ),
                    ],
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
                                fontSize: 14,
                                fontWeight: FontWeight.w800,
                                color: brandColor),
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
        ),
        ), // IntrinsicHeight
      ),
    );
  }
}

// ── Cart badge ────────────────────────────────────────────────────────────────

class _CartBadge extends StatelessWidget {
  final int count;
  final Color brandColor;
  final VoidCallback onTap;
  const _CartBadge(
      {required this.count, required this.brandColor, required this.onTap});
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          const Padding(
            padding: EdgeInsets.all(12),
            child: Icon(Icons.shopping_bag_outlined, color: Colors.white),
          ),
          Positioned(
            top: 6,
            right: 6,
            child: Container(
              width: 16,
              height: 16,
              decoration:
                  BoxDecoration(color: brandColor, shape: BoxShape.circle),
              child: Center(
                child: Text(
                  '$count',
                  style: const TextStyle(
                      color: Colors.white,
                      fontSize: 9,
                      fontWeight: FontWeight.w800),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Side drawer ───────────────────────────────────────────────────────────────

class _SideDrawer extends StatelessWidget {
  final Restaurant restaurant;
  final List<Category> categories;
  final int? activeId;
  final VoidCallback onClose;
  final ValueChanged<int?> onSelect;
  const _SideDrawer({
    required this.restaurant,
    required this.categories,
    required this.activeId,
    required this.onClose,
    required this.onSelect,
  });

  @override
  Widget build(BuildContext context) {
    final brand = restaurant.brandColorValue;
    return Positioned(
      left: 0,
      top: 0,
      bottom: 0,
      width: 300,
      child: Container(
        color: Colors.white,
        child: SafeArea(
          child: Column(
            children: [
              // Header
              Container(
                color: const Color(0xFF1A1A1A),
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    if (restaurant.logoUrl != null)
                      ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: CachedNetworkImage(
                            imageUrl: restaurant.logoUrl!,
                            width: 36,
                            height: 36,
                            fit: BoxFit.cover),
                      ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        restaurant.name,
                        style: const TextStyle(
                            color: Colors.white,
                            fontSize: 15,
                            fontWeight: FontWeight.w800),
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close_rounded, color: Colors.white70),
                      onPressed: onClose,
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                    ),
                  ],
                ),
              ),
              // All
              ListTile(
                leading: Icon(Icons.grid_view_rounded,
                    color: activeId == null ? brand : Colors.black45, size: 20),
                title: Text('Tout le menu',
                    style: TextStyle(
                        fontSize: 14,
                        fontWeight: activeId == null
                            ? FontWeight.w700
                            : FontWeight.w500,
                        color: activeId == null ? brand : Colors.black87)),
                onTap: () => onSelect(null),
              ),
              const Divider(height: 1),
              // Categories
              Expanded(
                child: ListView.separated(
                  itemCount: categories.length,
                  separatorBuilder: (_, __) =>
                      const Divider(height: 1, indent: 16),
                  itemBuilder: (_, i) {
                    final cat = categories[i];
                    final isActive = activeId == cat.id;
                    return ListTile(
                      leading: cat.menuItems.isNotEmpty &&
                              cat.menuItems[0].imageUrl != null
                          ? ClipRRect(
                              borderRadius: BorderRadius.circular(6),
                              child: CachedNetworkImage(
                                  imageUrl: cat.menuItems[0].imageUrl!,
                                  width: 36,
                                  height: 36,
                                  fit: BoxFit.cover))
                          : Container(
                              width: 36,
                              height: 36,
                              decoration: BoxDecoration(
                                color: Colors.grey[100],
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: const Center(
                                  child: Text('?',
                                      style: TextStyle(fontSize: 16))),
                            ),
                      title: Text(cat.name,
                          style: TextStyle(
                              fontSize: 14,
                              fontWeight: isActive
                                  ? FontWeight.w700
                                  : FontWeight.w500,
                              color: isActive ? brand : Colors.black87)),
                      subtitle: Text(
                          '${cat.menuItems.length} plat${cat.menuItems.length > 1 ? 's' : ''}',
                          style: const TextStyle(
                              fontSize: 11, color: Colors.black38)),
                      trailing: Icon(Icons.chevron_right_rounded,
                          color: isActive ? brand : Colors.black26, size: 18),
                      onTap: () => onSelect(cat.id),
                    );
                  },
                ),
              ),
              // Hours
              HoursBand(restaurant: restaurant),
            ],
          ),
        ),
      ),
    );
  }
}

