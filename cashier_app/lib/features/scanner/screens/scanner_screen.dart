import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gap/gap.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/currency_utils.dart';
import '../../../core/utils/date_utils.dart';
import '../../../core/api/api_client.dart';
import '../../orders/models/order_models.dart';
import '../../orders/providers/orders_provider.dart';
import '../../../shared/widgets/status_badge.dart';

class ScannerScreen extends ConsumerStatefulWidget {
  const ScannerScreen({super.key});

  @override
  ConsumerState<ScannerScreen> createState() => _ScannerScreenState();
}

class _ScannerScreenState extends ConsumerState<ScannerScreen>
    with TickerProviderStateMixin {
  MobileScannerController? _cameraController;
  bool _isScanning = true;
  String? _scannedToken;
  bool _torchOn = false;

  late AnimationController _scanLineController;
  late AnimationController _pulseController;

  @override
  void initState() {
    super.initState();
    _cameraController = MobileScannerController(
      facing: CameraFacing.back,
      torchEnabled: false,
    );
    _scanLineController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _cameraController?.dispose();
    _scanLineController.dispose();
    _pulseController.dispose();
    super.dispose();
  }

  void _onDetect(BarcodeCapture capture) {
    if (!_isScanning) return;
    final barcode = capture.barcodes.firstOrNull;
    if (barcode == null) return;
    final rawValue = barcode.rawValue;
    if (rawValue == null || rawValue.isEmpty) return;

    // Marketing voucher: MV:{token}
    if (rawValue.startsWith('MV:')) {
      final mvToken = rawValue.substring(3).trim();
      if (mvToken.isEmpty) return;
      setState(() => _isScanning = false);
      _handleMarketingVoucher(mvToken);
      return;
    }

    // Gift order QR
    String token = rawValue;
    try {
      final uri = Uri.parse(rawValue);
      final segments = uri.pathSegments;
      if (segments.isNotEmpty) {
        token = segments.last;
      }
    } catch (_) {
      token = rawValue;
    }

    if (token.isEmpty) return;

    setState(() {
      _isScanning = false;
      _scannedToken = token;
    });
  }

  Future<void> _handleMarketingVoucher(String token) async {
    await context.push('/marketing/vouchers/redeem/$token');
    if (mounted) _reset();
  }

  void _reset() {
    setState(() {
      _isScanning = true;
      _scannedToken = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    final topPadding = MediaQuery.of(context).padding.top;

    if (_scannedToken != null) {
      return Scaffold(
        backgroundColor: AppColors.background,
        body: Column(
          children: [
            Container(
              color: AppColors.background,
              padding:
                  EdgeInsets.fromLTRB(16, topPadding + 12, 16, 16),
              child: Row(
                children: [
                  GestureDetector(
                    onTap: _reset,
                    child: const Icon(Icons.arrow_back_rounded,
                        color: AppColors.textPrimary),
                  ),
                  const Gap(16),
                  Text(
                    'Résultat scan',
                    style: GoogleFonts.poppins(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary,
                    ),
                  ),
                ],
              ),
            ),
            const Divider(color: AppColors.border, height: 1),
            Expanded(
              child: _GiftOrderResult(
                  token: _scannedToken!, onReset: _reset),
            ),
          ],
        ),
      );
    }

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // Camera full-screen
          MobileScanner(
            controller: _cameraController!,
            onDetect: _onDetect,
          ),

          // Dark overlay with hole
          ColorFiltered(
            colorFilter: ColorFilter.mode(
              Colors.black.withValues(alpha: 0.55),
              BlendMode.srcOut,
            ),
            child: Stack(
              children: [
                Container(
                  decoration: const BoxDecoration(
                    color: Colors.black,
                    backgroundBlendMode: BlendMode.dstOut,
                  ),
                ),
                Center(
                  child: Container(
                    width: 260,
                    height: 260,
                    decoration: BoxDecoration(
                      color: Colors.black,
                      borderRadius: BorderRadius.circular(20),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Animated corners
          Center(
            child: AnimatedBuilder(
              animation: _pulseController,
              builder: (context, child) {
                final scale = 1.0 + _pulseController.value * 0.02;
                return Transform.scale(
                  scale: scale,
                  child: const SizedBox(
                    width: 268,
                    height: 268,
                    child: Stack(
                      children: [
                        _ScanCorner(top: true, left: true),
                        _ScanCorner(top: true, left: false),
                        _ScanCorner(top: false, left: true),
                        _ScanCorner(top: false, left: false),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),

          // Animated scan line
          Center(
            child: SizedBox(
              width: 240,
              height: 240,
              child: AnimatedBuilder(
                animation: _scanLineController,
                builder: (context, child) {
                  return Align(
                    alignment: Alignment(
                        0,
                        -1.0 + 2.0 * _scanLineController.value),
                    child: Container(
                      width: 240,
                      height: 2,
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            Colors.transparent,
                            AppColors.brand.withValues(alpha: 0.8),
                            AppColors.brand,
                            AppColors.brand.withValues(alpha: 0.8),
                            Colors.transparent,
                          ],
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.brand.withValues(alpha: 0.6),
                            blurRadius: 8,
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
          ),

          // Top controls
          Positioned(
            top: topPadding + 16,
            left: 16,
            right: 16,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Scanner QR',
                  style: GoogleFonts.poppins(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
                GestureDetector(
                  onTap: () {
                    _cameraController?.toggleTorch();
                    setState(() => _torchOn = !_torchOn);
                  },
                  child: Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: _torchOn
                          ? AppColors.amber
                          : Colors.white.withValues(alpha: 0.15),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      _torchOn ? Icons.flash_on : Icons.flash_off,
                      color: _torchOn
                          ? Colors.black
                          : AppColors.textPrimary,
                      size: 20,
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Bottom instruction
          Positioned(
            bottom: 80,
            left: 0,
            right: 0,
            child: Column(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 20, vertical: 12),
                  margin: const EdgeInsets.symmetric(horizontal: 40),
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.6),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                        color: Colors.white.withValues(alpha: 0.1)),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.qr_code_2_rounded,
                          color: AppColors.brand, size: 20),
                      const Gap(10),
                      Text(
                        'Bon cadeau ou bon marketing',
                        style: GoogleFonts.poppins(
                          fontSize: 13,
                          color: AppColors.textPrimary,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ScanCorner extends StatelessWidget {
  final bool top;
  final bool left;

  const _ScanCorner({required this.top, required this.left});

  @override
  Widget build(BuildContext context) {
    return Positioned(
      top: top ? 0 : null,
      bottom: top ? null : 0,
      left: left ? 0 : null,
      right: left ? null : 0,
      child: Container(
        width: 36,
        height: 36,
        decoration: BoxDecoration(
          border: Border(
            top: top
                ? const BorderSide(color: AppColors.brand, width: 3)
                : BorderSide.none,
            bottom: !top
                ? const BorderSide(color: AppColors.brand, width: 3)
                : BorderSide.none,
            left: left
                ? const BorderSide(color: AppColors.brand, width: 3)
                : BorderSide.none,
            right: !left
                ? const BorderSide(color: AppColors.brand, width: 3)
                : BorderSide.none,
          ),
          borderRadius: BorderRadius.only(
            topLeft: top && left ? const Radius.circular(8) : Radius.zero,
            topRight:
                top && !left ? const Radius.circular(8) : Radius.zero,
            bottomLeft:
                !top && left ? const Radius.circular(8) : Radius.zero,
            bottomRight:
                !top && !left ? const Radius.circular(8) : Radius.zero,
          ),
        ),
      ),
    );
  }
}

class _GiftOrderResult extends ConsumerWidget {
  final String token;
  final VoidCallback onReset;

  const _GiftOrderResult({required this.token, required this.onReset});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final orderAsync = ref.watch(giftOrderProvider(token));

    return orderAsync.when(
      data: (order) => _GiftOrderView(order: order, onReset: onReset),
      loading: () => Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const CircularProgressIndicator(color: AppColors.brand),
            const Gap(20),
            Text(
              'Chargement des informations...',
              style:
                  GoogleFonts.poppins(color: AppColors.textSecondary),
            ),
          ],
        ),
      ),
      error: (e, _) => Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppColors.brand.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                  border: Border.all(
                      color: AppColors.brand.withValues(alpha: 0.3)),
                ),
                child: const Icon(
                  Icons.error_outline_rounded,
                  color: AppColors.brand,
                  size: 48,
                ),
              )
                  .animate()
                  .fadeIn(duration: 400.ms)
                  .scale(begin: const Offset(0.8, 0.8)),
              const Gap(20),
              Text(
                'QR code invalide',
                style: GoogleFonts.poppins(
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                  color: AppColors.brand,
                ),
              ).animate().fadeIn(duration: 400.ms, delay: 100.ms),
              const Gap(10),
              Text(
                extractErrorMessage(e),
                textAlign: TextAlign.center,
                style: GoogleFonts.poppins(
                  fontSize: 14,
                  color: AppColors.textSecondary,
                ),
              ).animate().fadeIn(duration: 400.ms, delay: 150.ms),
              const Gap(28),
              GestureDetector(
                onTap: onReset,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 24, vertical: 14),
                  decoration: BoxDecoration(
                    gradient: AppColors.brandGradient,
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.brand.withValues(alpha: 0.35),
                        blurRadius: 14,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.qr_code_scanner_rounded,
                          color: AppColors.textPrimary, size: 18),
                      const Gap(8),
                      Text(
                        'Scanner à nouveau',
                        style: GoogleFonts.poppins(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textPrimary,
                        ),
                      ),
                    ],
                  ),
                ),
              ).animate().fadeIn(duration: 400.ms, delay: 200.ms),
            ],
          ),
        ),
      ),
    );
  }
}

class _GiftOrderView extends StatelessWidget {
  final Order order;
  final VoidCallback onReset;

  const _GiftOrderView({required this.order, required this.onReset});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Gift header
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFFB47FFF), Color(0xFF8B5CF6)],
            ),
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFFB47FFF).withValues(alpha: 0.3),
                blurRadius: 20,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: Row(
            children: [
              const Icon(Icons.card_giftcard_rounded,
                  color: AppColors.textPrimary, size: 32),
              const Gap(16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Commande cadeau',
                      style: GoogleFonts.poppins(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    Text(
                      order.orderNumber,
                      style: GoogleFonts.poppins(
                        fontSize: 13,
                        color: AppColors.textPrimary
                            .withValues(alpha: 0.7),
                      ),
                    ),
                  ],
                ),
              ),
              OrderStatusBadge(status: order.status),
            ],
          ),
        )
            .animate()
            .fadeIn(duration: 400.ms)
            .slideY(begin: 0.1, curve: Curves.easeOutCubic),

        const Gap(16),

        // Client info
        _ResultCard(
          title: 'Client',
          icon: Icons.person_outline_rounded,
          children: [
            _DetailRow(
                icon: Icons.person_outline_rounded,
                value: order.customerName),
            if (order.customerPhone != null &&
                order.customerPhone!.isNotEmpty) ...[
              const Gap(10),
              _DetailRow(
                  icon: Icons.phone_outlined,
                  value: order.customerPhone!),
            ],
            const Gap(10),
            _DetailRow(
              icon: Icons.access_time_rounded,
              value: AppDateUtils.formatDateTime(order.createdAt),
            ),
          ],
        )
            .animate()
            .fadeIn(duration: 400.ms, delay: 100.ms)
            .slideY(
                begin: 0.1,
                delay: 100.ms,
                curve: Curves.easeOutCubic),

        const Gap(14),

        // Items
        _ResultCard(
          title: 'Articles (${order.items.length})',
          icon: Icons.restaurant_rounded,
          children: [
            ...order.items.map((item) => Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: Row(
                    children: [
                      Container(
                        width: 28,
                        height: 28,
                        decoration: BoxDecoration(
                          color:
                              AppColors.purple.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Center(
                          child: Text(
                            '${item.quantity}x',
                            style: GoogleFonts.poppins(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: AppColors.purple,
                            ),
                          ),
                        ),
                      ),
                      const Gap(10),
                      Expanded(
                        child: Text(
                          item.menuItemName,
                          style: GoogleFonts.poppins(
                            fontSize: 13,
                            color: AppColors.textPrimary,
                          ),
                        ),
                      ),
                      Text(
                        CurrencyUtils.formatAmount(item.subtotal),
                        style: GoogleFonts.poppins(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                )),
            const Divider(color: AppColors.border, height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Total',
                  style: GoogleFonts.poppins(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
                Text(
                  CurrencyUtils.formatAmount(order.total),
                  style: GoogleFonts.poppins(
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                    color: AppColors.brand,
                  ),
                ),
              ],
            ),
          ],
        )
            .animate()
            .fadeIn(duration: 400.ms, delay: 200.ms)
            .slideY(
                begin: 0.1,
                delay: 200.ms,
                curve: Curves.easeOutCubic),

        const Gap(24),

        OutlinedButton.icon(
          onPressed: onReset,
          icon: const Icon(Icons.qr_code_scanner_rounded,
              color: AppColors.brand),
          label: Text(
            'Scanner un autre QR',
            style: GoogleFonts.poppins(
                color: AppColors.brand, fontWeight: FontWeight.w600),
          ),
          style: OutlinedButton.styleFrom(
            side: const BorderSide(color: AppColors.brand),
            padding: const EdgeInsets.symmetric(vertical: 14),
          ),
        ).animate().fadeIn(duration: 400.ms, delay: 300.ms),

        const Gap(40),
      ],
    );
  }
}

class _ResultCard extends StatelessWidget {
  final String title;
  final IconData icon;
  final List<Widget> children;

  const _ResultCard({
    required this.title,
    required this.icon,
    required this.children,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 16, color: AppColors.purple),
              const Gap(8),
              Text(
                title,
                style: GoogleFonts.poppins(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textPrimary,
                ),
              ),
            ],
          ),
          const Gap(14),
          const Divider(color: AppColors.border, height: 1),
          const Gap(14),
          ...children,
        ],
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final IconData icon;
  final String value;

  const _DetailRow({required this.icon, required this.value});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 16, color: AppColors.textMuted),
        const Gap(10),
        Expanded(
          child: Text(
            value,
            style: GoogleFonts.poppins(
              fontSize: 14,
              color: AppColors.textPrimary,
            ),
          ),
        ),
      ],
    );
  }
}
