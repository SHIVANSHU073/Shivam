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

export default function Support() {
  const router = useRouter(); const toast = useToast();
  const [subject, setSubject] = useState(''); const [msg, setMsg] = useState('');
  const [tickets, setTickets] = useState<any[]>([]);
  const load = async () => { try { const r: any = await api.ticketsList(); setTickets(r.tickets || []); } catch {} };
  useEffect(() => { load(); }, []);
  const submit = async () => { if (!subject || !msg) return toast.show('Fill both fields', 'error'); try { await api.ticketCreate({ subject, message: msg }); toast.show('Ticket created', 'success'); setSubject(''); setMsg(''); load(); } catch (e: any) { toast.show(e.message, 'error'); } };
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()} testID="back"><Ionicons name="chevron-back" size={26} color="#fff" /></TouchableOpacity>
        <Text style={{ fontSize: 22, fontWeight: '900' }}>Support</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={{ fontSize: 13, fontWeight: '900', letterSpacing: 2, marginBottom: 8 }}>NEW TICKET</Text>
        <Input label="Subject" value={subject} onChangeText={setSubject} testID="ticket-subject" />
        <Input label="Message" value={msg} onChangeText={setMsg} multiline numberOfLines={4} style={{ minHeight: 100 }} testID="ticket-message" />
        <Button title="Submit Ticket" onPress={submit} testID="ticket-submit" />
        <Text style={{ fontSize: 13, fontWeight: '900', letterSpacing: 2, marginTop: 20, marginBottom: 8 }}>MY TICKETS</Text>
        {tickets.length === 0 ? <Text muted>No tickets yet</Text> : tickets.map((t: any) => (
          <View key={t.ticket_id} style={{ backgroundColor: colors.surface, borderColor: colors.borderSubtle, borderWidth: 1, padding: 14, borderRadius: radii.md, marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontWeight: '800' }}>{t.subject}</Text>
              <Text style={{ color: colors.warning, fontSize: 11, fontWeight: '800' }}>{t.status?.toUpperCase()}</Text>
            </View>
            <Text muted style={{ fontSize: 11, marginTop: 4 }}>{t.messages?.[0]?.message}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
