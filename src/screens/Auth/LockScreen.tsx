import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { useAppTheme, Brand } from '../../theme/useAppTheme';
import { useAuthStore } from '../../store/authStore';
import { promptBiometricAuth } from '../../utils/biometrics';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function LockScreen() {
  const { colors, type } = useAppTheme();
  
  const appPin = useAuthStore(s => s.appPin);
  const biometricEnabled = useAuthStore(s => s.biometricEnabled);
  const setIsLocked = useAuthStore(s => s.setIsLocked);
  const logout = useAuthStore(s => s.logout);

  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleBiometricUnlock = useCallback(async () => {
    const success = await promptBiometricAuth('Unlock PropSeekr');
    if (success) {
      setIsLocked(false);
    }
  }, [setIsLocked]);

  useEffect(() => {
    if (biometricEnabled) {
      handleBiometricUnlock();
    }
  }, [biometricEnabled, handleBiometricUnlock]);

  const handleKeyPress = (num: string) => {
    if (error) setError(false);
    
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      
      if (newPin.length === 4) {
        setTimeout(() => verifyPin(newPin), 200);
      }
    }
  };

  const handleBackspace = () => {
    if (error) setError(false);
    setPin(prev => prev.slice(0, -1));
  };

  const verifyPin = (enteredPin: string) => {
    if (enteredPin === appPin) {
      setIsLocked(false);
    } else {
      setError(true);
      setPin('');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out?',
      'If you log out, you will need to enter your email and password next time.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: () => logout() }
      ]
    );
  };

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
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="shield-lock-outline" size={48} color={Brand.blue} />
            </View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Enter PIN</Text>
            <Text style={[styles.subtitle, { color: error ? '#EF4444' : colors.textSecondary }]}>
              {error ? 'Incorrect PIN. Try again.' : 'Please enter your 4-digit PIN'}
            </Text>
          </View>

          {/* Dots */}
          <View style={styles.dotsRow}>
            {[0, 1, 2, 3].map(i => (
              <View 
                key={i} 
                style={[
                  styles.dot, 
                  { backgroundColor: i < pin.length ? Brand.blue : colors.borderFaint },
                  error && { backgroundColor: '#EF4444' }
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
              {biometricEnabled ? (
                <TouchableOpacity 
                  style={[styles.numBtn, { backgroundColor: 'transparent' }]} 
                  onPress={handleBiometricUnlock}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="face-recognition" size={32} color={Brand.teal} />
                </TouchableOpacity>
              ) : (
                <View style={styles.numBtnEmpty} />
              )}
              
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

          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Text style={[styles.logoutText, { color: colors.textSecondary }]}>Forgot PIN? Log out</Text>
          </TouchableOpacity>

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
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(37,99,235,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 50,
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
    marginBottom: 40,
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
  logoutBtn: {
    padding: 16,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
