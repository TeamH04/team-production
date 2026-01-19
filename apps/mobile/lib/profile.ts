import type { Gender } from '@team/types';

export function formatGenderLabel(value: Gender | string | null | undefined): string {
  if (!value) return '未設定';
  if (value === 'male') return '男性';
  if (value === 'female') return '女性';
  if (value === 'other') return 'その他';
  return value;
}

export function formatProviderLabel(value: string | null | undefined): string {
  if (!value) return '未設定';
  if (value === 'google') return 'Google';
  if (value === 'apple') return 'Apple';
  if (value === 'email') return 'メール';
  if (value === 'oauth') return 'OAuth';
  return value;
}
