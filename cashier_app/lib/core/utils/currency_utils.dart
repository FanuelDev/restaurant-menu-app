import 'package:intl/intl.dart';

class CurrencyUtils {
  CurrencyUtils._();

  static String format(num amount, {String? currency}) {
    final cur = currency ?? 'XOF';
    switch (cur) {
      case 'EUR':
        final fmt = NumberFormat.currency(
          locale: 'fr_FR',
          symbol: '€',
          decimalDigits: 2,
        );
        return fmt.format(amount);
      case 'XOF':
      default:
        final fmt = NumberFormat.currency(
          locale: 'fr_FR',
          symbol: 'FCFA',
          decimalDigits: 0,
        );
        return fmt.format(amount);
    }
  }

  static String formatAmount(num amount) {
    return format(amount);
  }
}
