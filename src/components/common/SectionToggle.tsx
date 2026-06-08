import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  LayoutChangeEvent,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { FontSize, FontWeight, Radius, Shadow, Spacing } from '../../constants/theme';
import { SectionType, SECTION_TYPES } from '../../constants';
import { useAppStore } from '../../store/appStore';

const SECTIONS: { key: SectionType; emoji: string }[] = [
  { key: 'Buying', emoji: '🏠' },
  { key: 'Selling', emoji: '📤' },
  { key: 'Rentals', emoji: '🔑' },
];

export default function SectionToggle() {
  const sectionType = useAppStore(s => s.sectionType);
  const setSectionType = useAppStore(s => s.setSectionType);
  const translateX = useRef(new Animated.Value(0)).current;
  const tabWidth = useRef(0);

  const handleLayout = (e: LayoutChangeEvent) => {
    tabWidth.current = e.nativeEvent.layout.width / SECTIONS.length;
    const idx = SECTIONS.findIndex(s => s.key === sectionType);
    translateX.setValue(idx * tabWidth.current);
  };

  const handlePress = (key: SectionType, idx: number) => {
    setSectionType(key);
    Animated.spring(translateX, {
      toValue: idx * tabWidth.current,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
  };

  return (
    <View style={styles.container} onLayout={handleLayout}>
      {/* Animated pill */}
      <Animated.View
        style={[styles.pill, { transform: [{ translateX }] }]}
      />
      {SECTIONS.map((s, idx) => {
        const active = sectionType === s.key;
        return (
          <TouchableOpacity
            key={s.key}
            style={styles.tab}
            onPress={() => handlePress(s.key, idx)}
            activeOpacity={0.7}>
            <Text style={styles.tabEmoji}>{s.emoji}</Text>
            <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
              {s.key}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: 4,
    position: 'relative',
    ...Shadow.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pill: {
    position: 'absolute',
    top: 4,
    left: 4,
    bottom: 4,
    width: `${100 / SECTIONS.length}%` as any,
    backgroundColor: Colors.brandTeal,
    borderRadius: Radius.md,
    ...Shadow.teal,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    gap: 5,
    zIndex: 1,
  },
  tabEmoji: { fontSize: 14 },
  tabLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
  },
  tabLabelActive: {
    color: Colors.white,
    fontWeight: FontWeight.bold,
  },
});
