import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  style?: ViewStyle;
  leftIcon?: React.ReactNode;
}

export function Button({ title, onPress, variant = 'primary', disabled = false, style, leftIcon }: ButtonProps) {
  const { theme } = useTheme();
  
  const getButtonStyle = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: disabled ? theme.colors.border : theme.colors.primary,
        };
      case 'secondary':
        return {
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
        };
      default:
        return {};
    }
  };
  
  const getTextStyle = () => {
    switch (variant) {
      case 'primary':
        return {
          color: disabled ? theme.colors.textSecondary : theme.colors.onPrimary,
        };
      case 'secondary':
        return {
          color: disabled ? theme.colors.textSecondary : theme.colors.textPrimary,
        };
      case 'ghost':
        return {
          color: disabled ? theme.colors.textSecondary : theme.colors.primary,
        };
      default:
        return {};
    }
  };
  
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.container,
        getButtonStyle(),
        style,
      ]}
    >
      <View style={styles.content}>
        {leftIcon ? <View style={styles.icon}>{leftIcon}</View> : null}
        <Text style={[styles.text, getTextStyle()]}>{title}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 10,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});
