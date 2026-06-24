import React, { useEffect, useRef } from 'react';
import { Tabs } from 'expo-router';
import { Platform, Animated, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Trophy, Heart, User } from 'lucide-react-native';
import { useTheme } from '../../src/context/ThemeContext';

export default function TabsLayout() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
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
              ? 46 + insets.bottom
              : 50 + (insets.bottom > 0 ? insets.bottom : 0),
            paddingBottom: Platform.OS === 'ios'
              ? (insets.bottom > 0 ? insets.bottom - 4 : 4)
              : 4 + (insets.bottom > 0 ? insets.bottom : 0),
            paddingTop: 2,
            elevation: 4,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.04,
            shadowRadius: 12,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '600',
            marginTop: 1,
            marginBottom: Platform.OS === 'ios' ? 0 : 2,
            letterSpacing: 0.2,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, focused }) => <TabBarIcon name="home" color={color} focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="sports"
          options={{
            title: 'Sports',
            tabBarIcon: ({ color, focused }) => <TabBarIcon name="trophy" color={color} focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="donors"
          options={{
            title: 'Donors',
            tabBarIcon: ({ color, focused }) => <TabBarIcon name="heart" color={color} focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, focused }) => <TabBarIcon name="user" color={color} focused={focused} />,
          }}
        />
      </Tabs>
    </View>
  );
}

interface TabBarIconProps {
  name: string;
  color: any;
  focused: boolean;
}

function TabBarIcon({ name, color, focused }: TabBarIconProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: focused ? 1.06 : 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  }, [focused]);

  const fillValue = focused ? color : 'none';
  const strokeWidth = focused ? 2.2 : 1.8;

  const renderIcon = () => {
    switch (name) {
      case 'home': return <Home size={22} color={color} fill={fillValue} strokeWidth={strokeWidth} />;
      case 'trophy': return <Trophy size={22} color={color} fill={fillValue} strokeWidth={strokeWidth} />;
      case 'heart': return <Heart size={22} color={color} fill={fillValue} strokeWidth={strokeWidth} />;
      case 'user': return <User size={22} color={color} fill={fillValue} strokeWidth={strokeWidth} />;
      default: return null;
    }
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      {renderIcon()}
    </Animated.View>
  );
}
