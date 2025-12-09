import { palette } from '@/constants/palette';
import { useFavorites } from '@/features/favorites/FavoritesContext';
import { SHOPS } from '@/features/home/data/shops';
import { useRouter } from 'expo-router';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';

const BUDGET_LABEL: Record<string, string> = {
  '1': '〜1000円',
  '2': '1000〜2000円',
  '3': '2000〜3000円',
  '4': '3000円〜',
};

export default function FavoritesScreen() {
  const router = useRouter();
  const { favorites } = useFavorites();

  // お気に入りに登録されている店舗のみをフィルタリング
  const favoriteShops = SHOPS.filter(shop => favorites.has(shop.id));

  const handleShopPress = (shopId: string) => {
    router.push({ pathname: '/shop/[id]', params: { id: shopId } });
  };

  return (
    <View style={styles.container}>
      {/* タイトル */}
      <View style={styles.headerTextBlock}>
        <Text style={styles.screenTitle}>お気に入り</Text>
      </View>

      {/* お気に入り一覧 */}
      {favoriteShops.length > 0 ? (
        <FlatList
          data={favoriteShops}
          keyExtractor={item => item.id}
          scrollEnabled={true}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Pressable onPress={() => handleShopPress(item.id)} style={styles.shopCard}>
              <Image source={{ uri: item.imageUrl }} style={styles.shopImage} />
              <View style={styles.shopInfo}>
                <View style={styles.shopHeader}>
                  <Text style={styles.shopName}>{item.name}</Text>
                  <View style={styles.ratingBadge}>
                    <Text style={styles.ratingText}>{`★ ${item.rating.toFixed(1)}`}</Text>
                  </View>
                </View>
                <Text style={styles.shopMeta}>
                  {item.category} • 徒歩{item.distanceMinutes}分 • 予算{' '}
                  {BUDGET_LABEL[String(item.budget)]}
                </Text>
                <Text style={styles.shopDescription} numberOfLines={2}>
                  {item.description}
                </Text>
              </View>
            </Pressable>
          )}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>お気に入りが登録されていません</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: palette.background,
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  emptyState: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  emptyTitle: {
    color: palette.secondaryText,
    fontSize: 14,
  },
  headerTextBlock: {
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 20,
  },
  ratingBadge: {
    backgroundColor: palette.highlight,
    borderRadius: 999,
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  ratingText: {
    color: palette.ratingText,
    fontSize: 11,
    fontWeight: '600',
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  shopCard: {
    backgroundColor: palette.surface,
    borderRadius: 12,
    elevation: 2,
    flexDirection: 'row',
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: palette.shadow,
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  shopDescription: {
    color: palette.secondaryText,
    fontSize: 12,
    lineHeight: 16,
  },
  shopHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  shopImage: {
    height: 100,
    width: 100,
  },
  shopInfo: {
    flex: 1,
    padding: 12,
  },
  shopMeta: {
    color: palette.secondaryText,
    fontSize: 12,
    marginBottom: 4,
  },
  shopName: {
    color: palette.primaryText,
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
});
