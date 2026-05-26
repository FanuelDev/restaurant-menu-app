class ApiEndpoints {
  // Auth
  static const String login = '/auth/login';
  static const String logout = '/auth/logout';

  // Restaurant
  static const String restaurant = '/admin/restaurant';

  // Orders
  static const String orders = '/admin/orders';
  static String orderStatus(int id) => '/admin/orders/$id/status';
  static String orderScan(String token) => '/admin/orders/scan/$token';

  // Reservations
  static const String reservations = '/admin/reservations';
  static String reservationStatus(int id) => '/admin/reservations/$id/status';

  // Finance
  static const String financeSummary = '/admin/finance/summary';
  static const String financeChart = '/admin/finance/chart';
  static const String financeExpenses = '/admin/finance/expenses';
  static String financeExpenseById(int id) => '/admin/finance/expenses/$id';
  static const String financeIncomes = '/admin/finance/incomes';
  static String financeIncomeById(int id) => '/admin/finance/incomes/$id';

  // Marketing
  static const String marketingStats = '/admin/marketing/stats';
  static const String marketingVouchers = '/admin/marketing/vouchers';
  static String marketingVoucherById(int id) => '/admin/marketing/vouchers/$id';
  static String marketingVoucherScan(String token) => '/admin/marketing/vouchers/scan/$token';
  static String marketingVoucherRedeem(int id) => '/admin/marketing/vouchers/$id/redeem';

  // Public (with X-Tenant-Slug)
  static const String categories = '/public/categories';
}
