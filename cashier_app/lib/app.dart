import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'core/theme/app_theme.dart';
import 'features/auth/providers/auth_provider.dart';
import 'features/auth/screens/login_screen.dart';
import 'features/shell/shell_screen.dart';
import 'features/orders/screens/order_detail_screen.dart';
import 'features/orders/screens/create_order_screen.dart';
import 'features/reservations/screens/reservation_detail_screen.dart';
import 'features/reservations/screens/create_reservation_screen.dart';
import 'features/finance/screens/create_expense_screen.dart';
import 'features/finance/screens/create_income_screen.dart';
import 'features/marketing/models/marketing_models.dart';
import 'features/marketing/screens/voucher_redeem_screen.dart';
import 'features/marketing/screens/voucher_order_screen.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>(debugLabel: 'root');

CustomTransitionPage<void> _buildPage({
  required LocalKey key,
  required Widget child,
}) {
  return CustomTransitionPage<void>(
    key: key,
    child: child,
    transitionsBuilder: (context, animation, secondaryAnimation, child) {
      return FadeTransition(
        opacity: CurvedAnimation(parent: animation, curve: Curves.easeOut),
        child: SlideTransition(
          position: Tween<Offset>(
            begin: const Offset(0.05, 0),
            end: Offset.zero,
          ).animate(
              CurvedAnimation(parent: animation, curve: Curves.easeOutCubic)),
          child: child,
        ),
      );
    },
  );
}

final routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: '/dashboard',
    redirect: (context, state) {
      final authState = ref.read(authProvider);

      if (authState is AsyncLoading) return null;

      final isLoggedIn = authState.valueOrNull != null;
      final location = state.matchedLocation;
      final isOnLogin = location == '/login';

      if (!isLoggedIn && !isOnLogin) return '/login';
      if (isLoggedIn && isOnLogin) return '/dashboard';
      return null;
    },
    refreshListenable: _GoRouterRefreshStream(ref),
    routes: [
      GoRoute(
        path: '/login',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => _buildPage(
          key: state.pageKey,
          child: const LoginScreen(),
        ),
      ),
      GoRoute(
        path: '/dashboard',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => _buildPage(
          key: state.pageKey,
          child: const ShellScreen(route: '/dashboard'),
        ),
      ),
      GoRoute(
        path: '/orders',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => _buildPage(
          key: state.pageKey,
          child: const ShellScreen(route: '/orders'),
        ),
      ),
      GoRoute(
        path: '/reservations',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => _buildPage(
          key: state.pageKey,
          child: const ShellScreen(route: '/reservations'),
        ),
      ),
      GoRoute(
        path: '/scanner',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => _buildPage(
          key: state.pageKey,
          child: const ShellScreen(route: '/scanner'),
        ),
      ),
      GoRoute(
        path: '/finance',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => _buildPage(
          key: state.pageKey,
          child: const ShellScreen(route: '/finance'),
        ),
      ),
      GoRoute(
        path: '/orders/create',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => _buildPage(
          key: state.pageKey,
          child: const CreateOrderScreen(),
        ),
      ),
      GoRoute(
        path: '/orders/:id',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) {
          final id = int.tryParse(state.pathParameters['id'] ?? '') ?? 0;
          return _buildPage(
            key: state.pageKey,
            child: OrderDetailScreen(orderId: id),
          );
        },
      ),
      GoRoute(
        path: '/reservations/create',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => _buildPage(
          key: state.pageKey,
          child: const CreateReservationScreen(),
        ),
      ),
      GoRoute(
        path: '/reservations/:id',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) {
          final id = int.tryParse(state.pathParameters['id'] ?? '') ?? 0;
          return _buildPage(
            key: state.pageKey,
            child: ReservationDetailScreen(reservationId: id),
          );
        },
      ),
      GoRoute(
        path: '/finance/expenses/create',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => _buildPage(
          key: state.pageKey,
          child: const CreateExpenseScreen(),
        ),
      ),
      GoRoute(
        path: '/finance/incomes/create',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => _buildPage(
          key: state.pageKey,
          child: const CreateIncomeScreen(),
        ),
      ),
      GoRoute(
        path: '/marketing',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => _buildPage(
          key: state.pageKey,
          child: const ShellScreen(route: '/marketing'),
        ),
      ),
      GoRoute(
        path: '/menu',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => _buildPage(
          key: state.pageKey,
          child: const ShellScreen(route: '/menu'),
        ),
      ),
      GoRoute(
        path: '/marketing/vouchers/redeem/:token',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) {
          final token = state.pathParameters['token'] ?? '';
          return _buildPage(
            key: state.pageKey,
            child: VoucherRedeemScreen(token: token),
          );
        },
      ),
      GoRoute(
        path: '/marketing/vouchers/order',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) {
          final voucher = state.extra as MarketingVoucher;
          return _buildPage(
            key: state.pageKey,
            child: VoucherOrderScreen(voucher: voucher),
          );
        },
      ),
    ],
  );
});

class _GoRouterRefreshStream extends ChangeNotifier {
  _GoRouterRefreshStream(Ref ref) {
    ref.listen(authProvider, (_, __) => notifyListeners());
  }
}

class App extends ConsumerWidget {
  const App({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);

    return MaterialApp.router(
      title: 'SaeMenus Caisse',
      theme: AppTheme.lightTheme,
      themeMode: ThemeMode.light,
      routerConfig: router,
      debugShowCheckedModeBanner: false,
      locale: const Locale('fr', 'FR'),
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      supportedLocales: const [
        Locale('fr', 'FR'),
        Locale('en', 'US'),
      ],
    );
  }
}
