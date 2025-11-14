import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { TransactionService } from '../services/storage';
import { Transaction, TransactionType } from '../types';
import { COLORS, CATEGORY_INFO } from '../utils/constants';

interface TransactionDetailScreenProps {
  navigation: any;
  route: any;
}

export default function TransactionDetailScreen({ navigation, route }: TransactionDetailScreenProps) {
  const transaction: Transaction = route.params?.transaction;

  if (!transaction) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Không tìm thấy giao dịch</Text>
      </View>
    );
  }

  const categoryInfo = CATEGORY_INFO[transaction.category];

  const handleDelete = () => {
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
              await TransactionService.delete(transaction.id);
              Alert.alert('Thành công', 'Đã xóa giao dịch', [
                {
                  text: 'OK',
                  onPress: () => navigation.goBack(),
                },
              ]);
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

  return (
    <ScrollView style={styles.container}>
      {/* Header với icon và số tiền */}
      <View
        style={[
          styles.header,
          {
            backgroundColor:
              transaction.type === TransactionType.INCOME
                ? COLORS.income
                : COLORS.expense,
          },
        ]}
      >
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: categoryInfo.color },
          ]}
        >
          <Text style={styles.icon}>{categoryInfo.icon}</Text>
        </View>
        <Text style={styles.categoryName}>{categoryInfo.label}</Text>
        <Text style={styles.amount}>
          {transaction.type === TransactionType.INCOME ? '+' : '-'}
          {formatCurrency(transaction.amount)}
        </Text>
        <Text style={styles.typeLabel}>
          {transaction.type === TransactionType.INCOME ? 'Thu nhập' : 'Chi tiêu'}
        </Text>
      </View>

      {/* Chi tiết giao dịch */}
      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>📝 Mô tả</Text>
          <Text style={styles.detailValue}>{transaction.description}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>📅 Ngày giao dịch</Text>
          <Text style={styles.detailValue}>
            {format(new Date(transaction.date), "EEEE, dd MMMM yyyy 'lúc' HH:mm", {
              locale: vi,
            })}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>🏷️ Danh mục</Text>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeIcon}>{categoryInfo.icon}</Text>
            <Text style={styles.categoryBadgeText}>{categoryInfo.label}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>🔖 Loại giao dịch</Text>
          <View
            style={[
              styles.typeBadge,
              {
                backgroundColor:
                  transaction.type === TransactionType.INCOME
                    ? COLORS.income + '20'
                    : COLORS.expense + '20',
              },
            ]}
          >
            <Text
              style={[
                styles.typeBadgeText,
                {
                  color:
                    transaction.type === TransactionType.INCOME
                      ? COLORS.income
                      : COLORS.expense,
                },
              ]}
            >
              {transaction.type === TransactionType.INCOME ? 'Thu nhập' : 'Chi tiêu'}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>🆔 Mã giao dịch</Text>
          <Text style={styles.detailValueSmall}>#{transaction.id}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>⏰ Thời gian tạo</Text>
          <Text style={styles.detailValue}>
            {format(new Date(transaction.createdAt), 'dd/MM/yyyy HH:mm:ss')}
          </Text>
        </View>
      </View>

      {/* Action buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>🗑️ Xóa giao dịch</Text>
        </TouchableOpacity>
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
    padding: 32,
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  icon: {
    fontSize: 40,
  },
  categoryName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  amount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  typeLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  detailsContainer: {
    backgroundColor: COLORS.surface,
    margin: 16,
    borderRadius: 16,
    padding: 20,
  },
  detailRow: {
    paddingVertical: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '400',
    textTransform: 'capitalize',
  },
  detailValueSmall: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: 'monospace',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: COLORS.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  categoryBadgeIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  categoryBadgeText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  typeBadgeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionContainer: {
    padding: 16,
  },
  deleteButton: {
    backgroundColor: COLORS.error,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 32,
  },
  bottomSpacer: {
    height: 40,
  },
});
