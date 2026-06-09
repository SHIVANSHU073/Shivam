import { useEffect, useState } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/src/components/Text';
import { colors, radii } from '@/src/theme';
import { api } from '@/src/api';

export default function Notifications() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => { (async () => { try { const r: any = await api.notifications(); setItems(r.notifications || []); await api.readAll(); } catch {} })(); }, []);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()} testID="back"><Ionicons name="chevron-back" size={26} color="#fff" /></TouchableOpacity>
        <Text style={{ fontSize: 22, fontWeight: '900' }}>Notifications</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {items.length === 0 ? <Text muted>No notifications yet</Text> : items.map((n) => (
          <View key={n.notification_id} style={{ backgroundColor: colors.surface, borderColor: n.read ? colors.borderSubtle : colors.borderActive, borderWidth: 1, padding: 14, borderRadius: radii.md, marginBottom: 8 }}>
            <Text style={{ fontWeight: '800' }}>{n.title}</Text>
            <Text muted style={{ marginTop: 4 }}>{n.message}</Text>
            <Text muted style={{ fontSize: 11, marginTop: 6 }}>{new Date(n.created_at).toLocaleString('en-IN')}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
