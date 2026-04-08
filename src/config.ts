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
   * Position of the header (presets and range label).
   * 'top', 'bottom', 'left', 'right'.
   * Default: 'top'
   */
  headerPosition: 'top' | 'bottom' | 'left' | 'right';
  /**
   * Custom theme for the date picker.
   */
  theme: {
    primary?: string;
    background?: string;
    surface?: string;
    border?: string;
    text?: string;
    textMuted?: string;
    radius?: string;
    font?: string;
    tooltipBg?: string;
    tooltipText?: string;
    rangeBorder?: string;
    rangeBackground?: string;
    trackImage?: string;
  };
}

export const config = reactive<OwldateConfig>({
  useTemporal: false,
  temporalType: 'PlainDate',
  headerPosition: 'top',
  theme: {
  },
});

export default config;
