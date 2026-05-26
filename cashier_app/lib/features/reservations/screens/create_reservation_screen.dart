import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gap/gap.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/api/api_client.dart';
import '../providers/reservations_provider.dart';

class CreateReservationScreen extends ConsumerStatefulWidget {
  const CreateReservationScreen({super.key});

  @override
  ConsumerState<CreateReservationScreen> createState() =>
      _CreateReservationScreenState();
}

class _CreateReservationScreenState
    extends ConsumerState<CreateReservationScreen> {
  final _formKey = GlobalKey<FormState>();
  final _customerNameController = TextEditingController();
  final _customerPhoneController = TextEditingController();
  final _customerEmailController = TextEditingController();
  final _specialRequestsController = TextEditingController();
  final _notesController = TextEditingController();

  DateTime? _selectedDate;
  TimeOfDay? _selectedTime;
  int _guestsCount = 2;
  String _status = 'pending';
  bool _isSubmitting = false;

  @override
  void dispose() {
    _customerNameController.dispose();
    _customerPhoneController.dispose();
    _customerEmailController.dispose();
    _specialRequestsController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  String get _formattedDate {
    if (_selectedDate == null) return '';
    return DateFormat('yyyy-MM-dd').format(_selectedDate!);
  }

  String get _formattedTime {
    if (_selectedTime == null) return '';
    final h = _selectedTime!.hour.toString().padLeft(2, '0');
    final m = _selectedTime!.minute.toString().padLeft(2, '0');
    return '$h:$m:00';
  }

  String get _displayDate {
    if (_selectedDate == null) return 'Choisir une date';
    return DateFormat('dd/MM/yyyy').format(_selectedDate!);
  }

  String get _displayTime {
    if (_selectedTime == null) return 'Choisir une heure';
    return _selectedTime!.format(context);
  }

  Future<void> _pickDate() async {
    final date = await showDatePicker(
      context: context,
      initialDate: _selectedDate ?? DateTime.now(),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
      locale: const Locale('fr', 'FR'),
      builder: (context, child) => Theme(
        data: Theme.of(context).copyWith(
          colorScheme: const ColorScheme.dark(
            primary: AppColors.info,
            surface: AppColors.surface,
            onSurface: AppColors.textPrimary,
          ),
          dialogTheme: const DialogThemeData(
              backgroundColor: AppColors.surface),
        ),
        child: child!,
      ),
    );
    if (date != null) setState(() => _selectedDate = date);
  }

  Future<void> _pickTime() async {
    final time = await showTimePicker(
      context: context,
      initialTime:
          _selectedTime ?? const TimeOfDay(hour: 12, minute: 0),
      builder: (context, child) => Theme(
        data: Theme.of(context).copyWith(
          colorScheme: const ColorScheme.dark(
            primary: AppColors.info,
            surface: AppColors.surface,
            onSurface: AppColors.textPrimary,
          ),
          dialogTheme: const DialogThemeData(
              backgroundColor: AppColors.surface),
        ),
        child: child!,
      ),
    );
    if (time != null) setState(() => _selectedTime = time);
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
            content: Text('Veuillez choisir une date',
                style: GoogleFonts.poppins()),
            backgroundColor: AppColors.amber),
      );
      return;
    }
    if (_selectedTime == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
            content: Text('Veuillez choisir une heure',
                style: GoogleFonts.poppins()),
            backgroundColor: AppColors.amber),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    final notifier = ref.read(createReservationNotifierProvider.notifier);
    final reservation = await notifier.createReservation(
      customerName: _customerNameController.text.trim(),
      customerPhone: _customerPhoneController.text.trim(),
      customerEmail: _customerEmailController.text.trim(),
      reservedDate: _formattedDate,
      reservedTime: _formattedTime,
      guestsCount: _guestsCount,
      specialRequests: _specialRequestsController.text.trim(),
      notes: _notesController.text.trim(),
      status: _status,
    );

    if (!mounted) return;

    final state = ref.read(createReservationNotifierProvider);
    if (state is AsyncError) {
      setState(() => _isSubmitting = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(extractErrorMessage(state.error),
              style: GoogleFonts.poppins()),
          backgroundColor: AppColors.brand,
        ),
      );
    } else if (reservation != null) {
      ref.invalidate(reservationsProvider);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Réservation créée avec succès',
              style: GoogleFonts.poppins()),
        ),
      );
      context.pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    final topPadding = MediaQuery.of(context).padding.top;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: Column(
        children: [
          // Header
          Container(
            color: AppColors.background,
            padding: EdgeInsets.fromLTRB(16, topPadding + 12, 16, 16),
            child: Row(
              children: [
                IconButton(
                  icon: const Icon(Icons.close_rounded,
                      color: AppColors.textSecondary),
                  onPressed: () => context.pop(),
                ),
                Expanded(
                  child: Text(
                    'Nouvelle réservation',
                    style: GoogleFonts.poppins(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
                const SizedBox(width: 48),
              ],
            ),
          ),

          const Divider(color: AppColors.border, height: 1),

          Expanded(
            child: Form(
              key: _formKey,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // Client info section
                  _FormSection(
                    title: 'Informations client',
                    icon: Icons.person_outline_rounded,
                    children: [
                      TextFormField(
                        controller: _customerNameController,
                        style: const TextStyle(color: AppColors.textPrimary),
                        decoration: const InputDecoration(
                          labelText: 'Nom du client *',
                          prefixIcon: Icon(Icons.person_outline_rounded),
                        ),
                        textCapitalization: TextCapitalization.words,
                        validator: (v) => v == null || v.trim().isEmpty
                            ? 'Obligatoire'
                            : null,
                      ),
                      const Gap(14),
                      TextFormField(
                        controller: _customerPhoneController,
                        style:
                            const TextStyle(color: AppColors.textPrimary),
                        decoration: const InputDecoration(
                          labelText: 'Téléphone',
                          prefixIcon: Icon(Icons.phone_outlined),
                        ),
                        keyboardType: TextInputType.phone,
                      ),
                      const Gap(14),
                      TextFormField(
                        controller: _customerEmailController,
                        style:
                            const TextStyle(color: AppColors.textPrimary),
                        decoration: const InputDecoration(
                          labelText: 'Email',
                          prefixIcon: Icon(Icons.email_outlined),
                        ),
                        keyboardType: TextInputType.emailAddress,
                      ),
                    ],
                  ).animate().fadeIn(duration: 300.ms),

                  const Gap(16),

                  // Reservation details section
                  _FormSection(
                    title: 'Détails de la réservation',
                    icon: Icons.calendar_today_rounded,
                    children: [
                      // Date picker
                      GestureDetector(
                        onTap: _pickDate,
                        child: Container(
                          height: 56,
                          decoration: BoxDecoration(
                            color: AppColors.surfaceHigh,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: AppColors.border),
                          ),
                          padding: const EdgeInsets.symmetric(
                              horizontal: 16),
                          child: Row(
                            children: [
                              const Icon(Icons.calendar_today_rounded,
                                  color: AppColors.info, size: 20),
                              const Gap(12),
                              Expanded(
                                child: Text(
                                  _displayDate,
                                  style: GoogleFonts.poppins(
                                    fontSize: 14,
                                    color: _selectedDate == null
                                        ? AppColors.textMuted
                                        : AppColors.textPrimary,
                                  ),
                                ),
                              ),
                              const Icon(Icons.arrow_drop_down_rounded,
                                  color: AppColors.textMuted),
                            ],
                          ),
                        ),
                      ),
                      const Gap(14),
                      // Time picker
                      GestureDetector(
                        onTap: _pickTime,
                        child: Container(
                          height: 56,
                          decoration: BoxDecoration(
                            color: AppColors.surfaceHigh,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: AppColors.border),
                          ),
                          padding: const EdgeInsets.symmetric(
                              horizontal: 16),
                          child: Row(
                            children: [
                              const Icon(Icons.access_time_rounded,
                                  color: AppColors.info, size: 20),
                              const Gap(12),
                              Expanded(
                                child: Text(
                                  _displayTime,
                                  style: GoogleFonts.poppins(
                                    fontSize: 14,
                                    color: _selectedTime == null
                                        ? AppColors.textMuted
                                        : AppColors.textPrimary,
                                  ),
                                ),
                              ),
                              const Icon(Icons.arrow_drop_down_rounded,
                                  color: AppColors.textMuted),
                            ],
                          ),
                        ),
                      ),
                      const Gap(14),
                      // Guests count
                      Container(
                        height: 56,
                        decoration: BoxDecoration(
                          color: AppColors.surfaceHigh,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppColors.border),
                        ),
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: Row(
                          children: [
                            const Icon(Icons.people_outline_rounded,
                                color: AppColors.info, size: 20),
                            const Gap(12),
                            Expanded(
                              child: Text(
                                'Nombre de couverts',
                                style: GoogleFonts.poppins(
                                  fontSize: 14,
                                  color: AppColors.textPrimary,
                                ),
                              ),
                            ),
                            Row(
                              children: [
                                GestureDetector(
                                  onTap: _guestsCount > 1
                                      ? () => setState(() => _guestsCount--)
                                      : null,
                                  child: Container(
                                    width: 28,
                                    height: 28,
                                    decoration: BoxDecoration(
                                      color: _guestsCount > 1
                                          ? AppColors.surfaceHigh
                                          : AppColors.border,
                                      shape: BoxShape.circle,
                                      border: Border.all(
                                          color: AppColors.borderBright),
                                    ),
                                    child: const Icon(
                                        Icons.remove_rounded,
                                        color: AppColors.textSecondary,
                                        size: 16),
                                  ),
                                ),
                                SizedBox(
                                  width: 40,
                                  child: Text(
                                    '$_guestsCount',
                                    textAlign: TextAlign.center,
                                    style: GoogleFonts.poppins(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w700,
                                      color: AppColors.textPrimary,
                                    ),
                                  ),
                                ),
                                GestureDetector(
                                  onTap: _guestsCount < 99
                                      ? () => setState(() => _guestsCount++)
                                      : null,
                                  child: Container(
                                    width: 28,
                                    height: 28,
                                    decoration: const BoxDecoration(
                                      color: AppColors.info,
                                      shape: BoxShape.circle,
                                    ),
                                    child: const Icon(Icons.add_rounded,
                                        color: AppColors.textPrimary,
                                        size: 16),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      const Gap(14),
                      TextFormField(
                        controller: _specialRequestsController,
                        style:
                            const TextStyle(color: AppColors.textPrimary),
                        decoration: const InputDecoration(
                          labelText: 'Demandes spéciales',
                          prefixIcon:
                              Icon(Icons.star_outline_rounded),
                        ),
                        maxLines: 2,
                      ),
                      const Gap(14),
                      TextFormField(
                        controller: _notesController,
                        style:
                            const TextStyle(color: AppColors.textPrimary),
                        decoration: const InputDecoration(
                          labelText: 'Notes internes',
                          prefixIcon: Icon(Icons.notes_rounded),
                        ),
                        maxLines: 2,
                      ),
                      const Gap(14),
                      DropdownButtonFormField<String>(
                        initialValue: _status,
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
                                style: GoogleFonts.poppins(
                                    color: AppColors.textPrimary)),
                          ),
                          DropdownMenuItem(
                            value: 'confirmed',
                            child: Text('Confirmée',
                                style: GoogleFonts.poppins(
                                    color: AppColors.textPrimary)),
                          ),
                        ],
                        onChanged: (v) => setState(() => _status = v!),
                      ),
                    ],
                  ).animate().fadeIn(duration: 300.ms, delay: 100.ms),

                  const Gap(24),

                  GestureDetector(
                    onTap: _isSubmitting ? null : _submit,
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      height: 54,
                      decoration: BoxDecoration(
                        color: AppColors.info,
                        borderRadius: BorderRadius.circular(14),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.info.withValues(alpha: 0.4),
                            blurRadius: 20,
                            offset: const Offset(0, 6),
                          ),
                        ],
                      ),
                      child: Center(
                        child: _isSubmitting
                            ? const SizedBox(
                                height: 20,
                                width: 20,
                                child: CircularProgressIndicator(
                                    color: AppColors.textPrimary,
                                    strokeWidth: 2),
                              )
                            : Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.center,
                                children: [
                                  const Icon(Icons.check_rounded,
                                      color: AppColors.textPrimary,
                                      size: 20),
                                  const Gap(8),
                                  Text(
                                    'Créer la réservation',
                                    style: GoogleFonts.poppins(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w600,
                                      color: AppColors.textPrimary,
                                    ),
                                  ),
                                ],
                              ),
                      ),
                    ),
                  ).animate().fadeIn(duration: 300.ms, delay: 200.ms),

                  const Gap(40),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _FormSection extends StatelessWidget {
  final String title;
  final IconData icon;
  final List<Widget> children;

  const _FormSection({
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
              Icon(icon, size: 16, color: AppColors.info),
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
          const Gap(16),
          ...children,
        ],
      ),
    );
  }
}
