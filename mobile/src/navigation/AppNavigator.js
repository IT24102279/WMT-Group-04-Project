import React from 'react';
import { ActivityIndicator, View, StyleSheet, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { 
  Wallet, 
  Users, 
  Package, 
  Calendar, 
  Store, 
  ShoppingCart, 
  MessageSquare, 
  User as UserIcon, 
  LogIn, 
  UserPlus 
} from 'lucide-react-native';

import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import AccountScreen from '../screens/auth/AccountScreen';
import FinanceDashboardScreen from '../screens/finance/FinanceDashboardScreen';
import PatientScreen from '../screens/patient/PatientScreen';
import InventoryScreen from '../screens/inventory/InventoryScreen';
import SupportScreen from '../screens/support/SupportScreen';
import ShopDeliveryScreen from '../screens/shop/ShopDeliveryScreen';
import ShopCustomerScreen from '../screens/shop/ShopCustomerScreen';
import SalesPOSScreen from '../screens/sales/SalesPOSScreen';
import MessagingScreen from '../screens/support/MessagingScreen';
import AdminMessagingScreen from '../screens/support/AdminMessagingScreen';
import { useAuth } from '../context/AuthContext';
import { COLORS, TYPOGRAPHY, SHADOWS } from '../utils/theme';

const Tab = createBottomTabNavigator();

const AppNavigator = () => {
  const { token, isAuthReady, user } = useAuth();

  const getTabIcon = (routeName, focused, color, size) => {
    const props = { size, color, strokeWidth: focused ? 2.5 : 2 };
    switch (routeName) {
      case 'Finance': return <Wallet {...props} />;
      case 'Patients': return <Users {...props} />;
      case 'Inventory': return <Package {...props} />;
      case 'Support':
      case 'Appointments': return <Calendar {...props} />;
      case 'Shop': return <Store {...props} />;
      case 'Sales': return <ShoppingCart {...props} />;
      case 'Messages':
      case 'AdminMessages': return <MessageSquare {...props} />;
      case 'Account': return <UserIcon {...props} />;
      case 'Login': return <LogIn {...props} />;
      case 'Register': return <UserPlus {...props} />;
      default: return <Package {...props} />;
    }
  };

  if (!isAuthReady || (token && !user)) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Initializing...</Text>
      </View>
    );
  }

  const isCustomer = user?.role === 'customer';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        headerStyle: styles.header,
        headerTitleStyle: styles.headerTitle,
        headerTintColor: COLORS.primary,
        headerShadowVisible: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textLight,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarIcon: ({ focused, color, size }) => getTabIcon(route.name, focused, color, size),
      })}
    >
      {token ? (
        <>
          {isCustomer ? (
            <>
              <Tab.Screen
                name="Appointments"
                component={SupportScreen}
                options={{ title: 'Appointments' }}
              />
              <Tab.Screen
                name="Shop"
                component={ShopCustomerScreen}
                options={{ title: 'Shop' }}
              />
              <Tab.Screen
                name="Messages"
                component={MessagingScreen}
                options={{ title: 'Messages' }}
              />
              <Tab.Screen
                name="Account"
                component={AccountScreen}
                options={{ title: 'Account' }}
              />
            </>
          ) : (
            <>
              <Tab.Screen name="Finance" component={FinanceDashboardScreen} />
              <Tab.Screen name="Patients" component={PatientScreen} />
              <Tab.Screen name="Inventory" component={InventoryScreen} />
              <Tab.Screen name="Support" component={SupportScreen} />
              <Tab.Screen name="Shop" component={ShopDeliveryScreen} />
              <Tab.Screen name="Sales" component={SalesPOSScreen} />
              <Tab.Screen
                name="AdminMessages"
                component={AdminMessagingScreen}
                options={{ title: 'Messages' }}
              />
              <Tab.Screen
                name="Account"
                component={AccountScreen}
                options={{ title: 'Account' }}
              />
            </>
          )}
        </>
      ) : (
        <>
          <Tab.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Tab.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
        </>
      )}
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 12,
    ...TYPOGRAPHY.body,
    color: COLORS.textLight,
  },
  header: {
    backgroundColor: COLORS.background,
  },
  headerTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
  },
  tabBar: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    height: 64,
    paddingBottom: 8,
    paddingTop: 8,
    ...SHADOWS.medium,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default AppNavigator;

