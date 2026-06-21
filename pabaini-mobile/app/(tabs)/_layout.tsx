import { Tabs } from 'expo-router';
import { ColorValue, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Trophy, Heart, User } from 'lucide-react-native';
import { useTheme } from '../../src/context/ThemeContext';

export default function TabsLayout() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff', paddingTop: insets.top }} edges={[]}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.textSecondary,
          tabBarStyle: {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.border,
            borderTopWidth: 0.5,
            height: Platform.OS === 'ios'
              ? 50 + insets.bottom
              : 62 + (insets.bottom > 0 ? insets.bottom : 8),
            paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
            paddingTop: 6,
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -3 },
            shadowOpacity: 0.05,
            shadowRadius: 10,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '700',
            marginTop: 2,
            marginBottom: Platform.OS === 'ios' ? 0 : 2,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
          }}
        />
        <Tabs.Screen
          name="sports"
          options={{
            title: 'Sports',
            tabBarIcon: ({ color }) => <TabBarIcon name="trophy" color={color} />,
          }}
        />
        <Tabs.Screen
          name="donors"
          options={{
            title: 'Donors',
            tabBarIcon: ({ color }) => <TabBarIcon name="heart" color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
          }}
        />
      </Tabs>
    </SafeAreaView>
  );
}

function TabBarIcon({ name, color }: { name: string; color: ColorValue }) {
  switch (name) {
    case 'home': return <Home size={24} color={color as string} />;
    case 'trophy': return <Trophy size={24} color={color as string} />;
    case 'heart': return <Heart size={24} color={color as string} />;
    case 'user': return <User size={24} color={color as string} />;
    default: return null;
  }
}
