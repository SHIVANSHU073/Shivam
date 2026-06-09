import { useEffect, useState } from 'react';
import { View, ScrollView, TouchableOpacity, FlatList, Share, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/src/components/Text';
import { Button } from '@/src/components/Button';
import { colors, radii } from '@/src/theme';
import { api } from '@/src/api';
import { useToast } from '@/src/components/Toast';

export default function Registrations() {
  const router = useRouter(); const toast = useToast();
  const { id, title } = useLocalSearchParams<{ id: string; title?: string }>();
  const [regs, setRegs] = useState<any[]>([]);
  const load = async () => { try { const r: any = await api.adminTournamentRegistrations(id!); setRegs(r.registrations || []); } catch (e: any) { toast.show(e.message, 'error'); } };
  useEffect(() => { load(); }, [id]);

  const act = async (rid: string, ok: boolean) => {
    try { await api.adminRegistrationAction({ registration_id: rid, approve: ok, reason: ok ? null : 'Rejected by admin' }); toast.show(ok ? 'Approved' : 'Rejected & refunded', 'success'); load(); } catch (e: any) { toast.show(e.message, 'error'); }
  };

  const exportList = async () => {
    const rows = ['Slot,Name,Email,Phone,BGMI ID,FF ID,KYC,Fee Paid,IGN,Approved'];
    regs.forEach((r) => {
      rows.push([r.slot, r.user?.name, r.user?.email || '', r.user?.phone || '', r.user?.bgmi_id || '', r.user?.ff_id || '', r.user?.kyc_status || '', r.fee_paid, r.in_game_name || '', r.approved ? 'YES' : 'NO'].join(','));
    });
    const csv = rows.join('\n');
    try { await Share.share({ message: csv, title: `Players-${title || id}` }); } catch {}
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView edges={['top']}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 }}>
          <TouchableOpacity onPress={() => router.back()} testID="back"><Ionicons name="chevron-back" size={26} color="#fff" /></TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 20, fontWeight: '900' }} numberOfLines={1}>{title || 'Players'}</Text>
            <Text muted style={{ fontSize: 11 }}>{regs.length} registered</Text>
          </View>
          <TouchableOpacity onPress={exportList} style={s.iconBtn} testID="export-csv">
            <Ionicons name="download" color={colors.primary} size={20} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
      <FlatList
        data={regs}
        keyExtractor={(r) => r.registration_id}
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
        renderItem={({ item: r }) => (
          <View style={s.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontWeight: '900' }}>#{r.slot} · {r.user?.name}</Text>
              <Text style={{ fontSize: 11, fontWeight: '800', color: r.approved ? colors.success : colors.warning }}>{r.approved ? 'APPROVED' : 'PENDING'}</Text>
            </View>
            <Text muted style={{ fontSize: 11, marginTop: 2 }}>{r.user?.email} · {r.user?.phone || '—'}</Text>
            <Text muted style={{ fontSize: 11 }}>IGN: {r.in_game_name || '—'} · Fee: ₹{r.fee_paid} · KYC: {r.user?.kyc_status}</Text>
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 10 }}>
              {!r.approved && <Button title="Approve" onPress={() => act(r.registration_id, true)} testID={`reg-ok-${r.registration_id}`} style={{ flex: 1 }} />}
              <Button title="Reject & Refund" variant="danger" onPress={() => act(r.registration_id, false)} testID={`reg-no-${r.registration_id}`} style={{ flex: 1 }} />
            </View>
          </View>
        )}
        ListEmptyComponent={<Text muted style={{ textAlign: 'center', marginTop: 40 }}>No registrations yet</Text>}
      />
    </View>
  );
}
const s = StyleSheet.create({
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderActive, alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSubtle, padding: 14, borderRadius: radii.md, marginBottom: 10 },
});
