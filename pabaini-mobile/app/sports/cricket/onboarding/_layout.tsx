import React from 'react';
import { Stack, useRouter } from 'expo-router';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useAuth } from '../../../../src/hooks/useAuth';
import { useTheme } from '../../../../src/context/ThemeContext';
import { LoginRequiredGate } from '../../../../src/components/ui/LoginRequiredGate';

export default function OnboardingLayout() {
  const { isGuest } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();

  if (isGuest) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <View style={styles.headerBar}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft color={theme.colors.textPrimary} size={24} strokeWidth={1.75} />
          </TouchableOpacity>
        </View>
        <View style={styles.gateWrapper}>
          <LoginRequiredGate fullscreen={false} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="role" />
      <Stack.Screen name="style" />
      <Stack.Screen name="preview" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 6,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gateWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
