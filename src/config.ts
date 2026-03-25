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
}

const config: OwldateConfig = {
  useTemporal: false,
  temporalType: 'PlainDate',
};

export default config;
