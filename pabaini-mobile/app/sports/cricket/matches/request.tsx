import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Search, Calendar, ChevronDown, Check } from 'lucide-react-native';
import { useTheme } from '../../../../src/context/ThemeContext';
import { useTeamsStore } from '../../../../src/store/sports/teamsStore';
import { useAllTeams } from '../../../../src/hooks/useTeams';
import {
  useRequestMatch,
  useUpdateMatch,
  useMatchDetail,
} from '../../../../src/hooks/useMatches';
import { MatchScoringMode, RequestMatchPayload } from '../../../../src/types/sports.types';

// Helper to format ISO to YYYY-MM-DD HH:MM
const formatISOToInput = (isoString?: string | null): string => {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');

  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
};

// Helper to validate YYYY-MM-DD HH:MM
const validateDateString = (str: string): boolean => {
  if (!str) return true; // Optional field
  const regex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/;
  if (!regex.test(str)) return false;
  const parts = str.split(' ');
  const dateParts = parts[0].split('-').map(Number);
  const timeParts = parts[1].split(':').map(Number);

  const year = dateParts[0];
  const month = dateParts[1];
  const day = dateParts[2];
  const hour = timeParts[0];
  const minute = timeParts[1];

  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  if (hour < 0 || hour > 23) return false;
  if (minute < 0 || minute > 59) return false;

  const date = new Date(year, month - 1, day, hour, minute);
  return !isNaN(date.getTime());
};

export default function MatchRequestScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { matchId } = useLocalSearchParams<{ matchId?: string }>();
  const isEditMode = !!matchId;

  // Store data
  const myTeams = useTeamsStore((state) => state.myTeams);
  const activeCaptained = myTeams.filter((t) => t.role === 'captain' && t.status === 'active');

  // Queries & Mutations
  const { data: allTeams, isLoading: isLoadingAllTeams } = useAllTeams();
  const { data: match, isLoading: isLoadingMatch } = useMatchDetail(Number(matchId));
  const requestMutation = useRequestMatch();
  const updateMutation = useUpdateMatch();

  // Form states
  const [selectedOwnTeamId, setSelectedOwnTeamId] = useState<number | null>(null);
  const [selectedOpponentTeamId, setSelectedOpponentTeamId] = useState<number | null>(null);
  const [overs, setOvers] = useState('20');
  const [venue, setVenue] = useState('');
  const [scheduledAtText, setScheduledAtText] = useState('');
  const [scoringMode, setScoringMode] = useState<MatchScoringMode>('live');

  // Modals visible
  const [ownTeamModalVisible, setOwnTeamModalVisible] = useState(false);
  const [opponentModalVisible, setOpponentModalVisible] = useState(false);
  const [opponentSearch, setOpponentSearch] = useState('');

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Set default own team if user only captains 1 team
  useEffect(() => {
    if (!isEditMode && activeCaptained.length === 1 && selectedOwnTeamId === null) {
      setSelectedOwnTeamId(activeCaptained[0].id);
    }
  }, [activeCaptained, isEditMode, selectedOwnTeamId]);

  // Pre-fill when editing
  useEffect(() => {
    if (isEditMode && match) {
      setSelectedOwnTeamId(match.team_a_id);
      setSelectedOpponentTeamId(match.team_b_id);
      setOvers(String(match.overs));
      setVenue(match.venue || '');
      setScheduledAtText(formatISOToInput(match.scheduled_at));
      setScoringMode(match.scoring_mode || 'live');
    }
  }, [isEditMode, match]);

  // Dynamic quick dates for user convenience
  const getHelperDates = () => {
    const now = new Date();
    
    // Helper 1: Today + 2 hours
    const today2h = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const h1 = formatISOToInput(today2h.toISOString());

    // Helper 2: Tomorrow 10:00 AM
    const tomorrow10 = new Date();
    tomorrow10.setDate(tomorrow10.getDate() + 1);
    tomorrow10.setHours(10, 0, 0, 0);
    const h2 = formatISOToInput(tomorrow10.toISOString());

    // Helper 3: Tomorrow 4:00 PM
    const tomorrow16 = new Date();
    tomorrow16.setDate(tomorrow16.getDate() + 1);
    tomorrow16.setHours(16, 0, 0, 0);
    const h3 = formatISOToInput(tomorrow16.toISOString());

    return [
      { label: 'Today +2h', value: h1 },
      { label: 'Tomorrow 10 AM', value: h2 },
      { label: 'Tomorrow 4 PM', value: h3 },
    ];
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!isEditMode && !selectedOwnTeamId) {
      newErrors.ownTeam = 'Your team is required';
    }

    if (!isEditMode && !selectedOpponentTeamId) {
      newErrors.opponentTeam = 'Opponent team is required';
    } else if (!isEditMode && selectedOwnTeamId === selectedOpponentTeamId) {
      newErrors.opponentTeam = 'Opponent team cannot be your own team';
    }

    const oversNum = parseInt(overs, 10);
    if (!overs || isNaN(oversNum) || oversNum < 1 || oversNum > 100) {
      newErrors.overs = 'Overs must be a number between 1 and 100';
    }

    if (scheduledAtText && !validateDateString(scheduledAtText)) {
      newErrors.scheduledAt = 'Invalid format. Use YYYY-MM-DD HH:MM (e.g. 2026-06-25 15:30)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitError(null);

    // Convert date string back to ISO string
    let isoScheduledAt: string | undefined = undefined;
    if (scheduledAtText.trim()) {
      const parts = scheduledAtText.trim().split(' ');
      const dateParts = parts[0].split('-').map(Number);
      const timeParts = parts[1].split(':').map(Number);
      const date = new Date(
        dateParts[0],
        dateParts[1] - 1,
        dateParts[2],
        timeParts[0],
        timeParts[1]
      );
      isoScheduledAt = date.toISOString();
    }

    const payload: RequestMatchPayload = {
      opponent_team_id: selectedOpponentTeamId!,
      overs: parseInt(overs, 10),
      scoring_mode: scoringMode,
      venue: venue.trim() || undefined,
      scheduled_at: isoScheduledAt,
    };

    try {
      if (isEditMode) {
        await updateMutation.mutateAsync({
          id: Number(matchId),
          payload: {
            overs: payload.overs,
            scoring_mode: payload.scoring_mode,
            venue: payload.venue,
            scheduled_at: payload.scheduled_at,
          },
        });
        Alert.alert('Success', 'Match details updated successfully.');
        router.back();
      } else {
        const result = await requestMutation.mutateAsync(payload);
        Alert.alert('Success', 'Match request sent successfully!');
        router.replace(`/sports/cricket/matches/${result.id}`);
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || 'An error occurred';
      setSubmitError(errMsg);
      Alert.alert('Error', errMsg);
    }
  };

  const isSubmitting = requestMutation.isPending || updateMutation.isPending;

  // Filtering opponents
  const opponentFiltered = (allTeams || []).filter((t) => {
    // Exclude own team
    if (selectedOwnTeamId && t.id === selectedOwnTeamId) return false;
    // Exclude all other captained teams by this user
    if (activeCaptained.some((myT) => myT.id === t.id)) return false;
    // Apply search filter
    if (opponentSearch.trim()) {
      return t.name.toLowerCase().includes(opponentSearch.toLowerCase());
    }
    return true;
  });

  const selectedOwnTeam = activeCaptained.find((t) => t.id === selectedOwnTeamId);
  const selectedOpponentTeam = (allTeams || []).find((t) => t.id === selectedOpponentTeamId);

  if (isEditMode && isLoadingMatch) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

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
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
            {isEditMode ? 'Edit Match Request' : 'Send Match Request'}
          </Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Scroll Content */}
        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {submitError && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{submitError}</Text>
            </View>
          )}

          {/* Own Team Picker */}
          {!isEditMode && (
            <View style={styles.fieldContainer}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Your Team *</Text>
              {activeCaptained.length <= 1 ? (
                <View style={[styles.readOnlyContainer, { backgroundColor: theme.colors.border + '30', borderColor: theme.colors.border }]}>
                  <Text style={[styles.readOnlyText, { color: theme.colors.textPrimary }]}>
                    {activeCaptained[0]?.name || 'Loading own team...'}
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[styles.pickerButton, { backgroundColor: theme.colors.surface, borderColor: errors.ownTeam ? '#FF3B30' : theme.colors.border, borderRadius: theme.radius.sm }]}
                  onPress={() => setOwnTeamModalVisible(true)}
                  disabled={isSubmitting}
                >
                  <Text style={[styles.pickerButtonText, { color: selectedOwnTeam ? theme.colors.textPrimary : theme.colors.textSecondary }]}>
                    {selectedOwnTeam ? selectedOwnTeam.name : 'Select your team'}
                  </Text>
                  <ChevronDown color={theme.colors.textSecondary} size={20} />
                </TouchableOpacity>
              )}
              {errors.ownTeam && <Text style={styles.errorText}>{errors.ownTeam}</Text>}
            </View>
          )}

          {/* Opponent Team Picker */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Opponent Team *</Text>
            {isEditMode ? (
              <View style={[styles.readOnlyContainer, { backgroundColor: theme.colors.border + '30', borderColor: theme.colors.border }]}>
                <Text style={[styles.readOnlyText, { color: theme.colors.textPrimary }]}>
                  {match?.team_b.name || 'Opponent Team'}
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                activeOpacity={0.7}
                style={[styles.pickerButton, { backgroundColor: theme.colors.surface, borderColor: errors.opponentTeam ? '#FF3B30' : theme.colors.border, borderRadius: theme.radius.sm }]}
                onPress={() => setOpponentModalVisible(true)}
                disabled={isSubmitting}
              >
                <Text style={[styles.pickerButtonText, { color: selectedOpponentTeam ? theme.colors.textPrimary : theme.colors.textSecondary }]}>
                  {selectedOpponentTeam ? selectedOpponentTeam.name : 'Select opponent team'}
                </Text>
                <ChevronDown color={theme.colors.textSecondary} size={20} />
              </TouchableOpacity>
            )}
            {errors.opponentTeam && <Text style={styles.errorText}>{errors.opponentTeam}</Text>}
          </View>

          {/* Overs Input */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Overs *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.surface, borderColor: errors.overs ? '#FF3B30' : theme.colors.border, color: theme.colors.textPrimary, borderRadius: theme.radius.sm }]}
              placeholder="e.g. 20"
              placeholderTextColor={theme.colors.textSecondary}
              value={overs}
              onChangeText={(val) => setOvers(val.replace(/[^0-9]/g, ''))}
              keyboardType="numeric"
              maxLength={3}
              editable={!isSubmitting}
            />
            {errors.overs && <Text style={styles.errorText}>{errors.overs}</Text>}
          </View>

          {/* Venue Input */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Venue (Optional)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.textPrimary, borderRadius: theme.radius.sm }]}
              placeholder="e.g. Pabaini Sports Complex"
              placeholderTextColor={theme.colors.textSecondary}
              value={venue}
              onChangeText={setVenue}
              maxLength={200}
              editable={!isSubmitting}
            />
          </View>

          {/* Scheduled Date/Time Input */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Scheduled Date & Time (Optional)</Text>
            <View style={styles.dateTimeInputWrapper}>
              <TextInput
                style={[styles.input, { flex: 1, backgroundColor: theme.colors.surface, borderColor: errors.scheduledAt ? '#FF3B30' : theme.colors.border, color: theme.colors.textPrimary, borderRadius: theme.radius.sm, paddingRight: 40 }]}
                placeholder="YYYY-MM-DD HH:MM (e.g. 2026-06-25 15:30)"
                placeholderTextColor={theme.colors.textSecondary}
                value={scheduledAtText}
                onChangeText={setScheduledAtText}
                maxLength={16}
                editable={!isSubmitting}
              />
              <Calendar size={18} color={theme.colors.textSecondary} style={styles.calendarIcon} />
            </View>
            {errors.scheduledAt && <Text style={styles.errorText}>{errors.scheduledAt}</Text>}
            
            {/* Quick Helper Dates */}
            <View style={styles.helpersRow}>
              {getHelperDates().map((helper, idx) => (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.7}
                  style={[styles.helperChip, { backgroundColor: theme.colors.border + '40', borderColor: theme.colors.border }]}
                  onPress={() => setScheduledAtText(helper.value)}
                  disabled={isSubmitting}
                >
                  <Text style={[styles.helperChipText, { color: theme.colors.primary }]}>{helper.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Scoring Mode Input */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: theme.colors.textSecondary, marginBottom: 8 }]}>Scoring Mode *</Text>
            
            <View style={styles.scoringModeContainer}>
              {/* Option 1: Live Ball-by-ball */}
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.modeOption,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: scoringMode === 'live' ? theme.colors.primary : theme.colors.border,
                    borderWidth: scoringMode === 'live' ? 2 : 1,
                    borderRadius: theme.radius.md,
                  },
                ]}
                onPress={() => setScoringMode('live')}
                disabled={isSubmitting}
              >
                <View style={styles.modeOptionHeader}>
                  <Text style={[styles.modeOptionTitle, { color: theme.colors.textPrimary }]}>Live Ball-by-Ball</Text>
                  {scoringMode === 'live' && <View style={[styles.checkCircle, { backgroundColor: theme.colors.primary }]}><Check size={12} color={theme.colors.onPrimary} /></View>}
                </View>
                <Text style={[styles.modeOptionDesc, { color: theme.colors.textSecondary }]}>
                  Keep score live as it happens. Ball-by-ball updates will be visible to everyone in real-time.
                </Text>
              </TouchableOpacity>

              {/* Option 2: Simple Entry */}
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.modeOption,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: scoringMode === 'simple' ? theme.colors.primary : theme.colors.border,
                    borderWidth: scoringMode === 'simple' ? 2 : 1,
                    borderRadius: theme.radius.md,
                    marginTop: 12,
                  },
                ]}
                onPress={() => setScoringMode('simple')}
                disabled={isSubmitting}
              >
                <View style={styles.modeOptionHeader}>
                  <Text style={[styles.modeOptionTitle, { color: theme.colors.textPrimary }]}>Simple Entry</Text>
                  {scoringMode === 'simple' && <View style={[styles.checkCircle, { backgroundColor: theme.colors.primary }]}><Check size={12} color={theme.colors.onPrimary} /></View>}
                </View>
                <Text style={[styles.modeOptionDesc, { color: theme.colors.textSecondary }]}>
                  Enter the final result, totals, and key player performances manually after the match has completed.
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Footer Submit Button */}
        <View style={[styles.footer, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              {
                backgroundColor: isSubmitting ? theme.colors.border : theme.colors.primary,
                borderRadius: theme.radius.sm,
              },
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={theme.colors.onPrimary} />
            ) : (
              <Text style={[styles.submitButtonText, { color: theme.colors.onPrimary }]}>
                {isEditMode ? 'Save Changes' : 'Send Request'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Modal: Own Team Selector */}
        <Modal
          visible={ownTeamModalVisible}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setOwnTeamModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.colors.surface, borderRadius: theme.radius.md }]}>
              <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>Choose Your Team</Text>
              <FlatList
                data={activeCaptained}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.modalItem, { borderBottomColor: theme.colors.border }]}
                    onPress={() => {
                      setSelectedOwnTeamId(item.id);
                      setOwnTeamModalVisible(false);
                      // Clear opponent selection if it conflicts
                      if (selectedOpponentTeamId === item.id) {
                        setSelectedOpponentTeamId(null);
                      }
                    }}
                  >
                    <Text style={[styles.modalItemText, { color: theme.colors.textPrimary }]}>{item.name}</Text>
                    {selectedOwnTeamId === item.id && <Check size={18} color={theme.colors.primary} />}
                  </TouchableOpacity>
                )}
              />
              <TouchableOpacity
                style={[styles.modalCloseButton, { backgroundColor: theme.colors.border }]}
                onPress={() => setOwnTeamModalVisible(false)}
              >
                <Text style={{ color: theme.colors.textPrimary, fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Modal: Opponent Team Selector */}
        <Modal
          visible={opponentModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setOpponentModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <SafeAreaView style={[styles.modalContentFullscreen, { backgroundColor: theme.colors.background }]}>
              {/* Header inside Modal */}
              <View style={[styles.headerBar, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <TouchableOpacity style={styles.backButton} onPress={() => setOpponentModalVisible(false)}>
                  <ArrowLeft color={theme.colors.textPrimary} size={24} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Select Opponent</Text>
                <View style={{ width: 36 }} />
              </View>

              {/* Search Box */}
              <View style={[styles.searchBoxWrapper, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
                <View style={[styles.searchBar, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                  <Search size={18} color={theme.colors.textSecondary} />
                  <TextInput
                    style={[styles.searchInput, { color: theme.colors.textPrimary }]}
                    placeholder="Search active teams..."
                    placeholderTextColor={theme.colors.textSecondary}
                    value={opponentSearch}
                    onChangeText={setOpponentSearch}
                  />
                </View>
              </View>

              {/* Teams List */}
              {isLoadingAllTeams ? (
                <View style={styles.centerContainer}>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
              ) : opponentFiltered.length === 0 ? (
                <View style={styles.centerContainer}>
                  <Text style={{ color: theme.colors.textSecondary }}>No active teams found</Text>
                </View>
              ) : (
                <FlatList
                  data={opponentFiltered}
                  keyExtractor={(item) => item.id.toString()}
                  contentContainerStyle={{ padding: 16 }}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[styles.opponentCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radius.sm }]}
                      onPress={() => {
                        setSelectedOpponentTeamId(item.id);
                        setOpponentModalVisible(false);
                        setOpponentSearch('');
                      }}
                    >
                      <View>
                        <Text style={[styles.opponentName, { color: theme.colors.textPrimary }]}>{item.name}</Text>
                        {item.home_ground && <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>Home: {item.home_ground}</Text>}
                      </View>
                      {selectedOpponentTeamId === item.id && <Check size={18} color={theme.colors.primary} />}
                    </TouchableOpacity>
                  )}
                />
              )}
            </SafeAreaView>
          </View>
        </Modal>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  errorBanner: {
    backgroundColor: '#FCEBEB',
    borderWidth: 1,
    borderColor: '#F7C5C5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  errorBannerText: {
    color: '#791F1F',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  dateTimeInputWrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  calendarIcon: {
    position: 'absolute',
    right: 12,
  },
  helpersRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  helperChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 16,
  },
  helperChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  pickerButtonText: {
    fontSize: 15,
  },
  readOnlyContainer: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 4,
  },
  readOnlyText: {
    fontSize: 15,
    fontWeight: '600',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  scoringModeContainer: {
    width: '100%',
  },
  modeOption: {
    padding: 14,
    borderWidth: 1,
  },
  modeOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  modeOptionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  checkCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeOptionDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  submitButton: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    maxHeight: '60%',
    padding: 20,
  },
  modalContentFullscreen: {
    flex: 1,
    width: '100%',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  modalItemText: {
    fontSize: 15,
  },
  modalCloseButton: {
    marginTop: 16,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  searchBoxWrapper: {
    padding: 12,
    borderBottomWidth: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  opponentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
  },
  opponentName: {
    fontSize: 14,
    fontWeight: '700',
  },
});
