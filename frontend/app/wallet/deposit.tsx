import { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
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

const QUICK = [100, 200, 500, 1000, 2000, 5000];

export default function Deposit() {
  const router = useRouter();
  const { refresh } = useAuth();
  const toast = useToast();
  const [amount, setAmount] = useState('500');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt < 10) return toast.show('Min ₹10', 'error');
    setLoading(true);
    try {
      await api.deposit(amt);
      toast.show(`₹${amt} added (mock Razorpay)`, 'success');
      await refresh();
      router.back();
    } catch (e: any) { toast.show(e.message, 'error'); }
    finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()} testID="back"><Ionicons name="chevron-back" size={26} color="#fff" /></TouchableOpacity>
        <Text style={{ fontSize: 22, fontWeight: '900' }}>Add Money</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={{ backgroundColor: 'rgba(255,170,0,0.1)', borderColor: colors.warning, borderWidth: 1, padding: 12, borderRadius: radii.md, marginBottom: 16 }}>
          <Text style={{ fontSize: 12 }}>⚠ MOCKED Razorpay flow — provide live keys to enable real payments</Text>
        </View>
        <Input label="Amount (₹)" value={amount} onChangeText={setAmount} keyboardType="numeric" testID="deposit-amount" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {QUICK.map((q) => (
            <TouchableOpacity key={q} onPress={() => setAmount(String(q))} style={st.quick} testID={`quick-${q}`}>
              <Text style={{ fontWeight: '800', color: colors.primary }}>₹{q}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Button title={`Pay ₹${amount || 0}`} onPress={onSubmit} loading={loading} testID="deposit-submit" />
      </ScrollView>
    </SafeAreaView>
  );
}
const st = StyleSheet.create({
  quick: { paddingHorizontal: 18, paddingVertical: 10, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSubtle, borderRadius: 999 },
});
