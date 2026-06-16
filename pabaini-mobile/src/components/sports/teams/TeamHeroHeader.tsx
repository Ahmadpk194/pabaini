import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../context/ThemeContext';
import { TeamFull } from '../../../types/sports.types';
import { MapPin, Calendar } from 'lucide-react-native';
import { getTeamColor } from './TeamCard';

interface TeamHeroHeaderProps {
  team: TeamFull;
}

export function TeamHeroHeader({ team }: TeamHeroHeaderProps) {
  const { theme } = useTheme();
  const initials = team.name ? team.name.charAt(0).toUpperCase() : '?';
  const fallbackBgColor = getTeamColor(team.name);

  return (
    <LinearGradient
      colors={['#004D26', '#002613']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.headerContainer, { borderBottomLeftRadius: 16, borderBottomRightRadius: 16 }]}
    >
      {/* Decorative Glow */}
      <View style={styles.radialGlow} />

      {/* Logo */}
      <View style={styles.logoContainer}>
        {team.logo_url ? (
          <Image source={{ uri: team.logo_url }} style={styles.logoImage} />
        ) : (
          <View style={[styles.logoFallback, { backgroundColor: fallbackBgColor }]}>
            <Text style={styles.logoFallbackText}>{initials}</Text>
          </View>
        )}
      </View>

      {/* Team Name */}
      <Text style={styles.name}>{team.name}</Text>

      {/* Home Ground */}
      {team.home_ground && (
        <View style={styles.groundRow}>
          <MapPin size={14} color="rgba(255, 255, 255, 0.85)" />
          <Text style={styles.groundText}>{team.home_ground}</Text>
        </View>
      )}

      {/* Founded Year */}
      {team.founded_year && (
        <View style={styles.foundedRow}>
          <Calendar size={13} color="rgba(255, 255, 255, 0.7)" />
          <Text style={styles.foundedText}>Est. {team.founded_year}</Text>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  radialGlow: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  logoContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  logoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  logoFallback: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoFallbackText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
  },
  name: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  groundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  groundText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 14,
    fontWeight: '500',
  },
  foundedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  foundedText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
  },
});
