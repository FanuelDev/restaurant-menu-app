import 'package:flutter/material.dart';
import '../../../core/utils/currency_provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gap/gap.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/currency_utils.dart';
import '../../../core/api/api_client.dart';
import '../models/order_models.dart';
import '../providers/orders_provider.dart';
import '../../../shared/widgets/loading_shimmer.dart';
import '../../../shared/widgets/error_widget.dart';

class CreateOrderScreen extends ConsumerStatefulWidget {
  const CreateOrderScreen({super.key});

  @override
  ConsumerState<CreateOrderScreen> createState() => _CreateOrderScreenState();
}

class _CreateOrderScreenState extends ConsumerState<CreateOrderScreen>
    with TickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  final _customerNameController = TextEditingController();
  final _customerPhoneController = TextEditingController();
  final _customerEmailController = TextEditingController();
  final _notesController = TextEditingController();

  final Map<int, CartItem> _cart = {};
  String _selectedStatus = 'pending';
  bool _isSubmitting = false;
  int _currentStep = 0;

  late AnimationController _stepController;

  @override
  void initState() {
    super.initState();
    _stepController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    );
  }

  @override
  void dispose() {
    _stepController.dispose();
    _customerNameController.dispose();
    _customerPhoneController.dispose();
    _customerEmailController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  num get _total =>
      _cart.values.fold<num>(0, (sum, item) => sum + item.subtotal);

  int get _itemCount =>
      _cart.values.fold<int>(0, (sum, item) => sum + item.quantity);

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

  void _goToStep(int step) {
    if (step == 1 && !_formKey.currentState!.validate()) return;
    setState(() => _currentStep = step);
  }

  Future<void> _submit() async {
    if (_cart.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Veuillez ajouter au moins un article',
              style: GoogleFonts.poppins()),
          backgroundColor: AppColors.amber,
        ),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    final items = _cart.values
        .map((ci) => {
              'menuItemId': ci.menuItem.id,
              'quantity': ci.quantity,
              if (ci.specialInstructions != null &&
                  ci.specialInstructions!.isNotEmpty)
                'specialInstructions': ci.specialInstructions,
            })
        .toList();

    final notifier = ref.read(createOrderNotifierProvider.notifier);
    final order = await notifier.createOrder(
      customerName: _customerNameController.text.trim(),
      customerPhone: _customerPhoneController.text.trim(),
      customerEmail: _customerEmailController.text.trim(),
      notes: _notesController.text.trim(),
      status: _selectedStatus,
      items: items,
    );

    if (!mounted) return;

    final state = ref.read(createOrderNotifierProvider);
    if (state is AsyncError) {
      setState(() => _isSubmitting = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(extractErrorMessage(state.error),
              style: GoogleFonts.poppins()),
          backgroundColor: AppColors.brand,
        ),
      );
    } else if (order != null) {
      ref.invalidate(ordersProvider);
      ref.invalidate(recentOrdersProvider);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Commande créée avec succès',
              style: GoogleFonts.poppins()),
        ),
      );
      context.pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    final categoriesAsync = ref.watch(categoriesProvider);
    final topPadding = MediaQuery.of(context).padding.top;
    final currency = ref.watch(currencyProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: Column(
        children: [
          // Header
          Container(
            color: AppColors.background,
            padding: EdgeInsets.fromLTRB(16, topPadding + 12, 16, 16),
            child: Column(
              children: [
                Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.close_rounded,
                          color: AppColors.textSecondary),
                      onPressed: () => context.pop(),
                    ),
                    Expanded(
                      child: Text(
                        'Nouvelle commande',
                        style: GoogleFonts.poppins(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color: AppColors.textPrimary,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ),
                    if (_itemCount > 0)
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppColors.brand.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                              color: AppColors.brand.withValues(alpha: 0.3)),
                        ),
                        child: Text(
                          '$_itemCount',
                          style: GoogleFonts.poppins(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: AppColors.brand,
                          ),
                        ),
                      )
                    else
                      const SizedBox(width: 48),
                  ],
                ),
                const Gap(16),
                // Step indicator
                _StepIndicator(currentStep: _currentStep),
              ],
            ),
          ),

          const Divider(color: AppColors.border, height: 1),

          // Content
          Expanded(
            child: Form(
              key: _formKey,
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 300),
                transitionBuilder: (child, animation) => FadeTransition(
                  opacity: animation,
                  child: SlideTransition(
                    position: Tween<Offset>(
                      begin: const Offset(0.05, 0),
                      end: Offset.zero,
                    ).animate(CurvedAnimation(
                        parent: animation, curve: Curves.easeOutCubic)),
                    child: child,
                  ),
                ),
                child: _currentStep == 0
                    ? _Step1Client(
                        key: const ValueKey(0),
                        nameController: _customerNameController,
                        phoneController: _customerPhoneController,
                        emailController: _customerEmailController,
                        notesController: _notesController,
                        selectedStatus: _selectedStatus,
                        onStatusChanged: (v) =>
                            setState(() => _selectedStatus = v),
                      )
                    : _currentStep == 1
                        ? _Step2Articles(
                            key: const ValueKey(1),
                            categoriesAsync: categoriesAsync,
                            cart: _cart,
                            onAdd: _addItem,
                            onRemove: _removeItem,
                            total: _total,
                            itemCount: _itemCount,
                            currency: currency,
                          )
                        : _Step3Summary(
                            key: const ValueKey(2),
                            cart: _cart,
                            total: _total,
                            customerName:
                                _customerNameController.text.trim(),
                            currency: currency,
                          ),
              ),
            ),
          ),

          // Navigation buttons
          Container(
            decoration: const BoxDecoration(
              color: AppColors.surface,
              border: Border(top: BorderSide(color: AppColors.border)),
            ),
            padding: EdgeInsets.fromLTRB(
                16, 12, 16, MediaQuery.of(context).padding.bottom + 12),
            child: Row(
              children: [
                if (_currentStep > 0)
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () =>
                          setState(() => _currentStep--),
                      child: Text('Précédent',
                          style: GoogleFonts.poppins(
                              fontWeight: FontWeight.w600)),
                    ),
                  ),
                if (_currentStep > 0) const Gap(12),
                Expanded(
                  flex: 2,
                  child: _currentStep < 2
                      ? _GradientBtn(
                          label: 'Suivant',
                          icon: Icons.arrow_forward_rounded,
                          onPressed: () => _goToStep(_currentStep + 1),
                        )
                      : _GradientBtn(
                          label: _isSubmitting
                              ? 'Création...'
                              : 'Confirmer la commande',
                          icon: Icons.check_rounded,
                          onPressed: _isSubmitting ? null : _submit,
                          isLoading: _isSubmitting,
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

class _StepIndicator extends StatelessWidget {
  final int currentStep;

  const _StepIndicator({required this.currentStep});

  @override
  Widget build(BuildContext context) {
    const labels = ['Client', 'Articles', 'Résumé'];
    return Row(
      children: List.generate(5, (i) {
        if (i.isOdd) {
          final stepIndex = i ~/ 2;
          final isPast = stepIndex < currentStep;
          return Expanded(
            child: Container(
              height: 2,
              margin: const EdgeInsets.symmetric(horizontal: 4),
              color: isPast ? AppColors.brand : AppColors.border,
            ),
          );
        }
        final stepIndex = i ~/ 2;
        final isActive = stepIndex == currentStep;
        final isPast = stepIndex < currentStep;
        return Column(
          children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 250),
              width: isActive ? 32 : 24,
              height: isActive ? 32 : 24,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: isPast
                    ? AppColors.emerald
                    : isActive
                        ? AppColors.brand
                        : AppColors.surfaceHigh,
                border: Border.all(
                  color: isPast
                      ? AppColors.emerald
                      : isActive
                          ? AppColors.brand
                          : AppColors.border,
                  width: 2,
                ),
              ),
              child: Center(
                child: isPast
                    ? const Icon(Icons.check_rounded,
                        color: AppColors.textPrimary, size: 13)
                    : Text(
                        '${stepIndex + 1}',
                        style: GoogleFonts.poppins(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: isActive
                              ? AppColors.textPrimary
                              : AppColors.textMuted,
                        ),
                      ),
              ),
            ),
            const Gap(4),
            Text(
              labels[stepIndex],
              style: GoogleFonts.poppins(
                fontSize: 10,
                fontWeight:
                    isActive ? FontWeight.w600 : FontWeight.w400,
                color: isActive ? AppColors.brand : AppColors.textMuted,
              ),
            ),
          ],
        );
      }),
    );
  }
}

class _Step1Client extends StatelessWidget {
  final TextEditingController nameController;
  final TextEditingController phoneController;
  final TextEditingController emailController;
  final TextEditingController notesController;
  final String selectedStatus;
  final void Function(String) onStatusChanged;

  const _Step1Client({
    super.key,
    required this.nameController,
    required this.phoneController,
    required this.emailController,
    required this.notesController,
    required this.selectedStatus,
    required this.onStatusChanged,
  });

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text(
          'Informations client',
          style: GoogleFonts.poppins(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: AppColors.textSecondary,
          ),
        ).animate().fadeIn(duration: 300.ms),
        const Gap(16),
        TextFormField(
          controller: nameController,
          style: const TextStyle(color: AppColors.textPrimary),
          decoration: const InputDecoration(
            labelText: 'Nom du client *',
            prefixIcon: Icon(Icons.person_outline_rounded),
          ),
          textCapitalization: TextCapitalization.words,
          validator: (v) =>
              v == null || v.trim().isEmpty ? 'Champ obligatoire' : null,
        ).animate().fadeIn(duration: 300.ms, delay: 50.ms),
        const Gap(14),
        TextFormField(
          controller: phoneController,
          style: const TextStyle(color: AppColors.textPrimary),
          decoration: const InputDecoration(
            labelText: 'Téléphone',
            prefixIcon: Icon(Icons.phone_outlined),
          ),
          keyboardType: TextInputType.phone,
        ).animate().fadeIn(duration: 300.ms, delay: 100.ms),
        const Gap(14),
        TextFormField(
          controller: emailController,
          style: const TextStyle(color: AppColors.textPrimary),
          decoration: const InputDecoration(
            labelText: 'Email',
            prefixIcon: Icon(Icons.email_outlined),
          ),
          keyboardType: TextInputType.emailAddress,
        ).animate().fadeIn(duration: 300.ms, delay: 150.ms),
        const Gap(14),
        TextFormField(
          controller: notesController,
          style: const TextStyle(color: AppColors.textPrimary),
          decoration: const InputDecoration(
            labelText: 'Notes',
            prefixIcon: Icon(Icons.notes_rounded),
          ),
          maxLines: 2,
        ).animate().fadeIn(duration: 300.ms, delay: 200.ms),
        const Gap(14),
        DropdownButtonFormField<String>(
          initialValue: selectedStatus,
          dropdownColor: AppColors.surface,
          style: GoogleFonts.poppins(
              color: AppColors.textPrimary, fontSize: 14),
          decoration: const InputDecoration(
            labelText: 'Statut initial',
            prefixIcon: Icon(Icons.flag_outlined),
          ),
          items: [
            DropdownMenuItem(
              value: 'pending',
              child: Text('En attente',
                  style:
                      GoogleFonts.poppins(color: AppColors.textPrimary)),
            ),
            DropdownMenuItem(
              value: 'confirmed',
              child: Text('Confirmé',
                  style:
                      GoogleFonts.poppins(color: AppColors.textPrimary)),
            ),
          ],
          onChanged: (v) => onStatusChanged(v!),
        ).animate().fadeIn(duration: 300.ms, delay: 250.ms),
        const Gap(80),
      ],
    );
  }
}

class _Step2Articles extends StatelessWidget {
  final AsyncValue<List<MenuCategory>> categoriesAsync;
  final Map<int, CartItem> cart;
  final void Function(MenuItem) onAdd;
  final void Function(MenuItem) onRemove;
  final num total;
  final int itemCount;
  final String currency;

  const _Step2Articles({
    super.key,
    required this.categoriesAsync,
    required this.cart,
    required this.onAdd,
    required this.onRemove,
    required this.total,
    required this.itemCount,
    required this.currency,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        if (itemCount > 0)
          Container(
            width: double.infinity,
            padding:
                const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            color: AppColors.surfaceHigh,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '$itemCount article${itemCount > 1 ? 's' : ''} sélectionné${itemCount > 1 ? 's' : ''}',
                  style: GoogleFonts.poppins(
                    fontSize: 13,
                    color: AppColors.textSecondary,
                  ),
                ),
                Text(
                  CurrencyUtils.formatAmount(total, currency: currency),
                  style: GoogleFonts.poppins(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: AppColors.brand,
                  ),
                ),
              ],
            ),
          ),
        Expanded(
          child: categoriesAsync.when(
            data: (categories) => categories.isEmpty
                ? Center(
                    child: Text(
                      'Aucun article disponible',
                      style: GoogleFonts.poppins(
                          color: AppColors.textMuted, fontSize: 14),
                    ),
                  )
                : ListView(
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 80),
                    children: categories
                        .map((cat) => _CategorySection(
                              category: cat,
                              cart: cart,
                              onAdd: onAdd,
                              onRemove: onRemove,
                              currency: currency,
                            ))
                        .toList(),
                  ),
            loading: () =>
                const LoadingShimmer(itemCount: 3, itemHeight: 70),
            error: (e, _) => AppErrorWidget(
              message: extractErrorMessage(e),
              onRetry: () {},
            ),
          ),
        ),
      ],
    );
  }
}

class _Step3Summary extends StatelessWidget {
  final Map<int, CartItem> cart;
  final num total;
  final String customerName;
  final String currency;

  const _Step3Summary({
    super.key,
    required this.cart,
    required this.total,
    required this.customerName,
    required this.currency,
  });

  @override
  Widget build(BuildContext context) {
    final items = cart.values.toList();
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text(
          'Récapitulatif',
          style: GoogleFonts.poppins(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: AppColors.textSecondary,
          ),
        ).animate().fadeIn(duration: 300.ms),
        const Gap(16),
        Container(
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
                  const Icon(Icons.person_outline_rounded,
                      color: AppColors.brand, size: 16),
                  const Gap(8),
                  Text(
                    customerName.isNotEmpty ? customerName : 'Client',
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
              ...List.generate(items.length, (i) {
                final item = items[i];
                return Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: Row(
                    children: [
                      Container(
                        width: 28,
                        height: 28,
                        decoration: BoxDecoration(
                          color: AppColors.brand.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Center(
                          child: Text(
                            '${item.quantity}x',
                            style: GoogleFonts.poppins(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: AppColors.brand,
                            ),
                          ),
                        ),
                      ),
                      const Gap(10),
                      Expanded(
                        child: Text(
                          item.menuItem.name,
                          style: GoogleFonts.poppins(
                            fontSize: 13,
                            color: AppColors.textPrimary,
                          ),
                        ),
                      ),
                      Text(
                        CurrencyUtils.formatAmount(item.subtotal, currency: currency),
                        style: GoogleFonts.poppins(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  )
                      .animate()
                      .fadeIn(duration: 300.ms, delay: (i * 50).ms),
                );
              }),
              const Divider(color: AppColors.border, height: 24),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Total',
                    style: GoogleFonts.poppins(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  Text(
                    CurrencyUtils.formatAmount(total, currency: currency),
                    style: GoogleFonts.poppins(
                      fontSize: 24,
                      fontWeight: FontWeight.w800,
                      color: AppColors.brand,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ).animate().fadeIn(duration: 300.ms, delay: 100.ms),
        const Gap(80),
      ],
    );
  }
}

class _CategorySection extends StatelessWidget {
  final MenuCategory category;
  final Map<int, CartItem> cart;
  final void Function(MenuItem) onAdd;
  final void Function(MenuItem) onRemove;
  final String currency;

  const _CategorySection({
    required this.category,
    required this.cart,
    required this.onAdd,
    required this.onRemove,
    required this.currency,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 10),
              child: Text(
                category.name,
                style: GoogleFonts.poppins(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: AppColors.brand,
                ),
              ),
            ),
            const Divider(color: AppColors.border, height: 1),
            ...category.items.map(
              (item) => _MenuItemRow(
                item: item,
                quantity: cart[item.id]?.quantity ?? 0,
                onAdd: () => onAdd(item),
                onRemove: () => onRemove(item),
                currency: currency,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _MenuItemRow extends StatelessWidget {
  final MenuItem item;
  final int quantity;
  final VoidCallback onAdd;
  final VoidCallback onRemove;
  final String currency;

  const _MenuItemRow({
    required this.item,
    required this.quantity,
    required this.onAdd,
    required this.onRemove,
    required this.currency,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.name,
                  style: GoogleFonts.poppins(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    color: AppColors.textPrimary,
                  ),
                ),
                Text(
                  CurrencyUtils.formatAmount(item.price, currency: currency),
                  style: GoogleFonts.poppins(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppColors.brand,
                  ),
                ),
              ],
            ),
          ),
          Row(
            children: [
              if (quantity > 0) ...[
                _CircleButton(
                  icon: Icons.remove_rounded,
                  onTap: onRemove,
                  color: AppColors.textSecondary,
                  background: AppColors.surfaceHigh,
                ),
                const Gap(10),
                Text(
                  '$quantity',
                  style: GoogleFonts.poppins(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
                const Gap(10),
              ],
              _CircleButton(
                icon: Icons.add_rounded,
                onTap: onAdd,
                color: AppColors.textPrimary,
                background: AppColors.brand,
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _CircleButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  final Color color;
  final Color background;

  const _CircleButton({
    required this.icon,
    required this.onTap,
    required this.color,
    required this.background,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 32,
        height: 32,
        decoration: BoxDecoration(
          color: background,
          shape: BoxShape.circle,
        ),
        child: Icon(icon, color: color, size: 18),
      ),
    );
  }
}

class _GradientBtn extends StatelessWidget {
  final String label;
  final IconData icon;
  final VoidCallback? onPressed;
  final bool isLoading;

  const _GradientBtn({
    required this.label,
    required this.icon,
    this.onPressed,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onPressed,
      child: Container(
        height: 50,
        decoration: BoxDecoration(
          gradient: onPressed != null
              ? AppColors.brandGradient
              : const LinearGradient(
                  colors: [Color(0xFF5A2020), Color(0xFF3D1515)]),
          borderRadius: BorderRadius.circular(12),
          boxShadow: onPressed != null
              ? [
                  BoxShadow(
                    color: AppColors.brand.withValues(alpha: 0.35),
                    blurRadius: 14,
                    offset: const Offset(0, 4),
                  ),
                ]
              : [],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (isLoading)
              const SizedBox(
                width: 18,
                height: 18,
                child: CircularProgressIndicator(
                    color: AppColors.textPrimary, strokeWidth: 2),
              )
            else
              Icon(icon, color: AppColors.textPrimary, size: 18),
            const Gap(8),
            Text(
              label,
              style: GoogleFonts.poppins(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: AppColors.textPrimary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
