// lib/core/models/models.dart
// Barrel export + toutes les donn�es models

import 'package:flutter/material.dart';

// ─── Helpers JSON ─────────────────────────────────────────────────────────────

double _toDouble(dynamic v) {
  if (v == null) return 0;
  if (v is num) return v.toDouble();
  if (v is String) return double.tryParse(v) ?? 0;
  return 0;
}

int _toInt(dynamic v, {int fallback = 0}) {
  if (v == null) return fallback;
  if (v is int) return v;
  if (v is num) return v.toInt();
  if (v is String) return int.tryParse(v) ?? fallback;
  return fallback;
}

// ─── Restaurant ───────────────────────────────────────────────────────────────

class DaySchedule {
  final String open;
  final String close;
  final bool closed;
  const DaySchedule({required this.open, required this.close, this.closed = false});
  factory DaySchedule.fromJson(Map<String, dynamic> j) => DaySchedule(
        open: j['open'] ?? '',
        close: j['close'] ?? '',
        closed: j['closed'] ?? false,
      );
}

class Restaurant {
  final int id;
  final String slug;
  final String name;
  final String? slogan;
  final String brandColor;
  final int templateId;
  final String? logoUrl;
  final String? coverImageUrl;
  final String? address;
  final String? phone;
  final String? email;
  final String currency;
  final Map<String, DaySchedule>? openingHours;

  const Restaurant({
    required this.id,
    required this.slug,
    required this.name,
    this.slogan,
    required this.brandColor,
    this.templateId = 1,
    this.logoUrl,
    this.coverImageUrl,
    this.address,
    this.phone,
    this.email,
    this.currency = 'XOF',
    this.openingHours,
  });

  factory Restaurant.fromJson(Map<String, dynamic> j) {
    final hours = j['openingHours'] as Map<String, dynamic>?;
    return Restaurant(
      id: _toInt(j['id'], fallback: 0),
      slug: j['slug']?.toString() ?? '',
      name: j['name']?.toString() ?? '',
      slogan: j['slogan']?.toString(),
      brandColor: j['brandColor']?.toString() ?? '#C0392B',
      templateId: _toInt(j['templateId'], fallback: 1),
      logoUrl: j['logoUrl']?.toString(),
      coverImageUrl: j['coverImageUrl']?.toString(),
      address: j['address']?.toString(),
      phone: j['phone']?.toString(),
      email: j['email']?.toString(),
      currency: j['currency']?.toString() ?? 'XOF',
      openingHours: hours?.map((k, v) => MapEntry(k, DaySchedule.fromJson(v as Map<String, dynamic>))),
    );
  }

  Color get brandColorValue {
    try {
      final hex = brandColor.replaceAll('#', '');
      return Color(int.parse('FF$hex', radix: 16));
    } catch (_) {
      return const Color(0xFFC0392B);
    }
  }
}

// ─── Features (subscription) ─────────────────────────────────────────────────

class RestaurantFeatures {
  final bool ordersAndReservations;
  const RestaurantFeatures({this.ordersAndReservations = false});
  factory RestaurantFeatures.fromJson(Map<String, dynamic> j) =>
      RestaurantFeatures(ordersAndReservations: j['ordersAndReservations'] ?? false);
}

// ─── Menu ─────────────────────────────────────────────────────────────────────

class Category {
  final int id;
  final String name;
  final String? description;
  final int sortOrder;
  final List<MenuItem> menuItems;

  const Category({
    required this.id,
    required this.name,
    this.description,
    required this.sortOrder,
    this.menuItems = const [],
  });

  factory Category.fromJson(Map<String, dynamic> j) => Category(
        id: _toInt(j['id']),
        name: j['name']?.toString() ?? '',
        description: j['description']?.toString(),
        sortOrder: _toInt(j['sortOrder']),
        menuItems: (j['menuItems'] as List<dynamic>? ?? [])
            .map((e) => MenuItem.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}

class MenuItem {
  final int id;
  final int categoryId;
  final String name;
  final String? description;
  final double price;
  final String? priceFormatted;
  final String? imageUrl;
  final bool isAvailable;
  final String? badge;
  final int sortOrder;

  const MenuItem({
    required this.id,
    required this.categoryId,
    required this.name,
    this.description,
    required this.price,
    this.priceFormatted,
    this.imageUrl,
    this.isAvailable = true,
    this.badge,
    this.sortOrder = 0,
  });

  factory MenuItem.fromJson(Map<String, dynamic> j) => MenuItem(
        id: _toInt(j['id']),
        categoryId: _toInt(j['categoryId']),
        name: j['name']?.toString() ?? '',
        description: j['description']?.toString(),
        price: _toDouble(j['price']),
        priceFormatted: j['priceFormatted']?.toString(),
        imageUrl: j['imageUrl']?.toString(),
        isAvailable: j['isAvailable'] == true || j['isAvailable'] == 1 || j['isAvailable'] == 'true',
        badge: j['badge']?.toString(),
        sortOrder: _toInt(j['sortOrder']),
      );
}

// ─── Cart ─────────────────────────────────────────────────────────────────────

class CartItem {
  final MenuItem menuItem;
  final int quantity;
  final String specialInstructions;

  const CartItem({
    required this.menuItem,
    required this.quantity,
    this.specialInstructions = '',
  });

  CartItem copyWith({int? quantity, String? specialInstructions}) => CartItem(
        menuItem: menuItem,
        quantity: quantity ?? this.quantity,
        specialInstructions: specialInstructions ?? this.specialInstructions,
      );

  /// Convenience alias
  MenuItem get item => menuItem;
  /// Convenience alias
  int get qty => quantity;

  double get subtotal => menuItem.price * quantity;
}

// ─── Customer profile (local) ─────────────────────────────────────────────────

class CustomerProfile {
  final String? name;
  final String? phone;
  final String? email;

  const CustomerProfile({this.name, this.phone, this.email});

  bool get isComplete =>
      (name ?? '').isNotEmpty && (phone ?? '').isNotEmpty;

  CustomerProfile copyWith({String? name, String? phone, String? email}) =>
      CustomerProfile(
        name: name ?? this.name,
        phone: phone ?? this.phone,
        email: email ?? this.email,
      );

  Map<String, dynamic> toJson() => {
        if (name != null) 'name': name,
        if (phone != null) 'phone': phone,
        if (email != null) 'email': email,
      };

  factory CustomerProfile.fromJson(Map<String, dynamic> j) => CustomerProfile(
        name: j['name'] as String?,
        phone: j['phone'] as String?,
        email: j['email'] as String?,
      );
}

// ─── Order ────────────────────────────────────────────────────────────────────

class PlacedOrder {
  final String orderNumber;
  final double total;
  final String status;
  final String? customerName;

  const PlacedOrder({
    required this.orderNumber,
    required this.total,
    required this.status,
    this.customerName,
  });

  factory PlacedOrder.fromJson(Map<String, dynamic> j) => PlacedOrder(
        orderNumber: j['orderNumber']?.toString() ?? '',
        total: _toDouble(j['total']),
        status: j['status']?.toString() ?? 'pending',
        customerName: j['customerName']?.toString(),
      );
}
