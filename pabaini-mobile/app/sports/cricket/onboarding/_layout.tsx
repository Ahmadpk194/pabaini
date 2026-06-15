import React from 'react';
import { Stack } from 'expo-router';

export default function OnboardingLayout() {
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
