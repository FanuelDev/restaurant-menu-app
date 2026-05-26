import 'package:flutter/material.dart';

enum FinancePeriod {
  week('week', 'Semaine'),
  month('month', 'Mois'),
  year('year', 'Année');

  final String value;
  final String label;

  const FinancePeriod(this.value, this.label);
}

enum ExpenseCategory {
  ingredient('ingredient', 'Ingrédient', Icons.restaurant_outlined),
  tool('tool', 'Outil', Icons.build_outlined),
  accessory('accessory', 'Accessoire', Icons.shopping_bag_outlined),
  other('other', 'Autre', Icons.category_outlined);

  final String value;
  final String label;
  final IconData icon;

  const ExpenseCategory(this.value, this.label, this.icon);

  static ExpenseCategory fromValue(String value) {
    return ExpenseCategory.values.firstWhere(
      (e) => e.value == value,
      orElse: () => ExpenseCategory.other,
    );
  }
}

class FinanceSummary {
  final String period;
  final double totalRevenue;
  final double ordersRevenue;
  final double manualRevenue;
  final double totalExpenses;
  final double netProfit;
  final double marginPct;
  final Map<String, double> byCategory;
  final Map<String, double> trends;

  const FinanceSummary({
    required this.period,
    required this.totalRevenue,
    required this.ordersRevenue,
    required this.manualRevenue,
    required this.totalExpenses,
    required this.netProfit,
    required this.marginPct,
    required this.byCategory,
    required this.trends,
  });

  factory FinanceSummary.fromJson(Map<String, dynamic> json) {
    final byCategoryRaw =
        (json['byCategory'] as Map<String, dynamic>?) ?? {};
    final byCategory = byCategoryRaw.map(
      (k, v) => MapEntry(k, (v as num).toDouble()),
    );

    final trendsRaw = (json['trends'] as Map<String, dynamic>?) ?? {};
    final trends = trendsRaw.map(
      (k, v) => MapEntry(k, (v as num).toDouble()),
    );

    return FinanceSummary(
      period: json['period']?.toString() ?? 'month',
      totalRevenue: (json['totalRevenue'] as num?)?.toDouble() ?? 0.0,
      ordersRevenue: (json['ordersRevenue'] as num?)?.toDouble() ?? 0.0,
      manualRevenue: (json['manualRevenue'] as num?)?.toDouble() ?? 0.0,
      totalExpenses: (json['totalExpenses'] as num?)?.toDouble() ?? 0.0,
      netProfit: (json['netProfit'] as num?)?.toDouble() ?? 0.0,
      marginPct: (json['marginPct'] as num?)?.toDouble() ?? 0.0,
      byCategory: byCategory,
      trends: trends,
    );
  }

  double get revenueTrend => trends['revenue'] ?? 0.0;
  double get expensesTrend => trends['expenses'] ?? 0.0;
  double get netTrend => trends['net'] ?? 0.0;
}

class FinanceChartPoint {
  final String label;
  final double revenue;
  final double expenses;
  final double net;

  const FinanceChartPoint({
    required this.label,
    required this.revenue,
    required this.expenses,
    required this.net,
  });

  factory FinanceChartPoint.fromJson(Map<String, dynamic> json) {
    return FinanceChartPoint(
      label: json['label']?.toString() ?? '',
      revenue: (json['revenue'] as num?)?.toDouble() ?? 0.0,
      expenses: (json['expenses'] as num?)?.toDouble() ?? 0.0,
      net: (json['net'] as num?)?.toDouble() ?? 0.0,
    );
  }
}

class FinanceChart {
  final String period;
  final String groupBy;
  final List<FinanceChartPoint> points;

  const FinanceChart({
    required this.period,
    required this.groupBy,
    required this.points,
  });

  factory FinanceChart.fromJson(Map<String, dynamic> json) {
    final pointsList = (json['points'] as List<dynamic>?) ?? [];
    return FinanceChart(
      period: json['period']?.toString() ?? 'month',
      groupBy: json['groupBy']?.toString() ?? 'day',
      points: pointsList
          .map((e) => FinanceChartPoint.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}

class FinanceExpense {
  final int id;
  final int restaurantId;
  final int createdBy;
  final String category;
  final String label;
  final double amount;
  final String date;
  final String? notes;
  final DateTime createdAt;

  const FinanceExpense({
    required this.id,
    required this.restaurantId,
    required this.createdBy,
    required this.category,
    required this.label,
    required this.amount,
    required this.date,
    this.notes,
    required this.createdAt,
  });

  factory FinanceExpense.fromJson(Map<String, dynamic> json) {
    return FinanceExpense(
      id: json['id'] as int,
      restaurantId: json['restaurantId'] as int,
      createdBy: json['createdBy'] as int,
      category: json['category']?.toString() ?? 'other',
      label: json['label']?.toString() ?? '',
      amount: (json['amount'] as num?)?.toDouble() ?? 0.0,
      date: json['date']?.toString() ?? '',
      notes: json['notes']?.toString(),
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ??
          DateTime.now(),
    );
  }

  ExpenseCategory get categoryEnum =>
      ExpenseCategory.fromValue(category);
}

class FinanceIncome {
  final int id;
  final int restaurantId;
  final int createdBy;
  final String label;
  final double amount;
  final String date;
  final String? notes;
  final DateTime createdAt;

  const FinanceIncome({
    required this.id,
    required this.restaurantId,
    required this.createdBy,
    required this.label,
    required this.amount,
    required this.date,
    this.notes,
    required this.createdAt,
  });

  factory FinanceIncome.fromJson(Map<String, dynamic> json) {
    return FinanceIncome(
      id: json['id'] as int,
      restaurantId: json['restaurantId'] as int,
      createdBy: json['createdBy'] as int,
      label: json['label']?.toString() ?? '',
      amount: (json['amount'] as num?)?.toDouble() ?? 0.0,
      date: json['date']?.toString() ?? '',
      notes: json['notes']?.toString(),
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ??
          DateTime.now(),
    );
  }
}

class PaginatedFinanceItems<T> {
  final List<T> data;
  final int total;
  final int page;
  final int perPage;
  final int lastPage;

  const PaginatedFinanceItems({
    required this.data,
    required this.total,
    required this.page,
    required this.perPage,
    required this.lastPage,
  });

  factory PaginatedFinanceItems.fromJson(
    Map<String, dynamic> json,
    T Function(Map<String, dynamic>) fromJson,
  ) {
    final rawData = (json['data'] as List<dynamic>?) ?? [];
    return PaginatedFinanceItems(
      data: rawData
          .map((e) => fromJson(e as Map<String, dynamic>))
          .toList(),
      total: (json['total'] as num?)?.toInt() ?? 0,
      page: (json['page'] as num?)?.toInt() ?? 1,
      perPage: (json['perPage'] as num?)?.toInt() ?? 20,
      lastPage: (json['lastPage'] as num?)?.toInt() ?? 1,
    );
  }
}
