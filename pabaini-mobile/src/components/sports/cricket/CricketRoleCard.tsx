import React, { useRef } from 'react';
import { Text, View, StyleSheet, Pressable, Animated } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { CricketRole } from '../../../types/sports.types';

interface CricketRoleCardProps {
  role: CricketRole;
  selected: boolean;
  onSelect: () => void;
}

const ROLE_DATA = {
  batsman: { icon: '🏏', label: 'Batsman', subtitle: 'I specialise in batting' },
  bowler: { icon: '🎯', label: 'Bowler', subtitle: 'I specialise in bowling' },
  allrounder: { icon: '⚡', label: 'All-rounder', subtitle: 'I bat and bowl' },
  keeper: { icon: '🧤', label: 'Wicket-keeper', subtitle: 'I keep wickets' },
};

export function CricketRoleCard({ role, selected, onSelect }: CricketRoleCardProps) {
  const { theme } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const data = ROLE_DATA[role];

  return (
    <Pressable
      onPress={onSelect}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={({ pressed }: { pressed: boolean }) => [
        styles.pressable,
        {
          borderColor: selected ? theme.colors.primary : '#E5E7EB',
          borderWidth: selected ? 2 : 1,
          backgroundColor: selected ? `${theme.colors.primary}08` : theme.colors.surface,
          borderRadius: theme.radius.lg,
        },
      ]}
    >
      <Animated.View style={[styles.innerContainer, { transform: [{ scale: scaleAnim }] }]}>
        {/* Left accent bar */}
        <View
          style={[
            styles.accentBar,
            {
              backgroundColor: selected ? theme.colors.primary : 'transparent',
              borderTopLeftRadius: theme.radius.lg - 2,
              borderBottomLeftRadius: theme.radius.lg - 2,
            },
          ]}
        />

        {/* Icon */}
        <Text style={styles.icon}>{data.icon}</Text>

        {/* Labels */}
        <View style={styles.textContainer}>
          <Text style={[styles.label, { color: theme.colors.textPrimary }]}>{data.label}</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>{data.subtitle}</Text>
        </View>

        {/* Checkmark circle */}
        <View
          style={[
            styles.checkmarkCircle,
            {
              borderColor: selected ? theme.colors.primary : '#D1D5DB',
              backgroundColor: selected ? theme.colors.primary : 'transparent',
            },
          ]}
        >
          {selected && <Text style={styles.checkIcon}>✓</Text>}
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    width: '100%',
    position: 'relative',
    marginVertical: 6,
    overflow: 'hidden',
  },
  innerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    width: '100%',
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  icon: {
    fontSize: 32,
    marginRight: 6,
  },
  textContainer: {
    flex: 1,
    marginLeft: 14,
  },
  label: {
    fontSize: 17,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  checkmarkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkIcon: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
