import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/src/AuthContext';
import { Text } from '@/src/components/Text';
import { colors } from '@/src/theme';

export default function Index() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    const t = setTimeout(() => {
      if (user) router.replace('/(tabs)/home');
      else router.replace('/(auth)/login');
    }, 600);
    return () => clearTimeout(t);
  }, [loading, user, router]);

  return (
    <LinearGradient colors={[colors.bg, '#0a0a1a', colors.bg]} style={styles.container} testID="splash-screen">
      <View style={styles.logoWrap}>
        <Text style={styles.logo}>CLUTCH</Text>
        <Text style={styles.logoAccent}>ARENA</Text>
      </View>
      <Text style={styles.tagline} muted>WIN. PLAY. REPEAT.</Text>
      <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logoWrap: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  logo: { fontSize: 44, fontWeight: '900', color: '#fff', letterSpacing: -1 },
  logoAccent: { fontSize: 44, fontWeight: '900', color: colors.primary, letterSpacing: -1, textShadowColor: colors.primaryGlow, textShadowRadius: 20 },
  tagline: { letterSpacing: 6, fontSize: 12, marginTop: 12, fontWeight: '700' },
});
