import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PabainiLogo } from '../../../ui/PabainiLogo';
import { TeamScorecardCardData } from './shareMappers';

interface TeamScorecardCardProps {
  data: TeamScorecardCardData;
  hideHeader?: boolean;
  hideFooter?: boolean;
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
 * TeamScorecardCard Component
 *
 * Renders the detailed batting and bowling score sheets for a single team.
 */
export default function TeamScorecardCard({
  data,
  hideHeader = false,
  hideFooter = false,
}: TeamScorecardCardProps) {
  const sortedBatsmen = data.batsmen;
  const activeBowlers = data.bowlers;
  const totalExtras = data.extras.total;

  return (
    <View style={[styles.cardContainer, hideHeader && hideFooter && styles.cardContainerNoBorder]}>
      {/* Header Bar */}
      {!hideHeader && (
        <View style={styles.headerBar}>
          <View style={styles.headerLeft}>
            <PabainiLogo size={22} />
            <Text style={styles.headerWordmark}>Pabaini</Text>
          </View>
          <Text style={styles.headerRightText}>MATCH SCORECARD</Text>
        </View>
      )}

      {/* Match title + subtitle */}
      <View style={styles.titleSection}>
        <Text style={styles.matchTitle}>{data.matchTitle}</Text>
        <Text style={styles.teamSubtitle}>
          {data.teamSubtitle} — <Text style={{ color: CARD_COLORS.primaryText }}>{data.scoreStr}</Text>
        </Text>
      </View>

      {/* Batting Table */}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.th, { flex: 3.5 }]}>Batsman</Text>
          <Text style={[styles.th, styles.colRight, { flex: 0.9 }]}>R</Text>
          <Text style={[styles.th, styles.colRight, { flex: 0.9 }]}>B</Text>
          <Text style={[styles.th, styles.colRight, { flex: 0.8 }]}>4s</Text>
          <Text style={[styles.th, styles.colRight, { flex: 0.8 }]}>6s</Text>
          <Text style={[styles.th, styles.colRight, { flex: 1.4 }]}>SR</Text>
        </View>
        {sortedBatsmen.length === 0 ? (
          <View style={styles.emptyRow}>
            <Text style={styles.emptyText}>No batting stats recorded</Text>
          </View>
        ) : (
          sortedBatsmen.map((player, index) => {
            return (
              <View key={index} style={styles.tableRow}>
                <View style={{ flex: 3.5, justifyContent: 'center' }}>
                  <Text style={styles.playerName} numberOfLines={1}>{player.name}</Text>
                  <Text style={styles.dismissalText}>{player.dismissal}</Text>
                </View>
                <Text style={[styles.td, styles.colRight, { flex: 0.9, fontWeight: '700', color: CARD_COLORS.textPrimary }]}>{player.runs}</Text>
                <Text style={[styles.td, styles.colRight, { flex: 0.9 }]}>{player.balls}</Text>
                <Text style={[styles.td, styles.colRight, { flex: 0.8 }]}>{player.fours}</Text>
                <Text style={[styles.td, styles.colRight, { flex: 0.8 }]}>{player.sixes}</Text>
                <Text style={[styles.td, styles.colRight, { flex: 1.4 }]}>{player.strikeRate}</Text>
              </View>
            );
          })
        )}
      </View>

      {/* Bowling Table */}
      <View style={[styles.table, { marginTop: 16 }]}>
        <View style={styles.tableHeader}>
          <Text style={[styles.th, { flex: 3.5 }]}>Bowler</Text>
          <Text style={[styles.th, styles.colRight, { flex: 0.9 }]}>O</Text>
          <Text style={[styles.th, styles.colRight, { flex: 0.9 }]}>M</Text>
          <Text style={[styles.th, styles.colRight, { flex: 0.9 }]}>R</Text>
          <Text style={[styles.th, styles.colRight, { flex: 0.9 }]}>W</Text>
          <Text style={[styles.th, styles.colRight, { flex: 1.4 }]}>ER</Text>
        </View>
        {activeBowlers.length === 0 ? (
          <View style={styles.emptyRow}>
            <Text style={styles.emptyText}>No bowling stats recorded</Text>
          </View>
        ) : (
          activeBowlers.map((player, index) => {
            return (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.playerName, { flex: 3.5 }]} numberOfLines={1}>{player.name}</Text>
                <Text style={[styles.td, styles.colRight, { flex: 0.9, color: CARD_COLORS.textPrimary }]}>{player.overs}</Text>
                <Text style={[styles.td, styles.colRight, { flex: 0.9 }]}>{player.maidens}</Text>
                <Text style={[styles.td, styles.colRight, { flex: 0.9 }]}>{player.runsGiven}</Text>
                <Text style={[styles.td, styles.colRight, { flex: 0.9, fontWeight: '700', color: CARD_COLORS.primaryText }]}>{player.wickets}</Text>
                <Text style={[styles.td, styles.colRight, { flex: 1.4 }]}>{player.economyRate}</Text>
              </View>
            );
          })
        )}
      </View>

      {/* Extras Row */}
      <View style={styles.extrasRow}>
        <Text style={styles.extrasText}>
          Total extras: <Text style={{ fontWeight: '700', color: CARD_COLORS.textPrimary }}>{totalExtras}</Text> · WD {data.extras.wides} NB {data.extras.noBalls} Bye {data.extras.byes} LBye {data.extras.legByes}
        </Text>
      </View>

      {/* Footer */}
      {!hideFooter && (
        <View style={styles.footerRow}>
          <Text style={styles.footerLeft}>Recorded on Pabaini App</Text>
          <Text style={styles.footerRight}>pabaini.app</Text>
        </View>
      )}
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
  cardContainerNoBorder: {
    borderWidth: 0,
    borderRadius: 0,
    width: '100%',
  },
  headerBar: {
    height: 44,
    backgroundColor: '#0F0F0F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#1F1F1F',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerWordmark: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: 14,
  },
  headerRightText: {
    color: '#9CA3AF',
    fontWeight: '500',
    fontSize: 10,
    letterSpacing: 1,
  },
  titleSection: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 14,
    alignItems: 'center',
  },
  matchTitle: {
    color: CARD_COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  teamSubtitle: {
    color: CARD_COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },
  table: {
    width: '100%',
    paddingHorizontal: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#1F1F1F',
    marginBottom: 4,
  },
  th: {
    color: CARD_COLORS.textMuted,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#1F1F1F',
    alignItems: 'center',
  },
  td: {
    color: CARD_COLORS.textSecondary,
    fontSize: 11,
  },
  colRight: {
    textAlign: 'right',
  },
  playerName: {
    color: CARD_COLORS.textPrimary,
    fontSize: 11,
    fontWeight: '600',
  },
  dismissalText: {
    color: CARD_COLORS.textMuted,
    fontSize: 9,
    marginTop: 1,
  },
  emptyRow: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  emptyText: {
    color: CARD_COLORS.textMuted,
    fontSize: 11,
    fontStyle: 'italic',
  },
  extrasRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 0.5,
    borderTopColor: '#1F1F1F',
    marginTop: 8,
  },
  extrasText: {
    color: CARD_COLORS.textSecondary,
    fontSize: 11,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: CARD_COLORS.surface,
    borderTopWidth: 0.5,
    borderTopColor: CARD_COLORS.border,
    paddingVertical: 10,
    paddingHorizontal: 16,
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
