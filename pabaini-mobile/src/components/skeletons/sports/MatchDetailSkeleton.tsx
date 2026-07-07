import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import SkeletonBox from '../SkeletonBox';
import SkeletonCircle from '../SkeletonCircle';

export default function MatchDetailSkeleton() {
  const { theme } = useTheme();

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Status Card Banner Skeleton */}
      <View style={[styles.statusCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radius.md }]}>
        <SkeletonBox width={120} height={24} borderRadius={4} style={styles.marginBottom8} />
        <SkeletonBox width={180} height={14} borderRadius={4} />
      </View>

      {/* Versus Teams block Skeleton */}
      <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radius.md }]}>
        <View style={styles.vsContainer}>
          {/* Team A */}
          <View style={styles.teamBlock}>
            <SkeletonCircle size={44} style={styles.logoMargin} />
            <SkeletonBox width={80} height={14} borderRadius={4} style={styles.marginBottom6} />
            <SkeletonBox width={100} height={10} borderRadius={3} />
          </View>

          {/* VS Divider */}
          <View style={styles.vsMiddle}>
            <SkeletonBox width={30} height={14} borderRadius={4} />
          </View>

          {/* Team B */}
          <View style={styles.teamBlock}>
            <SkeletonCircle size={44} style={styles.logoMargin} />
            <SkeletonBox width={80} height={14} borderRadius={4} style={styles.marginBottom6} />
            <SkeletonBox width={100} height={10} borderRadius={3} />
          </View>
        </View>
      </View>

      {/* Lineups Status Card Skeleton */}
      <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radius.md }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <SkeletonBox width={110} height={13} borderRadius={4} />
          <SkeletonBox width={60} height={10} borderRadius={3} />
        </View>
        <View style={{ gap: 6 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 2 }}>
            <SkeletonBox width={90} height={12} borderRadius={4} />
            <SkeletonBox width={80} height={16} borderRadius={4} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 2 }}>
            <SkeletonBox width={90} height={12} borderRadius={4} />
            <SkeletonBox width={80} height={16} borderRadius={4} />
          </View>
        </View>
      </View>

      {/* Match Information Skeleton */}
      <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radius.md }]}>
        <SkeletonBox width={130} height={16} borderRadius={4} style={styles.marginBottom16} />

        {/* Row 1 */}
        <View style={styles.infoRow}>
          <SkeletonCircle size={20} />
          <View style={styles.infoTextContainer}>
            <SkeletonBox width={70} height={11} borderRadius={3} style={styles.marginBottom4} />
            <SkeletonBox width={150} height={14} borderRadius={4} />
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

        {/* Row 2 */}
        <View style={styles.infoRow}>
          <SkeletonCircle size={20} />
          <View style={styles.infoTextContainer}>
            <SkeletonBox width={50} height={11} borderRadius={3} style={styles.marginBottom4} />
            <SkeletonBox width={120} height={14} borderRadius={4} />
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

        {/* Row 3 */}
        <View style={styles.infoRow}>
          <SkeletonCircle size={20} />
          <View style={styles.infoTextContainer}>
            <SkeletonBox width={80} height={11} borderRadius={3} style={styles.marginBottom4} />
            <SkeletonBox width={160} height={14} borderRadius={4} />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 8,
  },
  statusCard: {
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  card: {
    padding: 8,
    borderWidth: 1,
  },
  vsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teamBlock: {
    flex: 1.2,
    alignItems: 'center',
  },
  vsMiddle: {
    flex: 0.4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 3,
  },
  infoTextContainer: {
    flex: 1,
  },
  divider: {
    height: 1,
    marginVertical: 6,
  },
  marginBottom6: {
    marginBottom: 6,
  },
  marginBottom8: {
    marginBottom: 8,
  },
  marginBottom16: {
    marginBottom: 10,
  },
  marginBottom4: {
    marginBottom: 4,
  },
  logoMargin: {
    marginBottom: 4,
  },
});
