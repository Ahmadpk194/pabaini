import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import AnnouncementCardSkeleton from './AnnouncementCardSkeleton';

export default function NoticeFeedSkeleton() {
  return (
    <ScrollView scrollEnabled={false} style={styles.container}>
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
});
