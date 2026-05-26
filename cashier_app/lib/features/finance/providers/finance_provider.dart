import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../models/finance_models.dart';

// ─── Period selector ──────────────────────────────────────────────────────────

final financeSelectedPeriodProvider =
    StateProvider<FinancePeriod>((ref) => FinancePeriod.month);

// ─── Summary ──────────────────────────────────────────────────────────────────

final financeSummaryProvider =
    FutureProvider.autoDispose<FinanceSummary>((ref) async {
  final api = ref.watch(apiClientProvider);
  final period = ref.watch(financeSelectedPeriodProvider);

  final response = await api.get(
    ApiEndpoints.financeSummary,
    queryParameters: {'period': period.value},
  );
  return FinanceSummary.fromJson(response.data as Map<String, dynamic>);
});

// ─── Chart ────────────────────────────────────────────────────────────────────

final financeChartProvider =
    FutureProvider.autoDispose<FinanceChart>((ref) async {
  final api = ref.watch(apiClientProvider);
  final period = ref.watch(financeSelectedPeriodProvider);

  final response = await api.get(
    ApiEndpoints.financeChart,
    queryParameters: {'period': period.value},
  );
  return FinanceChart.fromJson(response.data as Map<String, dynamic>);
});

// ─── Expenses list ────────────────────────────────────────────────────────────

final financeExpensesProvider =
    FutureProvider.autoDispose<PaginatedFinanceItems<FinanceExpense>>(
        (ref) async {
  final api = ref.watch(apiClientProvider);

  final response = await api.get(
    ApiEndpoints.financeExpenses,
    queryParameters: {'page': 1, 'perPage': 30},
  );
  return PaginatedFinanceItems.fromJson(
    response.data as Map<String, dynamic>,
    FinanceExpense.fromJson,
  );
});

// ─── Incomes list ─────────────────────────────────────────────────────────────

final financeIncomesProvider =
    FutureProvider.autoDispose<PaginatedFinanceItems<FinanceIncome>>(
        (ref) async {
  final api = ref.watch(apiClientProvider);

  final response = await api.get(
    ApiEndpoints.financeIncomes,
    queryParameters: {'page': 1, 'perPage': 30},
  );
  return PaginatedFinanceItems.fromJson(
    response.data as Map<String, dynamic>,
    FinanceIncome.fromJson,
  );
});

// ─── Create expense ───────────────────────────────────────────────────────────

class CreateExpenseNotifier extends StateNotifier<AsyncValue<void>> {
  CreateExpenseNotifier(this._api) : super(const AsyncValue.data(null));

  final ApiClient _api;

  Future<bool> createExpense({
    required String category,
    required String label,
    required double amount,
    required String date,
    String? notes,
  }) async {
    state = const AsyncValue.loading();
    bool success = false;
    state = await AsyncValue.guard(() async {
      await _api.post(
        ApiEndpoints.financeExpenses,
        data: {
          'category': category,
          'label': label,
          'amount': amount,
          'date': date,
          if (notes != null && notes.isNotEmpty) 'notes': notes,
        },
      );
      success = true;
    });
    return success;
  }
}

final createExpenseProvider = StateNotifierProvider.autoDispose<
    CreateExpenseNotifier, AsyncValue<void>>(
  (ref) => CreateExpenseNotifier(ref.watch(apiClientProvider)),
);

// ─── Delete expense ───────────────────────────────────────────────────────────

class DeleteExpenseNotifier extends StateNotifier<AsyncValue<void>> {
  DeleteExpenseNotifier(this._api, this._ref)
      : super(const AsyncValue.data(null));

  final ApiClient _api;
  final Ref _ref;

  Future<bool> deleteExpense(int id) async {
    state = const AsyncValue.loading();
    bool success = false;
    state = await AsyncValue.guard(() async {
      await _api.delete(ApiEndpoints.financeExpenseById(id));
      success = true;
    });
    if (success) {
      _ref.invalidate(financeExpensesProvider);
      _ref.invalidate(financeSummaryProvider);
    }
    return success;
  }
}

final deleteExpenseProvider = StateNotifierProvider.autoDispose<
    DeleteExpenseNotifier, AsyncValue<void>>(
  (ref) => DeleteExpenseNotifier(ref.watch(apiClientProvider), ref),
);

// ─── Create income ────────────────────────────────────────────────────────────

class CreateIncomeNotifier extends StateNotifier<AsyncValue<void>> {
  CreateIncomeNotifier(this._api) : super(const AsyncValue.data(null));

  final ApiClient _api;

  Future<bool> createIncome({
    required String label,
    required double amount,
    required String date,
    String? notes,
  }) async {
    state = const AsyncValue.loading();
    bool success = false;
    state = await AsyncValue.guard(() async {
      await _api.post(
        ApiEndpoints.financeIncomes,
        data: {
          'label': label,
          'amount': amount,
          'date': date,
          if (notes != null && notes.isNotEmpty) 'notes': notes,
        },
      );
      success = true;
    });
    return success;
  }
}

final createIncomeProvider = StateNotifierProvider.autoDispose<
    CreateIncomeNotifier, AsyncValue<void>>(
  (ref) => CreateIncomeNotifier(ref.watch(apiClientProvider)),
);

// ─── Delete income ────────────────────────────────────────────────────────────

class DeleteIncomeNotifier extends StateNotifier<AsyncValue<void>> {
  DeleteIncomeNotifier(this._api, this._ref)
      : super(const AsyncValue.data(null));

  final ApiClient _api;
  final Ref _ref;

  Future<bool> deleteIncome(int id) async {
    state = const AsyncValue.loading();
    bool success = false;
    state = await AsyncValue.guard(() async {
      await _api.delete(ApiEndpoints.financeIncomeById(id));
      success = true;
    });
    if (success) {
      _ref.invalidate(financeIncomesProvider);
      _ref.invalidate(financeSummaryProvider);
    }
    return success;
  }
}

final deleteIncomeProvider = StateNotifierProvider.autoDispose<
    DeleteIncomeNotifier, AsyncValue<void>>(
  (ref) => DeleteIncomeNotifier(ref.watch(apiClientProvider), ref),
);
