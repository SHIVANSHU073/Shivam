import { useEffect, useState } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/src/components/Text';
import { Input } from '@/src/components/Input';
import { Button } from '@/src/components/Button';
import { colors, radii } from '@/src/theme';
import { api } from '@/src/api';
import { useToast } from '@/src/components/Toast';

export default function Teams() {
  const router = useRouter(); const toast = useToast();
  const [teams, setTeams] = useState<any[]>([]);
  const [invite, setInvite] = useState('');
  const load = async () => { try { const r: any = await api.teams(); setTeams(r.teams || []); } catch {} };
  useEffect(() => { load(); }, []);
  const join = async () => { try { await api.teamJoin({ invite_code: invite }); toast.show('Joined!', 'success'); setInvite(''); load(); } catch (e: any) { toast.show(e.message, 'error'); } };
  const create = async () => { try { await api.teamCreate({ name: 'Squad ' + Math.floor(Math.random() * 999), game: 'BGMI', mode: 'SQUAD' }); load(); } catch (e: any) { toast.show(e.message, 'error'); } };
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()} testID="back"><Ionicons name="chevron-back" size={26} color="#fff" /></TouchableOpacity>
        <Text style={{ fontSize: 22, fontWeight: '900' }}>My Teams</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Button title="Create Squad" onPress={create} testID="team-create" />
        <View style={{ marginTop: 16 }}>
          <Input label="Join by Invite Code" value={invite} onChangeText={(t) => setInvite(t.toUpperCase())} autoCapitalize="characters" testID="team-invite" />
          <Button title="Join Team" variant="secondary" onPress={join} testID="team-join" />
        </View>
        <Text style={{ fontSize: 13, fontWeight: '900', letterSpacing: 2, marginTop: 20, marginBottom: 8 }}>MY TEAMS</Text>
        {teams.length === 0 ? <Text muted>No teams yet</Text> : teams.map((t: any) => (
          <View key={t.team_id} style={{ backgroundColor: colors.surface, borderColor: colors.borderSubtle, borderWidth: 1, padding: 14, borderRadius: radii.md, marginBottom: 8 }}>
            <Text style={{ fontWeight: '800' }}>{t.name}</Text>
            <Text muted style={{ fontSize: 11, marginTop: 4 }}>{t.game} · {t.mode} · {t.members?.length} members</Text>
            <Text style={{ color: colors.primary, fontWeight: '900', marginTop: 4, letterSpacing: 2 }}>CODE: {t.invite_code}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
