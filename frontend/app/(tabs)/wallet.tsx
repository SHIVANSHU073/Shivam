import { useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/src/components/Text';
import { Button } from '@/src/components/Button';
import { colors, radii, shadow } from '@/src/theme';
import { api } from '@/src/api';
import { useAuth } from '@/src/AuthContext';

export default function Wallet() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, refresh } = useAuth();
  const [txs, setTxs] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      await refresh();
      const r: any = await api.transactions();
      setTxs(r.transactions || []);
    } catch {}
  }, [refresh]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const w = user?.wallet || { deposit: 0, winning: 0, bonus: 0, referral: 0 };
  const total = w.deposit + w.winning + w.bonus + w.referral;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.bg }}>
        <View style={styles.header}>
          <Text style={styles.title}>WALLET</Text>
        </View>
      </SafeAreaView>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 120 + insets.bottom }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={colors.primary} />}
      >
        <LinearGradient colors={['rgba(157,0,255,0.35)', 'rgba(0,229,255,0.25)']} style={[styles.bigCard, shadow.purple]}>
          <Text style={{ letterSpacing: 2, color: '#fff', fontSize: 11, fontWeight: '700' }}>TOTAL BALANCE</Text>
          <Text style={styles.bigAmt} testID="wallet-total">₹{total.toFixed(2)}</Text>
          <View style={styles.btnRow}>
            <Button title="Deposit" onPress={() => router.push('/wallet/deposit')} testID="wallet-deposit-btn" style={{ flex: 1 }} />
            <Button title="Withdraw" variant="secondary" onPress={() => router.push('/wallet/withdraw')} testID="wallet-withdraw-btn" style={{ flex: 1 }} />
          </View>
        </LinearGradient>

        <View style={styles.subWrap}>
          <SubWallet label="DEPOSIT" amt={w.deposit} icon="card" color={colors.primary} />
          <SubWallet label="WINNING" amt={w.winning} icon="trophy" color={colors.success} />
          <SubWallet label="BONUS" amt={w.bonus} icon="gift" color={colors.warning} />
          <SubWallet label="REFERRAL" amt={w.referral} icon="people" color={colors.secondary} />
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>TRANSACTIONS</Text>
        {txs.length === 0 ? (
          <Text muted style={{ marginTop: 14, textAlign: 'center' }}>No transactions yet</Text>
        ) : (
          txs.map((t) => (
            <View key={t.tx_id} style={styles.txRow} testID={`tx-${t.tx_id}`}>
              <View style={[styles.txIcon, { backgroundColor: t.amount >= 0 ? 'rgba(0,255,102,0.12)' : 'rgba(255,0,85,0.12)' }]}>
                <Ionicons name={t.amount >= 0 ? 'arrow-down' : 'arrow-up'} color={t.amount >= 0 ? colors.success : colors.danger} size={16} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700', fontSize: 13 }} numberOfLines={1}>{t.note || t.type}</Text>
                <Text muted style={{ fontSize: 11, marginTop: 2 }}>{new Date(t.created_at).toLocaleString('en-IN')}</Text>
              </View>
              <Text style={{ fontWeight: '900', color: t.amount >= 0 ? colors.success : colors.danger }}>
                {t.amount >= 0 ? '+' : ''}₹{Math.abs(t.amount).toFixed(0)}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const SubWallet: React.FC<{ label: string; amt: number; icon: any; color: string }> = ({ label, amt, icon, color }) => (
  <View style={[styles.subCard, { borderColor: color + '55' }]} testID={`sub-wallet-${label.toLowerCase()}`}>
    <View style={[styles.subIcon, { backgroundColor: color + '22' }]}>
      <Ionicons name={icon} color={color} size={18} />
    </View>
    <Text muted style={{ fontSize: 10, letterSpacing: 1.5, marginTop: 8 }}>{label}</Text>
    <Text style={{ fontSize: 18, fontWeight: '900', color: '#fff', marginTop: 2 }}>₹{amt.toFixed(0)}</Text>
  </View>
);

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingVertical: 4 },
  title: { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  bigCard: { borderRadius: radii.lg, padding: 24, borderWidth: 1, borderColor: 'rgba(157,0,255,0.4)' },
  bigAmt: { fontSize: 42, fontWeight: '900', color: '#fff', letterSpacing: -1.5, marginTop: 6 },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 18 },
  subWrap: { flexDirection: 'row', gap: 10, marginTop: 20, flexWrap: 'wrap' },
  subCard: { flex: 1, minWidth: '47%', backgroundColor: colors.surface, borderRadius: radii.md, padding: 14, borderWidth: 1 },
  subIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 13, fontWeight: '900', letterSpacing: 2, color: '#fff' },
  txRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.borderSubtle, borderWidth: 1, padding: 14, borderRadius: radii.md, marginTop: 10, gap: 12 },
  txIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
