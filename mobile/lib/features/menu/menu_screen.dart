// lib/features/menu/menu_screen.dart
// Router: choisit le bon template selon restaurant.templateId
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/providers/providers.dart';
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

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(restaurantProvider);

    if (state.loading) {
      return const _LoadingScreen();
    }

    if (state.error != null) {
      return _ErrorScreen(
        error: state.error!,
        onRetry: () => ref.read(restaurantProvider.notifier).load(widget.slug),
      );
    }

    if (state.restaurant == null) {
      return const _LoadingScreen();
    }

    final restaurant = state.restaurant!;
    final features = state.features;
    final categories = state.categories;

    // Apply brand color to theme
    final brandColor = restaurant.brandColorValue;

    return Theme(
      data: Theme.of(context).copyWith(
        colorScheme: ColorScheme.fromSeed(
          seedColor: brandColor,
          brightness: Brightness.light,
        ),
      ),
      child: switch (restaurant.templateId) {
        2 => TemplateMagazine(
            restaurant: restaurant,
            categories: categories,
            features: features,
          ),
        3 => TemplateImmersive(
            restaurant: restaurant,
            categories: categories,
            features: features,
          ),
        4 => TemplateObsidian(
            restaurant: restaurant,
            categories: categories,
            features: features,
          ),
        5 => TemplateLumiere(
            restaurant: restaurant,
            categories: categories,
            features: features,
          ),
        _ => TemplateClassic(
            restaurant: restaurant,
            categories: categories,
            features: features,
          ),
      },
    );
  }
}

// ── Loading & Error ───────────────────────────────────────────────────────────

class _LoadingScreen extends StatelessWidget {
  const _LoadingScreen();
  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 16),
            Text('Chargement du menu…',
                style: TextStyle(color: Colors.black54, fontSize: 14)),
          ],
        ),
      ),
    );
  }
}

class _ErrorScreen extends StatelessWidget {
  final String error;
  final VoidCallback onRetry;
  const _ErrorScreen({required this.error, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    final isNotFound = error.contains('404') || error.contains('introuvable');
    return Scaffold(
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('😕', style: TextStyle(fontSize: 48)),
              const SizedBox(height: 16),
              Text(
                isNotFound
                    ? 'Restaurant introuvable'
                    : 'Impossible de charger le menu',
                style:
                    const TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                isNotFound
                    ? 'Vérifiez le QR code ou réessayez plus tard.'
                    : 'Vérifiez votre connexion et réessayez.',
                style: const TextStyle(color: Colors.black54),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              FilledButton.icon(
                onPressed: onRetry,
                icon: const Icon(Icons.refresh_rounded),
                label: const Text('Réessayer'),
              ),
              const SizedBox(height: 12),
              TextButton(
                onPressed: () => Navigator.of(context).pop(),
                child: const Text('Retour'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
