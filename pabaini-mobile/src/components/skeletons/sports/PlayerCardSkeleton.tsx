import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../context/ThemeContext';
import SkeletonBox from '../SkeletonBox';
import SkeletonCircle from '../SkeletonCircle';

const overlayStyle: ViewStyle = { backgroundColor: 'rgba(255, 255, 255, 0.15)' };

/** Skeleton matching the compact CricketPlayerCard layout */
export default function PlayerCardSkeleton() {
  const { theme } = useTheme();

  return (
    <LinearGradient
      colors={['#004D26', '#002613']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, { borderRadius: theme.radius.lg }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <SkeletonCircle size={54} style={overlayStyle} />
        <View style={styles.headerTextContainer}>
          <SkeletonBox width={140} height={17} borderRadius={4} style={{ ...overlayStyle, marginBottom: 7 }} />
          <SkeletonBox width={80} height={16} borderRadius={4} style={overlayStyle} />
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Batting / Bowling */}
      <View style={styles.stylesContainer}>
        <View style={styles.styleColumn}>
          <SkeletonBox width={44} height={10} borderRadius={2} style={{ ...overlayStyle, marginBottom: 5 }} />
          <SkeletonBox width={90} height={13} borderRadius={3} style={overlayStyle} />
        </View>
        <View style={[styles.styleColumn, styles.borderLeft]}>
          <SkeletonBox width={44} height={10} borderRadius={2} style={{ ...overlayStyle, marginBottom: 5 }} />
          <SkeletonBox width={110} height={13} borderRadius={3} style={overlayStyle} />
        </View>
      </View>

      {/* Stats row */}
      <View style={styles.statsContainer}>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={styles.statBox}>
            <SkeletonBox width={28} height={14} borderRadius={3} style={{ ...overlayStyle, marginBottom: 3 }} />
            <SkeletonBox width={38} height={8} borderRadius={2} style={overlayStyle} />
          </View>
        ))}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 14,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
    overflow: 'hidden',
    marginVertical: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  headerTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 12,
  },
  stylesContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  styleColumn: {
    flex: 1,
  },
  borderLeft: {
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.1)',
    paddingLeft: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 7,
    paddingVertical: 9,
    paddingHorizontal: 4,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
});
