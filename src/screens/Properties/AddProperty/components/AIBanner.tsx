import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAddPropertyForm } from '../AddPropertyContext';
import { useAppTheme, Brand } from '../../../../theme/useAppTheme';

export function AIBanner() {
  const { updateState, isSimulatingAI, setIsSimulatingAI } = useAddPropertyForm();
  const { colors } = useAppTheme();
  const [prompt, setPrompt] = useState('');

  const handleSimulateAI = () => {
    if (!prompt.trim()) return;
    setIsSimulatingAI(true);
    setTimeout(() => {
      const isRent = prompt.toLowerCase().includes('rent');
      const isSale = prompt.toLowerCase().includes('sale') || prompt.toLowerCase().includes('sell');
      const isHouse = prompt.toLowerCase().includes('house') || prompt.toLowerCase().includes('villa');
      updateState({
        transactionType: isRent ? 'Rent' : isSale ? 'Sale' : 'Rent',
        propertyType: isHouse ? 'Independent House' : 'Flat/Apartment',
        city: 'Indore',
        areaLocality: 'Vijay Nagar',
        bhk: prompt.includes('3') ? '3BHK' : '2BHK',
        monthlyRent: isRent ? '25000' : '',
        salePrice: isSale ? '4500000' : '',
        furnishingStatus: prompt.toLowerCase().includes('fully') ? 'Fully Furnished' : 'Semi-Furnished',
      });
      setIsSimulatingAI(false);
      setPrompt('');
    }, 1500);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.cardBg, borderColor: Brand.blueBorder }]}>
      <View style={styles.row}>
        <MaterialCommunityIcons name="microphone" size={20} color="#A78BFA" style={styles.icon} />
        <TextInput
          style={[styles.input, { color: '#A78BFA' }]}
          placeholder="Type or speak... e.g. '2BHK flat for rent in Vijay Nagar'"
          placeholderTextColor="rgba(167,139,250,0.5)"
          value={prompt}
          onChangeText={setPrompt}
          multiline
          maxLength={150}
        />
        <TouchableOpacity
          style={[styles.btn, !prompt.trim() && styles.btnDisabled]}
          onPress={handleSimulateAI}
          disabled={!prompt.trim() || isSimulatingAI}
        >
          {isSimulatingAI ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <MaterialCommunityIcons name="arrow-up" size={18} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>
      <Text style={styles.subtext}>AI will auto-fill the rest of the fields ✨</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: { marginRight: 10 },
  input: {
    flex: 1,
    fontSize: 14,
    maxHeight: 60,
    padding: 0,
  },
  btn: {
    backgroundColor: '#7C3AED',
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  btnDisabled: { backgroundColor: 'rgba(124,58,237,0.3)' },
  subtext: {
    fontSize: 12,
    color: '#A78BFA',
    fontWeight: '500',
    marginTop: 10,
  },
});
