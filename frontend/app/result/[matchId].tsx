import { useState } from 'react';
import { View, ScrollView, TouchableOpacity, Image } from 'react-native';
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

export default function ResultUpload() {
  const router = useRouter();
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const toast = useToast();
  const [kills, setKills] = useState(''); const [position, setPosition] = useState('');
  const [shot, setShot] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickShot = async () => {
    try {
      const r = await pickImage({ allowsEditing: false, quality: 0.5 });
      if (r) setShot(r.base64);
    } catch (e: any) { toast.show(e.message, 'error'); }
  };

  const submit = async () => {
    if (!kills || !position) return toast.show('Enter kills and position', 'error');
    if (!shot) return toast.show('Upload screenshot for verification', 'error');
    setLoading(true);
    try {
      await api.uploadResult({ tournament_id: matchId!, kills: parseInt(kills), position: parseInt(position), screenshot_base64: shot });
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
        <TouchableOpacity onPress={pickShot} testID="result-pick-screenshot" style={{ backgroundColor: colors.surface, borderColor: colors.borderActive, borderWidth: 1, borderRadius: radii.md, padding: 16, alignItems: 'center', marginBottom: 16 }}>
          {shot ? (
            <Image source={{ uri: shot }} style={{ width: '100%', height: 220, borderRadius: 8 }} resizeMode="contain" />
          ) : (
            <>
              <Ionicons name="image" size={28} color={colors.primary} />
              <Text style={{ fontWeight: '800', marginTop: 6, color: colors.primary }}>Upload Match Screenshot</Text>
              <Text muted style={{ fontSize: 11, marginTop: 2 }}>Show kills + position clearly</Text>
            </>
          )}
        </TouchableOpacity>
        <Button title="Submit for Verification" onPress={submit} loading={loading} testID="result-submit" />
      </ScrollView>
    </SafeAreaView>
  );
}
