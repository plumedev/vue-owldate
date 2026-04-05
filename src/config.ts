import { reactive } from 'vue';

/**
 * Configuration for vue-owldate.
 */
export interface OwldateConfig {
  /**
   * Whether to use the Temporal API instead of native Date.
   * Default: false
   */
  useTemporal: boolean;
  /**
   * The type of Temporal object to use for ranges.
   * 'PlainDate' for dates only, 'ZonedDateTime' for date + time + timezone.
   * Default: 'PlainDate'
   */
  temporalType: 'PlainDate' | 'ZonedDateTime';
  /**
   * Whether presets (7J, 30J, etc.) should be in the future or past.
   * Default: false (past)
   */
  futurePresets: boolean;
  /**
   * Whether to use dark mode.
   * Default: false
   */
  darkMode: boolean;
  /**
   * Custom theme for the date picker.
   */
  theme: {
    primary?: string;
    background?: string;
    surface?: string;
    text?: string;
    textMuted?: string;
    border?: string;
    radius?: string;
    tooltipBg?: string;
    tooltipText?: string;
  };
}

export const config = reactive<OwldateConfig>({
  useTemporal: false,
  temporalType: 'PlainDate',
  futurePresets: true,
  darkMode: false,
  theme: {},
});

export default config;
