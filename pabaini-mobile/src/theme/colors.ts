// ─────────────────────────────────────────────
// DESIGN TOKENS  (single source of truth)
// ─────────────────────────────────────────────

// Brand / semantic colours
export const brand = {
  primary: '#16A34A',
  primaryDark: '#15803D',
  primaryLight: '#DCFCE7',
  primaryTint: '#166534',
  primaryText: '#86EFAC',

  danger: '#EF4444',
  dangerLight: '#FEF2F2',
  dangerText: '#DC2626',

  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  warningText: '#92400E',

  info: '#3B82F6',
  infoLight: '#DBEAFE',
  infoText: '#1E40AF',
};

// Adaptive colour sets (used via useTheme)
export const lightColors = {
  // background: '#F3F4F6',
  background: '#ebebebff',
  surface: '#FFFFFF',
  elevated: '#F2F4F7',
  input: '#FFFFFF',
  border: '#E5E7EB',
  borderStrong: '#D1D5DB',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
};

export const darkColors = {
  background: '#0F0F0F',
  surface: '#1A1A1A',
  elevated: '#242424',
  input: '#2A2A2A',
  border: '#2A2A2A',
  borderStrong: '#333333',
  textPrimary: '#F9FAFB',
  textSecondary: '#9CA3AF',
  textTertiary: '#6B7280',
};

// ─────────────────────────────────────────────
// LEGACY TOKENS  (for backward compat with existing screens)
// These map the old flat palette onto the new tokens so that
// screens still using theme.colors.primary etc. keep working.
// ─────────────────────────────────────────────
export const light = {
  // new-style adaptive tokens (flat namespace for existing useTheme consumers)
  background: lightColors.background,
  surface: lightColors.surface,
  elevated: lightColors.elevated,
  input: lightColors.input,
  border: lightColors.border,
  borderStrong: lightColors.borderStrong,
  textPrimary: lightColors.textPrimary,
  textSecondary: lightColors.textSecondary,
  textTertiary: lightColors.textTertiary,

  // brand tokens (flat)
  primary: brand.primary,
  primaryDark: brand.primaryDark,
  primaryLight: brand.primaryLight,
  primaryTint: brand.primaryTint,
  primaryText: brand.primaryText,
  onPrimary: '#FFFFFF',

  danger: brand.danger,
  dangerLight: brand.dangerLight,
  dangerText: brand.dangerText,

  warning: brand.warning,
  warningLight: brand.warningLight,
  warningText: brand.warningText,

  info: brand.info,
  infoLight: brand.infoLight,
  infoText: brand.infoText,

  // legacy tokens kept for old screens
  link: '#A6611A',
  urgentBg: '#FCEBEB',
  urgentText: '#791F1F',
  eventBg: '#E1F5EE',
  eventText: '#04342C',
  generalBg: '#F0EFEA',
  generalText: '#6B6B6B',
};

export const dark: typeof light = {
  background: darkColors.background,
  surface: darkColors.surface,
  elevated: darkColors.elevated,
  input: darkColors.input,
  border: darkColors.border,
  borderStrong: darkColors.borderStrong,
  textPrimary: darkColors.textPrimary,
  textSecondary: darkColors.textSecondary,
  textTertiary: darkColors.textTertiary,

  primary: brand.primary,
  primaryDark: brand.primaryDark,
  primaryLight: brand.primaryLight,
  primaryTint: brand.primaryTint,
  primaryText: brand.primaryText,
  onPrimary: '#FFFFFF',

  danger: brand.danger,
  dangerLight: '#2D1515',
  dangerText: '#FCA5A5',

  warning: brand.warning,
  warningLight: '#2D2007',
  warningText: '#FCD34D',

  info: brand.info,
  infoLight: '#172554',
  infoText: '#93C5FD',

  link: '#C4843A',
  urgentBg: '#2D1515',
  urgentText: '#FCA5A5',
  eventBg: '#0A2218',
  eventText: '#86EFAC',
  generalBg: '#1A1A1A',
  generalText: '#9CA3AF',
};
