import { createUseShopNavigator } from '@team/hooks';
import { useRouter } from 'expo-router';

export const useShopNavigator = createUseShopNavigator(useRouter);
