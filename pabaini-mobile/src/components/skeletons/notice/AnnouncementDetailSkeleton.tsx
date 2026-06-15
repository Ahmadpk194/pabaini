import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import SkeletonBox from '../SkeletonBox';
import SkeletonCircle from '../SkeletonCircle';

export default function AnnouncementDetailSkeleton() {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      {/* Sticky Header */}
      <View style={[styles.stickyHeader, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
        <SkeletonBox width={40} height={40} borderRadius={20} />
        <SkeletonBox width={120} height={22} />
        <SkeletonBox width={40} height={40} borderRadius={20} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Category Badge */}
        <View style={styles.marginBottom12}>
          <SkeletonBox width={60} height={24} borderRadius={12} />
        </View>

        {/* Title */}
        <View style={styles.marginBottom16}>
          <SkeletonBox width="90%" height={28} />
        </View>
        <View style={styles.marginBottom20}>
          <SkeletonBox width="70%" height={28} />
        </View>

        {/* Author Row */}
        <View style={styles.authorRow}>
          <SkeletonCircle size={40} />
          <View style={styles.authorInfo}>
            <View style={styles.marginBottom4}>
              <SkeletonBox width={120} height={16} />
            </View>
            <SkeletonBox width={140} height={13} />
          </View>
        </View>

        {/* Body */}
        <View style={styles.marginBottom8}>
          <SkeletonBox width="100%" height={16} />
        </View>
        <View style={styles.marginBottom8}>
          <SkeletonBox width="100%" height={16} />
        </View>
        <View style={styles.marginBottom8}>
          <SkeletonBox width="95%" height={16} />
        </View>
        <View style={styles.marginBottom20}>
          <SkeletonBox width="80%" height={16} />
        </View>

        {/* Image */}
        <View style={styles.marginBottom20}>
          <SkeletonBox width="100%" height={250} borderRadius={12} />
        </View>

        {/* Location Card */}
        <View style={[styles.locationCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <SkeletonBox width={20} height={20} borderRadius={10} />
          <SkeletonBox width="80%" height={14} />
        </View>

        {/* Engagement Row */}
        <View style={[styles.engagementRow, { borderTopColor: theme.colors.border }]}>
          <SkeletonBox width={60} height={14} />
          <SkeletonBox width={70} height={14} />
          <SkeletonBox width={60} height={14} />
        </View>

        {/* Comments Section */}
        <View style={styles.commentsSection}>
          <View style={styles.marginBottom16}>
            <SkeletonBox width={140} height={22} />
          </View>

          {/* Comment Items */}
          {[0, 1].map((index) => (
            <View key={index} style={[styles.commentItem, { borderBottomColor: theme.colors.border }]}>
              <SkeletonCircle size={40} />
              <View style={styles.commentContent}>
                <View style={styles.marginBottom4}>
                  <SkeletonBox width={100} height={15} />
                </View>
                <SkeletonBox width="90%" height={14} />
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Comment Input Area */}
      <View style={[styles.commentInputArea, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
        <SkeletonCircle size={40} />
        <View style={styles.inputContainer}>
          <SkeletonBox width="100%" height={40} borderRadius={20} />
        </View>
        <SkeletonBox width={40} height={40} borderRadius={20} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  stickyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  content: {
    padding: 16,
  },
  marginBottom4: {
    marginBottom: 4,
  },
  marginBottom8: {
    marginBottom: 8,
  },
  marginBottom12: {
    marginBottom: 12,
  },
  marginBottom16: {
    marginBottom: 16,
  },
  marginBottom20: {
    marginBottom: 20,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  authorInfo: {
    marginLeft: 12,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  engagementRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopWidth: 1,
    marginBottom: 24,
  },
  commentsSection: {
    marginBottom: 20,
  },
  commentItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  commentContent: {
    marginLeft: 12,
    flex: 1,
  },
  commentInputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  inputContainer: {
    flex: 1,
    marginHorizontal: 12,
  },
});
