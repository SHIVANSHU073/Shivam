import { useEffect, useState } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/src/components/Text';
import { Button } from '@/src/components/Button';
import { colors, radii } from '@/src/theme';
import { api } from '@/src/api';
import { useToast } from '@/src/components/Toast';

export default function Admin() {
  const router = useRouter();
  const toast = useToast();
  const [stats, setStats] = useState<any>(null);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [kyc, setKyc] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);

  const load = async () => {
    try {
      const [s, w, k, r]: any = await Promise.all([api.adminStats(), api.adminWithdrawals(), api.adminKyc(), api.adminResults()]);
      setStats(s); setWithdrawals(w.withdrawals || []); setKyc(k.kyc || []); setResults(r.results || []);
    } catch (e: any) { toast.show(e.message, 'error'); }
  };
  useEffect(() => { load(); }, []);

  const act = async (kind: string, body: any) => {
    try {
      if (kind === 'wd') await api.adminWithdrawalAction(body);
      if (kind === 'kyc') await api.adminKycAction(body);
      if (kind === 'res') await api.adminResultAction(body);
      toast.show('Done', 'success'); load();
    } catch (e: any) { toast.show(e.message, 'error'); }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()} testID="back"><Ionicons name="chevron-back" size={26} color="#fff" /></TouchableOpacity>
        <Text style={{ fontSize: 22, fontWeight: '900' }}>Admin Panel</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {stats && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {[
              ['USERS', stats.total_users, colors.primary],
              ['TOURNAMENTS', stats.total_tournaments, colors.secondary],
              ['LIVE', stats.live_tournaments, colors.danger],
              ['PEND KYC', stats.pending_kyc, colors.warning],
              ['PEND WD', stats.pending_withdrawals, colors.warning],
              ['DEPOSITS ₹', stats.deposits_total, colors.success],
            ].map(([l, v, c]: any) => (
              <View key={l} style={{ flex: 1, minWidth: '30%', backgroundColor: colors.surface, borderWidth: 1, borderColor: c + '55', padding: 12, borderRadius: radii.md }}>
                <Text muted style={{ fontSize: 9, letterSpacing: 1 }}>{l}</Text>
                <Text style={{ fontSize: 22, fontWeight: '900', color: c, marginTop: 4 }}>{v}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={{ fontSize: 13, fontWeight: '900', letterSpacing: 2, marginTop: 20, marginBottom: 8 }}>PENDING WITHDRAWALS</Text>
        {withdrawals.length === 0 ? <Text muted>None</Text> : withdrawals.map((w) => (
          <View key={w.withdraw_id} style={{ backgroundColor: colors.surface, borderColor: colors.borderSubtle, borderWidth: 1, padding: 12, borderRadius: radii.md, marginBottom: 8 }}>
            <Text style={{ fontWeight: '800' }}>{w.user?.name} · ₹{w.amount}</Text>
            <Text muted style={{ fontSize: 11 }}>UPI: {w.upi_id}</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              <Button title="Approve" onPress={() => act('wd', { withdraw_id: w.withdraw_id, approve: true })} style={{ flex: 1 }} testID={`wd-approve-${w.withdraw_id}`} />
              <Button title="Reject" variant="danger" onPress={() => act('wd', { withdraw_id: w.withdraw_id, approve: false })} style={{ flex: 1 }} testID={`wd-reject-${w.withdraw_id}`} />
            </View>
          </View>
        ))}

        <Text style={{ fontSize: 13, fontWeight: '900', letterSpacing: 2, marginTop: 20, marginBottom: 8 }}>PENDING KYC</Text>
        {kyc.length === 0 ? <Text muted>None</Text> : kyc.map((k) => (
          <View key={k.kyc_id} style={{ backgroundColor: colors.surface, borderColor: colors.borderSubtle, borderWidth: 1, padding: 12, borderRadius: radii.md, marginBottom: 8 }}>
            <Text style={{ fontWeight: '800' }}>{k.full_name}</Text>
            <Text muted style={{ fontSize: 11 }}>PAN: {k.pan} · Aadhaar: {k.aadhaar}</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              <Button title="Approve" onPress={() => act('kyc', { user_id: k.user_id, approve: true })} style={{ flex: 1 }} testID={`kyc-approve-${k.kyc_id}`} />
              <Button title="Reject" variant="danger" onPress={() => act('kyc', { user_id: k.user_id, approve: false })} style={{ flex: 1 }} testID={`kyc-reject-${k.kyc_id}`} />
            </View>
          </View>
        ))}

        <Text style={{ fontSize: 13, fontWeight: '900', letterSpacing: 2, marginTop: 20, marginBottom: 8 }}>PENDING RESULTS</Text>
        {results.length === 0 ? <Text muted>None</Text> : results.map((r) => {
          const payout = (r.tournament?.per_kill || 0) * r.kills + (r.position === 1 ? r.tournament?.prize_pool * 0.5 : 0);
          return (
            <View key={r.result_id} style={{ backgroundColor: colors.surface, borderColor: colors.borderSubtle, borderWidth: 1, padding: 12, borderRadius: radii.md, marginBottom: 8 }}>
              <Text style={{ fontWeight: '800' }}>{r.user?.name} · {r.tournament?.title}</Text>
              <Text muted style={{ fontSize: 11 }}>#{r.position} · {r.kills} kills · Payout ₹{payout.toFixed(0)}</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                <Button title="Approve" onPress={() => act('res', { result_id: r.result_id, approve: true, payout_amount: payout })} style={{ flex: 1 }} testID={`res-approve-${r.result_id}`} />
                <Button title="Reject" variant="danger" onPress={() => act('res', { result_id: r.result_id, approve: false })} style={{ flex: 1 }} testID={`res-reject-${r.result_id}`} />
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
