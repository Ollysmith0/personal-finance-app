import { TransactionCategory, CategoryInfo } from '../types';

// Thông tin danh mục
export const CATEGORY_INFO: Record<TransactionCategory, CategoryInfo> = {
  // Thu nhập
  [TransactionCategory.SALARY]: {
    key: TransactionCategory.SALARY,
    label: 'Lương',
    icon: '💰',
    color: '#4CAF50',
  },
  [TransactionCategory.BONUS]: {
    key: TransactionCategory.BONUS,
    label: 'Thưởng',
    icon: '🎁',
    color: '#8BC34A',
  },
  [TransactionCategory.INVESTMENT]: {
    key: TransactionCategory.INVESTMENT,
    label: 'Đầu tư',
    icon: '📈',
    color: '#00BCD4',
  },
  [TransactionCategory.OTHER_INCOME]: {
    key: TransactionCategory.OTHER_INCOME,
    label: 'Thu nhập khác',
    icon: '💵',
    color: '#009688',
  },
  
  // Chi tiêu
  [TransactionCategory.FOOD]: {
    key: TransactionCategory.FOOD,
    label: 'Ăn uống',
    icon: '🍔',
    color: '#FF9800',
  },
  [TransactionCategory.TRANSPORT]: {
    key: TransactionCategory.TRANSPORT,
    label: 'Di chuyển',
    icon: '🚗',
    color: '#2196F3',
  },
  [TransactionCategory.SHOPPING]: {
    key: TransactionCategory.SHOPPING,
    label: 'Mua sắm',
    icon: '🛍️',
    color: '#E91E63',
  },
  [TransactionCategory.ENTERTAINMENT]: {
    key: TransactionCategory.ENTERTAINMENT,
    label: 'Giải trí',
    icon: '🎬',
    color: '#9C27B0',
  },
  [TransactionCategory.BILLS]: {
    key: TransactionCategory.BILLS,
    label: 'Hóa đơn',
    icon: '📄',
    color: '#F44336',
  },
  [TransactionCategory.HEALTHCARE]: {
    key: TransactionCategory.HEALTHCARE,
    label: 'Y tế',
    icon: '🏥',
    color: '#FF5722',
  },
  [TransactionCategory.EDUCATION]: {
    key: TransactionCategory.EDUCATION,
    label: 'Giáo dục',
    icon: '📚',
    color: '#3F51B5',
  },
  [TransactionCategory.OTHER_EXPENSE]: {
    key: TransactionCategory.OTHER_EXPENSE,
    label: 'Chi tiêu khác',
    icon: '💸',
    color: '#607D8B',
  },
};

// Màu chủ đạo
export const COLORS = {
  primary: '#23267fff',
  secondary: '#03DAC6',
  background: '#FFFFFF',
  surface: '#F5F5F5',
  error: '#B00020',
  success: '#4CAF50',
  warning: '#FF9800',
  income: '#4CAF50',
  expense: '#F44336',
  text: '#000000',
  textSecondary: '#757575',
  border: '#E0E0E0',
};

// Storage keys
export const STORAGE_KEYS = {
  TRANSACTIONS: '@transactions',
  BUDGETS: '@budgets',
  REMINDERS: '@reminders',
};
