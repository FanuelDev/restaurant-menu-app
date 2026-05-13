// lib/app.dart
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/theme/app_theme.dart';
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
      pageBuilder: (context, state) => CustomTransitionPage(
        key: state.pageKey,
        child: MenuScreen(slug: state.pathParameters['slug']!),
        transitionsBuilder: (_, anim, __, child) => FadeTransition(
          opacity: anim,
          child: child,
        ),
      ),
    ),
    GoRoute(
      path: '/checkout/:slug',
      pageBuilder: (context, state) => CustomTransitionPage(
        key: state.pageKey,
        child: CheckoutScreen(slug: state.pathParameters['slug']!),
        transitionsBuilder: (_, anim, __, child) => SlideTransition(
          position: Tween<Offset>(
            begin: const Offset(0, 1),
            end: Offset.zero,
          ).animate(CurvedAnimation(parent: anim, curve: AppTheme.spring)),
          child: child,
        ),
      ),
    ),
    GoRoute(
      path: '/reservation/:slug',
      pageBuilder: (context, state) => CustomTransitionPage(
        key: state.pageKey,
        child: ReservationScreen(slug: state.pathParameters['slug']!),
        transitionsBuilder: (_, anim, __, child) => SlideTransition(
          position: Tween<Offset>(
            begin: const Offset(0, 1),
            end: Offset.zero,
          ).animate(CurvedAnimation(parent: anim, curve: AppTheme.spring)),
          child: child,
        ),
      ),
    ),
    GoRoute(
      path: '/profile',
      pageBuilder: (context, state) => CustomTransitionPage(
        key: state.pageKey,
        child: const ProfileScreen(),
        transitionsBuilder: (_, anim, __, child) => SlideTransition(
          position: Tween<Offset>(
            begin: const Offset(1, 0),
            end: Offset.zero,
          ).animate(CurvedAnimation(parent: anim, curve: AppTheme.spring)),
          child: child,
        ),
      ),
    ),
  ],
);

class SaeMenusApp extends ConsumerWidget {
  const SaeMenusApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return MaterialApp.router(
      title: 'SaeMenus',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light(const Color(0xFFC0392B)),
      routerConfig: _router,
    );
  }
}
