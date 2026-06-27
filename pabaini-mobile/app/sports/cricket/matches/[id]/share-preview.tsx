import React, { useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Download, Share2 } from 'lucide-react-native';
import ViewShot from 'react-native-view-shot';

import { useTheme } from '../../../../../src/context/ThemeContext';
import { useMatchDetail, useLineup } from '../../../../../src/hooks/useMatches';
import { SHARE_OPTIONS } from '../../../../../src/constants/shareOptions';
import { ShareService } from '../../../../../src/services/share/shareService';
import {
  mapMatchToHighlightData,
  mapMatchToTeamScorecardData,
  mapMatchToFullScorecardData,
} from '../../../../../src/components/sports/matches/share/shareMappers';
import HighlightCard from '../../../../../src/components/sports/matches/share/HighlightCard';
import TeamScorecardCard from '../../../../../src/components/sports/matches/share/TeamScorecardCard';
import FullScorecardCard from '../../../../../src/components/sports/matches/share/FullScorecardCard';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = 360;

// Dynamic component registry for scaling templates
const SHARE_CARD_REGISTRY: Record<string, React.ComponentType<any>> = {
  highlight: HighlightCard,
  my_team: TeamScorecardCard,
  full_match: FullScorecardCard,
};

/**
 * SharePreviewScreen Component
 * 
 * Displays a scaled-down visible preview of the selected scorecard template,
 * while rendering the template off-screen at its original 360px width for capturing.
 * 
 * Refactored to delegate data calculations to mappers and capture/share/save pipelines
 * to the ShareService.
 */
export default function SharePreviewScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id, optionId, teamId } = useLocalSearchParams<{
    id: string;
    optionId: string;
    teamId?: string;
  }>();

  const matchId = Number(id);
  const selectedTeamId = teamId ? Number(teamId) : undefined;

  const { data: match, isLoading, error } = useMatchDetail(matchId);
  const { data: lineups } = useLineup(matchId);

  const viewShotRef = useRef<any>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  // Separate data preparation: maps match states to visual-friendly variables
  const cardData = useMemo(() => {
    if (!match) return null;
    switch (optionId) {
      case 'highlight':
        return mapMatchToHighlightData(match);
      case 'my_team':
        return mapMatchToTeamScorecardData(
          match,
          selectedTeamId || match.team_a_id,
          lineups,
          selectedTeamId === match.team_a_id || selectedTeamId === match.team_b_id
        );
      case 'full_match':
        return mapMatchToFullScorecardData(match, lineups);
      default:
        return null;
    }
  }, [optionId, match, selectedTeamId, lineups]);

  if (isLoading || !match) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.surface }]} edges={['top', 'left', 'right']}>
        <View style={[styles.headerBar, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft color={theme.colors.textPrimary} size={24} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary, flex: 1, textAlign: 'center' }]}>
            Preview
          </Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.surface }]} edges={['top', 'left', 'right']}>
        <View style={[styles.headerBar, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft color={theme.colors.textPrimary} size={24} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary, flex: 1, textAlign: 'center' }]}>
            Preview
          </Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
          <Text style={{ color: theme.colors.textSecondary, marginBottom: 12 }}>
            Failed to load preview details.
          </Text>
          <TouchableOpacity
            style={[styles.errorBtn, { backgroundColor: theme.colors.primary }]}
            onPress={() => router.back()}
          >
            <Text style={{ color: theme.colors.onPrimary, fontWeight: '700' }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const option = SHARE_OPTIONS.find((o) => o.id === optionId);
  const cardTitle = option?.label || 'Match Scorecard';

  // Dynamic component registry lookup
  const renderCard = (props: { hideHeader?: boolean; hideFooter?: boolean } = {}) => {
    const CardComponent = SHARE_CARD_REGISTRY[optionId];
    if (!CardComponent || !cardData) return null;
    return <CardComponent data={cardData} {...props} />;
  };

  const saveToGallery = async () => {
    if (isCapturing) return;
    try {
      setIsCapturing(true);
      // Capture and Save using the extracted ShareService with high resolution scale
      await ShareService.captureAndSave(viewShotRef, { scale: 3 });
      Alert.alert('Success', 'Scorecard image saved to gallery!');
    } catch (err: any) {
      console.error('Failed to save to gallery:', err);
      Alert.alert('Error', err.message || 'Failed to save to gallery');
    } finally {
      setIsCapturing(false);
    }
  };

  const captureAndShare = async () => {
    if (isCapturing) return;
    try {
      setIsCapturing(true);
      // Capture and Share using the extracted ShareService with high resolution scale
      await ShareService.captureAndShare(viewShotRef, {
        title: cardTitle,
        message: `Pabaini Scorecard: ${match.team_a.name} vs ${match.team_b.name}\nShared via Pabaini Mobile App.`,
        scale: 3,
      });
    } catch (err: any) {
      console.error('Failed to share:', err);
      Alert.alert('Error', err.message || 'Failed to open share sheet');
    } finally {
      setIsCapturing(false);
    }
  };

  // Scale calculations for visible preview
  const scale = (SCREEN_WIDTH - 48) / CARD_WIDTH;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.surface }]} edges={['top', 'left', 'right']}>
      {/* Visible Header Bar */}
      <View style={[styles.headerBar, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} disabled={isCapturing}>
          <ArrowLeft color={theme.colors.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary, flex: 1, textAlign: 'center' }]}>
          Preview
        </Text>
        <TouchableOpacity
          style={[styles.headerShareButton, { backgroundColor: theme.colors.primary }]}
          onPress={captureAndShare}
          disabled={isCapturing}
        >
          {isCapturing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Share2 color="#FFFFFF" size={16} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.cardLabel, { color: theme.colors.textSecondary }]}>
          {cardTitle}
        </Text>

        {/* Visible Scaled Preview Container */}
        <View style={[styles.previewWrapper, { height: 500 }]}>
          <ScrollView
            style={styles.previewScrollView}
            contentContainerStyle={styles.previewScrollContainer}
            showsVerticalScrollIndicator
          >
            <View style={[styles.scaledCardContainer, { transform: [{ scale }], width: CARD_WIDTH }]}>
              {renderCard()}
            </View>
          </ScrollView>
        </View>

        {/* Bottom Buttons Bar */}
        <View style={styles.actionsBar}>
          <TouchableOpacity
            style={[
              styles.secondaryBtn,
              { borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
              isCapturing && styles.disabledBtn,
            ]}
            onPress={saveToGallery}
            disabled={isCapturing}
          >
            <Download size={18} color={theme.colors.textPrimary} style={{ marginRight: 8 }} />
            <Text style={[styles.btnText, { color: theme.colors.textPrimary }]}>Save to Gallery</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.primaryBtn,
              { backgroundColor: theme.colors.primary },
              isCapturing && styles.disabledBtn,
            ]}
            onPress={captureAndShare}
            disabled={isCapturing}
          >
            {isCapturing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Share2 size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={[styles.btnText, { color: '#FFFFFF' }]}>Share Scorecard</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Hidden view rendered off-screen at full resolution for high quality capture */}
      <View style={styles.hiddenView} collapsable={false}>
        <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1.0 }}>
          {renderCard()}
        </ViewShot>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  headerShareButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  scrollContent: {
    padding: 24,
    alignItems: 'center',
    gap: 16,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  previewWrapper: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  previewScrollView: {
    flex: 1,
    backgroundColor: '#000000',
  },
  previewScrollContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  scaledCardContainer: {
    alignSelf: 'center',
  },
  actionsBar: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
    marginTop: 8,
  },
  primaryBtn: {
    flex: 1.3,
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledBtn: {
    opacity: 0.5,
  },
  btnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  hiddenView: {
    position: 'absolute',
    left: -9999,
    top: 0,
    width: CARD_WIDTH,
  },
});
