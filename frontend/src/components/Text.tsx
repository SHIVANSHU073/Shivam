import React from 'react';
import { Text as RNText, TextProps, StyleSheet } from 'react-native';
import { colors } from '../theme';

export const Text: React.FC<TextProps & { muted?: boolean }> = ({ style, muted, ...rest }) => (
  <RNText style={[styles.base, muted && { color: colors.textMuted }, style]} {...rest} />
);

const styles = StyleSheet.create({
  base: { color: colors.text, fontSize: 14 },
});
