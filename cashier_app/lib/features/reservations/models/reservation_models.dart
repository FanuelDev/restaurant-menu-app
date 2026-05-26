enum ReservationStatus {
  pending,
  confirmed,
  cancelled,
  noShow;

  static ReservationStatus fromString(String value) {
    switch (value) {
      case 'pending':
        return ReservationStatus.pending;
      case 'confirmed':
        return ReservationStatus.confirmed;
      case 'cancelled':
        return ReservationStatus.cancelled;
      case 'no_show':
        return ReservationStatus.noShow;
      default:
        return ReservationStatus.pending;
    }
  }

  String get value {
    switch (this) {
      case ReservationStatus.pending:
        return 'pending';
      case ReservationStatus.confirmed:
        return 'confirmed';
      case ReservationStatus.cancelled:
        return 'cancelled';
      case ReservationStatus.noShow:
        return 'no_show';
    }
  }

  String get label {
    switch (this) {
      case ReservationStatus.pending:
        return 'En attente';
      case ReservationStatus.confirmed:
        return 'Confirmée';
      case ReservationStatus.cancelled:
        return 'Annulée';
      case ReservationStatus.noShow:
        return 'No-show';
    }
  }
}

class Reservation {
  final int id;
  final String customerName;
  final String? customerPhone;
  final String? customerEmail;
  final String reservedDate;
  final String reservedTime;
  final int guestsCount;
  final String? specialRequests;
  final ReservationStatus status;
  final String? notes;
  final DateTime createdAt;

  const Reservation({
    required this.id,
    required this.customerName,
    this.customerPhone,
    this.customerEmail,
    required this.reservedDate,
    required this.reservedTime,
    required this.guestsCount,
    this.specialRequests,
    required this.status,
    this.notes,
    required this.createdAt,
  });

  factory Reservation.fromJson(Map<String, dynamic> json) {
    return Reservation(
      id: json['id'] as int,
      customerName: json['customerName']?.toString() ?? '',
      customerPhone: json['customerPhone']?.toString(),
      customerEmail: json['customerEmail']?.toString(),
      reservedDate: json['reservedDate']?.toString() ?? '',
      reservedTime: json['reservedTime']?.toString() ?? '',
      guestsCount: json['guestsCount'] as int? ?? 1,
      specialRequests: json['specialRequests']?.toString(),
      status:
          ReservationStatus.fromString(json['status']?.toString() ?? 'pending'),
      notes: json['notes']?.toString(),
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ??
          DateTime.now(),
    );
  }
}

class PaginatedReservations {
  final List<Reservation> data;
  final int total;
  final int page;
  final int perPage;
  final int lastPage;

  const PaginatedReservations({
    required this.data,
    required this.total,
    required this.page,
    required this.perPage,
    required this.lastPage,
  });

  factory PaginatedReservations.fromJson(Map<String, dynamic> json) {
    final meta = json['meta'] as Map<String, dynamic>? ?? json;
    final dataList = json['data'] as List<dynamic>? ?? [];
    return PaginatedReservations(
      data: dataList
          .map((e) => Reservation.fromJson(e as Map<String, dynamic>))
          .toList(),
      total: meta['total'] as int? ?? 0,
      page: meta['currentPage'] as int? ?? meta['page'] as int? ?? 1,
      perPage: meta['perPage'] as int? ?? 20,
      lastPage: meta['lastPage'] as int? ?? 1,
    );
  }
}
