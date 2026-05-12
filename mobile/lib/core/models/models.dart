// lib/core/models/models.dart
// Barrel export + toutes les données models

import 'package:flutter/material.dart';

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
      id: j['id'],
      slug: j['slug'],
      name: j['name'],
      slogan: j['slogan'],
      brandColor: j['brandColor'] ?? '#C0392B',
      templateId: j['templateId'] ?? 1,
      logoUrl: j['logoUrl'],
      coverImageUrl: j['coverImageUrl'],
      address: j['address'],
      phone: j['phone'],
      email: j['email'],
      currency: j['currency'] ?? 'XOF',
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
        id: j['id'],
        name: j['name'],
        description: j['description'],
        sortOrder: j['sortOrder'] ?? 0,
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
        id: j['id'],
        categoryId: j['categoryId'],
        name: j['name'],
        description: j['description'],
        price: (j['price'] as num).toDouble(),
        priceFormatted: j['priceFormatted'],
        imageUrl: j['imageUrl'],
        isAvailable: j['isAvailable'] ?? true,
        badge: j['badge'],
        sortOrder: j['sortOrder'] ?? 0,
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
        orderNumber: j['orderNumber'] ?? '',
        total: (j['total'] as num?)?.toDouble() ?? 0,
        status: j['status'] ?? 'pending',
        customerName: j['customerName'],
      );
}
