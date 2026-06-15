import { light, dark } from './colors';
import { spacing, radius } from './spacing';
import { typography } from './typography';

export const themes = {
  light: { colors: light, spacing, radius, typography },
  dark: { colors: dark, spacing, radius, typography },
};
export type Theme = typeof themes.light;
