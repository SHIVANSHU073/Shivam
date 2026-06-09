import { useEffect, useState } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/src/components/Text';
import { Input } from '@/src/components/Input';
import { Button } from '@/src/components/Button';
import { colors, radii } from '@/src/theme';
import { api } from '@/src/api';
import { useToast } from '@/src/components/Toast';
import { pickImage } from '@/src/utils/image';

const GAMES = ['BGMI', 'FREEFIRE'];
const MODES = ['SOLO', 'DUO', 'SQUAD'];
const MAPS = ['Erangel', 'Miramar', 'Sanhok', 'Vikendi', 'Livik', 'Bermuda', 'Purgatory', 'Kalahari'];

export default function TournamentForm() {
  const router = useRouter();
  const toast = useToast();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!id;

  const [form, setForm] = useState<any>({
    title: '',
    game: 'BGMI',
    mode: 'SQUAD',
    type: 'public',
    entry_fee: '50',
    prize_pool: '5000',
    max_slots: '100',
    per_kill: '10',
    map_name: 'Erangel',
    start_time: '',
    registration_close_time: '',
    rules: '1. No emulators\n2. No teaming\n3. Screenshot mandatory',
    description: '',
    cover_image: null as string | null,
    room_id: '',
    room_password: '',
    published: true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isEdit) {
      const dt = new Date(Date.now() + 4 * 3600 * 1000);
      setForm((f: any) => ({ ...f, start_time: dt.toISOString().slice(0, 16) }));
      return;
    }
    (async () => {
      try {
        const t: any = await api.tournament(id!);
        setForm({
          title: t.title,
          game: t.game,
          mode: t.mode,
          type: t.type || 'public',
          entry_fee: String(t.entry_fee || 0),
          prize_pool: String(t.prize_pool || 0),
          max_slots: String(t.max_slots || 0),
          per_kill: String(t.per_kill || 0),
          map_name: t.map_name || 'Erangel',
          start_time: t.start_time ? new Date(t.start_time).toISOString().slice(0, 16) : '',
          registration_close_time: t.registration_close_time ? new Date(t.registration_close_time).toISOString().slice(0, 16) : '',
          rules: t.rules || '',
          description: t.description || '',
          cover_image: t.cover_image || null,
          room_id: t.room_id || '',
          room_password: t.room_password || '',
          published: t.published !== false,
        });
      } catch (e: any) { toast.show(e.message, 'error'); }
    })();
  }, [id, isEdit]);

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const pickBanner = async () => {
    try {
      const r = await pickImage({ aspect: [16, 9], quality: 0.5 });
      if (r) set('cover_image', r.base64);
    } catch (e: any) { toast.show(e.message, 'error'); }
  };

  const submit = async () => {
    if (!form.title || !form.start_time) return toast.show('Title and start time required', 'error');
    const payload: any = {
      title: form.title,
      game: form.game,
      mode: form.mode,
      type: form.type,
      entry_fee: parseFloat(form.entry_fee || '0'),
      prize_pool: parseFloat(form.prize_pool || '0'),
      max_slots: parseInt(form.max_slots || '0'),
      per_kill: parseFloat(form.per_kill || '0'),
      map_name: form.map_name,
      start_time: new Date(form.start_time).toISOString(),
      registration_close_time: form.registration_close_time ? new Date(form.registration_close_time).toISOString() : null,
      rules: form.rules,
      description: form.description,
      cover_image: form.cover_image,
      room_id: form.room_id,
      room_password: form.room_password,
      published: form.published,
    };
    setLoading(true);
    try {
      if (isEdit) {
        await api.adminUpdateTournament(id!, payload);
        toast.show('Tournament updated', 'success');
      } else {
        await api.adminCreateTournament(payload);
        toast.show('Tournament created', 'success');
      }
      router.back();
    } catch (e: any) { toast.show(e.message, 'error'); }
    finally { setLoading(false); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.bg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 }}>
          <TouchableOpacity onPress={() => router.back()} testID="form-back"><Ionicons name="chevron-back" size={26} color="#fff" /></TouchableOpacity>
          <Text style={{ fontSize: 22, fontWeight: '900' }}>{isEdit ? 'Edit Tournament' : 'New Tournament'}</Text>
        </View>
      </SafeAreaView>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        <Section title="GAME" />
        <Pills options={GAMES} value={form.game} onChange={(v) => set('game', v)} testIdPrefix="game-pill" />
        <Section title="MATCH TYPE" />
        <Pills options={MODES} value={form.mode} onChange={(v) => set('mode', v)} testIdPrefix="mode-pill" />
        <Section title="VISIBILITY" />
        <Pills options={['public', 'private']} value={form.type} onChange={(v) => set('type', v)} testIdPrefix="type-pill" />

        <Section title="DETAILS" />
        <Input label="Tournament Name" value={form.title} onChangeText={(v) => set('title', v)} testID="t-title" />
        <Input label="Description" value={form.description} onChangeText={(v) => set('description', v)} multiline numberOfLines={3} style={{ minHeight: 80 }} testID="t-desc" />

        <Section title="ECONOMICS" />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}><Input label="Entry Fee (₹)" value={form.entry_fee} onChangeText={(v) => set('entry_fee', v)} keyboardType="numeric" testID="t-fee" /></View>
          <View style={{ flex: 1 }}><Input label="Prize Pool (₹)" value={form.prize_pool} onChangeText={(v) => set('prize_pool', v)} keyboardType="numeric" testID="t-prize" /></View>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}><Input label="Max Slots" value={form.max_slots} onChangeText={(v) => set('max_slots', v)} keyboardType="numeric" testID="t-slots" /></View>
          <View style={{ flex: 1 }}><Input label="Per Kill (₹)" value={form.per_kill} onChangeText={(v) => set('per_kill', v)} keyboardType="numeric" testID="t-perkill" /></View>
        </View>

        <Section title="MAP" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, flexDirection: 'row' }}>
          {MAPS.map((m) => (
            <TouchableOpacity key={m} onPress={() => set('map_name', m)} style={[st.mapChip, form.map_name === m && st.mapChipActive]} testID={`map-${m}`}>
              <Text style={[st.chipText, form.map_name === m && { color: colors.primary }]}>{m}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Section title="TIMING" />
        <Input label="Start Time (YYYY-MM-DDTHH:MM)" value={form.start_time} onChangeText={(v) => set('start_time', v)} placeholder="2026-06-10T18:30" testID="t-start" />
        <Input label="Registration Close (optional)" value={form.registration_close_time} onChangeText={(v) => set('registration_close_time', v)} placeholder="2026-06-10T18:00" testID="t-regclose" />

        <Section title="ROOM CREDENTIALS (revealed when LIVE)" />
        <Input label="Room ID" value={form.room_id} onChangeText={(v) => set('room_id', v)} testID="t-room" />
        <Input label="Room Password" value={form.room_password} onChangeText={(v) => set('room_password', v)} testID="t-roompw" />

        <Section title="RULES" />
        <Input label="Rules (one per line)" value={form.rules} onChangeText={(v) => set('rules', v)} multiline numberOfLines={5} style={{ minHeight: 110 }} testID="t-rules" />

        <Section title="BANNER" />
        <TouchableOpacity onPress={pickBanner} style={st.bannerBox} testID="t-pick-banner">
          {form.cover_image ? <Image source={{ uri: form.cover_image }} style={{ width: '100%', height: 140, borderRadius: 8 }} resizeMode="cover" /> : (
            <>
              <Ionicons name="image" size={28} color={colors.primary} />
              <Text style={{ fontWeight: '800', marginTop: 6, color: colors.primary }}>Upload Banner (16:9)</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16 }}>
          <TouchableOpacity onPress={() => set('published', !form.published)} testID="t-publish-toggle" style={[st.toggle, form.published && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
            <View style={[st.toggleDot, form.published && { backgroundColor: colors.bg, transform: [{ translateX: 18 }] }]} />
          </TouchableOpacity>
          <Text style={{ fontWeight: '800' }}>{form.published ? 'Published (visible to players)' : 'Hidden (admin only)'}</Text>
        </View>

        <Button title={isEdit ? 'Save Changes' : 'Create Tournament'} onPress={submit} loading={loading} testID="t-submit" style={{ marginTop: 24 }} />
      </ScrollView>
    </View>
  );
}

const Section: React.FC<{ title: string }> = ({ title }) => (
  <Text style={{ fontSize: 11, fontWeight: '900', letterSpacing: 2, color: colors.primary, marginTop: 18, marginBottom: 8 }}>{title}</Text>
);

const Pills: React.FC<{ options: string[]; value: string; onChange: (v: string) => void; testIdPrefix: string }> = ({ options, value, onChange, testIdPrefix }) => (
  <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
    {options.map((o) => (
      <TouchableOpacity key={o} onPress={() => onChange(o)} style={[st.pill, value === o && st.pillActive]} testID={`${testIdPrefix}-${o}`}>
        <Text style={[st.chipText, value === o && { color: colors.primary }]}>{o.toUpperCase()}</Text>
      </TouchableOpacity>
    ))}
  </View>
);

const st = StyleSheet.create({
  pill: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, borderWidth: 1, borderColor: colors.borderSubtle, backgroundColor: colors.surface },
  pillActive: { borderColor: colors.borderActive, backgroundColor: 'rgba(0,229,255,0.12)' },
  chipText: { fontSize: 11, fontWeight: '800', letterSpacing: 1, color: colors.textMuted },
  mapChip: { paddingHorizontal: 14, height: 36, borderRadius: 999, borderWidth: 1, borderColor: colors.borderSubtle, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  mapChipActive: { borderColor: colors.borderActive, backgroundColor: 'rgba(0,229,255,0.12)' },
  bannerBox: { backgroundColor: colors.surface, borderColor: colors.borderActive, borderWidth: 1, borderRadius: radii.md, padding: 16, alignItems: 'center' },
  toggle: { width: 42, height: 24, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSubtle, padding: 2, justifyContent: 'center' },
  toggleDot: { width: 18, height: 18, borderRadius: 9, backgroundColor: colors.textMuted },
});
