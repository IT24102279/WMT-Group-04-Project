import React, { useState } from 'react';
import { ActivityIndicator, View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Mail, Lock, LogIn } from 'lucide-react-native';

import { useAuth } from '../../context/AuthContext';
import { isValidEmail } from '../../utils/validation';
import { showToast } from '../../utils/toast';
import { COLORS, SPACING, TYPOGRAPHY } from '../../utils/theme';
import CustomButton from '../../components/CustomButton';
import CustomInput from '../../components/CustomInput';
import Card from '../../components/Card';

const LoginScreen = ({ navigation }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    if (!isValidEmail(email)) {
      showToast('Please enter a valid email address');
      return;
    }
    if (!password.trim()) {
      showToast('Password is required');
      return;
    }

    try {
      setIsSubmitting(true);
      await login(email, password);
      showToast('Login successful');
    } catch (error) {
      console.log('Login failed', error?.response?.data || error.message);
      showToast(error?.response?.data?.message || 'Login failed');
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
            <LogIn size={40} color={COLORS.white} />
          </View>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to manage your pharmacy account</Text>
        </View>

        <Card style={styles.card}>
          <CustomInput
            label="Email Address"
            placeholder="example@mail.com"
            value={email}
            autoCapitalize="none"
            keyboardType="email-address"
            onChangeText={setEmail}
            icon={Mail}
          />
          <CustomInput
            label="Password"
            placeholder="Enter your password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            icon={Lock}
          />
          
          <CustomButton 
            title="Sign In" 
            onPress={handleLogin} 
            loading={isSubmitting}
            style={styles.button}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <CustomButton 
              variant="ghost" 
              title="Sign Up" 
              onPress={() => navigation.navigate('Register')}
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
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  title: {
    ...TYPOGRAPHY.h1,
    color: COLORS.text,
    textAlign: 'center',
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  card: {
    paddingTop: SPACING.xl,
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

export default LoginScreen;

