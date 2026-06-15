import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, Text, TouchableOpacity, Modal, Alert, ActivityIndicator, Share } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/hooks/useAuth';
import { useAnnouncements } from '../../src/hooks/useAnnouncements';
import { AnnouncementCard } from '../../src/components/notice/AnnouncementCard';
import { CategoryFilterBar } from '../../src/components/notice/CategoryFilterBar';
import { NoticeFeedSkeleton } from '../../src/components/skeletons';
import { Category, Announcement } from '../../src/types';
import { queryKeys } from '../../src/constants/queryKeys';
import { update, softDelete } from '../../src/api/announcements';

export default function HomeScreen() {
  const { theme } = useTheme();
  const { user, isGuest } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const { data: announcements = [], isLoading, refetch } = useAnnouncements(
    selectedCategory === 'all' ? undefined : selectedCategory
  );

  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [activeAction, setActiveAction] = useState<'pin' | 'delete' | null>(null);

  const handleSettingsPress = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setMenuVisible(true);
  };

  const handleCloseMenu = () => {
    if (activeAction !== null) return;
    setMenuVisible(false);
    setSelectedAnnouncement(null);
  };

  const handleTogglePin = async () => {
    if (!selectedAnnouncement) return;
    try {
      setActiveAction('pin');
      await update(selectedAnnouncement.id, { is_pinned: !selectedAnnouncement.is_pinned });
      
      // Invalidate queries to refresh feed
      await queryClient.invalidateQueries({ queryKey: queryKeys.announcements.all });
      
      setMenuVisible(false);
      setSelectedAnnouncement(null);
    } catch (error) {
      console.error('Failed to toggle pin status:', error);
      Alert.alert('Error', 'Failed to update pin status. Please try again.');
    } finally {
      setActiveAction(null);
    }
  };

  const handleDeleteAnnouncement = () => {
    if (!selectedAnnouncement) return;
    
    Alert.alert(
      'Delete Announcement',
      'Are you sure you want to delete this announcement? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              setActiveAction('delete');
              await softDelete(selectedAnnouncement.id);
              
              // Invalidate queries to refresh feed
              await queryClient.invalidateQueries({ queryKey: queryKeys.announcements.all });
              
              setMenuVisible(false);
              setSelectedAnnouncement(null);
            } catch (error) {
              console.error('Failed to delete announcement:', error);
              Alert.alert('Error', 'Failed to delete announcement. Please try again.');
            } finally {
              setActiveAction(null);
            }
          }
        }
      ]
    );
  };

  const handleAnnouncementPress = (id: number) => {
    router.push(`/announcement/${id}`);
  };

  const handleCreatePress = () => {
    if (isGuest) {
      // TODO: Show login prompt
      console.log('Guest mode - login required');
      return;
    }
    if (user?.role === 'admin' || user?.role === 'moderator') {
      router.push('/announcement/create');
    }
  };

  const handleShare = async (announcement: Announcement) => {
    try {
      await Share.share({
        title: announcement.title,
        message: `Check out this announcement on Pabaini village board:\n\n*${announcement.title}*\n\n${announcement.content}\n\nJoin the village feed: https://pabaini.app/announcements/${announcement.id}`,
      });
    } catch (error) {
      console.error('Error sharing announcement:', error);
    }
  };

  return (
    <View style={[styles.content, { backgroundColor: theme.colors.background }]}>
      <CategoryFilterBar
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {isLoading ? (
        <NoticeFeedSkeleton />
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={() => refetch()}
              tintColor={theme.colors.primary}
            />
          }
        >
          {announcements.map((announcement: Announcement) => (
            <AnnouncementCard
              key={announcement.id}
              announcement={announcement}
              onShare={handleShare}
              onSettingsPress={handleSettingsPress}
            />
          ))}

          {announcements.length === 0 && !isLoading && (
            <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              No announcements yet
            </Text>
          </View>
        )}
      </ScrollView>
      )}

      {/* FAB for creating announcements (admin/mod only) */}
      {(user?.role === 'admin' || user?.role === 'moderator') && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: '#1F4A2E' }]}
          onPress={handleCreatePress}
          activeOpacity={0.8}
        >
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {/* Post Settings Bottom Sheet Drawer */}
      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseMenu}
      >
        <TouchableOpacity 
          style={styles.modalBackdrop} 
          activeOpacity={1} 
          onPress={handleCloseMenu}
        >
          <View style={[styles.drawerContainer, { backgroundColor: theme.colors.surface }]}>
            {/* Grab Handle */}
            <View style={styles.dragHandle} />
            
            {/* Title */}
            <Text style={[styles.drawerTitle, { color: theme.colors.textPrimary }]}>
              Post Settings
            </Text>
            
            <View style={[styles.drawerDivider, { backgroundColor: theme.colors.border }]} />

            {/* Actions list */}
            {selectedAnnouncement && (
              <View style={styles.drawerActions}>
                {/* Pin/Unpin option (admin/moderator only) */}
                {(user?.role === 'admin' || user?.role === 'moderator') && (
                  <TouchableOpacity
                    style={[styles.drawerActionItem, activeAction !== null && styles.disabledAction]}
                    onPress={handleTogglePin}
                    disabled={activeAction !== null}
                  >
                    <Ionicons 
                      name={selectedAnnouncement.is_pinned ? "pin-outline" : "pin"} 
                      size={22} 
                      color={theme.colors.textPrimary} 
                    />
                    <Text style={[styles.drawerActionText, { color: theme.colors.textPrimary }]}>
                      {selectedAnnouncement.is_pinned ? "Unpin Announcement" : "Pin Announcement"}
                    </Text>
                    {activeAction === 'pin' && <ActivityIndicator size="small" color={theme.colors.textPrimary} style={styles.loadingIndicator} />}
                  </TouchableOpacity>
                )}

                {/* Delete option (admin or author) */}
                {(user?.role === 'admin' || user?.id === selectedAnnouncement.author_id) && (
                  <TouchableOpacity
                    style={[styles.drawerActionItem, activeAction !== null && styles.disabledAction]}
                    onPress={handleDeleteAnnouncement}
                    disabled={activeAction !== null}
                  >
                    <Ionicons 
                      name="trash-outline" 
                      size={22} 
                      color="#DC2626" 
                    />
                    <Text style={[styles.drawerActionText, { color: '#DC2626' }]}>
                      Delete Announcement
                    </Text>
                    {activeAction === 'delete' && <ActivityIndicator size="small" color="#DC2626" style={styles.loadingIndicator} />}
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Cancel Button */}
            <TouchableOpacity 
              style={[styles.cancelButton, { backgroundColor: theme.colors.background }]} 
              onPress={handleCloseMenu}
              disabled={activeAction !== null}
            >
              <Text style={[styles.cancelButtonText, { color: theme.colors.textSecondary }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>

  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  emptyContainer: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  drawerContainer: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 20,
    paddingBottom: 34,
    paddingTop: 10,
    width: '100%',
  },
  dragHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CCCCCC',
    alignSelf: 'center',
    marginBottom: 16,
  },
  drawerTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  drawerDivider: {
    height: 0.5,
    width: '100%',
    marginBottom: 16,
  },
  drawerActions: {
    gap: 16,
    marginBottom: 20,
  },
  drawerActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  drawerActionText: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  disabledAction: {
    opacity: 0.5,
  },
  loadingIndicator: {
    marginLeft: 8,
  },
  cancelButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
