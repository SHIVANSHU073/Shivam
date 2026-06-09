import { useEffect, useState } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/src/components/Text';
import { Button } from '@/src/components/Button';
import { colors, radii, shadow } from '@/src/theme';
import { api } from '@/src/api';
import { useAuth } from '@/src/AuthContext';
import { useToast } from '@/src/components/Toast';

export default function VipScreen() {
  const router = useRouter();
  const toast = useToast();
  const { refresh } = useAuth();
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      const r: any = await api.vipStatus();
      setStatus(r);
    } catch (e: any) {
      toast.show(e.message, 'error');
    }
  };
  useEffect(() => { load(); }, []);

  const subscribe = async () => {
    setLoading(true);
    try {
      await api.vipSubscribe();
      toast.show('🏆 Welcome to ClutchArena VIP!', 'success');
      await refresh();
      await load();
    } catch (e: any) {
      toast.show(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView edges={['top']}>
        <View style={s.headerRow}>
          <TouchableOpacity onPress={() => router.back()} testID="vip-back">
            <Ionicons name="chevron-back" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={s.title}>VIP Membership</Text>
        </View>
      </SafeAreaView>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        <LinearGradient colors={['#FFD700', '#FF6A00', colors.secondary]} style={[s.hero, shadow.purple]}>
          <Ionicons name="diamond" size={48} color="#fff" />
          <Text style={s.heroTitle}>CLUTCH VIP</Text>
          <Text style={s.heroSub}>The competitive edge</Text>
          {status?.active ? (
            <View style={s.activeBadge}>
              <Text style={{ fontWeight: '900', color: '#FFD700', letterSpacing: 1.5 }} testID="vip-active-badge">
                ACTIVE · expires {new Date(status.expires_at).toLocaleDateString('en-IN')}
              </Text>
            </View>
          ) : (
            <Text style={s.price}>₹{status?.price || 99}<Text style={{ fontSize: 14, fontWeight: '700' }}>/month</Text></Text>
          )}
        </LinearGradient>

        <Text style={s.sectionTitle}>WHAT YOU GET</Text>
        {(status?.perks || [
          '10% discount on tournament entry fees',
          '2× referral earnings (₹50 per friend)',
          'Access to exclusive VIP-only tournaments',
          'Priority customer support',
          'Animated VIP badge on profile & leaderboard',
        ]).map((p: string, i: number) => (
          <View key={i} style={s.perkRow} testID={`vip-perk-${i}`}>
            <View style={s.perkIcon}><Ionicons name="checkmark" size={16} color={colors.success} /></View>
            <Text style={{ flex: 1, fontWeight: '600' }}>{p}</Text>
          </View>
        ))}

        {!status?.active && (
          <Button
            title={`Activate VIP for ₹${status?.price || 99}`}
            onPress={subscribe}
            loading={loading}
            testID="vip-subscribe-btn"
            style={{ marginTop: 24 }}
          />
        )}
        {status?.active && (
          <Button
            title="Extend by 30 days"
            variant="secondary"
            onPress={subscribe}
            loading={loading}
            testID="vip-extend-btn"
            style={{ marginTop: 24 }}
          />
        )}
        <Text muted style={{ fontSize: 11, marginTop: 14, textAlign: 'center' }}>
          Paid from wallet (bonus → deposit → winning). Auto-renew off.
        </Text>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  title: { fontSize: 22, fontWeight: '900', color: '#fff' },
  hero: { borderRadius: radii.xl, padding: 28, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,215,0,0.4)' },
  heroTitle: { fontSize: 32, fontWeight: '900', letterSpacing: 4, color: '#fff', marginTop: 8 },
  heroSub: { color: '#fff', opacity: 0.9, fontSize: 12, letterSpacing: 2, marginTop: 4 },
  price: { color: '#fff', fontSize: 36, fontWeight: '900', marginTop: 12 },
  activeBadge: { marginTop: 16, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.4)', borderWidth: 1, borderColor: '#FFD700' },
  sectionTitle: { fontSize: 13, fontWeight: '900', letterSpacing: 2, color: '#fff', marginTop: 24, marginBottom: 10 },
  perkRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.borderSubtle, borderWidth: 1, padding: 14, borderRadius: radii.md, marginBottom: 8, gap: 12 },
  perkIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,255,102,0.15)', alignItems: 'center', justifyContent: 'center' },
});
