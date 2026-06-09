import { useCallback, useState } from 'react';
import { View, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/src/components/Text';
import { Button } from '@/src/components/Button';
import { colors, radii } from '@/src/theme';
import { api } from '@/src/api';
import { useToast } from '@/src/components/Toast';

const STATUSES = ['pending', 'approved', 'rejected'];

export default function AdminWithdrawals() {
  const router = useRouter();
  const toast = useToast();
  const [status, setStatus] = useState('pending');
  const [items, setItems] = useState<any[]>([]);

  const load = useCallback(async () => {
    try { const r: any = await api.adminWithdrawals(status); setItems(r.withdrawals || []); } catch {}
  }, [status]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const act = async (id: string, approve: boolean) => {
    try { await api.adminWithdrawalAction({ withdraw_id: id, approve }); toast.show(approve ? 'Approved' : 'Rejected', 'success'); load(); } catch (e: any) { toast.show(e.message, 'error'); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.bg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 }}>
          <TouchableOpacity onPress={() => router.back()} testID="back"><Ionicons name="chevron-back" size={26} color="#fff" /></TouchableOpacity>
          <Text style={{ fontSize: 22, fontWeight: '900' }}>Withdrawals</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 8, flexDirection: 'row' }}>
          {STATUSES.map((s) => (
            <TouchableOpacity key={s} onPress={() => setStatus(s)} style={[c.chip, status === s && c.chipA]} testID={`wd-${s}`}>
              <Text style={[c.chipT, status === s && { color: colors.primary }]}>{s.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
      <FlatList
        data={items}
        keyExtractor={(w) => w.withdraw_id}
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
        renderItem={({ item: w }) => (
          <View style={c.card} testID={`wd-card-${w.withdraw_id}`}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontWeight: '900', fontSize: 20, color: colors.success }}>₹{w.amount}</Text>
              <Text style={{ fontSize: 11, fontWeight: '800', color: w.status === 'pending' ? colors.warning : w.status === 'approved' ? colors.success : colors.danger }}>{w.status.toUpperCase()}</Text>
            </View>
            <Text style={{ fontWeight: '700', marginTop: 8 }}>{w.user?.name}</Text>
            <Text muted style={{ fontSize: 11 }}>{w.user?.email} · UPI: {w.upi_id}</Text>
            <Text muted style={{ fontSize: 10, marginTop: 4 }}>Requested {new Date(w.created_at).toLocaleString('en-IN')}</Text>
            {w.status === 'pending' && (
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                <Button title="Approve" onPress={() => act(w.withdraw_id, true)} testID={`approve-${w.withdraw_id}`} style={{ flex: 1 }} />
                <Button title="Reject" variant="danger" onPress={() => act(w.withdraw_id, false)} testID={`reject-${w.withdraw_id}`} style={{ flex: 1 }} />
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={<Text muted style={{ textAlign: 'center', marginTop: 40 }}>No {status} withdrawals</Text>}
      />
    </View>
  );
}

import { StyleSheet } from 'react-native';
const c = StyleSheet.create({
  chip: { paddingHorizontal: 14, height: 32, borderRadius: 999, borderWidth: 1, borderColor: colors.borderSubtle, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  chipA: { borderColor: colors.borderActive, backgroundColor: 'rgba(0,229,255,0.12)' },
  chipT: { fontSize: 11, fontWeight: '800', letterSpacing: 1, color: colors.textMuted },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSubtle, padding: 14, borderRadius: radii.md, marginBottom: 10 },
});
