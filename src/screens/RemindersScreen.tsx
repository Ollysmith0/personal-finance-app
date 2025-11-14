import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, startOfMonth, endOfMonth, differenceInDays, endOfDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import { ReminderService, TransactionService } from '../services/storage';
import { Reminder, ReminderType, TransactionCategory, TransactionType } from '../types';
import { COLORS, CATEGORY_INFO } from '../utils/constants';

interface RemindersScreenProps {
  navigation: any;
}

export default function RemindersScreen({ navigation }: RemindersScreenProps) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [warnings, setWarnings] = useState<{[key: string]: string}>({});
  
  // Form states
  const [reminderType, setReminderType] = useState<ReminderType>(ReminderType.GENERAL);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TransactionCategory | null>(null);
  const [dueDate, setDueDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    loadData();

    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });

    return unsubscribe;
  }, [navigation]);

  const loadData = async () => {
    const data = await ReminderService.getAll();
    // Sắp xếp theo ngày đến hạn
    data.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    setReminders(data);
    
    // Check warnings
    await checkWarnings(data);
  };

  const checkWarnings = async (reminders: Reminder[]) => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const daysUntilMonthEnd = differenceInDays(endOfDay(monthEnd), now);
    
    // Get transactions for current month
    const transactions = await TransactionService.getByDateRange(monthStart, monthEnd);
    const newWarnings: {[key: string]: string} = {};
    
    for (const reminder of reminders) {
      if (reminder.isCompleted) continue;
      
      // Check expense limit warnings
      if (reminder.type === ReminderType.EXPENSE_LIMIT && reminder.category && reminder.maxAmount) {
        const categoryExpense = transactions
          .filter(t => t.type === TransactionType.EXPENSE && t.category === reminder.category)
          .reduce((sum, t) => sum + t.amount, 0);
        
        if (categoryExpense > reminder.maxAmount) {
          const categoryInfo = CATEGORY_INFO[reminder.category];
          newWarnings[reminder.id] = `⚠️ Chi tiêu ${categoryInfo.label} đã vượt quá ${formatCurrency(reminder.maxAmount)}! Hiện tại: ${formatCurrency(categoryExpense)}`;
        } else if (categoryExpense >= reminder.maxAmount * 0.8) {
          const categoryInfo = CATEGORY_INFO[reminder.category];
          newWarnings[reminder.id] = `⚡ Chi tiêu ${categoryInfo.label} sắp đạt giới hạn (${((categoryExpense / reminder.maxAmount) * 100).toFixed(0)}%)`;
        }
      }
      
      // Check savings target warnings (3 days before month end)
      if (reminder.type === ReminderType.SAVINGS_TARGET && reminder.minAmount && daysUntilMonthEnd <= 3 && daysUntilMonthEnd >= 0) {
        const savings = transactions
          .filter(t => t.type === TransactionType.INCOME && t.category === TransactionCategory.INVESTMENT)
          .reduce((sum, t) => sum + t.amount, 0);
        
        if (savings < reminder.minAmount) {
          const remaining = reminder.minAmount - savings;
          newWarnings[reminder.id] = `⏰ Còn ${daysUntilMonthEnd} ngày! Cần tiết kiệm thêm ${formatCurrency(remaining)} để đạt mục tiêu`;
        }
      }
    }
    
    setWarnings(newWarnings);
    
    // Don't show alert popup anymore - warnings will be shown in AddTransactionScreen
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tiêu đề');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập chi tiết');
      return;
    }

    // Validate based on reminder type
    if (reminderType === ReminderType.EXPENSE_LIMIT) {
      if (!maxAmount) {
        Alert.alert('Lỗi', 'Vui lòng nhập số tiền tối đa');
        return;
      }
      if (!selectedCategory) {
        Alert.alert('Lỗi', 'Vui lòng chọn danh mục');
        return;
      }
    }

    if (reminderType === ReminderType.SAVINGS_TARGET) {
      if (!minAmount) {
        Alert.alert('Lỗi', 'Vui lòng nhập số tiền tối thiểu');
        return;
      }
    }

    try {
      const reminder: Reminder = {
        id: Date.now().toString(),
        type: reminderType,
        title: title.trim(),
        description: description.trim(),
        amount: amount ? parseFloat(amount) : undefined,
        minAmount: minAmount ? parseFloat(minAmount) : undefined,
        maxAmount: maxAmount ? parseFloat(maxAmount) : undefined,
        category: selectedCategory || undefined,
        dueDate: dueDate,
        isRecurring: false,
        isCompleted: false,
      };

      await ReminderService.add(reminder);
      
      // Reset form
      setReminderType(ReminderType.GENERAL);
      setTitle('');
      setDescription('');
      setAmount('');
      setMinAmount('');
      setMaxAmount('');
      setSelectedCategory(null);
      setDueDate(new Date());
      setShowModal(false);
      
      await loadData();
      Alert.alert('Thành công', 'Đã thêm lời nhắc');
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể lưu lời nhắc');
      console.error('Error saving reminder:', error);
    }
  };

  const handleToggleComplete = async (reminder: Reminder) => {
    try {
      await ReminderService.update(reminder.id, { isCompleted: !reminder.isCompleted });
      await loadData();
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể cập nhật');
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      'Xác nhận xóa',
      'Bạn có chắc muốn xóa lời nhắc này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            await ReminderService.delete(id);
            await loadData();
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

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDueDate(selectedDate);
    }
  };

  const formatNumberInput = (text: string) => {
    // Remove all non-digit characters
    const cleaned = text.replace(/[^0-9]/g, '');
    if (!cleaned) return '';
    
    // Format with thousand separators
    return new Intl.NumberFormat('vi-VN').format(parseInt(cleaned));
  };

  const handleAmountChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    setAmount(cleaned);
  };

  const handleMinAmountChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    setMinAmount(cleaned);
  };

  const handleMaxAmountChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    setMaxAmount(cleaned);
  };

  const getStatusColor = (reminder: Reminder) => {
    if (reminder.isCompleted) return COLORS.success;
    const now = new Date();
    const due = new Date(reminder.dueDate);
    if (due < now) return COLORS.error;
    return COLORS.warning;
  };

  const getStatusText = (reminder: Reminder) => {
    if (reminder.isCompleted) return 'Đã hoàn thành';
    const now = new Date();
    const due = new Date(reminder.dueDate);
    if (due < now) return 'Quá hạn';
    return 'Chưa hoàn thành';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Nhắc nhở</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowModal(true)}
        >
          <Text style={styles.addButtonText}>+ Thêm</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {reminders.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyText}>Chưa có lời nhắc nào</Text>
            <Text style={styles.emptySubtext}>
              Thêm lời nhắc để không quên các khoản chi tiêu quan trọng
            </Text>
          </View>
        ) : (
          reminders.map((reminder) => (
            <View key={reminder.id} style={styles.reminderCard}>
              {/* Warning badge */}
              {warnings[reminder.id] && (
                <View style={styles.warningBanner}>
                  <Text style={styles.warningText}>{warnings[reminder.id]}</Text>
                </View>
              )}
              
              <View style={styles.reminderHeader}>
                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() => handleToggleComplete(reminder)}
                >
                  {reminder.isCompleted && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
                
                <View style={styles.reminderInfo}>
                  <Text
                    style={[
                      styles.reminderTitle,
                      reminder.isCompleted && styles.completedText,
                    ]}
                  >
                    {reminder.title}
                  </Text>
                  
                  <Text style={styles.reminderDescription} numberOfLines={2}>
                    {reminder.description}
                  </Text>
                  
                  <View style={styles.reminderMeta}>
                    <Text style={styles.reminderDate}>
                      📅 {format(new Date(reminder.dueDate), 'dd/MM/yyyy', { locale: vi })}
                    </Text>
                    
                    {reminder.amount && (
                      <Text style={styles.reminderAmount} numberOfLines={1}>
                        💰 {formatCurrency(reminder.amount)}
                      </Text>
                    )}
                  </View>

                  {(reminder.minAmount || reminder.maxAmount || reminder.category) && (
                    <View style={styles.reminderMetaSecondary}>
                      {reminder.minAmount && (
                        <Text style={styles.reminderAmount} numberOfLines={1}>
                          ⬆️ Tối thiểu: {formatCurrency(reminder.minAmount)}
                        </Text>
                      )}

                      {reminder.maxAmount && (
                        <Text style={styles.reminderAmount} numberOfLines={1}>
                          ⬇️ Tối đa: {formatCurrency(reminder.maxAmount)}
                        </Text>
                      )}

                      {reminder.category && (
                        <Text style={styles.reminderCategory} numberOfLines={1}>
                          {CATEGORY_INFO[reminder.category].icon} {CATEGORY_INFO[reminder.category].label}
                        </Text>
                      )}
                    </View>
                  )}
                  
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(reminder) + '20' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: getStatusColor(reminder) },
                      ]}
                    >
                      {getStatusText(reminder)}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDelete(reminder.id)}
                >
                  <Text style={styles.deleteText}>Xóa</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Modal thêm lời nhắc */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Thêm lời nhắc</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.label}>Loại lời nhắc *</Text>
              <View style={styles.typeSelector}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    reminderType === ReminderType.GENERAL && styles.typeButtonActive,
                  ]}
                  onPress={() => setReminderType(ReminderType.GENERAL)}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      reminderType === ReminderType.GENERAL && styles.typeButtonTextActive,
                    ]}
                  >
                    Chung
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    reminderType === ReminderType.EXPENSE_LIMIT && styles.typeButtonActive,
                  ]}
                  onPress={() => setReminderType(ReminderType.EXPENSE_LIMIT)}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      reminderType === ReminderType.EXPENSE_LIMIT && styles.typeButtonTextActive,
                    ]}
                  >
                    Giới hạn chi tiêu
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    reminderType === ReminderType.SAVINGS_TARGET && styles.typeButtonActive,
                  ]}
                  onPress={() => setReminderType(ReminderType.SAVINGS_TARGET)}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      reminderType === ReminderType.SAVINGS_TARGET && styles.typeButtonTextActive,
                    ]}
                  >
                    Mục tiêu tiết kiệm
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Tiêu đề *</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder={
                  reminderType === ReminderType.GENERAL 
                    ? "VD: Đóng tiền điện"
                    : reminderType === ReminderType.EXPENSE_LIMIT
                    ? "VD: Giới hạn chi tiêu ăn uống"
                    : "VD: Tiết kiệm mua nhà"
                }
                placeholderTextColor={COLORS.textSecondary}
              />

              <Text style={styles.label}>Chi tiết *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder={
                  reminderType === ReminderType.GENERAL
                    ? "VD: Đóng tiền điện tháng 11"
                    : reminderType === ReminderType.EXPENSE_LIMIT
                    ? "VD: Nhắc nhở khi chi tiêu ăn uống vượt quá giới hạn"
                    : "VD: Mục tiêu tiết kiệm mỗi tháng cho kế hoạch mua nhà"
                }
                placeholderTextColor={COLORS.textSecondary}
                multiline
                numberOfLines={3}
              />

              {reminderType === ReminderType.GENERAL && (
                <>
                  <Text style={styles.label}>Số tiền (tùy chọn)</Text>
                  <TextInput
                    style={styles.input}
                    value={formatNumberInput(amount)}
                    onChangeText={handleAmountChange}
                    placeholder="0"
                    placeholderTextColor={COLORS.textSecondary}
                    keyboardType="numeric"
                  />
                </>
              )}

              {reminderType === ReminderType.EXPENSE_LIMIT && (
                <>
                  <Text style={styles.label}>Danh mục *</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                    {Object.values(TransactionCategory)
                      .filter(cat => 
                        ['FOOD', 'TRANSPORT', 'SHOPPING', 'ENTERTAINMENT', 'BILLS', 'HEALTHCARE', 'EDUCATION', 'OTHER_EXPENSE'].includes(cat)
                      )
                      .map((category) => {
                        const info = CATEGORY_INFO[category];
                        return (
                          <TouchableOpacity
                            key={category}
                            style={[
                              styles.categoryButton,
                              selectedCategory === category && styles.categoryButtonActive,
                            ]}
                            onPress={() => setSelectedCategory(category)}
                          >
                            <Text style={styles.categoryIcon}>{info.icon}</Text>
                            <Text style={styles.categoryLabel}>{info.label}</Text>
                          </TouchableOpacity>
                        );
                      })}
                  </ScrollView>

                  <Text style={styles.label}>Số tiền tối đa *</Text>
                  <TextInput
                    style={styles.input}
                    value={formatNumberInput(maxAmount)}
                    onChangeText={handleMaxAmountChange}
                    placeholder="VD: 1,000,000"
                    placeholderTextColor={COLORS.textSecondary}
                    keyboardType="numeric"
                  />
                </>
              )}

              {reminderType === ReminderType.SAVINGS_TARGET && (
                <>
                  <Text style={styles.label}>Số tiền tối thiểu *</Text>
                  <TextInput
                    style={styles.input}
                    value={formatNumberInput(minAmount)}
                    onChangeText={handleMinAmountChange}
                    placeholder="VD: 5,000,000"
                    placeholderTextColor={COLORS.textSecondary}
                    keyboardType="numeric"
                  />
                </>
              )}

              <Text style={styles.label}>Ngày nhắc *</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateButtonText}>
                  📅 {format(dueDate, 'dd/MM/yyyy', { locale: vi })}
                </Text>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={dueDate}
                  mode="date"
                  display="default"
                  onChange={onDateChange}
                  locale="vi"
                />
              )}

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
              >
                <Text style={styles.saveButtonText}>Lưu lời nhắc</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: COLORS.primary,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  addButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    padding: 48,
    marginTop: 60,
  },
  emptyIcon: {
    fontSize: 80,
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
  reminderCard: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  warningBanner: {
    backgroundColor: '#FFF3CD',
    borderLeftWidth: 4,
    borderLeftColor: '#FFA500',
    padding: 12,
    marginBottom: 12,
    borderRadius: 6,
  },
  warningText: {
    fontSize: 13,
    color: '#856404',
    lineHeight: 18,
  },
  reminderHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  reminderInfo: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: COLORS.textSecondary,
  },
  reminderDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  reminderMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 10,
  },
  reminderMetaSecondary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 10,
  },
  reminderDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  reminderAmount: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  reminderCategory: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    padding: 4,
  },
  deleteText: {
    fontSize: 14,
    color: COLORS.error,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  closeButton: {
    fontSize: 24,
    color: COLORS.textSecondary,
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: COLORS.text,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  dateButton: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
  },
  dateButtonText: {
    fontSize: 16,
    color: COLORS.text,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 20,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  typeButton: {
    flex: 1,
    padding: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  typeButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  typeButtonText: {
    fontSize: 11,
    color: COLORS.text,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 14,
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  categoryScroll: {
    marginBottom: 16,
  },
  categoryButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    marginRight: 8,
    minWidth: 80,
  },
  categoryButtonActive: {
    backgroundColor: COLORS.primary + '20',
    borderColor: COLORS.primary,
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  categoryLabel: {
    fontSize: 11,
    color: COLORS.text,
    textAlign: 'center',
  },
});
