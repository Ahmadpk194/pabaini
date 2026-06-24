import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../context/ThemeContext';
import SkeletonBox from '../SkeletonBox';
import SkeletonCircle from '../SkeletonCircle';

export default function PlayerCardSkeleton() {
  const { theme } = useTheme();
  
  // Custom transparent-white style for skeletons overlaying the dark green card background
  const skeletonOverlayStyle: ViewStyle = { backgroundColor: 'rgba(255, 255, 255, 0.15)' };

  return (
    <LinearGradient
      colors={['#004D26', '#002613']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, { borderRadius: theme.radius.lg }]}
    >
      {/* Decorative Glow */}
      <View style={styles.radialGlow} />

      {/* Card Header: Avatar & Info Skeletons */}
      <View style={styles.header}>
        <SkeletonCircle size={70} style={skeletonOverlayStyle} />
        
        <View style={styles.headerTextContainer}>
          {/* Player Name Skeleton */}
          <SkeletonBox width={160} height={20} borderRadius={4} style={{ ...skeletonOverlayStyle, marginBottom: 8 }} />
          {/* Role Badge Skeleton */}
          <SkeletonBox width={90} height={18} borderRadius={4} style={skeletonOverlayStyle} />
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Styles details (Batting / Bowling details) Skeletons */}
      <View style={styles.stylesContainer}>
        <View style={styles.styleColumn}>
          {/* Batting Title */}
          <SkeletonBox width={50} height={11} borderRadius={2} style={{ ...skeletonOverlayStyle, marginBottom: 6 }} />
          {/* Batting Value */}
          <SkeletonBox width={90} height={14} borderRadius={3} style={skeletonOverlayStyle} />
        </View>
        <View style={[styles.styleColumn, styles.borderLeft]}>
          {/* Bowling Title */}
          <SkeletonBox width={50} height={11} borderRadius={2} style={{ ...skeletonOverlayStyle, marginBottom: 6 }} />
          {/* Bowling Value */}
          <SkeletonBox width={120} height={14} borderRadius={3} style={skeletonOverlayStyle} />
        </View>
      </View>

      {/* Stats Table Skeletons */}
      <View style={styles.statsContainer}>
        {[1, 2, 3, 4].map((index) => (
          <View key={index} style={styles.statBox}>
            {/* Stat Label */}
            <SkeletonBox width={45} height={9} borderRadius={2} style={{ ...skeletonOverlayStyle, marginBottom: 4 }} />
            {/* Stat Value */}
            <SkeletonBox width={25} height={14} borderRadius={3} style={skeletonOverlayStyle} />
          </View>
        ))}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    position: 'relative',
    overflow: 'hidden',
    marginVertical: 10,
  },
  radialGlow: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  headerTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 18,
  },
  stylesContainer: {
    flexDirection: 'row',
    marginBottom: 18,
  },
  styleColumn: {
    flex: 1,
  },
  borderLeft: {
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.1)',
    paddingLeft: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
});
