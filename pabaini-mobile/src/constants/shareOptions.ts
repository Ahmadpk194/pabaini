/**
 * Share Options Configuration
 * Drives the menu options displayed in the ShareBottomSheet.
 * 
 * EXTENSIBILITY: To add a new card template:
 * 1. Add a new configuration object to the SHARE_OPTIONS array below.
 * 2. Create the new card layout component.
 * 3. Update the renderCard switch-case in share-preview.tsx.
 */
export interface ShareOption {
  id: string;                    // unique identifier e.g. 'highlight' | 'my_team' | 'full_match'
  label: string;                 // shown in bottom sheet e.g. "Highlight card"
  description: string;           // shown in bottom sheet e.g. "Result · top performers · man of match"
  iconName: string;              // icon from existing icon library
  iconColor: string;             // use theme token names, not hex — agent resolves at render time
  iconBgColor: string;           // same
}

export const SHARE_OPTIONS: ShareOption[] = [
  {
    id: 'highlight',
    label: 'Highlight card',
    description: 'Result · top performers · man of match',
    iconName: 'bar-chart',
    iconColor: 'primary',
    iconBgColor: 'primaryLight',
  },
  {
    id: 'my_team',
    label: 'My team scorecard',
    description: 'Full batting and bowling for your team',
    iconName: 'table',
    iconColor: 'info',
    iconBgColor: 'infoLight',
  },
  {
    id: 'full_match',
    label: 'Full match scorecard',
    description: 'Both teams — complete batting and bowling',
    iconName: 'files',
    iconColor: 'warning',
    iconBgColor: 'warningLight',
  },
];
