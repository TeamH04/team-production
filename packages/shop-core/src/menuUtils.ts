import type { Shop } from './shops';

/**
 * メニュー情報を持つオブジェクト
 */
export type MenuItemContainer = {
  menuItemIds?: string[];
  menuItemName?: string;
};

/**
 * レビューに紐づくメニュー名を解決する
 *
 * 以下の優先順位で解決:
 * 1. menuItemName が設定されている場合はそれを返す
 * 2. menuItemIds が設定されている場合は、shop.menu から該当メニューの名前を取得し "/" で結合
 * 3. どちらもない場合は undefined
 *
 * @param shop 店舗情報（メニューリストを含む）
 * @param container メニューIDまたは名前を含むオブジェクト
 * @returns 解決されたメニュー名、または undefined
 *
 * @example
 * ```ts
 * const menuName = resolveMenuName(shop, review);
 * if (menuName) {
 *   console.log(`メニュー: ${menuName}`);
 * }
 * ```
 */
export function resolveMenuName(
  shop: Shop | undefined | null,
  container: MenuItemContainer,
): string | undefined {
  // menuItemName が設定されていればそれを優先
  if (container.menuItemName) {
    return container.menuItemName;
  }

  // menuItemIds がない、または空、または shop.menu がない場合
  if (!container.menuItemIds || container.menuItemIds.length === 0 || !shop?.menu) {
    return undefined;
  }

  // menuItemIds から該当するメニュー名を取得
  const names = shop.menu
    .filter(item => container.menuItemIds?.includes(item.id))
    .map(item => item.name);

  return names.length > 0 ? names.join(' / ') : undefined;
}
