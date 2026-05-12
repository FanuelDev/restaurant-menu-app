// lib/core/utils/price_formatter.dart
import 'package:intl/intl.dart';

String formatPrice(double amount, String currency) {
  try {
    final formatter = NumberFormat.currency(
      locale: _localeForCurrency(currency),
      symbol: _symbolForCurrency(currency),
      decimalDigits: currency == 'XOF' || currency == 'XAF' || currency == 'GNF' || currency == 'CDF' ? 0 : 2,
    );
    return formatter.format(amount);
  } catch (_) {
    return '${amount.toStringAsFixed(0)} $currency';
  }
}

String _localeForCurrency(String currency) {
  switch (currency) {
    case 'EUR': return 'fr_FR';
    case 'USD': return 'en_US';
    default: return 'fr_FR';
  }
}

String _symbolForCurrency(String currency) {
  switch (currency) {
    case 'EUR': return '€';
    case 'USD': return '\$';
    case 'XOF': return 'FCFA';
    case 'XAF': return 'FCFA';
    case 'GNF': return 'GNF';
    case 'CDF': return 'CDF';
    default: return currency;
  }
}
