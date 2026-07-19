import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme, Brand } from '../../theme/useAppTheme';
import { useAppStore } from '../../store/appStore';
import { useTranslation } from 'react-i18next';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const setTheme = useAppStore(s => s.setTheme);
  const themeMode = useAppStore(s => s.theme);
  const { colors, type, isDark } = useAppTheme();
  const { t, i18n } = useTranslation();

  return (
    <View style={[styles.root, { backgroundColor: colors.navy }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.navy} />

      <LinearGradient
        colors={[colors.bgStart, colors.bgMid, colors.bgEnd]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      <LinearGradient
        colors={[Brand.blue, Brand.teal]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.accentBar}
      />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: Brand.blueBorder }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            {t('profile.settings') || 'Settings'}
          </Text>
        </View>

        <View style={styles.content}>
          {/* Language Setting */}
          <View style={styles.settingBlock}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('profile.language')}</Text>
            <View style={styles.segmentWrap}>
              {(['en', 'hi', 'mr'] as const).map(lang => {
                const isSelected = i18n.language === lang;
                const label = lang === 'en' ? 'English' : lang === 'hi' ? 'हिंदी' : 'मराठी';
                return (
                  <TouchableOpacity
                    key={lang}
                    activeOpacity={0.8}
                    onPress={() => i18n.changeLanguage(lang)}
                    style={[
                      styles.segmentBtn,
                      { borderColor: Brand.blueBorder },
                      isSelected && { backgroundColor: Brand.teal, borderColor: Brand.teal }
                    ]}
                  >
                    <Text style={[styles.segmentText, { color: isSelected ? '#FFF' : colors.textPrimary }]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Theme Setting */}
          <View style={styles.settingBlock}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('profile.theme')}</Text>
            <View style={styles.segmentWrap}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setTheme('light')}
                style={[
                  styles.segmentBtn,
                  { borderColor: Brand.blueBorder },
                  themeMode === 'light' && { backgroundColor: Brand.teal, borderColor: Brand.teal }
                ]}
              >
                <Text style={[styles.segmentText, { color: themeMode === 'light' ? '#FFF' : colors.textPrimary }]}>
                  Light ☀️
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setTheme('dark')}
                style={[
                  styles.segmentBtn,
                  { borderColor: Brand.blueBorder },
                  themeMode === 'dark' && { backgroundColor: Brand.teal, borderColor: Brand.teal }
                ]}
              >
                <Text style={[styles.segmentText, { color: themeMode === 'dark' ? '#FFF' : colors.textPrimary }]}>
                  Dark 🌙
                </Text>
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
  accentBar: { height: 6, width: '100%', position: 'absolute', top: 0, zIndex: 10 },
  safeArea: { flex: 1, paddingTop: 6 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 8,
    marginRight: 16,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  content: {
    padding: 24,
  },
  settingBlock: {
    marginBottom: 32,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  segmentWrap: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
