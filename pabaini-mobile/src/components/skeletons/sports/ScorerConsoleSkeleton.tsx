import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../context/ThemeContext';
import SkeletonBox from '../SkeletonBox';
import SkeletonCircle from '../SkeletonCircle';

export default function ScorerConsoleSkeleton() {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Score Panel Gradient Skeleton */}
      <LinearGradient
        colors={['#0E331B', '#071A0E']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.scoreCard, { borderRadius: theme.radius.md }]}
      >
        <View style={styles.scoreHeader}>
          <SkeletonBox width={160} height={12} borderRadius={4} style={styles.overlayBg} />
          <SkeletonBox width={80} height={12} borderRadius={4} style={styles.overlayBg} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 10, gap: 8 }}>
          <SkeletonBox width={120} height={36} borderRadius={6} style={styles.overlayBg} />
          <SkeletonBox width={80} height={18} borderRadius={4} style={styles.overlayBg} />
        </View>
        <View style={styles.runRateRow}>
          <SkeletonBox width={90} height={20} borderRadius={6} style={styles.overlayBg} />
          <SkeletonBox width={95} height={20} borderRadius={6} style={styles.overlayBg} />
        </View>
      </LinearGradient>

      {/* Match Situation Card */}
      <View style={[styles.situationCard, { backgroundColor: '#F0F9EB', borderColor: '#E1F3D8' }]}>
        <SkeletonBox width={180} height={14} borderRadius={4} style={{ backgroundColor: 'rgba(103, 194, 58, 0.15)' }} />
      </View>

      {/* Roster Section (Batting on top, Bowling below) */}
      <View style={styles.rosterSection}>
        {/* Batting Card - On Top (No header/title) */}
        <View style={[styles.rosterCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radius.md }]}>
          <View style={[styles.gridHeader, { borderBottomColor: theme.colors.border, marginTop: 2 }]}>
            <SkeletonBox width={60} height={11} borderRadius={2} style={{ flex: 2.2 }} />
            <SkeletonBox width={30} height={11} borderRadius={2} style={{ flex: 1 }} />
            <SkeletonBox width={40} height={11} borderRadius={2} style={{ flex: 1.5 }} />
            <SkeletonBox width={35} height={11} borderRadius={2} style={{ flex: 1.2 }} />
          </View>
          <View style={styles.gridRow}>
            <SkeletonBox width={90} height={13} borderRadius={3} style={{ flex: 2.2 }} />
            <SkeletonBox width={40} height={13} borderRadius={3} style={{ flex: 1 }} />
            <SkeletonBox width={35} height={13} borderRadius={3} style={{ flex: 1.5 }} />
            <SkeletonBox width={35} height={13} borderRadius={3} style={{ flex: 1.2 }} />
          </View>
          <View style={styles.gridRow}>
            <SkeletonBox width={100} height={13} borderRadius={3} style={{ flex: 2.2 }} />
            <SkeletonBox width={40} height={13} borderRadius={3} style={{ flex: 1 }} />
            <SkeletonBox width={35} height={13} borderRadius={3} style={{ flex: 1.5 }} />
            <SkeletonBox width={35} height={13} borderRadius={3} style={{ flex: 1.2 }} />
          </View>
        </View>

        {/* Bowling Card - Below Batting (No header/title) */}
        <View style={[styles.rosterCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radius.md }]}>
          <View style={[styles.gridHeader, { borderBottomColor: theme.colors.border, marginTop: 2 }]}>
            <SkeletonBox width={60} height={11} borderRadius={2} style={{ flex: 2.2 }} />
            <SkeletonBox width={20} height={11} borderRadius={2} style={{ flex: 0.8 }} />
            <SkeletonBox width={20} height={11} borderRadius={2} style={{ flex: 0.8 }} />
            <SkeletonBox width={20} height={11} borderRadius={2} style={{ flex: 0.8 }} />
            <SkeletonBox width={35} height={11} borderRadius={2} style={{ flex: 1.2 }} />
          </View>
          <View style={styles.gridRow}>
            <SkeletonBox width={110} height={13} borderRadius={3} style={{ flex: 2.2 }} />
            <SkeletonBox width={25} height={13} borderRadius={3} style={{ flex: 0.8 }} />
            <SkeletonBox width={25} height={13} borderRadius={3} style={{ flex: 0.8 }} />
            <SkeletonBox width={25} height={13} borderRadius={3} style={{ flex: 0.8 }} />
            <SkeletonBox width={30} height={13} borderRadius={3} style={{ flex: 1.2 }} />
          </View>
        </View>
      </View>

      {/* Refined Over Tracker Card */}
      <View style={[styles.rosterCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radius.md }]}>
        <View style={styles.cardHeaderRow}>
          <SkeletonBox width={70} height={15} borderRadius={3} />
          <SkeletonBox width={30} height={13} borderRadius={3} />
        </View>
        <View style={styles.ballsRow}>
          {[1, 2, 3, 4, 6].map((i) => (
            <SkeletonCircle key={i} size={30} />
          ))}
        </View>
      </View>

      {/* Control Panel */}
      <View style={[styles.scoringPanel, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radius.md }]}>
        {/* Extras selector row - above runs grid, small border chips */}
        <View style={styles.extraSelectorRow}>
          {[42, 45, 52, 45, 50].map((w, idx) => (
            <SkeletonBox key={idx} width={w} height={20} borderRadius={4} />
          ))}
        </View>

        {/* Runs Grid (8 cards) */}
        <View style={styles.runsGrid}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <View key={i} style={[styles.runCard, { borderColor: theme.colors.border, borderRadius: theme.radius.sm }]}>
              <SkeletonBox width={16} height={16} borderRadius={3} />
            </View>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.mainActionsRow}>
          <SkeletonBox width="30%" height={40} borderRadius={theme.radius.sm} style={{ flex: 1 }} />
          <SkeletonBox width="70%" height={40} borderRadius={theme.radius.sm} style={{ flex: 2.2 }} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    gap: 10,
    flex: 1,
  },
  overlayBg: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  scoreCard: {
    padding: 14,
    height: 124,
    justifyContent: 'center',
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  runRateRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  situationCard: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
  },
  rosterSection: {
    gap: 10,
  },
  rosterCard: {
    padding: 10,
    borderWidth: 1,
    gap: 8,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gridHeader: {
    flexDirection: 'row',
    paddingBottom: 6,
    borderBottomWidth: 1,
  },
  gridRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    alignItems: 'center',
  },
  ballsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 2,
  },
  scoringPanel: {
    padding: 12,
    borderWidth: 1,
    gap: 12,
  },
  runsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  runCard: {
    width: '23%',
    height: 38,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  extraSelectorRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  mainActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
});
