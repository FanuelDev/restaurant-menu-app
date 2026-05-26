import 'package:intl/intl.dart';

class CurrencyUtils {
  CurrencyUtils._();

  static String format(num amount, {String? currency}) {
    final cur = (currency ?? 'XOF').trim().toUpperCase();
    try {
      switch (cur) {
        case 'EUR':
          return NumberFormat.currency(
            locale: 'fr_FR', symbol: '€', decimalDigits: 2,
          ).format(amount);
        case 'USD':
          return NumberFormat.currency(
            locale: 'en_US', symbol: '\$', decimalDigits: 2,
          ).format(amount);
        case 'XOF':
        case 'XAF':
          return NumberFormat.currency(
            locale: 'fr_FR', symbol: 'FCFA', decimalDigits: 0,
          ).format(amount);
        case 'GNF':
          return NumberFormat.currency(
            locale: 'fr_FR', symbol: 'GNF', decimalDigits: 0,
          ).format(amount);
        case 'CDF':
          return NumberFormat.currency(
            locale: 'fr_FR', symbol: 'CDF', decimalDigits: 0,
          ).format(amount);
        default:
          return NumberFormat.currency(
            locale: 'fr_FR', symbol: cur, decimalDigits: 2,
          ).format(amount);
      }
    } catch (_) {
      return '${amount.toStringAsFixed(0)} $cur';
    }
  }

  static String formatAmount(num amount, {String? currency}) {
    return format(amount, currency: currency);
  }
}
