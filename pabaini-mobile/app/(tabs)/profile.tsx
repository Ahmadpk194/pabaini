import React from 'react';
import { View, ScrollView, Text, StyleSheet } from 'react-native';
import { Globe } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/hooks/useAuth';
import { Button } from '../../src/components/ui/Button';
import { UserProfileView } from '../../src/components/profile';

export default function ProfileTab() {
  const { user, isGuest } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();

  if (isGuest || !user) {
    return (
      <View style={[styles.container, { backgroundColor: '#F4F3EF' }]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={[styles.guestCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Globe size={48} color="#004D26" style={styles.guestIcon} />
            <Text style={[styles.guestTitle, { color: '#004D26' }]}>Guest Mode</Text>
            <Text style={[styles.guestSubtitle, { color: theme.colors.textSecondary }]}>
              You are currently browsing the Pabaini notice feed as a guest. Sign in to post updates, like notices, and configure messaging targets.
            </Text>
            <Button
              title="Log In / Sign Up"
              onPress={() => router.replace('/(auth)/login')}
              variant="primary"
              style={{ ...styles.guestButton, backgroundColor: '#004D26' }}
            />
          </View>
        </ScrollView>
      </View>
    );
  }

  return <UserProfileView userId={user.id} isOwnProfile={true} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  guestCard: {
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    borderWidth: 0.5,
    marginTop: 40,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  guestIcon: {
    marginBottom: 16,
    opacity: 0.8,
  },
  guestTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
  },
  guestSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  guestButton: {
    width: '100%',
    height: 46,
    paddingVertical: 0,
    borderRadius: 23,
  },
});
