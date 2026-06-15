import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../context/ThemeContext';
import { ArrowLeft } from 'lucide-react-native';

interface OnboardingStepProps {
  currentStep: number;
  totalSteps?: number;
  title: string;
  description: string;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  nextLoading?: boolean;
  children: React.ReactNode;
}

export function OnboardingStep({
  currentStep,
  totalSteps = 3,
  title,
  description,
  onNext,
  nextLabel = 'Next',
  nextDisabled = false,
  nextLoading = false,
  children,
}: OnboardingStepProps) {
  const { theme } = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      {/* Header with Back Button and Progress Segments */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <ArrowLeft color={theme.colors.textPrimary} size={24} />
        </TouchableOpacity>

        {/* Segmented Progress Bar */}
        <View style={styles.progressBar}>
          {Array.from({ length: totalSteps }).map((_, index) => {
            const stepIndex = index + 1;
            const isCompleted = stepIndex < currentStep;
            const isActive = stepIndex === currentStep;

            return (
              <View
                key={stepIndex}
                style={[
                  styles.progressSegment,
                  {
                    backgroundColor: isCompleted
                      ? theme.colors.primary
                      : isActive
                      ? theme.colors.primary
                      : theme.colors.border,
                    opacity: isActive ? 1 : isCompleted ? 0.7 : 0.3,
                  },
                ]}
              />
            );
          })}
        </View>
        <View style={styles.headerRightPlaceholder} />
      </View>

      {/* Main Form Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headingContainer}>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>{title}</Text>
          <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
            {description}
          </Text>
        </View>

        {children}
      </ScrollView>

      {/* Sticky Bottom Action Button */}
      <View style={[styles.bottomContainer, { borderTopColor: theme.colors.border }]}>
        <TouchableOpacity
          style={[
            styles.nextButton,
            {
              backgroundColor: nextDisabled ? theme.colors.border : theme.colors.primary,
            },
          ]}
          onPress={onNext}
          disabled={nextDisabled || nextLoading}
          activeOpacity={0.8}
        >
          {nextLoading ? (
            <ActivityIndicator color={theme.colors.onPrimary} size="small" />
          ) : (
            <Text
              style={[
                styles.nextButtonText,
                {
                  color: nextDisabled ? theme.colors.textSecondary : theme.colors.onPrimary,
                },
              ]}
            >
              {nextLabel}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  progressBar: {
    flexDirection: 'row',
    flex: 1,
    marginHorizontal: 20,
    gap: 6,
    height: 4,
  },
  progressSegment: {
    flex: 1,
    height: '100%',
    borderRadius: 2,
  },
  headerRightPlaceholder: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  headingContainer: {
    marginBottom: 28,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  bottomContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    backgroundColor: '#FFFFFF',
  },
  nextButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
