// lib/core/utils/price_formatter.dart

String formatPrice(double amount, String currency) {
  final code = currency.trim().toUpperCase();
  switch (code) {
    case 'EUR':
      return '${_fmt(amount, 2)} €';
    case 'USD':
      return '\$${_fmt(amount, 2)}';
    case 'GBP':
      return '£${_fmt(amount, 2)}';
    case 'XOF':
    case 'XAF':
      return '${_fmt(amount, 0)} FCFA';
    case 'GNF':
      return '${_fmt(amount, 0)} GNF';
    case 'CDF':
      return '${_fmt(amount, 0)} CDF';
    case 'MAD':
      return '${_fmt(amount, 2)} MAD';
    default:
      return '${_fmt(amount, 2)} $code';
  }
}

String _fmt(double amount, int decimals) {
  if (decimals == 0) {
    final n = amount.round();
    // thousands separator
    final s = n.toString();
    final buf = StringBuffer();
    for (int i = 0; i < s.length; i++) {
      if (i > 0 && (s.length - i) % 3 == 0) buf.write(' ');
      buf.write(s[i]);
    }
    return buf.toString();
  }
  final n = amount.toStringAsFixed(decimals);
  final parts = n.split('.');
  final intPart = parts[0];
  final decPart = parts[1];
  final buf = StringBuffer();
  for (int i = 0; i < intPart.length; i++) {
    if (i > 0 && (intPart.length - i) % 3 == 0) buf.write(' ');
    buf.write(intPart[i]);
  }
  buf.write(',');
  buf.write(decPart);
  return buf.toString();
}
