import { Ionicons } from '@expo/vector-icons';
import { BORDER_RADIUS, SPACING } from '@team/constants';
import { palette } from '@team/mobile-ui';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { fonts } from '@/constants/typography';

export interface SearchBarProps {
  /**
   * 検索テキストの現在値
   */
  value: string;
  /**
   * テキスト変更時のコールバック
   */
  onChangeText: (text: string) => void;
  /**
   * クリアボタン押下時のコールバック
   */
  onClear: () => void;
  /**
   * プレースホルダーテキスト
   * @default 'お店名・雰囲気'
   */
  placeholder?: string;
  /**
   * エンターキー押下時のコールバック
   */
  onSubmitEditing?: () => void;
  /**
   * キーボードの戻るキータイプ
   * @default 'search'
   */
  returnKeyType?: 'search' | 'done' | 'go' | 'next' | 'send';
  /**
   * クリアボタンを表示するかどうか
   * 指定しない場合は value.length > 0 で自動判定
   */
  showClearButton?: boolean;
  /**
   * アクセシビリティラベル
   * @default '検索'
   */
  accessibilityLabel?: string;
  /**
   * アクセシビリティヒント
   * @default '店舗名、説明、カテゴリーで検索'
   */
  accessibilityHint?: string;
}

/**
 * 検索バーコンポーネント
 * お気に入り画面・検索画面で使用される共通の検索入力フィールド
 */
export function SearchBar({
  value,
  onChangeText,
  onClear,
  placeholder = 'お店名・雰囲気',
  onSubmitEditing,
  returnKeyType = 'search',
  showClearButton,
  accessibilityLabel = '検索',
  accessibilityHint = '店舗名、説明、カテゴリーで検索',
}: SearchBarProps) {
  const shouldShowClearButton = showClearButton ?? value.length > 0;

  return (
    <View style={[styles.container, styles.shadow]}>
      <Ionicons name='search' size={20} color={palette.secondaryText} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={palette.secondaryText}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmitEditing}
        returnKeyType={returnKeyType}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
      />
      {shouldShowClearButton && (
        <Pressable onPress={onClear} accessibilityLabel='検索をクリア' accessibilityRole='button'>
          <Ionicons name='close-circle' size={20} color={palette.secondaryText} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderRadius: BORDER_RADIUS.PILL,
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: SPACING.XL,
    paddingVertical: SPACING.MD,
  },
  input: {
    color: palette.primaryText,
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 16,
  },
  shadow: {
    boxShadow: '0px 6px 10px rgba(0, 0, 0, 0.05)',
    elevation: 3,
  },
});
