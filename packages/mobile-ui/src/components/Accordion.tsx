import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';

import { palette } from '../palette';

import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle, TextStyle } from 'react-native';

interface AccordionProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  titleColor?: string;
  iconColor?: string;
  containerStyle?: StyleProp<ViewStyle>;
  headerStyle?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}

export function Accordion({
  title,
  children,
  defaultOpen = false,
  titleColor = palette.primaryText,
  iconColor = palette.muted,
  containerStyle,
  headerStyle,
  titleStyle,
  contentStyle,
}: AccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <View style={[styles.container, containerStyle]}>
      <Pressable style={[styles.header, headerStyle]} onPress={() => setIsOpen(v => !v)}>
        <Text style={[styles.title, { color: titleColor }, titleStyle]}>{title}</Text>
        <Ionicons color={iconColor} name={isOpen ? 'chevron-up' : 'chevron-down'} size={20} />
      </Pressable>
      {isOpen && <View style={[styles.content, contentStyle]}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  content: {
    paddingTop: 8,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
});
