import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import SkeletonBox from '../SkeletonBox';
import SkeletonCircle from '../SkeletonCircle';

/** Skeleton for "My Teams" TeamCard (isMyTeam = true variant) */
export default function TeamCardSkeleton() {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.md,
        },
      ]}
    >
      {/* Logo circle — 44px like myTeam variant */}
      <SkeletonCircle size={44} />

      {/* Info column */}
      <View style={styles.infoContainer}>
        {/* Name + role badge pill */}
        <View style={styles.nameRow}>
          <SkeletonBox width={120} height={14} borderRadius={4} />
          <SkeletonBox width={52} height={16} borderRadius={4} />
        </View>

        {/* Ground row (optional but very common — show as shorter bar) */}
        <View style={styles.groundRow}>
          <SkeletonBox width={10} height={10} borderRadius={2} />
          <SkeletonBox width={90} height={11} borderRadius={3} />
        </View>

        {/* Stats row: Players • Matches • Wins */}
        <View style={styles.statsRow}>
          <SkeletonBox width={60} height={10} borderRadius={3} />
          <SkeletonBox width={4} height={4} borderRadius={2} style={{ marginHorizontal: 4 }} />
          <SkeletonBox width={60} height={10} borderRadius={3} />
          <SkeletonBox width={4} height={4} borderRadius={2} style={{ marginHorizontal: 4 }} />
          <SkeletonBox width={50} height={10} borderRadius={3} />
        </View>
      </View>

      {/* Chevron placeholder */}
      <View style={styles.chevronContainer}>
        <SkeletonBox width={12} height={18} borderRadius={2} />
      </View>
    </View>
  );
}

/** Skeleton for Discover/All-Teams TeamCard (isMyTeam = false variant) */
export function DiscoverTeamCardSkeleton() {
  const { theme } = useTheme();

  return (
    <View
      style={{
        width: 200,
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
        borderWidth: 1,
        borderRadius: theme.radius.md,
        padding: 12,
      }}
    >
      {/* Logo + name row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <SkeletonCircle size={36} />
        <View style={{ flex: 1, gap: 5 }}>
          <SkeletonBox width={100} height={13} borderRadius={4} />
          <SkeletonBox width={70} height={10} borderRadius={3} />
        </View>
      </View>

      {/* Bottom row: member count + chevron glyph */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <SkeletonBox width={70} height={10} borderRadius={3} />
        <SkeletonBox width={8} height={14} borderRadius={2} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    marginBottom: 10,
    alignItems: 'center',
  },
  infoContainer: {
    flex: 1,
    marginLeft: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 5,
  },
  groundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 7,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(150,150,150,0.15)',
  },
  chevronContainer: {
    marginLeft: 6,
  },
});
