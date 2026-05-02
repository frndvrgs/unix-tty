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
  phosphor: makeTheme('phosphor', '#39d353', '#0a0f0a', '#1a6629'),
  amber: makeTheme('amber', '#ffb000', '#100a00', '#7a5000'),
  void: makeTheme('void', '#ffffff', '#0a0a0a', '#555555'),
};
