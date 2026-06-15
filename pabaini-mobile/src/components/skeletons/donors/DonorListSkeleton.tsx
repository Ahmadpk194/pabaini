import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import SkeletonBox from '../SkeletonBox';
import SkeletonCircle from '../SkeletonCircle';

export default function DonorListSkeleton() {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      {[0, 1, 2, 3, 4].map((index) => (
        <View key={index} style={[styles.donorRow, { borderBottomColor: theme.colors.border }]}>
          <SkeletonCircle size={42} />
          <View style={styles.donorInfo}>
            <SkeletonBox width={120} height={14} />
            <View style={styles.gap4} />
            <SkeletonBox width={80} height={12} />
          </View>
          <View style={styles.donorAction}>
            <SkeletonBox width={60} height={28} borderRadius={999} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  donorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 0.5,
    gap: 12,
  },
  donorInfo: {
    gap: 4,
  },
  gap4: {
    height: 4,
  },
  donorAction: {
    marginLeft: 'auto',
  },
});
