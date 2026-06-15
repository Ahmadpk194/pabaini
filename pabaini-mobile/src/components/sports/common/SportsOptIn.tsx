import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../context/ThemeContext';
import { LucideIcon, Trophy, Calendar, Users, ChevronRight } from 'lucide-react-native';

interface SportsOptInProps {
  onRegisterCricket: () => void;
  onJustBrowsing: () => void;
}

const { width, height } = Dimensions.get('window');

export function SportsOptIn({ onRegisterCricket, onJustBrowsing }: SportsOptInProps) {
  const { theme } = useTheme();

  return (
    <LinearGradient
      colors={['#004D26', '#00200F']}
      style={styles.container}
    >
      {/* Radial Glows */}
      <View style={[styles.glow, styles.glowTopLeft]} />
      <View style={[styles.glow, styles.glowBottomRight]} />

      <View style={styles.content}>
        {/* Animated-like Header Icon Group */}
        <View style={styles.iconContainer}>
          <View style={[styles.circleIcon, { backgroundColor: 'rgba(255, 255, 255, 0.08)' }]}>
            <Text style={styles.sportEmoji}>🏏</Text>
          </View>
          <View style={[styles.circleIcon, styles.mainIcon, { backgroundColor: theme.colors.primary }]}>
            <Trophy color="#FFFFFF" size={32} />
          </View>
          <View style={[styles.circleIcon, { backgroundColor: 'rgba(255, 255, 255, 0.08)' }]}>
            <Text style={styles.sportEmoji}>⚽</Text>
          </View>
        </View>

        {/* Title & Description */}
        <Text style={styles.title}>Pabaini Sports</Text>
        <Text style={styles.subtitle}>
          Connect with local players, join village teams, track schedules, and view live tournament leaderboards.
        </Text>

        {/* Feature Highlights */}
        <View style={styles.featuresList}>
          <View style={styles.featureItem}>
            <View style={styles.featureIconBox}>
              <Users color="#FFFFFF" size={20} />
            </View>
            <View style={styles.featureTextBox}>
              <Text style={styles.featureTitle}>Player Profiles</Text>
              <Text style={styles.featureDesc}>Create your cricket identity and showcase batting/bowling styles.</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIconBox}>
              <Calendar color="#FFFFFF" size={20} />
            </View>
            <View style={styles.featureTextBox}>
              <Text style={styles.featureTitle}>Tournaments & Matches</Text>
              <Text style={styles.featureDesc}>Stay updated on upcoming matches and results in the village.</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: '#FFFFFF' }]}
            onPress={onRegisterCricket}
            activeOpacity={0.85}
          >
            <Text style={[styles.primaryButtonText, { color: '#004D26' }]}>Register as Cricket Player</Text>
            <ChevronRight color="#004D26" size={20} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: 'rgba(255, 255, 255, 0.3)' }]}
            onPress={onJustBrowsing}
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryButtonText}>Just Browsing</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  glow: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: (width * 0.8) / 2,
    opacity: 0.15,
    backgroundColor: '#00FF80',
  },
  glowTopLeft: {
    top: -50,
    left: -50,
  },
  glowBottomRight: {
    bottom: -50,
    right: -50,
  },
  content: {
    width: '100%',
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  circleIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: -8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  mainIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    zIndex: 2,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  sportEmoji: {
    fontSize: 26,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 36,
  },
  featuresList: {
    width: '100%',
    marginBottom: 44,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  featureIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureTextBox: {
    flex: 1,
  },
  featureTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  featureDesc: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    lineHeight: 20,
  },
  actionsContainer: {
    width: '100%',
    gap: 14,
  },
  primaryButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
