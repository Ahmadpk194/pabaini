import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Image as ImageIcon, X, MapPin, Globe, AlertTriangle, Calendar, Scale, Trophy } from 'lucide-react-native';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/hooks/useAuth';
import { create, uploadImage } from '../../src/api/announcements';
import { Category } from '../../src/types';
import { queryKeys } from '../../src/constants/queryKeys';
import { Avatar } from '../../src/components/ui/Avatar';
import { useMatchDetail } from '../../src/hooks/useMatches';
import { useSportsStore } from '../../src/store/sports/sportsStore';

const CATEGORIES: Category[] = ['general', 'urgent', 'event', 'jirga_decision', 'match_result'];

const CATEGORY_ICONS = {
  general: Globe,
  urgent: AlertTriangle,
  event: Calendar,
  jirga_decision: Scale,
  match_result: Trophy,
};

export default function CreateAnnouncementScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { matchId } = useLocalSearchParams<{ matchId?: string }>();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();

  const parsedMatchId = matchId ? Number(matchId) : null;
  const { data: match } = useMatchDetail(parsedMatchId || 0);
  const myProfile = useSportsStore((state) => state.registrations['cricket']?.profile);

  const isCaptain = !!(
    myProfile &&
    match &&
    (myProfile.id === match.team_a.captain?.id || myProfile.id === match.team_b.captain?.id)
  );

  const isAuthorized = user?.role === 'admin' || user?.role === 'moderator' || isCaptain;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState<Category>('general');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto pre-fill match details if provided
  useEffect(() => {
    if (match) {
      setCategory('match_result');
      setTitle(`Match Update: ${match.team_a.name} vs ${match.team_b.name}`);

      let summary = '';
      if (match.status === 'completed') {
        if (match.winner_team) {
          summary = `🎉 ${match.winner_team.name} won the match! `;
        } else {
          summary = `Match finished in a tie! `;
        }
        summary += `Final score: ${match.team_a.name} (${match.team_a_score || '0/0'}) vs ${match.team_b.name} (${match.team_b_score || '0/0'}).\n\n`;
      } else {
        summary = `Match is currently ${match.status.toUpperCase()}.\n\n`;
      }
      setContent(summary);
    }
  }, [match]);

  // Check if user has permission
  if (!isAuthorized) {
    return (
      <View style={[styles.safeArea, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
        <View style={styles.accessDeniedContainer}>
          <AlertTriangle size={48} color={theme.colors.danger} style={styles.deniedIcon} />
          <Text style={[styles.deniedTitle, { color: theme.colors.textPrimary }]}>Access Denied</Text>
          <Text style={[styles.deniedSubtitle, { color: theme.colors.textSecondary }]}>
            Only admins and moderators are authorized to create community announcements.
          </Text>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const isValid =
    title.trim().length >= 3 &&
    title.trim().length <= 100 &&
    content.trim().length >= 10 &&
    content.trim().length <= 500;

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'We need access to your photos to upload an announcement image.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleCaptureImage = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'We need camera permissions to capture an announcement image.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error capturing image:', error);
      Alert.alert('Error', 'Failed to capture image');
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
  };

  const handlePost = async () => {
    if (!isValid) return;

    try {
      setIsSubmitting(true);

      // 1. Create the announcement first
      const announcement = await create({
        title: title.trim(),
        content: content.trim(),
        category,
        location: location.trim() ? location.trim() : undefined,
        match_id: parsedMatchId || undefined,
      });

      // 2. Upload image if one was picked
      if (selectedImage) {
        await uploadImage(announcement.id, selectedImage);
      }

      // 3. Invalidate React Query cache to refresh notice feed
      await queryClient.invalidateQueries({
        queryKey: queryKeys.announcements.all,
      });

      // 4. Return to home notice feed
      router.back();
    } catch (error: any) {
      console.error('Error creating announcement:', error);
      Alert.alert('Error', error.message || 'Failed to post announcement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryLabel = (cat: Category) => {
    return cat.charAt(0).toUpperCase() + cat.slice(1).replace('_', ' ');
  };

  const getCharCounterColor = () => {
    const len = content.length;
    if (len >= 480) return theme.colors.dangerText;
    if (len >= 400) return theme.colors.warningText;
    return theme.colors.textSecondary;
  };

  return (
    <View style={[styles.safeArea, { backgroundColor: theme.colors.surface }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.keyboardAvoidingView, { backgroundColor: theme.colors.background }]}
      >
        {/* Header Bar */}
        <View style={[
          styles.headerBar,
          {
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.surface,
            paddingTop: insets.top > 0 ? insets.top + 8 : 12
          }
        ]}>
          <TouchableOpacity onPress={() => router.back()} disabled={isSubmitting} style={styles.headerCancelBtn}>
            <Text style={[styles.headerLink, { color: theme.colors.textSecondary }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>New Announcement</Text>
          <TouchableOpacity
            onPress={handlePost}
            disabled={!isValid || isSubmitting}
            style={[
              styles.postButton,
              {
                backgroundColor: isValid ? theme.colors.primary : theme.colors.border,
                opacity: isSubmitting ? 0.8 : 1
              }
            ]}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={isValid ? theme.colors.onPrimary : theme.colors.textTertiary} />
            ) : (
              <Text
                style={[
                  styles.postButtonText,
                  { color: isValid ? theme.colors.onPrimary : theme.colors.textTertiary }
                ]}
              >
                Post
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Scrollable Body */}
        <ScrollView
          style={[styles.body, { backgroundColor: theme.colors.background }]}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Author info row */}
          <View style={styles.authorRow}>
            <Avatar uri={user?.avatar_url} name={user?.name} size={40} />
            <View style={styles.authorDetails}>
              <Text style={[styles.authorName, { color: theme.colors.textPrimary }]}>
                {user?.name || 'Administrator'}
              </Text>
              <Text style={[styles.authorSubtitle, { color: theme.colors.textSecondary }]}>
                Posting to Pabaini board
              </Text>
            </View>
          </View>

          {/* Card 1: Text Inputs (Title & Content) */}
          <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <TextInput
              style={[styles.titleInput, { color: theme.colors.textPrimary }]}
              placeholder="Title"
              placeholderTextColor={theme.colors.textTertiary}
              value={title}
              onChangeText={setTitle}
              maxLength={100}
              editable={!isSubmitting}
            />
            <View style={[styles.cardDivider, { backgroundColor: theme.colors.border }]} />
            <TextInput
              style={[styles.contentTextArea, { color: theme.colors.textPrimary }]}
              placeholder="Share an announcement with the village..."
              placeholderTextColor={theme.colors.textTertiary}
              value={content}
              onChangeText={setContent}
              multiline
              maxLength={500}
              editable={!isSubmitting}
              textAlignVertical="top"
            />
          </View>

          {/* Card 2: Location Row Card */}
          <View style={[styles.card, styles.rowCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <MapPin size={18} color={theme.colors.primary} />
            <TextInput
              style={[styles.locationInput, { color: theme.colors.textPrimary }]}
              placeholder="Add Location (Optional)"
              placeholderTextColor={theme.colors.textTertiary}
              value={location}
              onChangeText={setLocation}
              maxLength={100}
              editable={!isSubmitting}
            />
            {location.length > 0 && (
              <TouchableOpacity onPress={() => setLocation('')} disabled={isSubmitting} style={styles.clearBtn}>
                <X size={16} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Card 3: Image Picker / Preview Card */}
          <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, padding: 12 }]}>
            {selectedImage ? (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
                <TouchableOpacity
                  style={[styles.removeImageBadge, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}
                  onPress={handleRemoveImage}
                  disabled={isSubmitting}
                >
                  <X size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={handlePickImage}
                disabled={isSubmitting}
                style={[styles.dashedUploadButton, { borderColor: theme.colors.borderStrong }]}
              >
                <ImageIcon size={22} color={theme.colors.primary} />
                <Text style={[styles.uploadButtonText, { color: theme.colors.textSecondary }]}>
                  Add Photo (Optional)
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Card 4: Category Selection Card */}
          <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={[styles.sectionHeading, { color: theme.colors.textSecondary }]}>
              Category
            </Text>
            <View style={styles.chipRow}>
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat;
                const label = getCategoryLabel(cat);
                const IconComponent = CATEGORY_ICONS[cat];

                // Category pill styles for selected state from brand & theme
                let activeBg = theme.colors.primaryLight;
                let activeText = theme.colors.primaryTint;
                let activeBorder = theme.colors.primary;

                if (cat === 'urgent') {
                  activeBg = theme.colors.dangerLight;
                  activeText = theme.colors.dangerText;
                  activeBorder = theme.colors.danger;
                } else if (cat === 'event') {
                  activeBg = theme.colors.infoLight;
                  activeText = theme.colors.infoText;
                  activeBorder = theme.colors.info;
                } else if (cat === 'jirga_decision') {
                  activeBg = theme.colors.warningLight;
                  activeText = theme.colors.warningText;
                  activeBorder = theme.colors.warning;
                }

                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setCategory(cat)}
                    disabled={isSubmitting}
                    style={[
                      styles.categoryChip,
                      isSelected
                        ? {
                            backgroundColor: activeBg,
                            borderColor: activeBorder,
                          }
                        : {
                            backgroundColor: theme.colors.surface,
                            borderColor: theme.colors.border,
                          },
                    ]}
                  >
                    <IconComponent
                      size={15}
                      color={isSelected ? activeText : theme.colors.textTertiary}
                    />
                    <Text
                      style={[
                        styles.chipText,
                        { color: isSelected ? activeText : theme.colors.textSecondary },
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>

        {/* Footer Container */}
        <View
          style={{
            borderTopWidth: 0.5,
            borderTopColor: theme.colors.border,
            backgroundColor: theme.colors.surface,
            paddingBottom: insets.bottom > 0 ? insets.bottom : 12,
          }}
        >
          {/* Footer Toolbar */}
          <View style={[styles.footerToolbar, { borderTopWidth: 0 }]}>
            <View style={styles.toolbarIcons}>
              <TouchableOpacity
                onPress={handlePickImage}
                style={styles.toolbarIconBtn}
                disabled={isSubmitting}
              >
                <ImageIcon size={22} color={theme.colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCaptureImage}
                style={styles.toolbarIconBtn}
                disabled={isSubmitting}
              >
                <Camera size={22} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.charCounter, { color: getCharCounterColor() }]}>
              {content.length}/500
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  headerCancelBtn: {
    paddingVertical: 6,
    paddingRight: 12,
  },
  headerLink: {
    fontSize: 15,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  postButton: {
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 20,
    minWidth: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  body: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  card: {
    borderRadius: 12,
    borderWidth: 0.5,
    padding: 16,
    overflow: 'hidden',
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  cardDivider: {
    height: 0.5,
    marginVertical: 4,
  },
  accessDeniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  deniedIcon: {
    marginBottom: 16,
  },
  deniedTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
  },
  deniedSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  backButton: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 24,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  authorDetails: {
    marginLeft: 10,
    justifyContent: 'center',
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
  },
  authorSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  titleInput: {
    fontSize: 17,
    fontWeight: '600',
    paddingVertical: 8,
  },
  contentTextArea: {
    fontSize: 15,
    lineHeight: 22,
    minHeight: 140,
    paddingVertical: 8,
  },
  locationInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 4,
  },
  clearBtn: {
    padding: 4,
  },
  dashedUploadButton: {
    height: 100,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  uploadButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  imagePreviewContainer: {
    position: 'relative',
    borderRadius: 10,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  removeImageBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  footerToolbar: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  toolbarIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  toolbarIconBtn: {
    padding: 6,
  },
  charCounter: {
    fontSize: 12,
    fontWeight: '500',
  },
});
