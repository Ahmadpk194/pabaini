import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import SkeletonBox from '../SkeletonBox';
import SkeletonCircle from '../SkeletonCircle';

interface AnnouncementCardSkeletonProps {
  index?: number;
}

export default function AnnouncementCardSkeleton({ index = 0 }: AnnouncementCardSkeletonProps) {
  const { theme } = useTheme();
  const showImage = index % 3 === 0;

  return (
    <View style={[styles.container, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
      {/* Header Row */}
      <View style={styles.header}>
        {/* Avatar */}
        <SkeletonCircle size={36} />
        
        {/* Author Info */}
        <View style={styles.headerInfo}>
          <SkeletonBox width={130} height={13} />
          <View style={styles.gap5} />
          <SkeletonBox width={60} height={11} />
        </View>
        
        {/* Category Badge */}
        <View style={styles.badge}>
          <SkeletonBox width={60} height={22} borderRadius={999} />
        </View>
      </View>
      
      {/* Body */}
      <View style={styles.body}>
        <SkeletonBox width="75%" height={15} />
        <View style={styles.gap8} />
        <SkeletonBox width="100%" height={13} />
        <View style={styles.gap4} />
        <SkeletonBox width="85%" height={13} />
        <View style={styles.gap4} />
        <SkeletonBox width="60%" height={13} />
      </View>
      
      {/* Optional Image */}
      {showImage && (
        <View style={styles.imageContainer}>
          <SkeletonBox width="100%" height={180} borderRadius={0} />
        </View>
      )}
      
      {/* Footer */}
      <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
        <View style={styles.footerAction}>
          <SkeletonBox width={40} height={14} />
        </View>
        <View style={styles.footerAction}>
          <SkeletonBox width={50} height={14} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 0.5,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    paddingHorizontal: 14,
    gap: 10,
  },
  headerInfo: {
    gap: 5,
  },
  badge: {
    marginLeft: 'auto',
  },
  gap5: {
    height: 5,
  },
  body: {
    paddingTop: 10,
    paddingHorizontal: 14,
  },
  gap8: {
    height: 8,
  },
  gap4: {
    height: 4,
  },
  imageContainer: {
    marginTop: 10,
  },
  footer: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderTopWidth: 0.5,
    gap: 20,
  },
  footerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
