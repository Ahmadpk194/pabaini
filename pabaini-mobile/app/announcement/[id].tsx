import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Animated, Share } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Share2, Heart, MessageCircle, Eye, MapPin, Send, Pin } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/hooks/useAuth';
import { getById } from '../../src/api/announcements';
import { Announcement } from '../../src/types';
import { Badge } from '../../src/components/ui/Badge';
import { getCategoryConfig } from '../../src/constants/categories';
import { AnnouncementDetailSkeleton } from '../../src/components/skeletons';
import { ImageViewer } from '../../src/components/ui/ImageViewer';
import { Avatar } from '../../src/components/ui/Avatar';
import { useLikeMutation } from '../../src/hooks/useLikeMutation';
import { queryKeys } from '../../src/constants/queryKeys';
import { useAuthPromptStore } from '../../src/store/authPromptStore';

export default function AnnouncementDetailScreen() {
  const { theme } = useTheme();
  const { user, isGuest } = useAuth();
  const router = useRouter();
  const { id, focus } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState('');
  const likeMutation = useLikeMutation();
  const commentInputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);


  
  // Animation for heart icon
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

  // Pull initialData from list cache for instant load
  const { data: announcement, isLoading, error } = useQuery({
    queryKey: queryKeys.announcements.detail(Number(id)),
    queryFn: () => getById(Number(id)),
    staleTime: 1000 * 30,
    initialData: () => {
      // Try to get from list cache
      const listData = queryClient.getQueryData(queryKeys.announcements.list({}));
      if (listData && Array.isArray(listData)) {
        return listData.find((a: Announcement) => a.id === Number(id));
      }
      return undefined;
    },
  });

  // Scroll to bottom and focus comment input if query param is set
  useEffect(() => {
    if (focus === 'comments' && !isLoading && announcement) {
      const timer = setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
        commentInputRef.current?.focus();
      }, 350); // Allow screen layout transition to complete
      return () => clearTimeout(timer);
    }
  }, [focus, isLoading, announcement]);

  async function handleLike() {
    if (isGuest) {
      useAuthPromptStore.getState().showPrompt({
        title: 'Log In to Like',
        description: 'Please sign in to like announcements and interact with the community.',
      });
      return;
    }
    if (!announcement) return;

    triggerBounceAnimation();
    likeMutation.mutate(announcement.id);
  }

  async function handleShare() {
    if (!announcement) return;
    try {
      await Share.share({
        title: announcement.title,
        message: `Check out this announcement on Pabaini village board:\n\n*${announcement.title}*\n\n${announcement.content}\n\nJoin the village feed: https://pabaini.app/announcements/${announcement.id}`,
      });
    } catch (error) {
      console.error('Error sharing announcement:', error);
    }
  }

  function getInitials(name: string): string {
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  if (isLoading) {
    return <AnnouncementDetailSkeleton />;
  }

  if (!announcement) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>Announcement not found</Text>
      </View>
    );
  }

  const categoryConfig = getCategoryConfig(announcement.category);
  const timeAgo = getTimeAgo(announcement.created_at);

  // Mock comments for design - TODO: Replace with actual comments API
  const mockComments = [
    { id: 1, author: 'Zaid Khan', text: 'Inshallah will be there. Very important', initials: 'ZK', timestamp: '2h ago' },
    { id: 2, author: 'Ali Hassan', text: 'Thanks for the information', initials: 'AH', timestamp: '5h ago' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={[]}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Fixed Header Bar */}
        <View style={[styles.fixedHeader, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border, paddingTop: insets.top }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
            <ArrowLeft size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Announcement</Text>
          <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
            <Share2 size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          ref={scrollViewRef}
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
        >
          {/* Full width image (16:9 aspect ratio) */}
          {announcement.image_url && (
            <View style={styles.imageContainer}>
              <ImageViewer uri={announcement.image_url} style={{ width: '100%', height: '100%' }}>
                <Image source={{ uri: announcement.image_url }} style={styles.fullWidthImage} resizeMode="cover" />
              </ImageViewer>
            </View>
          )}

          <View style={styles.content}>
            {/* Category Badge and Pin */}
            <View style={styles.categoryRow}>
              <Badge
                label={categoryConfig.label}
                bgColor={categoryConfig.bgColor}
                textColor={categoryConfig.textColor}
              />
              {announcement.is_pinned && (
                <Pin size={16} color={theme.colors.primary} style={styles.pinIcon} />
              )}
            </View>

            {/* Title */}
            <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
              {announcement.title}
            </Text>

            {/* Author Row */}
            <View style={styles.authorRow}>
              {announcement.author.avatar_url ? (
                <Image source={{ uri: announcement.author.avatar_url }} style={styles.avatarCircle} />
              ) : (
                <View style={[styles.avatarCircle, { backgroundColor: theme.colors.primary }]}>
                  <Text style={styles.avatarInitials}>{getInitials(announcement.author.name)}</Text>
                </View>
              )}
              <View style={styles.authorInfo}>
                <Text style={[styles.authorName, { color: theme.colors.textPrimary }]}>
                  {announcement.author.name}
                </Text>
                <Text style={[styles.timestamp, { color: theme.colors.textSecondary }]}>
                  {formatDate(announcement.created_at)} · {timeAgo}
                </Text>
              </View>
            </View>

            {/* Divider */}
            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

            {/* Content text */}
            <Text style={[styles.bodyText, { color: theme.colors.textSecondary }]}>
              {announcement.content}
            </Text>

            {/* Location chip */}
            {announcement.location && (
              <View style={[styles.locationChip, { backgroundColor: '#EAF3DE' }]}>
                <MapPin size={16} color="#27500A" />
                <Text style={styles.locationText}>{announcement.location}</Text>
              </View>
            )}

            {/* Stats row */}
            <View style={[styles.statsRow, { borderTopColor: theme.colors.border, borderBottomColor: theme.colors.border }]}>
              <TouchableOpacity onPress={handleLike} style={styles.statItem}>
                <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                  <Heart 
                    size={18} 
                    fill={announcement.liked_by_me ? theme.colors.primary : 'none'}
                    color={announcement.liked_by_me ? theme.colors.primary : theme.colors.textSecondary}
                  />
                </Animated.View>
                <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>
                  {announcement.likes_count} likes
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => commentInputRef.current?.focus()} style={styles.statItem}>
                <MessageCircle size={18} color={theme.colors.textSecondary} />
                <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>
                  {mockComments.length} comments
                </Text>
              </TouchableOpacity>

              <View style={styles.statItem}>
                <Eye size={18} color={theme.colors.textSecondary} />
                <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>
                  142 views
                </Text>
              </View>
            </View>

            {/* Comments section */}
            <View style={styles.commentsSection}>
              <Text style={[styles.commentsTitle, { color: theme.colors.textPrimary }]}>
                Comments ({mockComments.length})
              </Text>

              {mockComments.map((comment) => (
                <View key={comment.id} style={styles.commentItem}>
                  <View style={[styles.commentAvatar, { backgroundColor: theme.colors.primary }]}>
                    <Text style={styles.commentAvatarInitials}>{comment.initials}</Text>
                  </View>
                  <View style={styles.commentBubbleContainer}>
                    <View style={[styles.commentBubble, { backgroundColor: theme.colors.surface }]}>
                      <Text style={[styles.commentAuthor, { color: theme.colors.textPrimary }]}>
                        {comment.author}
                      </Text>
                      <Text style={[styles.commentText, { color: theme.colors.textSecondary }]}>
                        {comment.text}
                      </Text>
                    </View>
                    <Text style={[styles.commentTimestamp, { color: theme.colors.textSecondary }]}>
                      {comment.timestamp}
                    </Text>
                  </View>
                </View>
              ))}

              {mockComments.length > 2 && (
                <TouchableOpacity style={styles.viewAllButton}>
                  <Text style={[styles.viewAllText, { color: theme.colors.primary }]}>
                    View all {mockComments.length} comments
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>

        {/* Sticky Comment Input Bar */}
        <View style={[
          styles.commentInputBar, 
          { 
            backgroundColor: theme.colors.surface, 
            borderTopColor: theme.colors.border,
            paddingBottom: insets.bottom > 0 ? insets.bottom : 12
          }
        ]}>
          {isGuest && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() =>
                useAuthPromptStore.getState().showPrompt({
                  title: 'Log In to Comment',
                  description: 'Please sign in to comment on announcements and interact with the community.',
                })
              }
              style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255, 255, 255, 0.4)', zIndex: 10 }]}
            />
          )}
          {user?.avatar_url ? (
            <Image source={{ uri: user.avatar_url }} style={styles.myAvatar} />
          ) : (
            <View style={[styles.myAvatar, { backgroundColor: theme.colors.primary }]}>
              <Text style={styles.myAvatarInitials}>{getInitials(user?.name || 'Guest')}</Text>
            </View>
          )}
          <View style={styles.inputContainer}>
            <TextInput
              ref={commentInputRef}
              style={[styles.commentInput, { backgroundColor: theme.colors.background, color: theme.colors.textPrimary }]}
              placeholder={isGuest ? "Login to comment" : "Add a comment..."}
              placeholderTextColor={theme.colors.textSecondary}
              value={commentText}
              onChangeText={setCommentText}
              multiline
              editable={!isGuest}
            />
          </View>
          <TouchableOpacity 
            style={[styles.sendButton, { backgroundColor: theme.colors.primary, opacity: isGuest ? 0.5 : 1 }]}
            disabled={isGuest}
          >
            <Send size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
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

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 14,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 32,
  },
  fixedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  fullWidthImage: {
    width: '100%',
    height: '100%',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 12,
  },
  pinIcon: {
    marginLeft: 8,
  },
  title: {
    fontSize: 19,
    fontWeight: '500',
    lineHeight: 26.6,
    marginBottom: 12,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  authorInfo: {
    marginLeft: 10,
  },
  authorName: {
    fontSize: 13,
    fontWeight: '500',
  },
  timestamp: {
    fontSize: 12,
    marginTop: 2,
  },
  divider: {
    height: 0.5,
    marginBottom: 14,
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 24.5,
    marginBottom: 14,
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginBottom: 14,
    alignSelf: 'flex-start',
  },
  locationText: {
    fontSize: 13,
    color: '#27500A',
    marginLeft: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 14,
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    marginBottom: 20,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 13,
  },
  commentsSection: {
    marginBottom: 20,
  },
  commentsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 14,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  commentAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentAvatarInitials: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  commentBubbleContainer: {
    flex: 1,
    marginLeft: 10,
  },
  commentBubble: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  commentAuthor: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  commentText: {
    fontSize: 13,
    lineHeight: 18,
  },
  commentTimestamp: {
    fontSize: 11,
    marginTop: 4,
  },
  viewAllButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  commentInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 0.5,
  },
  myAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  myAvatarInitials: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  inputContainer: {
    flex: 1,
    marginHorizontal: 10,
  },
  commentInput: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    fontSize: 14,
    maxHeight: 80,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
