import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import SkeletonBox from '../SkeletonBox';
import SkeletonCircle from '../SkeletonCircle';

export default function TeamCardSkeleton() {
  const { theme } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radius.md }]}>
      <SkeletonCircle size={48} />
      <View style={styles.infoContainer}>
        <SkeletonBox width={140} height={14} borderRadius={4} style={styles.name} />
        <SkeletonBox width={100} height={11} borderRadius={3} style={styles.ground} />
        <SkeletonBox width={70} height={11} borderRadius={3} style={styles.members} />
      </View>
      <View style={styles.chevronContainer}>
        <SkeletonBox width={12} height={20} borderRadius={2} />
      </View>
    </View>
  );
}

export function DiscoverTeamCardSkeleton() {
  const { theme } = useTheme();

  return (
    <View
      style={{
        width: 220,
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
        borderWidth: 1,
        borderRadius: theme.radius.md,
        padding: 14,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <SkeletonCircle size={36} />
        <View style={{ flex: 1, gap: 4 }}>
          <SkeletonBox width={100} height={12} borderRadius={3} />
          <SkeletonBox width={70} height={10} borderRadius={3} />
        </View>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <SkeletonBox width={60} height={10} borderRadius={3} />
        <SkeletonBox width={65} height={12} borderRadius={3} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: 16,
    borderWidth: 1,
    marginBottom: 10,
    alignItems: 'center',
  },
  infoContainer: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    marginBottom: 6,
  },
  ground: {
    marginBottom: 4,
  },
  members: {
    marginTop: 2,
  },
  chevronContainer: {
    marginLeft: 8,
  },
});
