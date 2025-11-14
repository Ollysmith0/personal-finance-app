import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, TouchableOpacity } from 'react-native';
import HomeScreen from '../screens/HomeScreen';
import AddTransactionScreen from '../screens/AddTransactionScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import TransactionDetailScreen from '../screens/TransactionDetailScreen';
import ReportsScreen from '../screens/ReportsScreen';
import RemindersScreen from '../screens/RemindersScreen';
import { COLORS } from '../utils/constants';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          paddingBottom: 12,
          paddingTop: 12,
          height: 70,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Tổng quan',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>🏠</Text>,
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Transactions"
        component={TransactionsScreen}
        options={{
          title: 'Giao dịch',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>💰</Text>,
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Reports"
        component={ReportsScreen}
        options={{
          title: 'Báo cáo',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>📈</Text>,
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Reminders"
        component={RemindersScreen}
        options={{
          title: 'Nhắc nhở',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>🔔</Text>,
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerBackTitle: '',
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AddTransaction"
          component={AddTransactionScreen}
          options={({ navigation }) => ({ 
            title: 'Thêm giao dịch',
            headerShown: true,
            headerLeft: () => (
              <TouchableOpacity 
                onPress={() => navigation.goBack()}
                activeOpacity={0.6}
                style={{ 
                  width: 40,
                  height: 40,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 32, color: COLORS.primary, lineHeight: 32 }}>‹</Text>
              </TouchableOpacity>
            ),
            headerLeftContainerStyle: {
              paddingLeft: 0,
            },
          })}
        />
        <Stack.Screen
          name="TransactionDetail"
          component={TransactionDetailScreen}
          options={({ navigation }) => ({ 
            title: 'Chi tiết giao dịch',
            headerShown: true,
            headerLeft: () => (
              <TouchableOpacity 
                onPress={() => navigation.goBack()}
                activeOpacity={0.6}
                style={{ 
                  width: 40,
                  height: 40,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginLeft: 8,
                }}
              >
                <Text style={{ fontSize: 32, color: COLORS.primary, lineHeight: 32 }}>‹</Text>
              </TouchableOpacity>
            ),
            headerLeftContainerStyle: {
              paddingLeft: 0,
            },
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
