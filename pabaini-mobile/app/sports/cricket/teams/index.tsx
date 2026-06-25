import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Search } from 'lucide-react-native';
import { useTheme } from '../../../../src/context/ThemeContext';
import { safeRouterPush } from '../../../../src/navigation/safeNavigation';
import { useSportsStore } from '../../../../src/store/sports/sportsStore';
import { useTeamsStore } from '../../../../src/store/sports/teamsStore';
import { useAuth } from '../../../../src/hooks/useAuth';
import { LoginRequiredGate } from '../../../../src/components/ui/LoginRequiredGate';
import { getAllTeams } from '../../../../src/services/sports/cricketTeamsApi';
import { TeamSummary } from '../../../../src/types/sports.types';
import { TeamCard } from '../../../../src/components/sports/teams/TeamCard';

export default function DiscoverTeamsScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { isGuest } = useAuth();
  
  // Get registration status from Zustand
  const isRegistered = useSportsStore((state) => state.isRegistered('cricket'));

  // Get my teams from Zustand store to check captain limit
  const myTeams = useTeamsStore((state) => state.myTeams);
  const captainedTeamsCount = myTeams.filter((t) => t.role === 'captain').length;
  const isAtCaptainLimit = captainedTeamsCount >= 2;

  // Local state
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadTeams = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const data = await getAllTeams();
      setTeams(data || []);
    } catch (error: any) {
      console.error('Failed to load discover teams:', error);
      Alert.alert('Error', 'Failed to retrieve teams list. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isGuest) {
      loadTeams();
    }
  }, [isGuest]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTeams(false);
    setRefreshing(false);
  };

  // Client side filtering
  const filteredTeams = teams.filter((team) =>
    team.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  if (isGuest) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        {/* Header Bar */}
        <View style={[styles.headerBar, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft color={theme.colors.textPrimary} size={24} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Discover Teams</Text>
          <View style={{ width: 44 }} />
        </View>
        <LoginRequiredGate title="Discover Teams" description="Please log in to browse village teams and view team profiles." fullscreen={false} />
      </SafeAreaView>
    );
  }

  const renderEmpty = () => {
    if (loading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>🏏</Text>
        <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>No teams yet</Text>
        <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
          Be the first to create a cricket team in Pabaini.
        </Text>
        {isRegistered && (
          <View style={{ alignItems: 'center' }}>
            <TouchableOpacity
              disabled={isAtCaptainLimit}
              style={[
                styles.emptyBtn,
                {
                  backgroundColor: isAtCaptainLimit ? theme.colors.border : theme.colors.primary,
                  borderRadius: theme.radius.sm,
                },
              ]}
              onPress={() => safeRouterPush(router, '/sports/cricket/teams/create')}
            >
              <Text style={[styles.emptyBtnText, { color: isAtCaptainLimit ? theme.colors.textSecondary : theme.colors.onPrimary }]}>
                Create Team
              </Text>
            </TouchableOpacity>
            {isAtCaptainLimit && (
              <Text style={{
                color: theme.colors.textSecondary,
                fontSize: 12,
                marginTop: 12,
                textAlign: 'center',
                marginHorizontal: 32,
              }}>
                You're already captaining 2 teams. Transfer or dissolve one to create a new team.
              </Text>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      {/* Header Bar */}
      <View style={[styles.headerBar, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft color={theme.colors.textPrimary} size={24} />
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Discover Teams</Text>
        
        {isRegistered ? (
          <TouchableOpacity
            disabled={isAtCaptainLimit}
            style={styles.headerAction}
            onPress={() => safeRouterPush(router, '/sports/cricket/teams/create')}
          >
            <Text style={[styles.createLink, { color: isAtCaptainLimit ? theme.colors.border : theme.colors.primary }]}>
              + Create
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 44 }} />
        )}
      </View>

      {isAtCaptainLimit && isRegistered && (
        <View style={{
          backgroundColor: theme.colors.surface,
          paddingHorizontal: 16,
          paddingBottom: 12,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        }}>
          <Text style={{ color: theme.colors.textSecondary, fontSize: 12, fontStyle: 'italic' }}>
            You're already captaining 2 teams. Transfer or dissolve one to create a new team.
          </Text>
        </View>
      )}

      {/* Sticky Search bar */}
      <View style={[styles.searchSection, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <View style={[styles.searchWrapper, { backgroundColor: theme.colors.background }]}>
          <Search size={18} color={theme.colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.textPrimary }]}
            placeholder="Search teams by name..."
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
        </View>
      </View>

      {/* Teams list */}
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredTeams}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TeamCard
              team={item}
              onPress={() => safeRouterPush(router, `/sports/cricket/teams/${item.id}`)}
            />
          )}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
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
  headerAction: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  createLink: {
    fontSize: 15,
    fontWeight: '700',
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    height: '100%',
    paddingVertical: 0,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyContainer: {
    paddingVertical: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginHorizontal: 32,
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  emptyBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
