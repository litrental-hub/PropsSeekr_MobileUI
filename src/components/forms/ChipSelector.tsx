import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ViewStyle } from 'react-native';
import { Brand } from '../../theme/useAppTheme';

export interface ChipSelectorProps {
  options: string[];
  selected: string | string[];
  onSelect: (val: string) => void;
  multiSelect?: boolean;
  horizontal?: boolean;
  pillToggle?: boolean;
  themeColor?: string;
  style?: ViewStyle;
}

export function ChipSelector({
  options,
  selected,
  onSelect,
  multiSelect = false,
  horizontal = true,
  pillToggle = false,
  themeColor = Brand.teal,
  style,
}: ChipSelectorProps) {

  const isSelected = (opt: string) => {
    if (multiSelect && Array.isArray(selected)) return selected.includes(opt);
    return selected === opt;
  };

  const renderChip = (opt: string) => {
    const active = isSelected(opt);

    if (pillToggle) {
      return (
        <TouchableOpacity
          key={opt}
          activeOpacity={0.8}
          onPress={() => onSelect(opt)}
          style={[
            styles.pillChip,
            active ? { backgroundColor: themeColor } : styles.pillChipInactive,
          ]}
        >
          <Text style={[styles.pillChipText, active ? styles.pillChipTextActive : styles.pillChipTextInactive]}>
            {opt}
          </Text>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        key={opt}
        activeOpacity={0.7}
        onPress={() => onSelect(opt)}
        style={[
          styles.chip,
          active
            ? { backgroundColor: themeColor, borderColor: themeColor }
            : styles.chipInactive,
        ]}
      >
        <Text style={[styles.chipText, active ? styles.chipTextActive : styles.chipTextInactive]}>
          {opt}
        </Text>
      </TouchableOpacity>
    );
  };

  if (pillToggle) {
    return (
      <View style={[styles.pillContainer, style]}>
        {options.map(renderChip)}
      </View>
    );
  }

  if (horizontal) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.container, style]}
      >
        {options.map(renderChip)}
      </ScrollView>
    );
  }

  return (
    <View style={[styles.grid, style]}>
      {options.map(renderChip)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8, paddingVertical: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },

  // Standard chips
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  chipInactive: {
    backgroundColor: 'transparent',
    borderColor: Brand.blueBorder,
  },
  chipText: { fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: '#FFFFFF' },
  chipTextInactive: { color: '#94A3B8' },

  // Pill toggle (Transaction Type)
  pillContainer: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    borderWidth: 1.5,
    borderColor: Brand.blueBorder,
    borderRadius: 24,
    padding: 3,
    backgroundColor: 'rgba(37,99,235,0.08)',
  },
  pillChip: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pillChipInactive: { backgroundColor: 'transparent' },
  pillChipText: { fontSize: 14, fontWeight: '600' },
  pillChipTextActive: { color: '#FFFFFF' },
  pillChipTextInactive: { color: '#94A3B8' },
});
