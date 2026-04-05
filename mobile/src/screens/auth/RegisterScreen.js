import React, { useState } from 'react';
import { ActivityIndicator, View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { User, Mail, Lock, UserPlus, ShieldCheck } from 'lucide-react-native';

import { useAuth } from '../../context/AuthContext';
import { isValidEmail } from '../../utils/validation';
import { showToast } from '../../utils/toast';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../../utils/theme';
import CustomButton from '../../components/CustomButton';
import CustomInput from '../../components/CustomInput';
import Card from '../../components/Card';

const RegisterScreen = ({ navigation }) => {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'customer' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const roles = [
    { id: 'customer', label: 'Customer', description: 'Patient or shopper' },
    { id: 'admin', label: 'Admin', description: 'System manager' },
    { id: 'pharmacist', label: 'Pharmacist', description: 'Medical professional' },
    { id: 'staff', label: 'Staff', description: 'Pharmacy support' }
  ];

  const updateForm = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleRegister = async () => {
    if (!form.name.trim()) {
      showToast('Name is required');
      return;
    }
    if (!isValidEmail(form.email)) {
      showToast('Please enter a valid email address');
      return;
    }
    if (!form.password || form.password.length < 6) {
      showToast('Password must be at least 6 characters');
      return;
    }

    try {
      setIsSubmitting(true);
      await register(form);
      showToast('Registration successful');
    } catch (error) {
      console.log('Register failed', error?.response?.data || error.message);
      showToast(error?.response?.data?.message || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <UserPlus size={40} color={COLORS.white} />
          </View>
          <Text style={styles.title}>Join Us</Text>
          <Text style={styles.subtitle}>Create an account to get started</Text>
        </View>

        <Card style={styles.card}>
          <CustomInput
            label="Full Name"
            placeholder="John Doe"
            value={form.name}
            onChangeText={(v) => updateForm('name', v)}
            icon={User}
          />
          <CustomInput
            label="Email Address"
            placeholder="john@example.com"
            value={form.email}
            keyboardType="email-address"
            autoCapitalize="none"
            onChangeText={(v) => updateForm('email', v)}
            icon={Mail}
          />
          <CustomInput
            label="Password"
            placeholder="Create a password (min 6 chars)"
            secureTextEntry
            value={form.password}
            onChangeText={(v) => updateForm('password', v)}
            icon={Lock}
          />

          <Text style={styles.sectionTitle}>Account Type</Text>
          <View style={styles.roleGrid}>
            {roles.map((role) => (
              <Pressable
                key={role.id}
                style={[
                  styles.roleCard,
                  form.role === role.id && styles.roleCardSelected
                ]}
                onPress={() => updateForm('role', role.id)}
              >
                <ShieldCheck 
                  size={20} 
                  color={form.role === role.id ? COLORS.primary : COLORS.textLight} 
                />
                <Text style={[
                  styles.roleName,
                  form.role === role.id && styles.roleNameSelected
                ]}>
                  {role.label}
                </Text>
              </Pressable>
            ))}
          </View>
          
          <CustomButton 
            title="Create Account" 
            onPress={handleRegister} 
            loading={isSubmitting}
            style={styles.button}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <CustomButton 
              variant="ghost" 
              title="Sign In" 
              onPress={() => navigation.navigate('Login')}
              style={styles.ghostButton}
              textStyle={styles.ghostButtonText}
            />
          </View>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: SPACING.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
    marginTop: SPACING.md,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    ...TYPOGRAPHY.h1,
    color: COLORS.text,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textLight,
  },
  card: {
    paddingTop: SPACING.xl,
  },
  sectionTitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text,
    fontWeight: '700',
    marginBottom: SPACING.sm,
    marginTop: SPACING.sm,
  },
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  roleCard: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    gap: SPACING.sm,
  },
  roleCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  roleName: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    fontWeight: '600',
  },
  roleNameSelected: {
    color: COLORS.primary,
  },
  button: {
    marginTop: SPACING.md,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.lg,
  },
  footerText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textLight,
  },
  ghostButton: {
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  ghostButtonText: {
    ...TYPOGRAPHY.body,
    fontWeight: '700',
    color: COLORS.primary,
  },
});

export default RegisterScreen;

