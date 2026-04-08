export type ThemeName = 'ember' | 'phosphor' | 'neutral';

export interface UnixTtyConfig {
  site: {
    title: string;
    description: string;
    url: string;
  };
  terminal: {
    hostname: string;
    username: string;
    home: string;
    defaultTheme: ThemeName;
    /**
     * Motd lines shown on boot. Supports placeholders:
     * - `{version}` — replaced with UNIX_VERSION from version.ts
     * - `{buildDate}` — replaced with the ISO date at build time
     */
    motd: string[];
  };
  reader: {
    theme: ThemeName;
  };
}

/**
 * Identity function with a type annotation. Gives consumers autocomplete
 * and schema errors against UnixTtyConfig in their site.config.ts.
 */
export function defineConfig(config: UnixTtyConfig): UnixTtyConfig {
  return config;
}
