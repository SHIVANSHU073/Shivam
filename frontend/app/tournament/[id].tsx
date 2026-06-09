import { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, ImageBackground, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/src/components/Text';
import { Button } from '@/src/components/Button';
import { colors, radii } from '@/src/theme';
import { api } from '@/src/api';
import { useToast } from '@/src/components/Toast';
import { useAuth } from '@/src/AuthContext';

const HEADER = 'https://images.unsplash.com/photo-1655928461456-b5c6db979360';

export default function TournamentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const { refresh } = useAuth();
  const [t, setT] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try { const r: any = await api.tournament(id!); setT(r); } catch (e: any) { toast.show(e.message, 'error'); }
  };
  useEffect(() => { load(); }, [id]);

  if (!t) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;

  const onRegister = async () => {
    setLoading(true);
    try {
      const r: any = await api.register({ tournament_id: id! });
      toast.show(`Registered! Slot #${r.slot}`, 'success');
      await refresh();
      await load();
    } catch (e: any) { toast.show(e.message, 'error'); }
    finally { setLoading(false); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ImageBackground source={{ uri: HEADER }} style={{ height: 240 }} imageStyle={{ opacity: 0.5 }}>
        <LinearGradient colors={['rgba(5,5,10,0.4)', colors.bg]} style={StyleSheet.absoluteFill} />
        <SafeAreaView edges={['top']}>
          <TouchableOpacity onPress={() => router.back()} style={s.back} testID="t-back"><Ionicons name="chevron-back" size={26} color="#fff" /></TouchableOpacity>
        </SafeAreaView>
        <View style={s.heroTitle}>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <View style={s.tag}><Text style={s.tagText}>{t.game}</Text></View>
            <View style={[s.tag, { backgroundColor: 'rgba(0,229,255,0.2)' }]}><Text style={[s.tagText, { color: colors.primary }]}>{t.mode}</Text></View>
          </View>
          <Text style={s.title}>{t.title}</Text>
        </View>
      </ImageBackground>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 140 }}>
        <View style={s.statsRow}>
          <Stat label="PRIZE POOL" value={`₹${t.prize_pool}`} color={colors.success} />
          <Stat label="ENTRY" value={`₹${t.entry_fee}`} color={colors.primary} />
          <Stat label="PER KILL" value={`₹${t.per_kill || 0}`} color={colors.warning} />
        </View>
        <View style={s.infoCard}>
          <Row k="Map" v={t.map_name || '—'} />
          <Row k="Start Time" v={t.start_time ? new Date(t.start_time).toLocaleString('en-IN') : '—'} />
          <Row k="Slots" v={`${t.registered_count}/${t.max_slots}`} />
          <Row k="Status" v={t.status?.toUpperCase()} />
          {t.is_registered && <Row k="Your Slot" v={`#${t.my_registration?.slot}`} />}
        </View>
        {t.is_registered && t.room_id && (
          <LinearGradient colors={['rgba(0,229,255,0.2)', 'rgba(157,0,255,0.2)']} style={s.roomCard}>
            <Text style={{ letterSpacing: 2, fontSize: 11, fontWeight: '800', color: colors.primary }}>ROOM CREDENTIALS</Text>
            <Row k="Room ID" v={t.room_id} />
            <Row k="Password" v={t.room_password || '—'} />
          </LinearGradient>
        )}
        {t.rules && (
          <View style={s.infoCard}>
            <Text style={{ fontWeight: '900', letterSpacing: 1.5, fontSize: 12, marginBottom: 8 }}>RULES</Text>
            <Text muted style={{ lineHeight: 20 }}>{t.rules}</Text>
          </View>
        )}
        {t.is_registered ? (
          <Button title="Upload Match Result" onPress={() => router.push(`/result/${t.tournament_id}` as any)} testID="t-upload-result" />
        ) : (
          <Button title={`Register for ₹${t.entry_fee}`} onPress={onRegister} loading={loading} testID="t-register" disabled={t.registered_count >= t.max_slots} />
        )}
      </ScrollView>
    </View>
  );
}

const Stat: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
  <View style={[s.stat, { borderColor: color + '44' }]}>
    <Text muted style={{ fontSize: 9, letterSpacing: 1.5 }}>{label}</Text>
    <Text style={{ fontSize: 18, fontWeight: '900', color, marginTop: 4 }}>{value}</Text>
  </View>
);

const Row: React.FC<{ k: string; v: string }> = ({ k, v }) => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 }}>
    <Text muted>{k}</Text>
    <Text style={{ fontWeight: '700' }}>{v}</Text>
  </View>
);

const s = StyleSheet.create({
  back: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', marginLeft: 16, marginTop: 8 },
  heroTitle: { position: 'absolute', bottom: 16, left: 20, right: 20 },
  tag: { backgroundColor: colors.secondary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  tagText: { fontSize: 9, fontWeight: '900', color: '#fff', letterSpacing: 1 },
  title: { fontSize: 24, fontWeight: '900', color: '#fff', marginTop: 8, letterSpacing: -0.5 },
  statsRow: { flexDirection: 'row', gap: 8 },
  stat: { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderRadius: radii.md, padding: 14 },
  infoCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSubtle, borderRadius: radii.md, padding: 16, marginTop: 14 },
  roomCard: { padding: 16, borderRadius: radii.md, marginTop: 14, borderWidth: 1, borderColor: colors.borderActive },
});
