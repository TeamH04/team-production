import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { palette } from '@/constants/palette';
import { useReviews } from '@/features/reviews/ReviewsContext';
import { useStores } from '@/features/stores/StoresContext';
import { fetchStoreMenus } from '@/lib/api';

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
    fetchStoreMenus(id)
      .then(menus => {
        if (!active) return;
        const mapped = menus.map(item => ({
          id: item.menu_id,
          name: item.name,
        }));
        setMenuOptions(mapped);
      })
      .catch(err => {
        console.warn('Failed to load menus', err);
      })
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
  const [rating, setRating] = useState(0); // 評価（初期値0）
  const [comment, setComment] = useState(''); // コメント
  const [ratingError, setRatingError] = useState(false); // 評価エラー表示
  const [selectedMenuIds, setSelectedMenuIds] = useState<string[]>([]); // メニュー選択
  const [assets, setAssets] = useState<ImagePicker.ImagePickerAsset[]>([]); // 添付画像
  const [submitting, setSubmitting] = useState(false);

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
    if (rating === 0) {
      setRatingError(true);
      return;
    }
    if (!shop) return;

    setSubmitting(true);
    try {
      const selectedMenus = menu.filter(item => selectedMenuIds.includes(item.id));
      await addReview(
        shop.id,
        {
          rating,
          comment: comment.trim(),
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
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* 店舗名 */}
      <Text style={styles.heading}>{shop.name}</Text>
      {/* 評価（星） */}
      <Text style={styles.sectionLabel}>評価</Text>
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map(n => (
          <Pressable
            key={n}
            onPress={() => {
              setRating(n);
              setRatingError(false);
            }}
          >
            <Text style={[styles.star, n <= rating ? styles.starActive : undefined]}>★</Text>
          </Pressable>
        ))}
      </View>
      {ratingError && <Text style={styles.errorText}>※ 評価を選択してください</Text>}

      {/* コメント入力欄 */}
      <Text style={styles.sectionLabel}>コメント</Text>
      <TextInput
        value={comment}
        onChangeText={setComment}
        placeholder='雰囲気・味・接客など自由に書いてください'
        placeholderTextColor={palette.muted}
        multiline
        style={styles.input}
      />

      {/* メニュー選択（店舗にメニューがある場合のみ表示） */}
      {menuLoading && menu.length === 0 ? (
        <View style={styles.menuSection}>
          <Text style={styles.sectionLabel}>メニュー</Text>
          <Text style={styles.muted}>メニューを読み込み中...</Text>
        </View>
      ) : menu.length > 0 ? (
        <View style={styles.menuSection}>
          <Text style={styles.sectionLabel}>メニュー</Text>
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
                  <Text style={[styles.menuItemText, selected && styles.menuItemTextSelected]}>
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
      ) : null}

      {/* 画像アップロード */}
      <Text style={styles.sectionLabel}>写真（任意）</Text>
      <Pressable style={styles.secondaryBtn} onPress={handlePickImages} disabled={submitting}>
        <Text style={styles.secondaryBtnText}>写真を選択</Text>
      </Pressable>
      {assets.length > 0 && (
        <View style={styles.imageGrid}>
          {assets.map(asset => (
            <View key={asset.uri} style={styles.imageWrapper}>
              <Image source={{ uri: asset.uri }} style={styles.imageThumb} contentFit='cover' />
              <Pressable
                style={styles.removeImageBtn}
                onPress={() => setAssets(prev => prev.filter(item => item.uri !== asset.uri))}
                disabled={submitting}
              >
                <Text style={styles.removeImageText}>×</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}

      {/* 投稿ボタン */}
      <Pressable style={styles.primaryBtn} onPress={handleSubmit} disabled={submitting}>
        <Text style={styles.primaryBtnText}>{submitting ? '投稿中…' : '投稿する'}</Text>
      </Pressable>

      {/* キャンセルボタン */}
      <Pressable style={styles.secondaryBtn} onPress={() => router.back()} disabled={submitting}>
        <Text style={styles.secondaryBtnText}>キャンセル</Text>
      </Pressable>
    </ScrollView>
  );
}

// スタイル定義（見た目の調整）
const styles = StyleSheet.create({
  centered: { alignItems: 'center', justifyContent: 'center' }, // 中央寄せ
  content: { padding: 16 }, // 画面内余白
  errorText: { color: palette.errorText, fontSize: 14, marginTop: 4 }, // エラーメッセージ
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
  menuSection: { marginTop: 12 },
  muted: { color: palette.muted, marginTop: 6 },
  primaryBtn: {
    backgroundColor: palette.secondarySurface,
    borderRadius: 12,
    marginTop: 18,
    paddingVertical: 12,
  },
  primaryBtnText: {
    color: palette.primaryOnAccent,
    fontWeight: '700',
    textAlign: 'center',
  },
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
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  secondaryBtnText: {
    color: palette.primary,
    fontWeight: '700',
    textAlign: 'center',
  },
  sectionLabel: {
    color: palette.primary,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 12,
  },
  star: { color: palette.starInactive, fontSize: 22, marginRight: 4 },
  starActive: { color: palette.starHighlight },
  starsRow: { flexDirection: 'row', marginBottom: 8 },
  title: { color: palette.primary, fontSize: 18, fontWeight: '800' },
});
