import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { AppNotification, NotificationType } from '../../types/notification.types';
import { formatTimeAgo } from '../../utils/format';

interface NotificationRowProps {
  notification: AppNotification;
  onPress: () => void;
}

const NOTIFICATION_ICONS: Record<NotificationType, string> = {
  team_join_request: '👥',
  team_invite: '✉️',
  team_request_accepted: '✅',
  team_request_rejected: '❌',
  team_invite_accepted: '✅',
  team_invite_declined: '❌',
  team_member_removed: '👋',
  team_captaincy_transferred: '⭐',
};

export const NotificationRow: React.FC<NotificationRowProps> = ({ notification, onPress }) => {
  const { theme } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: pressed
            ? 'rgba(0, 0, 0, 0.05)'
            : notification.is_read
            ? 'transparent'
            : 'rgba(0, 77, 38, 0.03)',
          borderBottomColor: theme.colors.border,
        },
      ]}
      android_ripple={{ color: 'rgba(0, 77, 38, 0.08)' }}
    >
      {/* Left Icon Column */}
      <View style={styles.iconContainer}>
        <Text style={styles.iconText}>
          {NOTIFICATION_ICONS[notification.type] || '🔔'}
        </Text>
      </View>

      {/* Center Details */}
      <View style={styles.contentContainer}>
        <Text
          style={[
            styles.titleText,
            {
              color: theme.colors.textPrimary,
              fontSize: theme.typography.sizes.md,
              fontWeight: notification.is_read
                ? theme.typography.weights.regular
                : theme.typography.weights.medium,
            },
          ]}
          numberOfLines={3}
        >
          {notification.title}
        </Text>
        <Text
          style={[
            styles.timeText,
            {
              color: theme.colors.textSecondary,
              fontSize: theme.typography.sizes.sm,
            },
          ]}
        >
          {formatTimeAgo(notification.created_at)}
        </Text>
      </View>

      {/* Right Unread Dot Column */}
      <View style={styles.dotContainer}>
        {!notification.is_read && (
          <View style={[styles.dot, { backgroundColor: theme.colors.primary }]} />
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  iconContainer: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 22,
  },
  contentContainer: {
    flex: 1,
    marginLeft: 12,
  },
  titleText: {
    lineHeight: 20,
  },
  timeText: {
    marginTop: 3,
  },
  dotContainer: {
    width: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
