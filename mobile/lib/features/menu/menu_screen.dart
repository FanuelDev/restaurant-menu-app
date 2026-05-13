// lib/features/menu/menu_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/providers/providers.dart';
import '../../core/theme/app_theme.dart';
import 'templates/template_classic.dart';
import 'templates/template_magazine.dart';
import 'templates/template_immersive.dart';
import 'templates/template_obsidian.dart';
import 'templates/template_lumiere.dart';

class MenuScreen extends ConsumerStatefulWidget {
  final String slug;
  const MenuScreen({super.key, required this.slug});

  @override
  ConsumerState<MenuScreen> createState() => _MenuScreenState();
}

class _MenuScreenState extends ConsumerState<MenuScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(restaurantProvider.notifier).load(widget.slug);
      ref.read(cartProvider.notifier).clear();
    });
  }

  void _refresh() {
    ref.read(restaurantProvider.notifier).load(widget.slug);
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(restaurantProvider);

    if (state.loading) return const _LoadingScreen();

    if (state.error != null) {
      return _ErrorScreen(
        error: state.error!,
        onRetry: _refresh,
      );
    }

    if (state.restaurant == null) return const _LoadingScreen();

    final restaurant = state.restaurant!;

    return switch (restaurant.templateId) {
      2 => TemplateMagazine(
          restaurant: restaurant,
          categories: state.categories,
          features: state.features,
          onRefresh: _refresh,
        ),
      3 => TemplateImmersive(
          restaurant: restaurant,
          categories: state.categories,
          features: state.features,
          onRefresh: _refresh,
        ),
      4 => TemplateObsidian(
          restaurant: restaurant,
          categories: state.categories,
          features: state.features,
          onRefresh: _refresh,
        ),
      5 => TemplateLumiere(
          restaurant: restaurant,
          categories: state.categories,
          features: state.features,
          onRefresh: _refresh,
        ),
      _ => TemplateClassic(
          restaurant: restaurant,
          categories: state.categories,
          features: state.features,
          onRefresh: _refresh,
        ),
    };
  }
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

class _LoadingScreen extends StatelessWidget {
  const _LoadingScreen();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.cream,
      body: SafeArea(
        child: Column(
          children: [
            // Fake header
            Container(height: 260, color: AppTheme.border),
            const SizedBox(height: 16),
            Expanded(
              child: ListView.separated(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                itemCount: 5,
                separatorBuilder: (_, __) =>
                    const Divider(height: 24, color: AppTheme.border),
                itemBuilder: (_, __) => const _SkeletonItem(),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SkeletonItem extends StatelessWidget {
  const _SkeletonItem();

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(height: 14, width: 160, decoration: BoxDecoration(
                color: AppTheme.border,
                borderRadius: BorderRadius.circular(6),
              )),
              const SizedBox(height: 8),
              Container(height: 11, width: 200, decoration: BoxDecoration(
                color: AppTheme.border,
                borderRadius: BorderRadius.circular(6),
              )),
              const SizedBox(height: 4),
              Container(height: 11, width: 140, decoration: BoxDecoration(
                color: AppTheme.border,
                borderRadius: BorderRadius.circular(6),
              )),
              const SizedBox(height: 10),
              Container(height: 13, width: 80, decoration: BoxDecoration(
                color: AppTheme.border,
                borderRadius: BorderRadius.circular(6),
              )),
            ],
          ),
        ),
        const SizedBox(width: 16),
        Container(
          width: 88, height: 88,
          decoration: BoxDecoration(
            color: AppTheme.border,
            borderRadius: BorderRadius.circular(14),
          ),
        ),
      ],
    );
  }
}

// ── Error screen ──────────────────────────────────────────────────────────────

class _ErrorScreen extends StatelessWidget {
  final String error;
  final VoidCallback onRetry;
  const _ErrorScreen({required this.error, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    final isNotFound = error.contains('404') || error.contains('introuvable');
    return Scaffold(
      backgroundColor: AppTheme.cream,
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(40),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 80, height: 80,
                decoration: const BoxDecoration(
                    color: AppTheme.border, shape: BoxShape.circle),
                child: const Icon(Icons.wifi_off_rounded,
                    size: 36, color: AppTheme.grey3),
              ),
              const SizedBox(height: 20),
              Text(
                isNotFound ? 'Restaurant introuvable'
                    : 'Connexion impossible',
                style: AppTheme.heading(AppTheme.charcoal),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                isNotFound
                    ? 'Verifiez le QR code ou reessayez plus tard.'
                    : 'Verifiez votre connexion internet.',
                style: AppTheme.body(AppTheme.grey2),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 28),
              FilledButton.icon(
                onPressed: onRetry,
                icon: const Icon(Icons.refresh_rounded, size: 18),
                label: const Text('Reessayer'),
                style: FilledButton.styleFrom(
                  backgroundColor: AppTheme.charcoal,
                  padding: const EdgeInsets.symmetric(
                      horizontal: 24, vertical: 14),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
