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
  Platform,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../hooks/useAuth';
import { ImageViewer } from '../ui/ImageViewer';
import {
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Globe,
  Camera,
  Check,
  X,
  LogOut,
  Edit3,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import { PublicUser } from '../../types/profile.types';

let ImagePicker: any = null;
try {
  ImagePicker = require('expo-image-picker');
} catch (error) {
  console.warn('ImagePicker native module not linked:', error);
}

interface GeneralInfoSectionProps {
  user: PublicUser;
  isOwnProfile: boolean;
  isCricketPlayer?: boolean;
}

export function GeneralInfoSection({ user, isOwnProfile, isCricketPlayer }: GeneralInfoSectionProps) {
  const { theme } = useTheme();
  const { user: authUser, logout, updateProfile } = useAuth();
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
  const [showAccountInfo, setShowAccountInfo] = useState(false);

  // Error states
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // Sync state values on profile change or edit toggle
  useEffect(() => {
    if (isOwnProfile && authUser) {
      setName(authUser.name || '');
      setEmail(authUser.email || '');
      setPhone(authUser.phone || '');
      setIsDiaspora(authUser.is_diaspora || false);
      setSelectedImage(null);
      setNameError(null);
      setEmailError(null);
      setPhoneError(null);
    } else if (user) {
      setName(user.name || '');
      setIsDiaspora(user.is_diaspora || false);
      setSelectedImage(null);
    }
  }, [user, authUser, isEditing, isOwnProfile]);

  const handleLogout = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
            router.replace('/(auth)/login');
          } catch (error) {
            console.error('Logout error:', error);
            Alert.alert('Error', 'Failed to log out. Please try again.');
          }
        },
      },
    ]);
  };

  const handlePickImage = async () => {
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

  function formatJoinedDate(dateStr?: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return `Joined ${months[date.getMonth()]} ${date.getFullYear()}`;
  }

  const avatarUri = selectedImage || (isOwnProfile ? authUser?.avatar_url : user?.avatar_url);
  const displayName = isOwnProfile ? (authUser?.name || name) : (user?.name || name);
  const displayVillage = isOwnProfile ? (authUser?.village || 'Pabaini') : (user?.village || 'Pabaini');
  const displayDiaspora = isOwnProfile ? (authUser?.is_diaspora || isDiaspora) : (user?.is_diaspora || false);
  const joinedDate = formatJoinedDate(isOwnProfile ? authUser?.created_at : user?.created_at);

  return (
    <View style={styles.wrapper}>
      {/* ── Hero Banner ─────────────────────────────────────── */}
      <View style={[styles.heroBanner, { backgroundColor: '#004D26' }]}>
        {/* Own-profile action buttons in top-right corner */}
        {isOwnProfile && !isEditing && (
          <View style={styles.heroActions}>
            <TouchableOpacity
              onPress={() => { setIsEditing(true); setShowAccountInfo(true); }}
              style={styles.heroIconBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Edit3 size={18} color="rgba(255,255,255,0.9)" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleLogout}
              style={[styles.heroIconBtn, { marginLeft: 8 }]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <LogOut size={18} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          </View>
        )}

        {/* Avatar */}
        <View style={styles.avatarWrapper}>
          <ImageViewer uri={!isEditing ? avatarUri : null} style={styles.avatarRing}>
            <View style={styles.avatarRing}>
              {avatarUri ? (
                <>
                  <Image
                    source={{ uri: avatarUri }}
                    style={styles.avatarImage}
                    onLoadStart={() => setImageLoading(true)}
                    onLoadEnd={() => setImageLoading(false)}
                  />
                  {imageLoading && (
                    <View style={styles.loadingOverlay}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    </View>
                  )}
                </>
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: '#003D1F' }]}>
                  <Text style={styles.avatarInitials}>
                    {getInitials(displayName || 'User')}
                  </Text>
                </View>
              )}
            </View>
          </ImageViewer>
          {isEditing && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handlePickImage}
              style={styles.cameraBadgeBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <View style={styles.cameraBadge}>
                <Camera size={13} color="#004D26" />
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Name */}
        <Text style={styles.heroName}>{displayName || 'Village Member'}</Text>

        {/* Metadata pills row */}
        <View style={styles.metaRow}>
          <View style={styles.metaPill}>
            <MapPin size={11} color="rgba(255,255,255,0.7)" />
            <Text style={styles.metaPillText}>{displayVillage}</Text>
          </View>
          {displayDiaspora && (
            <View style={styles.metaPill}>
              <Globe size={11} color="rgba(255,255,255,0.7)" />
              <Text style={styles.metaPillText}>Diaspora</Text>
            </View>
          )}
          {isCricketPlayer && (
            <View style={[styles.metaPill, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
              <Text style={styles.metaPillText}>🏏 Player</Text>
            </View>
          )}
          {joinedDate !== '' && (
            <View style={styles.metaPill}>
              <Text style={styles.metaPillText}>{joinedDate}</Text>
            </View>
          )}
        </View>
      </View>

      {/* ── Edit Save/Cancel bar (only when editing) ─────── */}
      {isEditing && (
        <View style={[styles.editBar, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
          <Text style={[styles.editBarTitle, { color: theme.colors.textPrimary }]}>Editing Profile</Text>
          <View style={styles.editBarActions}>
            <TouchableOpacity
              onPress={() => setIsEditing(false)}
              disabled={saving}
              style={[styles.editBarBtn, styles.cancelBarBtn]}
            >
              <X size={15} color="#6b7280" />
              <Text style={styles.cancelBarText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              style={[styles.editBarBtn, styles.saveBarBtn, { opacity: saving ? 0.7 : 1 }]}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Check size={15} color="#FFFFFF" />
                  <Text style={styles.saveBarText}>Save</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── Account Info section (own profile only) ──────── */}
      {isOwnProfile && (
        <View style={[styles.accountSection, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          {/* Collapsible header row */}
          {!isEditing && (
            <TouchableOpacity
              onPress={() => setShowAccountInfo(v => !v)}
              style={styles.accountHeader}
              activeOpacity={0.7}
            >
              <Text style={[styles.accountHeaderTitle, { color: theme.colors.textPrimary }]}>
                Account Information
              </Text>
              {showAccountInfo
                ? <ChevronUp size={18} color={theme.colors.textSecondary} />
                : <ChevronDown size={18} color={theme.colors.textSecondary} />
              }
            </TouchableOpacity>
          )}
          {isEditing && (
            <Text style={[styles.accountHeaderTitle, { color: theme.colors.textPrimary, padding: 16, paddingBottom: 0 }]}>
              Edit Details
            </Text>
          )}

          {(showAccountInfo || isEditing) && (
            <View style={styles.fieldsContainer}>
              {/* Full Name */}
              <View style={[styles.fieldRow, { borderBottomColor: theme.colors.border }]}>
                <UserIcon size={16} color={theme.colors.primary} style={styles.fieldIcon} />
                <View style={styles.fieldBody}>
                  <Text style={styles.fieldLabel}>Full Name</Text>
                  {isEditing ? (
                    <TextInput
                      style={[styles.inputField, nameError ? styles.inputError : null]}
                      value={name}
                      onChangeText={(text) => { setName(text); if (nameError) setNameError(null); }}
                      placeholder="Enter your name"
                      placeholderTextColor="#aaa"
                    />
                  ) : (
                    <Text style={[styles.fieldValue, { color: theme.colors.textPrimary }]}>
                      {authUser?.name || 'Not set'}
                    </Text>
                  )}
                  {isEditing && nameError && <Text style={styles.errorLabel}>{nameError}</Text>}
                </View>
              </View>

              {/* Email */}
              <View style={[styles.fieldRow, { borderBottomColor: theme.colors.border }]}>
                <Mail size={16} color={theme.colors.primary} style={styles.fieldIcon} />
                <View style={styles.fieldBody}>
                  <Text style={styles.fieldLabel}>Email Address</Text>
                  {isEditing ? (
                    <TextInput
                      style={[styles.inputField, emailError ? styles.inputError : null]}
                      value={email}
                      onChangeText={(text) => { setEmail(text); if (emailError) setEmailError(null); }}
                      placeholder="Add email (optional)"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      placeholderTextColor="#aaa"
                    />
                  ) : (
                    <Text style={[
                      styles.fieldValue,
                      { color: authUser?.email ? theme.colors.textPrimary : '#aaa' },
                      !authUser?.email ? styles.placeholderValue : null
                    ]}>
                      {authUser?.email || 'Not set'}
                    </Text>
                  )}
                  {isEditing && emailError && <Text style={styles.errorLabel}>{emailError}</Text>}
                </View>
              </View>

              {/* Phone */}
              <View style={[styles.fieldRow, { borderBottomColor: theme.colors.border }]}>
                <Phone size={16} color={theme.colors.primary} style={styles.fieldIcon} />
                <View style={styles.fieldBody}>
                  <Text style={styles.fieldLabel}>Phone Number</Text>
                  {isEditing ? (
                    <TextInput
                      style={[styles.inputField, phoneError ? styles.inputError : null]}
                      value={phone}
                      onChangeText={(text) => { setPhone(text); if (phoneError) setPhoneError(null); }}
                      placeholder="Add phone (optional)"
                      keyboardType="phone-pad"
                      placeholderTextColor="#aaa"
                    />
                  ) : (
                    <Text style={[
                      styles.fieldValue,
                      { color: authUser?.phone ? theme.colors.textPrimary : '#aaa' },
                      !authUser?.phone ? styles.placeholderValue : null
                    ]}>
                      {authUser?.phone || 'Not set'}
                    </Text>
                  )}
                  {isEditing && phoneError && <Text style={styles.errorLabel}>{phoneError}</Text>}
                </View>
              </View>

              {/* Village (read-only) */}
              <View style={[styles.fieldRow, { borderBottomColor: theme.colors.border }]}>
                <MapPin size={16} color={theme.colors.primary} style={styles.fieldIcon} />
                <View style={styles.fieldBody}>
                  <Text style={styles.fieldLabel}>Origin Village</Text>
                  <Text style={[styles.fieldValue, { color: theme.colors.textPrimary }]}>
                    {authUser?.village || 'Pabaini'}
                  </Text>
                  {isEditing && (
                    <Text style={styles.hintLabel}>Village is non-editable</Text>
                  )}
                </View>
              </View>

              {/* Diaspora */}
              <View style={[styles.fieldRow, { borderBottomWidth: 0 }]}>
                <Globe size={16} color={theme.colors.primary} style={styles.fieldIcon} />
                <View style={[styles.fieldBody, styles.toggleRow]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>Diaspora Residence</Text>
                    <Text style={[styles.fieldValue, { color: theme.colors.textPrimary }]}>
                      I live outside Pakistan
                    </Text>
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
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },

  // ── Hero ──────────────────────────────────────────────
  heroBanner: {
    alignItems: 'center',
    paddingTop: 36,
    paddingBottom: 28,
    paddingHorizontal: 20,
  },
  heroActions: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroIconBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 14,
  },
  avatarRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 30,
    fontWeight: '700',
    color: '#A8D5B5',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  cameraBadgeBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  cameraBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#004D26',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  metaPillText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
  },

  // ── Edit Bar ─────────────────────────────────────────
  editBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
  },
  editBarTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  editBarActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editBarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  cancelBarBtn: {
    backgroundColor: '#F1F1F1',
  },
  saveBarBtn: {
    backgroundColor: '#004D26',
  },
  cancelBarText: {
    color: '#6b7280',
    fontSize: 13,
    fontWeight: '600',
  },
  saveBarText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },

  // ── Account Section ──────────────────────────────────
  accountSection: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 4,
    borderRadius: 12,
    borderWidth: 0.5,
    overflow: 'hidden',
  },
  accountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  accountHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  fieldsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  fieldIcon: {
    marginTop: 2,
    marginRight: 12,
    flexShrink: 0,
  },
  fieldBody: {
    flex: 1,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fieldLabel: {
    fontSize: 11,
    color: '#888',
    marginBottom: 3,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  fieldValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  placeholderValue: {
    fontStyle: 'italic',
    color: '#aaa',
  },
  inputField: {
    height: 38,
    borderWidth: 1,
    borderColor: '#E2E5E2',
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 14,
    backgroundColor: '#FAFBFB',
    color: '#1f2937',
    marginTop: 4,
  },
  inputError: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  errorLabel: {
    fontSize: 10,
    color: '#DC2626',
    marginTop: 3,
  },
  hintLabel: {
    fontSize: 10,
    color: '#aaa',
    marginTop: 3,
    fontStyle: 'italic',
  },
});
