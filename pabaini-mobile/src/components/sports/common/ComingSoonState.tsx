import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { ShieldAlert } from 'lucide-react-native';

interface ComingSoonStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
}

export function ComingSoonState({ title, description, icon }: ComingSoonStateProps) {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.iconContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        {icon || <ShieldAlert color={theme.colors.primary} size={36} />}
      </View>
      <Text style={[styles.title, { color: theme.colors.textPrimary }]}>{title}</Text>
      <Text style={[styles.description, { color: theme.colors.textSecondary }]}>{description}</Text>
      <View style={[styles.tag, { backgroundColor: `${theme.colors.primary}12` }]}>
        <Text style={[styles.tagText, { color: theme.colors.primary }]}>UNDER DEVELOPMENT</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 22,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
