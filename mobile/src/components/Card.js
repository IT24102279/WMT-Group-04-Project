import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../utils/theme';

const Card = ({ children, style, variant = 'elevated' }) => {
  return (
    <View style={[
      styles.base,
      variant === 'elevated' && styles.elevated,
      variant === 'outline' && styles.outline,
      style
    ]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
  },
  elevated: {
    ...SHADOWS.medium,
  },
  outline: {
    borderWidth: 1,
    borderColor: COLORS.border,
  },
});

export default Card;
