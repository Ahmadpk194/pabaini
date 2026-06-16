import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useTheme } from '../src/context/ThemeContext';
import { useNotificationsStore } from '../src/store/notificationsStore';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
} from '../src/services/notificationsApi';
import { AppNotification } from '../src/types/notification.types';
import { NotificationRow } from '../src/components/notifications/NotificationRow';
import { NotificationEmptyState } from '../src/components/notifications/NotificationEmptyState';

export default function NotificationsScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  // Store actions
  const decrementUnreadCount = useNotificationsStore((state) => state.decrementUnreadCount);
  const clearUnreadCount = useNotificationsStore((state) => state.clearUnreadCount);
  const fetchUnreadCount = useNotificationsStore((state) => state.fetchUnreadCount);

  // Local state
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const loadNotifications = useCallback(
    async (pageNum: number, refreshing = false) => {
      try {
        if (pageNum === 1 && !refreshing) {
          setIsLoading(true);
        }
        const res = await getNotifications({ page: pageNum, limit: 20 });
        
        if (pageNum === 1) {
          setNotifications(res.notifications || []);
        } else {
          setNotifications((prev) => [...prev, ...res.notifications]);
        }
        
        setHasMore(pageNum * 20 < res.total);
      } catch (err) {
        console.warn('Failed to load notifications:', err);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
        setIsRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadNotifications(1);
  }, [loadNotifications]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setPage(1);
    await Promise.all([loadNotifications(1, true), fetchUnreadCount()]);
  };

  const handleLoadMore = () => {
    if (hasMore && !isLoading && !isLoadingMore) {
      setIsLoadingMore(true);
      const nextPage = page + 1;
      setPage(nextPage);
      loadNotifications(nextPage);
    }
  };

  const handlePressRow = async (notification: AppNotification) => {
    if (!notification.is_read) {
      // Optimistic state updates
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notification.id ? { ...item, is_read: true } : item
        )
      );
      decrementUnreadCount();

      // Background API call
      markAsRead(notification.id).catch((err) => {
        console.warn('Failed to mark notification read in background:', err);
      });
    }

    if (notification.deep_link) {
      router.push(notification.deep_link as any);
    }
  };

  const handleMarkAllRead = async () => {
    // Optimistic state updates
    setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
    clearUnreadCount();

    // Background API call
    markAllAsRead().catch((err) => {
      console.warn('Failed to mark all read in background:', err);
    });
  };

  const hasUnread = notifications.some((n) => !n.is_read);

  // Group notifications into Today, Yesterday, Earlier sections
  const groupNotifications = () => {
    const today: AppNotification[] = [];
    const yesterday: AppNotification[] = [];
    const earlier: AppNotification[] = [];

    const now = new Date();
    const todayStr = now.toDateString();

    const yesterdayDate = new Date();
    yesterdayDate.setDate(now.getDate() - 1);
    const yesterdayStr = yesterdayDate.toDateString();

    notifications.forEach((item) => {
      const itemDate = new Date(item.created_at);
      const itemDateStr = itemDate.toDateString();

      if (itemDateStr === todayStr) {
        today.push(item);
      } else if (itemDateStr === yesterdayStr) {
        yesterday.push(item);
      } else {
        earlier.push(item);
      }
    });

    const sections = [];
    if (today.length > 0) {
      sections.push({ title: 'Today', data: today });
    }
    if (yesterday.length > 0) {
      sections.push({ title: 'Yesterday', data: yesterday });
    }
    if (earlier.length > 0) {
      sections.push({ title: 'Earlier', data: earlier });
    }

    return sections;
  };

  const groupedSections = groupNotifications();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      {/* Header Bar */}
      <View
        style={[
          styles.headerBar,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft color={theme.colors.textPrimary} size={24} strokeWidth={1.75} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
          Notifications
        </Text>
        {hasUnread ? (
          <TouchableOpacity onPress={handleMarkAllRead} style={styles.markAllReadButton}>
            <Text style={[styles.markAllReadText, { color: theme.colors.primary }]}>
              Mark all read
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 80 }} />
        )}
      </View>

      {/* Main List content */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <SectionList
          sections={groupedSections}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <NotificationRow
              notification={item}
              onPress={() => handlePressRow(item)}
            />
          )}
          renderSectionHeader={({ section: { title } }) => (
            <View style={[styles.sectionHeader, { backgroundColor: theme.colors.background }]}>
              <Text style={[styles.sectionHeaderText, { color: theme.colors.textSecondary }]}>
                {title.toUpperCase()}
              </Text>
            </View>
          )}
          ListEmptyComponent={<NotificationEmptyState />}
          ListFooterComponent={
            isLoadingMore ? (
              <View style={styles.footerContainer}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
              </View>
            ) : null
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
          contentContainerStyle={
            notifications.length === 0 ? { flexGrow: 1, justifyContent: 'center' } : undefined
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
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    zIndex: -1,
  },
  markAllReadButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markAllReadText: {
    fontSize: 14,
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.05,
  },
  footerContainer: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
