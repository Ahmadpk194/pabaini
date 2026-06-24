import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useTheme } from '../../../context/ThemeContext';
import SkeletonBox from '../SkeletonBox';
import SkeletonCircle from '../SkeletonCircle';

export default function TeamProfileSkeleton() {
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background, paddingBottom: insets.bottom }]}>
      <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
        {/* Mocked Team Hero Header */}
        <LinearGradient
          colors={['#0A4225', '#02180E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.headerContainer,
            {
              paddingTop: insets.top + 20,
              borderBottomLeftRadius: 24,
              borderBottomRightRadius: 24,
            },
          ]}
        >
          {/* Floating Back Button (Interactive immediately during load) */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backButton, { top: insets.top + 8 }]}
            activeOpacity={0.7}
          >
            <ArrowLeft color="#FFFFFF" size={20} />
          </TouchableOpacity>

          {/* Decorative Glow */}
          <View style={styles.radialGlow} />

          {/* Logo Skeleton */}
          <View style={styles.logoContainer}>
            <SkeletonCircle size={74} />
          </View>

          {/* Team Name Skeleton */}
          <SkeletonBox width={180} height={26} borderRadius={6} style={styles.marginBottom12} />

          {/* Info Row (Ground & Founded) Badges Skeleton */}
          <View style={styles.infoMetaRow}>
            <SkeletonBox width={100} height={22} borderRadius={12} />
            <SkeletonBox width={80} height={22} borderRadius={12} />
          </View>
        </LinearGradient>

        {/* Team Description Skeleton */}
        <View style={styles.descriptionSection}>
          <SkeletonBox width={120} height={16} borderRadius={4} style={styles.marginBottom12} />
          <SkeletonBox width="95%" height={14} borderRadius={4} style={styles.marginBottom6} />
          <SkeletonBox width="85%" height={14} borderRadius={4} />
        </View>

        {/* Action Button Skeleton */}
        <View style={styles.actionContainer}>
          <SkeletonBox width="100%" height={48} borderRadius={24} />
        </View>

        {/* Tab Pills Segmented Control Skeleton */}
        <View style={[styles.tabsContainer, { backgroundColor: theme.colors.elevated }]}>
          <View style={[styles.tabButton, { backgroundColor: theme.colors.surface }]}>
            <SkeletonBox width={65} height={14} borderRadius={4} />
          </View>
          <View style={[styles.tabButton, { backgroundColor: theme.colors.border }]}>
            <SkeletonBox width={65} height={14} borderRadius={4} />
          </View>
          <View style={[styles.tabButton, { backgroundColor: theme.colors.border }]}>
            <SkeletonBox width={65} height={14} borderRadius={4} />
          </View>
        </View>

        {/* Tab Content (Squad List) Skeleton */}
        <View style={styles.tabContentContainer}>
          <View style={[styles.listCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            {[1, 2, 3].map((item, index) => (
              <React.Fragment key={item}>
                <View style={styles.memberRow}>
                  <SkeletonCircle size={44} />
                  <View style={styles.infoContainer}>
                    <View style={styles.nameRow}>
                      <SkeletonBox width={110} height={14} borderRadius={4} />
                    </View>
                    <SkeletonBox width={160} height={12} borderRadius={4} />
                  </View>
                </View>
                {index < 2 && (
                  <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
                )}
              </React.Fragment>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollBody: {
    flex: 1,
  },
  headerContainer: {
    paddingBottom: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  radialGlow: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(22, 163, 74, 0.15)',
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
    marginBottom: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
  },
  descriptionSection: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  actionContainer: {
    paddingHorizontal: 20,
    marginTop: 16,
    justifyContent: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderRadius: 24,
    padding: 4,
    marginHorizontal: 20,
    marginTop: 24,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 20,
    marginHorizontal: 2,
  },
  tabContentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  listCard: {
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  memberRow: {
    flexDirection: 'row',
    padding: 14,
    alignItems: 'center',
  },
  infoContainer: {
    flex: 1,
    marginLeft: 12,
    gap: 6,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 12,
  },
  marginBottom12: {
    marginBottom: 12,
  },
  marginBottom6: {
    marginBottom: 6,
  },
});
