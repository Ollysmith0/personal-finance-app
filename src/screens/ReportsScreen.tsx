import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, subMonths } from 'date-fns';
import { vi } from 'date-fns/locale';
import { TransactionService } from '../services/storage';
import { Transaction, TransactionType, TransactionCategory } from '../types';
import { COLORS } from '../utils/constants';

const screenWidth = Dimensions.get('window').width;

interface ReportsScreenProps {
  navigation: any;
}

export default function ReportsScreen({ navigation }: ReportsScreenProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [chartData, setChartData] = useState<any>(null);

  useEffect(() => {
    loadData();

    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });

    return unsubscribe;
  }, [navigation]);

  const loadData = async () => {
    const start = startOfMonth(new Date());
    const end = endOfMonth(new Date());
    const data = await TransactionService.getByDateRange(start, end);
    setTransactions(data);
    calculateChartData(data, start, end);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const calculateChartData = (transactions: Transaction[], start: Date, end: Date) => {
    // Lấy các ngày trong tháng
    const days = eachDayOfInterval({ start, end });
    const labels: string[] = [];
    const incomeData: number[] = [];
    const expenseData: number[] = [];
    const savingsData: number[] = [];

    // Tính tổng lũy kế theo ngày
    let cumulativeIncome = 0;
    let cumulativeExpense = 0;

    days.forEach((day, index) => {
      // Lấy label: hiển thị ngày 1, 7, 14, 21, 28
      if ([1, 7, 14, 21, 28].includes(day.getDate())) {
        labels.push(format(day, 'd'));
      } else if (index === days.length - 1) {
        labels.push(format(day, 'd'));
      } else {
        labels.push('');
      }

      // Tính giao dịch trong ngày
      const dayTransactions = transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate.toDateString() === day.toDateString();
      });

      const dayIncome = dayTransactions
        .filter(t => t.type === TransactionType.INCOME)
        .reduce((sum, t) => sum + t.amount, 0);

      const dayExpense = dayTransactions
        .filter(t => t.type === TransactionType.EXPENSE)
        .reduce((sum, t) => sum + t.amount, 0);

      // Tính tiết kiệm/đầu tư trong ngày
      const daySavings = dayTransactions
        .filter(t => 
          t.type === TransactionType.INCOME && 
          (t.category === TransactionCategory.INVESTMENT)
        )
        .reduce((sum, t) => sum + t.amount, 0);

      cumulativeIncome += dayIncome;
      cumulativeExpense += dayExpense;

      // Chuyển sang đơn vị triệu đồng để dễ đọc
      incomeData.push(cumulativeIncome / 1000000);
      expenseData.push(cumulativeExpense / 1000000);
      savingsData.push(daySavings / 1000000);
    });

    setChartData({
      labels,
      datasets: [
        {
          data: incomeData,
          color: () => COLORS.income,
          strokeWidth: 3,
        },
        {
          data: expenseData,
          color: () => COLORS.expense,
          strokeWidth: 3,
        },
        {
          data: savingsData,
          color: () => '#FFB300',
          strokeWidth: 2,
        },
      ],
      legend: ['Thu nhập', 'Chi tiêu', 'Đầu tư'],
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatShortCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}tr`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)}k`;
    }
    return `${amount}`;
  };

  const totalIncome = transactions
    .filter(t => t.type === TransactionType.INCOME)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalSavings = transactions
    .filter(t => 
      t.type === TransactionType.INCOME && 
      t.category === TransactionCategory.INVESTMENT
    )
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Báo cáo tài chính</Text>
        <Text style={styles.headerSubtitle}>
          {format(new Date(), 'MMMM yyyy', { locale: vi })}
        </Text>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={[styles.summaryCard, { backgroundColor: COLORS.income + '20' }]}>
          <Text style={styles.summaryLabel}>Thu nhập</Text>
          <Text style={[styles.summaryValue, { color: COLORS.income }]} numberOfLines={1} adjustsFontSizeToFit>
            {formatShortCurrency(totalIncome)}
          </Text>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: COLORS.expense + '20' }]}>
          <Text style={styles.summaryLabel}>Chi tiêu</Text>
          <Text style={[styles.summaryValue, { color: COLORS.expense }]} numberOfLines={1} adjustsFontSizeToFit>
            {formatShortCurrency(totalExpense)}
          </Text>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: '#FFB30020' }]}>
          <Text style={styles.summaryLabel}>Đầu tư</Text>
          <Text style={[styles.summaryValue, { color: '#FFB300' }]} numberOfLines={1} adjustsFontSizeToFit>
            {formatShortCurrency(totalSavings)}
          </Text>
        </View>
      </View>

      {/* Chart */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Biểu đồ lũy kế (Triệu VND)</Text>
        {chartData && (
          <LineChart
            data={chartData}
            width={screenWidth - 64}
            height={220}
            chartConfig={{
              backgroundColor: COLORS.surface,
              backgroundGradientFrom: COLORS.surface,
              backgroundGradientTo: COLORS.surface,
              decimalPlaces: 1,
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              labelColor: (opacity = 1) => COLORS.textSecondary,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '0',
              },
              propsForBackgroundLines: {
                strokeDasharray: '',
                stroke: COLORS.border,
                strokeWidth: 1,
              },
            }}
            bezier
            style={styles.chart}
            withInnerLines={true}
            withOuterLines={true}
            withVerticalLines={false}
            withHorizontalLines={true}
            withDots={false}
            withShadow={false}
          />
        )}
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: COLORS.income }]} />
            <Text style={styles.legendText}>Thu nhập</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: COLORS.expense }]} />
            <Text style={styles.legendText}>Chi tiêu</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#FFB300' }]} />
            <Text style={styles.legendText}>Đầu tư / Tiết kiệm</Text>
          </View>
        </View>
      </View>

      {/* Statistics */}
      <View style={styles.statsContainer}>
        <Text style={styles.statsTitle}>Thống kê</Text>
        
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Tổng số giao dịch</Text>
          <Text style={styles.statValue}>{transactions.length}</Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Số dư</Text>
          <Text style={[
            styles.statValue,
            { color: (totalIncome - totalExpense) >= 0 ? COLORS.income : COLORS.expense }
          ]}>
            {formatCurrency(totalIncome - totalExpense)}
          </Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Chi tiêu trung bình/ngày</Text>
          <Text style={styles.statValue}>
            {formatCurrency(totalExpense / new Date().getDate())}
          </Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Tỷ lệ tiết kiệm</Text>
          <Text style={[styles.statValue, { color: COLORS.income }]}>
            {totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome * 100).toFixed(1) : 0}%
          </Text>
        </View>
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 24,
    backgroundColor: COLORS.primary,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    textTransform: 'capitalize',
  },
  summaryContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    padding: 12,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 0,
  },
  summaryLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 6,
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  chartContainer: {
    padding: 16,
    paddingHorizontal: 16,
    backgroundColor: COLORS.surface,
    margin: 16,
    borderRadius: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    gap: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  legendText: {
    fontSize: 12,
    color: COLORS.text,
  },
  statsContainer: {
    padding: 16,
    backgroundColor: COLORS.surface,
    margin: 16,
    borderRadius: 16,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  bottomSpacer: {
    height: 40,
  },
});
