import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  // Backgrounds — warm cream (light restaurant atmosphere)
  static const Color background    = Color(0xFFFAF6F3);
  static const Color backgroundMid = Color(0xFFF5EDE7);

  // Surfaces (light)
  static const Color surface     = Color(0xFFFFFFFF);
  static const Color surfaceHigh = Color(0xFFFFF3EE);

  // Navigation — dark mahogany for drama
  static const Color navBackground = Color(0xFF1C0808);
  static const Color navSurface    = Color(0xFF2A1010);

  // Brand red (unchanged)
  static const Color brand     = Color(0xFFE8422A);
  static const Color brandDark = Color(0xFFC0392B);
  static const Color brandGlow = Color(0x40E8422A);

  // Status
  static const Color amber   = Color(0xFFF59E0B);
  static const Color emerald = Color(0xFF10B981);
  static const Color info    = Color(0xFF3B82F6);
  static const Color orange  = Color(0xFFF97316);

  // Text on light content surfaces
  static const Color textPrimary   = Color(0xFF1C0808);
  static const Color textSecondary = Color(0xFF7B4030);
  static const Color textMuted     = Color(0xFFA8786A);

  // Text on dark navigation surfaces
  static const Color textOnDark      = Color(0xFFFFF5F5);
  static const Color textOnDarkMuted = Color(0xFF9B7070);

  // Borders
  static const Color border       = Color(0xFFEDD5CA);
  static const Color borderBright = Color(0xFFDDB5A5);

  // Semantic (backward compat)
  static const Color error        = Color(0xFFE8422A);
  static const Color errorLight   = Color(0x1FE8422A);
  static const Color warning      = Color(0xFFF59E0B);
  static const Color warningLight = Color(0x1FF59E0B);
  static const Color success      = Color(0xFF10B981);
  static const Color successLight = Color(0x1F10B981);
  static const Color infoLight    = Color(0x1F3B82F6);
  static const Color purple       = Color(0xFF7C3AED);
  static const Color purpleLight  = Color(0x1F7C3AED);

  // Gradients
  static const LinearGradient brandGradient = LinearGradient(
    colors: [Color(0xFFE8422A), Color(0xFFC0392B)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient navGradient = LinearGradient(
    colors: [Color(0xFF1C0808), Color(0xFF2A1010)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient warmGradient = LinearGradient(
    colors: [Color(0xFFFAF6F3), Color(0xFFF5EDE7)],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );

  // Kept for backward compat
  static const LinearGradient backgroundGradient = warmGradient;
  static const LinearGradient surfaceGradient = LinearGradient(
    colors: [Color(0xFFFFFFFF), Color(0xFFFFF3EE)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static Color statusColor(String status) {
    switch (status) {
      case 'pending':   return amber;
      case 'confirmed': return info;
      case 'preparing': return orange;
      case 'ready':     return emerald;
      case 'delivered': return textMuted;
      case 'cancelled': return brand;
      default:          return textMuted;
    }
  }

  static Color statusBackgroundColor(String status) {
    switch (status) {
      case 'pending':   return warningLight;
      case 'confirmed': return infoLight;
      case 'preparing': return orange.withValues(alpha: 0.12);
      case 'ready':     return successLight;
      case 'delivered': return textMuted.withValues(alpha: 0.12);
      case 'cancelled': return errorLight;
      default:          return textMuted.withValues(alpha: 0.12);
    }
  }

  static Color reservationStatusColor(String status) {
    switch (status) {
      case 'pending':   return amber;
      case 'confirmed': return emerald;
      case 'cancelled': return brand;
      case 'no_show':   return textMuted;
      default:          return textMuted;
    }
  }

  static Color reservationStatusBackgroundColor(String status) {
    switch (status) {
      case 'pending':   return warningLight;
      case 'confirmed': return successLight;
      case 'cancelled': return errorLight;
      case 'no_show':   return textMuted.withValues(alpha: 0.12);
      default:          return textMuted.withValues(alpha: 0.12);
    }
  }
}
