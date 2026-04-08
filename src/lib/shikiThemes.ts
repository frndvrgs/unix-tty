import type { ShikiConfig } from 'astro';

type ThemeJson = NonNullable<ShikiConfig['themes']>[string];

function makeTheme(name: string, fg: string, bg: string, dim: string): ThemeJson {
  return {
    name,
    type: 'dark',
    colors: {
      'editor.background': bg,
      'editor.foreground': fg,
    },
    tokenColors: [
      { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: dim, fontStyle: 'italic' } },
      { scope: ['string', 'string.quoted'], settings: { foreground: fg } },
      { scope: ['constant.numeric', 'constant.language', 'constant.character'], settings: { foreground: fg } },
      { scope: ['keyword', 'storage', 'storage.type'], settings: { foreground: fg, fontStyle: 'bold' } },
      { scope: ['entity.name.function', 'support.function'], settings: { foreground: fg } },
      { scope: ['entity.name.class', 'entity.name.type'], settings: { foreground: fg } },
      { scope: ['variable', 'variable.parameter'], settings: { foreground: fg } },
      { scope: ['punctuation'], settings: { foreground: dim } },
    ],
  } as ThemeJson;
}

export const shikiThemes: NonNullable<ShikiConfig['themes']> = {
  light: makeTheme('ember', '#ffa133', '#222222', '#7a5a2a'),
  dark: makeTheme('ember', '#ffa133', '#222222', '#7a5a2a'),
};
