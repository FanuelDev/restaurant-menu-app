import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gap/gap.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/currency_utils.dart';
import '../../../core/api/api_client.dart';
import '../../orders/models/order_models.dart';
import '../../orders/providers/orders_provider.dart';
import '../models/marketing_models.dart';
import '../providers/marketing_provider.dart';

class VoucherOrderScreen extends ConsumerStatefulWidget {
  final MarketingVoucher voucher;
  const VoucherOrderScreen({super.key, required this.voucher});

  @override
  ConsumerState<VoucherOrderScreen> createState() => _VoucherOrderScreenState();
}

class _VoucherOrderScreenState extends ConsumerState<VoucherOrderScreen> {
  final _customerController = TextEditingController();
  final Map<int, CartItem> _cart = {};
  bool _isSubmitting = false;

  num get _total =>
      _cart.values.fold<num>(0, (sum, item) => sum + item.subtotal);
  double get _surplus =>
      max(0.0, _total.toDouble() - widget.voucher.amount);
  double get _voucherUsed =>
      min(_total.toDouble(), widget.voucher.amount);

  void _addItem(MenuItem item) {
    setState(() {
      if (_cart.containsKey(item.id)) {
        _cart[item.id]!.quantity++;
      } else {
        _cart[item.id] = CartItem(menuItem: item, quantity: 1);
      }
    });
  }

  void _removeItem(MenuItem item) {
    setState(() {
      if (_cart.containsKey(item.id)) {
        if (_cart[item.id]!.quantity <= 1) {
          _cart.remove(item.id);
        } else {
          _cart[item.id]!.quantity--;
        }
      }
    });
  }

  Future<void> _submit() async {
    final customerName = _customerController.text.trim();
    if (customerName.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('Veuillez saisir le nom du client',
            style: GoogleFonts.poppins()),
        backgroundColor: AppColors.amber,
        behavior: SnackBarBehavior.floating,
        shape:
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        margin: const EdgeInsets.all(16),
      ));
      return;
    }
    if (_cart.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('Veuillez ajouter au moins un article',
            style: GoogleFonts.poppins()),
        backgroundColor: AppColors.amber,
        behavior: SnackBarBehavior.floating,
        shape:
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        margin: const EdgeInsets.all(16),
      ));
      return;
    }

    setState(() => _isSubmitting = true);

    final items = _cart.values
        .map((ci) => {
              'menuItemId': ci.menuItem.id,
              'quantity': ci.quantity,
            })
        .toList();

    final result =
        await ref.read(voucherOrderNotifierProvider.notifier).submit(
              voucherId: widget.voucher.id,
              customerName: customerName,
              orderTotal: _total.toDouble(),
              items: items,
            );

    if (!mounted) return;
    setState(() => _isSubmitting = false);

    if (result != null) {
      _showSuccessSheet(result, customerName);
    } else {
      final err = ref.read(voucherOrderNotifierProvider);
      final msg =
          err.hasError ? extractErrorMessage(err.error!) : 'Erreur inconnue';
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(msg,
            style: GoogleFonts.poppins(
                color: AppColors.textPrimary, fontWeight: FontWeight.w500)),
        backgroundColor: AppColors.brand,
        behavior: SnackBarBehavior.floating,
        shape:
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        margin: const EdgeInsets.all(16),
      ));
    }
  }

  void _showSuccessSheet(
      Map<String, dynamic> result, String customerName) {
    final surplusPaid =
        (result['surplusPaid'] as num?)?.toDouble() ?? _surplus;
    final voucherUsed =
        (result['voucherAmountUsed'] as num?)?.toDouble() ?? _voucherUsed;

    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      isDismissible: false,
      enableDrag: false,
      builder: (ctx) => _SuccessSheet(
        customerName: customerName,
        voucherAmountUsed: voucherUsed,
        surplusPaid: surplusPaid,
        orderTotal: _total.toDouble(),
        onDone: () {
          Navigator.of(ctx).pop();
          ref.invalidate(marketingVouchersProvider);
          ref.invalidate(marketingStatsProvider);
          context.go('/marketing');
        },
      ),
    );
  }

  @override
  void dispose() {
    _customerController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final categoriesAsync = ref.watch(categoriesProvider);
    final topPadding = MediaQuery.of(context).padding.top;
    final voucher = widget.voucher;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: Column(
        children: [
          // ── Header ────────────────────────────────────────────────────────
          Container(
            padding:
                EdgeInsets.fromLTRB(8, topPadding + 8, 16, 12),
            decoration: const BoxDecoration(
              color: AppColors.surface,
              border: Border(
                  bottom:
                      BorderSide(color: AppColors.borderBright, width: 1)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    IconButton(
                      onPressed: () => context.pop(),
                      icon: const Icon(Icons.arrow_back_ios_new_rounded,
                          color: AppColors.textPrimary, size: 20),
                    ),
                    const Gap(4),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Commande sur bon',
                            style: GoogleFonts.poppins(
                                fontSize: 17,
                                fontWeight: FontWeight.w700,
                                color: AppColors.textPrimary),
                          ),
                          Text(
                            voucher.label,
                            style: GoogleFonts.poppins(
                                fontSize: 12,
                                color: AppColors.textSecondary),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                    // Voucher amount chip
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color:
                            AppColors.emerald.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                            color: AppColors.emerald
                                .withValues(alpha: 0.3)),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(voucher.eventType.icon,
                              color: AppColors.emerald, size: 14),
                          const Gap(6),
                          Text(
                            CurrencyUtils.formatAmount(voucher.amount),
                            style: GoogleFonts.poppins(
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                                color: AppColors.emerald),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const Gap(10),
                // Customer name
                TextField(
                  controller: _customerController,
                  style: GoogleFonts.poppins(
                      fontSize: 14, color: AppColors.textPrimary),
                  decoration: InputDecoration(
                    hintText: 'Nom du client',
                    hintStyle: GoogleFonts.poppins(
                        fontSize: 14, color: AppColors.textMuted),
                    prefixIcon: const Icon(
                        Icons.person_outline_rounded,
                        size: 18,
                        color: AppColors.textMuted),
                    filled: true,
                    fillColor: AppColors.surfaceHigh,
                    border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(
                            color: AppColors.borderBright)),
                    enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(
                            color: AppColors.borderBright)),
                    focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(
                            color: AppColors.purple, width: 1.5)),
                    contentPadding: const EdgeInsets.symmetric(
                        horizontal: 14, vertical: 12),
                  ),
                  textCapitalization: TextCapitalization.words,
                ),
              ],
            ),
          ).animate().fadeIn(duration: 300.ms),

          // ── Menu list ──────────────────────────────────────────────────────
          Expanded(
            child: categoriesAsync.when(
              data: (categories) {
                if (categories.isEmpty) {
                  return Center(
                    child: Text('Aucun article disponible',
                        style: GoogleFonts.poppins(
                            color: AppColors.textSecondary)),
                  );
                }
                return ListView.builder(
                  padding:
                      const EdgeInsets.fromLTRB(16, 12, 16, 8),
                  itemCount: categories.length,
                  itemBuilder: (context, ci) {
                    final category = categories[ci];
                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Padding(
                          padding: const EdgeInsets.only(
                              bottom: 8, top: 4),
                          child: Text(
                            category.name,
                            style: GoogleFonts.poppins(
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                                color: AppColors.textSecondary,
                                letterSpacing: 0.5),
                          ),
                        ),
                        ...category.items.map((item) =>
                            _MenuItemCard(
                              item: item,
                              quantity:
                                  _cart[item.id]?.quantity ?? 0,
                              onAdd: () => _addItem(item),
                              onRemove: () => _removeItem(item),
                            )),
                        const Gap(4),
                      ],
                    );
                  },
                );
              },
              loading: () => const Center(
                child: CircularProgressIndicator(
                    color: AppColors.purple),
              ),
              error: (e, _) => Center(
                child: Text('Erreur de chargement du menu',
                    style: GoogleFonts.poppins(
                        color: AppColors.brand)),
              ),
            ),
          ),

          // ── Bottom summary + confirm ────────────────────────────────────────
          _BottomSummary(
            voucherAmount: voucher.amount,
            cartTotal: _total.toDouble(),
            voucherUsed: _voucherUsed,
            surplus: _surplus,
            canSubmit: _cart.isNotEmpty && !_isSubmitting,
            isSubmitting: _isSubmitting,
            onConfirm: _submit,
          ),
        ],
      ),
    );
  }
}

// ─── Menu item card ────────────────────────────────────────────────────────────

class _MenuItemCard extends StatelessWidget {
  final MenuItem item;
  final int quantity;
  final VoidCallback onAdd;
  final VoidCallback onRemove;

  const _MenuItemCard({
    required this.item,
    required this.quantity,
    required this.onAdd,
    required this.onRemove,
  });

  @override
  Widget build(BuildContext context) {
    final inCart = quantity > 0;
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding:
          const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: inCart
            ? AppColors.purple.withValues(alpha: 0.08)
            : AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: inCart
              ? AppColors.purple.withValues(alpha: 0.35)
              : AppColors.borderBright,
          width: inCart ? 1.5 : 1,
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.name,
                  style: GoogleFonts.poppins(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textPrimary),
                ),
                if (item.description != null &&
                    item.description!.isNotEmpty) ...[
                  const Gap(2),
                  Text(
                    item.description!,
                    style: GoogleFonts.poppins(
                        fontSize: 11,
                        color: AppColors.textMuted),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
                const Gap(4),
                Text(
                  CurrencyUtils.formatAmount(
                      item.price.toDouble()),
                  style: GoogleFonts.poppins(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: AppColors.emerald),
                ),
              ],
            ),
          ),
          const Gap(12),
          if (quantity == 0)
            GestureDetector(
              onTap: onAdd,
              child: Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  gradient: AppColors.brandGradient,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.add_rounded,
                    color: AppColors.textPrimary, size: 20),
              ),
            )
          else
            Row(
              children: [
                GestureDetector(
                  onTap: onRemove,
                  child: Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      color: AppColors.surfaceHigh,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                          color: AppColors.borderBright),
                    ),
                    child: const Icon(Icons.remove_rounded,
                        color: AppColors.textPrimary, size: 16),
                  ),
                ),
                const Gap(10),
                Text(
                  '$quantity',
                  style: GoogleFonts.poppins(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary),
                ),
                const Gap(10),
                GestureDetector(
                  onTap: onAdd,
                  child: Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      gradient: AppColors.brandGradient,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(Icons.add_rounded,
                        color: AppColors.textPrimary, size: 16),
                  ),
                ),
              ],
            ),
        ],
      ),
    );
  }
}

// ─── Bottom summary bar ────────────────────────────────────────────────────────

class _BottomSummary extends StatelessWidget {
  final double voucherAmount;
  final double cartTotal;
  final double voucherUsed;
  final double surplus;
  final bool canSubmit;
  final bool isSubmitting;
  final VoidCallback onConfirm;

  const _BottomSummary({
    required this.voucherAmount,
    required this.cartTotal,
    required this.voucherUsed,
    required this.surplus,
    required this.canSubmit,
    required this.isSubmitting,
    required this.onConfirm,
  });

  @override
  Widget build(BuildContext context) {
    final bottomPadding = MediaQuery.of(context).padding.bottom;
    final hasSurplus = surplus > 0;

    return Container(
      padding:
          EdgeInsets.fromLTRB(16, 14, 16, 14 + bottomPadding),
      decoration: const BoxDecoration(
        color: AppColors.surface,
        border:
            Border(top: BorderSide(color: AppColors.borderBright)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Total commande',
                  style: GoogleFonts.poppins(
                      fontSize: 13,
                      color: AppColors.textSecondary)),
              Text(
                CurrencyUtils.formatAmount(cartTotal),
                style: GoogleFonts.poppins(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary),
              ),
            ],
          ),
          const Gap(6),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Couvert par le bon',
                  style: GoogleFonts.poppins(
                      fontSize: 13,
                      color: AppColors.textSecondary)),
              Text(
                '- ${CurrencyUtils.formatAmount(voucherUsed)}',
                style: GoogleFonts.poppins(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: AppColors.emerald),
              ),
            ],
          ),
          if (hasSurplus) ...[
            const Gap(6),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Surplus à encaisser',
                  style: GoogleFonts.poppins(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: AppColors.amber),
                ),
                Text(
                  CurrencyUtils.formatAmount(surplus),
                  style: GoogleFonts.poppins(
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                      color: AppColors.amber),
                ),
              ],
            ),
          ],
          const Gap(12),
          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton(
              onPressed: canSubmit ? onConfirm : null,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.emerald,
                disabledBackgroundColor: AppColors.surfaceHigh,
                foregroundColor: AppColors.textPrimary,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14)),
              ),
              child: isSubmitting
                  ? const SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: AppColors.textPrimary),
                    )
                  : Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(
                            Icons.check_circle_outline_rounded,
                            size: 20),
                        const Gap(8),
                        Text(
                          'Valider la commande',
                          style: GoogleFonts.poppins(
                              fontSize: 15,
                              fontWeight: FontWeight.w700),
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

// ─── Success sheet ─────────────────────────────────────────────────────────────

class _SuccessSheet extends StatelessWidget {
  final String customerName;
  final double voucherAmountUsed;
  final double surplusPaid;
  final double orderTotal;
  final VoidCallback onDone;

  const _SuccessSheet({
    required this.customerName,
    required this.voucherAmountUsed,
    required this.surplusPaid,
    required this.orderTotal,
    required this.onDone,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 32, 24, 40),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 72,
            height: 72,
            decoration: BoxDecoration(
              color: AppColors.emerald.withValues(alpha: 0.12),
              shape: BoxShape.circle,
              border: Border.all(
                  color: AppColors.emerald.withValues(alpha: 0.3),
                  width: 2),
            ),
            child: const Icon(Icons.check_circle_rounded,
                color: AppColors.emerald, size: 38),
          )
              .animate()
              .scale(
                  begin: const Offset(0.6, 0.6),
                  curve: Curves.easeOutBack,
                  duration: 400.ms)
              .fadeIn(duration: 300.ms),
          const Gap(20),
          Text(
            'Commande validée !',
            style: GoogleFonts.poppins(
                fontSize: 22,
                fontWeight: FontWeight.w800,
                color: AppColors.textPrimary),
          ).animate().fadeIn(duration: 300.ms, delay: 100.ms),
          const Gap(6),
          Text(
            'Commande enregistrée pour $customerName',
            textAlign: TextAlign.center,
            style: GoogleFonts.poppins(
                fontSize: 13, color: AppColors.textSecondary),
          ).animate().fadeIn(duration: 300.ms, delay: 150.ms),
          const Gap(24),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.surfaceHigh,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppColors.borderBright),
            ),
            child: Column(
              children: [
                _SummaryRow(
                    label: 'Total commande',
                    value: CurrencyUtils.formatAmount(orderTotal),
                    color: AppColors.textPrimary),
                const Gap(8),
                _SummaryRow(
                    label: 'Couvert par le bon',
                    value: CurrencyUtils.formatAmount(
                        voucherAmountUsed),
                    color: AppColors.emerald),
                if (surplusPaid > 0) ...[
                  const Gap(8),
                  _SummaryRow(
                      label: 'Surplus encaissé',
                      value:
                          CurrencyUtils.formatAmount(surplusPaid),
                      color: AppColors.amber),
                ],
              ],
            ),
          ).animate().fadeIn(duration: 300.ms, delay: 200.ms),
          const Gap(24),
          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton(
              onPressed: onDone,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.emerald,
                foregroundColor: AppColors.textPrimary,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14)),
              ),
              child: Text(
                'Terminer',
                style: GoogleFonts.poppins(
                    fontSize: 15, fontWeight: FontWeight.w700),
              ),
            ),
          ).animate().fadeIn(duration: 300.ms, delay: 250.ms),
        ],
      ),
    );
  }
}

class _SummaryRow extends StatelessWidget {
  final String label;
  final String value;
  final Color color;

  const _SummaryRow(
      {required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label,
            style: GoogleFonts.poppins(
                fontSize: 13, color: AppColors.textSecondary)),
        Text(value,
            style: GoogleFonts.poppins(
                fontSize: 15,
                fontWeight: FontWeight.w700,
                color: color)),
      ],
    );
  }
}
