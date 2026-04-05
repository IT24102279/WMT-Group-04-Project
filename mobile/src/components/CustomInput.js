import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, Pressable } from 'react-native';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../utils/theme';
import { Eye, EyeOff } from 'lucide-react-native';

const CustomInput = ({ 
  label, 
  error, 
  secureTextEntry, 
  icon: Icon,
  ...props 
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[
        styles.inputContainer,
        isFocused && styles.inputFocused,
        error && styles.inputError
      ]}>
        {Icon && <Icon size={20} color={isFocused ? COLORS.primary : COLORS.textLight} style={styles.icon} />}
        <TextInput
          style={styles.input}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholderTextColor={COLORS.textLight}
          secureTextEntry={secureTextEntry && !showPassword}
          {...props}
        />
        {secureTextEntry && (
          <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
            {showPassword ? (
              <EyeOff size={20} color={COLORS.textLight} />
            ) : (
              <Eye size={20} color={COLORS.textLight} />
            )}
          </Pressable>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
    width: '100%',
  },
  label: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text,
    marginBottom: SPACING.xs,
    marginLeft: SPACING.xs,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    height: 56,
  },
  inputFocused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  icon: {
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    height: '100%',
  },
  eyeIcon: {
    padding: SPACING.sm,
  },
  errorText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.error,
    marginTop: SPACING.xs,
    marginLeft: SPACING.xs,
  },
});

export default CustomInput;
