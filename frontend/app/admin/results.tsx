import { useCallback, useState } from 'react';
import { View, ScrollView, TouchableOpacity, FlatList, StyleSheet, Image } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/src/components/Text';
import { Input } from '@/src/components/Input';
import { Button } from '@/src/components/Button';
import { colors, radii } from '@/src/theme';
import { api } from '@/src/api';
import { useToast } from '@/src/components/Toast';

export default function AdminResults() {
  const router = useRouter(); const toast = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<Record<string, string>>({});
  const load = useCallback(async () => { try { const r: any = await api.adminResults('pending'); setItems(r.results || []); } catch {} }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const compute = (r: any) => {
    const perKill = (r.tournament?.per_kill || 0) * r.kills;
    const positionBonus = r.position === 1 ? (r.tournament?.prize_pool || 0) * 0.5 : r.position === 2 ? (r.tournament?.prize_pool || 0) * 0.25 : r.position === 3 ? (r.tournament?.prize_pool || 0) * 0.1 : 0;
    return Math.round(perKill + positionBonus);
  };

  const act = async (r: any, approve: boolean) => {
    try {
      const payout = approve ? parseFloat(payouts[r.result_id] || String(compute(r))) : 0;
      await api.adminResultAction({ result_id: r.result_id, approve, payout_amount: payout });
      toast.show(approve ? `Approved ₹${payout}` : 'Rejected', 'success'); load();
    } catch (e: any) { toast.show(e.message, 'error'); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView edges={['top']}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 }}>
          <TouchableOpacity onPress={() => router.back()} testID="back"><Ionicons name="chevron-back" size={26} color="#fff" /></TouchableOpacity>
          <Text style={{ fontSize: 22, fontWeight: '900' }}>Match Results</Text>
        </View>
      </SafeAreaView>
      <FlatList
        data={items}
        keyExtractor={(r) => r.result_id}
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
        renderItem={({ item: r }) => (
          <View style={s.card}>
            <Text style={{ fontWeight: '900' }}>{r.tournament?.title}</Text>
            <Text muted style={{ fontSize: 11, marginTop: 2 }}>{r.user?.name} · {r.user?.email}</Text>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
              <Text style={{ fontWeight: '900', color: colors.success }}>#{r.position}</Text>
              <Text style={{ fontWeight: '900', color: colors.warning }}>{r.kills} kills</Text>
              <Text muted style={{ fontSize: 11 }}>Auto: ₹{compute(r)}</Text>
            </View>
            {r.screenshot_base64 && r.screenshot_base64.startsWith('data:') && (
              <Image source={{ uri: r.screenshot_base64 }} style={{ width: '100%', height: 180, marginTop: 10, borderRadius: 8 }} resizeMode="contain" />
            )}
            <Input label="Payout (₹)" value={payouts[r.result_id] ?? String(compute(r))} onChangeText={(v) => setPayouts((p) => ({ ...p, [r.result_id]: v }))} keyboardType="numeric" testID={`payout-${r.result_id}`} />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Button title="Approve & Pay" onPress={() => act(r, true)} testID={`res-ok-${r.result_id}`} style={{ flex: 1 }} />
              <Button title="Reject" variant="danger" onPress={() => act(r, false)} testID={`res-no-${r.result_id}`} style={{ flex: 1 }} />
            </View>
          </View>
        )}
        ListEmptyComponent={<Text muted style={{ textAlign: 'center', marginTop: 40 }}>No pending results</Text>}
      />
    </View>
  );
}
const s = StyleSheet.create({ card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSubtle, padding: 14, borderRadius: radii.md, marginBottom: 10 } });
