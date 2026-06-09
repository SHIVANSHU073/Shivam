import { useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/src/components/Text';
import { colors, radii } from '@/src/theme';
import { api } from '@/src/api';

const PERIODS = [
  { k: 'daily', label: 'DAILY' },
  { k: 'weekly', label: 'WEEKLY' },
  { k: 'monthly', label: 'MONTHLY' },
  { k: 'all', label: 'ALL TIME' },
] as const;

export default function Leaderboard() {
  const insets = useSafeAreaInsets();
  const [period, setPeriod] = useState<string>('weekly');
  const [rows, setRows] = useState<any[]>([]);

  const load = useCallback(async () => {
    try {
      const r: any = await api.leaderboard(period);
      setRows(r.leaderboard || []);
    } catch {}
  }, [period]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const top3 = rows.slice(0, 3);
  const rest = rows.slice(3);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.bg }}>
        <View style={styles.header}>
          <Text style={styles.title}>RANKINGS</Text>
          <Text muted style={{ fontSize: 12, marginTop: 2 }}>Top warriors of the arena</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          {PERIODS.map((p) => (
            <TouchableOpacity key={p.k} onPress={() => setPeriod(p.k)} style={[styles.chip, period === p.k && styles.chipActive]} testID={`period-${p.k}`}>
              <Text style={[styles.chipText, period === p.k && { color: colors.primary }]}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 + insets.bottom }}>
        {rows.length === 0 ? (
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <Text muted>No leaderboard data yet for this period</Text>
            <Text muted style={{ fontSize: 11, marginTop: 6 }}>Compete in tournaments to climb the ranks</Text>
          </View>
        ) : (
          <>
            {top3.length > 0 && (
              <View style={styles.podium}>
                {top3.map((r, i) => (
                  <View key={r.user_id} style={[styles.podCol, i === 0 && { transform: [{ translateY: -12 }] }]}>
                    <View style={[styles.avatar, i === 0 && { borderColor: '#FFD700', borderWidth: 2 }, i === 1 && { borderColor: '#C0C0C0', borderWidth: 2 }, i === 2 && { borderColor: '#CD7F32', borderWidth: 2 }]}>
                      {r.avatar_base64 ? <Image source={{ uri: r.avatar_base64 }} style={{ width: '100%', height: '100%', borderRadius: 32 }} /> : <Text style={{ fontSize: 22, fontWeight: '900' }}>{r.name?.[0]?.toUpperCase()}</Text>}
                    </View>
                    <Text style={styles.podName} numberOfLines={1}>{r.name}</Text>
                    <Text style={[styles.podAmt, i === 0 && { color: '#FFD700' }]}>₹{r.total_winnings.toFixed(0)}</Text>
                    <LinearGradient colors={i === 0 ? ['#FFD70055', '#FFD70022'] : i === 1 ? ['#C0C0C055', '#C0C0C022'] : ['#CD7F3255', '#CD7F3222']} style={[styles.podBar, { height: i === 0 ? 80 : i === 1 ? 60 : 45 }]}>
                      <Text style={styles.podRank}>{i + 1}</Text>
                    </LinearGradient>
                  </View>
                ))}
              </View>
            )}

            {rest.map((r) => (
              <View key={r.user_id} style={styles.row} testID={`leaderboard-row-${r.rank}`}>
                <Text style={styles.rank}>#{r.rank}</Text>
                <View style={styles.rowAvatar}>
                  {r.avatar_base64 ? <Image source={{ uri: r.avatar_base64 }} style={{ width: '100%', height: '100%', borderRadius: 20 }} /> : <Text style={{ fontWeight: '800' }}>{r.name?.[0]?.toUpperCase()}</Text>}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '800' }}>{r.name}</Text>
                  <Text muted style={{ fontSize: 11 }}>{r.matches} matches · {r.total_kills} kills</Text>
                </View>
                <Text style={{ fontWeight: '900', color: colors.success }}>₹{r.total_winnings.toFixed(0)}</Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 8 },
  title: { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  chipsRow: { paddingHorizontal: 16, paddingBottom: 8, gap: 8, flexDirection: 'row' },
  chip: { paddingHorizontal: 16, height: 36, borderRadius: 999, borderWidth: 1, borderColor: colors.borderSubtle, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  chipActive: { borderColor: colors.borderActive, backgroundColor: 'rgba(0,229,255,0.12)' },
  chipText: { fontSize: 11, fontWeight: '800', letterSpacing: 1, color: colors.textMuted },
  podium: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', marginVertical: 18 },
  podCol: { alignItems: 'center', flex: 1 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  podName: { fontSize: 12, fontWeight: '800', marginTop: 6, maxWidth: 80, textAlign: 'center' },
  podAmt: { fontSize: 13, fontWeight: '900', color: colors.success, marginBottom: 6 },
  podBar: { width: '85%', alignItems: 'center', justifyContent: 'center', borderTopLeftRadius: 8, borderTopRightRadius: 8 },
  podRank: { fontSize: 22, fontWeight: '900', color: '#fff' },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.borderSubtle, borderWidth: 1, padding: 12, borderRadius: radii.md, marginBottom: 8, gap: 12 },
  rank: { fontWeight: '900', color: colors.primary, width: 36, fontSize: 13 },
  rowAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
});
