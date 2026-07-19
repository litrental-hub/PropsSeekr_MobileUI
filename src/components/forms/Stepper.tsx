import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface StepperProps {
  label: string;
  value: number;
  onValueChange: (val: number) => void;
  min?: number;
  max?: number;
  containerStyle?: ViewStyle;
}

export function Stepper({
  label,
  value,
  onValueChange,
  min = 0,
  max = 99,
  containerStyle,
}: StepperProps) {
  const handleMinus = () => {
    if (value > min) onValueChange(value - 1);
  };

  const handlePlus = () => {
    if (value < max) onValueChange(value + 1);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.controls}>
        <TouchableOpacity 
          style={[styles.btn, value <= min && styles.btnDisabled]} 
          onPress={handleMinus}
          disabled={value <= min}
        >
          <MaterialCommunityIcons name="minus" size={20} color={value <= min ? '#CBD5E1' : '#334155'} />
        </TouchableOpacity>
        
        <Text style={styles.value}>{value}</Text>
        
        <TouchableOpacity 
          style={[styles.btn, value >= max && styles.btnDisabled]} 
          onPress={handlePlus}
          disabled={value >= max}
        >
          <MaterialCommunityIcons name="plus" size={20} color={value >= max ? '#CBD5E1' : '#334155'} />
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
    fontSize: 14,
    color: '#334155',
    fontWeight: '500',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  btn: {
    padding: 8,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  value: {
    width: 32,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
});
