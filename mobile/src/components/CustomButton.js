import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY, SHADOWS } from '../utils/theme';
import { LinearGradient } from 'expo-linear-gradient';

const CustomButton = ({ 
  onPress, 
  title, 
  variant = 'primary', 
  loading = false, 
  disabled = false, 
  icon: Icon,
  style,
  textStyle 
}) => {
  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';
  const isOutline = variant === 'outline';
  const isGhost = variant === 'ghost';

  const getButtonStyle = () => {
    if (isGhost) return styles.ghostButton;
    if (isOutline) return styles.outlineButton;
    if (isSecondary) return styles.secondaryButton;
    return styles.primaryButton;
  };

  const getTextStyle = () => {
    if (isGhost) return styles.ghostText;
    if (isOutline) return styles.outlineText;
    if (isSecondary) return styles.secondaryText;
    return styles.primaryText;
  };

  const isDisabled = disabled || loading;

  return (
    <Pressable 
      onPress={onPress} 
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.buttonBase,
        getButtonStyle(),
        isDisabled && styles.disabled,
        pressed && styles.pressed,
        style
      ]}
    >
      {isPrimary && !isDisabled ? (
        <LinearGradient
          colors={[COLORS.secondary, COLORS.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={isPrimary ? COLORS.white : COLORS.primary} size="small" />
        ) : (
          <>
            {Icon && <Icon size={20} color={isPrimary ? COLORS.white : COLORS.primary} style={styles.icon} />}
            <Text style={[styles.textBase, getTextStyle(), textStyle]}>
              {title}
            </Text>
          </>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  buttonBase: {
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  secondaryButton: {
    backgroundColor: COLORS.primaryLight,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  ghostButton: {
    backgroundColor: 'transparent',
    elevation: 0,
    shadowOpacity: 0,
  },
  textBase: {
    ...TYPOGRAPHY.button,
  },
  primaryText: {
    color: COLORS.white,
  },
  secondaryText: {
    color: COLORS.primary,
  },
  outlineText: {
    color: COLORS.primary,
  },
  ghostText: {
    color: COLORS.primary,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  icon: {
    marginRight: SPACING.sm,
  },
});

export default CustomButton;
