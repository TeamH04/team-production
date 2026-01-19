import { Ionicons } from '@expo/vector-icons';
import { SPACING, FONT_SIZE, BORDER_RADIUS } from '@team/constants';
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

import { palette } from '../palette';

interface AccordionSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  rightElement?: React.ReactNode;
}

export function AccordionSection({
  title,
  defaultOpen = false,
  children,
  rightElement,
}: AccordionSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <View style={styles.card}>
      <Pressable style={styles.header} onPress={() => setIsOpen(v => !v)}>
        <Text style={styles.title}>{title}</Text>
        {rightElement}
        <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={20} color={palette.muted} />
      </Pressable>
      {isOpen && <View style={styles.content}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.white,
    borderRadius: BORDER_RADIUS.XLARGE,
    elevation: 4,
    marginBottom: SPACING.LG,
    marginTop: SPACING.SM,
    padding: SPACING.LG,
    shadowColor: palette.shadow,
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: SPACING.MD,
  },
  content: {
    marginTop: SPACING.LG,
  },
  header: {
    alignItems: 'center',
    backgroundColor: palette.white,
    borderRadius: BORDER_RADIUS.LARGE,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.MD,
    paddingVertical: 10,
  },
  title: {
    color: palette.primary,
    flex: 1,
    fontSize: FONT_SIZE.XL,
    fontWeight: '700',
  },
});
