import { useCallback, useState } from 'react';
import { View, ScrollView, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/src/components/Text';
import { Button } from '@/src/components/Button';
import { colors, radii } from '@/src/theme';
import { api } from '@/src/api';
import { useToast } from '@/src/components/Toast';

export default function AdminKYC() {
  const router = useRouter(); const toast = useToast();
  const [items, setItems] = useState<any[]>([]);
  const load = useCallback(async () => { try { const r: any = await api.adminKyc('pending'); setItems(r.kyc || []); } catch {} }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  const act = async (uid: string, ok: boolean) => { try { await api.adminKycAction({ user_id: uid, approve: ok }); toast.show(ok ? 'Approved' : 'Rejected', 'success'); load(); } catch (e: any) { toast.show(e.message, 'error'); } };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView edges={['top']}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 }}>
          <TouchableOpacity onPress={() => router.back()} testID="back"><Ionicons name="chevron-back" size={26} color="#fff" /></TouchableOpacity>
          <Text style={{ fontSize: 22, fontWeight: '900' }}>KYC Verification</Text>
        </View>
      </SafeAreaView>
      <FlatList
        data={items}
        keyExtractor={(k) => k.kyc_id}
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
        renderItem={({ item: k }) => (
          <View style={s.card}>
            <Text style={{ fontWeight: '900', fontSize: 16 }}>{k.full_name}</Text>
            <Text muted style={{ fontSize: 11, marginTop: 2 }}>{k.user?.email}</Text>
            <View style={{ marginTop: 8 }}>
              <Text muted style={{ fontSize: 11 }}>PAN: <Text style={{ fontWeight: '700' }}>{k.pan}</Text></Text>
              <Text muted style={{ fontSize: 11 }}>Aadhaar: <Text style={{ fontWeight: '700' }}>{k.aadhaar}</Text></Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <Button title="Approve" onPress={() => act(k.user_id, true)} testID={`kyc-ok-${k.kyc_id}`} style={{ flex: 1 }} />
              <Button title="Reject" variant="danger" onPress={() => act(k.user_id, false)} testID={`kyc-no-${k.kyc_id}`} style={{ flex: 1 }} />
            </View>
          </View>
        )}
        ListEmptyComponent={<Text muted style={{ textAlign: 'center', marginTop: 40 }}>No pending KYC</Text>}
      />
    </View>
  );
}
const s = StyleSheet.create({ card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSubtle, padding: 14, borderRadius: radii.md, marginBottom: 10 } });
