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
        <Avatar uri={user.avatar_url} size={70} name={user.name} />
        
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

      {/* Stats Table */}
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
    padding: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    position: 'relative',
    overflow: 'hidden',
    marginVertical: 10,
  },
  radialGlow: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  headerTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  name: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  roleText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  watermarkIcon: {
    fontSize: 50,
    opacity: 0.12,
    position: 'absolute',
    right: 0,
    top: -10,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 18,
  },
  stylesContainer: {
    flexDirection: 'row',
    marginBottom: 18,
  },
  styleColumn: {
    flex: 1,
  },
  borderLeft: {
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.1)',
    paddingLeft: 20,
  },
  styleLabel: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 4,
  },
  styleValue: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
