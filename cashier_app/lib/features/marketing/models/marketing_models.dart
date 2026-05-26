import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';

// ─── VoucherEventType ─────────────────────────────────────────────────────────

enum VoucherEventType {
  afterWork,
  birthday,
  christmas,
  easter,
  newYear,
  other,
}

extension VoucherEventTypeX on VoucherEventType {
  String get value {
    switch (this) {
      case VoucherEventType.afterWork:
        return 'after_work';
      case VoucherEventType.birthday:
        return 'birthday';
      case VoucherEventType.christmas:
        return 'christmas';
      case VoucherEventType.easter:
        return 'easter';
      case VoucherEventType.newYear:
        return 'new_year';
      case VoucherEventType.other:
        return 'other';
    }
  }

  String get label {
    switch (this) {
      case VoucherEventType.afterWork:
        return 'After-work';
      case VoucherEventType.birthday:
        return 'Anniversaire';
      case VoucherEventType.christmas:
        return 'Noël';
      case VoucherEventType.easter:
        return 'Pâques';
      case VoucherEventType.newYear:
        return 'Nouvel An';
      case VoucherEventType.other:
        return 'Autre';
    }
  }

  IconData get icon {
    switch (this) {
      case VoucherEventType.afterWork:
        return Icons.local_bar_rounded;
      case VoucherEventType.birthday:
        return Icons.cake_rounded;
      case VoucherEventType.christmas:
        return Icons.ac_unit_rounded;
      case VoucherEventType.easter:
        return Icons.egg_rounded;
      case VoucherEventType.newYear:
        return Icons.celebration_rounded;
      case VoucherEventType.other:
        return Icons.local_offer_rounded;
    }
  }

  static VoucherEventType fromString(String value) {
    switch (value) {
      case 'after_work':
        return VoucherEventType.afterWork;
      case 'birthday':
        return VoucherEventType.birthday;
      case 'christmas':
        return VoucherEventType.christmas;
      case 'easter':
        return VoucherEventType.easter;
      case 'new_year':
        return VoucherEventType.newYear;
      default:
        return VoucherEventType.other;
    }
  }
}

// ─── VoucherStatus ────────────────────────────────────────────────────────────

enum VoucherStatus {
  active,
  expired,
  fullyUsed,
}

extension VoucherStatusX on VoucherStatus {
  String get label {
    switch (this) {
      case VoucherStatus.active:
        return 'Actif';
      case VoucherStatus.expired:
        return 'Expiré';
      case VoucherStatus.fullyUsed:
        return 'Épuisé';
    }
  }

  Color get color {
    switch (this) {
      case VoucherStatus.active:
        return AppColors.emerald;
      case VoucherStatus.expired:
        return AppColors.textMuted;
      case VoucherStatus.fullyUsed:
        return AppColors.brand;
    }
  }

  static VoucherStatus fromString(String value) {
    switch (value) {
      case 'active':
        return VoucherStatus.active;
      case 'expired':
        return VoucherStatus.expired;
      case 'fully_used':
        return VoucherStatus.fullyUsed;
      default:
        return VoucherStatus.expired;
    }
  }
}

// ─── VoucherUsage ─────────────────────────────────────────────────────────────

class VoucherUsage {
  final int id;
  final int voucherId;
  final int? orderId;
  final String customerName;
  final double voucherAmountUsed;
  final double orderTotal;
  final double surplusPaid;
  final DateTime redeemedAt;

  const VoucherUsage({
    required this.id,
    required this.voucherId,
    this.orderId,
    required this.customerName,
    required this.voucherAmountUsed,
    required this.orderTotal,
    required this.surplusPaid,
    required this.redeemedAt,
  });

  factory VoucherUsage.fromJson(Map<String, dynamic> json) {
    return VoucherUsage(
      id: json['id'] as int,
      voucherId: (json['voucherId'] ?? json['voucher_id']) as int,
      orderId: (json['orderId'] ?? json['order_id']) as int?,
      customerName: (json['customerName'] ?? json['customer_name'])?.toString() ?? '',
      voucherAmountUsed: ((json['voucherAmountUsed'] ?? json['voucher_amount_used']) as num).toDouble(),
      orderTotal: ((json['orderTotal'] ?? json['order_total']) as num).toDouble(),
      surplusPaid: ((json['surplusPaid'] ?? json['surplus_paid']) as num).toDouble(),
      redeemedAt: DateTime.tryParse((json['redeemedAt'] ?? json['redeemed_at'])?.toString() ?? '') ?? DateTime.now(),
    );
  }
}

// ─── MarketingVoucher ─────────────────────────────────────────────────────────

class MarketingVoucher {
  final int id;
  final String label;
  final VoucherEventType eventType;
  final double amount;
  final String validFrom;
  final String validUntil;
  final int? maxUsages;
  final int usageCount;
  final String qrToken;
  final String? notes;
  final VoucherStatus status;
  final DateTime createdAt;
  final List<VoucherUsage> usages;

  const MarketingVoucher({
    required this.id,
    required this.label,
    required this.eventType,
    required this.amount,
    required this.validFrom,
    required this.validUntil,
    this.maxUsages,
    required this.usageCount,
    required this.qrToken,
    this.notes,
    required this.status,
    required this.createdAt,
    required this.usages,
  });

  factory MarketingVoucher.fromJson(Map<String, dynamic> json) {
    final usagesRaw = json['usages'];
    final List<VoucherUsage> usagesList = usagesRaw is List
        ? usagesRaw
            .map((e) => VoucherUsage.fromJson(e as Map<String, dynamic>))
            .toList()
        : [];

    return MarketingVoucher(
      id: json['id'] as int,
      label: json['label']?.toString() ?? '',
      eventType: VoucherEventTypeX.fromString(
          (json['eventType'] ?? json['event_type'])?.toString() ?? ''),
      amount: (json['amount'] as num).toDouble(),
      validFrom: (json['validFrom'] ?? json['valid_from'])?.toString() ?? '',
      validUntil: (json['validUntil'] ?? json['valid_until'])?.toString() ?? '',
      maxUsages: (json['maxUsages'] ?? json['max_usages']) as int?,
      usageCount: ((json['usageCount'] ?? json['usage_count']) as num?)?.toInt() ?? 0,
      qrToken: (json['qrToken'] ?? json['qr_token'])?.toString() ?? '',
      notes: json['notes']?.toString(),
      status: VoucherStatusX.fromString(json['status']?.toString() ?? ''),
      createdAt: DateTime.tryParse(
              (json['createdAt'] ?? json['created_at'])?.toString() ?? '') ??
          DateTime.now(),
      usages: usagesList,
    );
  }

  bool get canRedeem => status == VoucherStatus.active;
}

// ─── MarketingStats ───────────────────────────────────────────────────────────

class MarketingStats {
  final int totalVouchers;
  final int activeVouchers;
  final int totalRedemptions;
  final double totalValueRedeemed;

  const MarketingStats({
    required this.totalVouchers,
    required this.activeVouchers,
    required this.totalRedemptions,
    required this.totalValueRedeemed,
  });

  factory MarketingStats.fromJson(Map<String, dynamic> json) {
    return MarketingStats(
      totalVouchers: ((json['totalVouchers'] ?? json['total_vouchers']) as num?)?.toInt() ?? 0,
      activeVouchers: ((json['activeVouchers'] ?? json['active_vouchers']) as num?)?.toInt() ?? 0,
      totalRedemptions: ((json['totalRedemptions'] ?? json['total_redemptions']) as num?)?.toInt() ?? 0,
      totalValueRedeemed: ((json['totalValueRedeemed'] ?? json['total_value_redeemed']) as num?)?.toDouble() ?? 0.0,
    );
  }
}

// ─── PaginatedVouchers ────────────────────────────────────────────────────────

class PaginatedVouchers {
  final List<MarketingVoucher> data;
  final int total;
  final int page;
  final int lastPage;

  const PaginatedVouchers({
    required this.data,
    required this.total,
    required this.page,
    required this.lastPage,
  });

  factory PaginatedVouchers.fromJson(Map<String, dynamic> json) {
    final dataRaw = json['data'];
    final List<MarketingVoucher> items = dataRaw is List
        ? dataRaw
            .map((e) => MarketingVoucher.fromJson(e as Map<String, dynamic>))
            .toList()
        : [];

    final meta = json['meta'] as Map<String, dynamic>?;

    return PaginatedVouchers(
      data: items,
      total: (meta?['total'] as num?)?.toInt() ?? items.length,
      page: (meta?['current_page'] as num?)?.toInt() ?? 1,
      lastPage: (meta?['last_page'] as num?)?.toInt() ?? 1,
    );
  }
}
