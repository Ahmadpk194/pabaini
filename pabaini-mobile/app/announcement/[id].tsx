import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Animated, Share, ActivityIndicator, Alert, RefreshControl, Keyboard } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Share2, Heart, MessageCircle, Eye, MapPin, Send, Pin } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/hooks/useAuth';
import { getById } from '../../src/api/announcements';
import { Announcement, Comment } from '../../src/types';
import { Badge } from '../../src/components/ui/Badge';
import { getCategoryConfig } from '../../src/constants/categories';
import { AnnouncementDetailSkeleton, CommentSkeleton } from '../../src/components/skeletons';
import { ImageViewer } from '../../src/components/ui/ImageViewer';
import { Avatar } from '../../src/components/ui/Avatar';
import { useLikeMutation } from '../../src/hooks/useLikeMutation';
import { queryKeys } from '../../src/constants/queryKeys';
import { useAuthPromptStore } from '../../src/store/authPromptStore';
import { getComments, createComment, updateComment, deleteComment, CommentsListResponse } from '../../src/api/comments';

export default function AnnouncementDetailScreen() {
  const { theme } = useTheme();
  const { user, isGuest } = useAuth();
  const router = useRouter();
  const { id, focus } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState('');
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const likeMutation = useLikeMutation();
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const commentInputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Fetch comments
  const { data: commentsResponse, isLoading: isCommentsLoading } = useQuery({
    queryKey: queryKeys.comments.list(Number(id)),
    queryFn: () => getComments(Number(id)),
    enabled: !!id,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.announcements.detail(Number(id)) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.list(Number(id)) }),
    ]);
    setRefreshing(false);
  };

  const createCommentMutation = useMutation({
    mutationFn: (body: string) => createComment(Number(id), body),
    onMutate: async (newCommentBody) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: queryKeys.comments.list(Number(id)) });

      // Snapshot the previous value
      const previousComments = queryClient.getQueryData<CommentsListResponse>(
        queryKeys.comments.list(Number(id))
      );

      // Create optimistic comment
      const tempId = Date.now();
      const optimisticComment: Comment = {
        commentId: tempId,
        entityType: 'announcement',
        entityId: Number(id),
        parentId: null,
        body: newCommentBody,
        isDeleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        author: {
          id: user?.id || 0,
          name: user?.name || 'Me',
          avatarUrl: user?.avatar_url || null,
          role: user?.role || 'resident',
        },
        isOwner: true,
        canEdit: true,
        canDelete: true,
        isPending: true,
      };

      // Optimistically update to the new value
      if (previousComments) {
        queryClient.setQueryData<CommentsListResponse>(
          queryKeys.comments.list(Number(id)),
          {
            ...previousComments,
            comments: [...previousComments.comments, optimisticComment],
            total: previousComments.total + 1,
          }
        );
      } else {
        queryClient.setQueryData<CommentsListResponse>(
          queryKeys.comments.list(Number(id)),
          {
            comments: [optimisticComment],
            total: 1,
            hasMore: false,
          }
        );
      }

      // Return a context object with the snapshotted value
      return { previousComments, tempId };
    },
    onError: (error: any, newCommentBody, context) => {
      // Rollback to the previous value
      if (context?.previousComments) {
        queryClient.setQueryData(
          queryKeys.comments.list(Number(id)),
          context.previousComments
        );
      }
      Alert.alert('Error', error.response?.data?.message || 'Failed to post comment. Please try again.');
    },
    onSuccess: (savedComment, newCommentBody, context) => {
      // Clear input
      setCommentText('');

      // Replace the temporary comment with the server response
      const currentComments = queryClient.getQueryData<CommentsListResponse>(
        queryKeys.comments.list(Number(id))
      );
      if (currentComments && context?.tempId) {
        const updatedList = currentComments.comments.map((comment) =>
          comment.commentId === context.tempId ? savedComment : comment
        );
        queryClient.setQueryData<CommentsListResponse>(
          queryKeys.comments.list(Number(id)),
          {
            ...currentComments,
            comments: updatedList,
          }
        );
      }
      // Also invalidate comments count stats on parent announcement
      queryClient.invalidateQueries({ queryKey: queryKeys.announcements.detail(Number(id)) });
    },
    onSettled: () => {
      // Always refetch after error or success to keep server sync
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.list(Number(id)) });
    },
  });

  const updateCommentMutation = useMutation({
    mutationFn: ({ commentId, body }: { commentId: number; body: string }) =>
      updateComment(Number(id), commentId, body),
    onSuccess: () => {
      setEditingComment(null);
      setCommentText('');
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.list(Number(id)) });
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update comment. Please try again.');
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: number) => deleteComment(Number(id), commentId),
    onMutate: async (deletedCommentId) => {
      // Cancel outgoing comments list refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.comments.list(Number(id)) });

      // Snapshot the current cache
      const previousComments = queryClient.getQueryData<CommentsListResponse>(
        queryKeys.comments.list(Number(id))
      );

      // Optimistically update: filter out the deleted comment
      if (previousComments) {
        queryClient.setQueryData<CommentsListResponse>(
          queryKeys.comments.list(Number(id)),
          {
            ...previousComments,
            comments: previousComments.comments.filter((c) => c.commentId !== deletedCommentId),
            total: Math.max(0, previousComments.total - 1),
          }
        );
      }

      // Return context containing previous comments
      return { previousComments };
    },
    onError: (error: any, deletedCommentId, context) => {
      // Rollback to the snapshotted cache
      if (context?.previousComments) {
        queryClient.setQueryData(
          queryKeys.comments.list(Number(id)),
          context.previousComments
        );
      }
      Alert.alert('Error', error.response?.data?.message || 'Failed to delete comment. Please try again.');
    },
    onSuccess: () => {
      // Invalidate announcements count stats on parent announcement
      queryClient.invalidateQueries({ queryKey: queryKeys.announcements.detail(Number(id)) });
    },
    onSettled: () => {
      // Keep in sync with backend
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.list(Number(id)) });
    },
  });

  const handleSend = () => {
    if (isGuest) {
      useAuthPromptStore.getState().showPrompt({
        title: 'Log In to Comment',
        description: 'Please sign in to comment on announcements and interact with the community.',
      });
      return;
    }

    const trimmed = commentText.trim();
    if (!trimmed) return;

    if (editingComment) {
      updateCommentMutation.mutate({ commentId: editingComment.commentId, body: trimmed });
    } else {
      createCommentMutation.mutate(trimmed);
    }
  };

  const handleDeleteComment = (commentId: number) => {
    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteCommentMutation.mutate(commentId)
        }
      ]
    );
  };

  const handleEditComment = (comment: Comment) => {
    setEditingComment(comment);
    setCommentText(comment.body);
    commentInputRef.current?.focus();
  };

  const handleCancelEdit = () => {
    setEditingComment(null);
    setCommentText('');
  };

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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={[]}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
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
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => announcement.author?.id && router.push(`/profile/${announcement.author.id}`)}
              style={styles.authorRow}
            >
              {announcement.author?.avatar_url ? (
                <Image source={{ uri: announcement.author.avatar_url }} style={styles.avatarCircle} />
              ) : (
                <View style={[styles.avatarCircle, { backgroundColor: theme.colors.primary }]}>
                  <Text style={styles.avatarInitials}>{getInitials(announcement.author?.name || 'System')}</Text>
                </View>
              )}
              <View style={styles.authorInfo}>
                <Text style={[styles.authorName, { color: theme.colors.textPrimary }]}>
                  {announcement.author?.name || 'System'}
                </Text>
                <Text style={[styles.timestamp, { color: theme.colors.textSecondary }]}>
                  {formatDate(announcement.created_at)} · {timeAgo}
                </Text>
              </View>
            </TouchableOpacity>

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
                    fill={announcement.liked_by_me ? theme.colors.danger : 'none'}
                    color={announcement.liked_by_me ? theme.colors.danger : theme.colors.textSecondary}
                  />
                </Animated.View>
                <Text style={[styles.statText, { color: announcement.liked_by_me ? theme.colors.danger : theme.colors.textSecondary }]}>
                  {announcement.likes_count} likes
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => commentInputRef.current?.focus()} style={styles.statItem}>
                <MessageCircle size={18} color={theme.colors.textSecondary} />
                <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>
                  {(commentsResponse?.total ?? announcement.comments_count ?? 0)} comments
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
                Comments ({(commentsResponse?.total ?? announcement.comments_count ?? 0)})
              </Text>

              {isCommentsLoading ? (
                <CommentSkeleton />
              ) : !commentsResponse?.comments || commentsResponse.comments.length === 0 ? (
                <View style={styles.emptyCommentsContainer}>
                  <Text style={[styles.emptyCommentsText, { color: theme.colors.textSecondary }]}>
                    No comments yet. Be the first to comment.
                  </Text>
                </View>
              ) : (
                commentsResponse.comments.map((comment) => (
                  <View key={comment.commentId} style={[styles.commentItem, { opacity: comment.isPending ? 0.6 : 1 }]}>
                    {comment.author.avatarUrl ? (
                      <Image source={{ uri: comment.author.avatarUrl }} style={styles.commentAvatar} />
                    ) : (
                      <View style={[styles.commentAvatar, { backgroundColor: theme.colors.primary }]}>
                        <Text style={styles.commentAvatarInitials}>
                          {getInitials(comment.author.name)}
                        </Text>
                      </View>
                    )}
                    <View style={styles.commentBubbleContainer}>
                      <View style={[styles.commentBubble, { backgroundColor: theme.colors.surface }]}>
                        <Text style={[styles.commentAuthor, { color: theme.colors.textPrimary }]}>
                          {comment.author.name}
                        </Text>
                        <Text style={[styles.commentText, { color: theme.colors.textSecondary }]}>
                          {comment.body}
                        </Text>
                      </View>
                      
                      <View style={styles.commentMetaRow}>
                        <Text style={[styles.commentTimestamp, { color: theme.colors.textSecondary }]}>
                          {getTimeAgo(comment.createdAt)}
                        </Text>
                        {comment.canEdit && !comment.isPending && (
                          <TouchableOpacity onPress={() => handleEditComment(comment)}>
                            <Text style={[styles.commentActionText, { color: theme.colors.primary }]}>
                              Edit
                            </Text>
                          </TouchableOpacity>
                        )}
                        {comment.canDelete && !comment.isPending && (
                          <TouchableOpacity onPress={() => handleDeleteComment(comment.commentId)}>
                            <Text style={[styles.commentActionText, { color: theme.colors.danger }]}>
                              Delete
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        </ScrollView>

        {/* Sticky Comment Input Bar */}
        <View style={[
          styles.commentInputContainer, 
          { 
            backgroundColor: theme.colors.surface, 
            borderTopColor: theme.colors.border,
            borderTopWidth: 0.5,
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

          {editingComment && (
            <View style={[styles.editingHeader, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.editingText, { color: theme.colors.textSecondary }]}>
                Editing comment
              </Text>
              <TouchableOpacity onPress={handleCancelEdit}>
                <Text style={[styles.cancelText, { color: theme.colors.primary }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={[
            styles.commentInputBar, 
            { 
              paddingBottom: Platform.OS === 'ios'
                ? (insets.bottom > 0 && !keyboardVisible ? insets.bottom : 12)
                : 12
            }
          ]}>
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
                placeholder={isGuest ? "Login to comment" : editingComment ? "Edit comment..." : "Add a comment..."}
                placeholderTextColor={theme.colors.textSecondary}
                value={commentText}
                onChangeText={setCommentText}
                multiline
                editable={!isGuest && !(createCommentMutation.isPending || updateCommentMutation.isPending)}
              />
            </View>
            <TouchableOpacity 
              style={[
                styles.sendButton, 
                { 
                  backgroundColor: theme.colors.primary, 
                  opacity: (isGuest || !commentText.trim() || createCommentMutation.isPending || updateCommentMutation.isPending) ? 0.5 : 1 
                }
              ]}
              disabled={isGuest || !commentText.trim() || createCommentMutation.isPending || updateCommentMutation.isPending}
              onPress={handleSend}
            >
              {(createCommentMutation.isPending || updateCommentMutation.isPending) ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Send size={18} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
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
  commentInputContainer: {
    width: '100%',
  },
  commentInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  commentMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  commentActionText: {
    fontSize: 11,
    fontWeight: '500',
  },
  editingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 0.5,
  },
  editingText: {
    fontSize: 12,
    fontWeight: '500',
  },
  cancelText: {
    fontSize: 12,
    fontWeight: '600',
  },
  commentsLoadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCommentsContainer: {
    paddingVertical: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCommentsText: {
    fontSize: 14,
    textAlign: 'center',
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
