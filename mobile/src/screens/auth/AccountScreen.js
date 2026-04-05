import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { User, Mail, Shield, LogOut, ChevronRight, Settings, Bell, HelpCircle } from 'lucide-react-native';

import { useAuth } from '../../context/AuthContext';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../../utils/theme';
import CustomButton from '../../components/CustomButton';
import Card from '../../components/Card';

const AccountScreen = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.log('Logout failed', error?.message || error);
    }
  };

  const menuItems = [
    { icon: Settings, label: 'Settings', color: '#6366F1' },
    { icon: Bell, label: 'Notifications', color: '#F59E0B' },
    { icon: HelpCircle, label: 'Help & Support', color: '#10B981' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <User size={48} color={COLORS.white} />
        </View>
        <Text style={styles.userName}>{user?.name || 'User'}</Text>
        <Text style={styles.userRole}>{user?.role?.toUpperCase() || 'MEMBER'}</Text>
      </View>

      <Card style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Mail size={20} color={COLORS.textLight} />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoLabel}>Email Address</Text>
            <Text style={styles.infoValue}>{user?.email || '-'}</Text>
          </View>
        </View>
        <View style={[styles.infoRow, styles.lastInfoRow]}>
          <Shield size={20} color={COLORS.textLight} />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoLabel}>Account Status</Text>
            <Text style={styles.infoValue}>Active</Text>
          </View>
        </View>
      </Card>

      <Text style={styles.sectionTitle}>General</Text>
      <Card style={styles.menuCard} variant="outline">
        {menuItems.map((item, index) => (
          <View key={item.label}>
            <View style={styles.menuItem}>
              <View style={[styles.menuIconContainer, { backgroundColor: item.color + '15' }]}>
                <item.icon size={20} color={item.color} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <ChevronRight size={18} color={COLORS.border} />
            </View>
            {index < menuItems.length - 1 && <View style={styles.separator} />}
          </View>
        ))}
      </Card>

      <CustomButton 
        variant="outline"
        title="Sign Out"
        onPress={handleLogout}
        icon={LogOut}
        style={styles.logoutButton}
        textStyle={styles.logoutText}
      />
      
      <Text style={styles.versionText}>Version 1.0.0 (Build 20240501)</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  profileHeader: {
    alignItems: 'center',
    marginVertical: SPACING.xl,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    ...SHADOWS.medium,
  },
  userName: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
  },
  userRole: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: '800',
    marginTop: 4,
    letterSpacing: 1,
  },
  infoCard: {
    padding: 0,
    marginBottom: SPACING.xl,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  lastInfoRow: {
    borderBottomWidth: 0,
  },
  infoTextContainer: {
    marginLeft: SPACING.md,
  },
  infoLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
  },
  infoValue: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 2,
  },
  sectionTitle: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    marginLeft: SPACING.xs,
    textTransform: 'uppercase',
  },
  menuCard: {
    padding: 0,
    marginBottom: SPACING.xl,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  menuLabel: {
    flex: 1,
    ...TYPOGRAPHY.body,
    fontWeight: '500',
    color: COLORS.text,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: SPACING.xxl + SPACING.sm,
  },
  logoutButton: {
    marginTop: SPACING.md,
    borderColor: COLORS.error,
  },
  logoutText: {
    color: COLORS.error,
  },
  versionText: {
    ...TYPOGRAPHY.caption,
    textAlign: 'center',
    marginTop: SPACING.xl,
    color: COLORS.textLight,
  },
});

export default AccountScreen;

