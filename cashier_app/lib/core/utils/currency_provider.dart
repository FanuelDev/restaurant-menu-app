import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../features/auth/providers/auth_provider.dart';

/// Devise active du restaurant connecté.
/// Retourne 'XOF' par défaut si non connecté.
final currencyProvider = Provider<String>((ref) {
  final auth = ref.watch(authProvider).valueOrNull;
  return auth?.restaurant.currency ?? 'XOF';
});
