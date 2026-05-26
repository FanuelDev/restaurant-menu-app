enum OrderStatus {
  pending,
  confirmed,
  preparing,
  ready,
  delivered,
  cancelled;

  static OrderStatus fromString(String value) {
    switch (value) {
      case 'pending':
        return OrderStatus.pending;
      case 'confirmed':
        return OrderStatus.confirmed;
      case 'preparing':
        return OrderStatus.preparing;
      case 'ready':
        return OrderStatus.ready;
      case 'delivered':
        return OrderStatus.delivered;
      case 'cancelled':
        return OrderStatus.cancelled;
      default:
        return OrderStatus.pending;
    }
  }

  String get value {
    switch (this) {
      case OrderStatus.pending:
        return 'pending';
      case OrderStatus.confirmed:
        return 'confirmed';
      case OrderStatus.preparing:
        return 'preparing';
      case OrderStatus.ready:
        return 'ready';
      case OrderStatus.delivered:
        return 'delivered';
      case OrderStatus.cancelled:
        return 'cancelled';
    }
  }

  String get label {
    switch (this) {
      case OrderStatus.pending:
        return 'En attente';
      case OrderStatus.confirmed:
        return 'Confirmé';
      case OrderStatus.preparing:
        return 'En préparation';
      case OrderStatus.ready:
        return 'Prêt';
      case OrderStatus.delivered:
        return 'Livré';
      case OrderStatus.cancelled:
        return 'Annulé';
    }
  }

  OrderStatus? get nextStatus {
    switch (this) {
      case OrderStatus.pending:
        return OrderStatus.confirmed;
      case OrderStatus.confirmed:
        return OrderStatus.preparing;
      case OrderStatus.preparing:
        return OrderStatus.ready;
      case OrderStatus.ready:
        return OrderStatus.delivered;
      default:
        return null;
    }
  }

  String? get nextLabel {
    return nextStatus?.label;
  }
}

class OrderItem {
  final int id;
  final int menuItemId;
  final String menuItemName;
  final num menuItemPrice;
  final int quantity;
  final String? specialInstructions;
  final num subtotal;

  const OrderItem({
    required this.id,
    required this.menuItemId,
    required this.menuItemName,
    required this.menuItemPrice,
    required this.quantity,
    this.specialInstructions,
    required this.subtotal,
  });

  factory OrderItem.fromJson(Map<String, dynamic> json) {
    return OrderItem(
      id: json['id'] as int,
      menuItemId: json['menuItemId'] as int? ?? 0,
      menuItemName: json['menuItemName']?.toString() ??
          json['menuItem']?['name']?.toString() ??
          '',
      menuItemPrice: (json['menuItemPrice'] as num?) ??
          (json['menuItem']?['price'] as num?) ??
          0,
      quantity: json['quantity'] as int? ?? 1,
      specialInstructions: json['specialInstructions']?.toString(),
      subtotal: (json['subtotal'] as num?) ?? 0,
    );
  }
}

class Order {
  final int id;
  final int restaurantId;
  final String orderNumber;
  final String customerName;
  final String? customerPhone;
  final String? customerEmail;
  final OrderStatus status;
  final String? notes;
  final num total;
  final bool isGift;
  final List<OrderItem> items;
  final DateTime createdAt;

  const Order({
    required this.id,
    required this.restaurantId,
    required this.orderNumber,
    required this.customerName,
    this.customerPhone,
    this.customerEmail,
    required this.status,
    this.notes,
    required this.total,
    required this.isGift,
    required this.items,
    required this.createdAt,
  });

  factory Order.fromJson(Map<String, dynamic> json) {
    final itemsJson = json['items'] as List<dynamic>? ?? [];
    return Order(
      id: json['id'] as int,
      restaurantId: json['restaurantId'] as int? ?? 0,
      orderNumber: json['orderNumber']?.toString() ?? '#${json['id']}',
      customerName: json['customerName']?.toString() ?? '',
      customerPhone: json['customerPhone']?.toString(),
      customerEmail: json['customerEmail']?.toString(),
      status: OrderStatus.fromString(json['status']?.toString() ?? 'pending'),
      notes: json['notes']?.toString(),
      total: (json['total'] as num?) ?? 0,
      isGift: json['isGift'] == true,
      items: itemsJson
          .map((e) => OrderItem.fromJson(e as Map<String, dynamic>))
          .toList(),
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ??
          DateTime.now(),
    );
  }
}

class PaginatedOrders {
  final List<Order> data;
  final int total;
  final int page;
  final int perPage;
  final int lastPage;

  const PaginatedOrders({
    required this.data,
    required this.total,
    required this.page,
    required this.perPage,
    required this.lastPage,
  });

  factory PaginatedOrders.fromJson(Map<String, dynamic> json) {
    final meta = json['meta'] as Map<String, dynamic>? ?? json;
    final dataList = json['data'] as List<dynamic>? ?? [];
    return PaginatedOrders(
      data: dataList
          .map((e) => Order.fromJson(e as Map<String, dynamic>))
          .toList(),
      total: meta['total'] as int? ?? 0,
      page: meta['currentPage'] as int? ?? meta['page'] as int? ?? 1,
      perPage: meta['perPage'] as int? ?? 20,
      lastPage: meta['lastPage'] as int? ?? 1,
    );
  }
}

// Menu item for order creation
class MenuItem {
  final int id;
  final String name;
  final num price;
  final String? description;
  final String? imageUrl;
  final bool isAvailable;

  const MenuItem({
    required this.id,
    required this.name,
    required this.price,
    this.description,
    this.imageUrl,
    required this.isAvailable,
  });

  factory MenuItem.fromJson(Map<String, dynamic> json) {
    return MenuItem(
      id: json['id'] as int,
      name: json['name']?.toString() ?? '',
      price: (json['price'] as num?) ?? 0,
      description: json['description']?.toString(),
      imageUrl: json['imageUrl']?.toString() ?? json['image']?.toString(),
      isAvailable: json['isAvailable'] != false,
    );
  }
}

class MenuCategory {
  final int id;
  final String name;
  final List<MenuItem> items;

  const MenuCategory({
    required this.id,
    required this.name,
    required this.items,
  });

  factory MenuCategory.fromJson(Map<String, dynamic> json) {
    final itemsJson = json['items'] as List<dynamic>? ?? [];
    return MenuCategory(
      id: json['id'] as int,
      name: json['name']?.toString() ?? '',
      items: itemsJson
          .map((e) => MenuItem.fromJson(e as Map<String, dynamic>))
          .where((item) => item.isAvailable)
          .toList(),
    );
  }
}

class CartItem {
  final MenuItem menuItem;
  int quantity;
  String? specialInstructions;

  CartItem({
    required this.menuItem,
    required this.quantity,
    this.specialInstructions,
  });

  num get subtotal => menuItem.price * quantity;
}
