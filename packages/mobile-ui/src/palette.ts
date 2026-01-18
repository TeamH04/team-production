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

  // メニュー画面固有のカラー
  menuBadgeBg: withAlpha(secondary, 0.12),
  menuBadgeText: secondary,
  menuBorderLight: withAlpha(primary, 0.12),
  menuBorderMedium: withAlpha(primary, 0.2),
  menuBorderSoft: withAlpha(primary, 0.08),
  menuGrayDark: primary,
  menuGrayLight: withAlpha(background, 0.9),
  menuGrayMuted: withAlpha(primary, 0.5),
  menuGrayText: withAlpha(primary, 0.72),
  menuHeaderGreen: secondary,
  menuImageBg: withAlpha(background, 0.92),
  menuSubText: withAlpha(primary, 0.6),
  menuTabBorder: secondary,
  menuTabText: secondary,
  menuTaxText: withAlpha(primary, 0.6),

  // ガラスモーフィズムUI（ログイン画面など）
  glassBg: 'rgba(255, 255, 255, 0.1)',
  glassBorder: 'rgba(255, 255, 255, 0.2)',
  glassPressed: 'rgba(255, 255, 255, 0.15)',
  glassShadow: 'rgba(0, 0, 0, 0.3)',
  overlay: 'rgba(0, 0, 0, 0.15)',

  // フォーム入力UI（オーナーログインなど）
  formErrorText: '#FCA5A5',
  inputBg: 'rgba(255, 255, 255, 0.1)',
  inputBorder: 'rgba(255, 255, 255, 0.2)',
  labelText: 'rgba(255, 255, 255, 0.8)',
  placeholderText: 'rgba(255, 255, 255, 0.4)',
  loginButtonBg: 'rgba(255, 255, 255, 0.2)',
  loginButtonBorder: 'rgba(255, 255, 255, 0.3)',
  loginButtonPressedBg: 'rgba(255, 255, 255, 0.25)',

  // 開発者モードUI
  devBoxBg: 'rgba(0, 0, 0, 0.3)',
  devBoxBorder: 'rgba(255, 255, 255, 0.2)',
  devButtonBg: 'rgba(255, 255, 255, 0.15)',
  devButtonPressed: 'rgba(255, 255, 255, 0.25)',
};
