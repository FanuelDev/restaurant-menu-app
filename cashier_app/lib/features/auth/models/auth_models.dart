class PlanFeatures {
  final bool orders;
  final bool reservations;
  final bool apiAccess;
  final bool financialManagement;
  final bool marketing;

  const PlanFeatures({
    required this.orders,
    required this.reservations,
    required this.apiAccess,
    required this.financialManagement,
    required this.marketing,
  });

  factory PlanFeatures.fromJson(Map<String, dynamic> json) {
    return PlanFeatures(
      orders: json['orders'] == true,
      reservations: json['reservations'] == true,
      apiAccess: json['api_access'] == true,
      financialManagement: json['financial_management'] == true,
      marketing: json['financial_management'] == true || json['api_access'] == true,
    );
  }

  bool get hasReservations => reservations || apiAccess;
  bool get hasFinance => financialManagement || apiAccess;
  bool get hasMarketing => marketing;
}

class RestaurantPlan {
  final String? name;
  final PlanFeatures features;

  const RestaurantPlan({this.name, required this.features});

  factory RestaurantPlan.fromJson(Map<String, dynamic> json) {
    return RestaurantPlan(
      name: json['name']?.toString(),
      features: PlanFeatures.fromJson(
        (json['features'] as Map<String, dynamic>?) ?? {},
      ),
    );
  }
}

class Restaurant {
  final int id;
  final String slug;
  final String name;
  final String subscriptionStatus;
  final RestaurantPlan? plan;
  final String? currency;

  const Restaurant({
    required this.id,
    required this.slug,
    required this.name,
    required this.subscriptionStatus,
    this.plan,
    this.currency,
  });

  factory Restaurant.fromJson(Map<String, dynamic> json) {
    return Restaurant(
      id: json['id'] as int,
      slug: json['slug']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      subscriptionStatus: json['subscriptionStatus']?.toString() ?? 'active',
      plan: json['plan'] != null
          ? RestaurantPlan.fromJson(json['plan'] as Map<String, dynamic>)
          : null,
      currency: json['currency']?.toString(),
    );
  }

  bool get hasOrders => plan?.features.orders ?? false;
  bool get hasReservations => plan?.features.hasReservations ?? false;
  bool get hasFinance => plan?.features.hasFinance ?? false;
  bool get hasMarketing => plan?.features.hasMarketing ?? false;
}

class AuthUser {
  final int id;
  final String email;
  final String fullName;
  final String role;
  final int restaurantId;

  const AuthUser({
    required this.id,
    required this.email,
    required this.fullName,
    required this.role,
    required this.restaurantId,
  });

  factory AuthUser.fromJson(Map<String, dynamic> json) {
    return AuthUser(
      id: json['id'] as int,
      email: json['email']?.toString() ?? '',
      fullName: json['fullName']?.toString() ?? '',
      role: json['role']?.toString() ?? '',
      restaurantId: json['restaurantId'] as int,
    );
  }

  String get firstName {
    final parts = fullName.trim().split(' ');
    return parts.isNotEmpty ? parts.first : fullName;
  }
}

class AuthToken {
  final String value;

  const AuthToken({required this.value});

  factory AuthToken.fromJson(Map<String, dynamic> json) {
    return AuthToken(
      value: json['value']?.toString() ?? '',
    );
  }
}

class AuthState {
  final AuthUser user;
  final AuthToken token;
  final Restaurant restaurant;
  final String slug;

  const AuthState({
    required this.user,
    required this.token,
    required this.restaurant,
    required this.slug,
  });
}
