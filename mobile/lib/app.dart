// lib/app.dart
import 'package:flutter/material.dart';
import 'package:flutter/gestures.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import 'core/theme/app_theme.dart';
import 'core/providers/providers.dart';
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

class SaeMenusApp extends ConsumerStatefulWidget {
  const SaeMenusApp({super.key});
  @override
  ConsumerState<SaeMenusApp> createState() => _SaeMenusAppState();
}

class _SaeMenusAppState extends ConsumerState<SaeMenusApp> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _showConsentIfNeeded());
  }

  void _showConsentIfNeeded() {
    final accepted = ref.read(consentProvider);
    if (!accepted) {
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (_) => const _ConsentDialog(),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'SaeMenus',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light(const Color(0xFFC0392B)),
      routerConfig: _router,
    );
  }
}

class _ConsentDialog extends ConsumerWidget {
  const _ConsentDialog();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      title: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: const Color(0xFFC0392B).withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(Icons.privacy_tip_outlined,
                color: Color(0xFFC0392B), size: 20),
          ),
          const SizedBox(width: 12),
          Text('Données personnelles',
              style: AppTheme.title(AppTheme.charcoal)),
        ],
      ),
      content: RichText(
        text: TextSpan(
          style: AppTheme.body(AppTheme.grey2).copyWith(height: 1.6),
          children: [
            const TextSpan(
              text: 'SaeMenus peut stocker votre '
                  'nom, téléphone et email '
                  'localement sur cet appareil pour faciliter vos commandes.\n\n'
                  'Ces informations sont transmises au restaurant uniquement '
                  'lors d\'une commande ou réservation, via une connexion sécurisée (HTTPS).\n\n',
            ),
            TextSpan(
              text: 'Consulter la politique de confidentialité',
              style: AppTheme.body(const Color(0xFFC0392B))
                  .copyWith(decoration: TextDecoration.underline),
              recognizer: TapGestureRecognizer()
                ..onTap = () => launchUrl(
                      Uri.parse('https://saemenus.com/privacy'),
                      mode: LaunchMode.externalApplication,
                    ),
            ),
          ],
        ),
      ),
      actions: [
        SizedBox(
          width: double.infinity,
          child: FilledButton(
            onPressed: () {
              ref.read(consentProvider.notifier).accept();
              Navigator.pop(context);
            },
            style: FilledButton.styleFrom(
              backgroundColor: AppTheme.charcoal,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12)),
              padding: const EdgeInsets.symmetric(vertical: 14),
            ),
            child: Text('J\'accepte', style: AppTheme.bodyBold(Colors.white)),
          ),
        ),
        const SizedBox(height: 4),
      ],
    );
  }
}
