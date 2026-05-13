// lib/core/theme/app_theme.dart
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  AppTheme._();

  // ── Couleurs neutres ───────────────────────────────────────────────────────
  static const cream     = Color(0xFFFAF9F6);
  static const surface   = Color(0xFFFFFFFF);
  static const charcoal  = Color(0xFF1A1A1A);
  static const grey1     = Color(0xFF3D3D3D);
  static const grey2     = Color(0xFF6B6B6B);
  static const grey3     = Color(0xFFA3A3A3);
  static const grey4     = Color(0xFFD4D4CF);
  static const border    = Color(0xFFEEEDE8);
  static const scanBg    = Color(0xFF090909);

  // ── Badge couleurs ─────────────────────────────────────────────────────────
  static const badgeNew      = Color(0xFF3B82F6);
  static const badgePopular  = Color(0xFFF59E0B);
  static const badgeVeg      = Color(0xFF22C55E);
  static const badgeSpicy    = Color(0xFFEF4444);

  // ── Ombres ────────────────────────────────────────────────────────────────
  static List<BoxShadow> cardShadow = [
    BoxShadow(color: const Color(0xFF1A1A1A).withValues(alpha: 0.06),
        blurRadius: 16, offset: const Offset(0, 4)),
    BoxShadow(color: const Color(0xFF1A1A1A).withValues(alpha: 0.03),
        blurRadius: 4, offset: const Offset(0, 1)),
  ];

  static List<BoxShadow> fabShadow(Color color) => [
    BoxShadow(color: color.withValues(alpha: 0.35),
        blurRadius: 20, offset: const Offset(0, 8)),
    BoxShadow(color: color.withValues(alpha: 0.15),
        blurRadius: 6, offset: const Offset(0, 2)),
  ];

  // ── Typographie ───────────────────────────────────────────────────────────
  static TextStyle display(Color color) =>
      GoogleFonts.inter(fontSize: 28, fontWeight: FontWeight.w800,
          color: color, letterSpacing: -0.8, height: 1.1);

  static TextStyle heading(Color color) =>
      GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.w700,
          color: color, letterSpacing: -0.4);

  static TextStyle title(Color color) =>
      GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w700,
          color: color, letterSpacing: -0.2);

  static TextStyle body(Color color) =>
      GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w400, color: color);

  static TextStyle bodyBold(Color color) =>
      GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: color);

  static TextStyle caption(Color color) =>
      GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w500, color: color);

  static TextStyle label(Color color) =>
      GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700,
          color: color, letterSpacing: 0.6);

  // ── MaterialApp theme ─────────────────────────────────────────────────────
  static ThemeData light(Color brandColor) => ThemeData(
    useMaterial3: true,
    colorSchemeSeed: brandColor,
    scaffoldBackgroundColor: cream,
    textTheme: GoogleFonts.interTextTheme(),
    appBarTheme: const AppBarTheme(
      backgroundColor: Colors.transparent,
      elevation: 0,
      scrolledUnderElevation: 0,
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: brandColor,
        foregroundColor: Colors.white,
        textStyle: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w700),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        padding: const EdgeInsets.symmetric(vertical: 16),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: cream,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide.none,
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: border),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: brandColor, width: 1.5),
      ),
    ),
  );

  // ── Courbes d'animation ───────────────────────────────────────────────────
  static const spring = Curves.easeOutCubic;
  static const smooth = Curves.easeInOutCubic;
  static const quick  = Duration(milliseconds: 200);
  static const normal = Duration(milliseconds: 350);
  static const slow   = Duration(milliseconds: 500);
}
