import { useState } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/src/components/Text';
import { Input } from '@/src/components/Input';
import { Button } from '@/src/components/Button';
import { colors } from '@/src/theme';
import { api } from '@/src/api';
import { useAuth } from '@/src/AuthContext';
import { useToast } from '@/src/components/Toast';

export default function KYC() {
  const router = useRouter();
  const { user, refresh } = useAuth();
  const toast = useToast();
  const [fullName, setFullName] = useState('');
  const [pan, setPan] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!fullName || pan.length < 10 || aadhaar.length < 12) return toast.show('Fill all fields correctly', 'error');
    setLoading(true);
    try {
      await api.kycSubmit({ full_name: fullName, pan, aadhaar, document_base64: 'data:placeholder' });
      toast.show('KYC submitted for review', 'success');
      await refresh();
      router.back();
    } catch (e: any) { toast.show(e.message, 'error'); }
    finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()} testID="back"><Ionicons name="chevron-back" size={26} color="#fff" /></TouchableOpacity>
        <Text style={{ fontSize: 22, fontWeight: '900' }}>KYC Verification</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text muted style={{ marginBottom: 12 }}>Status: <Text style={{ color: colors.warning, fontWeight: '800' }}>{user?.kyc_status?.toUpperCase()}</Text></Text>
        <Input label="Full Name (as per Aadhaar)" value={fullName} onChangeText={setFullName} testID="kyc-name" />
        <Input label="PAN Number" value={pan} onChangeText={(t) => setPan(t.toUpperCase())} autoCapitalize="characters" maxLength={10} testID="kyc-pan" />
        <Input label="Aadhaar Number" value={aadhaar} onChangeText={setAadhaar} keyboardType="numeric" maxLength={12} testID="kyc-aadhaar" />
        <Button title="Submit for Review" onPress={submit} loading={loading} testID="kyc-submit" />
      </ScrollView>
    </SafeAreaView>
  );
}
