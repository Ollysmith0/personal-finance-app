import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { vi } from 'date-fns/locale';
import { TransactionService } from '../services/storage';
import { Transaction, TransactionType } from '../types';
import { COLORS, CATEGORY_INFO } from '../utils/constants';

interface TransactionsScreenProps {
  navigation: any;
}

export default function TransactionsScreen({ navigation }: TransactionsScreenProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [filter, setFilter] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');

  useEffect(() => {
    loadTransactions();
    
    // Lắng nghe sự kiện khi quay lại màn hình
    const unsubscribe = navigation.addListener('focus', () => {
      loadTransactions();
    });
    
    return unsubscribe;
  }, [navigation]);

  const loadTransactions = async () => {
    const start = startOfMonth(new Date());
    const end = endOfMonth(new Date());
    const data = await TransactionService.getByDateRange(start, end);
    // Sắp xếp theo ngày mới nhất
    data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setTransactions(data);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Xác nhận xóa',
      'Bạn có chắc chắn muốn xóa giao dịch này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await TransactionService.delete(id);
              await loadTransactions();
            } catch (error) {
              Alert.alert('Lỗi', 'Không thể xóa giao dịch');
            }
          },
        },
      ]
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const getFilteredTransactions = () => {
    if (filter === 'ALL') return transactions;
    if (filter === 'INCOME') {
      return transactions.filter(t => t.type === TransactionType.INCOME);
    }
    return transactions.filter(t => t.type === TransactionType.EXPENSE);
  };

  const filteredTransactions = getFilteredTransactions();

  const getTotalAmount = () => {
    return filteredTransactions.reduce((sum, t) => {
      if (t.type === TransactionType.INCOME) {
        return sum + t.amount;
      } else {
        return sum - t.amount;
      }
    }, 0);
  };

  const renderTransaction = ({ item }: { item: Transaction }) => {
    const categoryInfo = CATEGORY_INFO[item.category];
    return (
      <TouchableOpacity
        style={styles.transactionItem}
        onPress={() => navigation.navigate('TransactionDetail', { transaction: item })}
        onLongPress={() => handleDelete(item.id)}
      >
        <View style={styles.transactionLeft}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: categoryInfo.color + '20' },
            ]}
          >
            <Text style={styles.icon}>{categoryInfo.icon}</Text>
          </View>
          <View style={styles.transactionInfo}>
            <Text style={styles.transactionCategory}>{categoryInfo.label}</Text>
            <Text style={styles.transactionDescription} numberOfLines={1}>
              {item.description}
            </Text>
            <Text style={styles.transactionDate}>
              {format(new Date(item.date), 'dd/MM/yyyy HH:mm')}
            </Text>
          </View>
        </View>

        <Text
          style={[
            styles.transactionAmount,
            {
              color:
                item.type === TransactionType.INCOME
                  ? COLORS.income
                  : COLORS.expense,
            },
          ]}
        >
          {item.type === TransactionType.INCOME ? '+' : '-'}
          {formatCurrency(item.amount)}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header with summary */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Giao dịch tháng này</Text>
        <Text style={[
          styles.totalAmount,
          { color: getTotalAmount() >= 0 ? COLORS.income : COLORS.expense }
        ]}>
          {formatCurrency(getTotalAmount())}
        </Text>
      </View>

      {/* Filter buttons */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'ALL' && styles.filterButtonActive]}
          onPress={() => setFilter('ALL')}
        >
          <Text style={[styles.filterText, filter === 'ALL' && styles.filterTextActive]}>
            Tất cả ({transactions.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, filter === 'INCOME' && styles.filterButtonActive]}
          onPress={() => setFilter('INCOME')}
        >
          <Text style={[styles.filterText, filter === 'INCOME' && styles.filterTextActive]}>
            Thu nhập ({transactions.filter(t => t.type === TransactionType.INCOME).length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, filter === 'EXPENSE' && styles.filterButtonActive]}
          onPress={() => setFilter('EXPENSE')}
        >
          <Text style={[styles.filterText, filter === 'EXPENSE' && styles.filterTextActive]}>
            Chi tiêu ({transactions.filter(t => t.type === TransactionType.EXPENSE).length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Transactions list */}
      {filteredTransactions.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyText}>Chưa có giao dịch nào</Text>
          <Text style={styles.emptySubtext}>
            Bắt đầu bằng cách thêm thu nhập hoặc chi tiêu
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredTransactions}
          renderItem={renderTransaction}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      {/* Floating action button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddTransaction', { type: TransactionType.EXPENSE })}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: 20,
    backgroundColor: COLORS.primary,
    paddingTop: 60,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 8,
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
  },
  filterText: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    minHeight: 80,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
  transactionInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  transactionCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  transactionDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 12,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabIcon: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: '300',
  },
});
