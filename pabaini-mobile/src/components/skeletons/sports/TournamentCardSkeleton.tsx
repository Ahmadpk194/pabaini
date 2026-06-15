import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import SkeletonBox from '../SkeletonBox';
import SkeletonCircle from '../SkeletonCircle';

export default function TournamentCardSkeleton() {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { borderColor: theme.colors.border }]}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <SkeletonCircle size={44} />
        <View style={styles.headerInfo}>
          <SkeletonBox width={150} height={15} />
          <View style={styles.gap4} />
          <SkeletonBox width={100} height={12} />
        </View>
      </View>

      {/* Stat Boxes */}
      <View style={styles.statBoxes}>
        <SkeletonBox width={70} height={44} borderRadius={8} />
        <SkeletonBox width={70} height={44} borderRadius={8} />
        <SkeletonBox width={70} height={44} borderRadius={8} />
      </View>

      {/* CTA Button */}
      <SkeletonBox width="100%" height={36} borderRadius={8} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderWidth: 0.5,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  headerInfo: {
    gap: 4,
  },
  gap4: {
    height: 4,
  },
  statBoxes: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
});
