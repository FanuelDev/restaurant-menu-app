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

  // Public (with X-Tenant-Slug)
  static const String categories = '/public/categories';
}
