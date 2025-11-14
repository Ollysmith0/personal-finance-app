import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { startOfMonth, endOfMonth } from 'date-fns';
import { TransactionService, ReminderService } from '../services/storage';
import { Transaction, TransactionType, TransactionCategory, ReminderType } from '../types';
import { COLORS, CATEGORY_INFO } from '../utils/constants';

interface AddTransactionScreenProps {
  navigation: any;
  route: any;
}

export default function AddTransactionScreen({ navigation, route }: AddTransactionScreenProps) {
  const transactionType = route.params?.type || TransactionType.EXPENSE;
  const isSavings = route.params?.isSavings || false;
  
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TransactionCategory | null>(
    isSavings ? TransactionCategory.INVESTMENT : null
  );
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Lọc danh mục theo loại giao dịch
  const getCategories = () => {
    const allCategories = Object.values(TransactionCategory);
    
    // Nếu là Tiết kiệm/Đầu tư, chỉ hiển thị INVESTMENT
    if (isSavings) {
      return allCategories.filter(cat => cat === 'INVESTMENT');
    }
    
    if (transactionType === TransactionType.INCOME) {
      return allCategories.filter(cat => 
        ['SALARY', 'BONUS', 'INVESTMENT', 'OTHER_INCOME'].includes(cat)
      );
    } else {
      return allCategories.filter(cat => 
        ['FOOD', 'TRANSPORT', 'SHOPPING', 'ENTERTAINMENT', 'BILLS', 'HEALTHCARE', 'EDUCATION', 'OTHER_EXPENSE'].includes(cat)
      );
    }
  };

  const categories = getCategories();

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const newDate = new Date(date);
      newDate.setHours(selectedTime.getHours());
      newDate.setMinutes(selectedTime.getMinutes());
      setDate(newDate);
    }
  };

  const handleSave = async () => {
    // Validate
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập số tiền hợp lệ');
      return;
    }

    if (!selectedCategory) {
      Alert.alert('Lỗi', 'Vui lòng chọn danh mục');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập mô tả');
      return;
    }

    // Check expense limit warnings before saving
    if (transactionType === TransactionType.EXPENSE && selectedCategory) {
      const warning = await checkExpenseLimit(selectedCategory, parseFloat(amount));
      if (warning) {
        Alert.alert(
          '⚠️ Cảnh báo chi tiêu',
          warning,
          [
            { text: 'Hủy', style: 'cancel' },
            { text: 'Vẫn lưu', onPress: () => saveTransaction() }
          ]
        );
        return;
      }
    }

    await saveTransaction();
  };

  const checkExpenseLimit = async (category: TransactionCategory, newAmount: number): Promise<string | null> => {
    try {
      // Get all reminders
      const reminders = await ReminderService.getAll();
      
      // Find expense limit reminder for this category
      const expenseReminder = reminders.find(r => 
        r.type === ReminderType.EXPENSE_LIMIT && 
        r.category === category &&
        !r.isCompleted &&
        r.maxAmount
      );

      if (!expenseReminder || !expenseReminder.maxAmount) {
        return null;
      }

      // Get current month transactions
      const monthStart = startOfMonth(new Date());
      const monthEnd = endOfMonth(new Date());
      const transactions = await TransactionService.getByDateRange(monthStart, monthEnd);
      
      // Calculate current expense for this category
      const currentExpense = transactions
        .filter(t => t.type === TransactionType.EXPENSE && t.category === category)
        .reduce((sum, t) => sum + t.amount, 0);

      // Calculate total after adding new transaction
      const totalAfter = currentExpense + newAmount;
      const limit = expenseReminder.maxAmount;
      const categoryInfo = CATEGORY_INFO[category];

      if (totalAfter > limit) {
        const over = totalAfter - limit;
        return `Chi tiêu ${categoryInfo.label} sẽ vượt quá giới hạn ${formatCurrency(limit)}!\n\nHiện tại: ${formatCurrency(currentExpense)}\nSau khi thêm: ${formatCurrency(totalAfter)}\nVượt quá: ${formatCurrency(over)}`;
      } else if (totalAfter >= limit * 0.8) {
        const percent = ((totalAfter / limit) * 100).toFixed(0);
        return `Chi tiêu ${categoryInfo.label} sắp đạt giới hạn!\n\nHiện tại: ${formatCurrency(currentExpense)}\nSau khi thêm: ${formatCurrency(totalAfter)}\nGiới hạn: ${formatCurrency(limit)}\n\nĐã đạt ${percent}% giới hạn`;
      }

      return null;
    } catch (error) {
      console.error('Error checking expense limit:', error);
      return null;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const saveTransaction = async () => {
    try {
      const transaction: Transaction = {
        id: Date.now().toString(),
        type: transactionType,
        category: selectedCategory!,
        amount: parseFloat(amount),
        description: description.trim(),
        date: date,
        createdAt: new Date(),
      };

      console.log('Saving transaction:', transaction);
      await TransactionService.add(transaction);
      console.log('Transaction saved successfully');
      
      // Reset form
      setAmount('');
      setDescription('');
      setSelectedCategory(isSavings ? TransactionCategory.INVESTMENT : null);
      setDate(new Date());
      
      Alert.alert(
        'Thành công',
        'Đã thêm giao dịch thành công',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể lưu giao dịch. Vui lòng thử lại.');
      console.error('Error saving transaction:', error);
    }
  };

  const formatAmountDisplay = (text: string) => {
    // Remove non-numeric characters except decimal point
    const cleaned = text.replace(/[^0-9]/g, '');
    if (!cleaned) return '';
    
    // Format with thousand separators
    const number = parseInt(cleaned);
    return new Intl.NumberFormat('vi-VN').format(number);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {isSavings ? 'Thêm Tiết Kiệm / Đầu Tư' : (transactionType === TransactionType.INCOME ? 'Thêm Thu Nhập' : 'Thêm Chi Tiêu')}
        </Text>
        <View style={[
          styles.typeIndicator,
          { backgroundColor: isSavings ? '#FFB300' : (transactionType === TransactionType.INCOME ? COLORS.income : COLORS.expense) }
        ]}>
          <Text style={styles.typeText}>
            {isSavings ? 'Tiết kiệm / Đầu tư' : (transactionType === TransactionType.INCOME ? 'Thu nhập' : 'Chi tiêu')}
          </Text>
        </View>
      </View>

      {/* Số tiền */}
      <View style={styles.section}>
        <Text style={styles.label}>Số tiền *</Text>
        <View style={styles.amountContainer}>
          <TextInput
            style={styles.amountInput}
            placeholder="0"
            placeholderTextColor={COLORS.textSecondary}
            keyboardType="numeric"
            value={amount}
            onChangeText={(text) => {
              const cleaned = text.replace(/[^0-9]/g, '');
              setAmount(cleaned);
            }}
          />
          <Text style={styles.currency}>VND</Text>
        </View>
        {amount ? (
          <Text style={styles.amountDisplay}>
            {formatAmountDisplay(amount)} đ
          </Text>
        ) : null}
      </View>

      {/* Danh mục */}
      <View style={styles.section}>
        <Text style={styles.label}>Danh mục *</Text>
        <View style={styles.categoryGrid}>
          {categories.map((category) => {
            const categoryInfo = CATEGORY_INFO[category];
            const isSelected = selectedCategory === category;
            return (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryItem,
                  isSelected && {
                    backgroundColor: categoryInfo.color + '30',
                    borderColor: categoryInfo.color,
                  }
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text style={styles.categoryIcon}>{categoryInfo.icon}</Text>
                <Text style={[
                  styles.categoryLabel,
                  isSelected && { color: categoryInfo.color, fontWeight: '600' }
                ]}>
                  {categoryInfo.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Mô tả */}
      <View style={styles.section}>
        <Text style={styles.label}>Mô tả *</Text>
        <TextInput
          style={styles.descriptionInput}
          placeholder="Nhập mô tả cho giao dịch này..."
          placeholderTextColor={COLORS.textSecondary}
          multiline
          numberOfLines={3}
          value={description}
          onChangeText={setDescription}
        />
      </View>

      {/* Ngày */}
      <View style={styles.section}>
        <Text style={styles.label}>Ngày giao dịch</Text>
        
        <TouchableOpacity
          style={styles.dateTimeButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.dateTimeLabel}>📅 Ngày</Text>
          <Text style={styles.dateTimeValue}>
            {date.toLocaleDateString('vi-VN', {
              weekday: 'short',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dateTimeButton}
          onPress={() => setShowTimePicker(true)}
        >
          <Text style={styles.dateTimeLabel}>🕐 Giờ</Text>
          <Text style={styles.dateTimeValue}>
            {date.toLocaleTimeString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onDateChange}
            maximumDate={new Date()}
            locale="vi-VN"
          />
        )}

        {showTimePicker && (
          <DateTimePicker
            value={date}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onTimeChange}
            locale="vi-VN"
          />
        )}
      </View>

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>Hủy</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.saveButton,
            { backgroundColor: transactionType === TransactionType.INCOME ? COLORS.income : COLORS.expense }
          ]}
          onPress={handleSave}
        >
          <Text style={styles.saveButtonText}>Lưu giao dịch</Text>
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
    padding: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  typeIndicator: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  typeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    padding: 20,
    paddingTop: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
    paddingVertical: 16,
  },
  currency: {
    fontSize: 18,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  amountDisplay: {
    marginTop: 8,
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryItem: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  categoryIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  categoryLabel: {
    fontSize: 12,
    color: COLORS.text,
    textAlign: 'center',
  },
  descriptionInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 2,
    borderColor: COLORS.border,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  dateTimeButton: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: COLORS.border,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateTimeLabel: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  dateTimeValue: {
    fontSize: 16,
    color: COLORS.text,
    textTransform: 'capitalize',
  },
  dateContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  dateText: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  dateNote: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  cancelButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 2,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 40,
  },
});
