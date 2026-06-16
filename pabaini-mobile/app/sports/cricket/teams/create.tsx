import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useTheme } from '../../../../src/context/ThemeContext';
import { createTeam } from '../../../../src/services/sports/cricketTeamsApi';
import { CreateTeamPayload } from '../../../../src/types/sports.types';
import { TeamFormFields } from '../../../../src/components/sports/teams/TeamFormFields';
import { useTeamsStore } from '../../../../src/store/sports/teamsStore';

export default function CreateTeamScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const fetchMyTeams = useTeamsStore((state) => state.fetchMyTeams);

  // Form states
  const [formValues, setFormValues] = useState<CreateTeamPayload>({
    name: '',
    description: '',
    home_ground: '',
    founded_year: undefined,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleFieldChange = (field: keyof CreateTeamPayload, value: any) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
    // Clear field specific error when value changes
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    setSubmitError(null);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formValues.name || !formValues.name.trim()) {
      newErrors.name = 'Team name is required';
    } else if (formValues.name.trim().length < 3) {
      newErrors.name = 'Team name must be at least 3 characters';
    }

    if (formValues.founded_year) {
      const currentYear = new Date().getFullYear();
      if (formValues.founded_year < 1900 || formValues.founded_year > currentYear) {
        newErrors.founded_year = `Year must be between 1900 and ${currentYear}`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const payload: CreateTeamPayload = {
        name: formValues.name.trim(),
        description: formValues.description?.trim() || undefined,
        home_ground: formValues.home_ground?.trim() || undefined,
        founded_year: formValues.founded_year,
      };

      const newTeam = await createTeam(payload);
      
      // Refresh the myTeams list in store
      await fetchMyTeams();

      // Redirect to the Team Profile screen of the newly created team
      router.replace(`/sports/cricket/teams/${newTeam.id}`);
    } catch (error: any) {
      console.error('Failed to create team:', error);
      const backendError = error.response?.data?.message || 'Failed to create team. Please try again.';
      setSubmitError(backendError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isNameEmpty = !formValues.name || !formValues.name.trim();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoiding}
      >
        {/* Header Bar */}
        <View style={[styles.headerBar, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} disabled={isSubmitting}>
            <ArrowLeft color={theme.colors.textPrimary} size={24} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Create a Team</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Form Body */}
        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {submitError && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{submitError}</Text>
            </View>
          )}

          <TeamFormFields
            values={formValues}
            onChange={handleFieldChange}
            errors={errors}
            disabled={isSubmitting}
          />
        </ScrollView>

        {/* Fixed Submit Footer */}
        <View style={[styles.footer, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
          <TouchableOpacity
            style={[
              styles.submitBtn,
              {
                backgroundColor: isNameEmpty || isSubmitting ? theme.colors.border : theme.colors.primary,
                borderRadius: theme.radius.sm,
              },
            ]}
            onPress={handleSubmit}
            disabled={isNameEmpty || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={theme.colors.onPrimary} />
            ) : (
              <Text style={[styles.submitBtnText, { color: isNameEmpty || isSubmitting ? theme.colors.textSecondary : theme.colors.onPrimary }]}>
                Create Team
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardAvoiding: {
    flex: 1,
  },
  headerBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  body: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  errorContainer: {
    backgroundColor: '#FCEBEB',
    borderWidth: 1,
    borderColor: '#F7C5C5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  errorText: {
    color: '#791F1F',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  submitBtn: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
