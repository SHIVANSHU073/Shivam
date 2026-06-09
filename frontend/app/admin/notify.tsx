import { useState } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/src/components/Text';
import { Input } from '@/src/components/Input';
import { Button } from '@/src/components/Button';
import { colors, radii } from '@/src/theme';
import { api } from '@/src/api';
import { useToast } from '@/src/components/Toast';

export default function AdminNotify() {
  const router = useRouter(); const toast = useToast();
  const [title, setTitle] = useState(''); const [msg, setMsg] = useState('');
  const [userId, setUserId] = useState('');
  const [target, setTarget] = useState<'all' | 'user'>('all');
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!title || !msg) return toast.show('Title and message required', 'error');
    if (target === 'user' && !userId) return toast.show('Enter user_id', 'error');
    setLoading(true);
    try {
      await api.adminNotify({ title, message: msg, target, user_id: target === 'user' ? userId : null });
      toast.show('Notification sent', 'success');
      setTitle(''); setMsg(''); setUserId('');
    } catch (e: any) { toast.show(e.message, 'error'); }
    finally { setLoading(false); }
  };

  const presets = [
    { t: 'Match starting soon', m: 'Your tournament begins in 15 minutes. Be ready!' },
    { t: 'Maintenance Notice', m: 'Servers will be down for 30 mins tonight at 2 AM IST.' },
    { t: 'New Tournament Live', m: 'Check out the latest tournament — register now!' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView edges={['top']}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 }}>
          <TouchableOpacity onPress={() => router.back()} testID="back"><Ionicons name="chevron-back" size={26} color="#fff" /></TouchableOpacity>
          <Text style={{ fontSize: 22, fontWeight: '900' }}>Notify Users</Text>
        </View>
      </SafeAreaView>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          <TouchableOpacity onPress={() => setTarget('all')} style={[s.pill, target === 'all' && s.pillA]} testID="target-all"><Text style={[s.pillT, target === 'all' && { color: colors.primary }]}>ALL USERS</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => setTarget('user')} style={[s.pill, target === 'user' && s.pillA]} testID="target-user"><Text style={[s.pillT, target === 'user' && { color: colors.primary }]}>SINGLE USER</Text></TouchableOpacity>
        </View>
        {target === 'user' && <Input label="User ID" value={userId} onChangeText={setUserId} testID="ntf-uid" />}
        <Input label="Title" value={title} onChangeText={setTitle} testID="ntf-title" />
        <Input label="Message" value={msg} onChangeText={setMsg} multiline numberOfLines={4} style={{ minHeight: 100 }} testID="ntf-msg" />
        <Button title="Send Broadcast" onPress={send} loading={loading} testID="ntf-send" />

        <Text style={{ fontSize: 11, fontWeight: '900', letterSpacing: 2, marginTop: 24, marginBottom: 8 }}>QUICK PRESETS</Text>
        {presets.map((p, i) => (
          <TouchableOpacity key={i} style={s.preset} onPress={() => { setTitle(p.t); setMsg(p.m); }} testID={`preset-${i}`}>
            <Text style={{ fontWeight: '800' }}>{p.t}</Text>
            <Text muted style={{ fontSize: 11, marginTop: 2 }}>{p.m}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
const s = StyleSheet.create({
  pill: { flex: 1, paddingVertical: 12, borderRadius: 999, borderWidth: 1, borderColor: colors.borderSubtle, backgroundColor: colors.surface, alignItems: 'center' },
  pillA: { borderColor: colors.borderActive, backgroundColor: 'rgba(0,229,255,0.12)' },
  pillT: { fontSize: 11, fontWeight: '800', letterSpacing: 1, color: colors.textMuted },
  preset: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSubtle, padding: 12, borderRadius: radii.md, marginBottom: 8 },
});
