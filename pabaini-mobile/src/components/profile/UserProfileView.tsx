import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../hooks/useAuth';
import { useSportsStore } from '../../store/sports/sportsStore';
import { getPublicProfile } from '../../services/usersApi';
import { ProfileSkeleton } from '../skeletons';
import { GeneralInfoSection } from './GeneralInfoSection';
import { CricketSection } from './CricketSection';
import { SetupBanner } from '../sports/common/SetupBanner';
import { AlertTriangle } from 'lucide-react-native';
import { PublicUser, CricketProfileBundle } from '../../types/profile.types';
import { Role } from '../../types';

interface UserProfileViewProps {
  userId: number;
  isOwnProfile: boolean;
}

export function UserProfileView({ userId, isOwnProfile }: UserProfileViewProps) {
  const { theme } = useTheme();
  const router = useRouter();
  const { user: authUser } = useAuth();
  const registrations = useSportsStore((state) => state.registrations['cricket']);

  // Local state
  const [data, setData] = useState<{ user: PublicUser; cricket: CricketProfileBundle | null } | null>(() => {
    // Optimization: Pre-fill own profile from cached auth and sports store data to avoid visual flashing
    if (isOwnProfile && authUser) {
      const cachedUser: PublicUser = {
        id: authUser.id,
        name: authUser.name,
        avatar_url: authUser.avatar_url,
        village: authUser.village || 'Pabaini',
        is_diaspora: authUser.is_diaspora || false,
        role: authUser.role || 'resident',
        created_at: authUser.created_at,
      };

      let cachedCricket: CricketProfileBundle | null = null;
      if (registrations?.isRegistered && registrations?.profile) {
        cachedCricket = {
          player_profile: {
            id: registrations.profile.id,
            role: registrations.profile.role,
            batting_hand: registrations.profile.batting_hand,
            bowling_arm: registrations.profile.bowling_arm,
            bowling_type: registrations.profile.bowling_type,
          },
          stats: {
            competitive: { matches: 0, innings: 0, runs: 0, highest_score: 0, average: 0, strike_rate: 0, fours: 0, sixes: 0, wickets: 0, best_bowling: null, economy: 0 },
            casual: { matches: 0, innings: 0, runs: 0, highest_score: 0, average: 0, strike_rate: 0, fours: 0, sixes: 0, wickets: 0, best_bowling: null, economy: 0 },
          },
          current_teams: [],
          past_teams: [],
          trophies: [],
        };
      }

      return { user: cachedUser, cricket: cachedCricket };
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState(() => {
    // If own profile is cached, we don't display full-screen loading skeleton immediately
    if (isOwnProfile && authUser) {
      return false;
    }
    return true;
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [is404, setIs404] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchProfile = useCallback(async (showLoader = false) => {
    if (showLoader) setIsLoading(true);
    setIs404(false);
    setErrorMsg(null);

    try {
      const profileData = await getPublicProfile(userId);
      setData(profileData);
    } catch (err: any) {
      console.error(`Failed to load profile for user ${userId}:`, err);
      if (err.response?.status === 404) {
        setIs404(true);
      } else {
        setErrorMsg(err.response?.data?.message || err.message || 'Network error: Failed to fetch profile details');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [userId]);

  // Initial fetch on mount / userId change
  useEffect(() => {
    fetchProfile(!data); // Only show full loader if we don't have cached data
  }, [userId, fetchProfile]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchProfile(false);
  };

  const handleRoleUpdated = (newRole: Role) => {
    if (data) {
      setData({
        ...data,
        user: {
          ...data.user,
          role: newRole,
        },
      });
    }
  };

  // 1. Render 404 Error State
  if (is404) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.colors.background }]}>
        <AlertTriangle size={48} color={theme.colors.textSecondary} style={styles.errorIcon} />
        <Text style={[styles.errorTitle, { color: theme.colors.textPrimary }]}>
          Profile Not Found
        </Text>
        <Text style={[styles.errorSubtitle, { color: theme.colors.textSecondary }]}>
          This profile doesn't exist or has been removed.
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.errorButton, { backgroundColor: theme.colors.primary }]}
        >
          <Text style={[styles.errorButtonText, { color: theme.colors.onPrimary }]}>
            Go Back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 2. Render General Network Error State
  if (errorMsg && !data) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.colors.background }]}>
        <AlertTriangle size={48} color="#DC2626" style={styles.errorIcon} />
        <Text style={[styles.errorTitle, { color: theme.colors.textPrimary }]}>
          Load Failed
        </Text>
        <Text style={[styles.errorSubtitle, { color: theme.colors.textSecondary }]}>
          {errorMsg}
        </Text>
        <TouchableOpacity
          onPress={() => fetchProfile(true)}
          style={[styles.errorButton, { backgroundColor: theme.colors.primary }]}
        >
          <Text style={[styles.errorButtonText, { color: theme.colors.onPrimary }]}>
            Try Again
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 3. Render Loading Skeleton
  if (isLoading && !data) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <ProfileSkeleton />
      </ScrollView>
    );
  }

  // Fallback if no data resolves and no error was caught
  if (!data) {
    return null;
  }

  const isCricketPlayer = !!data.cricket;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor={theme.colors.primary}
        />
      }
    >
      {/* Hero + Account Info */}
      <GeneralInfoSection
        user={data.user}
        isOwnProfile={isOwnProfile}
        isCricketPlayer={isCricketPlayer}
        onRoleUpdated={handleRoleUpdated}
      />

      {/* Cricket section or setup prompt */}
      {data.cricket ? (
        <CricketSection cricket={data.cricket} isOwnProfile={isOwnProfile} />
      ) : isOwnProfile ? (
        <View style={styles.bannerContainer}>
          <SetupBanner onPress={() => router.push('/sports/cricket/onboarding/role')} />
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  bannerContainer: {
    paddingHorizontal: 16,
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  errorIcon: {
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  errorButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  errorButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
