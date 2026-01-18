import { colors, semanticColors, textOn, withAlpha } from '@team/theme';

const { primary, secondary, background } = colors;
const { error, success, warning, providers } = semanticColors;
const textOnBackground = textOn.background;

// 影の色定数（palette内での再利用のため）
const BLACK = '#000000';

export const palette = {
  // 基本のサーフェスとテキスト
  background,
  // プラットフォーム固有の背景
  backgroundAndroid: '#E8E7E5',
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
  dangerBg: error.light,
  dangerBorder: error.medium,
  dangerText: error.base,
  errorText: error.dark,

  // ステータス / セマンティック
  highlight: withAlpha(secondary, 0.15),
  ratingText: warning.base, // スター評価用の標準ゴールド

  // ブランド / プロバイダ
  google: providers.google,
  apple: providers.apple,

  // ユーティリティ
  white: '#FFFFFF',
  black: BLACK,
  grayMid: '#999999',
  grayDark: '#333333',
  grayLight: '#F6F5F3',
  transparent: 'transparent',
  accentButtonBg: '#1daa7dcc',
  accentSoft: withAlpha(secondary, 0.45),

  // 影
  shadow: BLACK,
  shadowColor: BLACK,

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
  starHighlight: warning.base,

  // お気に入り
  favoriteActive: error.base,

  // 訪問済み
  visitedActive: success.base,

  // その他のUI
  arrowButtonBg: withAlpha(textOnBackground, 0.05),
  heroPlaceholder: withAlpha(textOnBackground, 0.1),
  menuBackground: background,
  menuSelectedBackground: withAlpha(primary, 0.1),
  menuSelectedBorder: primary,
  menuSelectedText: primary,
  muted: withAlpha(textOnBackground, 0.4),
};
