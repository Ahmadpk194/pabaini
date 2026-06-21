import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Lock } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

interface LoginRequiredGateProps {
  title?: string;
  description?: string;
  fullscreen?: boolean;
}

export function LoginRequiredGate({
  title = 'Log In Required',
  description = 'Please log in to your account to view this page and access these features.',
  fullscreen = true,
}: LoginRequiredGateProps) {
  const { theme } = useTheme();
  const router = useRouter();

  const handleLoginPress = () => {
    router.push('/(auth)/login');
  };

  return (
    <View style={[styles.container, fullscreen && styles.fullscreen, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <View style={[styles.iconContainer, { backgroundColor: theme.colors.generalBg }]}>
          <Lock size={32} color={theme.colors.primary} />
        </View>

        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
          {title}
        </Text>
        
        <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
          {description}
        </Text>

        <TouchableOpacity
          onPress={handleLoginPress}
          style={[styles.loginButton, { backgroundColor: theme.colors.primary }]}
          activeOpacity={0.8}
        >
          <Text style={[styles.buttonText, { color: theme.colors.onPrimary }]}>
            Log In
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreen: {
    flex: 1,
  },
  card: {
    width: Math.min(width - 48, 360),
    borderRadius: 20,
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
    paddingHorizontal: 8,
  },
  loginButton: {
    width: '100%',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 1,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
