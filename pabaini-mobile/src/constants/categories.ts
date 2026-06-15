import { Category } from '../types';
import { themes } from '../theme';

export const CATEGORIES: Category[] = ['general', 'urgent', 'event', 'jirga_decision'];

export function getCategoryConfig(category: Category) {
  const theme = themes.light.colors;
  
  switch (category) {
    case 'general':
      return {
        label: 'General',
        bgColor: theme.generalBg,
        textColor: theme.generalText,
      };
    case 'urgent':
      return {
        label: 'Urgent',
        bgColor: theme.urgentBg,
        textColor: theme.urgentText,
      };
    case 'event':
      return {
        label: 'Event',
        bgColor: theme.eventBg,
        textColor: theme.eventText,
      };
    case 'jirga_decision':
      return {
        label: 'Jirga Decision',
        bgColor: '#E8F5E9',
        textColor: '#1B5E20',
      };
    default:
      return {
        label: 'General',
        bgColor: theme.generalBg,
        textColor: theme.generalText,
      };
  }
}
