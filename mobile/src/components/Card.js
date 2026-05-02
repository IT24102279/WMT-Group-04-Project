import { View, StyleSheet, Pressable } from 'react-native';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../utils/theme';

const Card = ({ children, style, variant = 'elevated', onPress }) => {
  const Container = onPress ? Pressable : View;
  
  return (
    <Container 
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variant === 'elevated' && styles.elevated,
        variant === 'outline' && styles.outline,
        style,
        pressed && onPress && { opacity: 0.8, transform: [{ scale: 0.98 }] }
      ]}
    >
      {children}
    </Container>
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
