import { Ionicons } from '@expo/vector-icons';
import { palette } from '@team/mobile-ui';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { useReviews } from '@/features/reviews/ReviewsContext';
import { useStores } from '@/features/stores/StoresContext';
import { api } from '@/lib/api';

import type { ComponentProps } from 'react';

type RatingOption = { value: number; label: string; icon: ComponentProps<typeof Ionicons>['name'] };
type ReviewStep = {
  key: 'ratings' | 'comment' | 'extras';
  title: string;
  optional: boolean;
};

// レビュー投稿画面のコンポーネント
export default function ReviewModalScreen() {
  // URLパラメータから店舗IDを取得
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter(); // 画面遷移用
  const navigation = useNavigation();
  const { addReview } = useReviews(); // レビュー追加関数
  const { getStoreById, loading: storesLoading } = useStores();

  // 店舗情報を取得
  const shop = useMemo(() => (id ? getStoreById(id) : undefined), [getStoreById, id]);
  const [menuOptions, setMenuOptions] = useState<{ id: string; name: string }[]>([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const menu = menuOptions.length > 0 ? menuOptions : (shop?.menu ?? []);

  // ヘッダータイトルを設定
  useLayoutEffect(() => {
    navigation.setOptions?.({
      title: 'レビュー',
      headerBackTitle: '戻る',
      headerStyle: { backgroundColor: palette.accent },
      headerTintColor: palette.textOnAccent,
      headerShadowVisible: false,
      headerTitleAlign: 'center',
    });
  }, [navigation]);

  useEffect(() => {
    if (!id) return;
    let active = true;
    setMenuLoading(true);
    api.fetchStoreMenus(id)
      .then(menus => {
        if (!active) return;
        const mapped = menus.map(item => ({
          id: item.menu_id,
          name: item.name,
        }));
        setMenuOptions(mapped);
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) {
          setMenuLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [id]);

  // ユーザー入力用のstate
  const ratingCategories = useMemo(
    () => [
      { key: 'taste', label: '味' },
      { key: 'atmosphere', label: '雰囲気' },
      { key: 'cleanliness', label: '清潔感' },
      { key: 'service', label: '接客' },
      { key: 'speed', label: '提供速度' },
    ],
    []
  );
  const ratingOptions = useMemo<RatingOption[]>(
    () => [
      { value: 5, label: '満足', icon: 'happy-outline' },
      { value: 4, label: '普通', icon: 'remove-outline' },
      { value: 2, label: '不満', icon: 'sad-outline' },
    ],
    [],
  );
  const [categoryRatings, setCategoryRatings] = useState<Record<string, number>>(() =>
    Object.fromEntries(ratingCategories.map(category => [category.key, 0]))
  );
  const [comment, setComment] = useState(''); // コメント
  const [suggestion, setSuggestion] = useState('');
  const [selectedMenuIds, setSelectedMenuIds] = useState<string[]>([]); // メニュー選択
  const [assets, setAssets] = useState<ImagePicker.ImagePickerAsset[]>([]); // 添付画像
  const [submitting, setSubmitting] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const getRatingColor = (value: number) => {
    if (value === 5) return palette.errorText;
    if (value === 4) return palette.accent;
    return '#264053';
  };

  const steps = useMemo<ReviewStep[]>(() => {
    const hasMenuStep = menuLoading || menu.length > 0;
    const result: ReviewStep[] = [
      { key: 'ratings', title: '項目別評価', optional: true },
      { key: 'comment', title: 'コメント', optional: true },
    ];
    if (hasMenuStep) {
      result.push({ key: 'extras', title: 'メニュー・写真', optional: true });
    } else {
      result.push({ key: 'extras', title: '写真（任意）', optional: true });
    }
    return result;
  }, [menu.length, menuLoading]);

  const totalSteps = steps.length;
  const currentStep = steps[stepIndex];
  const isLastStep = stepIndex === totalSteps - 1;

  const hasStepInput = useMemo(() => {
    if (currentStep.key === 'ratings') {
      return ratingCategories.some(category => (categoryRatings[category.key] ?? 0) > 0);
    }
    if (currentStep.key === 'comment') {
      return comment.trim().length > 0 || suggestion.trim().length > 0;
    }
    return selectedMenuIds.length > 0 || assets.length > 0;
  }, [
    assets.length,
    categoryRatings,
    comment,
    currentStep.key,
    ratingCategories,
    selectedMenuIds,
    suggestion,
  ]);

  useEffect(() => {
    if (stepIndex >= totalSteps) {
      setStepIndex(Math.max(totalSteps - 1, 0));
    }
  }, [stepIndex, totalSteps]);

  const handlePickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 6,
      quality: 0.8,
    });
    if (!result.canceled) {
      setAssets(result.assets);
    }
  };

  const handleSubmit = async () => {
    const ratings = ratingCategories.map(category => categoryRatings[category.key] ?? 0);
    const ratedValues = ratings.filter(value => value > 0);
    if (!shop) return;

    const averagedRating =
      ratedValues.length > 0
        ? Math.round(ratedValues.reduce((sum, value) => sum + value, 0) / ratedValues.length)
        : 0;
    const trimmedComment = comment.trim();
    const trimmedSuggestion = suggestion.trim();
    const combinedComment = trimmedSuggestion
      ? `${trimmedComment}${trimmedComment ? '\n\n' : ''}目安箱: ${trimmedSuggestion}`
      : trimmedComment;

    setSubmitting(true);
    try {
      const selectedMenus = menu.filter(item => selectedMenuIds.includes(item.id));
      // カテゴリ評価をratingDetails形式に変換
      const ratingDetails = {
        taste: categoryRatings.taste ?? null,
        atmosphere: categoryRatings.atmosphere ?? null,
        service: categoryRatings.service ?? null,
        speed: categoryRatings.speed ?? null,
        cleanliness: categoryRatings.cleanliness ?? null,
      }
      await addReview(
        shop.id,
        {
          rating: averagedRating,
          ratingDetails,
          comment: combinedComment,
          menuItemIds: selectedMenuIds,
          menuItemName:
            selectedMenus.length > 0 ? selectedMenus.map(item => item.name).join(' / ') : undefined,
        },
        assets.map((asset, index) => ({
          uri: asset.uri,
          fileName: asset.fileName ?? `review-${Date.now()}-${index}.jpg`,
          contentType: asset.mimeType ?? 'image/jpeg',
          fileSize: asset.fileSize ?? undefined,
        }))
      );
      router.back();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      if (message === 'auth_required') {
        Alert.alert('ログインが必要です', 'レビュー投稿にはログインが必要です。', [
          { text: 'キャンセル', style: 'cancel' },
          { text: 'ログイン', onPress: () => router.push('/login') },
        ]);
      } else {
        Alert.alert('投稿に失敗しました', message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    if (stepIndex < totalSteps - 1) {
      setStepIndex(prev => Math.min(prev + 1, totalSteps - 1));
      return;
    }

    handleSubmit();
  };

  const actionLabel = useMemo(() => {
    if (isLastStep) return submitting ? '投稿中…' : '投稿する';
    if (currentStep.optional && !hasStepInput) return 'スキップ';
    return '次へ';
  }, [currentStep.optional, hasStepInput, isLastStep, submitting]);

  // 店舗が見つからない場合の表示
  if (storesLoading) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <Text style={styles.title}>店舗情報を読み込み中...</Text>
      </View>
    );
  }

  if (!shop) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <Text style={styles.title}>店舗が見つかりませんでした</Text>
        <Pressable style={styles.secondaryBtn} onPress={() => router.back()}>
          <Text style={styles.secondaryBtnText}>閉じる</Text>
        </Pressable>
      </View>
    );
  }

  // レビュー投稿画面の表示
  return (
    <View style={styles.screen}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        {/* 店舗名 */}
        <Text style={styles.heading}>{shop.name}</Text>
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
          <Text style={styles.stepTitle}>{currentStep.title}</Text>

          {currentStep.key === 'ratings' && (
            <View>
              {ratingCategories.map(category => (
                <View key={category.key} style={styles.categoryBlock}>
                  <Text style={styles.categoryLabel}>{category.label}</Text>
                  <View style={styles.ratingRow}>
                    {ratingOptions.map(option => (
                      <Pressable
                        key={option.value}
                        onPress={() => {
                          setCategoryRatings(prev => ({
                            ...prev,
                            [category.key]: prev[category.key] === option.value ? 0 : option.value,
                          }));
                        }}
                        style={[
                          styles.ratingOption,
                          (categoryRatings[category.key] ?? 0) === option.value
                            ? [
                                styles.ratingOptionActive,
                                { borderColor: getRatingColor(option.value) },
                              ]
                            : undefined,
                        ]}
                      >
                        <Ionicons
                          name={option.icon}
                          size={18}
                          color={
                            (categoryRatings[category.key] ?? 0) === option.value
                              ? getRatingColor(option.value)
                              : palette.muted
                          }
                        />
                        <Text
                          style={[
                            styles.ratingOptionText,
                            (categoryRatings[category.key] ?? 0) === option.value
                              ? { color: getRatingColor(option.value) }
                              : undefined,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          )}

          {currentStep.key === 'comment' && (
            <View>
              <TextInput
                value={comment}
                onChangeText={setComment}
                placeholder='雰囲気・味・接客など自由に書いてください'
                placeholderTextColor={palette.muted}
                multiline
                style={styles.input}
              />
              <Text style={styles.suggestionLabel}>目安箱（お気軽にご意見をお聞かせください）</Text>
              <TextInput
                value={suggestion}
                onChangeText={setSuggestion}
                placeholder='ご意見・ご要望があればご記入ください'
                placeholderTextColor={palette.muted}
                multiline
                style={styles.suggestionInput}
              />
            </View>
          )}

          {currentStep.key === 'extras' && (
            <View>
              {menuLoading && menu.length === 0 ? (
                <Text style={styles.muted}>メニューを読み込み中...</Text>
              ) : menu.length > 0 ? (
                <View>
                  <View style={styles.menuList}>
                    {menu.map(item => {
                      const selected = selectedMenuIds.includes(item.id);
                      return (
                        <Pressable
                          key={item.id}
                          onPress={() =>
                            setSelectedMenuIds(prev =>
                              selected ? prev.filter(id => id !== item.id) : [...prev, item.id]
                            )
                          }
                          style={[styles.menuItem, selected && styles.menuItemSelected]}
                        >
                          <Text
                            style={[styles.menuItemText, selected && styles.menuItemTextSelected]}
                          >
                            {item.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  <Text style={styles.muted}>
                    メニューは任意です。複数選択できます。該当が無ければ未選択でOK。
                  </Text>
                </View>
              ) : (
                <Text style={styles.muted}>メニュー情報がありません。</Text>
              )}
              <View style={styles.photoSection}>
                <Pressable
                  style={styles.secondaryBtn}
                  onPress={handlePickImages}
                  disabled={submitting}
                >
                  <Text style={styles.secondaryBtnText}>写真を選択</Text>
                </Pressable>
                {assets.length > 0 && (
                  <View style={styles.imageGrid}>
                    {assets.map(asset => (
                      <View key={asset.uri} style={styles.imageWrapper}>
                        <Image
                          source={{ uri: asset.uri }}
                          style={styles.imageThumb}
                          contentFit='cover'
                        />
                        <Pressable
                          style={styles.removeImageBtn}
                          onPress={() =>
                            setAssets(prev => prev.filter(item => item.uri !== asset.uri))
                          }
                          disabled={submitting}
                        >
                          <Text style={styles.removeImageText}>×</Text>
                        </Pressable>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.actionArea}>
        <Pressable
          style={[styles.primaryBtn, hasStepInput ? styles.primaryBtnActive : undefined]}
          onPress={handleNext}
          disabled={submitting}
        >
          <Text
            style={[styles.primaryBtnText, hasStepInput ? styles.primaryBtnTextActive : undefined]}
          >
            {actionLabel}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// スタイル定義（見た目の調整）
const styles = StyleSheet.create({
  actionArea: {
    gap: 12,
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  categoryBlock: { marginBottom: 4 },
  categoryLabel: { color: palette.primary, fontWeight: '600', marginBottom: 4 },
  centered: { alignItems: 'center', justifyContent: 'center' }, // 中央寄せ
  content: { padding: 16 }, // 画面内余白
  heading: { color: palette.primary, fontSize: 18, fontWeight: '800', marginBottom: 8 }, // 店舗名
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  imageThumb: { borderRadius: 12, height: 88, width: 88 },
  imageWrapper: { position: 'relative' },
  input: {
    backgroundColor: palette.background,
    borderColor: palette.border,
    borderRadius: 12,
    borderWidth: 1,
    color: palette.primary,
    minHeight: 100,
    padding: 12,
  },
  menuItem: {
    backgroundColor: palette.menuBackground,
    borderColor: palette.border,
    borderRadius: 999,
    borderWidth: 1,
    marginRight: 8,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  menuItemSelected: {
    backgroundColor: palette.menuSelectedBackground,
    borderColor: palette.menuSelectedBorder,
  },
  menuItemText: { color: palette.primary, fontWeight: '600' },
  menuItemTextSelected: { color: palette.menuSelectedText },
  menuList: { flexDirection: 'row', flexWrap: 'wrap' },
  muted: { color: palette.muted, marginTop: 6 },
  photoSection: { marginTop: 16 },
  primaryBtn: {
    backgroundColor: palette.white,
    borderColor: palette.accent,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
  },
  primaryBtnActive: {
    backgroundColor: palette.accent,
  },
  primaryBtnText: {
    color: palette.accent,
    fontWeight: '700',
    textAlign: 'center',
  },
  primaryBtnTextActive: {
    color: palette.textOnAccent,
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
    marginBottom: 16,
  },
  progressText: { color: palette.muted, fontWeight: '700', marginRight: 12 },
  ratingOption: {
    alignItems: 'center',
    backgroundColor: palette.menuBackground,
    borderColor: palette.border,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    marginRight: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  ratingOptionActive: {
    backgroundColor: palette.menuSelectedBackground,
    borderColor: palette.menuSelectedBorder,
  },
  ratingOptionText: { color: palette.muted, fontWeight: '700' },
  ratingRow: { flexDirection: 'row', marginBottom: 8 },
  removeImageBtn: {
    backgroundColor: palette.primary,
    borderRadius: 10,
    height: 20,
    position: 'absolute',
    right: -6,
    top: -6,
    width: 20,
  },
  removeImageText: {
    color: palette.primaryOnAccent,
    fontSize: 12,
    textAlign: 'center',
  },
  screen: { backgroundColor: palette.surface, flex: 1 },
  secondaryBtn: {
    backgroundColor: palette.secondarySurface,
    borderColor: palette.border,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  secondaryBtnText: {
    color: palette.primary,
    fontWeight: '700',
    textAlign: 'center',
  },
  stepCard: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  stepTitle: {
    color: palette.primary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  suggestionInput: {
    backgroundColor: palette.background,
    borderColor: palette.border,
    borderRadius: 12,
    borderWidth: 1,
    color: palette.primary,
    minHeight: 80,
    padding: 12,
  },
  suggestionLabel: {
    color: palette.muted,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  title: { color: palette.primary, fontSize: 18, fontWeight: '800' },
});
