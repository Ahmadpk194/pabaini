import React from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../context/ThemeContext';
import { CricketPlayerProfile } from '../../../types/sports.types';
import { Avatar } from '../../ui/Avatar';

interface CricketPlayerCardProps {
  profile: CricketPlayerProfile;
  onPress?: () => void;
}

const ROLE_LABELS: Record<string, string> = {
  batsman: 'Batsman',
  bowler: 'Bowler',
  allrounder: 'All-rounder',
  keeper: 'Wicket-keeper',
};

export function CricketPlayerCard({ profile, onPress }: CricketPlayerCardProps) {
  const { theme } = useTheme();
  const { role, batting_hand, bowling_arm, bowling_type, user } = profile;

  // Format styles nicely
  const battingText = `${batting_hand === 'right' ? 'Right' : 'Left'}-hand bat`;

  let bowlingText = 'No Bowling';
  if (bowling_arm && bowling_arm !== 'none' && bowling_type && bowling_type !== 'none') {
    const arm = bowling_arm === 'right' ? 'Right-arm' : 'Left-arm';
    const type = bowling_type.charAt(0).toUpperCase() + bowling_type.slice(1);
    bowlingText = `${arm} ${type}`;
  }

  // Define static stats depending on the player's role
  let stats: { label: string; value: string | number }[] = [];
  switch (role) {
    case 'batsman':
      stats = [
        { label: 'MATCHES', value: 0 },
        { label: 'RUNS', value: 0 },
        { label: 'AVERAGE', value: '0.00' },
        { label: 'STRIKE RATE', value: '0.0' },
      ];
      break;
    case 'bowler':
      stats = [
        { label: 'MATCHES', value: 0 },
        { label: 'WICKETS', value: 0 },
        { label: 'ECONOMY', value: '0.00' },
        { label: 'AVERAGE', value: '0.00' },
      ];
      break;
    case 'allrounder':
      stats = [
        { label: 'MATCHES', value: 0 },
        { label: 'RUNS', value: 0 },
        { label: 'WICKETS', value: 0 },
        { label: 'STRIKE RATE', value: '0.0' },
      ];
      break;
    case 'keeper':
      stats = [
        { label: 'MATCHES', value: 0 },
        { label: 'RUNS', value: 0 },
        { label: 'CATCHES', value: 0 },
        { label: 'STUMPINGS', value: 0 },
      ];
      break;
    default:
      stats = [
        { label: 'MATCHES', value: 0 },
        { label: 'RUNS', value: 0 },
        { label: 'WICKETS', value: 0 },
        { label: 'CATCHES', value: 0 },
      ];
  }

  const cardContent = (
    <LinearGradient
      colors={['#004D26', '#002613']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, { borderRadius: theme.radius.lg }]}
    >
      {/* Decorative Glow */}
      <View style={styles.radialGlow} />

      {/* Card Header: Avatar & Info */}
      <View style={styles.header}>
        <Avatar uri={user.avatar_url} size={54} name={user.name} />

        <View style={styles.headerTextContainer}>
          <Text style={styles.name} numberOfLines={1}>
            {user.name}
          </Text>
          <View style={[styles.roleBadge, { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]}>
            <Text style={styles.roleText}>{ROLE_LABELS[role]?.toUpperCase() || 'PLAYER'}</Text>
          </View>
        </View>

        {/* Cricket Icon Watermark */}
        <Text style={styles.watermarkIcon}>🏏</Text>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Styles details (Batting / Bowling details) */}
      <View style={styles.stylesContainer}>
        <View style={styles.styleColumn}>
          <Text style={styles.styleLabel}>BATTING</Text>
          <Text style={styles.styleValue}>{battingText}</Text>
        </View>
        <View style={[styles.styleColumn, styles.borderLeft]}>
          <Text style={styles.styleLabel}>BOWLING</Text>
          <Text style={styles.styleValue}>{bowlingText}</Text>
        </View>
      </View>

      <View style={styles.statsContainer}>
        {stats.map((stat, index) => (
          <View key={stat.label} style={styles.statBox}>
            <Text style={styles.statLabel}>{stat.label}</Text>
            <Text style={styles.statValue}>{stat.value}</Text>
          </View>
        ))}
      </View>
    </LinearGradient>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
        {cardContent}
      </TouchableOpacity>
    );
  }

  return cardContent;
}

const styles = StyleSheet.create({
  card: {
    padding: 18,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
    overflow: 'hidden',
    marginVertical: 6,
  },
  radialGlow: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  headerTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  name: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 5,
    letterSpacing: 0.2,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  roleText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  watermarkIcon: {
    fontSize: 38,
    opacity: 0.1,
    position: 'absolute',
    right: 0,
    top: -8,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 12,
  },
  stylesContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  styleColumn: {
    flex: 1,
  },
  borderLeft: {
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.1)',
    paddingLeft: 16,
  },
  styleLabel: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  styleValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 7,
    paddingVertical: 9,
    paddingHorizontal: 4,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.4,
    marginBottom: 3,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
