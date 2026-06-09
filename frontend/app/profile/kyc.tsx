import { useState } from 'react';
import { View, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/src/components/Text';
import { Input } from '@/src/components/Input';
import { Button } from '@/src/components/Button';
import { colors, radii } from '@/src/theme';
import { api } from '@/src/api';
import { useAuth } from '@/src/AuthContext';
import { useToast } from '@/src/components/Toast';
import { pickImage } from '@/src/utils/image';

export default function KYC() {
  const router = useRouter();
  const { user, refresh } = useAuth();
  const toast = useToast();
  const [fullName, setFullName] = useState('');
  const [pan, setPan] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [doc, setDoc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickDoc = async () => {
    try {
      const r = await pickImage({ aspect: [4, 3], quality: 0.5 });
      if (r) setDoc(r.base64);
    } catch (e: any) { toast.show(e.message, 'error'); }
  };

  const submit = async () => {
    if (!fullName || pan.length < 10 || aadhaar.length < 12) return toast.show('Fill all fields correctly', 'error');
    if (!doc) return toast.show('Upload document image', 'error');
    setLoading(true);
    try {
      await api.kycSubmit({ full_name: fullName, pan, aadhaar, document_base64: doc });
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
        <TouchableOpacity onPress={pickDoc} testID="kyc-pick-doc" style={{ backgroundColor: colors.surface, borderColor: colors.borderActive, borderWidth: 1, borderRadius: radii.md, padding: 16, alignItems: 'center', marginBottom: 16 }}>
          {doc ? (
            <Image source={{ uri: doc }} style={{ width: '100%', height: 180, borderRadius: 8 }} resizeMode="cover" />
          ) : (
            <>
              <Ionicons name="cloud-upload" size={28} color={colors.primary} />
              <Text style={{ fontWeight: '800', marginTop: 6, color: colors.primary }}>Upload Aadhaar / PAN Photo</Text>
              <Text muted style={{ fontSize: 11, marginTop: 2 }}>JPG/PNG, clear & readable</Text>
            </>
          )}
        </TouchableOpacity>
        <Button title="Submit for Review" onPress={submit} loading={loading} testID="kyc-submit" />
      </ScrollView>
    </SafeAreaView>
  );
}
