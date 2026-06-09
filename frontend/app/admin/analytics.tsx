import { useEffect, useState } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/src/components/Text';
import { colors, radii } from '@/src/theme';
import { api } from '@/src/api';

export default function Analytics() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  useEffect(() => { (async () => { try { setData(await api.adminAnalytics(30)); } catch {} })(); }, []);

  // Aggregate revenue by day
  const revByDay: Record<string, number> = {};
  (data?.revenue_by_day || []).forEach((r: any) => {
    const d = r._id.date;
    revByDay[d] = (revByDay[d] || 0) + r.total;
  });
  const revDays = Object.keys(revByDay).sort();
  const maxRev = Math.max(1, ...Object.values(revByDay) as number[]);
  const totalRev = Object.values(revByDay).reduce((a: number, b) => a + (b as number), 0);

  const usersByDay = data?.users_by_day || [];
  const maxUsers = Math.max(1, ...usersByDay.map((r: any) => r.count));
  const totalUsers = usersByDay.reduce((a: number, r: any) => a + r.count, 0);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView edges={['top']}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 }}>
          <TouchableOpacity onPress={() => router.back()} testID="back"><Ionicons name="chevron-back" size={26} color="#fff" /></TouchableOpacity>
          <Text style={{ fontSize: 22, fontWeight: '900' }}>Analytics</Text>
        </View>
      </SafeAreaView>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        <Text muted style={{ fontSize: 11, letterSpacing: 2 }}>LAST 30 DAYS</Text>

        <View style={[s.card, { marginTop: 12 }]}>
          <Text style={s.title}>Revenue · ₹{totalRev.toLocaleString('en-IN')}</Text>
          <View style={s.chart}>
            {revDays.length === 0 ? <Text muted style={{ alignSelf: 'center' }}>No revenue yet</Text> : revDays.map((d) => (
              <View key={d} style={{ alignItems: 'center', flex: 1 }}>
                <View style={{ flex: 1, justifyContent: 'flex-end' }}>
                  <View style={[s.bar, { height: (revByDay[d] / maxRev) * 100 + '%' as any, backgroundColor: colors.success }]} />
                </View>
                <Text style={{ fontSize: 8, color: colors.textMuted, marginTop: 4 }}>{d.slice(5)}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={s.card}>
          <Text style={s.title}>New Users · {totalUsers}</Text>
          <View style={s.chart}>
            {usersByDay.length === 0 ? <Text muted style={{ alignSelf: 'center' }}>No new users yet</Text> : usersByDay.map((r: any) => (
              <View key={r._id} style={{ alignItems: 'center', flex: 1 }}>
                <View style={{ flex: 1, justifyContent: 'flex-end' }}>
                  <View style={[s.bar, { height: (r.count / maxUsers) * 100 + '%' as any, backgroundColor: colors.primary }]} />
                </View>
                <Text style={{ fontSize: 8, color: colors.textMuted, marginTop: 4 }}>{r._id.slice(5)}</Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={{ fontSize: 13, fontWeight: '900', letterSpacing: 2, marginTop: 16, marginBottom: 8 }}>TOP TOURNAMENTS</Text>
        {(data?.top_tournaments || []).map((t: any, i: number) => (
          <View key={i} style={[s.card, { marginBottom: 8 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontWeight: '800', flex: 1 }} numberOfLines={1}>{t.title}</Text>
              <Text style={{ fontWeight: '900', color: colors.success }}>{t.registered}/{t.max_slots}</Text>
            </View>
            <Text muted style={{ fontSize: 11, marginTop: 2 }}>{t.game} · {t.mode} · ₹{t.prize_pool} pool</Text>
          </View>
        ))}
        {(!data?.top_tournaments?.length) && <Text muted>No tournament data yet</Text>}
      </ScrollView>
    </View>
  );
}
const s = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSubtle, padding: 16, borderRadius: radii.md, marginTop: 12 },
  title: { fontWeight: '900', fontSize: 15, marginBottom: 12 },
  chart: { height: 140, flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  bar: { width: '70%', alignSelf: 'center', borderTopLeftRadius: 4, borderTopRightRadius: 4, minHeight: 2 },
});
