/**
 * AppDrawer — Global overlay sidebar
 *
 * Works like Facebook's left drawer — can be added to any screen header.
 * Uses Modal so it overlays any screen without affecting navigation stack.
 *
 * HOW TO ADD TO ANY SCREEN IN 4 STEPS:
 * 1. import AppDrawer from '@/components/common/AppDrawer'
 * 2. const [isDrawerOpen, setIsDrawerOpen] = useState(false)
 * 3. Add hamburger icon in header: onPress={() => setIsDrawerOpen(true)}
 *    Icon: three horizontal lines (AlignLeft or Menu), 36px circular touch target
 * 4. Add at root of screen JSX (outside ScrollView):
 *    <AppDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
 *
 * To add new navigation items: add a row in the Quick Navigation section
 * calling navigateTo('/your-path') — no other changes needed.
 */

import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Easing,
  Dimensions,
  Alert,
  Image,
  BackHandler,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  Sun,
  Moon,
  Smartphone,
  LogOut,
  ChevronRight,
  Trophy,
  Settings,
  Bell,
  User,
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../hooks/useAuth';

// ── Constants ────────────────────────────────────────────────────────────────
const SCREEN_WIDTH = Dimensions.get('window').width;
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.82, 320);

// ── Types ────────────────────────────────────────────────────────────────────
interface AppDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

type ColorSchemeOption = 'light' | 'dark' | 'system';

// ── Helpers ──────────────────────────────────────────────────────────────────
function getInitials(name: string): string {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return 'P';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function AppDrawer({ isOpen, onClose }: AppDrawerProps) {
  const { theme, colorScheme, setColorScheme } = useTheme();
  const { user, logout } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // ── Animation refs ─────────────────────────────────────────────────────────
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  // ── Open / close animations ────────────────────────────────────────────────
  const openDrawer = useCallback(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 280,
        easing: Easing.out(Easing.poly(4)),
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 0.5,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start();
  }, [slideAnim, backdropAnim]);

  const closeDrawer = useCallback(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -DRAWER_WIDTH,
        duration: 260,
        easing: Easing.in(Easing.bezier(0.25, 0.46, 0.45, 0.94)),
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }),
    ]).start(() => onClose()); // onClose called ONLY after animation completes
  }, [slideAnim, backdropAnim, onClose]);

  // ── Modal show handler — fires AFTER modal is fully mounted/rendered ─────────
  // This is the correct place to start the open animation.
  // Using useEffect on isOpen caused the animation to start before the modal
  // was visible, creating a janky first frame.
  const handleModalShow = useCallback(() => {
    // Reset to start position in case of re-open
    slideAnim.setValue(-DRAWER_WIDTH);
    backdropAnim.setValue(0);
    openDrawer();
  }, [slideAnim, backdropAnim, openDrawer]);

  // ── Android hardware back button ───────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      closeDrawer();
      return true; // Prevent default back navigation
    });
    return () => handler.remove();
  }, [isOpen, closeDrawer]);

  // ── Navigation helper ──────────────────────────────────────────────────────
  const navigateTo = (path: string) => {
    closeDrawer();
    // Wait for close animation to finish before navigating
    setTimeout(() => router.push(path as Parameters<typeof router.push>[0]), 320);
  };

  // ── Sign out ───────────────────────────────────────────────────────────────
  const handleSignOut = () => {
    Alert.alert(
      'Sign out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign out',
          style: 'destructive',
          onPress: async () => {
            closeDrawer();
            try {
              await logout();
              setTimeout(() => router.replace('/(auth)/login'), 320);
            } catch (err) {
              console.error('Sign out error:', err);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  // ── User data ──────────────────────────────────────────────────────────────
  const displayName = user?.name ?? 'Pabaini Member';
  const displayVillage = user?.village ?? 'Pabaini';
  const avatarUri = user?.avatar_url ?? null;
  const userRole = user?.role ?? 'resident';

  // ── Appearance options ─────────────────────────────────────────────────────
  const schemeOptions: {
    key: ColorSchemeOption;
    label: string;
    Icon: React.ComponentType<{ size: number; color: string }>;
  }[] = [
    { key: 'light', label: 'Light', Icon: Sun },
    { key: 'dark', label: 'Dark', Icon: Moon },
    { key: 'system', label: 'System', Icon: Smartphone },
  ];

  // ── Navigation rows ────────────────────────────────────────────────────────
  const navRows: {
    label: string;
    Icon: React.ComponentType<{ size: number; color: string }>;
    onPress: () => void;
  }[] = [
    {
      label: 'Sports & Cricket',
      Icon: Trophy,
      onPress: () => navigateTo('/(tabs)/sports'),
    },
    {
      label: 'Settings',
      Icon: Settings,
      onPress: () => navigateTo('/settings'), // placeholder — screen not yet built
    },
    {
      label: 'Notifications',
      Icon: Bell,
      onPress: () => navigateTo('/notifications'),
    },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={closeDrawer}
      onShow={handleModalShow}
    >
      <View style={styles.overlay}>
        {/* ── Backdrop ── */}
        <TouchableWithoutFeedback onPress={closeDrawer}>
          <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]} />
        </TouchableWithoutFeedback>

        {/* ── Drawer panel ── */}
        <Animated.View
          style={[
            styles.drawer,
            {
              backgroundColor: theme.colors.surface,
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          {/* ── 1. User identity card ── */}
          <TouchableOpacity
            onPress={() => navigateTo('/(tabs)/profile')}
            activeOpacity={0.85}
            style={[
              styles.identityCard,
              {
                backgroundColor: theme.colors.primaryTint,
                paddingTop: insets.top + 16,
              },
            ]}
          >
            {/* Avatar */}
            <View style={styles.avatarWrap}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
              ) : (
                <View
                  style={[
                    styles.avatarFallback,
                    { backgroundColor: theme.colors.primaryLight },
                  ]}
                >
                  <Text style={[styles.avatarInitials, { color: theme.colors.primaryTint }]}>
                    {getInitials(displayName)}
                  </Text>
                </View>
              )}
            </View>

            {/* Name + meta */}
            <View style={styles.identityText}>
              <Text style={styles.identityName} numberOfLines={1}>
                {displayName}
              </Text>
              <Text style={styles.identityMeta} numberOfLines={1}>
                {userRole !== 'resident'
                  ? `${userRole.charAt(0).toUpperCase() + userRole.slice(1)} · `
                  : ''}
                {displayVillage}
              </Text>
            </View>

            {/* Chevron */}
            <ChevronRight size={16} color="rgba(255,255,255,0.5)" style={styles.identityChevron} />
          </TouchableOpacity>

          {/* Separator */}
          <View style={[styles.identitySep, { backgroundColor: 'rgba(255,255,255,0.15)' }]} />

          {/* ── 2. Quick navigation ── */}
          <View style={[styles.navSection, { backgroundColor: theme.colors.surface }]}>
            {navRows.map(({ label, Icon, onPress }) => (
              <TouchableOpacity
                key={label}
                style={styles.navRow}
                onPress={onPress}
                activeOpacity={0.7}
              >
                <Icon size={20} color={theme.colors.textSecondary} />
                <Text style={[styles.navLabel, { color: theme.colors.textPrimary }]}>
                  {label}
                </Text>
                <ChevronRight size={16} color={theme.colors.textTertiary} />
              </TouchableOpacity>
            ))}
          </View>

          {/* Thin section separator */}
          <View style={[styles.sectionSep, { backgroundColor: theme.colors.border }]} />

          {/* ── 3. Appearance ── */}
          <View style={{ backgroundColor: theme.colors.surface }}>
            <Text style={[styles.sectionLabel, { color: theme.colors.textTertiary }]}>
              APPEARANCE
            </Text>
            <View style={styles.schemeRow}>
              {schemeOptions.map(({ key, label, Icon }) => {
                const active = colorScheme === key;
                return (
                  <TouchableOpacity
                    key={key}
                    onPress={() => setColorScheme(key)}
                    style={[
                      styles.schemeCard,
                      {
                        backgroundColor: active
                          ? theme.colors.primary
                          : theme.colors.elevated,
                        borderColor: active
                          ? theme.colors.primary
                          : theme.colors.border,
                      },
                    ]}
                    activeOpacity={0.75}
                  >
                    <Icon
                      size={18}
                      color={active ? '#FFFFFF' : theme.colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.schemeLabel,
                        {
                          color: active ? '#FFFFFF' : theme.colors.textSecondary,
                        },
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ── 4. Divider ── */}
          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

          {/* ── 5. Sign out ── spacer pushes it to the bottom ── */}
          <View style={styles.signOutSection}>
            <TouchableOpacity
              style={[
                styles.signOutBtn,
                { backgroundColor: `${theme.colors.danger}12`, borderColor: `${theme.colors.danger}30` },
              ]}
              onPress={handleSignOut}
              activeOpacity={0.8}
            >
              <LogOut size={17} color={theme.colors.danger} />
              <Text style={[styles.signOutLabel, { color: theme.colors.danger }]}>
                Sign out
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── 6. Bottom safe area ── */}
          <View style={{ paddingBottom: insets.bottom + 12 }} />
        </Animated.View>
      </View>
    </Modal>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#000000',
  },

  // Drawer panel
  drawer: {
    width: DRAWER_WIDTH,
    height: '100%',
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 6, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    // Flat right edge — comes from left wall
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },

  // Identity card
  identityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  avatarWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
    flexShrink: 0,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 20,
    fontWeight: '700',
  },
  identityText: {
    flex: 1,
    gap: 3,
  },
  identityName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  identityMeta: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '400',
  },
  identityChevron: {
    flexShrink: 0,
  },
  identitySep: {
    height: 1,
  },

  // Navigation rows
  navSection: {
    paddingVertical: 6,
  },
  navRow: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 14,
  },
  navLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },

  sectionSep: {
    height: 0.5,
    marginHorizontal: 0,
  },

  // Appearance
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
    textTransform: 'uppercase',
  },
  schemeRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    gap: 8,
    marginBottom: 16,
  },
  schemeCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
  },
  schemeLabel: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Divider
  divider: {
    height: 0.5,
    marginHorizontal: 20,
  },

  // Sign out
  signOutSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
  },
  signOutLabel: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
});
