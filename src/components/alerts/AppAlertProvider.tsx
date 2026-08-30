import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Brand, useAppTheme } from '../../theme/useAppTheme';

export interface AppAlertButton {
  text?: string;
  onPress?: () => unknown | Promise<unknown>;
  style?: 'default' | 'cancel' | 'destructive';
}

export interface AppAlertOptions {
  cancelable?: boolean;
  onDismiss?: () => void;
  tone?: 'success' | 'error' | 'warning' | 'info';
}

interface AppAlertRequest {
  title: string;
  message?: string;
  buttons: AppAlertButton[];
  options: AppAlertOptions;
}

interface AppAlertContextValue {
  alert: (
    title: string,
    message?: string,
    buttons?: AppAlertButton[],
    options?: AppAlertOptions,
  ) => void;
}

const AppAlertContext = createContext<AppAlertContextValue | null>(null);

const TONE_DETAILS = {
  success: { icon: 'check', color: Brand.teal, faint: 'rgba(16,185,129,0.14)' },
  error: { icon: 'alert-outline', color: '#EF4444', faint: 'rgba(239,68,68,0.12)' },
  warning: { icon: 'alert-circle-outline', color: '#F59E0B', faint: 'rgba(245,158,11,0.14)' },
  info: { icon: 'information-outline', color: Brand.blue, faint: 'rgba(37,99,235,0.12)' },
} as const;

function inferTone(title: string): NonNullable<AppAlertOptions['tone']> {
  const normalized = title.toLowerCase();
  if (/success|verified|resent|queued|saved|updated|✅/.test(normalized)) return 'success';
  if (/error|fail|invalid|denied|unavailable|not found|not saved|mismatch|limit|could not|❌/.test(normalized)) return 'error';
  if (/notice|warning|log out|delete|remove|retry|incomplete/.test(normalized)) return 'warning';
  return 'info';
}

export function AppAlertProvider({ children }: { children: React.ReactNode }) {
  const { colors } = useAppTheme();
  const [request, setRequest] = useState<AppAlertRequest | null>(null);

  const alert = useCallback<AppAlertContextValue['alert']>((title, message, buttons, options) => {
    setRequest({
      title,
      message,
      buttons: buttons?.length ? buttons : [{ text: 'OK' }],
      options: options ?? {},
    });
  }, []);

  const dismiss = useCallback((invokeDismiss = true) => {
    const onDismiss = request?.options.onDismiss;
    setRequest(null);
    if (invokeDismiss) onDismiss?.();
  }, [request]);

  const pressButton = useCallback((button: AppAlertButton) => {
    setRequest(null);
    requestAnimationFrame(() => {
      Promise.resolve(button.onPress?.()).catch(error => {
        console.warn('App alert action failed:', error);
      });
    });
  }, []);

  const contextValue = useMemo(() => ({ alert }), [alert]);
  const tone = request?.options.tone ?? inferTone(request?.title ?? '');
  const toneDetails = TONE_DETAILS[tone];
  const canDismiss = request?.options.cancelable !== false;
  const stackedButtons = (request?.buttons.length ?? 0) > 2;

  return (
    <AppAlertContext.Provider value={contextValue}>
      {children}
      <Modal
        visible={request !== null}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => canDismiss && dismiss()}
      >
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback onPress={() => canDismiss && dismiss()}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>

          <View
            accessibilityRole="alert"
            accessibilityViewIsModal
            style={[styles.card, { backgroundColor: colors.navy, borderColor: Brand.blueBorder }]}
          >
            <LinearGradient
              colors={[Brand.blue, Brand.teal]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.accent}
            />

            {canDismiss ? (
              <TouchableOpacity
                onPress={() => dismiss()}
                accessibilityRole="button"
                accessibilityLabel="Close alert"
                style={styles.closeButton}
              >
                <MaterialCommunityIcons name="close" size={21} color={colors.textDim} />
              </TouchableOpacity>
            ) : null}

            <View style={[styles.iconCircle, { backgroundColor: toneDetails.faint }]}>
              <MaterialCommunityIcons name={toneDetails.icon} size={29} color={toneDetails.color} />
            </View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>{request?.title}</Text>
            {request?.message ? (
              <Text style={[styles.message, { color: colors.textSecondary }]}>{request.message}</Text>
            ) : null}

            <View style={[styles.buttonGroup, stackedButtons && styles.stackedButtonGroup]}>
              {request?.buttons.map((button, index) => {
                const destructive = button.style === 'destructive';
                const cancel = button.style === 'cancel';
                const primary = !cancel && (destructive || request.buttons.length === 1 || index === request.buttons.length - 1);
                const outlined = !primary && !destructive;
                return (
                  <TouchableOpacity
                    key={`${button.text ?? 'OK'}-${index}`}
                    onPress={() => pressButton(button)}
                    activeOpacity={0.82}
                    accessibilityRole="button"
                    style={[
                      styles.button,
                      stackedButtons && styles.stackedButton,
                      outlined && styles.outlinedButton,
                      outlined && { backgroundColor: colors.inputBg },
                      destructive && styles.destructiveButton,
                      primary && !destructive && styles.primaryButtonWrap,
                    ]}
                  >
                    {primary && !destructive ? (
                      <LinearGradient
                        colors={[Brand.blue, Brand.teal]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.primaryButton}
                      >
                        <Text style={styles.primaryButtonText}>{button.text ?? 'OK'}</Text>
                      </LinearGradient>
                    ) : (
                      <Text style={[
                        styles.secondaryButtonText,
                        destructive ? styles.destructiveButtonText : { color: colors.textSecondary },
                      ]}>
                        {button.text ?? 'OK'}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </AppAlertContext.Provider>
  );
}

export function useAppAlert(): AppAlertContextValue {
  const context = useContext(AppAlertContext);
  if (!context) throw new Error('useAppAlert must be used inside AppAlertProvider.');
  return context;
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(2,6,23,0.72)',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 22,
    paddingTop: 29,
    paddingBottom: 22,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 22,
    elevation: 18,
  },
  accent: { position: 'absolute', top: 0, left: 0, right: 0, height: 4 },
  closeButton: {
    position: 'absolute',
    right: 10,
    top: 11,
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  iconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: { fontSize: 20, lineHeight: 25, fontWeight: '900', textAlign: 'center', paddingHorizontal: 20 },
  message: { fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 9, marginBottom: 20 },
  buttonGroup: { flexDirection: 'row', gap: 10, marginTop: 20 },
  stackedButtonGroup: { flexDirection: 'column' },
  button: {
    flex: 1,
    minHeight: 49,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  stackedButton: { flex: 0, width: '100%' },
  primaryButtonWrap: { borderWidth: 0 },
  primaryButton: { width: '100%', minHeight: 49, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800', textAlign: 'center' },
  secondaryButtonText: { fontSize: 14, fontWeight: '800', textAlign: 'center', paddingHorizontal: 12 },
  outlinedButton: { borderColor: Brand.blueBorder },
  destructiveButton: { borderColor: '#EF4444', backgroundColor: '#EF4444' },
  destructiveButtonText: { color: '#FFFFFF' },
});
