import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gap/gap.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/currency_provider.dart';
import '../../../core/utils/currency_utils.dart';
import '../../orders/models/order_models.dart';
import '../../orders/providers/orders_provider.dart';

class MenuScreen extends ConsumerStatefulWidget {
  const MenuScreen({super.key});

  @override
  ConsumerState<MenuScreen> createState() => _MenuScreenState();
}

class _MenuScreenState extends ConsumerState<MenuScreen>
    with SingleTickerProviderStateMixin {
  final _searchController = TextEditingController();
  String _search = '';
  int _selectedCategoryIndex = 0;

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final categoriesAsync = ref.watch(categoriesProvider);
    final currency = ref.watch(currencyProvider);
    final topPadding = MediaQuery.of(context).padding.top;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: Column(
        children: [
          // ── Dark warm header ───────────────────────────────────────────
          Container(
            decoration: const BoxDecoration(
              gradient: AppColors.navGradient,
            ),
            child: SafeArea(
              bottom: false,
              child: Column(
                children: [
                  Padding(
                    padding: EdgeInsets.fromLTRB(
                        20, topPadding > 0 ? 8 : 16, 20, 0),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color:
                                AppColors.brand.withValues(alpha: 0.2),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(Icons.menu_book_rounded,
                              color: AppColors.brand, size: 20),
                        ),
                        const Gap(12),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Carte du restaurant',
                              style: GoogleFonts.poppins(
                                fontSize: 18,
                                fontWeight: FontWeight.w700,
                                color: AppColors.textOnDark,
                              ),
                            ),
                            Text(
                              'Consultation du menu',
                              style: GoogleFonts.poppins(
                                fontSize: 11,
                                color: AppColors.textOnDarkMuted,
                              ),
                            ),
                          ],
                        ),
                        const Spacer(),
                        IconButton(
                          onPressed: () => ref.invalidate(categoriesProvider),
                          icon: const Icon(Icons.refresh_rounded,
                              color: AppColors.textOnDarkMuted, size: 20),
                        ),
                      ],
                    ),
                  ),
                  const Gap(12),
                  // Search bar
                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
                    child: Container(
                      height: 44,
                      decoration: BoxDecoration(
                        color: AppColors.navSurface,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                            color: AppColors.brand.withValues(alpha: 0.2)),
                      ),
                      child: TextField(
                        controller: _searchController,
                        onChanged: (v) => setState(() => _search = v),
                        style: GoogleFonts.poppins(
                            fontSize: 14, color: AppColors.textOnDark),
                        decoration: InputDecoration(
                          hintText: 'Rechercher un plat...',
                          hintStyle: GoogleFonts.poppins(
                              fontSize: 14,
                              color: AppColors.textOnDarkMuted),
                          prefixIcon: const Icon(Icons.search_rounded,
                              size: 18,
                              color: AppColors.textOnDarkMuted),
                          suffixIcon: _search.isNotEmpty
                              ? IconButton(
                                  icon: const Icon(Icons.clear,
                                      size: 16,
                                      color: AppColors.textOnDarkMuted),
                                  onPressed: () {
                                    _searchController.clear();
                                    setState(() => _search = '');
                                  },
                                )
                              : null,
                          border: InputBorder.none,
                          isDense: true,
                          contentPadding: const EdgeInsets.symmetric(
                              horizontal: 12, vertical: 12),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // ── Body ──────────────────────────────────────────────────────
          Expanded(
            child: categoriesAsync.when(
              data: (categories) {
                if (categories.isEmpty) {
                  return _EmptyMenu();
                }

                final filtered = _applySearch(categories);

                return Column(
                  children: [
                    // Category chips
                    if (categories.length > 1 && _search.isEmpty) ...[
                      Container(
                        color: AppColors.surface,
                        padding: const EdgeInsets.fromLTRB(16, 10, 16, 10),
                        child: SizedBox(
                          height: 36,
                          child: ListView.separated(
                            scrollDirection: Axis.horizontal,
                            itemCount: categories.length,
                            separatorBuilder: (_, __) => const Gap(8),
                            itemBuilder: (_, i) {
                              final cat = categories[i];
                              final isActive = _selectedCategoryIndex == i;
                              return GestureDetector(
                                onTap: () => setState(
                                    () => _selectedCategoryIndex = i),
                                child: AnimatedContainer(
                                  duration:
                                      const Duration(milliseconds: 200),
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 16, vertical: 6),
                                  decoration: BoxDecoration(
                                    gradient: isActive
                                        ? AppColors.brandGradient
                                        : null,
                                    color: isActive
                                        ? null
                                        : AppColors.surfaceHigh,
                                    borderRadius:
                                        BorderRadius.circular(20),
                                    border: Border.all(
                                      color: isActive
                                          ? AppColors.brand
                                          : AppColors.border,
                                    ),
                                  ),
                                  child: Text(
                                    cat.name,
                                    style: GoogleFonts.poppins(
                                      fontSize: 12,
                                      fontWeight: isActive
                                          ? FontWeight.w700
                                          : FontWeight.w400,
                                      color: isActive
                                          ? AppColors.textOnDark
                                          : AppColors.textSecondary,
                                    ),
                                  ),
                                ),
                              );
                            },
                          ),
                        ),
                      ),
                      const Divider(height: 1, color: AppColors.border),
                    ],

                    // Items list
                    Expanded(
                      child: filtered.isEmpty
                          ? _NoResults(search: _search)
                          : RefreshIndicator(
                              color: AppColors.brand,
                              backgroundColor: AppColors.surface,
                              onRefresh: () async =>
                                  ref.invalidate(categoriesProvider),
                              child: ListView.builder(
                                padding: const EdgeInsets.fromLTRB(
                                    16, 12, 16, 100),
                                itemCount: filtered.length,
                                itemBuilder: (_, index) {
                                  final cat = filtered[index];
                                  return _CategorySection(
                                    category: cat,
                                    currency: currency,
                                    index: index,
                                  );
                                },
                              ),
                            ),
                    ),
                  ],
                );
              },
              loading: () => _MenuLoading(),
              error: (e, _) => _MenuError(
                  onRetry: () => ref.invalidate(categoriesProvider)),
            ),
          ),
        ],
      ),
    );
  }

  List<MenuCategory> _applySearch(List<MenuCategory> categories) {
    if (_search.isEmpty) {
      // Show only selected category (or all if only one)
      if (categories.length > 1) {
        if (_selectedCategoryIndex < categories.length) {
          return [categories[_selectedCategoryIndex]];
        }
      }
      return categories;
    }

    final q = _search.toLowerCase();
    return categories
        .map((cat) {
          final matchItems = cat.items
              .where((item) =>
                  item.name.toLowerCase().contains(q) ||
                  (item.description?.toLowerCase().contains(q) ?? false))
              .toList();
          if (matchItems.isEmpty) return null;
          return MenuCategory(
              id: cat.id, name: cat.name, items: matchItems);
        })
        .whereType<MenuCategory>()
        .toList();
  }
}

// ─── Category section ─────────────────────────────────────────────────────────

class _CategorySection extends StatelessWidget {
  final MenuCategory category;
  final String currency;
  final int index;

  const _CategorySection({
    required this.category,
    required this.currency,
    required this.index,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (index > 0) const Gap(24),
        Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: Row(
            children: [
              Container(
                width: 4,
                height: 18,
                decoration: BoxDecoration(
                  gradient: AppColors.brandGradient,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const Gap(10),
              Text(
                category.name,
                style: GoogleFonts.poppins(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
              ),
              const Gap(8),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: AppColors.brand.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  '${category.items.length}',
                  style: GoogleFonts.poppins(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: AppColors.brand,
                  ),
                ),
              ),
            ],
          ).animate().fadeIn(duration: 350.ms, delay: (index * 60).ms),
        ),
        ...category.items.asMap().entries.map((e) {
          final i = e.key;
          final item = e.value;
          return Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: _MenuItemCard(
              item: item,
              currency: currency,
            )
                .animate()
                .fadeIn(
                    duration: 350.ms,
                    delay: ((index * 60) + (i * 40) + 80).ms)
                .slideY(
                    begin: 0.06,
                    delay: ((index * 60) + (i * 40) + 80).ms,
                    curve: Curves.easeOutCubic),
          );
        }),
      ],
    );
  }
}

// ─── Menu item card ───────────────────────────────────────────────────────────

class _MenuItemCard extends StatelessWidget {
  final MenuItem item;
  final String currency;

  const _MenuItemCard({required this.item, required this.currency});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
        boxShadow: [
          BoxShadow(
            color: AppColors.textPrimary.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          // Image area
          ClipRRect(
            borderRadius: const BorderRadius.only(
              topLeft: Radius.circular(16),
              bottomLeft: Radius.circular(16),
            ),
            child: SizedBox(
              width: 96,
              height: 96,
              child: item.imageUrl != null && item.imageUrl!.isNotEmpty
                  ? Image.network(
                      item.imageUrl!,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) =>
                          _ImagePlaceholder(name: item.name),
                    )
                  : _ImagePlaceholder(name: item.name),
            ),
          ),
          // Content
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          item.name,
                          style: GoogleFonts.poppins(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: AppColors.textPrimary,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const Gap(8),
                      _AvailabilityDot(isAvailable: item.isAvailable),
                    ],
                  ),
                  if (item.description != null &&
                      item.description!.isNotEmpty) ...[
                    const Gap(4),
                    Text(
                      item.description!,
                      style: GoogleFonts.poppins(
                        fontSize: 12,
                        color: AppColors.textMuted,
                        height: 1.4,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                  const Gap(8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        CurrencyUtils.formatAmount(
                            item.price.toDouble(),
                            currency: currency),
                        style: GoogleFonts.poppins(
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                          color: AppColors.brand,
                        ),
                      ),
                      if (!item.isAvailable)
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: AppColors.textMuted
                                .withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            'Indisponible',
                            style: GoogleFonts.poppins(
                              fontSize: 10,
                              fontWeight: FontWeight.w600,
                              color: AppColors.textMuted,
                            ),
                          ),
                        ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ImagePlaceholder extends StatelessWidget {
  final String name;
  const _ImagePlaceholder({required this.name});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.surfaceHigh,
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.restaurant_rounded,
                color: AppColors.border, size: 28),
            const Gap(4),
            Text(
              name.isNotEmpty ? name[0].toUpperCase() : '?',
              style: GoogleFonts.poppins(
                fontSize: 16,
                fontWeight: FontWeight.w800,
                color: AppColors.textMuted,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _AvailabilityDot extends StatelessWidget {
  final bool isAvailable;
  const _AvailabilityDot({required this.isAvailable});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 8,
      height: 8,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: isAvailable ? AppColors.emerald : AppColors.textMuted,
      ),
    );
  }
}

// ─── States ───────────────────────────────────────────────────────────────────

class _EmptyMenu extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: AppColors.surfaceHigh,
              shape: BoxShape.circle,
              border: Border.all(color: AppColors.border),
            ),
            child: const Icon(Icons.menu_book_outlined,
                color: AppColors.textMuted, size: 44),
          ).animate().fadeIn(duration: 400.ms).scale(
              begin: const Offset(0.8, 0.8)),
          const Gap(20),
          Text(
            'Menu vide',
            style: GoogleFonts.poppins(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimary,
            ),
          ).animate().fadeIn(duration: 400.ms, delay: 100.ms),
          const Gap(8),
          Text(
            'Aucune catégorie ou article dans le menu.',
            style: GoogleFonts.poppins(
                fontSize: 13, color: AppColors.textMuted),
            textAlign: TextAlign.center,
          ).animate().fadeIn(duration: 400.ms, delay: 150.ms),
        ],
      ),
    );
  }
}

class _NoResults extends StatelessWidget {
  final String search;
  const _NoResults({required this.search});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.search_off_rounded,
              color: AppColors.textMuted, size: 44),
          const Gap(16),
          Text(
            'Aucun résultat pour "$search"',
            style: GoogleFonts.poppins(
                fontSize: 14, color: AppColors.textMuted),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

class _MenuLoading extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const CircularProgressIndicator(color: AppColors.brand),
          const Gap(16),
          Text(
            'Chargement du menu...',
            style: GoogleFonts.poppins(
                fontSize: 14, color: AppColors.textMuted),
          ),
        ],
      ),
    );
  }
}

class _MenuError extends StatelessWidget {
  final VoidCallback onRetry;
  const _MenuError({required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.error_outline_rounded,
              color: AppColors.brand, size: 44),
          const Gap(16),
          Text(
            'Impossible de charger le menu',
            style: GoogleFonts.poppins(
                fontSize: 14, color: AppColors.textSecondary),
          ),
          const Gap(16),
          GestureDetector(
            onTap: onRetry,
            child: Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              decoration: BoxDecoration(
                gradient: AppColors.brandGradient,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                'Réessayer',
                style: GoogleFonts.poppins(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textOnDark,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
