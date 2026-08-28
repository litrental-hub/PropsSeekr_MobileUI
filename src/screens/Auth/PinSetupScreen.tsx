import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { useAppTheme, Brand } from '../../theme/useAppTheme';
import { useAuthStore } from '../../store/authStore';
import { checkBiometricSupport } from '../../utils/biometrics';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function PinSetupScreen() {
  const { colors, type } = useAppTheme();
  
  const setAppPin = useAuthStore(s => s.setAppPin);
  const setBiometricEnabled = useAuthStore(s => s.setBiometricEnabled);
  const setIsLocked = useAuthStore(s => s.setIsLocked);

  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  const handleKeyPress = (num: string) => {
    if (step === 'create') {
      if (pin.length < 4) {
        const newPin = pin + num;
        setPin(newPin);
        if (newPin.length === 4) {
          setTimeout(() => setStep('confirm'), 300);
        }
      }
    } else {
      if (confirmPin.length < 4) {
        const newConfirm = confirmPin + num;
        setConfirmPin(newConfirm);
        if (newConfirm.length === 4) {
          setTimeout(() => handleConfirmComplete(newConfirm), 300);
        }
      }
    }
  };

  const handleBackspace = () => {
    if (step === 'create') {
      setPin(prev => prev.slice(0, -1));
    } else {
      setConfirmPin(prev => prev.slice(0, -1));
    }
  };

  const handleConfirmComplete = async (finalConfirmPin: string) => {
    if (pin === finalConfirmPin) {
      // PIN matches!
      const isBioSupported = await checkBiometricSupport();
      if (isBioSupported) {
        Alert.alert(
          'Enable Biometrics?',
          'Would you like to use Face ID / Fingerprint alongside your PIN for faster unlock?',
          [
            { 
              text: 'No Thanks', 
              style: 'cancel', 
              onPress: () => finishSetup(pin, false) 
            },
            { 
              text: 'Enable', 
              onPress: () => finishSetup(pin, true) 
            }
          ]
        );
      } else {
        finishSetup(pin, false);
      }
    } else {
      Alert.alert('PIN Mismatch', 'The PINs did not match. Please try again.');
      setPin('');
      setConfirmPin('');
      setStep('create');
    }
  };

  const finishSetup = (finalPin: string, bioEnabled: boolean) => {
    setAppPin(finalPin);
    setBiometricEnabled(bioEnabled);
    setIsLocked(false); // They just set it up, they are unlocked
    // RootNavigator will automatically transition to MainTabs because isLocked is false and appPin is set.
  };

  const currentLength = step === 'create' ? pin.length : confirmPin.length;

  return (
    <View style={[styles.root, { backgroundColor: colors.navy }]}>
      <StatusBar barStyle={type === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.navy} />

      <LinearGradient
        colors={[colors.bgStart, colors.bgMid, colors.bgEnd]}
        locations={[0, 0.6, 1]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.header}>
            <MaterialCommunityIcons name="lock-outline" size={48} color={Brand.teal} style={{ marginBottom: 16 }} />
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              {step === 'create' ? 'Create a 4-Digit PIN' : 'Confirm your PIN'}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {step === 'create' 
                ? 'This PIN will be used to quickly unlock PropSeekr.' 
                : 'Please enter the PIN again to confirm.'}
            </Text>
          </View>

          {/* Dots */}
          <View style={styles.dotsRow}>
            {[0, 1, 2, 3].map(i => (
              <View 
                key={i} 
                style={[
                  styles.dot, 
                  { backgroundColor: i < currentLength ? Brand.teal : colors.borderFaint }
                ]} 
              />
            ))}
          </View>

          {/* Numpad */}
          <View style={styles.numpad}>
            {[
              ['1', '2', '3'],
              ['4', '5', '6'],
              ['7', '8', '9'],
            ].map((row, rIdx) => (
              <View key={rIdx} style={styles.numpadRow}>
                {row.map(num => (
                  <TouchableOpacity 
                    key={num} 
                    testID={`pin-key-${num}`}
                    style={[styles.numBtn, { backgroundColor: colors.cardBg }]} 
                    onPress={() => handleKeyPress(num)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.numText, { color: colors.textPrimary }]}>{num}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
            <View style={styles.numpadRow}>
              <View style={styles.numBtnEmpty} />
              <TouchableOpacity 
                style={[styles.numBtn, { backgroundColor: colors.cardBg }]} 
                onPress={() => handleKeyPress('0')}
                activeOpacity={0.7}
              >
                <Text style={[styles.numText, { color: colors.textPrimary }]}>0</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.numBtn, { backgroundColor: 'transparent' }]} 
                onPress={handleBackspace}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="backspace-outline" size={28} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safeArea: { flex: 1 },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 20,
    marginVertical: 40,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  numpad: {
    width: '100%',
    maxWidth: 320,
    gap: 16,
    marginBottom: 20,
  },
  numpadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  numBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numBtnEmpty: {
    width: 72,
    height: 72,
  },
  numText: {
    fontSize: 28,
    fontWeight: '600',
  },
});
