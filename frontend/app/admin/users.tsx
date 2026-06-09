import { useCallback, useState } from 'react';
import { View, ScrollView, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/src/components/Text';
import { Input } from '@/src/components/Input';
import { Button } from '@/src/components/Button';
import { colors, radii } from '@/src/theme';
import { api } from '@/src/api';
import { useToast } from '@/src/components/Toast';

export default function AdminUsers() {
  const router = useRouter();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [users, setUsers] = useState<any[]>([]);

  const load = useCallback(async () => {
    try { const r: any = await api.adminUsers(q); setUsers(r.users || []); } catch {}
  }, [q]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const ban = async (u: any) => {
    try { await api.adminBanUser({ user_id: u.user_id, banned: !u.banned, reason: u.banned ? null : 'Admin action' }); toast.show(u.banned ? 'Unbanned' : 'Banned', 'success'); load(); } catch (e: any) { toast.show(e.message, 'error'); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.bg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 }}>
          <TouchableOpacity onPress={() => router.back()} testID="back"><Ionicons name="chevron-back" size={26} color="#fff" /></TouchableOpacity>
          <Text style={{ fontSize: 22, fontWeight: '900' }}>Users ({users.length})</Text>
        </View>
        <View style={{ paddingHorizontal: 16, flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}><Input value={q} onChangeText={setQ} placeholder="Search name/email/phone" testID="users-search" /></View>
          <TouchableOpacity onPress={load} style={st.iconBtn} testID="users-search-btn"><Ionicons name="search" color={colors.primary} size={20} /></TouchableOpacity>
        </View>
      </SafeAreaView>
      <FlatList
        data={users}
        keyExtractor={(u) => u.user_id}
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
        renderItem={({ item: u }) => (
          <View style={st.card} testID={`u-${u.user_id}`}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={st.avatar}><Text style={{ fontWeight: '900' }}>{u.name?.[0]?.toUpperCase()}</Text></View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <Text style={{ fontWeight: '900' }}>{u.name}</Text>
                  {u.role === 'admin' && <View style={[st.tag, { backgroundColor: colors.secondary }]}><Text style={{ fontSize: 9, color: '#fff', fontWeight: '900' }}>ADMIN</Text></View>}
                  {u.vip_active && <View style={[st.tag, { backgroundColor: 'rgba(255,215,0,0.2)', borderWidth: 1, borderColor: '#FFD700' }]}><Text style={{ fontSize: 9, color: '#FFD700', fontWeight: '900' }}>VIP</Text></View>}
                  {u.banned && <View style={[st.tag, { backgroundColor: colors.danger }]}><Text style={{ fontSize: 9, color: '#fff', fontWeight: '900' }}>BANNED</Text></View>}
                </View>
                <Text muted style={{ fontSize: 11, marginTop: 2 }}>{u.email || u.phone || u.user_id}</Text>
                <Text muted style={{ fontSize: 10, marginTop: 2 }}>KYC: {u.kyc_status} · Ref: {u.referral_code}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 10 }}>
              <Button title="View Details" variant="secondary" onPress={() => router.push({ pathname: '/admin/user-detail', params: { id: u.user_id } } as any)} testID={`view-${u.user_id}`} style={{ flex: 1 }} />
              {u.role !== 'admin' && <Button title={u.banned ? 'Unban' : 'Ban'} variant={u.banned ? 'ghost' : 'danger'} onPress={() => ban(u)} testID={`ban-${u.user_id}`} style={{ flex: 1 }} />}
            </View>
          </View>
        )}
        ListEmptyComponent={<Text muted style={{ textAlign: 'center', marginTop: 40 }}>No users</Text>}
      />
    </View>
  );
}

const st = StyleSheet.create({
  iconBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderActive, alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: colors.surface, borderColor: colors.borderSubtle, borderWidth: 1, padding: 14, borderRadius: radii.md, marginBottom: 10 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  tag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999 },
});
