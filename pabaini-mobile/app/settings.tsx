import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Phone,
  Mail,
  Globe,
  Trophy,
  Shield,
  Bell,
  BellOff,
  ChevronRight,
  Info,
} from 'lucide-react-native';
import { useTheme } from '../src/context/ThemeContext';
import { useAuth } from '../src/hooks/useAuth';

// ─────────────────────────────────────────────────────────────
// SettingsScreen
// Controls what other users can see on your public profile and
// other account-level preferences.
// TODO: wire each toggle/row to a backend PATCH /users/me/settings call.
// ─────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { user } = useAuth();

  // ── Privacy toggles (local state — wire to backend when ready) ──────────
  const [showPhone, setShowPhone] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [showDiaspora, setShowDiaspora] = useState(true);
  const [showCricketStats, setShowCricketStats] = useState(true);
  const [showTeams, setShowTeams] = useState(true);
  const [showJoinedDate, setShowJoinedDate] = useState(true);

  // ── Notification toggles (local state — wire to backend when ready) ─────
  const [notifAnnouncements, setNotifAnnouncements] = useState(true);
  const [notifComments, setNotifComments] = useState(true);
  const [notifLikes, setNotifLikes] = useState(false);
  const [notifTeamUpdates, setNotifTeamUpdates] = useState(true);

  // ── Helpers ──────────────────────────────────────────────────────────────
  const showComingSoon = () => {
    Alert.alert('Coming Soon', 'This setting will be available in a future update.');
  };

  // ── Sub-components ───────────────────────────────────────────────────────
  function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
    return (
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textTertiary }]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.sectionSubtitle, { color: theme.colors.textTertiary }]}>
            {subtitle}
          </Text>
        )}
      </View>
    );
  }

  function ToggleRow({
    icon: Icon,
    label,
    description,
    value,
    onValueChange,
    danger,
  }: {
    icon: React.ComponentType<{ size: number; color: string }>;
    label: string;
    description?: string;
    value: boolean;
    onValueChange: (v: boolean) => void;
    danger?: boolean;
  }) {
    return (
      <View style={[styles.row, { borderBottomColor: theme.colors.border }]}>
        <View style={[styles.rowIconWrap, { backgroundColor: theme.colors.elevated }]}>
          <Icon
            size={16}
            color={danger ? theme.colors.danger : theme.colors.primary}
          />
        </View>
        <View style={styles.rowBody}>
          <Text style={[styles.rowLabel, { color: theme.colors.textPrimary }]}>
            {label}
          </Text>
          {description && (
            <Text style={[styles.rowDesc, { color: theme.colors.textTertiary }]}>
              {description}
            </Text>
          )}
        </View>
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
          thumbColor="#FFFFFF"
          ios_backgroundColor={theme.colors.border}
        />
      </View>
    );
  }

  function TapRow({
    icon: Icon,
    label,
    description,
    onPress,
    valueBadge,
    danger,
  }: {
    icon: React.ComponentType<{ size: number; color: string }>;
    label: string;
    description?: string;
    onPress: () => void;
    valueBadge?: string;
    danger?: boolean;
  }) {
    return (
      <TouchableOpacity
        style={[styles.row, { borderBottomColor: theme.colors.border }]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={[styles.rowIconWrap, { backgroundColor: danger ? `${theme.colors.danger}15` : theme.colors.elevated }]}>
          <Icon
            size={16}
            color={danger ? theme.colors.danger : theme.colors.primary}
          />
        </View>
        <View style={styles.rowBody}>
          <Text style={[styles.rowLabel, { color: danger ? theme.colors.danger : theme.colors.textPrimary }]}>
            {label}
          </Text>
          {description && (
            <Text style={[styles.rowDesc, { color: theme.colors.textTertiary }]}>
              {description}
            </Text>
          )}
        </View>
        {valueBadge ? (
          <Text style={[styles.valueBadge, { color: theme.colors.textTertiary }]}>
            {valueBadge}
          </Text>
        ) : (
          <ChevronRight size={16} color={theme.colors.textTertiary} />
        )}
      </TouchableOpacity>
    );
  }

  function Card({ children }: { children: React.ReactNode }) {
    return (
      <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        {children}
      </View>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top', 'left', 'right']}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ArrowLeft size={22} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
          Settings
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Privacy & Visibility ── */}
        <SectionHeader
          title="PRIVACY & VISIBILITY"
          subtitle="Control what others see on your public profile"
        />
        <Card>
          <ToggleRow
            icon={Phone}
            label="Show phone number"
            description="Other members can see your phone number"
            value={showPhone}
            onValueChange={setShowPhone}
          />
          <ToggleRow
            icon={Mail}
            label="Show email address"
            description="Other members can see your email"
            value={showEmail}
            onValueChange={setShowEmail}
          />
          <ToggleRow
            icon={Globe}
            label="Show diaspora status"
            description="Show whether you live outside Pakistan"
            value={showDiaspora}
            onValueChange={setShowDiaspora}
          />
          <ToggleRow
            icon={Trophy}
            label="Show cricket statistics"
            description="Your batting/bowling stats are visible to others"
            value={showCricketStats}
            onValueChange={setShowCricketStats}
          />
          <ToggleRow
            icon={Shield}
            label="Show team memberships"
            description="Other members can see which teams you're in"
            value={showTeams}
            onValueChange={setShowTeams}
          />
          <ToggleRow
            icon={Eye}
            label="Show joined date"
            description="Display when you joined Pabaini"
            value={showJoinedDate}
            onValueChange={(v) => setShowJoinedDate(v)}
          />
        </Card>

        {/* ── Notifications ── */}
        <SectionHeader
          title="NOTIFICATIONS"
          subtitle="Choose which activity sends you a push notification"
        />
        <Card>
          <ToggleRow
            icon={Bell}
            label="Announcements"
            description="New notices and community announcements"
            value={notifAnnouncements}
            onValueChange={setNotifAnnouncements}
          />
          <ToggleRow
            icon={Bell}
            label="Comments on my posts"
            value={notifComments}
            onValueChange={setNotifComments}
          />
          <ToggleRow
            icon={Bell}
            label="Likes on my posts"
            value={notifLikes}
            onValueChange={setNotifLikes}
          />
          <ToggleRow
            icon={Bell}
            label="Team & match updates"
            description="Invitations, squad changes, match results"
            value={notifTeamUpdates}
            onValueChange={setNotifTeamUpdates}
          />
        </Card>

        {/* ── Account ── */}
        <SectionHeader title="ACCOUNT" />
        <Card>
          <TapRow
            icon={Shield}
            label="Change password"
            description="Update your account password"
            onPress={showComingSoon}
          />
          <TapRow
            icon={Mail}
            label="Account email"
            description={user?.email ?? 'Not set'}
            onPress={showComingSoon}
            valueBadge={user?.email ? undefined : 'Add'}
          />
        </Card>

        {/* ── About ── */}
        <SectionHeader title="ABOUT" />
        <Card>
          <TapRow
            icon={Info}
            label="App version"
            onPress={() => {}}
            valueBadge="v1.0.0"
          />
          <TapRow
            icon={Shield}
            label="Privacy policy"
            onPress={showComingSoon}
          />
        </Card>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  headerRight: {
    width: 30, // balance the back button width
  },

  // Scroll
  scrollContent: {
    paddingTop: 8,
    paddingHorizontal: 16,
  },

  // Section header
  sectionHeader: {
    paddingTop: 20,
    paddingBottom: 8,
    gap: 2,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '400',
  },

  // Card
  card: {
    borderRadius: 12,
    borderWidth: 0.5,
    overflow: 'hidden',
  },

  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 0.5,
    gap: 12,
  },
  rowIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  rowBody: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  rowDesc: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },
  valueBadge: {
    fontSize: 13,
    fontWeight: '500',
  },

  bottomPadding: {
    height: 40,
  },
});
