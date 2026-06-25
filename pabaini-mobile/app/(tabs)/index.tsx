import React, { useState, useCallback, useRef } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, Text, TouchableOpacity, Modal, Alert, ActivityIndicator, Share, Animated, Easing } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { safeRouterPush } from '../../src/navigation/safeNavigation';
import { Plus } from 'lucide-react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/hooks/useAuth';
import { useAnnouncements } from '../../src/hooks/useAnnouncements';
import { AnnouncementCard } from '../../src/components/notice/AnnouncementCard';
import { CategoryFilterBar } from '../../src/components/notice/CategoryFilterBar';
import { NoticeFeedSkeleton } from '../../src/components/skeletons';
import { Category, Announcement } from '../../src/types';
import { queryKeys } from '../../src/constants/queryKeys';
import { update, softDelete } from '../../src/api/announcements';
import { PabainiLogo } from '../../src/components/ui/PabainiLogo';
import { useNotificationsStore } from '../../src/store/notificationsStore';
import { useAuthPromptStore } from '../../src/store/authPromptStore';

export default function HomeScreen() {
  const { theme } = useTheme();
  const { user, isGuest } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [isFocused, setIsFocused] = useState(true);

  const chipsVisible = useRef(true);
  const animValue = useRef(new Animated.Value(1)).current;
  const lastScrollY = useRef(0);

  // Notifications unread count
  const unreadCount = useNotificationsStore((state) => state.unreadCount);
  const fetchUnreadCount = useNotificationsStore((state) => state.fetchUnreadCount);

  const toggleChips = useCallback((visible: boolean) => {
    if (visible === chipsVisible.current) return;
    chipsVisible.current = visible;
    Animated.timing(animValue, {
      toValue: visible ? 1 : 0,
      duration: 180,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1), // smooth standard ease-out curve
      useNativeDriver: false,
    }).start();
  }, [animValue]);

  const handleScroll = useCallback((event: any) => {
    const currentOffset = event.nativeEvent.contentOffset.y;
    const diff = currentOffset - lastScrollY.current;

    if (Math.abs(diff) > 15) {
      if (currentOffset <= 0) {
        toggleChips(true);
      } else if (diff > 0) {
        toggleChips(false);
      } else {
        toggleChips(true);
      }
    }
    // Always update lastScrollY on every frame to ensure smooth scroll differential tracking
    lastScrollY.current = currentOffset;
  }, [toggleChips]);

  const { data: announcements = [], isLoading, refetch } = useAnnouncements(
    selectedCategory === 'all' ? undefined : selectedCategory,
    { refetchInterval: isFocused ? 20000 : false }
  );

  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      refetch();
      if (!isGuest) {
        fetchUnreadCount();
        const interval = setInterval(() => {
          fetchUnreadCount();
        }, 35000);
        return () => {
          setIsFocused(false);
          clearInterval(interval);
        };
      }
      return () => {
        setIsFocused(false);
      };
    }, [refetch, isGuest, fetchUnreadCount])
  );

  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [activeAction, setActiveAction] = useState<'pin' | 'delete' | null>(null);

  const handleSettingsPress = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setMenuVisible(true);
  };

  const handleCloseMenu = () => {
    if (activeAction !== null) return;
    setMenuVisible(false);
    setSelectedAnnouncement(null);
  };

  const handleTogglePin = async () => {
    if (!selectedAnnouncement) return;
    try {
      setActiveAction('pin');
      await update(selectedAnnouncement.id, { is_pinned: !selectedAnnouncement.is_pinned });

      // Invalidate queries to refresh feed
      await queryClient.invalidateQueries({ queryKey: queryKeys.announcements.all });

      setMenuVisible(false);
      setSelectedAnnouncement(null);
    } catch (error) {
      console.error('Failed to toggle pin status:', error);
      Alert.alert('Error', 'Failed to update pin status. Please try again.');
    } finally {
      setActiveAction(null);
    }
  };

  const handleDeleteAnnouncement = () => {
    if (!selectedAnnouncement) return;

    Alert.alert(
      'Delete Announcement',
      'Are you sure you want to delete this announcement? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setActiveAction('delete');
              await softDelete(selectedAnnouncement.id);

              // Invalidate queries to refresh feed
              await queryClient.invalidateQueries({ queryKey: queryKeys.announcements.all });

              setMenuVisible(false);
              setSelectedAnnouncement(null);
            } catch (error) {
              console.error('Failed to delete announcement:', error);
              Alert.alert('Error', 'Failed to delete announcement. Please try again.');
            } finally {
              setActiveAction(null);
            }
          }
        }
      ]
    );
  };

  const handleCreatePress = () => {
    if (isGuest) {
      useAuthPromptStore.getState().showPrompt({
        title: 'Post Setup Required',
        description: 'You must log in to post announcements.',
      });
      return;
    }
    if (user?.role === 'admin' || user?.role === 'moderator') {
      // router.push('/announcement/create');
      safeRouterPush(router, '/announcement/create');
    }
  };

  const handleBellPress = () => {
    if (isGuest) {
      useAuthPromptStore.getState().showPrompt({
        title: 'Notifications Required',
        description: 'You must log in to view notifications.',
      });
      return;
    }
    // router.push('/notifications');
    safeRouterPush(router, '/notifications');
  };

  const handleShare = async (announcement: Announcement) => {
    try {
      await Share.share({
        title: announcement.title,
        message: `Check out this announcement on Pabaini village board:\n\n*${announcement.title}*\n\n${announcement.content}\n\nJoin the village feed: https://pabaini.app/announcements/${announcement.id}`,
      });
    } catch (error) {
      console.error('Error sharing announcement:', error);
    }
  };

  return (
    <SafeAreaView style={[styles.content, { backgroundColor: theme.colors.surface }]} edges={['top', 'left', 'right']}>
      {/* Sticky Header */}
      <View style={[
        styles.header,
        {
          backgroundColor: theme.colors.surface,
          borderBottomWidth: 0.5,
          borderBottomColor: theme.colors.border,
        }
      ]}>
        <View style={styles.headerLeft}>
          {/* <PabainiLogo size={28} /> */}
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
            Pabaini
          </Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.searchButton, { backgroundColor: theme.colors.elevated }]}
            // onPress={() => router.push('/search')}
            onPress={() => safeRouterPush(router, '/search')}
            activeOpacity={0.7}
          >
            <Ionicons name="search-outline" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.bellButton, { backgroundColor: theme.colors.elevated }]}
            onPress={handleBellPress}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={20} color={theme.colors.textSecondary} />
            {unreadCount > 0 && (
              <View style={[
                styles.bellBadge,
                {
                  backgroundColor: theme.colors.danger,
                  borderColor: theme.colors.onPrimary,
                }
              ]} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <Animated.View style={{
          height: animValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 54],
          }),
          opacity: animValue,
          overflow: 'hidden',
        }}>
          <CategoryFilterBar
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        </Animated.View>

        {isLoading ? (
          <NoticeFeedSkeleton />
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={() => refetch()}
                colors={[theme.colors.primary]}
                tintColor={theme.colors.primary}
              />
            }
          >
            {announcements.map((announcement: Announcement) => (
              <AnnouncementCard
                key={announcement.id}
                announcement={announcement}
                onShare={handleShare}
                onSettingsPress={handleSettingsPress}
              />
            ))}

            {announcements.length === 0 && !isLoading && (
              <View style={styles.emptyContainer}>
                <Ionicons name="megaphone-outline" size={48} color={theme.colors.primaryLight} />
                <Text style={[styles.emptyTitle, { color: theme.colors.textSecondary }]}>
                  No announcements yet
                </Text>
                <Text style={[styles.emptySubtitle, { color: theme.colors.textTertiary }]}>
                  Check back soon
                </Text>
              </View>
            )}
          </ScrollView>
        )}

        {/* FAB for creating announcements (admin/mod only) */}
        {(user?.role === 'admin' || user?.role === 'moderator') && (
          <Animated.View
            style={[
              styles.fabContainer,
              {
                opacity: animValue,
                transform: [{
                  translateY: animValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [80, 0],
                  })
                }],
              }
            ]}
          >
            <TouchableOpacity
              style={[styles.fab, { backgroundColor: '#1F4A2E' }]}
              onPress={handleCreatePress}
              activeOpacity={0.8}
            >
              <Plus size={18} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={styles.fabText}>Post</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>

      {/* Post Settings Bottom Sheet Drawer */}
      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseMenu}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={handleCloseMenu}
        >
          <View style={[styles.drawerContainer, { backgroundColor: theme.colors.surface }]}>
            {/* Grab Handle */}
            <View style={styles.dragHandle} />

            {/* Title */}
            <Text style={[styles.drawerTitle, { color: theme.colors.textPrimary }]}>
              Post Settings
            </Text>

            <View style={[styles.drawerDivider, { backgroundColor: theme.colors.border }]} />

            {/* Actions list */}
            {selectedAnnouncement && (
              <View style={styles.drawerActions}>
                {/* Pin/Unpin option (admin/moderator only) */}
                {(user?.role === 'admin' || user?.role === 'moderator') && (
                  <TouchableOpacity
                    style={[styles.drawerActionItem, activeAction !== null && styles.disabledAction]}
                    onPress={handleTogglePin}
                    disabled={activeAction !== null}
                  >
                    <Ionicons
                      name={selectedAnnouncement.is_pinned ? "pin-outline" : "pin"}
                      size={22}
                      color={theme.colors.textPrimary}
                    />
                    <Text style={[styles.drawerActionText, { color: theme.colors.textPrimary }]}>
                      {selectedAnnouncement.is_pinned ? "Unpin Announcement" : "Pin Announcement"}
                    </Text>
                    {activeAction === 'pin' && <ActivityIndicator size="small" color={theme.colors.textPrimary} style={styles.loadingIndicator} />}
                  </TouchableOpacity>
                )}

                {/* Delete option (admin or author) */}
                {(user?.role === 'admin' || user?.id === selectedAnnouncement.author_id) && (
                  <TouchableOpacity
                    style={[styles.drawerActionItem, activeAction !== null && styles.disabledAction]}
                    onPress={handleDeleteAnnouncement}
                    disabled={activeAction !== null}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={22}
                      color="#DC2626"
                    />
                    <Text style={[styles.drawerActionText, { color: '#DC2626' }]}>
                      Delete Announcement
                    </Text>
                    {activeAction === 'delete' && <ActivityIndicator size="small" color="#DC2626" style={styles.loadingIndicator} />}
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Cancel Button */}
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: theme.colors.background }]}
              onPress={handleCloseMenu}
              disabled={activeAction !== null}
            >
              <Text style={[styles.cancelButtonText, { color: theme.colors.textPrimary }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 16,
    paddingRight: 16,
    paddingVertical: 6,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    // gap: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  searchButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bellButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 24,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '500',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    zIndex: 99,
  },
  fab: {
    height: 48,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    gap: 6,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  drawerContainer: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 20,
    paddingBottom: 34,
    paddingTop: 10,
    width: '100%',
  },
  dragHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CCCCCC',
    alignSelf: 'center',
    marginBottom: 16,
  },
  drawerTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  drawerDivider: {
    height: 0.5,
    width: '100%',
    marginBottom: 16,
  },
  drawerActions: {
    gap: 16,
    marginBottom: 20,
  },
  drawerActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  drawerActionText: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  disabledAction: {
    opacity: 0.5,
  },
  loadingIndicator: {
    marginLeft: 8,
  },
  cancelButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
