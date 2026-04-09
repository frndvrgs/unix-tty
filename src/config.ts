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
    motd: string[];
    logo?: Record<ThemeName, string>;
  };
  reader: {
    theme: ThemeName;
  };
}

export function defineConfig(config: UnixTtyConfig): UnixTtyConfig {
  return config;
}
