import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, LayoutAnimation, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingStep } from '../../../../src/components/sports/common/OnboardingStep';
import { CricketStyleChip } from '../../../../src/components/sports/cricket/CricketStyleChip';
import { useCricketOnboardingStore } from '../../../../src/store/sports/cricketOnboardingStore';
import { useTheme } from '../../../../src/context/ThemeContext';
import { BattingHand, BowlingArm, BowlingType } from '../../../../src/types/sports.types';

export default function StyleStepScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { role, setStyle } = useCricketOnboardingStore();

  // Smart defaults based on role
  const isBowlingRequired = role === 'bowler' || role === 'allrounder';
  
  const [battingHand, setBattingHand] = useState<BattingHand>('right');
  const [bowlingArm, setBowlingArm] = useState<BowlingArm>(isBowlingRequired ? 'right' : 'none');
  const [bowlingType, setBowlingType] = useState<BowlingType>(isBowlingRequired ? 'fast' : 'none');

  useEffect(() => {
    // If bowling arm changes to none, automatically clear bowling type
    if (bowlingArm === 'none') {
      setBowlingType('none');
    } else if (bowlingType === 'none') {
      setBowlingType('fast');
    }
  }, [bowlingArm]);

  const handleNext = () => {
    setStyle(battingHand, bowlingArm, bowlingType);
    router.push('/sports/cricket/onboarding/preview');
  };

  const selectBowlingArm = (arm: BowlingArm) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setBowlingArm(arm);
  };

  return (
    <OnboardingStep
      currentStep={2}
      totalSteps={3}
      title="What is your playing style?"
      description="Select how you bat and bowl. This will be shown on your player card."
      onNext={handleNext}
    >
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Batting Hand</Text>
        <View style={styles.chipGrid}>
          <CricketStyleChip
            label="Right Hand"
            selected={battingHand === 'right'}
            onPress={() => setBattingHand('right')}
          />
          <CricketStyleChip
            label="Left Hand"
            selected={battingHand === 'left'}
            onPress={() => setBattingHand('left')}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Bowling Arm</Text>
        <View style={styles.chipGrid}>
          <CricketStyleChip
            label="Right Arm"
            selected={bowlingArm === 'right'}
            onPress={() => selectBowlingArm('right')}
          />
          <CricketStyleChip
            label="Left Arm"
            selected={bowlingArm === 'left'}
            onPress={() => selectBowlingArm('left')}
          />
          {!isBowlingRequired && (
            <CricketStyleChip
              label="I don't bowl"
              selected={bowlingArm === 'none'}
              onPress={() => selectBowlingArm('none')}
            />
          )}
        </View>
      </View>

      {/* Conditionally render Bowling Type selectors with smooth collapse */}
      {bowlingArm !== 'none' && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Bowling Type</Text>
          <View style={styles.chipGrid}>
            <CricketStyleChip
              label="Fast"
              selected={bowlingType === 'fast'}
              onPress={() => setBowlingType('fast')}
            />
            <CricketStyleChip
              label="Medium"
              selected={bowlingType === 'medium'}
              onPress={() => setBowlingType('medium')}
            />
            <CricketStyleChip
              label="Spin"
              selected={bowlingType === 'spin'}
              onPress={() => setBowlingType('spin')}
            />
          </View>
        </View>
      )}
    </OnboardingStep>
  );
}

const styles = StyleSheet.create({
  section: {
    marginVertical: 14,
    width: '100%',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
});
