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

export default function Withdraw() {
  const router = useRouter();
  const { user, refresh } = useAuth();
  const toast = useToast();
  const [amount, setAmount] = useState('');
  const [upi, setUpi] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setLoading(true);
    try {
      await api.withdraw({ amount: parseFloat(amount), upi_id: upi });
      toast.show('Withdrawal request submitted', 'success');
      await refresh();
      router.back();
    } catch (e: any) { toast.show(e.message, 'error'); }
    finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()} testID="back"><Ionicons name="chevron-back" size={26} color="#fff" /></TouchableOpacity>
        <Text style={{ fontSize: 22, fontWeight: '900' }}>Withdraw</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text muted style={{ marginBottom: 12 }}>Winning balance: ₹{user?.wallet.winning?.toFixed(0) || 0} · Min ₹100 · KYC required</Text>
        <Input label="Amount (₹)" value={amount} onChangeText={setAmount} keyboardType="numeric" testID="wd-amount" />
        <Input label="UPI ID" value={upi} onChangeText={setUpi} autoCapitalize="none" placeholder="yourname@upi" testID="wd-upi" />
        <Button title="Request Withdrawal" onPress={onSubmit} loading={loading} testID="wd-submit" />
      </ScrollView>
    </SafeAreaView>
  );
}
