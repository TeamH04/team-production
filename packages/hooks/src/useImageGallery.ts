import { useCallback, useState } from 'react';

/**
 * 画像ギャラリー/カルーセルのオプション
 */
export type UseImageGalleryOptions<T> = {
  /** 画像配列 */
  images: T[];
  /** 初期インデックス（デフォルト: 0） */
  initialIndex?: number;
};

/**
 * 画像ギャラリー/カルーセルの戻り値
 */
export type UseImageGalleryResult<T> = {
  /** 現在の画像インデックス */
  currentIndex: number;
  /** 現在の画像 */
  currentImage: T | undefined;
  /** 画像配列 */
  images: T[];
  /** 画像の総数 */
  totalImages: number;
  /** 指定インデックスに移動（循環対応） */
  goToImage: (index: number) => void;
  /** 次の画像へ */
  goToNext: () => void;
  /** 前の画像へ */
  goToPrevious: () => void;
  /** 現在のインデックスを直接設定 */
  setCurrentIndex: (index: number) => void;
  /** 複数画像があるか */
  hasMultipleImages: boolean;
  /** 最初の画像か */
  isFirst: boolean;
  /** 最後の画像か */
  isLast: boolean;
};

/**
 * 画像ギャラリー/カルーセルのロジックを管理するカスタムフック
 *
 * @example
 * ```tsx
 * const { currentIndex, goToNext, goToPrevious, goToImage } = useImageGallery({
 *   images: ['image1.jpg', 'image2.jpg', 'image3.jpg'],
 * });
 * ```
 */
export function useImageGallery<T>({
  images,
  initialIndex = 0,
}: UseImageGalleryOptions<T>): UseImageGalleryResult<T> {
  const [currentIndex, setCurrentIndex] = useState(() => {
    if (images.length === 0) return 0;
    // 初期インデックスを有効な範囲に正規化
    return ((initialIndex % images.length) + images.length) % images.length;
  });

  const totalImages = images.length;
  const hasMultipleImages = totalImages > 1;
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === totalImages - 1;
  const currentImage = images[currentIndex];

  /**
   * 指定インデックスに移動（循環対応）
   * 負のインデックスや配列長を超えるインデックスも正しく処理
   */
  const goToImage = useCallback(
    (index: number) => {
      if (totalImages === 0) return;
      // モジュロ演算で循環させる
      const normalizedIndex = ((index % totalImages) + totalImages) % totalImages;
      setCurrentIndex(normalizedIndex);
    },
    [totalImages],
  );

  /**
   * 次の画像へ移動（最後の画像の場合は最初に戻る）
   */
  const goToNext = useCallback(() => {
    goToImage(currentIndex + 1);
  }, [currentIndex, goToImage]);

  /**
   * 前の画像へ移動（最初の画像の場合は最後に移動）
   */
  const goToPrevious = useCallback(() => {
    goToImage(currentIndex - 1);
  }, [currentIndex, goToImage]);

  return {
    currentIndex,
    currentImage,
    images,
    totalImages,
    goToImage,
    goToNext,
    goToPrevious,
    setCurrentIndex,
    hasMultipleImages,
    isFirst,
    isLast,
  };
}
