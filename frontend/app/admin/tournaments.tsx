import { useCallback, useState } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/src/components/Text';
import { Button } from '@/src/components/Button';
import { colors, radii } from '@/src/theme';
import { api } from '@/src/api';
import { useToast } from '@/src/components/Toast';

const FILTERS = ['ALL', 'BGMI', 'FREEFIRE'] as const;
const STATUSES = ['ALL', 'upcoming', 'live', 'completed'] as const;

export default function AdminTournaments() {
  const router = useRouter();
  const toast = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [game, setGame] = useState<string>('ALL');
  const [statusF, setStatusF] = useState<string>('ALL');

  const load = useCallback(async () => {
    try {
      const q: Record<string, string> = {};
      if (game !== 'ALL') q.game = game;
      if (statusF !== 'ALL') q.status = statusF;
      const r: any = await api.tournaments(q);
      setItems(r.tournaments || []);
    } catch {}
  }, [game, statusF]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const del = async (id: string, title: string) => {
    try {
      const r: any = await api.adminDeleteTournament(id);
      toast.show(`Deleted "${title}". Refunded ${r.refunded_users || 0} users.`, 'success');
      load();
    } catch (e: any) { toast.show(e.message, 'error'); }
  };

  const togglePublish = async (t: any) => {
    try {
      await api.adminUpdateTournament(t.tournament_id, { published: !(t.published !== false) });
      toast.show(t.published === false ? 'Published' : 'Unpublished', 'success');
      load();
    } catch (e: any) { toast.show(e.message, 'error'); }
  };

  const goLive = async (id: string) => {
    try { await api.adminUpdateTournament(id, { status: 'live' }); toast.show('Set to LIVE', 'success'); load(); } catch (e: any) { toast.show(e.message, 'error'); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.bg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 }}>
          <TouchableOpacity onPress={() => router.back()} testID="back"><Ionicons name="chevron-back" size={26} color="#fff" /></TouchableOpacity>
          <Text style={{ fontSize: 22, fontWeight: '900', flex: 1 }}>Tournaments</Text>
          <TouchableOpacity onPress={() => router.push('/admin/tournament-form')} style={st.addBtn} testID="admin-add-tournament">
            <Ionicons name="add" size={22} color={colors.bg} />
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.chipsRow}>
          {FILTERS.map((g) => (
            <TouchableOpacity key={g} onPress={() => setGame(g)} style={[st.chip, game === g && st.chipActive]} testID={`game-${g}`}>
              <Text style={[st.chipText, game === g && { color: colors.primary }]}>{g === 'FREEFIRE' ? 'FREE FIRE' : g}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.chipsRow}>
          {STATUSES.map((s2) => (
            <TouchableOpacity key={s2} onPress={() => setStatusF(s2)} style={[st.chip, statusF === s2 && { borderColor: colors.secondary, backgroundColor: 'rgba(157,0,255,0.12)' }]} testID={`status-${s2}`}>
              <Text style={[st.chipText, statusF === s2 && { color: colors.secondary }]}>{s2.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
      <FlatList
        data={items}
        keyExtractor={(t) => t.tournament_id}
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
        renderItem={({ item: t }) => (
          <View style={st.card} testID={`t-${t.tournament_id}`}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={st.gameTag}><Text style={{ fontSize: 9, fontWeight: '900', color: '#fff' }}>{t.game}</Text></View>
              <View style={[st.gameTag, { backgroundColor: 'rgba(0,229,255,0.15)' }]}><Text style={{ fontSize: 9, fontWeight: '900', color: colors.primary }}>{t.mode}</Text></View>
              <View style={[st.statusTag, { backgroundColor: t.status === 'live' ? colors.danger : t.status === 'completed' ? colors.textMuted : colors.warning }]}><Text style={{ fontSize: 9, fontWeight: '900', color: '#fff' }}>{t.status?.toUpperCase()}</Text></View>
              {t.published === false && <View style={[st.statusTag, { backgroundColor: '#666' }]}><Text style={{ fontSize: 9, fontWeight: '900', color: '#fff' }}>HIDDEN</Text></View>}
            </View>
            <Text style={{ fontSize: 16, fontWeight: '900', marginTop: 8 }}>{t.title}</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
              <Text muted style={{ fontSize: 11 }}>{t.registered}/{t.max_slots} slots</Text>
              <Text style={{ fontSize: 11, fontWeight: '800', color: colors.success }}>₹{t.prize_pool}</Text>
              <Text muted style={{ fontSize: 11 }}>{t.start_time ? new Date(t.start_time).toLocaleString('en-IN') : '—'}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
              <Button title="Edit" variant="secondary" onPress={() => router.push({ pathname: '/admin/tournament-form', params: { id: t.tournament_id } } as any)} testID={`edit-${t.tournament_id}`} style={{ flex: 1, minWidth: 80 }} />
              <Button title="Players" variant="ghost" onPress={() => router.push({ pathname: '/admin/registrations', params: { id: t.tournament_id, title: t.title } } as any)} testID={`players-${t.tournament_id}`} style={{ flex: 1, minWidth: 80 }} />
              {t.status === 'upcoming' && <Button title="Go LIVE" onPress={() => goLive(t.tournament_id)} testID={`live-${t.tournament_id}`} style={{ flex: 1, minWidth: 80 }} />}
              <Button title={t.published === false ? 'Publish' : 'Hide'} variant="ghost" onPress={() => togglePublish(t)} testID={`pub-${t.tournament_id}`} style={{ flex: 1, minWidth: 80 }} />
              <Button title="Delete" variant="danger" onPress={() => del(t.tournament_id, t.title)} testID={`del-${t.tournament_id}`} style={{ flex: 1, minWidth: 80 }} />
            </View>
          </View>
        )}
        ListEmptyComponent={<Text muted style={{ textAlign: 'center', marginTop: 40 }}>No tournaments</Text>}
      />
    </View>
  );
}

const st = StyleSheet.create({
  addBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  chipsRow: { paddingHorizontal: 16, paddingBottom: 8, gap: 8, flexDirection: 'row' },
  chip: { paddingHorizontal: 14, height: 32, borderRadius: 999, borderWidth: 1, borderColor: colors.borderSubtle, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  chipActive: { borderColor: colors.borderActive, backgroundColor: 'rgba(0,229,255,0.12)' },
  chipText: { fontSize: 11, fontWeight: '800', letterSpacing: 1, color: colors.textMuted },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSubtle, borderRadius: radii.md, padding: 14, marginBottom: 10 },
  gameTag: { backgroundColor: colors.secondary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  statusTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
});
