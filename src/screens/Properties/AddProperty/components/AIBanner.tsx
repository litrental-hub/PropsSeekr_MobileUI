import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
  Alert,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Voice, { SpeechResultsEvent, SpeechErrorEvent } from '@react-native-voice/voice';
import { useAddPropertyForm } from '../AddPropertyContext';
import { useAppTheme, Brand } from '../../../../theme/useAppTheme';

export function AIBanner() {
  const { updateState, isSimulatingAI, setIsSimulatingAI } = useAddPropertyForm();
  const { colors } = useAppTheme();
  const [prompt, setPrompt] = useState('');
  const [isListening, setIsListening] = useState(false);

  // Keep track of any text existing in prompt prior to starting speech recognition
  const basePromptRef = useRef(prompt);

  useEffect(() => {
    // Setup voice recognition listeners
    Voice.onSpeechResults = (e: SpeechResultsEvent) => {
      if (e.value && e.value.length > 0) {
        const recognizedText = e.value[0];
        const base = basePromptRef.current.trim();
        setPrompt(base ? `${base} ${recognizedText}` : recognizedText);
      }
      setIsListening(false);
    };

    Voice.onSpeechError = (e: SpeechErrorEvent) => {
      console.warn('Speech recognition error:', e.error);
      setIsListening(false);
    };

    Voice.onSpeechEnd = () => {
      setIsListening(false);
    };

    return () => {
      // Cleanup voice recognition on unmount
      Voice.destroy().then(Voice.removeAllListeners).catch(err => console.warn(err));
    };
  }, []);

  const handleToggleVoice = async () => {
    if (isListening) {
      try {
        await Voice.stop();
        setIsListening(false);
      } catch (e) {
        console.warn('Error stopping Voice:', e);
      }
      return;
    }

    // Request Android microphone runtime permission
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Access Required',
            message: 'PropSeekr needs microphone access so you can speak to fill property details using AI.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'Allow',
          }
        );

        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission Denied', 'Microphone access is required to use voice input.');
          return;
        }
      } catch (err) {
        console.warn('Failed to request RECORD_AUDIO permission:', err);
        return;
      }
    }

    try {
      basePromptRef.current = prompt;
      setIsListening(true);
      // Start voice recognition with Indian English model
      await Voice.start('en-IN');
    } catch (e: any) {
      console.warn('Failed to start speech recognition:', e);
      setIsListening(false);
      Alert.alert('Voice Unavailable', 'Could not access speech recognition services on this device.');
    }
  };

  const handleSimulateAI = async () => {
    if (!prompt.trim()) return;
    if (isListening) {
      try {
        await Voice.stop();
        setIsListening(false);
      } catch (err) {
        console.warn(err);
      }
    }

    setIsSimulatingAI(true);
    setTimeout(() => {
      const p = prompt.toLowerCase();
      const isRent = p.includes('rent') || p.includes('lease');
      const isSale = p.includes('sale') || p.includes('sell') || p.includes('buy');
      const isHouse = p.includes('house') || p.includes('villa') || p.includes('bungalow');
      
      updateState({
        transactionType: isRent ? 'Rent' : isSale ? 'Sale' : 'Rent',
        propertyType: isHouse ? 'Independent House' : 'Flat/Apartment',
        city: 'Indore',
        areaLocality: 'Vijay Nagar',
        bhk: p.includes('3') ? '3BHK' : p.includes('1') ? '1BHK' : p.includes('4') ? '4BHK' : '2BHK',
        monthlyRent: isRent ? '25000' : '',
        salePrice: isSale ? '4500000' : '',
        furnishingStatus: p.includes('fully') ? 'Fully Furnished' : p.includes('unfurnished') ? 'Unfurnished' : 'Semi-Furnished',
      });
      setIsSimulatingAI(false);
      setPrompt('');
    }, 1500);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.cardBg, borderColor: isListening ? '#EF4444' : Brand.blueBorder }]}>
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.micBtn, isListening && styles.micBtnActive]}
          onPress={handleToggleVoice}
          activeOpacity={0.7}
          disabled={isSimulatingAI}
        >
          <MaterialCommunityIcons
            name={isListening ? 'microphone' : 'microphone-outline'}
            size={22}
            color={isListening ? '#FFFFFF' : '#A78BFA'}
          />
        </TouchableOpacity>

        <TextInput
          style={[styles.input, { color: '#A78BFA' }]}
          placeholder={isListening ? 'Listening... speak now 🎙️' : "Type or speak... e.g. '2BHK flat for rent in Vijay Nagar'"}
          placeholderTextColor="rgba(167,139,250,0.5)"
          value={prompt}
          onChangeText={setPrompt}
          multiline
          maxLength={150}
        />

        <TouchableOpacity
          style={[styles.btn, (!prompt.trim() || isSimulatingAI) && styles.btnDisabled]}
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
      <Text style={[styles.subtext, isListening && { color: '#EF4444', fontWeight: '700' }]}>
        {isListening ? '🎙️ Recording audio... Tap mic icon again to stop' : 'AI will auto-fill the rest of the fields ✨'}
      </Text>
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
  micBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    backgroundColor: 'rgba(167,139,250,0.1)',
  },
  micBtnActive: {
    backgroundColor: '#EF4444',
  },
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
  btnDisabled: {
    backgroundColor: 'rgba(124,58,237,0.3)',
  },
  subtext: {
    fontSize: 12,
    color: '#A78BFA',
    fontWeight: '500',
    marginTop: 10,
  },
});
