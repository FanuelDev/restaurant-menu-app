// lib/features/profile/profile_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/models/models.dart';
import '../../core/providers/providers.dart';
import '../../core/theme/app_theme.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});
  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _nameCtrl;
  late final TextEditingController _phoneCtrl;
  late final TextEditingController _emailCtrl;
  bool _saving = false;
  bool _dirty = false;

  @override
  void initState() {
    super.initState();
    final p = ref.read(profileProvider);
    _nameCtrl  = TextEditingController(text: p.name ?? '');
    _phoneCtrl = TextEditingController(text: p.phone ?? '');
    _emailCtrl = TextEditingController(text: p.email ?? '');
    _nameCtrl.addListener(_mark);
    _phoneCtrl.addListener(_mark);
    _emailCtrl.addListener(_mark);
  }

  void _mark() => setState(() => _dirty = true);

  @override
  void dispose() {
    _nameCtrl.dispose(); _phoneCtrl.dispose(); _emailCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    await ref.read(profileProvider.notifier).save(CustomerProfile(
      name:  _nameCtrl.text.trim().isEmpty  ? null : _nameCtrl.text.trim(),
      phone: _phoneCtrl.text.trim().isEmpty ? null : _phoneCtrl.text.trim(),
      email: _emailCtrl.text.trim().isEmpty ? null : _emailCtrl.text.trim(),
    ));
    setState(() { _saving = false; _dirty = false; });
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('Profil sauvegarde', style: AppTheme.body(Colors.white)),
        backgroundColor: AppTheme.badgeVeg,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        margin: const EdgeInsets.all(16),
      ));
    }
  }

  Future<void> _clear() async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text('Supprimer le profil ?', style: AppTheme.title(AppTheme.charcoal)),
        content: Text('Vos informations seront effacees de cet appareil.',
            style: AppTheme.body(AppTheme.grey2)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text('Annuler', style: AppTheme.body(AppTheme.grey2)),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            style: FilledButton.styleFrom(
              backgroundColor: AppTheme.badgeSpicy,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: Text('Supprimer', style: AppTheme.bodyBold(Colors.white)),
          ),
        ],
      ),
    );
    if (ok == true) {
      await ref.read(profileProvider.notifier).clear();
      _nameCtrl.clear(); _phoneCtrl.clear(); _emailCtrl.clear();
      setState(() => _dirty = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final profile = ref.watch(profileProvider);
    final initial = (profile.name?.isNotEmpty == true)
        ? profile.name![0].toUpperCase()
        : null;

    return Scaffold(
      backgroundColor: AppTheme.cream,
      appBar: AppBar(
        backgroundColor: AppTheme.surface,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded,
              size: 18, color: AppTheme.charcoal),
          onPressed: () => context.go('/'),
        ),
        title: Text('Mon profil', style: AppTheme.title(AppTheme.charcoal)),
        actions: [
          if (profile.name != null)
            IconButton(
              icon: const Icon(Icons.delete_outline_rounded,
                  color: AppTheme.badgeSpicy, size: 22),
              onPressed: _clear,
            ),
        ],
        bottom: const PreferredSize(
          preferredSize: Size.fromHeight(1),
          child: Divider(height: 1, color: AppTheme.border),
        ),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            // Avatar
            Center(
              child: Column(
                children: [
                  Container(
                    width: 72, height: 72,
                    decoration: BoxDecoration(
                      color: const Color(0xFFC0392B).withValues(alpha: 0.1),
                      shape: BoxShape.circle,
                    ),
                    child: Center(
                      child: initial != null
                          ? Text(initial,
                              style: AppTheme.display(const Color(0xFFC0392B))
                                  .copyWith(fontSize: 30))
                          : const Icon(Icons.person_outline_rounded,
                              size: 32, color: Color(0xFFC0392B)),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text('Stocke uniquement sur cet appareil',
                      style: AppTheme.caption(AppTheme.grey3)),
                ],
              ),
            ),

            const SizedBox(height: 28),

            _Card(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Informations personnelles',
                      style: AppTheme.title(AppTheme.charcoal)),
                  const SizedBox(height: 16),
                  _Field(ctrl: _nameCtrl, label: 'Nom complet',
                      icon: Icons.person_outline_rounded,
                      type: TextInputType.name),
                  const SizedBox(height: 12),
                  _Field(ctrl: _phoneCtrl, label: 'Telephone',
                      icon: Icons.phone_outlined,
                      type: TextInputType.phone),
                  const SizedBox(height: 12),
                  _Field(
                    ctrl: _emailCtrl, label: 'Email',
                    icon: Icons.email_outlined,
                    type: TextInputType.emailAddress,
                    validator: (v) {
                      if (v == null || v.isEmpty) return null;
                      if (!v.contains('@')) return 'Email invalide';
                      return null;
                    },
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            AnimatedOpacity(
              opacity: _dirty ? 1 : 0.45,
              duration: AppTheme.quick,
              child: SizedBox(
                width: double.infinity,
                child: FilledButton.icon(
                  onPressed: (_dirty && !_saving) ? _save : null,
                  style: FilledButton.styleFrom(
                    backgroundColor: AppTheme.charcoal,
                    disabledBackgroundColor: AppTheme.grey4,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14)),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  icon: _saving
                      ? const SizedBox(width: 18, height: 18,
                          child: CircularProgressIndicator(
                              strokeWidth: 2, color: Colors.white))
                      : const Icon(Icons.check_rounded, size: 18),
                  label: Text(
                    _saving ? 'Sauvegarde...' : 'Sauvegarder le profil',
                    style: AppTheme.bodyBold(Colors.white),
                  ),
                ),
              ),
            ),

            const SizedBox(height: 32),
            _RecentSection(),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }
}

class _RecentSection extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final recents = ref.watch(recentRestaurantsProvider);
    if (recents.isEmpty) return const SizedBox.shrink();

    return _Card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text('Restaurants recents', style: AppTheme.title(AppTheme.charcoal)),
              const Spacer(),
              GestureDetector(
                onTap: () => ref.read(recentRestaurantsProvider.notifier).clear(),
                child: Text('Effacer', style: AppTheme.caption(AppTheme.grey3)),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ...recents.map((slug) => ListTile(
                contentPadding: EdgeInsets.zero,
                leading: Container(
                  width: 38, height: 38,
                  decoration: BoxDecoration(
                    color: AppTheme.cream,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.storefront_outlined,
                      size: 18, color: AppTheme.grey3),
                ),
                title: Text(slug, style: AppTheme.bodyBold(AppTheme.charcoal)),
                trailing: const Icon(Icons.chevron_right_rounded,
                    color: AppTheme.grey4, size: 18),
                onTap: () {
                  ref.read(recentRestaurantsProvider.notifier).addSlug(slug);
                  context.go('/menu/$slug');
                },
              )),
        ],
      ),
    );
  }
}

class _Card extends StatelessWidget {
  final Widget child;
  const _Card({required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(18),
        boxShadow: AppTheme.cardShadow,
      ),
      padding: const EdgeInsets.all(18),
      child: child,
    );
  }
}

class _Field extends StatelessWidget {
  final TextEditingController ctrl;
  final String label;
  final IconData icon;
  final TextInputType? type;
  final String? Function(String?)? validator;
  const _Field({
    required this.ctrl,
    required this.label,
    required this.icon,
    this.type,
    this.validator,
  });

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: ctrl,
      keyboardType: type,
      validator: validator,
      style: AppTheme.body(AppTheme.charcoal),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: AppTheme.caption(AppTheme.grey3),
        prefixIcon: Icon(icon, size: 18, color: AppTheme.grey3),
        filled: true,
        fillColor: AppTheme.cream,
        border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: AppTheme.border)),
        enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: AppTheme.border)),
        focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: AppTheme.charcoal, width: 1.5)),
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      ),
    );
  }
}
