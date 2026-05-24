// lib/features/menu/menu_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
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

    final template = switch (restaurant.templateId) {
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

    // Pas de bannière hors-ligne → affiche le template directement
    if (!state.isOffline) return template;

    // Bannière hors-ligne superposée en haut du template
    return Stack(
      children: [
        template,
        Positioned(
          top: 0, left: 0, right: 0,
          child: _OfflineBanner(cachedAt: state.cachedAt, onRetry: _refresh),
        ),
      ],
    );
  }
}

// ── Offline banner ────────────────────────────────────────────────────────────

class _OfflineBanner extends StatelessWidget {
  final DateTime? cachedAt;
  final VoidCallback onRetry;
  const _OfflineBanner({this.cachedAt, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    final topPadding = MediaQuery.paddingOf(context).top;
    final dateStr = cachedAt != null
        ? DateFormat('d MMM, HH:mm', 'fr_FR').format(cachedAt!.toLocal())
        : null;

    return Material(
      color: const Color(0xFF1C1917),
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: EdgeInsets.only(
            top: topPadding > 0 ? 0 : 8,
            bottom: 8,
            left: 16,
            right: 8,
          ),
          child: Row(
            children: [
              // Dot animé
              _PulseDot(),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text(
                      'Mode hors ligne',
                      style: TextStyle(
                        color: Color(0xFFFBBF24),
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        height: 1.2,
                      ),
                    ),
                    if (dateStr != null)
                      Text(
                        'Données du $dateStr',
                        style: const TextStyle(
                          color: Color(0xFFFEF3C7),
                          fontSize: 11,
                          height: 1.3,
                        ),
                      ),
                  ],
                ),
              ),
              TextButton(
                onPressed: onRetry,
                style: TextButton.styleFrom(
                  foregroundColor: const Color(0xFFFBBF24),
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
                child: const Text('Actualiser',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _PulseDot extends StatefulWidget {
  @override
  State<_PulseDot> createState() => _PulseDotState();
}

class _PulseDotState extends State<_PulseDot>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  late final Animation<double> _anim;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1600),
    )..repeat(reverse: true);
    _anim = Tween<double>(begin: 0.25, end: 1.0).animate(
      CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => FadeTransition(
    opacity: _anim,
    child: Container(
      width: 8, height: 8,
      decoration: const BoxDecoration(
        color: Color(0xFFF59E0B),
        shape: BoxShape.circle,
      ),
    ),
  );
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
