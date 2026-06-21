import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/hooks/useAuth';
import { LoginRequiredGate } from '../../src/components/ui/LoginRequiredGate';

export default function DonorsScreen() {
  const { theme } = useTheme();
  const { isGuest } = useAuth();

  if (isGuest) {
    return <LoginRequiredGate title="Donors Registry" description="Please log in to view the blood donors registry and contact details." fullscreen={true} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Blood Donors</Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
        Coming soon
      </Text>
      <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
        Blood donor registry for the Pabaini community will be available here.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});
