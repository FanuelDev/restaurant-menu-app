// lib/features/menu/templates/template_classic.dart
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';
import '../../../core/models/models.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/price_formatter.dart';
import '../widgets/shared_widgets.dart';

class TemplateClassic extends ConsumerStatefulWidget {
  final Restaurant restaurant;
  final List<Category> categories;
  final RestaurantFeatures? features;
  final VoidCallback? onRefresh;

  const TemplateClassic({
    super.key,
    required this.restaurant,
    required this.categories,
    this.features,
    this.onRefresh,
  });

  @override
  ConsumerState<TemplateClassic> createState() => _TemplateClassicState();
}

class _TemplateClassicState extends ConsumerState<TemplateClassic>
    with TickerProviderStateMixin {
  // Controllers
  final _scrollCtrl = ScrollController();
  late TabController _tabCtrl;

  // State
  String _search = '';
  bool _searchActive = false;
  final _searchCtrl = TextEditingController();
  final _searchFocus = FocusNode();

  // Keys for category sections (for scroll-to)
  final List<GlobalKey> _sectionKeys = [];

  // Animations
  late AnimationController _fabCtrl;
  bool _fabVisible = true;

  @override
  void initState() {
    super.initState();

    final catCount = widget.categories.length;
    _tabCtrl = TabController(length: catCount == 0 ? 1 : catCount, vsync: this);
    _sectionKeys.addAll(List.generate(catCount, (_) => GlobalKey()));

    _fabCtrl = AnimationController(vsync: this,
        duration: const Duration(milliseconds: 250));
    _fabCtrl.forward();

    _scrollCtrl.addListener(_onScroll);
    _tabCtrl.addListener(_onTabChanged);
  }

  void _onScroll() {
    // Hide/show FAB based on scroll direction
    final dir = _scrollCtrl.position.userScrollDirection;
    if (dir == ScrollDirection.reverse && _fabVisible) {
      setState(() => _fabVisible = false);
    } else if (dir == ScrollDirection.forward && !_fabVisible) {
      setState(() => _fabVisible = true);
    }
  }

  void _onTabChanged() {
    if (!_tabCtrl.indexIsChanging) return;
    final idx = _tabCtrl.index;
    if (idx < _sectionKeys.length) {
      final ctx = _sectionKeys[idx].currentContext;
      if (ctx != null) {
        Scrollable.ensureVisible(
          ctx,
          duration: const Duration(milliseconds: 400),
          curve: AppTheme.spring,
          alignment: 0.0,
        );
      }
    }
  }

  @override
  void dispose() {
    _scrollCtrl.dispose();
    _tabCtrl.dispose();
    _fabCtrl.dispose();
    _searchCtrl.dispose();
    _searchFocus.dispose();
    super.dispose();
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

  void _toggleSearch() {
    setState(() {
      _searchActive = !_searchActive;
      if (!_searchActive) {
        _search = '';
        _searchCtrl.clear();
        _searchFocus.unfocus();
      } else {
        Future.delayed(const Duration(milliseconds: 100),
            () => _searchFocus.requestFocus());
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final brand = widget.restaurant.brandColorValue;
    final hasOrders = widget.features?.ordersAndReservations ?? false;
    final cats = _filtered;

    return Scaffold(
      backgroundColor: AppTheme.cream,
      body: Stack(
        children: [
      RefreshIndicator(
        onRefresh: () async => widget.onRefresh?.call(),
        color: brand,
        child: CustomScrollView(
          controller: _scrollCtrl,
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            // ── Collapsible hero ────────────────────────────────────────────
            _HeroSliver(
              restaurant: widget.restaurant,
              onRefresh: widget.onRefresh,
              onSearch: _toggleSearch,
              searchActive: _searchActive,
              hasOrders: hasOrders,
            ),

            // ── Search bar (conditional) ────────────────────────────────────
            if (_searchActive)
              SliverToBoxAdapter(
                child: AnimatedContainer(
                  duration: AppTheme.normal,
                  curve: AppTheme.spring,
                  color: AppTheme.surface,
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
                  child: TextField(
                    controller: _searchCtrl,
                    focusNode: _searchFocus,
                    onChanged: (v) => setState(() => _search = v),
                    style: AppTheme.body(AppTheme.charcoal),
                    decoration: InputDecoration(
                      hintText: 'Rechercher un plat...',
                      hintStyle: AppTheme.body(AppTheme.grey3),
                      prefixIcon: const Icon(Icons.search_rounded,
                          color: AppTheme.grey3, size: 20),
                      suffixIcon: _search.isNotEmpty
                          ? IconButton(
                              icon: const Icon(Icons.close_rounded,
                                  size: 18, color: AppTheme.grey3),
                              onPressed: () => setState(() {
                                _search = '';
                                _searchCtrl.clear();
                              }),
                            )
                          : null,
                      filled: true,
                      fillColor: AppTheme.cream,
                      contentPadding:
                          const EdgeInsets.symmetric(vertical: 0),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: AppTheme.border),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: AppTheme.border),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide(color: brand, width: 1.5),
                      ),
                    ),
                  ),
                ),
              ),

            // ── Category tabs (sticky) ──────────────────────────────────────
            if (!_searchActive && widget.categories.length > 1)
              SliverPersistentHeader(
                pinned: true,
                delegate: _CatTabDelegate(
                  categories: widget.categories,
                  tabCtrl: _tabCtrl,
                  brandColor: brand,
                ),
              ),

            // ── Hours ───────────────────────────────────────────────────────
            SliverToBoxAdapter(
              child: HoursBand(restaurant: widget.restaurant),
            ),

            // ── Items ───────────────────────────────────────────────────────
            if (cats.isEmpty)
              SliverFillRemaining(
                child: Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.search_off_rounded,
                          size: 52, color: AppTheme.grey4),
                      const SizedBox(height: 14),
                      Text('Aucun plat trouve',
                          style: AppTheme.title(AppTheme.grey2)),
                    ],
                  ),
                ),
              )
            else
              for (int ci = 0; ci < cats.length; ci++) ...[
                // Category header
                SliverToBoxAdapter(
                  key: ci < _sectionKeys.length ? _sectionKeys[ci] : null,
                  child: _CategoryHeader(
                    category: cats[ci],
                    brandColor: brand,
                  ),
                ),
                // Items list
                SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (ctx, i) => _DishRow(
                      item: cats[ci].menuItems[i],
                      index: i,
                      brandColor: brand,
                      currency: widget.restaurant.currency,
                      hasOrders: hasOrders,
                      isLast: i == cats[ci].menuItems.length - 1,
                    ),
                    childCount: cats[ci].menuItems.length,
                  ),
                ),
              ],

            const SliverToBoxAdapter(child: SizedBox(height: 120)),
          ],
        ),
      ),

          // ── Floating cart bar ───────────────────────────────────────────
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

// ── Hero sliver ───────────────────────────────────────────────────────────────

class _HeroSliver extends StatelessWidget {
  final Restaurant restaurant;
  final VoidCallback? onRefresh;
  final VoidCallback onSearch;
  final bool searchActive;
  final bool hasOrders;

  const _HeroSliver({
    required this.restaurant,
    required this.onRefresh,
    required this.onSearch,
    required this.searchActive,
    required this.hasOrders,
  });

  @override
  Widget build(BuildContext context) {
    final brand = restaurant.brandColorValue;

    return SliverAppBar(
      expandedHeight: 220,
      pinned: true,
      backgroundColor: AppTheme.surface,
      foregroundColor: Colors.white,
      elevation: 0,
      scrolledUnderElevation: 0.5,
      leading: Container(
        margin: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: Colors.black26,
          shape: BoxShape.circle,
        ),
        child: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded,
              color: Colors.white, size: 16),
          onPressed: () => context.go('/'),
        ),
      ),
      actions: [
        Container(
          margin: const EdgeInsets.only(right: 4, top: 8, bottom: 8),
          decoration: BoxDecoration(
            color: Colors.black26,
            shape: BoxShape.circle,
          ),
          child: IconButton(
            icon: Icon(
              searchActive ? Icons.close_rounded : Icons.search_rounded,
              color: Colors.white, size: 20,
            ),
            onPressed: onSearch,
          ),
        ),
        Container(
          margin: const EdgeInsets.only(right: 4, top: 8, bottom: 8),
          decoration: BoxDecoration(
            color: Colors.black26,
            shape: BoxShape.circle,
          ),
          child: IconButton(
            icon: const Icon(Icons.refresh_rounded,
                color: Colors.white, size: 20),
            onPressed: onRefresh,
            tooltip: 'Actualiser',
          ),
        ),
        if (hasOrders)
          Container(
            margin: const EdgeInsets.only(right: 8, top: 8, bottom: 8),
            decoration: BoxDecoration(
              color: Colors.black26,
              shape: BoxShape.circle,
            ),
            child: IconButton(
              icon: const Icon(Icons.calendar_month_outlined,
                  color: Colors.white, size: 20),
              onPressed: () =>
                  context.push('/reservation/${restaurant.slug}'),
            ),
          ),
      ],
      flexibleSpace: FlexibleSpaceBar(
        collapseMode: CollapseMode.parallax,
        background: Stack(
          fit: StackFit.expand,
          children: [
            // Cover image
            restaurant.coverImageUrl != null
                ? CachedNetworkImage(
                    imageUrl: restaurant.coverImageUrl!,
                    fit: BoxFit.cover,
                    placeholder: (_, __) => Container(color: brand),
                    errorWidget: (_, __, ___) => Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [brand, brand.withValues(alpha: 0.7)],
                        ),
                      ),
                    ),
                  )
                : Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [brand, brand.withValues(alpha: 0.75)],
                      ),
                    ),
                  ),

            // Gradient overlay
            Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.transparent,
                    Colors.black.withValues(alpha: 0.65),
                  ],
                  stops: const [0.4, 1.0],
                ),
              ),
            ),

            // Restaurant info
            Positioned(
              left: 20, right: 20, bottom: 20,
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  // Logo
                  if (restaurant.logoUrl != null) ...[
                    ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: CachedNetworkImage(
                        imageUrl: restaurant.logoUrl!,
                        width: 52, height: 52, fit: BoxFit.cover,
                        errorWidget: (_, __, ___) => const SizedBox.shrink(),
                      ),
                    ),
                    const SizedBox(width: 12),
                  ],
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(restaurant.name,
                            style: AppTheme.display(Colors.white)
                                .copyWith(fontSize: 22, height: 1.2)),
                        if (restaurant.slogan != null) ...[
                          const SizedBox(height: 3),
                          Text(restaurant.slogan!,
                              style: AppTheme.caption(Colors.white70)
                                  .copyWith(fontSize: 12),
                              maxLines: 1, overflow: TextOverflow.ellipsis),
                        ],
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Category tabs (sticky delegate) ──────────────────────────────────────────

class _CatTabDelegate extends SliverPersistentHeaderDelegate {
  final List<Category> categories;
  final TabController tabCtrl;
  final Color brandColor;
  _CatTabDelegate({
    required this.categories,
    required this.tabCtrl,
    required this.brandColor,
  });

  @override double get minExtent => 48;
  @override double get maxExtent => 48;
  @override bool shouldRebuild(_CatTabDelegate old) =>
      old.categories.length != categories.length;

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlaps) {
    return Container(
      decoration: BoxDecoration(
        color: AppTheme.surface,
        border: Border(
          bottom: BorderSide(color: AppTheme.border.withValues(alpha: 0.8)),
        ),
      ),
      child: TabBar(
        controller: tabCtrl,
        isScrollable: true,
        tabAlignment: TabAlignment.start,
        dividerColor: Colors.transparent,
        indicatorColor: brandColor,
        indicatorWeight: 2.5,
        indicatorSize: TabBarIndicatorSize.label,
        labelColor: brandColor,
        unselectedLabelColor: AppTheme.grey2,
        labelStyle: AppTheme.caption(brandColor)
            .copyWith(fontWeight: FontWeight.w700, fontSize: 13),
        unselectedLabelStyle: AppTheme.caption(AppTheme.grey2)
            .copyWith(fontWeight: FontWeight.w500, fontSize: 13),
        padding: const EdgeInsets.symmetric(horizontal: 12),
        tabs: categories.map((c) => Tab(text: c.name)).toList(),
      ),
    );
  }
}

// ── Category header ───────────────────────────────────────────────────────────

class _CategoryHeader extends StatelessWidget {
  final Category category;
  final Color brandColor;
  const _CategoryHeader({required this.category, required this.brandColor});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppTheme.cream,
      padding: const EdgeInsets.fromLTRB(20, 24, 20, 10),
      child: Row(
        children: [
          Expanded(
            child: Text(category.name,
                style: AppTheme.heading(AppTheme.charcoal)
                    .copyWith(fontSize: 18)),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              color: brandColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              '${category.menuItems.length}',
              style: AppTheme.label(brandColor).copyWith(fontSize: 11),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Dish row (list style) ─────────────────────────────────────────────────────

class _DishRow extends ConsumerStatefulWidget {
  final MenuItem item;
  final int index;
  final Color brandColor;
  final String currency;
  final bool hasOrders;
  final bool isLast;

  const _DishRow({
    required this.item,
    required this.index,
    required this.brandColor,
    required this.currency,
    required this.hasOrders,
    required this.isLast,
  });

  @override
  ConsumerState<_DishRow> createState() => _DishRowState();
}

class _DishRowState extends ConsumerState<_DishRow>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _fade;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this,
        duration: const Duration(milliseconds: 350));
    _fade = CurvedAnimation(parent: _ctrl, curve: Curves.easeOut);
    Future.delayed(Duration(milliseconds: 40 * (widget.index % 8)), () {
      if (mounted) _ctrl.forward();
    });
  }

  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    final item = widget.item;
    final unavailable = !item.isAvailable;

    return FadeTransition(
      opacity: _fade,
      child: Opacity(
        opacity: unavailable ? 0.5 : 1.0,
        child: Container(
          color: AppTheme.surface,
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.symmetric(
                    horizontal: 20, vertical: 16),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // ── Left: text info ──────────────────────────────────
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Badge
                          if (item.badge != null) ...[
                            BadgeChip(badge: item.badge!),
                            const SizedBox(height: 6),
                          ],

                          // Name
                          Text(item.name,
                              style: AppTheme.bodyBold(AppTheme.charcoal)
                                  .copyWith(fontSize: 15, height: 1.3)),

                          // Description
                          if (item.description != null &&
                              item.description!.isNotEmpty) ...[
                            const SizedBox(height: 5),
                            Text(item.description!,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: AppTheme.caption(AppTheme.grey2)
                                    .copyWith(
                                        height: 1.45, fontSize: 12.5)),
                          ],

                          const SizedBox(height: 12),

                          // Price + qty
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.center,
                            children: [
                              Text(
                                item.priceFormatted ??
                                    formatPrice(item.price, widget.currency),
                                style: AppTheme.bodyBold(widget.brandColor)
                                    .copyWith(fontSize: 14),
                              ),
                              const Spacer(),
                              if (widget.hasOrders && !unavailable)
                                QtyControl(
                                  item: item,
                                  brandColor: widget.brandColor,
                                ),
                            ],
                          ),
                        ],
                      ),
                    ),

                    // ── Right: image ──────────────────────────────────────
                    if (item.imageUrl != null &&
                        item.imageUrl!.isNotEmpty) ...[
                      const SizedBox(width: 16),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(14),
                        child: CachedNetworkImage(
                          imageUrl: item.imageUrl!,
                          width: 88,
                          height: 88,
                          fit: BoxFit.cover,
                          placeholder: (_, __) => Container(
                            width: 88, height: 88,
                            color: AppTheme.border,
                          ),
                          errorWidget: (_, __, ___) => Container(
                            width: 88, height: 88,
                            color: AppTheme.cream,
                            child: const Icon(Icons.restaurant_rounded,
                                color: AppTheme.grey4, size: 28),
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),

              // Divider
              if (!widget.isLast)
                const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 20),
                  child: Divider(height: 1, color: AppTheme.border),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
