import React, { useState } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Image as ImageIcon, X, MapPin } from 'lucide-react-native';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/hooks/useAuth';
import { create, uploadImage } from '../../src/api/announcements';
import { Category } from '../../src/types';
import { queryKeys } from '../../src/constants/queryKeys';
import { Avatar } from '../../src/components/ui/Avatar';

const CATEGORIES: Category[] = ['general', 'urgent', 'event', 'jirga_decision'];

export default function CreateAnnouncementScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState<Category>('general');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if user has permission
  if (user?.role !== 'admin' && user?.role !== 'moderator') {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: '#F4F3EF' }]}>
        <View style={styles.accessDeniedContainer}>
          <Text style={[styles.deniedTitle, { color: '#1F4A2E' }]}>Access Denied</Text>
          <Text style={[styles.deniedSubtitle, { color: theme.colors.textSecondary }]}>
            Only admins and moderators are authorized to create community announcements.
          </Text>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: '#1F4A2E' }]}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
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

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: '#F4F3EF' }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        {/* Header Bar */}
        <View style={[styles.headerBar, { borderColor: '#E4E2DC' }]}>
          <TouchableOpacity onPress={() => router.back()} disabled={isSubmitting}>
            <Text style={[styles.headerLink, { color: theme.colors.textSecondary }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: '#1F4A2E' }]}>New Announcement</Text>
          <TouchableOpacity
            onPress={handlePost}
            disabled={!isValid || isSubmitting}
            style={styles.postButtonContainer}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#1F4A2E" />
            ) : (
              <Text
                style={[
                  styles.headerPostText,
                  { color: '#1F4A2E' },
                  (!isValid || isSubmitting) && styles.disabledPostText,
                ]}
              >
                Post
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Scrollable Body */}
        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Author info row */}
          <View style={styles.authorRow}>
            <Avatar uri={user?.avatar_url} name={user?.name} size={42} />
            <View style={styles.authorDetails}>
              <Text style={[styles.authorName, { color: theme.colors.textPrimary }]}>
                {user?.name || 'Administrator'}
              </Text>
              <View style={[styles.categoryBadge, { backgroundColor: '#E4E2DC' }]}>
                <Text style={[styles.categoryBadgeText, { color: '#1F4A2E' }]}>
                  {getCategoryLabel(category)}
                </Text>
              </View>
            </View>
          </View>

          {/* Title Input */}
          <TextInput
            style={[styles.titleInput, { color: theme.colors.textPrimary }]}
            placeholder="Title"
            placeholderTextColor={theme.colors.textSecondary}
            value={title}
            onChangeText={setTitle}
            maxLength={100}
            editable={!isSubmitting}
          />

          {/* Text Area Content */}
          <TextInput
            style={[styles.contentTextArea, { color: theme.colors.textPrimary }]}
            placeholder="Share an announcement with the village..."
            placeholderTextColor={theme.colors.textSecondary}
            value={content}
            onChangeText={setContent}
            multiline
            maxLength={500}
            editable={!isSubmitting}
            textAlignVertical="top"
          />

          {/* Location Input */}
          <View style={[styles.locationSection, { borderBottomColor: theme.colors.border }]}>
            <MapPin size={20} color="#1F4A2E" />
            <TextInput
              style={[styles.locationInput, { color: theme.colors.textPrimary, flex: 1 }]}
              placeholder="Add Location (Optional)"
              placeholderTextColor={theme.colors.textSecondary}
              value={location}
              onChangeText={setLocation}
              maxLength={100}
              editable={!isSubmitting}
            />
          </View>

          {/* Image Selection Area */}
          <View style={styles.imageSection}>
            {selectedImage ? (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
                <TouchableOpacity
                  style={[styles.removeImageBadge, { backgroundColor: 'rgba(0, 0, 0, 0.6)' }]}
                  onPress={handleRemoveImage}
                  disabled={isSubmitting}
                >
                  <X size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={handlePickImage}
                disabled={isSubmitting}
                style={[styles.dashedUploadButton, { borderColor: '#E4E2DC' }]}
              >
                <ImageIcon size={24} color="#1F4A2E" />
                <Text style={[styles.uploadButtonText, { color: theme.colors.textSecondary }]}>
                  Add Photo (Optional)
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Category Selector Section */}
          <View style={styles.categorySection}>
            <Text style={[styles.sectionHeading, { color: theme.colors.textSecondary }]}>
              Category
            </Text>
            <View style={styles.chipRow}>
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat;
                const label = getCategoryLabel(cat);

                // Category pill styles for selected state
                let catStyles = { bg: '#FFFFFF', text: '#666666', border: '#E4E2DC' };
                if (isSelected) {
                  switch (cat) {
                    case 'general':
                      catStyles = { bg: '#1F4A2E', text: '#EAF3DE', border: '#1F4A2E' };
                      break;
                    case 'urgent':
                      catStyles = { bg: '#FCEBEB', text: '#791F1F', border: '#FCEBEB' };
                      break;
                    case 'event':
                      catStyles = { bg: '#E1F5EE', text: '#04342C', border: '#E1F5EE' };
                      break;
                    case 'jirga_decision':
                      catStyles = { bg: '#EAF3DE', text: '#27500A', border: '#EAF3DE' };
                      break;
                  }
                }

                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setCategory(cat)}
                    disabled={isSubmitting}
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor: catStyles.bg,
                        borderColor: catStyles.border,
                      },
                    ]}
                  >
                    <Text style={[styles.chipText, { color: catStyles.text }]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>

        {/* Footer Toolbar */}
        <View style={[styles.footerToolbar, { borderColor: '#E4E2DC', backgroundColor: '#FFFFFF' }]}>
          <View style={styles.toolbarIcons}>
            <TouchableOpacity
              onPress={handlePickImage}
              style={styles.toolbarIconBtn}
              disabled={isSubmitting}
            >
              <ImageIcon size={22} color="#1F4A2E" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleCaptureImage}
              style={styles.toolbarIconBtn}
              disabled={isSubmitting}
            >
              <Camera size={22} color="#1F4A2E" />
            </TouchableOpacity>
          </View>
          <Text style={[styles.charCounter, { color: theme.colors.textSecondary }]}>
            {content.length}/500
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
  },
  headerLink: {
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  postButtonContainer: {
    paddingHorizontal: 8,
  },
  headerPostText: {
    fontSize: 16,
    fontWeight: '700',
  },
  disabledPostText: {
    opacity: 0.4,
  },
  body: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  accessDeniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  deniedTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },
  deniedSubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  authorDetails: {
    marginLeft: 12,
    justifyContent: 'center',
  },
  authorName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  titleInput: {
    fontSize: 18,
    fontWeight: '600',
    paddingVertical: 12,
    borderBottomWidth: 0,
    marginBottom: 12,
  },
  contentTextArea: {
    fontSize: 15,
    lineHeight: 22,
    minHeight: 150,
    paddingVertical: 8,
    borderBottomWidth: 0,
  },
  imageSection: {
    marginVertical: 20,
  },
  dashedUploadButton: {
    height: 120,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
    gap: 8,
  },
  uploadButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  imagePreviewContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
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
  categorySection: {
    marginTop: 12,
    marginBottom: 30,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
    marginLeft: 2,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 0.5,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  footerToolbar: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderTopWidth: 0.5,
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
    fontSize: 13,
    fontWeight: '500',
  },
  locationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 0.5,
    paddingVertical: 10,
    marginBottom: 12,
  },
  locationInput: {
    fontSize: 15,
    paddingVertical: 4,
  },
});
