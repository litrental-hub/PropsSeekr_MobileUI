import React from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';

export type ChipState = 'allowed' | 'not_allowed' | 'ask' | 'unselected';

export interface MultiStateChipProps {
  label: string;
  state: ChipState;
  onPress: () => void;
}

export function MultiStateChip({ label, state, onPress }: MultiStateChipProps) {
  const getStyles = () => {
    switch (state) {
      case 'allowed':
        return { bg: '#D1FAE5', border: '#D1FAE5', text: '#065F46', icon: '✓' };
      case 'not_allowed':
        return { bg: '#FEE2E2', border: '#FEE2E2', text: '#991B1B', icon: '✗' };
      case 'ask':
        return { bg: '#FFFFFF', border: '#E5E7EB', text: '#6B7280', icon: '~' };
      default:
        return { bg: '#FFFFFF', border: '#E5E7EB', text: '#6B7280', icon: '' };
    }
  };

  const current = getStyles();

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        styles.chip,
        { backgroundColor: current.bg, borderColor: current.border }
      ]}
    >
      {current.icon ? <Text style={[styles.icon, { color: current.text }]}>{current.icon}</Text> : null}
      <Text style={[styles.label, { color: current.text }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  icon: {
    marginRight: 4,
    fontSize: 14,
    fontWeight: 'bold',
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
  },
});
