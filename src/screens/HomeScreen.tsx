import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { vi } from 'date-fns/locale';
import { TransactionService } from '../services/storage';
import { Transaction, TransactionType, Summary } from '../types';
import { COLORS, CATEGORY_INFO } from '../utils/constants';

interface HomeScreenProps {
  navigation: any;
  route: any;
}

export default function HomeScreen({ navigation, route }: HomeScreenProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<Summary>({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    period: '',
  });
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Kiểm tra xem có phải trang Home không
  const isHomePage = route?.name === 'Home';

  useEffect(() => {
    loadData();
    
    // Lắng nghe sự kiện khi quay lại màn hình
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    
    return unsubscribe;
  }, [navigation]);

  const loadData = async () => {
    console.log('HomeScreen: Loading data...');
    const start = startOfMonth(new Date());
    const end = endOfMonth(new Date());
    const data = await TransactionService.getByDateRange(start, end);
    console.log('HomeScreen: Loaded transactions:', data.length);
    
    const income = data
      .filter(t => t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expense = data
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + t.amount, 0);
    
    setSummary({
      totalIncome: income,
      totalExpense: expense,
      balance: income - expense,
      period: format(new Date(), 'MMMM yyyy', { locale: vi }),
    });
    
    // Sắp xếp theo ngày mới nhất
    data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setTransactions(data.slice(0, 5)); // Chỉ hiển thị 5 giao dịch gần nhất
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Tổng quan */}
      <View style={styles.summaryCard}>
        <Text style={styles.periodText}>{summary.period}</Text>
        
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceLabel}>Số dư</Text>
          <Text style={[
            styles.balanceAmount,
            { color: summary.balance >= 0 ? COLORS.success : COLORS.error }
          ]}>
            {formatCurrency(summary.balance)}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Thu nhập</Text>
            <Text style={[styles.summaryValue, { color: COLORS.income }]}>
              {formatCurrency(summary.totalIncome)}
            </Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Chi tiêu</Text>
            <Text style={[styles.summaryValue, { color: COLORS.expense }]}>
              {formatCurrency(summary.totalExpense)}
            </Text>
          </View>
        </View>
      </View>

      {/* Thêm giao dịch nhanh - chỉ hiển thị ở trang Home */}
      {isHomePage && (
        <>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: COLORS.income }]}
              onPress={() => navigation.navigate('AddTransaction', { type: TransactionType.INCOME })}
            >
              <Text style={styles.actionIcon}>+</Text>
              <Text style={styles.actionText}>Thu nhập</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: COLORS.expense }]}
              onPress={() => navigation.navigate('AddTransaction', { type: TransactionType.EXPENSE })}
            >
              <Text style={styles.actionIcon}>-</Text>
              <Text style={styles.actionText}>Chi tiêu</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.quickActions, { paddingTop: 0 }]}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#FFB300' }]}
              onPress={() => navigation.navigate('AddTransaction', { type: TransactionType.INCOME, isSavings: true })}
            >
              <Text style={styles.actionIcon}>💰</Text>
              <Text style={styles.actionText}>Tiết kiệm / Đầu tư</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Giao dịch gần đây - chỉ hiển thị ở trang Home */}
      {isHomePage && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Giao dịch gần đây</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
              <Text style={styles.seeAllText}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>

          {transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Chưa có giao dịch nào</Text>
              <Text style={styles.emptySubtext}>Bắt đầu bằng cách thêm thu nhập hoặc chi tiêu</Text>
            </View>
          ) : (
            transactions.map(transaction => {
              const categoryInfo = CATEGORY_INFO[transaction.category];
              return (
                <TouchableOpacity 
                  key={transaction.id} 
                  style={styles.transactionItem}
                  onPress={() => navigation.navigate('TransactionDetail', { transaction })}
                >
                  <View style={styles.transactionLeft}>
                    <View style={[
                      styles.iconContainer,
                      { backgroundColor: categoryInfo.color + '20' }
                    ]}>
                      <Text style={styles.icon}>{categoryInfo.icon}</Text>
                    </View>
                    <View>
                      <Text style={styles.transactionCategory}>{categoryInfo.label}</Text>
                      <Text style={styles.transactionDate}>
                        {format(new Date(transaction.date), 'dd/MM/yyyy')}
                      </Text>
                    </View>
                  </View>
                  
                  <Text style={[
                    styles.transactionAmount,
                    {
                      color: transaction.type === TransactionType.INCOME
                        ? COLORS.income
                        : COLORS.expense
                    }
                  ]}>
                    {transaction.type === TransactionType.INCOME ? '+' : '-'}
                    {formatCurrency(transaction.amount)}
                  </Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      )}

      {/* Nội dung cho các trang khác */}
      {!isHomePage && (
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderIcon}>
            {route?.name === 'Budget' && '📊'}
            {route?.name === 'Reports' && '📈'}
            {route?.name === 'Reminders' && '🔔'}
          </Text>
          <Text style={styles.placeholderTitle}>
            {route?.name === 'Budget' && 'Ngân sách'}
            {route?.name === 'Reports' && 'Báo cáo'}
            {route?.name === 'Reminders' && 'Nhắc nhở'}
          </Text>
          <Text style={styles.placeholderText}>
            Tính năng đang được phát triển
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  summaryCard: {
    backgroundColor: COLORS.primary,
    padding: 24,
    paddingTop: 60,
    paddingBottom: 32,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  periodText: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.9,
    textTransform: 'capitalize',
  },
  balanceContainer: {
    marginTop: 16,
    marginBottom: 24,
  },
  balanceLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.9,
  },
  balanceAmount: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: 'bold',
    marginTop: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    opacity: 0.9,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 4,
    color: '#FFFFFF',
  },
  quickActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionIcon: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  seeAllText: {
    color: COLORS.primary,
    fontSize: 14,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 24,
  },
  transactionCategory: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
  },
  transactionDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  placeholderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginTop: 60,
  },
  placeholderIcon: {
    fontSize: 80,
    marginBottom: 24,
  },
  placeholderTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  placeholderText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
