import { colors, textOn, withAlpha } from '@team/theme';

const { primary, secondary, background } = colors;
const textOnBackground = textOn.background;

export const palette = {
  // 基本のサーフェスとテキスト
  background,
  surface: background, // 可読性と一貫性のためにテーマの背景を使用
  primaryText: textOnBackground,
  secondaryText: withAlpha(textOnBackground, 0.7),
  tertiaryText: withAlpha(textOnBackground, 0.5),
  chipTextInactive: withAlpha(textOnBackground, 0.5),
  mutedText: withAlpha(textOnBackground, 0.5),

  // ボーダーと区切り線
  border: withAlpha(primary, 0.15),
  divider: withAlpha(primary, 0.1),
  outline: withAlpha(primary, 0.2),

  // アクセントとアクション
  accent: secondary, // UIのアクセントとしてセカンダリ（グリーン）を使用
  action: primary,
  link: primary,
  button: primary,
  buttonBorder: primary,

  // 警告とアラート
  dangerBg: '#FEE2E2',
  dangerBorder: '#FECACA',
  dangerText: '#EF4444',
  errorText: '#DC2626',

  // ステータス / セマンティック
  highlight: withAlpha(secondary, 0.15),
  ratingText: '#F59E0B', // スター評価用の標準ゴールド

  // ブランド / プロバイダ
  google: '#DB4437',
  apple: '#000000',

  // 影
  shadow: '#000000',
  shadowColor: '#000000',

  // サーフェス
  tagSurface: withAlpha(secondary, 0.1),
  tagText: secondary,

  // アバター
  avatarBackground: withAlpha(primary, 0.1),
  avatarText: primary,

  // アクションボタン
  primary: primary,
  primaryOnAccent: textOn.primary,
  secondarySurface: withAlpha(secondary, 0.1), // セカンダリボタン用の淡いグリーン
  textOnPrimary: textOn.primary,
  textOnSecondary: secondary, // セカンダリボタン上のテキストはグリーン
  textOnAccent: textOn.primary,

  // スター / レーティング
  starInactive: withAlpha(textOnBackground, 0.2),
  starHighlight: '#F59E0B',

  // お気に入り
  favoriteActive: '#EF4444',

  // その他のUI
  arrowButtonBg: withAlpha(textOnBackground, 0.05),
  heroPlaceholder: withAlpha(textOnBackground, 0.1),
  menuBackground: background,
  menuSelectedBackground: withAlpha(primary, 0.1),
  menuSelectedBorder: primary,
  menuSelectedText: primary,
  muted: withAlpha(textOnBackground, 0.4),
};
