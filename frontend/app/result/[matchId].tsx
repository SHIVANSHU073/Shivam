import { useState } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/src/components/Text';
import { Input } from '@/src/components/Input';
import { Button } from '@/src/components/Button';
import { colors } from '@/src/theme';
import { api } from '@/src/api';
import { useToast } from '@/src/components/Toast';

export default function ResultUpload() {
  const router = useRouter();
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const toast = useToast();
  const [kills, setKills] = useState(''); const [position, setPosition] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      await api.uploadResult({ tournament_id: matchId!, kills: parseInt(kills), position: parseInt(position), screenshot_base64: 'data:placeholder' });
      toast.show('Result submitted for review', 'success');
      router.back();
    } catch (e: any) { toast.show(e.message, 'error'); }
    finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()} testID="back"><Ionicons name="chevron-back" size={26} color="#fff" /></TouchableOpacity>
        <Text style={{ fontSize: 22, fontWeight: '900' }}>Submit Result</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Input label="Kills" value={kills} onChangeText={setKills} keyboardType="numeric" testID="result-kills" />
        <Input label="Final Position" value={position} onChangeText={setPosition} keyboardType="numeric" testID="result-position" />
        <Text muted style={{ marginBottom: 12, fontSize: 12 }}>📷 Screenshot upload available in full version — submission with placeholder for review</Text>
        <Button title="Submit for Verification" onPress={submit} loading={loading} testID="result-submit" />
      </ScrollView>
    </SafeAreaView>
  );
}
