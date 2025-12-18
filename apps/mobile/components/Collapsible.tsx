import { PropsWithChildren, useState } from 'react';
import {
  LayoutAnimation,
  Platform,
  StyleSheet,
  TouchableOpacity,
  UIManager,
  View,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export function Collapsible({
  children,
  title,
  style,
  titleStyle,
  iconColor,
  contentContainerStyle,
}: PropsWithChildren & {
  title: string;
  style?: ViewStyle;
  titleStyle?: TextStyle;
  iconColor?: string;
  contentContainerStyle?: ViewStyle;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const theme = useColorScheme() ?? 'light';
  const rotation = useSharedValue(0);

  const toggleOpen = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsOpen(value => !value);
    rotation.value = withTiming(!isOpen ? 90 : 0, { duration: 200 });
  };

  const animatedIconStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  const resolvedIconColor = iconColor ?? (theme === 'light' ? Colors.light.icon : Colors.dark.icon);

  return (
    <View style={style}>
      <TouchableOpacity style={styles.heading} onPress={toggleOpen} activeOpacity={0.7}>
        <ThemedText type='defaultSemiBold' style={[styles.title, titleStyle]}>
          {title}
        </ThemedText>

        <Animated.View style={animatedIconStyle}>
          <IconSymbol name='chevron.right' size={20} weight='medium' color={resolvedIconColor} />
        </Animated.View>
      </TouchableOpacity>
      {isOpen && <View style={[styles.content, contentContainerStyle]}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    marginTop: 6,
  },
  heading: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  title: {
    flex: 1,
  },
});
