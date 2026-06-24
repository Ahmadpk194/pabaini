import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../context/ThemeContext';
import { TeamFull } from '../../../types/sports.types';
import { MapPin, Calendar, ArrowLeft } from 'lucide-react-native';
import { getTeamColor } from './TeamCard';

interface TeamHeroHeaderProps {
  team: TeamFull;
}

export function TeamHeroHeader({ team }: TeamHeroHeaderProps) {
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const initials = team.name ? team.name.charAt(0).toUpperCase() : '?';
  const fallbackBgColor = getTeamColor(team.name);

  return (
    <LinearGradient
      colors={['#0A4225', '#02180E']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.headerContainer,
        {
          paddingTop: insets.top + 20,
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
        },
      ]}
    >
      {/* Floating Back Button */}
      <TouchableOpacity
        onPress={() => router.back()}
        style={[styles.backButton, { top: insets.top + 8 }]}
        activeOpacity={0.7}
      >
        <ArrowLeft color="#FFFFFF" size={20} />
      </TouchableOpacity>

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

      {/* Info Row (Ground & Founded) */}
      <View style={styles.infoMetaRow}>
        {team.home_ground && (
          <View style={styles.metaBadge}>
            <MapPin size={12} color="rgba(255, 255, 255, 0.9)" />
            <Text style={styles.metaBadgeText}>{team.home_ground}</Text>
          </View>
        )}

        {team.founded_year && (
          <View style={styles.metaBadge}>
            <Calendar size={11} color="rgba(255, 255, 255, 0.9)" />
            <Text style={styles.metaBadgeText}>Est. {team.founded_year}</Text>
          </View>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    paddingBottom: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  radialGlow: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(22, 163, 74, 0.15)',
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
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
    fontSize: 32,
    fontWeight: '700',
  },
  name: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  infoMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  metaBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
});
