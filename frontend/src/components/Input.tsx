import React from 'react';
import { TextInput, View, StyleSheet, TextInputProps } from 'react-native';
import { Text } from './Text';
import { colors, radii } from '../theme';

type Props = TextInputProps & { label?: string; error?: string; testID?: string };

export const Input: React.FC<Props> = ({ label, error, style, testID, ...rest }) => (
  <View style={styles.wrap}>
    {label && <Text style={styles.label}>{label}</Text>}
    <TextInput
      placeholderTextColor="rgba(255,255,255,0.35)"
      style={[styles.input, error ? styles.error : null, style]}
      testID={testID}
      {...rest}
    />
    {error ? <Text style={styles.errorText}>{error}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: colors.primary, marginBottom: 6, textTransform: 'uppercase' },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    color: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: radii.md,
    fontSize: 15,
  },
  error: { borderColor: colors.danger },
  errorText: { fontSize: 12, color: colors.danger, marginTop: 4 },
});
