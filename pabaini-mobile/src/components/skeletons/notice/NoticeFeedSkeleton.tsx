import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import SkeletonBox from '../SkeletonBox';
import AnnouncementCardSkeleton from './AnnouncementCardSkeleton';

export default function NoticeFeedSkeleton() {
  return (
    <ScrollView scrollEnabled={false} style={styles.container}>
      {/* Category Filter Bar Skeleton */}
      <View style={styles.filterBar}>
        <SkeletonBox width={50} height={34} borderRadius={999} />
        <SkeletonBox width={70} height={34} borderRadius={999} />
        <SkeletonBox width={60} height={34} borderRadius={999} />
        <SkeletonBox width={65} height={34} borderRadius={999} />
      </View>

      {/* Announcement Cards Skeleton */}
      {[0, 1, 2].map((index) => (
        <AnnouncementCardSkeleton key={index} index={index} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    marginBottom: 12,
    gap: 8,
  },
});
