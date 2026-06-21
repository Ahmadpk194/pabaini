import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LogIn, X } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuthPromptStore } from '../../store/authPromptStore';

const { width } = Dimensions.get('window');

export function LoginPromptModal() {
  const { theme } = useTheme();
  const router = useRouter();
  const { visible, title, description, hidePrompt } = useAuthPromptStore();

  const handleLoginPress = () => {
    hidePrompt();
    router.push('/(auth)/login');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={hidePrompt}
    >
      <TouchableWithoutFeedback onPress={hidePrompt}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
              {/* Close Button */}
              <TouchableOpacity
                onPress={hidePrompt}
                style={styles.closeButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>

              {/* Icon Container */}
              <View style={[styles.iconContainer, { backgroundColor: theme.colors.generalBg }]}>
                <LogIn size={28} color={theme.colors.primary} />
              </View>

              {/* Text Information */}
              <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
                {title}
              </Text>
              <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
                {description}
              </Text>

              {/* Action Buttons */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  onPress={hidePrompt}
                  style={[styles.btn, styles.cancelBtn, { borderColor: theme.colors.border }]}
                >
                  <Text style={[styles.btnText, styles.cancelBtnText, { color: theme.colors.textPrimary }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleLoginPress}
                  style={[styles.btn, styles.loginBtn, { backgroundColor: theme.colors.primary }]}
                >
                  <Text style={[styles.btnText, styles.loginBtnText, { color: theme.colors.onPrimary }]}>
                    Log In
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: Math.min(width - 48, 340),
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  btn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtn: {
    borderWidth: 1,
  },
  loginBtn: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  btnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  cancelBtnText: {
    // inherits color from theme
  },
  loginBtnText: {
    // inherits color from theme
  },
});
