import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PabainiLogo } from '../../../ui/PabainiLogo';
import TeamScorecardCard from './TeamScorecardCard';
import { FullScorecardCardData } from './shareMappers';

interface FullScorecardCardProps {
  data: FullScorecardCardData;
}

const CARD_COLORS = {
  bg: '#0F0F0F',
  surface: '#1A1A1A',
  border: '#2A2A2A',
  elevated: '#242424',
  textPrimary: '#F9FAFB',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  primary: '#16A34A',
  primaryDark: '#166534',
  primaryLight: '#DCFCE7',
  primaryText: '#86EFAC',
  danger: '#EF4444',
  warning: '#F59E0B',
};

/**
 * FullScorecardCard Component
 *
 * Composition wrapper that stacks TeamScorecardCard templates for both Team A and Team B.
 * Displays a single header at the top, separates teams with a border divider,
 * and wraps them in a single footer at the bottom.
 */
export default function FullScorecardCard({ data }: FullScorecardCardProps) {
  return (
    <View style={styles.cardContainer}>
      {/* Green Header Bar (Single, at the top) */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <PabainiLogo size={18} color="#FFFFFF" />
          <Text style={styles.headerWordmark}>Pabaini</Text>
        </View>
        <Text style={styles.headerRightText}>MATCH SCORECARD</Text>
      </View>

      {/* Team A Scorecard */}
      <TeamScorecardCard
        data={data.teamAData}
        hideHeader
        hideFooter
      />

      {/* Thin Divider between Team A and Team B */}
      <View style={styles.divider} />

      {/* Team B Scorecard */}
      <TeamScorecardCard
        data={data.teamBData}
        hideHeader
        hideFooter
      />

      {/* Footer (Single, at the bottom) */}
      <View style={styles.footerRow}>
        <Text style={styles.footerLeft}>Recorded on Pabaini App</Text>
        <Text style={styles.footerRight}>pabaini.app</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: 360,
    backgroundColor: CARD_COLORS.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: CARD_COLORS.border,
    overflow: 'hidden',
  },
  headerBar: {
    height: 32,
    backgroundColor: CARD_COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerWordmark: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  headerRightText: {
    color: '#E5E7EB',
    fontWeight: '600',
    fontSize: 9,
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: CARD_COLORS.border,
    marginVertical: 8,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: CARD_COLORS.surface,
    borderTopWidth: 0.5,
    borderTopColor: CARD_COLORS.border,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  footerLeft: {
    color: CARD_COLORS.textMuted,
    fontSize: 9,
  },
  footerRight: {
    color: CARD_COLORS.primary,
    fontWeight: '600',
    fontSize: 9,
  },
});
