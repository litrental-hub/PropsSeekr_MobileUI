import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { useAppTheme, Brand } from '../../theme/useAppTheme';

interface FormInputProps extends TextInputProps {
  label: string;
  mandatory?: boolean;
  error?: string;
  warning?: string;
  containerStyle?: ViewStyle;
  prefix?: string;
  suffix?: string;
}

export function FormInput({
  label,
  mandatory,
  error,
  warning,
  containerStyle,
  prefix,
  suffix,
  ...rest
}: FormInputProps) {
  const { colors } = useAppTheme();
  const isError = !!error;
  const isWarning = !!warning;

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={[styles.label, { color: colors.textDim }]}>
        {label} {mandatory && <Text style={styles.asterisk}>*</Text>}
      </Text>
      <View
        style={[
          styles.inputWrapper,
          { backgroundColor: colors.inputBg, borderColor: Brand.blueBorder },
          isError ? { borderColor: '#EF4444', backgroundColor: 'rgba(239,68,68,0.08)' } :
          isWarning ? { borderColor: '#F59E0B', backgroundColor: 'rgba(245,158,11,0.08)' } : null,
        ]}
      >
        {prefix && <Text style={[styles.prefix, { color: colors.textSecondary }]}>{prefix}</Text>}
        <TextInput
          style={[styles.input, { color: colors.textPrimary }]}
          placeholderTextColor={colors.textDim}
          {...rest}
        />
        {suffix && <Text style={[styles.suffix, { color: colors.textSecondary }]}>{suffix}</Text>}
      </View>
      {isError && <Text style={styles.errorText}>{error}</Text>}
      {isWarning && !isError && <Text style={styles.warningText}>{warning}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  asterisk: {
    color: '#EF4444',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 48,
  },
  prefix: {
    marginRight: 6,
    fontSize: 15,
    fontWeight: '600',
  },
  suffix: {
    marginLeft: 6,
    fontSize: 13,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    height: '100%',
    padding: 0,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },
  warningText: {
    color: '#F59E0B',
    fontSize: 12,
    marginTop: 4,
  },
});
