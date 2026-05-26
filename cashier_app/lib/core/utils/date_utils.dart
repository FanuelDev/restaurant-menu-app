import 'package:intl/intl.dart';

class AppDateUtils {
  AppDateUtils._();

  static final _dateFormat = DateFormat('dd/MM/yyyy');
  static final _dateTimeFormat = DateFormat('dd/MM/yyyy HH:mm');
  static final _timeFormat = DateFormat('HH:mm');
  static final _dayMonthFormat = DateFormat('d MMM', 'fr_FR');
  static final _fullDateFormat = DateFormat('EEEE d MMMM yyyy', 'fr_FR');

  static String formatDate(DateTime date) => _dateFormat.format(date);

  static String formatDateTime(DateTime date) => _dateTimeFormat.format(date);

  static String formatTime(DateTime date) => _timeFormat.format(date);

  static String formatDayMonth(DateTime date) => _dayMonthFormat.format(date);

  static String formatFullDate(DateTime date) => _fullDateFormat.format(date);

  static String formatRelative(DateTime date) {
    final now = DateTime.now();
    final diff = now.difference(date);

    if (diff.inMinutes < 1) {
      return 'À l\'instant';
    } else if (diff.inMinutes < 60) {
      return 'Il y a ${diff.inMinutes} min';
    } else if (diff.inHours < 24) {
      return 'Il y a ${diff.inHours}h';
    } else if (diff.inDays == 1) {
      return 'Hier à ${_timeFormat.format(date)}';
    } else {
      return _dateTimeFormat.format(date);
    }
  }

  static String formatTimeOnly(String timeStr) {
    // timeStr can be "HH:mm:ss" or "HH:mm"
    if (timeStr.length >= 5) {
      return timeStr.substring(0, 5);
    }
    return timeStr;
  }

  static String formatReservationDate(String dateStr) {
    try {
      final date = DateTime.parse(dateStr);
      return _dateFormat.format(date);
    } catch (_) {
      return dateStr;
    }
  }
}
