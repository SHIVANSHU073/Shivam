import { useEffect, useState } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/src/components/Text';
import { Button } from '@/src/components/Button';
import { colors, radii } from '@/src/theme';
import { api } from '@/src/api';
import { useToast } from '@/src/components/Toast';

export default function UserDetail() {
  const router = useRouter();
  const toast = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const load = async () => { try { setData(await api.adminUserDetail(id!)); } catch (e: any) { toast.show(e.message, 'error'); } };
  useEffect(() => { load(); }, [id]);
  if (!data) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  const u = data.user; const s = data.stats;

  const ban = async () => {
    try { await api.adminBanUser({ user_id: u.user_id, banned: !u.banned, reason: u.banned ? null : 'Admin action' }); load(); } catch (e: any) { toast.show(e.message, 'error'); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView edges={['top']}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 }}>
          <TouchableOpacity onPress={() => router.back()} testID="back"><Ionicons name="chevron-back" size={26} color="#fff" /></TouchableOpacity>
          <Text style={{ fontSize: 22, fontWeight: '900' }}>{u.name}</Text>
        </View>
      </SafeAreaView>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSubtle, padding: 16, borderRadius: radii.md }}>
          {[['Email', u.email], ['Phone', u.phone], ['Role', u.role], ['KYC', u.kyc_status], ['Referral Code', u.referral_code], ['VIP', u.vip_active ? `Until ${u.vip_expires_at ? new Date(u.vip_expires_at).toLocaleDateString() : '—'}` : 'No'], ['Banned', u.banned ? `Yes (${u.ban_reason || ''})` : 'No'], ['BGMI ID', u.bgmi_id], ['Free Fire ID', u.ff_id], ['Joined', u.created_at ? new Date(u.created_at).toLocaleString() : '—']].map(([k, v]: any) => (
            <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
              <Text muted>{k}</Text>
              <Text style={{ fontWeight: '700', maxWidth: '60%', textAlign: 'right' }}>{v || '—'}</Text>
            </View>
          ))}
        </View>
        <Text style={{ fontSize: 13, fontWeight: '900', letterSpacing: 2, marginTop: 20, marginBottom: 8 }}>WALLET</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {Object.entries(u.wallet || {}).map(([k, v]: any) => (
            <View key={k} style={{ flex: 1, minWidth: '47%', backgroundColor: colors.surface, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: colors.borderSubtle }}>
              <Text muted style={{ fontSize: 10, letterSpacing: 1.5 }}>{k.toUpperCase()}</Text>
              <Text style={{ fontSize: 18, fontWeight: '900', color: colors.primary, marginTop: 2 }}>₹{v}</Text>
            </View>
          ))}
        </View>
        <Text style={{ fontSize: 13, fontWeight: '900', letterSpacing: 2, marginTop: 20, marginBottom: 8 }}>STATS</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {[['Tournaments', s.tournaments_joined], ['Wins', s.matches_won], ['Kills', s.total_kills], ['Winnings', `₹${s.total_winnings}`], ['Deposits', `₹${s.total_deposits}`]].map(([k, v]: any) => (
            <View key={k} style={{ flex: 1, minWidth: '30%', backgroundColor: colors.surface, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: colors.borderSubtle }}>
              <Text muted style={{ fontSize: 9, letterSpacing: 1.5 }}>{k.toUpperCase()}</Text>
              <Text style={{ fontSize: 16, fontWeight: '900', color: colors.success, marginTop: 2 }}>{v}</Text>
            </View>
          ))}
        </View>
        {u.role !== 'admin' && <Button title={u.banned ? 'Unban User' : 'Ban User'} variant={u.banned ? 'ghost' : 'danger'} onPress={ban} testID="ban-btn" style={{ marginTop: 24 }} />}
      </ScrollView>
    </View>
  );
}
