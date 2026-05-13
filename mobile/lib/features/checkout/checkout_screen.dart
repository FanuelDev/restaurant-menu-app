// lib/features/checkout/checkout_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/models/models.dart';
import '../../core/providers/providers.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/price_formatter.dart';

// ── Public entry-point ────────────────────────────────────────────────────────

class CheckoutScreen extends ConsumerStatefulWidget {
  final String slug;
  const CheckoutScreen({super.key, required this.slug});

  /// Show checkout as a bottom-sheet modal (preferred on mobile).
  static Future<void> show(BuildContext context) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      useSafeArea: true,
      builder: (_) => const _CheckoutSheet(),
    );
  }

  // Kept for deep-link route compatibility.
  @override
  ConsumerState<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends ConsumerState<CheckoutScreen> {
  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: AppTheme.cream,
      body: SafeArea(child: _CheckoutSheet(asPage: true)),
    );
  }
}

// ── Sheet / Page body ─────────────────────────────────────────────────────────

class _CheckoutSheet extends ConsumerStatefulWidget {
  final bool asPage;
  const _CheckoutSheet({this.asPage = false});

  @override
  ConsumerState<_CheckoutSheet> createState() => _CheckoutSheetState();
}

class _CheckoutSheetState extends ConsumerState<_CheckoutSheet> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _nameCtrl;
  late final TextEditingController _phoneCtrl;
  late final TextEditingController _emailCtrl;
  final TextEditingController _notesCtrl = TextEditingController();
  bool _saveProfile = false;
  bool _isGift = false;
  bool _loading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    final profile = ref.read(profileProvider);
    _nameCtrl  = TextEditingController(text: profile.name  ?? '');
    _phoneCtrl = TextEditingController(text: profile.phone ?? '');
    _emailCtrl = TextEditingController(text: profile.email ?? '');
    _saveProfile = profile.name != null;
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _phoneCtrl.dispose();
    _emailCtrl.dispose();
    _notesCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final items = ref.read(cartProvider);
    if (items.isEmpty) return;

    setState(() { _loading = true; _error = null; });
    HapticFeedback.mediumImpact();

    try {
      if (_saveProfile) {
        await ref.read(profileProvider.notifier).save(CustomerProfile(
          name:  _nameCtrl.text.trim(),
          phone: _phoneCtrl.text.trim().isEmpty ? null : _phoneCtrl.text.trim(),
          email: _emailCtrl.text.trim().isEmpty ? null : _emailCtrl.text.trim(),
        ));
      }

      await ref.read(apiClientProvider).placeOrder({
        'customer_name':  _nameCtrl.text.trim(),
        'customer_phone': _phoneCtrl.text.trim(),
        if (_emailCtrl.text.trim().isNotEmpty)
          'customer_email': _emailCtrl.text.trim(),
        if (_notesCtrl.text.trim().isNotEmpty)
          'notes': _notesCtrl.text.trim(),
        'is_gift': _isGift,
        'items': items
            .map((ci) => {'menu_item_id': ci.item.id, 'quantity': ci.qty})
            .toList(),
      });

      ref.read(cartProvider.notifier).clear();

      if (!mounted) return;
      if (!widget.asPage) Navigator.pop(context);
      _showSuccess();
    } catch (e) {
      setState(() { _loading = false; _error = e.toString(); });
    }
  }

  void _showSuccess() {
    final restaurant = ref.read(restaurantProvider).restaurant;
    final slug = restaurant?.slug ?? '';

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isDismissible: false,
      builder: (_) => _SuccessSheet(
        onBack: () {
          Navigator.pop(context);
          if (widget.asPage && mounted) context.go('/menu/$slug');
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final items    = ref.watch(cartProvider);
    final total    = ref.watch(cartProvider.notifier).total;
    final restaurant = ref.watch(restaurantProvider).restaurant;
    final brand    = restaurant?.brandColorValue ?? AppTheme.charcoal;
    final currency = restaurant?.currency ?? 'XOF';

    final content = Form(
      key: _formKey,
      child: ListView(
        padding: EdgeInsets.only(
          left: 20, right: 20, top: 8,
          bottom: MediaQuery.viewInsetsOf(context).bottom + 24,
        ),
        children: [
          // ── Handle / header ───────────────────────────────────────────────
          if (!widget.asPage) ...[
            Center(
              child: Container(
                width: 36, height: 4,
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: AppTheme.border,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
          ],

          Row(
            children: [
              Container(
                width: 38, height: 38,
                decoration: BoxDecoration(
                  color: brand.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(Icons.shopping_bag_outlined, color: brand, size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text('Finaliser la commande',
                    style: AppTheme.heading(AppTheme.charcoal)),
              ),
              if (!widget.asPage)
                IconButton(
                  icon: const Icon(Icons.close_rounded,
                      color: AppTheme.grey2, size: 22),
                  onPressed: () => Navigator.pop(context),
                ),
            ],
          ),

          const SizedBox(height: 20),
          const Divider(color: AppTheme.border),
          const SizedBox(height: 20),

          // ── Customer info ─────────────────────────────────────────────────
          Text('VOS INFORMATIONS',
              style: AppTheme.label(AppTheme.grey3)
                  .copyWith(fontSize: 11, letterSpacing: 0.8)),
          const SizedBox(height: 12),

          _Field(
            controller: _nameCtrl,
            label: 'Votre nom',
            hint: 'Ex: Jean Dupont',
            icon: Icons.person_outline_rounded,
            brand: brand,
            validator: (v) =>
                (v ?? '').trim().isEmpty ? 'Le nom est requis' : null,
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: _Field(
                  controller: _phoneCtrl,
                  label: 'Téléphone',
                  hint: '+229 XX XX XX',
                  icon: Icons.phone_outlined,
                  brand: brand,
                  keyboardType: TextInputType.phone,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _Field(
                  controller: _emailCtrl,
                  label: 'Email',
                  hint: 'email@exemple.com',
                  icon: Icons.email_outlined,
                  brand: brand,
                  keyboardType: TextInputType.emailAddress,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          _Field(
            controller: _notesCtrl,
            label: 'Notes pour la commande',
            hint: 'Allergies, instructions particulières...',
            icon: Icons.notes_rounded,
            brand: brand,
            maxLines: 3,
          ),
          const SizedBox(height: 10),

          // Save profile checkbox
          _CheckRow(
            value: _saveProfile,
            label: 'Mémoriser pour la prochaine fois',
            onChanged: (v) => setState(() => _saveProfile = v),
          ),

          const SizedBox(height: 20),
          const Divider(color: AppTheme.border),
          const SizedBox(height: 20),

          // ── Gift option ───────────────────────────────────────────────────
          _GiftToggle(
            value: _isGift,
            onChanged: (v) => setState(() => _isGift = v),
          ),

          const SizedBox(height: 20),
          const Divider(color: AppTheme.border),
          const SizedBox(height: 20),

          // ── Order recap ───────────────────────────────────────────────────
          Text('RÉCAPITULATIF',
              style: AppTheme.label(AppTheme.grey3)
                  .copyWith(fontSize: 11, letterSpacing: 0.8)),
          const SizedBox(height: 12),

          Container(
            decoration: BoxDecoration(
              color: AppTheme.cream,
              borderRadius: BorderRadius.circular(14),
            ),
            padding: const EdgeInsets.all(14),
            child: Column(
              children: [
                ...items.map((ci) => Padding(
                      padding: const EdgeInsets.symmetric(vertical: 5),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 7, vertical: 2),
                            decoration: BoxDecoration(
                              color: brand.withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text('${ci.qty}×',
                                style: AppTheme.label(brand)
                                    .copyWith(fontSize: 12)),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(ci.item.name,
                                style: AppTheme.body(AppTheme.charcoal)
                                    .copyWith(fontSize: 13)),
                          ),
                          Text(
                            formatPrice(ci.subtotal, currency),
                            style: AppTheme.body(AppTheme.grey2)
                                .copyWith(fontSize: 13),
                          ),
                        ],
                      ),
                    )),
                const Divider(color: AppTheme.border, height: 20),
                Row(
                  children: [
                    Text('Total',
                        style: AppTheme.bodyBold(AppTheme.charcoal)
                            .copyWith(fontSize: 15)),
                    const Spacer(),
                    TweenAnimationBuilder<double>(
                      tween: Tween(begin: total * 0.95, end: total),
                      duration: AppTheme.normal,
                      curve: AppTheme.spring,
                      builder: (_, v, __) => Text(
                        formatPrice(v, currency),
                        style: AppTheme.heading(brand).copyWith(fontSize: 18),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // ── Error ─────────────────────────────────────────────────────────
          if (_error != null) ...[
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppTheme.badgeSpicy.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Row(
                children: [
                  const Icon(Icons.error_outline_rounded,
                      color: AppTheme.badgeSpicy, size: 18),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(_error!,
                        style: AppTheme.caption(AppTheme.badgeSpicy)),
                  ),
                ],
              ),
            ),
          ],

          const SizedBox(height: 20),

          // ── Submit button ─────────────────────────────────────────────────
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: _loading ? null : _submit,
              style: FilledButton.styleFrom(
                backgroundColor: brand,
                disabledBackgroundColor: brand.withValues(alpha: 0.5),
                padding: const EdgeInsets.symmetric(vertical: 17),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16)),
              ),
              child: _loading
                  ? const SizedBox(
                      width: 22, height: 22,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: Colors.white))
                  : Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          'Confirmer la commande · ${formatPrice(total, currency)}',
                          style: AppTheme.bodyBold(Colors.white)
                              .copyWith(fontSize: 15),
                        ),
                      ],
                    ),
            ),
          ),
        ],
      ),
    );

    if (widget.asPage) return content;

    return Container(
      decoration: const BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      constraints: BoxConstraints(
        maxHeight: MediaQuery.sizeOf(context).height * 0.93,
      ),
      child: content,
    );
  }
}

// ── Success bottom sheet ──────────────────────────────────────────────────────

class _SuccessSheet extends StatelessWidget {
  final VoidCallback onBack;
  const _SuccessSheet({required this.onBack});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      padding: const EdgeInsets.fromLTRB(28, 28, 28, 40),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 72, height: 72,
              decoration: BoxDecoration(
                color: AppTheme.badgeVeg.withValues(alpha: 0.12),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.check_circle_outline_rounded,
                  color: AppTheme.badgeVeg, size: 40),
            ),
            const SizedBox(height: 20),
            Text('Commande envoyée !',
                style: AppTheme.heading(AppTheme.charcoal)
                    .copyWith(fontSize: 20),
                textAlign: TextAlign.center),
            const SizedBox(height: 8),
            Text(
              'Votre commande a bien été transmise.\nLe restaurant vous contactera pour confirmation.',
              style: AppTheme.body(AppTheme.grey2).copyWith(height: 1.5),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 28),
            SizedBox(
              width: double.infinity,
              child: FilledButton.icon(
                onPressed: onBack,
                icon: const Icon(Icons.arrow_back_rounded, size: 18),
                label: const Text('Retour au menu'),
                style: FilledButton.styleFrom(
                  backgroundColor: AppTheme.charcoal,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16)),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Reusable form field ───────────────────────────────────────────────────────

class _Field extends StatelessWidget {
  final TextEditingController? controller;
  final String label;
  final String? hint;
  final IconData icon;
  final Color brand;
  final TextInputType? keyboardType;
  final String? Function(String?)? validator;
  final int maxLines;
  final ValueChanged<String>? onChanged;

  const _Field({
    this.controller,
    required this.label,
    this.hint,
    required this.icon,
    required this.brand,
    this.keyboardType,
    this.validator,
    this.maxLines = 1,
    this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      maxLines: maxLines,
      onChanged: onChanged,
      validator: validator,
      style: AppTheme.body(AppTheme.charcoal).copyWith(fontSize: 14),
      decoration: InputDecoration(
        labelText: label,
        hintText: hint,
        labelStyle: AppTheme.caption(AppTheme.grey3),
        hintStyle: AppTheme.caption(AppTheme.grey3),
        prefixIcon: Icon(icon, size: 18, color: AppTheme.grey3),
        filled: true,
        fillColor: AppTheme.cream,
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
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppTheme.badgeSpicy, width: 1.5),
        ),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      ),
    );
  }
}

// ── Gift toggle ───────────────────────────────────────────────────────────────

class _GiftToggle extends StatelessWidget {
  final bool value;
  final ValueChanged<bool> onChanged;
  const _GiftToggle({required this.value, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => onChanged(!value),
      child: AnimatedContainer(
        duration: AppTheme.quick,
        decoration: BoxDecoration(
          color: value
              ? const Color(0xFFFFF8E1)
              : AppTheme.cream,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: value ? const Color(0xFFFFB300) : AppTheme.border,
          ),
        ),
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            Text('🎁', style: const TextStyle(fontSize: 22)),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Envoyer comme cadeau',
                      style: AppTheme.bodyBold(AppTheme.charcoal)
                          .copyWith(fontSize: 14)),
                  Text('Un QR code sera généré pour le destinataire',
                      style: AppTheme.caption(AppTheme.grey3)),
                ],
              ),
            ),
            AnimatedContainer(
              duration: AppTheme.quick,
              width: 22, height: 22,
              decoration: BoxDecoration(
                color: value ? const Color(0xFFFFB300) : Colors.transparent,
                borderRadius: BorderRadius.circular(6),
                border: Border.all(
                  color: value
                      ? const Color(0xFFFFB300)
                      : AppTheme.grey4,
                  width: 2,
                ),
              ),
              child: value
                  ? const Icon(Icons.check_rounded,
                      color: Colors.white, size: 14)
                  : null,
            ),
          ],
        ),
      ),
    );
  }
}

// ── Save profile checkbox row ─────────────────────────────────────────────────

class _CheckRow extends StatelessWidget {
  final bool value;
  final String label;
  final ValueChanged<bool> onChanged;
  const _CheckRow({
    required this.value,
    required this.label,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => onChanged(!value),
      child: Row(
        children: [
          AnimatedContainer(
            duration: AppTheme.quick,
            width: 20, height: 20,
            decoration: BoxDecoration(
              color: value ? AppTheme.charcoal : Colors.transparent,
              borderRadius: BorderRadius.circular(6),
              border: Border.all(
                color: value ? AppTheme.charcoal : AppTheme.grey4,
                width: 2,
              ),
            ),
            child: value
                ? const Icon(Icons.check_rounded,
                    color: Colors.white, size: 13)
                : null,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(label,
                style: AppTheme.caption(AppTheme.grey2)
                    .copyWith(fontSize: 12)),
          ),
        ],
      ),
    );
  }
}
