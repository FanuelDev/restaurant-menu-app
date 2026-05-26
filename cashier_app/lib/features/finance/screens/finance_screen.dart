import 'package:fl_chart/fl_chart.dart';
import '../../../core/utils/currency_provider.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gap/gap.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/currency_utils.dart';
import '../models/finance_models.dart';
import '../providers/finance_provider.dart';
import '../../../shared/widgets/loading_shimmer.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/confirm_dialog.dart';

class FinanceScreen extends ConsumerStatefulWidget {
  const FinanceScreen({super.key});

  @override
  ConsumerState<FinanceScreen> createState() => _FinanceScreenState();
}

class _FinanceScreenState extends ConsumerState<FinanceScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _tabController.addListener(() {
      if (mounted) setState(() {});
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final topPadding = MediaQuery.of(context).padding.top;
    final selectedPeriod = ref.watch(financeSelectedPeriodProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      floatingActionButton: _buildFab(context),
      body: DefaultTabController(
        length: 2,
        child: NestedScrollView(
          headerSliverBuilder: (context, innerBoxIsScrolled) => [
            SliverToBoxAdapter(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Gap(topPadding + 16),
                  // Top bar
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Row(
                      children: [
                        Text(
                          'Finance',
                          style: GoogleFonts.poppins(
                            fontSize: 26,
                            fontWeight: FontWeight.w700,
                            color: AppColors.textPrimary,
                          ),
                        ).animate().fadeIn(duration: 400.ms).slideY(
                              begin: 0.1,
                              curve: Curves.easeOutCubic,
                            ),
                        const Spacer(),
                      ],
                    ),
                  ),
                  const Gap(16),

                  // Period pill chips
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Row(
                      children: FinancePeriod.values.map((period) {
                        final isSelected = period == selectedPeriod;
                        return Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: GestureDetector(
                            onTap: () {
                              ref
                                  .read(financeSelectedPeriodProvider.notifier)
                                  .state = period;
                            },
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 200),
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 16, vertical: 8),
                              decoration: BoxDecoration(
                                color: isSelected
                                    ? AppColors.brand
                                    : AppColors.surface,
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(
                                  color: isSelected
                                      ? AppColors.brand
                                      : AppColors.borderBright,
                                ),
                              ),
                              child: Text(
                                period.label,
                                style: GoogleFonts.poppins(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                  color: isSelected
                                      ? AppColors.textPrimary
                                      : AppColors.textSecondary,
                                ),
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ).animate().fadeIn(duration: 400.ms, delay: 100.ms).slideY(
                        begin: 0.1,
                        curve: Curves.easeOutCubic,
                      ),
                  const Gap(20),

                  // Summary cards
                  _SummarySection(),
                  const Gap(20),

                  // Chart
                  _ChartSection(),
                  const Gap(20),

                  // Tab bar header
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Container(
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppColors.borderBright),
                      ),
                      child: TabBar(
                        controller: _tabController,
                        indicator: BoxDecoration(
                          color: AppColors.brand,
                          borderRadius: BorderRadius.circular(14),
                        ),
                        indicatorSize: TabBarIndicatorSize.tab,
                        dividerColor: Colors.transparent,
                        labelStyle: GoogleFonts.poppins(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                        ),
                        unselectedLabelStyle: GoogleFonts.poppins(
                          fontSize: 14,
                          fontWeight: FontWeight.w400,
                        ),
                        labelColor: AppColors.textPrimary,
                        unselectedLabelColor: AppColors.textSecondary,
                        tabs: const [
                          Tab(text: 'Dépenses'),
                          Tab(text: 'Revenus'),
                        ],
                      ),
                    ),
                  ).animate().fadeIn(duration: 400.ms, delay: 300.ms),
                  const Gap(12),
                ],
              ),
            ),
          ],
          body: TabBarView(
            controller: _tabController,
            children: [
              _ExpensesList(),
              _IncomesList(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFab(BuildContext context) {
    final isExpensesTab = _tabController.index == 0;
    return FloatingActionButton.extended(
      onPressed: () {
        if (isExpensesTab) {
          context.push('/finance/expenses/create');
        } else {
          context.push('/finance/incomes/create');
        }
      },
      backgroundColor: AppColors.brand,
      foregroundColor: AppColors.textPrimary,
      icon: const Icon(Icons.add_rounded),
      label: Text(
        isExpensesTab ? 'Dépense' : 'Revenu',
        style: GoogleFonts.poppins(fontWeight: FontWeight.w600),
      ),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
    );
  }
}

// ─── Summary Section ──────────────────────────────────────────────────────────

class _SummarySection extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final summaryAsync = ref.watch(financeSummaryProvider);

    return summaryAsync.when(
      loading: () => Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        child: Row(
          children: List.generate(
            3,
            (i) => Expanded(
              child: Padding(
                padding: EdgeInsets.only(right: i < 2 ? 10 : 0),
                child: const LoadingShimmer(itemCount: 1, itemHeight: 100),
              ),
            ),
          ),
        ),
      ),
      error: (e, _) => Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.borderBright),
          ),
          child: Text(
            'Erreur de chargement',
            style: GoogleFonts.poppins(color: AppColors.textMuted),
          ),
        ),
      ),
      data: (summary) {
        final currency = ref.watch(currencyProvider);
        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Row(
            children: [
              Expanded(
                child: _StatCard(
                  label: 'Recettes',
                  amount: summary.totalRevenue,
                  trend: summary.revenueTrend,
                  color: AppColors.emerald,
                  delay: 0,
                  currency: currency,
                ),
              ),
              const Gap(10),
              Expanded(
                child: _StatCard(
                  label: 'Dépenses',
                  amount: summary.totalExpenses,
                  trend: summary.expensesTrend,
                  color: AppColors.brand,
                  delay: 80,
                  currency: currency,
                ),
              ),
              const Gap(10),
              Expanded(
                child: _StatCard(
                  label: 'Bénéfice net',
                  amount: summary.netProfit,
                  trend: summary.netTrend,
                  color: AppColors.info,
                  delay: 160,
                  currency: currency,
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _StatCard extends StatelessWidget {
  final String label;
  final double amount;
  final double trend;
  final Color color;
  final int delay;
  final String currency;

  const _StatCard({
    required this.label,
    required this.amount,
    required this.trend,
    required this.color,
    required this.delay,
    required this.currency,
  });

  @override
  Widget build(BuildContext context) {
    final isPositive = trend >= 0;
    final trendStr =
        '${isPositive ? '+' : ''}${trend.toStringAsFixed(1)}%';

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.borderBright),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 8,
                height: 8,
                decoration: BoxDecoration(
                  color: color,
                  shape: BoxShape.circle,
                ),
              ),
              const Gap(6),
              Expanded(
                child: Text(
                  label,
                  style: GoogleFonts.poppins(
                    fontSize: 11,
                    color: AppColors.textMuted,
                    fontWeight: FontWeight.w500,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const Gap(8),
          Text(
            CurrencyUtils.formatAmount(amount, currency: currency),
            style: GoogleFonts.poppins(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimary,
            ),
            overflow: TextOverflow.ellipsis,
          ),
          const Gap(4),
          Row(
            children: [
              Icon(
                isPositive
                    ? Icons.arrow_upward_rounded
                    : Icons.arrow_downward_rounded,
                size: 12,
                color: isPositive ? AppColors.emerald : AppColors.brand,
              ),
              const Gap(2),
              Text(
                trendStr,
                style: GoogleFonts.poppins(
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                  color: isPositive ? AppColors.emerald : AppColors.brand,
                ),
              ),
            ],
          ),
        ],
      ),
    )
        .animate()
        .fadeIn(duration: 400.ms, delay: Duration(milliseconds: delay))
        .slideY(
          begin: 0.1,
          curve: Curves.easeOutCubic,
          duration: 400.ms,
          delay: Duration(milliseconds: delay),
        );
  }
}

// ─── Chart Section ────────────────────────────────────────────────────────────

class _ChartSection extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final chartAsync = ref.watch(financeChartProvider);

    return chartAsync.when(
      loading: () => const Padding(
        padding: EdgeInsets.symmetric(horizontal: 20),
        child: LoadingShimmer(itemCount: 1, itemHeight: 210),
      ),
      error: (e, _) => const SizedBox.shrink(),
      data: (chart) {
        if (chart.points.isEmpty) return const SizedBox.shrink();
        final currency = ref.watch(currencyProvider);
        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: _FinanceLineChart(chart: chart, currency: currency),
        ).animate().fadeIn(duration: 500.ms, delay: 200.ms);
      },
    );
  }
}

class _FinanceLineChart extends StatefulWidget {
  final FinanceChart chart;
  final String currency;

  const _FinanceLineChart({required this.chart, required this.currency});

  @override
  State<_FinanceLineChart> createState() => _FinanceLineChartState();
}

class _FinanceLineChartState extends State<_FinanceLineChart> {
  @override
  Widget build(BuildContext context) {
    final points = widget.chart.points;

    final revenueSpots = points
        .asMap()
        .entries
        .map((e) => FlSpot(e.key.toDouble(), e.value.revenue))
        .toList();

    final expenseSpots = points
        .asMap()
        .entries
        .map((e) => FlSpot(e.key.toDouble(), e.value.expenses))
        .toList();

    double maxY = 0;
    for (final p in points) {
      if (p.revenue > maxY) maxY = p.revenue;
      if (p.expenses > maxY) maxY = p.expenses;
    }
    maxY = maxY * 1.2;
    if (maxY == 0) maxY = 100;

    return Container(
      padding: const EdgeInsets.fromLTRB(12, 20, 20, 12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.borderBright),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.only(left: 8, bottom: 8),
            child: Row(
              children: [
                _ChartLegendDot(color: AppColors.emerald, label: 'Recettes'),
                Gap(16),
                _ChartLegendDot(color: AppColors.brand, label: 'Dépenses'),
              ],
            ),
          ),
          SizedBox(
            height: 180,
            child: LineChart(
              LineChartData(
                minX: 0,
                maxX: (points.length - 1).toDouble(),
                minY: 0,
                maxY: maxY,
                backgroundColor: Colors.transparent,
                gridData: FlGridData(
                  show: true,
                  drawVerticalLine: false,
                  horizontalInterval: maxY / 4,
                  getDrawingHorizontalLine: (value) => FlLine(
                    color: AppColors.border.withValues(alpha: 0.6),
                    strokeWidth: 1,
                    dashArray: [4, 4],
                  ),
                ),
                borderData: FlBorderData(show: false),
                titlesData: FlTitlesData(
                  topTitles:
                      const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  rightTitles:
                      const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  leftTitles:
                      const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 28,
                      interval: 1,
                      getTitlesWidget: (value, meta) {
                        final idx = value.toInt();
                        if (idx < 0 || idx >= points.length) {
                          return const SizedBox.shrink();
                        }
                        // Show every 5th label to avoid crowding
                        if (points.length > 7 && idx % 5 != 0) {
                          return const SizedBox.shrink();
                        }
                        return Padding(
                          padding: const EdgeInsets.only(top: 6),
                          child: Text(
                            points[idx].label,
                            style: GoogleFonts.poppins(
                              fontSize: 9,
                              color: AppColors.textMuted,
                              fontWeight: FontWeight.w400,
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ),
                lineTouchData: LineTouchData(
                  touchTooltipData: LineTouchTooltipData(
                    getTooltipColor: (_) =>
                        AppColors.surfaceHigh.withValues(alpha: 0.95),
                    tooltipRoundedRadius: 10,
                    tooltipBorder: const BorderSide(
                        color: AppColors.borderBright, width: 1),
                    getTooltipItems: (touchedSpots) {
                      return touchedSpots.map((spot) {
                        final idx = spot.x.toInt();
                        final label =
                            (idx >= 0 && idx < points.length)
                                ? points[idx].label
                                : '';
                        final isRevenue = spot.barIndex == 0;
                        return LineTooltipItem(
                          '${isRevenue ? '📈' : '📉'} $label\n${CurrencyUtils.formatAmount(spot.y, currency: widget.currency)}',
                          GoogleFonts.poppins(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: isRevenue
                                ? AppColors.emerald
                                : AppColors.brand,
                          ),
                        );
                      }).toList();
                    },
                  ),
                ),
                lineBarsData: [
                  // Revenue line
                  LineChartBarData(
                    spots: revenueSpots,
                    isCurved: true,
                    curveSmoothness: 0.3,
                    color: AppColors.emerald,
                    barWidth: 2.5,
                    isStrokeCapRound: true,
                    dotData: FlDotData(
                      show: true,
                      getDotPainter: (spot, percent, bar, index) =>
                          FlDotCirclePainter(
                        radius: 3,
                        color: AppColors.emerald,
                        strokeWidth: 0,
                      ),
                    ),
                    belowBarData: BarAreaData(
                      show: true,
                      gradient: LinearGradient(
                        colors: [
                          AppColors.emerald.withValues(alpha: 0.18),
                          AppColors.emerald.withValues(alpha: 0.0),
                        ],
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                      ),
                    ),
                  ),
                  // Expenses line
                  LineChartBarData(
                    spots: expenseSpots,
                    isCurved: true,
                    curveSmoothness: 0.3,
                    color: AppColors.brand,
                    barWidth: 2.5,
                    isStrokeCapRound: true,
                    dotData: FlDotData(
                      show: true,
                      getDotPainter: (spot, percent, bar, index) =>
                          FlDotCirclePainter(
                        radius: 3,
                        color: AppColors.brand,
                        strokeWidth: 0,
                      ),
                    ),
                    belowBarData: BarAreaData(
                      show: true,
                      gradient: LinearGradient(
                        colors: [
                          AppColors.brand.withValues(alpha: 0.14),
                          AppColors.brand.withValues(alpha: 0.0),
                        ],
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ChartLegendDot extends StatelessWidget {
  final Color color;
  final String label;

  const _ChartLegendDot({required this.color, required this.label});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 10,
          height: 10,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const Gap(6),
        Text(
          label,
          style: GoogleFonts.poppins(
            fontSize: 12,
            color: AppColors.textSecondary,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }
}

// ─── Expenses List ────────────────────────────────────────────────────────────

class _ExpensesList extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final expensesAsync = ref.watch(financeExpensesProvider);

    return expensesAsync.when(
      loading: () => const LoadingShimmer(itemCount: 5, itemHeight: 72),
      error: (e, _) => Center(
        child: Padding(
          padding: const EdgeInsets.all(40),
          child: Text(
            'Erreur de chargement des dépenses',
            style:
                GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 14),
            textAlign: TextAlign.center,
          ),
        ),
      ),
      data: (paginated) {
        if (paginated.data.isEmpty) {
          return const SingleChildScrollView(
            child: Padding(
              padding: EdgeInsets.only(top: 40),
              child: EmptyState(
                icon: Icons.receipt_long_outlined,
                title: 'Aucune dépense',
                subtitle: 'Ajoutez votre première dépense',
              ),
            ),
          );
        }

        return ListView.separated(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 100),
          itemCount: paginated.data.length,
          separatorBuilder: (_, __) => const Gap(10),
          itemBuilder: (context, index) {
            final expense = paginated.data[index];
            return _ExpenseItem(expense: expense)
                .animate()
                .fadeIn(
                  duration: 350.ms,
                  delay: Duration(milliseconds: index * 40),
                )
                .slideY(
                  begin: 0.06,
                  curve: Curves.easeOutCubic,
                  duration: 350.ms,
                  delay: Duration(milliseconds: index * 40),
                );
          },
        );
      },
    );
  }
}

class _ExpenseItem extends ConsumerWidget {
  final FinanceExpense expense;

  const _ExpenseItem({required this.expense});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cat = expense.categoryEnum;
    final currency = ref.watch(currencyProvider);

    return Dismissible(
      key: ValueKey('expense_${expense.id}'),
      direction: DismissDirection.endToStart,
      confirmDismiss: (_) async {
        return await ConfirmDialog.show(
          context,
          title: 'Supprimer la dépense',
          message:
              'Voulez-vous supprimer "${expense.label}" ? Cette action est irréversible.',
          confirmLabel: 'Supprimer',
          isDangerous: true,
        );
      },
      onDismissed: (_) async {
        await ref.read(deleteExpenseProvider.notifier).deleteExpense(expense.id);
      },
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        decoration: BoxDecoration(
          color: AppColors.brand.withValues(alpha: 0.15),
          borderRadius: BorderRadius.circular(14),
        ),
        child: const Icon(Icons.delete_outline_rounded,
            color: AppColors.brand, size: 24),
      ),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.borderBright),
        ),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: AppColors.brand.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                    color: AppColors.brand.withValues(alpha: 0.25)),
              ),
              child: Icon(cat.icon, color: AppColors.brand, size: 22),
            ),
            const Gap(12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    expense.label,
                    style: GoogleFonts.poppins(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textPrimary,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                  const Gap(2),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 7, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppColors.brand.withValues(alpha: 0.10),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          cat.label,
                          style: GoogleFonts.poppins(
                            fontSize: 10,
                            fontWeight: FontWeight.w500,
                            color: AppColors.brand,
                          ),
                        ),
                      ),
                      const Gap(8),
                      Text(
                        expense.date,
                        style: GoogleFonts.poppins(
                          fontSize: 11,
                          color: AppColors.textMuted,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            Text(
              '- ${CurrencyUtils.formatAmount(expense.amount, currency: currency)}',
              style: GoogleFonts.poppins(
                fontSize: 14,
                fontWeight: FontWeight.w700,
                color: AppColors.brand,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Incomes List ─────────────────────────────────────────────────────────────

class _IncomesList extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final incomesAsync = ref.watch(financeIncomesProvider);

    return incomesAsync.when(
      loading: () => const LoadingShimmer(itemCount: 5, itemHeight: 72),
      error: (e, _) => Center(
        child: Padding(
          padding: const EdgeInsets.all(40),
          child: Text(
            'Erreur de chargement des revenus',
            style:
                GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 14),
            textAlign: TextAlign.center,
          ),
        ),
      ),
      data: (paginated) {
        if (paginated.data.isEmpty) {
          return const SingleChildScrollView(
            child: Padding(
              padding: EdgeInsets.only(top: 40),
              child: EmptyState(
                icon: Icons.payments_outlined,
                title: 'Aucun revenu',
                subtitle: 'Ajoutez votre premier revenu',
              ),
            ),
          );
        }

        return ListView.separated(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 100),
          itemCount: paginated.data.length,
          separatorBuilder: (_, __) => const Gap(10),
          itemBuilder: (context, index) {
            final income = paginated.data[index];
            return _IncomeItem(income: income)
                .animate()
                .fadeIn(
                  duration: 350.ms,
                  delay: Duration(milliseconds: index * 40),
                )
                .slideY(
                  begin: 0.06,
                  curve: Curves.easeOutCubic,
                  duration: 350.ms,
                  delay: Duration(milliseconds: index * 40),
                );
          },
        );
      },
    );
  }
}

class _IncomeItem extends ConsumerWidget {
  final FinanceIncome income;

  const _IncomeItem({required this.income});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currency = ref.watch(currencyProvider);
    return Dismissible(
      key: ValueKey('income_${income.id}'),
      direction: DismissDirection.endToStart,
      confirmDismiss: (_) async {
        return await ConfirmDialog.show(
          context,
          title: 'Supprimer le revenu',
          message:
              'Voulez-vous supprimer "${income.label}" ? Cette action est irréversible.',
          confirmLabel: 'Supprimer',
          isDangerous: true,
        );
      },
      onDismissed: (_) async {
        await ref.read(deleteIncomeProvider.notifier).deleteIncome(income.id);
      },
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        decoration: BoxDecoration(
          color: AppColors.brand.withValues(alpha: 0.15),
          borderRadius: BorderRadius.circular(14),
        ),
        child: const Icon(Icons.delete_outline_rounded,
            color: AppColors.brand, size: 24),
      ),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.borderBright),
        ),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: AppColors.emerald.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                    color: AppColors.emerald.withValues(alpha: 0.25)),
              ),
              child: const Icon(Icons.payments_outlined,
                  color: AppColors.emerald, size: 22),
            ),
            const Gap(12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    income.label,
                    style: GoogleFonts.poppins(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textPrimary,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                  const Gap(2),
                  Text(
                    income.date,
                    style: GoogleFonts.poppins(
                      fontSize: 11,
                      color: AppColors.textMuted,
                    ),
                  ),
                ],
              ),
            ),
            Text(
              '+ ${CurrencyUtils.formatAmount(income.amount, currency: currency)}',
              style: GoogleFonts.poppins(
                fontSize: 14,
                fontWeight: FontWeight.w700,
                color: AppColors.emerald,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
