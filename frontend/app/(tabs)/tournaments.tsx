import { useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, FlatList, RefreshControl } from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/src/components/Text';
import { colors, radii } from '@/src/theme';
import { api } from '@/src/api';
import { TournamentCard } from './home';

const GAMES = ['ALL', 'BGMI', 'FREEFIRE'] as const;
const MODES = ['ALL', 'SOLO', 'DUO', 'SQUAD'] as const;

export default function Tournaments() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ game?: string }>();
  const [game, setGame] = useState<string>((params.game as string) || 'ALL');
  const [mode, setMode] = useState<string>('ALL');
  const [items, setItems] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const q: Record<string, string> = {};
      if (game !== 'ALL') q.game = game;
      if (mode !== 'ALL') q.mode = mode;
      const r: any = await api.tournaments(q);
      setItems(r.tournaments || []);
    } catch {}
  }, [game, mode]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.bg }}>
        <View style={styles.header}>
          <Text style={styles.title}>BATTLES</Text>
          <Text muted style={{ fontSize: 12, marginTop: 2 }}>Choose your war zone</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          {GAMES.map((g) => (
            <TouchableOpacity key={g} onPress={() => setGame(g)} style={[styles.chip, game === g && styles.chipActive]} testID={`filter-game-${g}`}>
              <Text style={[styles.chipText, game === g && styles.chipTextActive]}>{g === 'FREEFIRE' ? 'FREE FIRE' : g}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.chipsRow, { paddingTop: 0 }]}>
          {MODES.map((m) => (
            <TouchableOpacity key={m} onPress={() => setMode(m)} style={[styles.chip, mode === m && styles.chipActiveSecondary]} testID={`filter-mode-${m}`}>
              <Text style={[styles.chipText, mode === m && { color: colors.secondary }]}>{m}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
      <FlatList
        data={items}
        keyExtractor={(i) => i.tournament_id}
        renderItem={({ item }) => <TournamentCard t={item} onPress={() => router.push(`/tournament/${item.tournament_id}` as any)} />}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 120 + insets.bottom }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 80 }}>
            <Text muted>No battles yet for these filters</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  chipsRow: { paddingHorizontal: 16, paddingBottom: 10, gap: 8, flexDirection: 'row' },
  chip: { paddingHorizontal: 16, height: 36, borderRadius: 999, borderWidth: 1, borderColor: colors.borderSubtle, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  chipActive: { borderColor: colors.borderActive, backgroundColor: 'rgba(0,229,255,0.12)' },
  chipActiveSecondary: { borderColor: colors.secondary, backgroundColor: 'rgba(157,0,255,0.12)' },
  chipText: { fontSize: 12, fontWeight: '800', letterSpacing: 1, color: colors.textMuted },
  chipTextActive: { color: colors.primary },
});
