/**
 * Re-export TAB_BAR_SPACING from @team/constants for backward compatibility.
 * This ensures content doesn't get hidden behind the fixed tab bar.
 */
import { LAYOUT } from '@team/constants';

export const TAB_BAR_SPACING = LAYOUT.TAB_BAR_SPACING;
