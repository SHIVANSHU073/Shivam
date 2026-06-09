import React from 'react';
import { TouchableOpacity, StyleSheet, ActivityIndicator, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from './Text';
import { colors, radii, shadow } from '../theme';

type Props = {
  onPress?: () => void;
  title: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  testID?: string;
  style?: ViewStyle;
  icon?: React.ReactNode;
};

export const Button: React.FC<Props> = ({ onPress, title, variant = 'primary', loading, disabled, testID, style, icon }) => {
  const content = (
    <View style={styles.row}>
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.bg : colors.primary} />
      ) : (
        <>
          {icon}
          <Text style={[styles.text, variant === 'primary' && { color: colors.bg }, variant === 'danger' && { color: '#fff' }, variant === 'secondary' && { color: colors.primary }, variant === 'ghost' && { color: colors.text }]}>
            {title}
          </Text>
        </>
      )}
    </View>
  );

  if (variant === 'primary') {
    return (
      <TouchableOpacity onPress={onPress} disabled={disabled || loading} testID={testID} activeOpacity={0.85} style={[shadow.neon, style]}>
        <LinearGradient colors={colors.primaryGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.btn, disabled && styles.disabled]}>
          {content}
        </LinearGradient>
      </TouchableOpacity>
    );
  }
  if (variant === 'danger') {
    return (
      <TouchableOpacity onPress={onPress} disabled={disabled || loading} testID={testID} activeOpacity={0.85} style={style}>
        <LinearGradient colors={colors.dangerGradient} style={[styles.btn, disabled && styles.disabled]}>
          {content}
        </LinearGradient>
      </TouchableOpacity>
    );
  }
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      testID={testID}
      activeOpacity={0.85}
      style={[styles.btn, variant === 'secondary' ? styles.secondary : styles.ghost, disabled && styles.disabled, style]}
    >
      {content}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: { paddingVertical: 16, paddingHorizontal: 20, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center' },
  secondary: { borderWidth: 1, borderColor: colors.primary, backgroundColor: 'transparent' },
  ghost: { borderWidth: 1, borderColor: colors.borderSubtle, backgroundColor: colors.surface },
  text: { fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase', fontSize: 13 },
  disabled: { opacity: 0.5 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
});
