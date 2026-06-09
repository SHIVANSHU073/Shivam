import { useEffect, useState } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/src/components/Text';
import { colors, radii } from '@/src/theme';
import { api } from '@/src/api';

export default function MatchHistory() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => { (async () => { try { const [my, res]: any = await Promise.all([api.myTournaments(), api.myResults()]); setItems([{ regs: my.items, results: res.results }]); } catch {} })(); }, []);
  const regs = items[0]?.regs || [];
  const results = items[0]?.results || [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()} testID="back"><Ionicons name="chevron-back" size={26} color="#fff" /></TouchableOpacity>
        <Text style={{ fontSize: 22, fontWeight: '900' }}>Match History</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={{ fontSize: 13, fontWeight: '900', letterSpacing: 2, marginBottom: 8 }}>REGISTERED</Text>
        {regs.length === 0 ? <Text muted>No tournaments yet</Text> : regs.map((it: any) => (
          <TouchableOpacity key={it.registration.registration_id} style={{ backgroundColor: colors.surface, borderColor: colors.borderSubtle, borderWidth: 1, padding: 14, borderRadius: radii.md, marginBottom: 8 }} onPress={() => router.push(`/tournament/${it.tournament.tournament_id}` as any)}>
            <Text style={{ fontWeight: '800' }}>{it.tournament.title}</Text>
            <Text muted style={{ fontSize: 11, marginTop: 4 }}>Slot #{it.registration.slot} · {it.tournament.status}</Text>
          </TouchableOpacity>
        ))}
        <Text style={{ fontSize: 13, fontWeight: '900', letterSpacing: 2, marginTop: 20, marginBottom: 8 }}>RESULTS</Text>
        {results.length === 0 ? <Text muted>No results submitted yet</Text> : results.map((r: any) => (
          <View key={r.result_id} style={{ backgroundColor: colors.surface, borderColor: colors.borderSubtle, borderWidth: 1, padding: 14, borderRadius: radii.md, marginBottom: 8 }}>
            <Text style={{ fontWeight: '800' }}>{r.tournament?.title}</Text>
            <Text muted style={{ fontSize: 11, marginTop: 4 }}>#{r.position} · {r.kills} kills · {r.status} · ₹{r.payout}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
