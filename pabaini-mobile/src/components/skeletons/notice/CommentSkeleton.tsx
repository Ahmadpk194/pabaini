import React from 'react';
import { View, StyleSheet } from 'react-native';
import Shimmer from '../Shimmer';
import { useTheme } from '../../../context/ThemeContext';

/**
 * A single skeleton comment row — mimics the real comment layout:
 * [avatar circle]  [bubble: name line + two text lines]
 *
 * Uses a lighter/whiter shimmer color than the global default so the
 * skeletons are clearly visible against the grayish post-detail background.
 */
function CommentSkeletonItem() {
  const { mode } = useTheme();
  // Lighter than the default #EEEEEE (light) / #2A2A2A (dark)
  const shimmerColor = mode === 'dark' ? '#4A4A4A' : '#F8F8F8';

  return (
    <View style={styles.row}>
      {/* Avatar circle */}
      <Shimmer width={30} height={30} borderRadius={15} style={{ backgroundColor: shimmerColor }} />

      {/* Bubble content */}
      <View style={styles.bubble}>
        {/* Author name */}
        <Shimmer width={90} height={11} borderRadius={6} style={{ backgroundColor: shimmerColor, marginBottom: 8 }} />
        {/* Body line 1 */}
        <Shimmer width="90%" height={11} borderRadius={6} style={{ backgroundColor: shimmerColor, marginBottom: 6 }} />
        {/* Body line 2 — slightly shorter */}
        <Shimmer width="65%" height={11} borderRadius={6} style={{ backgroundColor: shimmerColor }} />
      </View>
    </View>
  );
}

/**
 * Renders a single skeleton comment row as the loading placeholder
 * for the comments section on the post detail screen.
 */
export default function CommentSkeleton() {
  return <CommentSkeletonItem />;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginBottom: 14,
    alignItems: 'flex-start',
  },
  bubble: {
    flex: 1,
    marginLeft: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
});
