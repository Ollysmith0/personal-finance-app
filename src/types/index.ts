// Types và Interfaces cho ứng dụng quản lý tài chính

export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export enum TransactionCategory {
  // Thu nhập
  SALARY = 'SALARY',
  BONUS = 'BONUS',
  INVESTMENT = 'INVESTMENT',
  OTHER_INCOME = 'OTHER_INCOME',
  
  // Chi tiêu
  FOOD = 'FOOD',
  TRANSPORT = 'TRANSPORT',
  SHOPPING = 'SHOPPING',
  ENTERTAINMENT = 'ENTERTAINMENT',
  BILLS = 'BILLS',
  HEALTHCARE = 'HEALTHCARE',
  EDUCATION = 'EDUCATION',
  OTHER_EXPENSE = 'OTHER_EXPENSE',
}

export interface Transaction {
  id: string;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  description: string;
  date: Date;
  createdAt: Date;
}

export interface Budget {
  id: string;
  category: TransactionCategory;
  amount: number;
  period: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  startDate: Date;
  endDate?: Date;
  spent: number;
}

export enum ReminderType {
  GENERAL = 'GENERAL',
  EXPENSE_LIMIT = 'EXPENSE_LIMIT',
  SAVINGS_TARGET = 'SAVINGS_TARGET',
}

export interface Reminder {
  id: string;
  type: ReminderType;
  title: string;
  description: string;
  amount?: number;
  minAmount?: number;
  maxAmount?: number;
  category?: TransactionCategory;
  dueDate: Date;
  isRecurring: boolean;
  frequency?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  isCompleted: boolean;
  notificationId?: string;
}

export interface CategoryInfo {
  key: TransactionCategory;
  label: string;
  icon: string;
  color: string;
}

export interface ChartData {
  labels: string[];
  datasets: {
    data: number[];
  }[];
}

export interface Summary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  period: string;
}
