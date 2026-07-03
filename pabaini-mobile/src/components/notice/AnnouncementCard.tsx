import React, { useRef } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Animated, ActivityIndicator } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Pin } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { safeRouterPush } from '../../navigation/safeNavigation';
import { Announcement, Category } from '../../types';
import { useLikeMutation } from '../../hooks/useLikeMutation';
import { useAuth } from '../../hooks/useAuth';
import { useAuthPromptStore } from '../../store/authPromptStore';
import { useMatchDetail } from '../../hooks/useMatches';
import { MatchCard } from '../sports/matches/MatchCard';

interface AnnouncementCardProps {
  announcement: Announcement;
  onShare: (announcement: Announcement) => void;
  onSettingsPress?: (announcement: Announcement) => void;
}

export function AnnouncementCard({ announcement, onShare, onSettingsPress }: AnnouncementCardProps) {
  const { theme, mode } = useTheme();
  const router = useRouter();
  const likeMutation = useLikeMutation();
  const { isGuest } = useAuth();

  const showSettings = true; // In index.tsx, settings visibility is controlled in handleSettingsPress, but here we show it for author/admin/mod

  // Animation for heart icon using React Native Animated
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const triggerBounceAnimation = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.3,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();
  };
  
  const getInitials = (name: string): string => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };
  
  const getCategoryBadgeStyle = (category: Category) => {
    switch (category) {
      case 'urgent':
        return { backgroundColor: theme.colors.dangerLight, color: theme.colors.dangerText };
      case 'event':
        return { backgroundColor: theme.colors.infoLight, color: theme.colors.infoText };
      case 'match_result':
        return { backgroundColor: '#EBFBEF', color: '#2E7D32' };
      case 'general':
      default:
        return { backgroundColor: theme.colors.elevated, color: theme.colors.textSecondary };
    }
  };
  
  const getCategoryLabel = (category: Category): string => {
    switch (category) {
      case 'urgent':
        return 'Urgent';
      case 'event':
        return 'Event';
      case 'jirga_decision':
        return 'Jirga';
      case 'match_result':
        return 'Match';
      case 'general':
      default:
        return 'General';
    }
  };
  
  const timeAgo = getTimeAgo(announcement.created_at);
  const badgeStyle = getCategoryBadgeStyle(announcement.category);
  const categoryLabel = getCategoryLabel(announcement.category);

  const handleLikePress = async () => {
    if (isGuest) {
      useAuthPromptStore.getState().showPrompt({
        title: 'Log In to Like',
        description: 'Please sign in to like announcements and interact with the community.',
      });
      return;
    }
    triggerBounceAnimation();
    likeMutation.mutate(announcement.id);
  };

  const handleCardPress = () => {
    safeRouterPush(router, `/announcement/${announcement.id}`);
  };

  const avatarBg = mode === 'dark' ? theme.colors.primaryTint : theme.colors.primaryLight;
  const avatarTextColor = mode === 'dark' ? theme.colors.primaryText : theme.colors.primaryTint;
  
  return (
    <TouchableOpacity onPress={handleCardPress} activeOpacity={0.7}>
      <View style={[
        styles.container, 
        { 
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
          flexDirection: 'row',
        }
      ]}>
        {announcement.is_pinned && (
          <View style={{ width: 3, backgroundColor: theme.colors.primary }} />
        )}

        <View style={{ flex: 1 }}>
          {/* Header Row */}
          <View style={styles.header}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={(e) => {
                e.stopPropagation();
                if (isGuest) {
                  useAuthPromptStore.getState().showPrompt({
                    title: 'Log In to View Profiles',
                    description: 'Please sign in to view player profiles and interact with the community.',
                  });
                  return;
                }
                if (announcement.author?.id) {
                  safeRouterPush(router, `/profile/${announcement.author.id}`);
                }
              }}
              style={styles.authorClickable}
            >
              {/* Avatar Circle */}
              {announcement.author?.avatar_url ? (
                <Image
                  source={{ uri: announcement.author.avatar_url }}
                  style={[styles.avatar, { borderWidth: 1.5, borderColor: theme.colors.primaryLight }]}
                />
              ) : (
                <View style={[styles.avatar, { backgroundColor: avatarBg, borderWidth: 1.5, borderColor: theme.colors.primaryLight }]}>
                  <Text style={[styles.avatarText, { color: avatarTextColor }]}>
                    {getInitials(announcement.author?.name || 'System')}
                  </Text>
                </View>
              )}
              
              {/* Author Info */}
              <View style={styles.headerInfo}>
                <Text style={[styles.authorName, { color: theme.colors.textPrimary }]}>
                  {announcement.author?.name || 'System'}
                </Text>
                <View style={styles.subtitleRow}>
                  {announcement.is_pinned ? (
                    <View style={styles.pinnedLabelRow}>
                      <Pin size={10} color={theme.colors.primary} fill={theme.colors.primary} style={styles.pinnedIcon} />
                      <Text style={[styles.pinnedLabelText, { color: theme.colors.primary }]}>Pinned</Text>
                      <Text style={[styles.timestampText, { color: theme.colors.textTertiary }]}>
                        {' · '}{timeAgo}
                      </Text>
                    </View>
                  ) : (
                    <Text style={[styles.timestampText, { color: theme.colors.textTertiary }]}>
                      {timeAgo}
                    </Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
            
            {/* Right Action/Badge Area */}
            <View style={styles.headerRight}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {/* Category Badge */}
                <View style={[styles.categoryBadge, { backgroundColor: badgeStyle.backgroundColor }]}>
                  <Text style={[styles.categoryBadgeText, { color: badgeStyle.color }]}>
                    {categoryLabel}
                  </Text>
                </View>

                {onSettingsPress && (
                  <TouchableOpacity 
                    onPress={(e) => {
                      e.stopPropagation();
                      onSettingsPress(announcement);
                    }}
                    style={styles.settingsButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="ellipsis-vertical" size={18} color={theme.colors.textTertiary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
          
          {/* Body */}
          <View style={styles.body}>
            <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
              {announcement.title}
            </Text>
            <Text 
              style={[
                styles.content, 
                { 
                  color: theme.colors.textSecondary,
                  marginBottom: announcement.image_url ? 0 : 12
                }
              ]} 
              numberOfLines={3}
              ellipsizeMode="tail"
            >
              {announcement.content}
            </Text>
          </View>
          
          {/* Embedded Match Card */}
          {!!announcement.match_id && (
            <View style={styles.embeddedMatchContainer}>
              <EmbeddedAnnouncementMatchCard matchId={announcement.match_id} />
            </View>
          )}
          
          {/* Image */}
          {announcement.image_url && (
            <Image 
              source={{ uri: announcement.image_url }} 
              style={[
                styles.image,
                { marginTop: (announcement.title || announcement.content || announcement.match_id) ? 10 : 0 }
              ]} 
              resizeMode="cover" 
            />
          )}
          
          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
            <View style={styles.leftActions}>
              <TouchableOpacity onPress={(e) => { e.stopPropagation(); handleLikePress(); }} style={styles.footerAction}>
                <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                  <Ionicons
                    name={announcement.liked_by_me ? 'heart' : 'heart-outline'}
                    size={17}
                    color={announcement.liked_by_me ? theme.colors.danger : theme.colors.textTertiary}
                  />
                </Animated.View>
                <Text style={[
                  styles.footerActionText,
                  { color: announcement.liked_by_me ? theme.colors.danger : theme.colors.textTertiary }
                ]}>
                  {announcement.likes_count}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  safeRouterPush(router, {
                    pathname: `/announcement/${announcement.id}`,
                    params: { focus: 'comments' }
                  });
                }}
                style={styles.footerAction}
              >
                <Ionicons name="chatbubble-outline" size={17} color={theme.colors.textTertiary} />
                <Text style={[styles.footerActionText, { color: theme.colors.textTertiary }]}>
                  {announcement.comments_count}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={(e) => { e.stopPropagation(); onShare(announcement); }} style={styles.footerAction}>
              <Ionicons name="share-social-outline" size={17} color={theme.colors.textTertiary} />
              <Text style={[styles.footerActionText, { color: theme.colors.textTertiary }]}>
                Share
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    borderWidth: 0.5,
    marginBottom: 8,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
    gap: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '600',
  },
  headerInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 13,
    fontWeight: '500',
  },
  subtitleRow: {
    marginTop: 2,
  },
  pinnedLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pinnedIcon: {
    marginRight: 2,
  },
  pinnedLabelText: {
    fontSize: 11,
    fontWeight: '500',
  },
  timestampText: {
    fontSize: 11,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  headerRight: {
    justifyContent: 'center',
  },
  settingsButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    paddingHorizontal: 14,
    paddingTop: 0,
    paddingBottom: 0,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 4,
    lineHeight: 15 * 1.35,
  },
  content: {
    fontSize: 13,
    lineHeight: 13 * 1.5,
  },
  image: {
    width: '100%',
    height: 180,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 0.5,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  footerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerActionText: {
    fontSize: 13,
  },
  authorClickable: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  embeddedMatchContainer: {
    marginTop: 10,
    marginBottom: 6,
    paddingHorizontal: 14,
  },
  matchLoading: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#e0e0e0',
    borderWidth: 1,
    borderRadius: 8,
  },
});

function EmbeddedAnnouncementMatchCard({ matchId }: { matchId: number }) {
  const { theme } = useTheme();
  const router = useRouter();
  const { data: match, isLoading } = useMatchDetail(matchId);

  if (isLoading) {
    return (
      <View style={styles.matchLoading}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
  }

  if (!match) return null;

  return (
    <MatchCard
      match={match}
      onPress={() => {
        safeRouterPush(router, `/sports/cricket/matches/${matchId}`);
      }}
    />
  );
}
