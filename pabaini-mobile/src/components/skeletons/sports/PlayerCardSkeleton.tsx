import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import SkeletonBox from '../SkeletonBox';
import SkeletonCircle from '../SkeletonCircle';

export default function PlayerCardSkeleton() {
  const { theme } = useTheme();

  return (
    <View style={[styles.playerCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <SkeletonCircle size={48} />
      <View style={styles.playerInfo}>
        <View style={styles.playerMetaHeader}>
          <SkeletonBox width={120} height={14} borderRadius={4} />
          <SkeletonBox width={60} height={18} borderRadius={4} />
        </View>
        <SkeletonBox width={160} height={12} borderRadius={3} style={styles.subtitle} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  playerCard: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    alignItems: 'center',
  },
  playerInfo: {
    flex: 1,
    marginLeft: 14,
  },
  playerMetaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  subtitle: {
    marginTop: 2,
  },
});
