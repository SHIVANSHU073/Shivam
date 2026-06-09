import { useEffect, useState } from 'react';
import { View, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/src/components/Text';
import { colors, radii } from '@/src/theme';
import { api } from '@/src/api';

export default function AdminLogs() {
  const router = useRouter();
  const [logs, setLogs] = useState<any[]>([]);
  useEffect(() => { (async () => { try { const r: any = await api.adminLogs(); setLogs(r.logs || []); } catch {} })(); }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView edges={['top']}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 }}>
          <TouchableOpacity onPress={() => router.back()} testID="back"><Ionicons name="chevron-back" size={26} color="#fff" /></TouchableOpacity>
          <Text style={{ fontSize: 22, fontWeight: '900' }}>Activity Logs</Text>
        </View>
      </SafeAreaView>
      <FlatList
        data={logs}
        keyExtractor={(l) => l.log_id}
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
        renderItem={({ item: l }) => (
          <View style={s.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontWeight: '900', color: colors.primary }}>{l.action}</Text>
              <Text muted style={{ fontSize: 10 }}>{new Date(l.created_at).toLocaleString('en-IN')}</Text>
            </View>
            <Text muted style={{ fontSize: 11, marginTop: 4 }}>By {l.admin?.name || l.admin_id} · Target: {l.target || '—'}</Text>
            {l.meta && Object.keys(l.meta).length > 0 && (
              <Text muted style={{ fontSize: 10, marginTop: 4 }}>{JSON.stringify(l.meta)}</Text>
            )}
          </View>
        )}
        ListEmptyComponent={<Text muted style={{ textAlign: 'center', marginTop: 40 }}>No admin actions yet</Text>}
      />
    </View>
  );
}
const s = StyleSheet.create({ card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSubtle, padding: 12, borderRadius: radii.md, marginBottom: 8 } });
