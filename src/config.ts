export type ThemeName = 'phosphor' | 'amber' | 'void';

export type ImageRendering = 'auto' | 'smooth' | 'crisp-edges' | 'pixelated';

export type LogoEntry =
  | string
  | {
      url: string;
      width?: number;
      height?: number;
      imageRendering?: ImageRendering;
    };

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
    scanlines: boolean;
    flicker: boolean;
    motd: string[];
    logo?: Record<ThemeName, LogoEntry>;
  };
  reader: {
    theme: ThemeName;
  };
}

export function defineConfig(config: UnixTtyConfig): UnixTtyConfig {
  return config;
}
