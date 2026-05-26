import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gap/gap.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/theme/app_colors.dart';
import '../auth/providers/auth_provider.dart';
import '../auth/models/auth_models.dart';
import '../dashboard/screens/dashboard_screen.dart';
import '../orders/screens/orders_screen.dart';
import '../reservations/screens/reservations_screen.dart';
import '../scanner/screens/scanner_screen.dart';
import '../finance/screens/finance_screen.dart';
import '../marketing/screens/marketing_screen.dart';
import '../menu/screens/menu_screen.dart';
import '../../shared/widgets/confirm_dialog.dart';

class ShellScreen extends ConsumerWidget {
  final String route;

  const ShellScreen({super.key, this.route = '/dashboard'});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider).valueOrNull;
    if (authState == null) return const Scaffold(body: SizedBox.shrink());

    final restaurant = authState.restaurant;
    final navItems = _buildNavItems(restaurant);

    int currentIndex = navItems.indexWhere((item) => item.route == route);
    if (currentIndex < 0) currentIndex = 0;

    final screen = _buildScreen(route, restaurant);
    final isTablet = MediaQuery.of(context).size.width >= 600;

    if (isTablet) {
      return _TabletLayout(
        restaurant: restaurant,
        navItems: navItems,
        currentIndex: currentIndex,
        onDestinationSelected: (index) =>
            _navigateToTab(context, index, restaurant),
        screen: screen,
        onLogout: () => _logout(context, ref),
        userName: authState.user.firstName,
      );
    }

    return _PhoneLayout(
      navItems: navItems,
      currentIndex: currentIndex,
      onDestinationSelected: (index) =>
          _navigateToTab(context, index, restaurant),
      screen: screen,
    );
  }

  List<_NavItem> _buildNavItems(Restaurant restaurant) {
    final items = <_NavItem>[
      const _NavItem(
        icon: Icons.dashboard_outlined,
        activeIcon: Icons.dashboard_rounded,
        label: 'Accueil',
        route: '/dashboard',
      ),
    ];

    if (restaurant.hasOrders) {
      items.add(const _NavItem(
        icon: Icons.receipt_long_outlined,
        activeIcon: Icons.receipt_long_rounded,
        label: 'Commandes',
        route: '/orders',
      ));
    }

    if (restaurant.hasReservations) {
      items.add(const _NavItem(
        icon: Icons.calendar_today_outlined,
        activeIcon: Icons.calendar_today_rounded,
        label: 'Réservations',
        route: '/reservations',
      ));
    }

    if (restaurant.hasFinance) {
      items.add(const _NavItem(
        icon: Icons.account_balance_wallet_outlined,
        activeIcon: Icons.account_balance_wallet_rounded,
        label: 'Finance',
        route: '/finance',
      ));
    }

    if (restaurant.hasMarketing) {
      items.add(const _NavItem(
        icon: Icons.local_activity_outlined,
        activeIcon: Icons.local_activity_rounded,
        label: 'Marketing',
        route: '/marketing',
      ));
    }

    items.add(const _NavItem(
      icon: Icons.menu_book_outlined,
      activeIcon: Icons.menu_book_rounded,
      label: 'Menu',
      route: '/menu',
    ));

    items.add(const _NavItem(
      icon: Icons.qr_code_scanner_outlined,
      activeIcon: Icons.qr_code_scanner_rounded,
      label: 'Scanner',
      route: '/scanner',
    ));

    return items;
  }

  Widget _buildScreen(String route, Restaurant restaurant) {
    switch (route) {
      case '/orders':
        return const OrdersScreen();
      case '/reservations':
        return const ReservationsScreen();
      case '/finance':
        return const FinanceScreen();
      case '/marketing':
        return const MarketingScreen();
      case '/menu':
        return const MenuScreen();
      case '/scanner':
        return const ScannerScreen();
      case '/dashboard':
      default:
        return const DashboardScreen();
    }
  }

  void _navigateToTab(
      BuildContext context, int index, Restaurant restaurant) {
    final items = _buildNavItems(restaurant);
    if (index >= 0 && index < items.length) {
      context.go(items[index].route);
    }
  }

  Future<void> _logout(BuildContext context, WidgetRef ref) async {
    final confirmed = await ConfirmDialog.show(
      context,
      title: 'Se déconnecter',
      message: 'Voulez-vous vraiment vous déconnecter ?',
      confirmLabel: 'Se déconnecter',
      isDangerous: true,
    );

    if (confirmed == true && context.mounted) {
      await ref.read(authProvider.notifier).logout();
    }
  }
}

class _NavItem {
  final IconData icon;
  final IconData activeIcon;
  final String label;
  final String route;

  const _NavItem({
    required this.icon,
    required this.activeIcon,
    required this.label,
    required this.route,
  });
}

// ─── Phone layout ─────────────────────────────────────────────────────────────

class _PhoneLayout extends StatelessWidget {
  final List<_NavItem> navItems;
  final int currentIndex;
  final void Function(int) onDestinationSelected;
  final Widget screen;

  const _PhoneLayout({
    required this.navItems,
    required this.currentIndex,
    required this.onDestinationSelected,
    required this.screen,
  });

  @override
  Widget build(BuildContext context) {
    final bottomPadding = MediaQuery.of(context).padding.bottom;
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Stack(
        children: [
          Positioned.fill(
            bottom: 80 + bottomPadding,
            child: screen,
          ),
          // Floating dark nav bar
          Positioned(
            bottom: 16 + bottomPadding,
            left: 20,
            right: 20,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(28),
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
                child: Container(
                  height: 68,
                  decoration: BoxDecoration(
                    gradient: AppColors.navGradient,
                    borderRadius: BorderRadius.circular(28),
                    border: Border.all(
                        color: AppColors.brand.withValues(alpha: 0.2)),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.navBackground.withValues(alpha: 0.5),
                        blurRadius: 32,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: List.generate(navItems.length, (index) {
                      final isActive = index == currentIndex;
                      final item = navItems[index];
                      return GestureDetector(
                        onTap: () => onDestinationSelected(index),
                        behavior: HitTestBehavior.opaque,
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 250),
                          curve: Curves.easeOutCubic,
                          padding: const EdgeInsets.symmetric(
                              horizontal: 12, vertical: 8),
                          decoration: BoxDecoration(
                            color: isActive
                                ? AppColors.brand.withValues(alpha: 0.22)
                                : Colors.transparent,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                isActive ? item.activeIcon : item.icon,
                                color: isActive
                                    ? AppColors.brand
                                    : AppColors.textOnDarkMuted,
                                size: 22,
                              ),
                              const Gap(2),
                              Text(
                                item.label,
                                style: GoogleFonts.poppins(
                                  fontSize: 9,
                                  fontWeight: isActive
                                      ? FontWeight.w700
                                      : FontWeight.w400,
                                  color: isActive
                                      ? AppColors.brand
                                      : AppColors.textOnDarkMuted,
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    }),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Tablet layout ────────────────────────────────────────────────────────────

class _TabletLayout extends StatelessWidget {
  final Restaurant restaurant;
  final List<_NavItem> navItems;
  final int currentIndex;
  final void Function(int) onDestinationSelected;
  final Widget screen;
  final VoidCallback onLogout;
  final String userName;

  const _TabletLayout({
    required this.restaurant,
    required this.navItems,
    required this.currentIndex,
    required this.onDestinationSelected,
    required this.screen,
    required this.onLogout,
    required this.userName,
  });

  @override
  Widget build(BuildContext context) {
    final extended = MediaQuery.of(context).size.width >= 900;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: Row(
        children: [
          // Dark navigation rail
          Container(
            width: extended ? 220 : 72,
            decoration: const BoxDecoration(
              gradient: AppColors.navGradient,
              border: Border(
                right: BorderSide(
                    color: Color(0xFF3D1010), width: 1),
              ),
            ),
            child: SafeArea(
              child: Column(
                children: [
                  const Gap(20),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: extended
                        ? Row(
                            children: [
                              Container(
                                width: 40,
                                height: 40,
                                decoration: BoxDecoration(
                                  gradient: AppColors.brandGradient,
                                  borderRadius: BorderRadius.circular(12),
                                  boxShadow: [
                                    BoxShadow(
                                      color: AppColors.brand
                                          .withValues(alpha: 0.4),
                                      blurRadius: 12,
                                    ),
                                  ],
                                ),
                                child: const Icon(
                                  Icons.restaurant_menu,
                                  color: AppColors.textOnDark,
                                  size: 22,
                                ),
                              ),
                              const Gap(12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      restaurant.name,
                                      style: GoogleFonts.poppins(
                                        fontSize: 13,
                                        fontWeight: FontWeight.w700,
                                        color: AppColors.textOnDark,
                                      ),
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                    Text(
                                      userName,
                                      style: GoogleFonts.poppins(
                                        fontSize: 11,
                                        color: AppColors.textOnDarkMuted,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          )
                        : Center(
                            child: Container(
                              width: 40,
                              height: 40,
                              decoration: BoxDecoration(
                                gradient: AppColors.brandGradient,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Icon(
                                Icons.restaurant_menu,
                                color: AppColors.textOnDark,
                                size: 22,
                              ),
                            ),
                          ),
                  ),
                  const Gap(24),
                  Divider(
                      color: AppColors.brand.withValues(alpha: 0.2),
                      height: 1),
                  const Gap(12),
                  ...List.generate(navItems.length, (index) {
                    final isActive = index == currentIndex;
                    final item = navItems[index];
                    return Padding(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 3),
                      child: Material(
                        color: Colors.transparent,
                        borderRadius: BorderRadius.circular(14),
                        child: InkWell(
                          onTap: () => onDestinationSelected(index),
                          borderRadius: BorderRadius.circular(14),
                          splashColor:
                              AppColors.brand.withValues(alpha: 0.15),
                          highlightColor:
                              AppColors.brand.withValues(alpha: 0.08),
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 200),
                            padding: EdgeInsets.symmetric(
                              horizontal: extended ? 14 : 10,
                              vertical: 12,
                            ),
                            decoration: BoxDecoration(
                              color: isActive
                                  ? AppColors.brand.withValues(alpha: 0.2)
                                  : Colors.transparent,
                              borderRadius: BorderRadius.circular(14),
                              border: isActive
                                  ? Border.all(
                                      color: AppColors.brand
                                          .withValues(alpha: 0.4))
                                  : null,
                            ),
                            child: Row(
                              mainAxisAlignment: extended
                                  ? MainAxisAlignment.start
                                  : MainAxisAlignment.center,
                              children: [
                                Icon(
                                  isActive ? item.activeIcon : item.icon,
                                  color: isActive
                                      ? AppColors.brand
                                      : AppColors.textOnDarkMuted,
                                  size: 22,
                                ),
                                if (extended) ...[
                                  const Gap(14),
                                  Text(
                                    item.label,
                                    style: GoogleFonts.poppins(
                                      fontSize: 14,
                                      fontWeight: isActive
                                          ? FontWeight.w600
                                          : FontWeight.w400,
                                      color: isActive
                                          ? AppColors.brand
                                          : AppColors.textOnDarkMuted,
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ),
                        ),
                      ),
                    );
                  }),

                  const Spacer(),
                  Divider(
                      color: AppColors.brand.withValues(alpha: 0.2),
                      height: 1),
                  const Gap(8),
                  Padding(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 10, vertical: 8),
                    child: Material(
                      color: Colors.transparent,
                      borderRadius: BorderRadius.circular(14),
                      child: InkWell(
                        onTap: onLogout,
                        borderRadius: BorderRadius.circular(14),
                        child: Container(
                          padding: EdgeInsets.symmetric(
                            horizontal: extended ? 14 : 10,
                            vertical: 12,
                          ),
                          decoration: BoxDecoration(
                            border: Border.all(
                                color:
                                    AppColors.brand.withValues(alpha: 0.35)),
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: Row(
                            mainAxisAlignment: extended
                                ? MainAxisAlignment.start
                                : MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.logout_rounded,
                                  color: AppColors.brand, size: 20),
                              if (extended) ...[
                                const Gap(12),
                                Text(
                                  'Déconnexion',
                                  style: GoogleFonts.poppins(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w600,
                                    color: AppColors.brand,
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                  const Gap(8),
                ],
              ),
            ),
          ),
          Expanded(child: screen),
        ],
      ),
    );
  }
}
