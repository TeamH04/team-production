import { HeaderBackButton } from '@react-navigation/elements';
import { type Href, useNavigation, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { HEADER_HEIGHT } from '@/constants/layout';
import { palette } from '@/constants/palette';
import { fonts } from '@/constants/typography';
import {
  toStepData,
  validateStep,
  type BudgetRangeStep,
  type ItemWithId,
  type MultiValueStep,
  type SingleValueStep,
} from '@/features/owner/logic/shop-registration';

type SingleValueStepUI = SingleValueStep & {
  onChange: (text: string) => void;
  placeholder: string;
};

type MultiValueStepUI = MultiValueStep & {
  onChange: (items: ItemWithId[]) => void;
  placeholder: string;
};

type BudgetRangeStepUI = BudgetRangeStep & {
  onChange: { min: (text: string) => void; max: (text: string) => void };
  placeholder: { min: string; max: string };
};

type Step = SingleValueStepUI | MultiValueStepUI | BudgetRangeStepUI;

export default function RegisterShopScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const [storeName, setStoreName] = useState('');
  const [menuItems, setMenuItems] = useState<ItemWithId[]>([
    { id: `menu-${Date.now()}`, value: '' },
  ]);
  const [minutesFromStation, setMinutesFromStation] = useState('');
  const [tagItems, setTagItems] = useState<ItemWithId[]>([{ id: `tag-${Date.now()}`, value: '' }]);
  const [address, setAddress] = useState('');
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [loading, setLoading] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const handleBack = useCallback(() => {
    if (stepIndex > 0) {
      setStepIndex(prev => Math.max(prev - 1, 0));
      return;
    }
    if (navigation.canGoBack?.()) {
      navigation.goBack();
    } else {
      router.replace('/owner' as Href);
    }
  }, [navigation, router, stepIndex]);

  useEffect(() => {
    navigation.setOptions?.({
      title: '店舗登録',
      headerBackTitle: ' 戻る',
      headerTintColor: palette.textOnAccent,
      headerStyle: {
        backgroundColor: palette.accent,
        height: HEADER_HEIGHT,
      },
      headerTitleStyle: {
        color: palette.textOnAccent,
      },
      headerLeft: (props: Parameters<typeof HeaderBackButton>[0]) => (
        <HeaderBackButton {...props} onPress={handleBack} />
      ),
    });
  }, [navigation, handleBack]);

  const handleSubmit = useCallback(async () => {
    if (loading) return;

    const hasTag = tagItems.some(tag => tag.value.trim().length > 0);
    if (!storeName.trim() || !hasTag || !address.trim()) {
      Alert.alert('入力不足', '店舗名・タグ・住所は必須です');
      return;
    }

    if (minutesFromStation && !/^\d{1,3}$/.test(minutesFromStation.trim())) {
      Alert.alert('入力エラー', '最寄り駅からの分数は半角数字で入力してください');
      return;
    }

    const parsedMinutes = minutesFromStation.trim() ? Number(minutesFromStation.trim()) : null;
    if (parsedMinutes !== null && parsedMinutes <= 0) {
      Alert.alert('入力エラー', '最寄り駅からの分数は1以上で入力してください');
      return;
    }

    try {
      setLoading(true);
      // TODO: Backend エンドポイントに置き換え予定。現在はモック送信。
      // 実際のペイロード: { storeName, menuItems, minutesFromStation: parsedMinutes, tags: tagItems, address, minBudget, maxBudget }
      await new Promise(resolve => setTimeout(resolve, 700));
      Alert.alert('送信完了', '店舗登録リクエストを受け付けました');
      router.replace('/owner' as Href);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '送信に失敗しました';
      Alert.alert('エラー', message);
    } finally {
      setLoading(false);
    }
  }, [address, loading, minutesFromStation, router, storeName, tagItems]);

  const steps = useMemo<Step[]>(
    () => [
      {
        key: 'storeName',
        title: '店舗名を入力（必須）',
        description: '看板に表示される正式な店舗名を入れてください',
        value: storeName,
        required: true,
        onChange: setStoreName,
        placeholder: '例）喫茶サンプル',
        keyboardType: 'default' as const,
      },
      {
        key: 'menu',
        title: '主なメニュー',
        description: '代表的なメニューやセットを入力してください',
        value: menuItems,
        required: false,
        onChange: setMenuItems,
        placeholder: '例）ブレンドコーヒー',
        keyboardType: 'default' as const,
        isMultiple: true,
      },
      {
        key: 'minutesFromStation',
        title: '最寄り駅から徒歩何分？',
        description: '最寄り駅からの所要時間を半角数字で入力',
        value: minutesFromStation,
        required: false,
        onChange: setMinutesFromStation,
        placeholder: '例）5',
        keyboardType: 'number-pad' as const,
      },
      {
        key: 'tags',
        title: 'タグを追加（必須）',
        description: '検索されやすいキーワードを1つずつ入力してください',
        value: tagItems,
        required: true,
        onChange: setTagItems,
        placeholder: '例）カフェ',
        keyboardType: 'default' as const,
        isMultiple: true,
      },
      {
        key: 'address',
        title: '住所を入力（必須）',
        description: '郵便番号から続けて詳しく入力してください',
        value: address,
        required: true,
        onChange: setAddress,
        placeholder: '例）東京都渋谷区〇〇1-2-3',
        keyboardType: 'default' as const,
      },
      {
        key: 'budget',
        title: '予算の目安',
        description: '最小値と最大値を半角数字で入力してください',
        value: { min: minBudget, max: maxBudget },
        required: false,
        onChange: { min: setMinBudget, max: setMaxBudget },
        placeholder: { min: '例）800', max: '例）1500' },
        keyboardType: 'number-pad' as const,
        isBudgetRange: true,
      },
    ],
    [address, minBudget, maxBudget, menuItems, minutesFromStation, storeName, tagItems],
  );

  const totalSteps = steps.length;
  const currentStep = steps[stepIndex];

  const validateCurrent = useCallback(() => {
    const result = validateStep(toStepData(currentStep));

    if (!result.isValid) {
      Alert.alert(
        result.errorTitle ?? '入力エラー',
        result.errorMessage ?? '入力内容を確認してください',
      );
      return false;
    }
    return true;
  }, [currentStep]);

  const handlePrimary = useCallback(() => {
    if (stepIndex < totalSteps - 1) {
      if (!validateCurrent()) return;
      setStepIndex(prev => prev + 1);
    } else {
      handleSubmit();
    }
  }, [handleSubmit, stepIndex, totalSteps, validateCurrent]);

  const handleSkip = useCallback(() => {
    if (currentStep.required) return;
    setStepIndex(prev => Math.min(prev + 1, totalSteps - 1));
  }, [currentStep.required, totalSteps]);

  const isLastStep = stepIndex === totalSteps - 1;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={20}
      style={styles.screen}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps='handled'
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.progressRow}>
          <Text style={styles.progressText}>{`${stepIndex + 1}/${totalSteps}`}</Text>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${((stepIndex + 1) / totalSteps) * 100}%` },
              ]}
            />
          </View>
        </View>

        <View style={styles.stepCard}>
          <Text style={styles.title}>{currentStep.title}</Text>
          <Text style={styles.subtitle}>{currentStep.description}</Text>

          {currentStep.key === 'menu' || currentStep.key === 'tags' ? (
            <View style={styles.menuContainer}>
              {(currentStep.value as ItemWithId[]).map((item, idx) => (
                <TextInput
                  key={item.id}
                  value={item.value}
                  onChangeText={text => {
                    const newItems = [...(currentStep.value as ItemWithId[])];
                    newItems[idx] = { ...newItems[idx], value: text };
                    (currentStep.onChange as (items: ItemWithId[]) => void)(newItems);
                  }}
                  style={styles.input}
                  placeholder={`${currentStep.placeholder}${idx > 0 ? ` ${idx + 1}` : ''}`}
                  placeholderTextColor={palette.tertiaryText}
                  keyboardType={currentStep.keyboardType}
                />
              ))}
              <Pressable
                onPress={() => {
                  const prefix = currentStep.key === 'menu' ? 'menu' : 'tag';
                  const newItems = [
                    ...(currentStep.value as ItemWithId[]),
                    {
                      id: `${prefix}-${Date.now()}-${Math.random()}`,
                      value: '',
                    },
                  ];
                  (currentStep.onChange as (items: ItemWithId[]) => void)(newItems);
                }}
                style={styles.addMenuBtn}
              >
                <Text style={styles.addMenuText}>
                  + {currentStep.key === 'menu' ? 'メニュー' : 'タグ'}を追加
                </Text>
              </Pressable>
            </View>
          ) : currentStep.key === 'budget' ? (
            <View style={styles.budgetContainer}>
              <View style={styles.budgetRow}>
                <View style={styles.budgetInputWrapper}>
                  <Text style={styles.budgetLabel}>最小値（円）</Text>
                  <TextInput
                    value={(currentStep.value as Record<string, string>).min}
                    onChangeText={
                      (currentStep.onChange as Record<string, (text: string) => void>).min
                    }
                    style={styles.input}
                    placeholder={(currentStep.placeholder as Record<string, string>).min}
                    placeholderTextColor={palette.tertiaryText}
                    keyboardType='number-pad'
                  />
                </View>
                <Text style={styles.budgetSeparator}>〜</Text>
                <View style={styles.budgetInputWrapper}>
                  <Text style={styles.budgetLabel}>最大値（円）</Text>
                  <TextInput
                    value={(currentStep.value as Record<string, string>).max}
                    onChangeText={
                      (currentStep.onChange as Record<string, (text: string) => void>).max
                    }
                    style={styles.input}
                    placeholder={(currentStep.placeholder as Record<string, string>).max}
                    placeholderTextColor={palette.tertiaryText}
                    keyboardType='number-pad'
                  />
                </View>
              </View>
            </View>
          ) : (
            <TextInput
              value={currentStep.value as string}
              onChangeText={currentStep.onChange as (text: string) => void}
              style={styles.input}
              placeholder={currentStep.placeholder as string}
              placeholderTextColor={palette.tertiaryText}
              keyboardType={currentStep.keyboardType}
            />
          )}
        </View>
      </ScrollView>

      <View style={styles.actionArea}>
        {!currentStep.required && !isLastStep && (
          <Pressable onPress={handleSkip} style={styles.skipBtn}>
            <Text style={styles.skipText}>スキップ</Text>
          </Pressable>
        )}

        <View style={styles.buttonContainer}>
          <Pressable
            onPress={handlePrimary}
            disabled={loading}
            style={({ pressed }) => [
              styles.buttonPressable,
              (pressed || loading) && { opacity: 0.8 },
            ]}
          >
            <Text style={styles.buttonText}>
              {loading ? '送信中…' : isLastStep ? '登録する' : '次へ'}
            </Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  actionArea: {
    gap: 10,
    paddingBottom: 64,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  addMenuBtn: {
    alignItems: 'center',
    borderColor: palette.border,
    borderRadius: 12,
    borderStyle: 'dashed',
    borderWidth: 2,
    paddingVertical: 12,
  },
  addMenuText: {
    color: palette.accent,
    fontFamily: fonts.medium,
    fontSize: 14,
  },
  budgetContainer: {
    gap: 12,
  },
  budgetInputWrapper: {
    flex: 1,
  },
  budgetLabel: {
    color: palette.secondaryText,
    fontFamily: fonts.medium,
    fontSize: 12,
    marginBottom: 6,
  },
  budgetRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 12,
  },
  budgetSeparator: {
    color: palette.primaryText,
    fontFamily: fonts.medium,
    fontSize: 18,
    marginBottom: 12,
  },
  buttonContainer: {
    backgroundColor: palette.button,
    borderColor: palette.buttonBorder,
    borderRadius: 999,
    borderWidth: 1,
    elevation: 4,
    height: 48,
    minWidth: 180,
    overflow: 'hidden',
    shadowColor: palette.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
  },
  buttonPressable: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  buttonText: {
    color: palette.surface,
    fontFamily: fonts.medium,
    fontSize: 16,
    lineHeight: 48,
    textAlign: 'center',
  },
  content: { flexGrow: 1, padding: 20 },
  input: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 12,
    borderWidth: 1,
    color: palette.primaryText,
    fontFamily: fonts.regular,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  menuContainer: {
    gap: 12,
  },
  progressBarBg: {
    backgroundColor: palette.border,
    borderRadius: 999,
    flex: 1,
    height: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    backgroundColor: palette.accent,
    height: '100%',
  },
  progressRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  progressText: {
    color: palette.primaryText,
    fontFamily: fonts.medium,
    fontSize: 14,
  },
  screen: { backgroundColor: palette.background, flex: 1 },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  skipText: {
    color: palette.secondaryText,
    fontFamily: fonts.medium,
    fontSize: 14,
  },
  stepCard: {
    backgroundColor: palette.surface,
    borderRadius: 18,
    elevation: 3,
    gap: 12,
    padding: 16,
    shadowColor: palette.shadow,
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  subtitle: {
    color: palette.secondaryText,
    fontFamily: fonts.regular,
    marginTop: 4,
  },
  title: {
    color: palette.primaryText,
    fontFamily: fonts.medium,
    fontSize: 22,
  },
});
