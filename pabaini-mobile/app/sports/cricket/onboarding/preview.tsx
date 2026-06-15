import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingStep } from '../../../../src/components/sports/common/OnboardingStep';
import { CricketPlayerCard } from '../../../../src/components/sports/cricket/CricketPlayerCard';
import { useCricketOnboardingStore } from '../../../../src/store/sports/cricketOnboardingStore';
import { useSportsStore } from '../../../../src/store/sports/sportsStore';
import { useAuth } from '../../../../src/hooks/useAuth';
import client from '../../../../src/api/client';
import { CricketPlayerProfile } from '../../../../src/types/sports.types';

export default function PreviewStepScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { role, batting_hand, bowling_arm, bowling_type, reset } = useCricketOnboardingStore();
  const setRegistration = useSportsStore((state) => state.setRegistration);
  
  const [loading, setLoading] = useState(false);

  // Fallback redirect if store is empty
  if (!role || !batting_hand || !bowling_arm || !bowling_type) {
    return (
      <OnboardingStep
        currentStep={3}
        title="Review your Player Card"
        description="Please complete the previous steps first."
        onNext={() => router.replace('/sports/cricket/onboarding/role')}
        nextLabel="Restart Onboarding"
      >
        <View />
      </OnboardingStep>
    );
  }

  // Construct a preview profile object
  const previewProfile: CricketPlayerProfile = {
    id: 0,
    role: role,
    batting_hand: batting_hand,
    bowling_arm: bowling_arm,
    bowling_type: bowling_type,
    is_active: true,
    user: {
      id: user?.id || 0,
      name: user?.name || 'Player Name',
      avatar_url: user?.avatar_url || null,
    },
  };

  const handleCompleteSetup = async () => {
    try {
      setLoading(true);
      const response = await client.post('/sports/cricket/players/me', {
        role,
        batting_hand,
        bowling_arm,
        bowling_type,
      });

      const profile = response.data.data;
      
      // Update local persisted store
      setRegistration('cricket', profile);

      Alert.alert(
        'Registration Successful',
        'Your Cricket Player Profile has been created successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              reset();
              // Navigate back to the main sports tab
              router.replace('/(tabs)/sports');
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error creating cricket profile:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to complete player registration.';
      Alert.alert('Registration Failed', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <OnboardingStep
      currentStep={3}
      totalSteps={3}
      title="Review your Player Card"
      description="This is how other players and team captains will see your profile in the app."
      onNext={handleCompleteSetup}
      nextLabel="Complete Setup"
      nextLoading={loading}
    >
      <View style={styles.cardWrapper}>
        <CricketPlayerCard profile={previewProfile} />
      </View>
    </OnboardingStep>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    marginTop: 10,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
