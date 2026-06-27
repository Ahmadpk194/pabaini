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
  BackHandler,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BarChart2, Table, Files, ChevronRight, X } from 'lucide-react-native';
import { useTheme } from '../../../../context/ThemeContext';
import { SHARE_OPTIONS, ShareOption } from '../../../../constants/shareOptions';

/**
 * ShareBottomSheet Component
 * 
 * A Modal-based action sheet that slides up from the bottom when opened.
 * It reads menu options dynamically from the SHARE_OPTIONS config array.
 * 
 * ANIMATION MECHANISM:
 * - Uses parallel Animated.timing runs for backdrop fade (backdropAnim: 0 -> 0.5)
 *   and slide-up translation (slideAnim: SCREEN_HEIGHT -> 0).
 */
interface ShareBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (optionId: string) => void;
  matchTitle: string;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function ShareBottomSheet({
  isOpen,
  onClose,
  onSelect,
  matchTitle,
}: ShareBottomSheetProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  // Animation values
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  // Open sheet animations
  const openSheet = useCallback(() => {
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

  // Close sheet animations
  const closeSheet = useCallback(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 260,
        easing: Easing.in(Easing.bezier(0.25, 0.46, 0.45, 0.94)),
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  }, [slideAnim, backdropAnim, onClose]);

  const handleModalShow = useCallback(() => {
    slideAnim.setValue(SCREEN_HEIGHT);
    backdropAnim.setValue(0);
    openSheet();
  }, [slideAnim, backdropAnim, openSheet]);

  // Hardware back button on Android
  useEffect(() => {
    if (!isOpen) return;
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      closeSheet();
      return true;
    });
    return () => handler.remove();
  }, [isOpen, closeSheet]);

  // Resolve Lucide icons based on configuration
  const getIcon = (iconName: string, color: string) => {
    const props = { size: 20, color };
    switch (iconName) {
      case 'bar-chart':
        return <BarChart2 {...props} />;
      case 'table':
        return <Table {...props} />;
      case 'files':
        return <Files {...props} />;
      default:
        return <Files {...props} />;
    }
  };

  const handleOptionPress = (optionId: string) => {
    // Animate out first, then notify parent
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 240,
        easing: Easing.in(Easing.bezier(0.25, 0.46, 0.45, 0.94)),
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 240,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onSelect(optionId);
    });
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={closeSheet}
      onShow={handleModalShow}
    >
      <View style={styles.overlay}>
        {/* Backdrop overlay */}
        <TouchableWithoutFeedback onPress={closeSheet}>
          <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]} />
        </TouchableWithoutFeedback>

        {/* Action sheet content */}
        <Animated.View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: theme.colors.surface,
              transform: [{ translateY: slideAnim }],
              paddingBottom: Math.max(insets.bottom + 16, 24),
            },
          ]}
        >
          {/* Header handle / drag indicator */}
          <View style={styles.dragHandleContainer}>
            <View style={[styles.dragHandle, { backgroundColor: theme.colors.border }]} />
          </View>

          {/* Title & subtitle block */}
          <View style={styles.titleBlock}>
            <View style={styles.titleRow}>
              <Text style={[styles.titleText, { color: theme.colors.textPrimary }]}>
                Share match
              </Text>
              <TouchableOpacity onPress={closeSheet} style={styles.closeButton}>
                <X size={18} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.subtitleText, { color: theme.colors.textSecondary }]}>
              {matchTitle}
            </Text>
          </View>

          {/* Share options mapping */}
          <View style={styles.optionsList}>
            {SHARE_OPTIONS.map((option: ShareOption) => {
              // Resolve active theme colors at render time
              const resolvedIconColor = (theme.colors as any)[option.iconColor] || theme.colors.primary;
              const resolvedBgColor = (theme.colors as any)[option.iconBgColor] || `${theme.colors.primary}15`;

              return (
                <TouchableOpacity
                  key={option.id}
                  style={[styles.optionCard, { borderColor: theme.colors.border }]}
                  onPress={() => handleOptionPress(option.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.iconContainer, { backgroundColor: resolvedBgColor }]}>
                    {getIcon(option.iconName, resolvedIconColor)}
                  </View>
                  <View style={styles.optionInfo}>
                    <Text style={[styles.optionLabel, { color: theme.colors.textPrimary }]}>
                      {option.label}
                    </Text>
                    <Text style={[styles.optionDescription, { color: theme.colors.textSecondary }]}>
                      {option.description}
                    </Text>
                  </View>
                  <ChevronRight size={18} color={theme.colors.textTertiary} />
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Cancel button */}
          <TouchableOpacity
            style={[styles.cancelBtn, { backgroundColor: theme.colors.background }]}
            onPress={closeSheet}
            activeOpacity={0.7}
          >
            <Text style={[styles.cancelBtnText, { color: theme.colors.textPrimary }]}>
              Cancel
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#000000',
  },
  sheetContainer: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 16,
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  titleBlock: {
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleText: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  subtitleText: {
    fontSize: 13,
    marginTop: 2,
  },
  optionsList: {
    gap: 10,
    marginBottom: 16,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
    gap: 2,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  optionDescription: {
    fontSize: 11,
  },
  cancelBtn: {
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
