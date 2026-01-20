import { Ionicons } from '@expo/vector-icons';
import { HeaderBackButton, type HeaderBackButtonProps } from '@react-navigation/elements';
import {
  BORDER_RADIUS,
  LAYOUT,
  ROUTES,
  SHADOW_STYLES,
  TIMING,
  UI_LABELS,
  VALIDATION_MESSAGES,
} from '@team/constants';
import { palette, StationSelect } from '@team/mobile-ui';
import { useNavigation, useRouter, type Href } from 'expo-router';
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

import { fonts } from '@/constants/typography';
import {
  toStepData,
  validateStep,
  type AccessStep,
  type BudgetRangeStep,
  type ItemWithId,
  type MultiValueStep,
  type SingleValueStep,
} from '@/features/owner/logic/shop-registration';
import { api, type ApiStation } from '@/lib/api';

const HEADER_HEIGHT = LAYOUT.HEADER_HEIGHT;

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

type AccessStepUI = AccessStep & {
  onChange: { station: (text: string) => void; minutes: (text: string) => void };
  placeholder: { station: string; minutes: string };
};

type Step = SingleValueStepUI | MultiValueStepUI | BudgetRangeStepUI | AccessStepUI;

// 型ガード関数
function isBudgetRangeStep(step: Step): step is BudgetRangeStepUI {
  return 'isBudgetRange' in step && step.isBudgetRange === true;
}

function isAccessStep(step: Step): step is AccessStepUI {
  return 'isAccess' in step && step.isAccess === true;
}

function isMultiValueStep(step: Step): step is MultiValueStepUI {
  return 'isMultiple' in step && step.isMultiple === true;
}

function isSingleValueStep(step: Step): step is SingleValueStepUI {
  return !isBudgetRangeStep(step) && !isAccessStep(step) && !isMultiValueStep(step);
}

export default function RegisterShopScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const [storeName, setStoreName] = useState('');
  const [menuItems, setMenuItems] = useState<ItemWithId[]>([
    { id: `menu-${Date.now()}`, value: '' },
  ]);
  const [stationName, setStationName] = useState('');
  const [minutesFromStation, setMinutesFromStation] = useState('');
  const [tagItems, setTagItems] = useState<ItemWithId[]>([{ id: `tag-${Date.now()}`, value: '' }]);
  const [address, setAddress] = useState('');
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [loading, setLoading] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [isStationModalVisible, setIsStationModalVisible] = useState(false);
  const [stations, setStations] = useState<ApiStation[]>([]);

  const handleBack = useCallback(() => {
    if (stepIndex > 0) {
      setStepIndex(prev => Math.max(prev - 1, 0));
      return;
    }
    if (navigation.canGoBack?.()) {
      navigation.goBack();
    } else {
      router.replace(ROUTES.OWNER as Href);
    }
  }, [navigation, router, stepIndex]);

  useEffect(() => {
    // 駅データの取得
    const fetchStations = async () => {
      try {
        const data = await api.fetchStations();
        if (data) {
          setStations(data);
        }
      } catch {
        // 駅データの取得に失敗した場合は空のリストのまま
      }
    };
    fetchStations();
  }, []);

  useEffect(() => {
    navigation.setOptions?.({
      title: '店舗登録',
      headerBackTitle: UI_LABELS.BACK,
      headerTintColor: palette.textOnAccent,
      headerStyle: {
        backgroundColor: palette.accent,
        height: HEADER_HEIGHT,
      },
      headerTitleStyle: {
        color: palette.textOnAccent,
      },
      headerLeft: (props: HeaderBackButtonProps) => (
        <HeaderBackButton {...props} onPress={handleBack} />
      ),
    });
  }, [navigation, handleBack]);

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
        key: 'access',
        title: 'アクセス情報を入力',
        description: '最寄り駅と徒歩での所要時間を入力してください',
        value: { station: stationName, minutes: minutesFromStation },
        required: false,
        onChange: { station: setStationName, minutes: setMinutesFromStation },
        placeholder: { station: '例）渋谷駅', minutes: '例）5' },
        isAccess: true,
        keyboardType: 'default' as const,
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
    [
      address,
      minBudget,
      maxBudget,
      menuItems,
      minutesFromStation,
      stationName,
      storeName,
      tagItems,
    ],
  );

  const totalSteps = steps.length;
  const currentStep = steps[stepIndex];

  const validateCurrent = useCallback(() => {
    const result = validateStep(toStepData(currentStep));

    if (!result.isValid) {
      Alert.alert(
        result.errorTitle ?? VALIDATION_MESSAGES.INPUT_ERROR_TITLE,
        result.errorMessage ?? '入力内容を確認してください',
      );
      return false;
    }
    return true;
  }, [currentStep]);

  const validateAllSteps = useCallback(() => {
    for (let i = 0; i < steps.length; i += 1) {
      const result = validateStep(toStepData(steps[i]));
      if (!result.isValid) {
        Alert.alert(
          result.errorTitle ?? VALIDATION_MESSAGES.INPUT_ERROR_TITLE,
          result.errorMessage ?? '入力内容を確認してください',
        );
        setStepIndex(i);
        return false;
      }
    }
    return true;
  }, [steps]);

  const handleSubmit = useCallback(async () => {
    if (loading) return;
    if (!validateAllSteps()) return;

    try {
      setLoading(true);
      // TODO: Backend エンドポイントに置き換え予定。現在はモック送信。
      // 実際のペイロード: { storeName, menuItems, stationName, minutesFromStation, tags: tagItems, address, minBudget, maxBudget }
      await new Promise(resolve => setTimeout(resolve, TIMING.MOCK_SUBMIT_DELAY));
      Alert.alert('送信完了', '店舗登録リクエストを受け付けました');
      router.replace(ROUTES.OWNER as Href);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '送信に失敗しました';
      Alert.alert('エラー', message);
    } finally {
      setLoading(false);
    }
  }, [loading, router, validateAllSteps]);

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

          {isMultiValueStep(currentStep) ? (
            <View style={styles.menuContainer}>
              {currentStep.value.map((item, idx) => (
                <TextInput
                  key={item.id}
                  value={item.value}
                  onChangeText={text => {
                    const newItems = [...currentStep.value];
                    newItems[idx] = { ...newItems[idx], value: text };
                    currentStep.onChange(newItems);
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
                    ...currentStep.value,
                    {
                      id: `${prefix}-${Date.now()}-${Math.random()}`,
                      value: '',
                    },
                  ];
                  currentStep.onChange(newItems);
                }}
                style={styles.addMenuBtn}
              >
                <Text style={styles.addMenuText}>
                  + {currentStep.key === 'menu' ? 'メニュー' : 'タグ'}を追加
                </Text>
              </Pressable>
            </View>
          ) : isBudgetRangeStep(currentStep) ? (
            <View style={styles.budgetContainer}>
              <View style={styles.budgetRow}>
                <View style={styles.budgetInputWrapper}>
                  <Text style={styles.budgetLabel}>最小値（円）</Text>
                  <TextInput
                    value={currentStep.value.min}
                    onChangeText={currentStep.onChange.min}
                    style={styles.input}
                    placeholder={currentStep.placeholder.min}
                    placeholderTextColor={palette.tertiaryText}
                    keyboardType='number-pad'
                  />
                </View>
                <Text style={styles.budgetSeparator}>〜</Text>
                <View style={styles.budgetInputWrapper}>
                  <Text style={styles.budgetLabel}>最大値（円）</Text>
                  <TextInput
                    value={currentStep.value.max}
                    onChangeText={currentStep.onChange.max}
                    style={styles.input}
                    placeholder={currentStep.placeholder.max}
                    placeholderTextColor={palette.tertiaryText}
                    keyboardType='number-pad'
                  />
                </View>
              </View>
            </View>
          ) : isAccessStep(currentStep) ? (
            <View style={styles.accessContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>最寄り駅</Text>
                <Pressable
                  onPress={() => setIsStationModalVisible(true)}
                  style={[styles.inputWithIcon, styles.input]}
                >
                  <Ionicons
                    name='train'
                    size={20}
                    color={palette.secondaryText}
                    style={styles.icon}
                  />
                  <Text
                    style={[styles.inputFlex, !currentStep.value.station && styles.placeholderText]}
                  >
                    {currentStep.value.station || currentStep.placeholder.station}
                  </Text>
                </Pressable>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>徒歩（分）</Text>
                <View style={[styles.inputWithIcon, styles.input]}>
                  <Ionicons
                    name='walk'
                    size={20}
                    color={palette.secondaryText}
                    style={styles.icon}
                  />
                  <TextInput
                    value={currentStep.value.minutes}
                    onChangeText={currentStep.onChange.minutes}
                    style={styles.inputFlex}
                    placeholder={currentStep.placeholder.minutes}
                    placeholderTextColor={palette.tertiaryText}
                    keyboardType='number-pad'
                  />
                </View>
              </View>

              <StationSelect
                visible={isStationModalVisible}
                onClose={() => setIsStationModalVisible(false)}
                onSelect={currentStep.onChange.station}
                selectedStation={currentStep.value.station}
                stations={stations}
              />
            </View>
          ) : isSingleValueStep(currentStep) ? (
            <TextInput
              value={currentStep.value}
              onChangeText={currentStep.onChange}
              style={styles.input}
              placeholder={currentStep.placeholder}
              placeholderTextColor={palette.tertiaryText}
              keyboardType={currentStep.keyboardType}
            />
          ) : null}
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
  accessContainer: {
    gap: 16,
  },
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
    ...SHADOW_STYLES.DEFAULT,
    backgroundColor: palette.button,
    borderColor: palette.buttonBorder,
    borderRadius: BORDER_RADIUS.PILL,
    borderWidth: 1,
    height: LAYOUT.BUTTON_HEIGHT_LG,
    minWidth: 180,
    overflow: 'hidden',
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
    lineHeight: LAYOUT.BUTTON_HEIGHT_LG,
    textAlign: 'center',
  },
  content: { flexGrow: 1, padding: 20 },
  icon: {
    marginRight: 8,
  },
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
  inputFlex: {
    color: palette.primaryText,
    flex: 1,
    fontFamily: fonts.regular,
    paddingVertical: 0, // Icon alignment
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    color: palette.secondaryText,
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  inputWithIcon: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  menuContainer: {
    gap: 12,
  },
  placeholderText: {
    color: palette.tertiaryText,
  },
  progressBarBg: {
    backgroundColor: palette.border,
    borderRadius: BORDER_RADIUS.PILL,
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
    boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.05)',
    elevation: 3,
    gap: 12,
    padding: 16,
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
