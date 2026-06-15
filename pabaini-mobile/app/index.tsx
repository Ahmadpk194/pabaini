import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../src/hooks/useAuth';

export default function Index() {
  const { user, isGuest, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (user) {
    if (!user.name || user.name.trim() === '') {
      return <Redirect href="/(onboarding)/profile-setup" />;
    }
    return <Redirect href="/(tabs)" />;
  }

  if (isGuest) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}