// lib/features/scanner/scanner_screen.dart
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../../core/providers/providers.dart';
import '../../core/theme/app_theme.dart';

class ScannerScreen extends ConsumerStatefulWidget {
  const ScannerScreen({super.key});
  @override
  ConsumerState<ScannerScreen> createState() => _ScannerScreenState();
}

class _ScannerScreenState extends ConsumerState<ScannerScreen>
    with TickerProviderStateMixin {
  final MobileScannerController _ctrl = MobileScannerController(
    detectionSpeed: DetectionSpeed.noDuplicates,
    facing: CameraFacing.back,
  );
  bool _scanned = false;
  bool _torchOn = false;

  // GlobalKey to measure the actual frame position for overlay alignment
  final _frameKey = GlobalKey();
  double? _frameCenterY;

  // Animations
  late AnimationController _pulseCtrl;
  late AnimationController _laserCtrl;
  late AnimationController _fadeCtrl;
  late Animation<double> _pulse1;
  late Animation<double> _pulse2;
  late Animation<double> _laser;
  late Animation<double> _fadeIn;

  @override
  void initState() {
    super.initState();

    _pulseCtrl = AnimationController(vsync: this,
        duration: const Duration(milliseconds: 2000))..repeat();

    _laserCtrl = AnimationController(vsync: this,
        duration: const Duration(milliseconds: 1800))..repeat(reverse: true);

    _fadeCtrl = AnimationController(vsync: this,
        duration: const Duration(milliseconds: 800));

    _pulse1 = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _pulseCtrl, curve: Curves.easeOut));

    _pulse2 = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _pulseCtrl,
          curve: const Interval(0.4, 1, curve: Curves.easeOut)));

    _laser = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _laserCtrl, curve: Curves.easeInOut));

    _fadeIn = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _fadeCtrl, curve: Curves.easeOut));

    Future.delayed(const Duration(milliseconds: 300), () {
      if (mounted) _fadeCtrl.forward();
    });

    // Measure frame position after first layout
    WidgetsBinding.instance.addPostFrameCallback((_) => _updateFrameCenter());
  }

  void _updateFrameCenter() {
    final ctx = _frameKey.currentContext;
    if (ctx == null) return;
    final box = ctx.findRenderObject() as RenderBox?;
    if (box == null) return;
    final pos = box.localToGlobal(Offset.zero);
    if (mounted) {
      setState(() => _frameCenterY = pos.dy + box.size.height / 2);
    }
  }

  @override
  void dispose() {
    _ctrl.dispose();
    _pulseCtrl.dispose();
    _laserCtrl.dispose();
    _fadeCtrl.dispose();
    super.dispose();
  }

  void _onDetect(BarcodeCapture capture) {
    if (_scanned) return;
    final raw = capture.barcodes.firstOrNull?.rawValue ?? '';
    final slug = _extractSlug(raw);
    if (slug == null || slug.isEmpty) return;
    HapticFeedback.mediumImpact();
    setState(() => _scanned = true);
    ref.read(recentRestaurantsProvider.notifier).addSlug(slug);
    context.go('/menu/$slug');
  }

  String? _extractSlug(String value) {
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
    if (RegExp(r'^[a-z0-9-]{2,50}$').hasMatch(value)) return value;
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final recents = ref.watch(recentRestaurantsProvider);
    final size = MediaQuery.sizeOf(context);
    final frameSize = math.min(size.width * 0.72, 280.0);

    return Scaffold(
      backgroundColor: AppTheme.scanBg,
      body: Stack(
        children: [
          // Camera
          MobileScanner(controller: _ctrl, onDetect: _onDetect),

          // Dark vignette overlay — centered on the actual frame position
          _ScanOverlay(frameSize: frameSize, frameCenterY: _frameCenterY),

          // UI
          FadeTransition(
            opacity: _fadeIn,
            child: SafeArea(
              child: Column(
                children: [
                  // ── Top bar ──────────────────────────────────────────────
                  Padding(
                    padding: const EdgeInsets.fromLTRB(24, 16, 24, 0),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('SaeMenus',
                            style: AppTheme.title(Colors.white).copyWith(
                                fontSize: 22, letterSpacing: -0.5)),
                        Row(children: [
                          _GlassBtn(
                            icon: _torchOn
                                ? Icons.flash_on_rounded
                                : Icons.flash_off_rounded,
                            active: _torchOn,
                            onTap: () {
                              _ctrl.toggleTorch();
                              setState(() => _torchOn = !_torchOn);
                            },
                          ),
                          const SizedBox(width: 10),
                          _GlassBtn(
                            icon: Icons.person_outline_rounded,
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

                  // ── Scan frame + animations ───────────────────────────────
                  SizedBox(
                    key: _frameKey,
                    width: frameSize + 80,
                    height: frameSize + 80,
                    child: Stack(
                      alignment: Alignment.center,
                      children: [
                        // Pulse rings
                        AnimatedBuilder(
                          animation: _pulseCtrl,
                          builder: (_, __) => Stack(
                            alignment: Alignment.center,
                            children: [
                              _PulseRing(
                                  size: frameSize,
                                  progress: _pulse1.value,
                                  maxExpand: 60),
                              _PulseRing(
                                  size: frameSize,
                                  progress: _pulse2.value,
                                  maxExpand: 40),
                            ],
                          ),
                        ),
                        // Scan frame
                        _ScanFrame(size: frameSize, laser: _laser),
                      ],
                    ),
                  ),

                  const SizedBox(height: 32),
                  Text('Pointez vers un QR code',
                      style: AppTheme.body(Colors.white).copyWith(
                          fontSize: 15, fontWeight: FontWeight.w500)),
                  const SizedBox(height: 6),
                  Text('ou entrez le nom manuellement',
                      style: AppTheme.caption(Colors.white54)),
                  const SizedBox(height: 24),

                  // ── Manual entry ──────────────────────────────────────────
                  GestureDetector(
                    onTap: () => _showManualEntry(context),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 22, vertical: 12),
                      decoration: BoxDecoration(
                        border: Border.all(color: Colors.white24),
                        borderRadius: BorderRadius.circular(99),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.keyboard_alt_outlined,
                              color: Colors.white70, size: 16),
                          const SizedBox(width: 8),
                          Text('Saisir manuellement',
                              style: AppTheme.caption(Colors.white70)
                                  .copyWith(fontSize: 13)),
                        ],
                      ),
                    ),
                  ),

                  const Spacer(),

                  // ── Recent restaurants ────────────────────────────────────
                  if (recents.isNotEmpty) ...[
                    Padding(
                      padding: const EdgeInsets.fromLTRB(24, 0, 24, 8),
                      child: Row(children: [
                        Text('Récents',
                            style: AppTheme.label(Colors.white38)
                                .copyWith(fontSize: 10)),
                      ]),
                    ),
                    SizedBox(
                      height: 40,
                      child: ListView.separated(
                        scrollDirection: Axis.horizontal,
                        padding: const EdgeInsets.symmetric(horizontal: 24),
                        itemCount: recents.length,
                        separatorBuilder: (_, __) =>
                            const SizedBox(width: 8),
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
                    const SizedBox(height: 16),
                  ],

                  const SizedBox(height: 16),
                ],
              ),
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
        padding: EdgeInsets.only(
            bottom: MediaQuery.viewInsetsOf(ctx).bottom),
        child: Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
          ),
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 36, height: 4,
                  margin: const EdgeInsets.only(bottom: 20),
                  decoration: BoxDecoration(
                    color: AppTheme.border,
                    borderRadius: BorderRadius.circular(2)),
                ),
              ),
              Text('Accéder à un restaurant',
                  style: AppTheme.heading(AppTheme.charcoal)),
              const SizedBox(height: 4),
              Text('Entrez le nom ou identifiant du restaurant',
                  style: AppTheme.caption(AppTheme.grey3)),
              const SizedBox(height: 20),
              TextField(
                controller: ctrl,
                autofocus: true,
                style: AppTheme.body(AppTheme.charcoal),
                decoration: InputDecoration(
                  hintText: 'ex : mon-restaurant',
                  hintStyle: AppTheme.body(AppTheme.grey3),
                  prefixIcon: const Icon(Icons.store_rounded,
                      size: 18, color: AppTheme.grey3),
                  filled: true,
                  fillColor: AppTheme.cream,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: const BorderSide(color: AppTheme.border),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: const BorderSide(color: AppTheme.border),
                  ),
                ),
                textInputAction: TextInputAction.go,
                onSubmitted: (v) =>
                    Navigator.pop(ctx, v.trim().toLowerCase()),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: () =>
                      Navigator.pop(ctx, ctrl.text.trim().toLowerCase()),
                  style: FilledButton.styleFrom(
                    backgroundColor: AppTheme.charcoal,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14)),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: Text('Voir le menu',
                      style: AppTheme.bodyBold(Colors.white)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
    if (!mounted) return;
    if (result != null &&
        result.isNotEmpty &&
        RegExp(r'^[a-z0-9-]{2,50}$').hasMatch(result)) {
      ref.read(recentRestaurantsProvider.notifier).addSlug(result);
      if (!mounted) return;
      // ignore: use_build_context_synchronously
      context.go('/menu/$result');
    }
  }
}

// ── Widgets ─────────────────────────────────────────────────────────────────

class _ScanOverlay extends StatelessWidget {
  final double frameSize;
  final double? frameCenterY;
  const _ScanOverlay({required this.frameSize, this.frameCenterY});

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      painter: _OverlayPainter(frameSize: frameSize, frameCenterY: frameCenterY),
      child: const SizedBox.expand(),
    );
  }
}

class _OverlayPainter extends CustomPainter {
  final double frameSize;
  final double? frameCenterY;
  _OverlayPainter({required this.frameSize, this.frameCenterY});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0xCC090909)
      ..style = PaintingStyle.fill;
    final cx = size.width / 2;
    // Use measured frame center, fall back to screen center
    final cy = frameCenterY ?? size.height / 2;
    final half = frameSize / 2;

    final path = Path()
      ..addRect(Rect.fromLTWH(0, 0, size.width, size.height))
      ..addRRect(RRect.fromRectAndRadius(
        Rect.fromCenter(center: Offset(cx, cy),
            width: frameSize, height: frameSize),
        const Radius.circular(20)))
      ..fillType = PathFillType.evenOdd;
    canvas.drawPath(path, paint);

    // Corner brackets
    final bracket = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3
      ..strokeCap = StrokeCap.round;
    const len = 28.0;
    const r = 20.0;

    // Top-left
    canvas.drawPath(Path()
      ..moveTo(cx - half + r, cy - half)
      ..lineTo(cx - half + r + len, cy - half), bracket);
    canvas.drawPath(Path()
      ..moveTo(cx - half, cy - half + r)
      ..lineTo(cx - half, cy - half + r + len), bracket);

    // Top-right
    canvas.drawPath(Path()
      ..moveTo(cx + half - r, cy - half)
      ..lineTo(cx + half - r - len, cy - half), bracket);
    canvas.drawPath(Path()
      ..moveTo(cx + half, cy - half + r)
      ..lineTo(cx + half, cy - half + r + len), bracket);

    // Bottom-left
    canvas.drawPath(Path()
      ..moveTo(cx - half + r, cy + half)
      ..lineTo(cx - half + r + len, cy + half), bracket);
    canvas.drawPath(Path()
      ..moveTo(cx - half, cy + half - r)
      ..lineTo(cx - half, cy + half - r - len), bracket);

    // Bottom-right
    canvas.drawPath(Path()
      ..moveTo(cx + half - r, cy + half)
      ..lineTo(cx + half - r - len, cy + half), bracket);
    canvas.drawPath(Path()
      ..moveTo(cx + half, cy + half - r)
      ..lineTo(cx + half, cy + half - r - len), bracket);
  }

  @override
  bool shouldRepaint(_OverlayPainter old) =>
      old.frameSize != frameSize || old.frameCenterY != frameCenterY;
}

class _ScanFrame extends StatelessWidget {
  final double size;
  final Animation<double> laser;
  const _ScanFrame({required this.size, required this.laser});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: AnimatedBuilder(
        animation: laser,
        builder: (_, __) {
          return CustomPaint(
            painter: _LaserPainter(progress: laser.value, size: size),
          );
        },
      ),
    );
  }
}

class _LaserPainter extends CustomPainter {
  final double progress;
  final double size;
  _LaserPainter({required this.progress, required this.size});

  @override
  void paint(Canvas canvas, Size canvasSize) {
    final y = progress * (size - 4);
    final paint = Paint()
      ..shader = LinearGradient(
        colors: [
          Colors.transparent,
          Colors.white.withValues(alpha: 0.6),
          Colors.white.withValues(alpha: 0.9),
          Colors.white.withValues(alpha: 0.6),
          Colors.transparent,
        ],
      ).createShader(Rect.fromLTWH(0, y, size, 2))
      ..strokeWidth = 2
      ..style = PaintingStyle.stroke;
    canvas.drawLine(Offset(0, y), Offset(size, y), paint);
  }

  @override
  bool shouldRepaint(_LaserPainter old) => old.progress != progress;
}

class _PulseRing extends StatelessWidget {
  final double size;
  final double progress;
  final double maxExpand;
  const _PulseRing(
      {required this.size, required this.progress, required this.maxExpand});

  @override
  Widget build(BuildContext context) {
    final expanded = size + maxExpand * progress;
    return Opacity(
      opacity: (1 - progress).clamp(0, 1),
      child: Container(
        width: expanded,
        height: expanded,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20 + maxExpand * progress * 0.3),
          border: Border.all(
              color: Colors.white.withValues(alpha: 0.25), width: 1.5),
        ),
      ),
    );
  }
}

class _GlassBtn extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  final bool active;
  const _GlassBtn({required this.icon, required this.onTap, this.active = false});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: AppTheme.quick,
        width: 42,
        height: 42,
        decoration: BoxDecoration(
          color: active
              ? Colors.white.withValues(alpha: 0.2)
              : Colors.white.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(13),
          border: Border.all(color: Colors.white.withValues(alpha: 0.15)),
        ),
        child: Icon(icon,
            color: active ? Colors.white : Colors.white70, size: 18),
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
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(99),
          border: Border.all(color: Colors.white.withValues(alpha: 0.15)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.storefront_outlined,
                color: Colors.white54, size: 13),
            const SizedBox(width: 6),
            Text(slug, style: AppTheme.caption(Colors.white70)),
          ],
        ),
      ),
    );
  }
}
