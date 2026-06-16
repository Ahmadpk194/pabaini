import React, { useRef } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Pin } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { Announcement, Category } from '../../types';
import { useLikeMutation } from '../../hooks/useLikeMutation';
import { useAuth } from '../../hooks/useAuth';

interface AnnouncementCardProps {
  announcement: Announcement;
  onShare: (announcement: Announcement) => void;
  onSettingsPress?: (announcement: Announcement) => void;
}

export function AnnouncementCard({ announcement, onShare, onSettingsPress }: AnnouncementCardProps) {
  const { theme } = useTheme();
  const router = useRouter();
  const likeMutation = useLikeMutation();
  const { user } = useAuth();

  const showSettings = user?.role === 'admin' || user?.role === 'moderator' || user?.id === announcement.author_id;

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
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };
  
  const getCategoryBadgeStyle = (category: Category) => {
    switch (category) {
      case 'urgent':
        return { backgroundColor: theme.colors.urgentBg, color: theme.colors.urgentText };
      case 'event':
        return { backgroundColor: theme.colors.eventBg, color: theme.colors.eventText };
      case 'jirga_decision':
        return { backgroundColor: '#EAF3DE', color: '#27500A' };
      case 'general':
      default:
        return { backgroundColor: theme.colors.generalBg, color: theme.colors.generalText };
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
      case 'general':
      default:
        return 'General';
    }
  };
  
  const timeAgo = getTimeAgo(announcement.created_at);
  const badgeStyle = getCategoryBadgeStyle(announcement.category);
  const categoryLabel = getCategoryLabel(announcement.category);

  const handleLikePress = async () => {
    // Trigger bounce animation
    triggerBounceAnimation();
    
    // Call mutation - React Query handles optimistic updates
    likeMutation.mutate(announcement.id);
  };

  const handleCardPress = () => {
    router.push(`/announcement/${announcement.id}`);
  };
  
  return (
    <TouchableOpacity onPress={handleCardPress} activeOpacity={0.7}>
      <View style={[styles.container, { borderColor: theme.colors.border }]}>
        {/* Header Row */}
        <View style={styles.header}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={(e) => {
              e.stopPropagation();
              router.push(`/profile/${announcement.author.id}`);
            }}
            style={styles.authorClickable}
          >
            {/* Avatar Circle */}
            {announcement.author.avatar_url ? (
              <Image
                source={{ uri: announcement.author.avatar_url }}
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatar, { backgroundColor: '#EAF3DE' }]}>
                <Text style={[styles.avatarText, { color: '#27500A' }]}>
                  {getInitials(announcement.author.name)}
                </Text>
              </View>
            )}
            
            {/* Author Info */}
            <View style={styles.headerInfo}>
              <Text style={[styles.authorName, { color: theme.colors.textPrimary }]}>
                {announcement.author.name}
              </Text>
              <Text style={[styles.timestamp, { color: theme.colors.textSecondary }]}>
                {timeAgo}
              </Text>
            </View>
          </TouchableOpacity>
          
          {/* Right Action/Badge Area */}
          <View style={styles.headerRight}>
            {showSettings && (
              <TouchableOpacity 
                onPress={(e) => {
                  e.stopPropagation();
                  onSettingsPress?.(announcement);
                }}
                style={styles.settingsButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="ellipsis-horizontal" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            )}
            
            <View style={styles.badgeRow}>
              {/* Category Badge */}
              <View style={[styles.categoryBadge, { backgroundColor: badgeStyle.backgroundColor }]}>
                <Text style={[styles.categoryBadgeText, { color: badgeStyle.color }]}>
                  {categoryLabel}
                </Text>
              </View>
            </View>
          </View>
        </View>
        
        {/* Body */}
        <View style={styles.body}>
          <View style={styles.titleRow}>
            {announcement.is_pinned && (
              <Pin size={16} color={theme.colors.primary} fill={theme.colors.primary} style={styles.titlePinIcon} />
            )}
            <Text style={[styles.title, { color: theme.colors.textPrimary, flex: 1 }]}>
              {announcement.title}
            </Text>
          </View>
          <Text style={[styles.content, { color: theme.colors.textSecondary }]} numberOfLines={3}>
            {announcement.content}
          </Text>
        </View>
        
        {/* Image */}
        {announcement.image_url && (
          <Image 
            source={{ uri: announcement.image_url }} 
            style={styles.image} 
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
                  size={20}
                  color={announcement.liked_by_me ? '#1F4A2E' : theme.colors.textSecondary}
                />
              </Animated.View>
              <Text style={[
                styles.footerActionText,
                { color: theme.colors.textSecondary },
                announcement.liked_by_me && styles.likedText
              ]}>
                {announcement.likes_count}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                router.push({
                  pathname: `/announcement/${announcement.id}`,
                  params: { focus: 'comments' }
                });
              }}
              style={styles.footerAction}
            >
              <Ionicons name="chatbubble-outline" size={18} color={theme.colors.textSecondary} />
              <Text style={[styles.footerActionText, { color: theme.colors.textSecondary }]}>
                2
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={(e) => { e.stopPropagation(); onShare(announcement); }} style={styles.footerAction}>
            <Ionicons name="share-social-outline" size={20} color={theme.colors.textSecondary} />
            <Text style={[styles.footerActionText, { color: theme.colors.textSecondary }]}>
              Share
            </Text>
          </TouchableOpacity>
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
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 0.5,
    overflow: 'hidden',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
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
  timestamp: {
    fontSize: 11,
    marginTop: 2,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  pinIcon: {
    marginLeft: 4,
  },
  headerRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 4,
  },
  settingsButton: {
    padding: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  body: {
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  titlePinIcon: {
    transform: [{ rotate: '45deg' }],
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
  },
  content: {
    fontSize: 13,
    lineHeight: 20.8,
  },
  image: {
    width: '100%',
    aspectRatio: 16 / 9,
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
    gap: 20,
  },
  footerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerActionText: {
    fontSize: 13,
    fontWeight: '500',
  },
  likedText: {
    color: '#1F4A2E',
    fontWeight: 'bold',
  },
  authorClickable: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
});
