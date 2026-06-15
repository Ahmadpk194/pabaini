import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter } from 'expo-router';

import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/hooks/useAuth';
import { Button } from '../../src/components/ui/Button';
import { LinearGradient } from 'expo-linear-gradient';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  Shield,
  Edit3,
  LogOut,
  Camera,
  Check,
  X,
} from 'lucide-react-native';

import { ImageViewer } from '../../src/components/ui/ImageViewer';

let ImagePicker: any = null;
try {
  ImagePicker = require('expo-image-picker');
} catch (error) {
  console.warn('ImagePicker native module not linked:', error);
}

export default function ProfileScreen() {
  const { theme } = useTheme();
  const { user, isGuest, logout, updateProfile } = useAuth();
  const router = useRouter();

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isDiaspora, setIsDiaspora] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Error states
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // Sync state values on profile change or edit toggle
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setIsDiaspora(user.is_diaspora || false);
      setSelectedImage(null);
      setNameError(null);
      setEmailError(null);
      setPhoneError(null);
    }
  }, [user, isEditing]);

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to log out. Please try again.');
    }
  };

  const handlePickImage = async () => {
    if (!isEditing) return;
    try {
      if (!ImagePicker || !ImagePicker.requestMediaLibraryPermissionsAsync) {
        throw new Error('ImagePicker modules not available');
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
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking profile image:', error);
      Alert.alert(
        'Feature Unavailable',
        'Image selection requires a native build. Make sure the app is running in development client mode.'
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

    setNameError(null);
    setEmailError(null);
    setPhoneError(null);

    const trimmedEmail = email.trim();
    if (trimmedEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        setEmailError('Invalid email format');
        return;
      }
    }

    const trimmedPhone = phone.trim();
    if (trimmedPhone) {
      const phoneRegex = /^\+?[0-9]{10,15}$/;
      if (!phoneRegex.test(trimmedPhone)) {
        setPhoneError('Phone must be 10-15 digits');
        return;
      }
    }

    try {
      setSaving(true);
      await updateProfile(
        trimmedName,
        isDiaspora,
        'Pabaini',
        selectedImage,
        trimmedPhone || undefined,
        trimmedEmail || undefined
      );
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error: any) {
      console.error('Profile update failed:', error);
      const errorsList = error.response?.data?.errors;
      const apiError = Array.isArray(errorsList)
        ? errorsList.join('\n')
        : (error.response?.data?.message || error.message || 'Failed to update profile details');
      Alert.alert('Update Failed', apiError);
    } finally {
      setSaving(false);
    }
  };

  function getInitials(nameString: string): string {
    const parts = nameString.trim().split(' ');
    if (parts.length === 0 || !parts[0]) return 'P';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  if (isGuest) {
    return (
      <View style={[styles.container, { backgroundColor: '#F4F3EF' }]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.guestCard}>
            <Globe size={48} color="#004D26" style={styles.guestIcon} />
            <Text style={[styles.guestTitle, { color: '#004D26' }]}>Guest Mode</Text>
            <Text style={[styles.guestSubtitle, { color: theme.colors.textSecondary }]}>
              You are currently browsing the Pabaini notice feed as a guest. Sign in to post updates, like notices, and configure messaging targets.
            </Text>
            <Button
              title="Log In / Sign Up"
              onPress={() => router.replace('/(auth)/login')}
              variant="primary"
              style={{ ...styles.guestButton, backgroundColor: '#004D26' }}
            />
          </View>
        </ScrollView>
      </View>
    );
  }

  const roleLabels: Record<string, string> = {
    admin: 'Administrator',
    moderator: 'Moderator',
    resident: 'Resident Member',
  };

  return (
    <View style={[styles.container, { backgroundColor: '#F4F3EF' }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Elegant LinearGradient Card Header */}
          <LinearGradient
            colors={['#004D26', '#1F4A2E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerCard}
          >
            <TouchableOpacity
              activeOpacity={isEditing ? 0.8 : 1}
              onPress={handlePickImage}
              style={styles.avatarWrapper}
            >
              <View style={styles.avatarBorder}>
                {selectedImage || user?.avatar_url ? (
                  <ImageViewer 
                    uri={!isEditing ? (selectedImage || user?.avatar_url) : null}
                    style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}
                  >
                    <Image
                      source={{ uri: selectedImage || user?.avatar_url || undefined }}
                      style={styles.avatarImage}
                      onLoadStart={() => setImageLoading(true)}
                      onLoadEnd={() => setImageLoading(false)}
                    />
                    {imageLoading && (
                      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      </View>
                    )}
                  </ImageViewer>
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarInitials}>
                      {getInitials(name || user?.name || 'User')}
                    </Text>
                  </View>
                )}
              </View>
              {isEditing && (
                <View style={styles.cameraBadge}>
                  <Camera size={14} color="#004D26" />
                </View>
              )}
            </TouchableOpacity>

            <Text style={styles.profileName}>{name || user?.name || 'Village Member'}</Text>
            
            <View style={styles.tagContainer}>
              <View style={styles.roleTag}>
                <Shield size={12} color="#EAF3DE" style={styles.tagIcon} />
                <Text style={styles.roleTagText}>
                  {roleLabels[user?.role || 'resident']}
                </Text>
              </View>

              {isDiaspora && (
                <View style={[styles.roleTag, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                  <Globe size={12} color="#EAF3DE" style={styles.tagIcon} />
                  <Text style={styles.roleTagText}>Diaspora</Text>
                </View>
              )}
            </View>
          </LinearGradient>

          {/* Details Content Card */}
          <View style={styles.detailsCard}>
            <Text style={[styles.detailsTitle, { color: '#004D26' }]}>
              {isEditing ? 'Edit Profile Details' : 'Account Information'}
            </Text>

            {/* Field: Full Name */}
            <View style={styles.fieldRow}>
              <View style={styles.fieldIconCol}>
                <User size={18} color="#004D26" />
              </View>
              <View style={styles.fieldValueCol}>
                <Text style={styles.fieldLabel}>Full Name</Text>
                {isEditing ? (
                  <TextInput
                    style={[styles.inputField, nameError ? styles.inputError : null]}
                    value={name}
                    onChangeText={(text) => {
                      setName(text);
                      if (nameError) setNameError(null);
                    }}
                    placeholder="Enter your name"
                  />
                ) : (
                  <Text style={styles.fieldValue}>{user?.name || 'Not set'}</Text>
                )}
                {isEditing && nameError && <Text style={styles.errorLabel}>{nameError}</Text>}
              </View>
            </View>

            {/* Field: Email */}
            <View style={styles.fieldRow}>
              <View style={styles.fieldIconCol}>
                <Mail size={18} color="#004D26" />
              </View>
              <View style={styles.fieldValueCol}>
                <Text style={styles.fieldLabel}>Email Address</Text>
                {isEditing ? (
                  <TextInput
                    style={[styles.inputField, emailError ? styles.inputError : null]}
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (emailError) setEmailError(null);
                    }}
                    placeholder="Add an email (optional)"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                ) : (
                  <Text style={[styles.fieldValue, !user?.email ? styles.placeholderValue : null]}>
                    {user?.email || 'No email address registered'}
                  </Text>
                )}
                {isEditing && emailError && <Text style={styles.errorLabel}>{emailError}</Text>}
              </View>
            </View>

            {/* Field: Phone */}
            <View style={styles.fieldRow}>
              <View style={styles.fieldIconCol}>
                <Phone size={18} color="#004D26" />
              </View>
              <View style={styles.fieldValueCol}>
                <Text style={styles.fieldLabel}>Phone Number</Text>
                {isEditing ? (
                  <TextInput
                    style={[styles.inputField, phoneError ? styles.inputError : null]}
                    value={phone}
                    onChangeText={(text) => {
                      setPhone(text);
                      if (phoneError) setPhoneError(null);
                    }}
                    placeholder="Add a phone number (optional)"
                    keyboardType="phone-pad"
                  />
                ) : (
                  <Text style={[styles.fieldValue, !user?.phone ? styles.placeholderValue : null]}>
                    {user?.phone || 'No phone number registered'}
                  </Text>
                )}
                {isEditing && phoneError && <Text style={styles.errorLabel}>{phoneError}</Text>}
              </View>
            </View>

            {/* Field: Village */}
            <View style={styles.fieldRow}>
              <View style={styles.fieldIconCol}>
                <MapPin size={18} color="#004D26" />
              </View>
              <View style={styles.fieldValueCol}>
                <Text style={styles.fieldLabel}>Origin Village</Text>
                <Text style={styles.fieldValue}>{user?.village || 'Pabaini'}</Text>
                {isEditing && (
                  <Text style={styles.villageHint}>Origin village is non-editable.</Text>
                )}
              </View>
            </View>

            {/* Field: Diaspora Toggle */}
            <View style={[styles.fieldRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
              <View style={styles.fieldIconCol}>
                <Globe size={18} color="#004D26" />
              </View>
              <View style={styles.fieldValueCol}>
                <View style={styles.diasporaToggleRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>Diaspora Residence</Text>
                    <Text style={styles.diasporaDesc}>I live outside Pakistan</Text>
                  </View>
                  <Switch
                    trackColor={{ false: '#E2E5E2', true: '#004D26' }}
                    thumbColor="#FFFFFF"
                    ios_backgroundColor="#E2E5E2"
                    value={isDiaspora}
                    onValueChange={setIsDiaspora}
                    disabled={!isEditing}
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Action Row Buttons */}
          <View style={styles.buttonContainer}>
            {isEditing ? (
              <View style={styles.editButtonsRow}>
                <TouchableOpacity
                  onPress={handleSave}
                  disabled={saving}
                  style={[styles.actionButton, styles.saveBtn, { opacity: saving ? 0.7 : 1 }]}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Check size={16} color="#FFFFFF" style={styles.btnIcon} />
                      <Text style={styles.saveBtnText}>Save Changes</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setIsEditing(false)}
                  disabled={saving}
                  style={[styles.actionButton, styles.cancelBtn]}
                >
                  <X size={16} color="#4b5563" style={styles.btnIcon} />
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Button
                  title="Edit Profile Details"
                  onPress={() => setIsEditing(true)}
                  variant="primary"
                  style={styles.primaryButton}
                  leftIcon={<Edit3 size={16} color="#FFFFFF" style={{ marginRight: 8 }} />}
                />

                <TouchableOpacity onPress={handleLogout} style={styles.logoutLink}>
                  <LogOut size={16} color="#DC2626" style={{ marginRight: 6 }} />
                  <Text style={styles.logoutText}>Log Out Account</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
          
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  headerCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 14,
  },
  avatarBorder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#EAF3DE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 28,
    fontWeight: '700',
    color: '#004D26',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#EAF3DE',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#004D26',
    elevation: 3,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  tagContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  roleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  tagIcon: {
    marginRight: 4,
  },
  roleTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 0.5,
    borderColor: '#E2E5E2',
    marginBottom: 20,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 18,
  },
  fieldRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E2E5E2',
    paddingBottom: 14,
    marginBottom: 14,
  },
  fieldIconCol: {
    width: 32,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  fieldValueCol: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1f2937',
  },
  placeholderValue: {
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  inputField: {
    height: 40,
    borderWidth: 0.5,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    backgroundColor: '#FAFBFB',
    color: '#1f2937',
    marginTop: 2,
  },
  inputError: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  errorLabel: {
    fontSize: 11,
    color: '#DC2626',
    marginTop: 4,
  },
  villageHint: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 4,
    fontStyle: 'italic',
  },
  diasporaToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  diasporaDesc: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  primaryButton: {
    width: '100%',
    height: 48,
    paddingVertical: 0,
    borderRadius: 24,
    backgroundColor: '#004D26',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoutLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
  },
  editButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  actionButton: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtn: {
    backgroundColor: '#004D26',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  cancelBtn: {
    backgroundColor: '#E2E5E2',
    borderWidth: 0.5,
    borderColor: '#C0C3C0',
  },
  cancelBtnText: {
    color: '#4b5563',
    fontWeight: '600',
    fontSize: 14,
  },
  btnIcon: {
    marginRight: 6,
  },
  guestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#E2E5E2',
    marginTop: 40,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  guestIcon: {
    marginBottom: 16,
    opacity: 0.8,
  },
  guestTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
  },
  guestSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  guestButton: {
    width: '100%',
    height: 46,
    paddingVertical: 0,
    borderRadius: 23,
  },
});
