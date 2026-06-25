import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import client from '../../../../src/api/client';
import { useAuth } from '../../../../src/hooks/useAuth';
import { LoginRequiredGate } from '../../../../src/components/ui/LoginRequiredGate';
import { CricketPlayerProfile } from '../../../../src/types/sports.types';
import { CricketPlayerCard } from '../../../../src/components/sports/cricket/CricketPlayerCard';
import { PlayerCardSkeleton } from '../../../../src/components/skeletons';

export default function DiscoverPlayersScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { isGuest } = useAuth();

  // Local state
  const [players, setPlayers] = useState<CricketPlayerProfile[]>([]);
  const playersRef = useRef(players);
  playersRef.current = players;

  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const isFetchingRef = useRef(false);

  const fetchPlayers = useCallback(
    async (targetPage: number, search = searchQuery, isRefresh = false) => {
      if (isFetchingRef.current || (targetPage > totalPages && !isRefresh)) return;

      try {
        isFetchingRef.current = true;
        if (targetPage === 1 && (!isRefresh || playersRef.current.length === 0)) {
          setLoading(true);
        } else if (targetPage > 1) {
          setLoadingMore(true);
        }

        const response = await client.get('/sports/cricket/players', {
          params: {
            page: targetPage,
            limit: 10,
            search: search.trim() || undefined,
          },
        });

        const result = response.data?.data;
        if (result) {
          const fetched = result.data || [];
          const meta = result.meta || { page: 1, totalPages: 1 };

          setPlayers((prev) => (isRefresh || targetPage === 1 ? fetched : [...prev, ...fetched]));
          setPage(meta.page);
          setTotalPages(meta.totalPages);
        }
      } catch (error: any) {
        console.error('Error fetching players list:', error);
        Alert.alert('Error', 'Failed to retrieve players list.');
      } finally {
        setLoading(false);
        setLoadingMore(false);
        isFetchingRef.current = false;
      }
    },
    [totalPages, searchQuery]
  );

  useEffect(() => {
    if (!isGuest) {
      fetchPlayers(1, searchQuery, true);
    }
  }, [isGuest, fetchPlayers, searchQuery]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPlayers(1, searchQuery, true);
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (page < totalPages && !loadingMore && !loading) {
      fetchPlayers(page + 1, searchQuery, false);
    }
  };

  // Immediate search on text change
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (!isGuest) {
      fetchPlayers(1, text, true);
    }
  };

  if (isGuest) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        {/* Header Bar */}
        <View style={[styles.headerBar, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft color={theme.colors.textPrimary} size={24} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Discover Players</Text>
          <View style={{ width: 44 }} />
        </View>
        <LoginRequiredGate title="Discover Players" description="Please log in to browse cricket players and view their profiles." fullscreen={false} />
      </SafeAreaView>
    );
  }

  const renderEmpty = () => {
    if (loading) return null;

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>🏏</Text>
        <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>No players found</Text>
        <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
          Try searching for a different name.
        </Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
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
        
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Discover Players</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Sticky Search bar */}
      <View style={[styles.searchSection, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <View style={[styles.searchWrapper, { backgroundColor: theme.colors.background }]}>
          <Search size={18} color={theme.colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.textPrimary }]}
            placeholder="Search players by name..."
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={handleSearchChange}
            autoCorrect={false}
          />
        </View>
      </View>

      {/* Players list */}
      {loading && players.length === 0 ? (
        <View style={styles.loadingContainer}>
          <PlayerCardSkeleton />
          <PlayerCardSkeleton />
          <PlayerCardSkeleton />
        </View>
      ) : (
        <FlatList
          data={players}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.cardContainer}>
              <CricketPlayerCard
                profile={item}
                onPress={() => safeRouterPush(router, `/profile/${item.user.id}`)}
              />
            </View>
          )}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
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
  loadingContainer: {
    padding: 16,
    gap: 12,
  },
  listContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  cardContainer: {
    width: '100%',
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
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});
