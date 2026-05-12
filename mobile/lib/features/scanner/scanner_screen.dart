// lib/features/scanner/scanner_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../../core/providers/providers.dart';

class ScannerScreen extends ConsumerStatefulWidget {
  const ScannerScreen({super.key});

  @override
  ConsumerState<ScannerScreen> createState() => _ScannerScreenState();
}

class _ScannerScreenState extends ConsumerState<ScannerScreen> {
  final MobileScannerController _ctrl = MobileScannerController(
    detectionSpeed: DetectionSpeed.noDuplicates,
    facing: CameraFacing.back,
  );
  bool _scanned = false;

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  void _onDetect(BarcodeCapture capture) {
    if (_scanned) return;
    final barcode = capture.barcodes.firstOrNull;
    if (barcode == null) return;
    final raw = barcode.rawValue ?? '';

    // Accept full URL (https://slug.saemenus.com) or bare slug
    final slug = _extractSlug(raw);
    if (slug == null || slug.isEmpty) return;

    setState(() => _scanned = true);
    ref.read(recentRestaurantsProvider.notifier).addSlug(slug);
    context.go('/menu/$slug');
  }

  String? _extractSlug(String value) {
    // Try to parse as URL first
    try {
      final uri = Uri.parse(value);
      if (uri.host.isNotEmpty) {
        final parts = uri.host.split('.');
        if (parts.length >= 2) {
          final sub = parts[0];
          const reserved = {'www', 'api', 'admin', 'app', 'backend'};
          if (!reserved.contains(sub)) return sub;
        }
      }
    } catch (_) {}
    // Fallback: treat raw value as slug if it matches pattern
    if (RegExp(r'^[a-z0-9-]{2,50}$').hasMatch(value)) return value;
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final recents = ref.watch(recentRestaurantsProvider);
    final profile = ref.watch(profileProvider);
    final isTablet = MediaQuery.sizeOf(context).width > 600;

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // Camera
          MobileScanner(controller: _ctrl, onDetect: _onDetect),

          // Overlay UI
          SafeArea(
            child: Column(
              children: [
                // Top bar
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'SaeMenus',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 22,
                          fontWeight: FontWeight.w800,
                          letterSpacing: -0.5,
                        ),
                      ),
                      Row(children: [
                        _TopBtn(
                          icon: Icons.flash_on_rounded,
                          onTap: () => _ctrl.toggleTorch(),
                        ),
                        const SizedBox(width: 8),
                        _TopBtn(
                          icon: Icons.person_outline_rounded,
                          badge: profile.isComplete ? null : '!',
                          onTap: () async {
                            await context.push('/profile');
                            if (mounted) setState(() {});
                          },
                        ),
                      ]),
                    ],
                  ),
                ),

                const Spacer(),

                // Scan frame
                _ScanFrame(size: isTablet ? 280 : 240),

                const SizedBox(height: 24),
                const Text(
                  'Scannez le QR code du restaurant',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 6),
                const Text(
                  'ou entrez le nom du restaurant manuellement',
                  style: TextStyle(color: Colors.white54, fontSize: 13),
                ),
                const SizedBox(height: 20),

                // Manual entry button
                TextButton(
                  onPressed: () => _showManualEntry(context),
                  style: TextButton.styleFrom(
                    foregroundColor: Colors.white,
                    backgroundColor: Colors.white12,
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(99)),
                  ),
                  child: const Text('Entrer le nom manuellement'),
                ),

                const Spacer(),

                // Recent restaurants
                if (recents.isNotEmpty) ...[
                  const Padding(
                    padding: EdgeInsets.only(left: 20, bottom: 10),
                    child: Align(
                      alignment: Alignment.centerLeft,
                      child: Text('Récents',
                          style: TextStyle(
                              color: Colors.white54,
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              letterSpacing: 0.8)),
                    ),
                  ),
                  SizedBox(
                    height: 48,
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      itemCount: recents.length,
                      separatorBuilder: (_, __) => const SizedBox(width: 8),
                      itemBuilder: (_, i) => _RecentChip(
                        slug: recents[i],
                        onTap: () {
                          ref
                              .read(recentRestaurantsProvider.notifier)
                              .addSlug(recents[i]);
                          context.go('/menu/${recents[i]}');
                        },
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _showManualEntry(BuildContext context) async {
    final ctrl = TextEditingController();
    final result = await showModalBottomSheet<String>(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(ctx).bottom),
        child: Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Accéder à un restaurant',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
              const SizedBox(height: 16),
              TextField(
                controller: ctrl,
                autofocus: true,
                decoration: InputDecoration(
                  hintText: 'Ex : mon-restaurant',
                  prefixIcon: const Icon(Icons.store_rounded),
                  border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12)),
                  contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16, vertical: 14),
                ),
                textInputAction: TextInputAction.go,
                onSubmitted: (v) => Navigator.pop(ctx, v.trim().toLowerCase()),
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: () =>
                      Navigator.pop(ctx, ctrl.text.trim().toLowerCase()),
                  style: FilledButton.styleFrom(
                    backgroundColor: const Color(0xFFC0392B),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text('Voir le menu',
                      style: TextStyle(
                          fontSize: 15, fontWeight: FontWeight.w700)),
                ),
              ),
            ],
          ),
        ),
      ),
    );

    if (result != null &&
        result.isNotEmpty &&
        RegExp(r'^[a-z0-9-]{2,50}$').hasMatch(result)) {
      if (mounted) {
        ref.read(recentRestaurantsProvider.notifier).addSlug(result);
        context.go('/menu/$result');
      }
    }
  }
}

// ── Widgets ───────────────────────────────────────────────────────────────────

class _ScanFrame extends StatelessWidget {
  final double size;
  const _ScanFrame({required this.size});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        children: [
          // Dimmed area is handled by camera overlay
          // Corners
          for (final corner in _Corner.values) _CornerWidget(corner: corner, size: size),
          // Center dot animation
          Center(
            child: Container(
              width: 6,
              height: 6,
              decoration: const BoxDecoration(
                color: Colors.white54,
                shape: BoxShape.circle,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

enum _Corner { topLeft, topRight, bottomLeft, bottomRight }

class _CornerWidget extends StatelessWidget {
  final _Corner corner;
  final double size;
  const _CornerWidget({required this.corner, required this.size});

  @override
  Widget build(BuildContext context) {
    final isTop = corner == _Corner.topLeft || corner == _Corner.topRight;
    final isLeft = corner == _Corner.topLeft || corner == _Corner.bottomLeft;
    return Positioned(
      top: isTop ? 0 : null,
      bottom: isTop ? null : 0,
      left: isLeft ? 0 : null,
      right: isLeft ? null : 0,
      child: Container(
        width: 28,
        height: 28,
        decoration: BoxDecoration(
          border: Border(
            top: isTop ? const BorderSide(color: Colors.white, width: 3) : BorderSide.none,
            bottom: !isTop ? const BorderSide(color: Colors.white, width: 3) : BorderSide.none,
            left: isLeft ? const BorderSide(color: Colors.white, width: 3) : BorderSide.none,
            right: !isLeft ? const BorderSide(color: Colors.white, width: 3) : BorderSide.none,
          ),
        ),
      ),
    );
  }
}

class _TopBtn extends StatelessWidget {
  final IconData icon;
  final String? badge;
  final VoidCallback onTap;
  const _TopBtn({required this.icon, this.badge, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
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
            child: Icon(icon, color: Colors.white, size: 20),
          ),
          if (badge != null)
            Positioned(
              top: -4,
              right: -4,
              child: Container(
                width: 16,
                height: 16,
                decoration: const BoxDecoration(
                  color: Color(0xFFC0392B),
                  shape: BoxShape.circle,
                ),
                child: Center(
                    child: Text(badge!,
                        style: const TextStyle(
                            color: Colors.white,
                            fontSize: 9,
                            fontWeight: FontWeight.w800))),
              ),
            ),
        ],
      ),
    );
  }
}

class _RecentChip extends StatelessWidget {
  final String slug;
  final VoidCallback onTap;
  const _RecentChip({required this.slug, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: Colors.white12,
          borderRadius: BorderRadius.circular(99),
          border: Border.all(color: Colors.white24),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.store_outlined, color: Colors.white70, size: 14),
            const SizedBox(width: 6),
            Text(slug,
                style: const TextStyle(
                    color: Colors.white,
                    fontSize: 13,
                    fontWeight: FontWeight.w500)),
          ],
        ),
      ),
    );
  }
}
