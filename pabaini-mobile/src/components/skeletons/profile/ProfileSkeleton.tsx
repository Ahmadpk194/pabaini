import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import SkeletonBox from '../SkeletonBox';
import SkeletonCircle from '../SkeletonCircle';

export default function ProfileSkeleton() {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      {/* Top Section */}
      <View style={[styles.topSection, { borderBottomColor: theme.colors.border }]}>
        <View style={styles.centered}>
          <SkeletonCircle size={80} />
          <View style={styles.gap12} />
          <SkeletonBox width={140} height={18} />
          <View style={styles.gap6} />
          <SkeletonBox width={90} height={13} />
          <View style={styles.gap16} />
          <View style={styles.actionButtons}>
            <SkeletonBox width={100} height={36} borderRadius={8} />
            <SkeletonBox width={100} height={36} borderRadius={8} />
          </View>
        </View>
      </View>

      {/* Info Rows Section */}
      <View style={styles.infoSection}>
        {[0, 1, 2, 3].map((index) => (
          <View key={index} style={[styles.infoRow, { borderBottomColor: theme.colors.border }]}>
            <SkeletonBox width={80} height={13} />
            <SkeletonBox width={120} height={13} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topSection: {
    paddingTop: 32,
    paddingBottom: 24,
    borderBottomWidth: 0.5,
  },
  centered: {
    alignItems: 'center',
  },
  gap12: {
    height: 12,
  },
  gap6: {
    height: 6,
  },
  gap16: {
    height: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  infoSection: {
    padding: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
});
