import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, UserPlus, MoreVertical, Edit, Image as ImageIcon, Trash2 } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../../../../src/context/ThemeContext';
import { useSportsStore } from '../../../../../src/store/sports/sportsStore';
import { useTeamsStore } from '../../../../../src/store/sports/teamsStore';
import {
  getTeamById,
  getPendingMembers,
  acceptMembership,
  rejectMembership,
  removeMember,
  transferCaptaincy,
  deleteTeam,
  updateTeam,
  uploadTeamLogo,
} from '../../../../../src/services/sports/cricketTeamsApi';
import { TeamFull, TeamMember, PendingMembers, CreateTeamPayload } from '../../../../../src/types/sports.types';
import { SquadMemberRow } from '../../../../../src/components/sports/teams/SquadMemberRow';
import { PendingMemberRow } from '../../../../../src/components/sports/teams/PendingMemberRow';
import { TeamFormFields } from '../../../../../src/components/sports/teams/TeamFormFields';
import { ActionSheet, ActionSheetOption } from '../../../../../src/components/sports/common/ActionSheet';

type ManageTab = 'requests' | 'invites' | 'squad';

export default function CaptainManageScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const teamId = typeof id === 'string' ? parseInt(id, 10) : parseInt(id?.[0] || '0', 10);
  const fetchMyTeams = useTeamsStore((state) => state.fetchMyTeams);

  // Get current user registration & profile
  const myProfile = useSportsStore((state) => state.registrations['cricket']?.profile);

  // Screen State
  const [team, setTeam] = useState<TeamFull | null>(null);
  const [pending, setPending] = useState<PendingMembers>({ pending_requests: [], pending_invites: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ManageTab>('requests');

  // Options & Actions Sheets
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState<Record<number, boolean>>({});

  // Settings Edit Modal
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editFormValues, setEditFormValues] = useState<CreateTeamPayload>({ name: '' });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [isUpdatingDetails, setIsUpdatingDetails] = useState(false);

  // Fetch full details
  const loadManageData = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const teamData = await getTeamById(teamId);

      // Guard: Make sure current user is the captain
      if (!myProfile || teamData.captain.id !== myProfile.id) {
        Alert.alert('Access Denied', 'Only the captain of this team can access this management screen.');
        router.back();
        return;
      }

      const pendingData = await getPendingMembers(teamId);

      setTeam(teamData);
      setPending(pendingData);
      setEditFormValues({
        name: teamData.name,
        description: teamData.description || '',
        home_ground: teamData.home_ground || '',
        founded_year: teamData.founded_year || undefined,
      });
    } catch (error) {
      console.error('Failed to load manage dashboard:', error);
      Alert.alert('Error', 'Failed to retrieve management details');
      router.back();
    } finally {
      setLoading(false);
    }
  }, [teamId, myProfile]);

  useEffect(() => {
    if (teamId) {
      loadManageData();
    }
  }, [teamId]);

  // Action: Accept request
  const handleAcceptRequest = async (member: TeamMember) => {
    setIsProcessing((prev) => ({ ...prev, [member.id]: true }));
    try {
      await acceptMembership(teamId, member.id);
      Alert.alert('Accepted', `${member.player.user.name} is now a member of your squad.`);
      await loadManageData(false);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to accept request.');
    } finally {
      setIsProcessing((prev) => ({ ...prev, [member.id]: false }));
    }
  };

  // Action: Reject request / Cancel invite
  const handleRejectOrCancel = async (member: TeamMember, typeText: string) => {
    setIsProcessing((prev) => ({ ...prev, [member.id]: true }));
    try {
      await rejectMembership(teamId, member.id);
      Alert.alert(typeText === 'request' ? 'Request Rejected' : 'Invite Cancelled', 'Successful.');
      await loadManageData(false);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update membership.');
    } finally {
      setIsProcessing((prev) => ({ ...prev, [member.id]: false }));
    }
  };

  // Action: Remove squad member
  const handleRemoveSquadMember = (member: TeamMember) => {
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${member.player.user.name} from the squad?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await removeMember(teamId, member.id);
              Alert.alert('Removed', 'Squad member has been removed.');
              await loadManageData(false);
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to remove member.');
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Action: Transfer captaincy
  const handleTransferCaptaincy = (member: TeamMember) => {
    Alert.alert(
      'Transfer Captaincy',
      `WARNING: You are transferring team ownership to ${member.player.user.name}. You will lose captain privileges and be redirected.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Transfer',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await transferCaptaincy(teamId, member.player.id);
              await fetchMyTeams();
              Alert.alert('Transferred', `Captaincy has been successfully transferred to ${member.player.user.name}.`);
              router.replace(`/sports/cricket/teams/${teamId}`);
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to transfer captaincy.');
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Action: Image Picker & Logo Upload
  const handleChangeLogo = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need access to your gallery to upload the logo.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setLoading(true);
        try {
          await uploadTeamLogo(teamId, result.assets[0].uri);
          Alert.alert('Success', 'Team logo has been successfully updated.');
          await loadManageData(false);
        } catch (error: any) {
          Alert.alert('Error', error.response?.data?.message || 'Failed to upload logo.');
          setLoading(false);
        }
      }
    } catch (err) {
      console.error('Pick image error:', err);
      Alert.alert('Error', 'Failed to pick image.');
    }
  };

  // Action: Update details (Form submit)
  const handleUpdateDetails = async () => {
    if (!editFormValues.name || !editFormValues.name.trim()) {
      setEditErrors({ name: 'Team name is required' });
      return;
    }

    setIsUpdatingDetails(true);
    try {
      await updateTeam(teamId, {
        name: editFormValues.name.trim(),
        description: editFormValues.description?.trim() || undefined,
        home_ground: editFormValues.home_ground?.trim() || undefined,
        founded_year: editFormValues.founded_year,
      });
      
      setEditModalVisible(false);
      Alert.alert('Success', 'Team configurations updated.');
      await fetchMyTeams();
      await loadManageData(false);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update details.');
    } finally {
      setIsUpdatingDetails(false);
    }
  };

  // Action: Delete team
  const handleDeleteTeam = () => {
    Alert.alert(
      'Delete Team',
      'CRITICAL: Are you sure you want to delete this team? This action is permanent, soft-deletes the team, and dissolves the active squad. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await deleteTeam(teamId);
              await fetchMyTeams();
              Alert.alert('Team Deleted', 'The team has been successfully deleted.');
              router.replace('/(tabs)/sports');
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to delete team.');
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Open squad options sheet
  const handleOpenMemberMenu = (member: TeamMember) => {
    setSelectedMember(member);
    setActionSheetVisible(true);
  };

  const memberOptions: ActionSheetOption[] = selectedMember
    ? [
        {
          label: 'Transfer Captaincy',
          onPress: () => handleTransferCaptaincy(selectedMember),
          destructive: true,
        },
        {
          label: 'Remove from Team',
          onPress: () => handleRemoveSquadMember(selectedMember),
          destructive: true,
        },
        // TODO: Make Vice Captain option will call a role update endpoint once it is built on the backend
      ]
    : [];

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!team) return null;

  const activeSquad = team.members.filter((m) => m.status === 'active');

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      {/* Header Bar */}
      <View style={[styles.headerBar, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft color={theme.colors.textPrimary} size={24} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Manage Team</Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]} numberOfLines={1}>
            {team.name}
          </Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* Tab Selectors */}
      <View style={styles.tabsContainer}>
        {/* Requests Tab */}
        <TouchableOpacity
          style={[
            styles.tabPill,
            activeTab === 'requests'
              ? { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }
              : { borderColor: theme.colors.border },
          ]}
          onPress={() => setActiveTab('requests')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'requests' ? '#FFFFFF' : theme.colors.textSecondary }]}>
            Requests
          </Text>
          {pending.pending_requests.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{pending.pending_requests.length}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Invites Tab */}
        <TouchableOpacity
          style={[
            styles.tabPill,
            activeTab === 'invites'
              ? { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }
              : { borderColor: theme.colors.border },
          ]}
          onPress={() => setActiveTab('invites')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'invites' ? '#FFFFFF' : theme.colors.textSecondary }]}>
            Invites
          </Text>
          {pending.pending_invites.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{pending.pending_invites.length}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Squad Tab */}
        <TouchableOpacity
          style={[
            styles.tabPill,
            activeTab === 'squad'
              ? { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }
              : { borderColor: theme.colors.border },
          ]}
          onPress={() => setActiveTab('squad')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'squad' ? '#FFFFFF' : theme.colors.textSecondary }]}>
            Squad ({activeSquad.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* REQUESTS LIST */}
        {activeTab === 'requests' && (
          <View>
            {pending.pending_requests.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyEmoji}>👥</Text>
                <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>No join requests</Text>
                <Text style={[styles.emptyDesc, { color: theme.colors.textSecondary }]}>
                  When players request to join your team, they will appear here.
                </Text>
              </View>
            ) : (
              pending.pending_requests.map((member) => (
                <PendingMemberRow
                  key={member.id}
                  member={member}
                  type="request"
                  onAccept={() => handleAcceptRequest(member)}
                  onReject={() => handleRejectOrCancel(member, 'request')}
                  loading={isProcessing[member.id]}
                />
              ))
            )}
          </View>
        )}

        {/* INVITES LIST */}
        {activeTab === 'invites' && (
          <View>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.inviteSearchBtn, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
              onPress={() => router.push(`/sports/cricket/teams/${teamId}/invite`)}
            >
              <UserPlus size={18} color={theme.colors.primary} />
              <Text style={[styles.inviteSearchBtnText, { color: theme.colors.primary }]}>
                + Invite Player
              </Text>
            </TouchableOpacity>

            {pending.pending_invites.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyEmoji}>✉️</Text>
                <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>No pending invites</Text>
                <Text style={[styles.emptyDesc, { color: theme.colors.textSecondary }]}>
                  Invite players in the village to build up your team roster.
                </Text>
              </View>
            ) : (
              pending.pending_invites.map((member) => (
                <PendingMemberRow
                  key={member.id}
                  member={member}
                  type="invite"
                  onCancel={() => handleRejectOrCancel(member, 'invite')}
                  loading={isProcessing[member.id]}
                />
              ))
            )}
          </View>
        )}

        {/* ACTIVE SQUAD LIST */}
        {activeTab === 'squad' && (
          <View>
            <View style={styles.squadList}>
              {activeSquad.map((member) => {
                const isSelf = member.player.id === myProfile?.id;
                return (
                  <SquadMemberRow
                    key={member.id}
                    member={member}
                    rightContent={
                      !isSelf ? (
                        <TouchableOpacity style={styles.menuBtn} onPress={() => handleOpenMemberMenu(member)}>
                          <MoreVertical size={20} color={theme.colors.textSecondary} />
                        </TouchableOpacity>
                      ) : null
                    }
                  />
                );
              })}
            </View>

            {/* Team Settings / Actions Area */}
            <View style={[styles.settingsSection, { borderColor: theme.colors.border }]}>
              <Text style={[styles.settingsHeading, { color: theme.colors.textSecondary }]}>
                TEAM SETTINGS
              </Text>

              {/* Edit Details */}
              <TouchableOpacity
                style={[styles.settingsRow, { borderBottomColor: theme.colors.border }]}
                onPress={() => setEditModalVisible(true)}
              >
                <View style={styles.settingsRowLeft}>
                  <Edit size={18} color={theme.colors.textPrimary} />
                  <Text style={[styles.settingsRowLabel, { color: theme.colors.textPrimary }]}>
                    Edit Team Details
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Edit Logo */}
              <TouchableOpacity
                style={[styles.settingsRow, { borderBottomColor: theme.colors.border }]}
                onPress={handleChangeLogo}
              >
                <View style={styles.settingsRowLeft}>
                  <ImageIcon size={18} color={theme.colors.textPrimary} />
                  <Text style={[styles.settingsRowLabel, { color: theme.colors.textPrimary }]}>
                    Upload Team Logo
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Delete Team */}
              <TouchableOpacity style={styles.settingsRow} onPress={handleDeleteTeam}>
                <View style={styles.settingsRowLeft}>
                  <Trash2 size={18} color="#FF3B30" />
                  <Text style={[styles.settingsRowLabel, { color: '#FF3B30', fontWeight: '700' }]}>
                    Delete Team
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Squad Member Context Menu Sheet */}
      <ActionSheet
        visible={actionSheetVisible}
        onClose={() => setActionSheetVisible(false)}
        title={selectedMember ? `Manage ${selectedMember.player.user.name}` : undefined}
        options={memberOptions}
      />

      {/* Inline Settings Modal */}
      <Modal visible={editModalVisible} animationType="slide" transparent={false}>
        <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoiding}
          >
            <View style={[styles.headerBar, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <TouchableOpacity style={styles.backButton} onPress={() => setEditModalVisible(false)} disabled={isUpdatingDetails}>
                <Text style={{ color: theme.colors.textSecondary, fontSize: 16 }}>Cancel</Text>
              </TouchableOpacity>
              <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Edit Details</Text>
              <TouchableOpacity onPress={handleUpdateDetails} disabled={isUpdatingDetails}>
                {isUpdatingDetails ? (
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                ) : (
                  <Text style={{ color: theme.colors.primary, fontSize: 16, fontWeight: '700' }}>Save</Text>
                )}
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.body} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
              <TeamFormFields
                values={editFormValues}
                onChange={(field, val) => setEditFormValues((prev) => ({ ...prev, [field]: val }))}
                errors={editErrors}
                disabled={isUpdatingDetails}
              />
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
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
  headerTitleContainer: {
    alignItems: 'center',
    maxWidth: '70%',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  tabPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    position: 'relative',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -2,
    backgroundColor: '#FF3B30',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyContainer: {
    paddingVertical: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 13,
    textAlign: 'center',
    marginHorizontal: 32,
    lineHeight: 18,
  },
  inviteSearchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
  },
  inviteSearchBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  squadList: {
    marginBottom: 20,
  },
  menuBtn: {
    padding: 4,
  },
  settingsSection: {
    borderTopWidth: 1,
    paddingTop: 20,
  },
  settingsHeading: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 10,
    paddingLeft: 4,
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingsRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingsRowLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  keyboardAvoiding: {
    flex: 1,
  },
  body: {
    flex: 1,
  },
});
