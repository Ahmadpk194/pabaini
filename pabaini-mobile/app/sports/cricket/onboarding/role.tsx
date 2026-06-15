import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingStep } from '../../../../src/components/sports/common/OnboardingStep';
import { CricketRoleCard } from '../../../../src/components/sports/cricket/CricketRoleCard';
import { useCricketOnboardingStore } from '../../../../src/store/sports/cricketOnboardingStore';
import { CricketRole } from '../../../../src/types/sports.types';

export default function RoleStepScreen() {
  const router = useRouter();
  const { role, setRole } = useCricketOnboardingStore();

  const handleNext = () => {
    if (role) {
      router.push('/sports/cricket/onboarding/style');
    }
  };

  const roles: CricketRole[] = ['batsman', 'bowler', 'allrounder', 'keeper'];

  return (
    <OnboardingStep
      currentStep={1}
      totalSteps={3}
      title="What is your primary role?"
      description="Select your main specialty on the cricket field. This helps team captains understand where you play."
      onNext={handleNext}
      nextDisabled={!role}
    >
      <View style={styles.cardsContainer}>
        {roles.map((item) => (
          <CricketRoleCard
            key={item}
            role={item}
            selected={role === item}
            onSelect={() => setRole(item)}
          />
        ))}
      </View>
    </OnboardingStep>
  );
}

const styles = StyleSheet.create({
  cardsContainer: {
    marginTop: 10,
    width: '100%',
  },
});
