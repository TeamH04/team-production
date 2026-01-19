import { useCallback, useState } from 'react';

export type CompositionHandlers = {
  onCompositionStart: () => void;
  onCompositionEnd: (event: { currentTarget: { value: string } }) => void;
};

export type UseCompositionInputOptions = {
  initialValue?: string;
  onValueChange?: (value: string) => void;
};

export type UseCompositionInputResult = {
  /** 現在の入力値 */
  value: string;
  /** 値を設定する関数 */
  setValue: (value: string) => void;
  /** IME変換中かどうか */
  isComposing: boolean;
  /** IME対応のイベントハンドラー */
  compositionHandlers: CompositionHandlers;
};

/**
 * IME対応の入力ロジックを提供するフック
 *
 * 日本語などのIME入力時に、変換確定前の値で検索が実行されることを防ぎます。
 * デバウンス検索と組み合わせる場合は、isComposingがtrueの間は検索をスキップしてください。
 *
 * @example
 * ```tsx
 * const { value, setValue, isComposing, compositionHandlers } = useCompositionInput({
 *   initialValue: '',
 *   onValueChange: (v) => console.log('値が変更されました:', v),
 * });
 *
 * // デバウンス検索との連携
 * useEffect(() => {
 *   if (isComposing) return;
 *   // ここでデバウンス検索を実行
 * }, [isComposing, value]);
 *
 * return (
 *   <input
 *     value={value}
 *     onChange={(e) => setValue(e.target.value)}
 *     {...compositionHandlers}
 *   />
 * );
 * ```
 */
export function useCompositionInput(
  options: UseCompositionInputOptions = {},
): UseCompositionInputResult {
  const { initialValue = '', onValueChange } = options;

  const [value, setValueInternal] = useState(initialValue);
  const [isComposing, setIsComposing] = useState(false);

  const setValue = useCallback(
    (newValue: string) => {
      setValueInternal(newValue);
      onValueChange?.(newValue);
    },
    [onValueChange],
  );

  const onCompositionStart = useCallback(() => {
    setIsComposing(true);
  }, []);

  const onCompositionEnd = useCallback(
    (event: { currentTarget: { value: string } }) => {
      setIsComposing(false);
      // IME変換確定時に最終的な値を反映
      const finalValue = event.currentTarget.value;
      setValueInternal(finalValue);
      onValueChange?.(finalValue);
    },
    [onValueChange],
  );

  const compositionHandlers: CompositionHandlers = {
    onCompositionStart,
    onCompositionEnd,
  };

  return {
    value,
    setValue,
    isComposing,
    compositionHandlers,
  };
}
