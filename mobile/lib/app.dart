// lib/app.dart
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'features/scanner/scanner_screen.dart';
import 'features/menu/menu_screen.dart';
import 'features/checkout/checkout_screen.dart';
import 'features/reservation/reservation_screen.dart';
import 'features/profile/profile_screen.dart';

final _router = GoRouter(
  initialLocation: '/',
  routes: [
    GoRoute(path: '/', builder: (_, __) => const ScannerScreen()),
    GoRoute(
      path: '/menu/:slug',
      builder: (context, state) =>
          MenuScreen(slug: state.pathParameters['slug']!),
    ),
    GoRoute(
      path: '/checkout/:slug',
      builder: (context, state) =>
          CheckoutScreen(slug: state.pathParameters['slug']!),
    ),
    GoRoute(
      path: '/reservation/:slug',
      builder: (context, state) =>
          ReservationScreen(slug: state.pathParameters['slug']!),
    ),
    GoRoute(path: '/profile', builder: (_, __) => const ProfileScreen()),
  ],
);

class SaeMenusApp extends ConsumerWidget {
  const SaeMenusApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return MaterialApp.router(
      title: 'SaeMenus',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorSchemeSeed: const Color(0xFFC0392B),
        fontFamily: 'Roboto',
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.transparent,
          elevation: 0,
          scrolledUnderElevation: 0,
        ),
      ),
      routerConfig: _router,
    );
  }
}
