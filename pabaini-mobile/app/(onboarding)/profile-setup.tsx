import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Switch,
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
let ImagePicker: any = null;
try {
  ImagePicker = require('expo-image-picker');
} catch (error) {
  console.warn('ImagePicker native module not linked:', error);
}
import { Camera } from 'lucide-react-native';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/hooks/useAuth';
import { Button } from '../../src/components/ui/Button';

export default function ProfileSetupScreen() {
  const { theme } = useTheme();
  const { user, updateProfile } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [isDiaspora, setIsDiaspora] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // Pre-fill if name or avatar exists (e.g. Google Sign-In)
  useEffect(() => {
    if (user) {
      if (user.name) setName(user.name);
      if (user.is_diaspora) setIsDiaspora(user.is_diaspora);
      if (user.email) setEmail(user.email);
      if (user.phone) setPhone(user.phone);
    }
  }, [user]);

  const canSkip = !!user?.name && user.name.trim() !== '';

  const handleSkip = () => {
    if (canSkip) {
      router.replace('/(tabs)');
    } else {
      Alert.alert('Name Required', 'Please add your name to continue.');
    }
  };

  const handlePickImage = async () => {
    try {
      if (!ImagePicker || !ImagePicker.requestMediaLibraryPermissionsAsync) {
        throw new Error('ExponentImagePicker native module not found');
      }

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'We need access to your photos to upload a profile picture.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      })

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert(
        'Feature Unavailable',
        'Image picking requires a native app rebuild. Please rebuild the app using "npm run android" (or "npm run ios") to use this feature.'
      );
    }
  };

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError('Name is required');
      return;
    }
    if (trimmedName.length < 2) {
      setNameError('Name must be at least 2 characters');
      return;
    }
    if (trimmedName.length > 50) {
      setNameError('Name must be less than 50 characters');
      return;
    }

    setEmailError(null);
    setPhoneError(null);

    const trimmedEmail = email.trim();
    if (!user?.email && trimmedEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        setEmailError('Invalid email format');
        return;
      }
    }

    const trimmedPhone = phone.trim();
    if (!user?.phone && trimmedPhone) {
      const phoneRegex = /^\+?[0-9]{10,15}$/;
      if (!phoneRegex.test(trimmedPhone)) {
        setPhoneError('Phone must be 10-15 digits');
        return;
      }
    }

    try {
      setLoading(true);
      setNameError(null);
      await updateProfile(
        trimmedName,
        isDiaspora,
        'Pabaini',
        selectedImage,
        trimmedPhone || undefined,
        trimmedEmail || undefined
      );
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Error saving profile:', error);
      const errorsList = error.response?.data?.errors;
      const apiError = Array.isArray(errorsList)
        ? errorsList.join('\n')
        : (error.response?.data?.message || error.message || 'Failed to complete profile setup');
      Alert.alert('Error Saving Profile', apiError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: '#F4F3EF' }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.headerRow}>
          {canSkip ? (
            <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
              <Text style={[styles.skipText, { color: '#1F4A2E' }]}>Skip for now</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.skipPlaceholder} />
          )}
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={[styles.heading, { color: '#1F4A2E' }]}>Welcome to Pabaini</Text>
            <Text style={[styles.subtext, { color: theme.colors.textSecondary }]}>
              Tell us a bit about yourself to connect with the community
            </Text>
          </View>

          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <TouchableOpacity onPress={handlePickImage} style={styles.avatarContainer}>
              <View style={[styles.avatarCircle, { backgroundColor: '#E4E2DC' }]}>
                {selectedImage || user?.avatar_url ? (
                  <Image
                    source={{ uri: selectedImage || user?.avatar_url || undefined }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Camera size={26} color="#1F4A2E" />
                    <Text style={[styles.avatarPlaceholderText, { color: theme.colors.textSecondary }]}>
                      Add Photo
                    </Text>
                  </View>
                )}
              </View>
              <View style={[styles.cameraBadge, { backgroundColor: '#1F4A2E' }]}>
                <Camera size={12} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Full Name</Text>
              <TextInput
                style={[
                  styles.nameInput,
                  {
                    backgroundColor: '#FFFFFF',
                    borderColor: nameError ? '#D32F2F' : '#E4E2DC',
                    color: theme.colors.textPrimary,
                  },
                ]}
                placeholder="Enter your name"
                placeholderTextColor={theme.colors.textSecondary}
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  if (nameError) setNameError(null);
                }}
                maxLength={50}
              />
              {nameError && (
                <Text style={[styles.errorText, { color: '#D32F2F' }]}>{nameError}</Text>
              )}
            </View>

            {!user?.email && (
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Email Address (Optional)</Text>
                <TextInput
                  style={[
                    styles.nameInput,
                    {
                      backgroundColor: '#FFFFFF',
                      borderColor: emailError ? '#D32F2F' : '#E4E2DC',
                      color: theme.colors.textPrimary,
                    },
                  ]}
                  placeholder="Enter your email address"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (emailError) setEmailError(null);
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {emailError && (
                  <Text style={[styles.errorText, { color: '#D32F2F' }]}>{emailError}</Text>
                )}
              </View>
            )}

            {!user?.phone && (
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Phone Number (Optional)</Text>
                <TextInput
                  style={[
                    styles.nameInput,
                    {
                      backgroundColor: '#FFFFFF',
                      borderColor: phoneError ? '#D32F2F' : '#E4E2DC',
                      color: theme.colors.textPrimary,
                    },
                  ]}
                  placeholder="Enter your phone number (e.g. +923001234567)"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={phone}
                  onChangeText={(text) => {
                    setPhone(text);
                    if (phoneError) setPhoneError(null);
                  }}
                  keyboardType="phone-pad"
                />
                {phoneError && (
                  <Text style={[styles.errorText, { color: '#D32F2F' }]}>{phoneError}</Text>
                )}
              </View>
            )}

            {/* Diaspora Switch */}
            <View style={[styles.toggleContainer, { borderColor: '#E4E2DC' }]}>
              <View style={styles.toggleTextContainer}>
                <Text style={[styles.toggleLabel, { color: theme.colors.textPrimary }]}>
                  I live outside Pakistan
                </Text>
                <Text style={[styles.toggleSubtext, { color: theme.colors.textSecondary }]}>
                  Helps us show you relevant announcements (diaspora filter)
                </Text>
              </View>
              <Switch
                trackColor={{ false: '#E4E2DC', true: '#1F4A2E' }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="#E4E2DC"
                value={isDiaspora}
                onValueChange={setIsDiaspora}
              />
            </View>

            {/* Read-only Village Field */}
            <View style={styles.villageGroup}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Your Village</Text>
              <View style={[styles.villageChip, { backgroundColor: '#E4E2DC', borderColor: '#D0CFC9' }]}>
                <Text style={[styles.villageText, { color: '#1F4A2E' }]}>Pabaini</Text>
                <Text style={[styles.villageSub, { color: theme.colors.textSecondary }]}>
                  (Non-editable)
                </Text>
              </View>
            </View>
          </View>

          {/* Save Button */}
          <View style={styles.actionSection}>
            <Button
              title="Complete Profile"
              onPress={handleSave}
              variant="primary"
              disabled={loading}
              style={{ ...styles.saveButton, backgroundColor: '#1F4A2E' }}
              leftIcon={loading ? <ActivityIndicator color="#FFFFFF" size="small" /> : undefined}
            />
            <Text style={[styles.footerHint, { color: theme.colors.textSecondary }]}>
              You can update this anytime in your profile
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  headerRow: {
    height: 48,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  skipPlaceholder: {
    height: 32,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 8,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  avatarSection: {
    marginBottom: 32,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    elevation: 3,
  },
  form: {
    width: '100%',
    marginBottom: 36,
  },
  inputGroup: {
    marginBottom: 20,
    width: '100%',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  nameInput: {
    height: 48,
    borderRadius: 24,
    borderWidth: 0.5,
    paddingHorizontal: 20,
    fontSize: 16,
  },
  errorText: {
    fontSize: 12,
    marginTop: 6,
    marginLeft: 16,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 0.5,
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 24,
  },
  toggleTextContainer: {
    flex: 1,
    paddingRight: 16,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  toggleSubtext: {
    fontSize: 11,
    lineHeight: 15,
  },
  villageGroup: {
    width: '100%',
  },
  villageChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 0.5,
  },
  villageText: {
    fontSize: 16,
    fontWeight: '700',
    marginRight: 6,
  },
  villageSub: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  actionSection: {
    width: '100%',
    alignItems: 'center',
  },
  saveButton: {
    width: '100%',
    borderRadius: 24,
    height: 50,
    marginBottom: 16,
  },
  footerHint: {
    fontSize: 12,
    textAlign: 'center',
  },
});
