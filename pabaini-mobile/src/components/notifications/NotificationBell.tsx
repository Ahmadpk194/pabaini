import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Bell } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useNotificationsStore } from '../../store/notificationsStore';

interface NotificationBellProps {
  onPress: () => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ onPress }) => {
  const { theme } = useTheme();
  const unreadCount = useNotificationsStore((state) => state.unreadCount);

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.container}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      activeOpacity={0.7}
      accessibilityLabel="Notifications"
      accessibilityRole="button"
    >
      <Bell color={theme.colors.textPrimary} size={24} strokeWidth={1.75} />
      {unreadCount > 0 && (
        <View style={[styles.badge, { backgroundColor: '#DC2626' }]}>
          <Text style={styles.badgeText}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 11,
  },
});
