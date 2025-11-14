import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction, Budget, Reminder } from '../types';
import { STORAGE_KEYS } from '../utils/constants';

// Transaction Service
export const TransactionService = {
  // Lấy tất cả giao dịch
  getAll: async (): Promise<Transaction[]> => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting transactions:', error);
      return [];
    }
  },

  // Thêm giao dịch mới
  add: async (transaction: Transaction): Promise<void> => {
    try {
      const transactions = await TransactionService.getAll();
      console.log('Current transactions count:', transactions.length);
      transactions.push(transaction);
      console.log('New transactions count:', transactions.length);
      await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
      console.log('Transactions saved to AsyncStorage');
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  },

  // Cập nhật giao dịch
  update: async (id: string, updatedTransaction: Partial<Transaction>): Promise<void> => {
    try {
      const transactions = await TransactionService.getAll();
      const index = transactions.findIndex(t => t.id === id);
      if (index !== -1) {
        transactions[index] = { ...transactions[index], ...updatedTransaction };
        await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
      }
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }
  },

  // Xóa giao dịch
  delete: async (id: string): Promise<void> => {
    try {
      const transactions = await TransactionService.getAll();
      const filtered = transactions.filter(t => t.id !== id);
      await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  },

  // Lọc theo khoảng thời gian
  getByDateRange: async (startDate: Date, endDate: Date): Promise<Transaction[]> => {
    try {
      const transactions = await TransactionService.getAll();
      return transactions.filter(t => {
        const date = new Date(t.date);
        return date >= startDate && date <= endDate;
      });
    } catch (error) {
      console.error('Error getting transactions by date:', error);
      return [];
    }
  },
};

// Budget Service
export const BudgetService = {
  getAll: async (): Promise<Budget[]> => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.BUDGETS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting budgets:', error);
      return [];
    }
  },

  add: async (budget: Budget): Promise<void> => {
    try {
      const budgets = await BudgetService.getAll();
      budgets.push(budget);
      await AsyncStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
    } catch (error) {
      console.error('Error adding budget:', error);
      throw error;
    }
  },

  update: async (id: string, updatedBudget: Partial<Budget>): Promise<void> => {
    try {
      const budgets = await BudgetService.getAll();
      const index = budgets.findIndex(b => b.id === id);
      if (index !== -1) {
        budgets[index] = { ...budgets[index], ...updatedBudget };
        await AsyncStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
      }
    } catch (error) {
      console.error('Error updating budget:', error);
      throw error;
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      const budgets = await BudgetService.getAll();
      const filtered = budgets.filter(b => b.id !== id);
      await AsyncStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting budget:', error);
      throw error;
    }
  },
};

// Reminder Service
export const ReminderService = {
  getAll: async (): Promise<Reminder[]> => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.REMINDERS);
      const reminders = data ? JSON.parse(data) : [];
      // Ensure boolean fields are properly typed
      return reminders.map((r: any) => ({
        ...r,
        isRecurring: Boolean(r.isRecurring),
        isCompleted: Boolean(r.isCompleted),
      }));
    } catch (error) {
      console.error('Error getting reminders:', error);
      return [];
    }
  },

  add: async (reminder: Reminder): Promise<void> => {
    try {
      const reminders = await ReminderService.getAll();
      reminders.push(reminder);
      await AsyncStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(reminders));
    } catch (error) {
      console.error('Error adding reminder:', error);
      throw error;
    }
  },

  update: async (id: string, updatedReminder: Partial<Reminder>): Promise<void> => {
    try {
      const reminders = await ReminderService.getAll();
      const index = reminders.findIndex(r => r.id === id);
      if (index !== -1) {
        reminders[index] = { ...reminders[index], ...updatedReminder };
        await AsyncStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(reminders));
      }
    } catch (error) {
      console.error('Error updating reminder:', error);
      throw error;
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      const reminders = await ReminderService.getAll();
      const filtered = reminders.filter(r => r.id !== id);
      await AsyncStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting reminder:', error);
      throw error;
    }
  },
};
