import { useEffect, useState } from 'react';
import { View, ScrollView, TouchableOpacity, Share } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/src/components/Text';
import { Button } from '@/src/components/Button';
import { colors, radii } from '@/src/theme';
import { api } from '@/src/api';

export default function Referral() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  useEffect(() => { (async () => { try { setData(await api.referral()); } catch {} })(); }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()} testID="back"><Ionicons name="chevron-back" size={26} color="#fff" /></TouchableOpacity>
        <Text style={{ fontSize: 22, fontWeight: '900' }}>Referral</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {data && (
          <>
            <View style={{ backgroundColor: colors.surface, borderColor: colors.borderActive, borderWidth: 1, padding: 20, borderRadius: radii.lg, alignItems: 'center' }}>
              <Text muted style={{ fontSize: 11, letterSpacing: 2 }}>YOUR CODE</Text>
              <Text style={{ fontSize: 32, fontWeight: '900', color: colors.primary, letterSpacing: 4, marginTop: 6 }}>{data.referral_code}</Text>
              <Button title="Share & Earn ₹25" onPress={() => Share.share({ message: data.share_message })} testID="ref-share" style={{ marginTop: 16, alignSelf: 'stretch' }} />
            </View>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
              <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: radii.md, padding: 16, borderWidth: 1, borderColor: colors.borderSubtle }}>
                <Text muted style={{ fontSize: 10, letterSpacing: 1.5 }}>FRIENDS</Text>
                <Text style={{ fontSize: 28, fontWeight: '900', color: colors.primary, marginTop: 4 }}>{data.count}</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: radii.md, padding: 16, borderWidth: 1, borderColor: colors.borderSubtle }}>
                <Text muted style={{ fontSize: 10, letterSpacing: 1.5 }}>EARNED</Text>
                <Text style={{ fontSize: 28, fontWeight: '900', color: colors.success, marginTop: 4 }}>₹{data.total_earned}</Text>
              </View>
            </View>
            <Text style={{ fontSize: 13, fontWeight: '900', letterSpacing: 2, marginTop: 20, marginBottom: 8 }}>INVITED FRIENDS</Text>
            {data.referrals.length === 0 ? <Text muted>No referrals yet — share your code to earn ₹25 each!</Text> : data.referrals.map((r: any, i: number) => (
              <View key={i} style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSubtle, padding: 12, borderRadius: radii.md, marginBottom: 8 }}>
                <Text style={{ fontWeight: '700' }}>{r.name}</Text>
                <Text muted style={{ fontSize: 11 }}>Joined {new Date(r.created_at).toLocaleDateString()}</Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
