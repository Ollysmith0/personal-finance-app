import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Reminder } from '../types';

// Cấu hình notification
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const NotificationService = {
  // Yêu cầu quyền thông báo
  requestPermissions: async (): Promise<boolean> => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        return false;
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  },

  // Lên lịch thông báo cho nhắc nhở
  scheduleReminder: async (reminder: Reminder): Promise<string | null> => {
    try {
      const hasPermission = await NotificationService.requestPermissions();
      if (!hasPermission) {
        return null;
      }

      const trigger: Notifications.NotificationTriggerInput = reminder.isRecurring === true
        ? ({
            type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
            repeats: true,
            hour: new Date(reminder.dueDate).getHours(),
            minute: new Date(reminder.dueDate).getMinutes(),
          } as Notifications.CalendarTriggerInput)
        : ({
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: new Date(reminder.dueDate),
          } as Notifications.DateTriggerInput);

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '💰 Nhắc nhở thanh toán',
          body: reminder.title,
          data: { reminderId: reminder.id },
          sound: true,
        },
        trigger,
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling reminder:', error);
      return null;
    }
  },

  // Hủy thông báo
  cancelNotification: async (notificationId: string): Promise<void> => {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  },

  // Hủy tất cả thông báo
  cancelAllNotifications: async (): Promise<void> => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  },
};
