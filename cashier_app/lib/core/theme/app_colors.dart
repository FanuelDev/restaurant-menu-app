import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  // Background
  static const Color background = Color(0xFF0D0808);
  static const Color backgroundMid = Color(0xFF150C0C);

  // Surfaces
  static const Color surface = Color(0xFF1A0F0F);
  static const Color surfaceHigh = Color(0xFF251818);

  // Brand red
  static const Color brand = Color(0xFFE8422A);
  static const Color brandDark = Color(0xFFC0392B);
  static const Color brandGlow = Color(0x40E8422A);

  // Status
  static const Color amber = Color(0xFFF59E0B);
  static const Color emerald = Color(0xFF10B981);
  static const Color info = Color(0xFF60A5FA);
  static const Color orange = Color(0xFFF97316);

  // Text
  static const Color textPrimary = Color(0xFFFFF5F5);
  static const Color textSecondary = Color(0xFFA89090);
  static const Color textMuted = Color(0xFF6B5050);

  // Borders
  static const Color border = Color(0xFF2D1515);
  static const Color borderBright = Color(0xFF3D2020);

  // Kept for backward compat (error = brand red in dark)
  static const Color error = Color(0xFFE8422A);
  static const Color errorLight = Color(0x1FE8422A);
  static const Color warning = Color(0xFFF59E0B);
  static const Color warningLight = Color(0x1FF59E0B);
  static const Color success = Color(0xFF10B981);
  static const Color successLight = Color(0x1F10B981);
  static const Color infoLight = Color(0x1F60A5FA);
  static const Color purple = Color(0xFFB47FFF);
  static const Color purpleLight = Color(0x1FB47FFF);

  // Gradients
  static const LinearGradient brandGradient = LinearGradient(
    colors: [Color(0xFFE8422A), Color(0xFFC0392B)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient backgroundGradient = LinearGradient(
    colors: [Color(0xFF0D0808), Color(0xFF150C0C)],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );

  static const LinearGradient surfaceGradient = LinearGradient(
    colors: [Color(0xFF1A0F0F), Color(0xFF251818)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // Order status color
  static Color statusColor(String status) {
    switch (status) {
      case 'pending':
        return amber;
      case 'confirmed':
        return info;
      case 'preparing':
        return orange;
      case 'ready':
        return emerald;
      case 'delivered':
        return textMuted;
      case 'cancelled':
        return brand;
      default:
        return textMuted;
    }
  }

  static Color statusBackgroundColor(String status) {
    switch (status) {
      case 'pending':
        return warningLight;
      case 'confirmed':
        return infoLight;
      case 'preparing':
        return orange.withValues(alpha: 0.12);
      case 'ready':
        return successLight;
      case 'delivered':
        return textMuted.withValues(alpha: 0.12);
      case 'cancelled':
        return errorLight;
      default:
        return textMuted.withValues(alpha: 0.12);
    }
  }

  // Reservation status color
  static Color reservationStatusColor(String status) {
    switch (status) {
      case 'pending':
        return amber;
      case 'confirmed':
        return emerald;
      case 'cancelled':
        return brand;
      case 'no_show':
        return textMuted;
      default:
        return textMuted;
    }
  }

  static Color reservationStatusBackgroundColor(String status) {
    switch (status) {
      case 'pending':
        return warningLight;
      case 'confirmed':
        return successLight;
      case 'cancelled':
        return errorLight;
      case 'no_show':
        return textMuted.withValues(alpha: 0.12);
      default:
        return textMuted.withValues(alpha: 0.12);
    }
  }
}
