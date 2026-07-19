import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';

interface ToggleProps {
  label?: string;
  value: boolean;
  onValueChange: (val: boolean) => void;
  trueLabel?: string;
  falseLabel?: string;
  containerStyle?: ViewStyle;
}

export function Toggle({
  label,
  value,
  onValueChange,
  trueLabel = 'Yes',
  falseLabel = 'No',
  containerStyle,
}: ToggleProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={[styles.btn, value && styles.btnActive]}
          onPress={() => onValueChange(true)}
        >
          <Text style={[styles.btnText, value && styles.btnTextActive]}>{trueLabel}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.7}
          style={[styles.btn, !value && styles.btnActive]}
          onPress={() => onValueChange(false)}
        >
          <Text style={[styles.btnText, !value && styles.btnTextActive]}>{falseLabel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  label: {
    flex: 1,
    fontSize: 14,
    color: '#334155',
    fontWeight: '500',
    paddingRight: 16,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 2,
  },
  btn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
  },
  btnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  btnText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  btnTextActive: {
    color: '#0F172A',
    fontWeight: '600',
  },
});
