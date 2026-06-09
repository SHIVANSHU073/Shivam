import { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/src/components/Text';
import { Input } from '@/src/components/Input';
import { Button } from '@/src/components/Button';
import { colors } from '@/src/theme';
import { api } from '@/src/api';
import { useAuth } from '@/src/AuthContext';
import { useToast } from '@/src/components/Toast';

export default function Signup() {
  const router = useRouter();
  const { signIn } = useAuth();
  const toast = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [ref, setRef] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!name || !email || password.length < 6) {
      return toast.show('Fill all fields (password ≥ 6 chars)', 'error');
    }
    setLoading(true);
    try {
      const r: any = await api.signup({ name, email, password, phone: phone || undefined, referral_code: ref || undefined });
      await signIn(r.token, r.user);
      toast.show('Welcome to ClutchArena!', 'success');
      router.replace('/(tabs)/home');
    } catch (e: any) {
      toast.show(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <LinearGradient colors={['#0a0014', colors.bg]} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <TouchableOpacity onPress={() => router.back()} style={styles.back} testID="back-button">
              <Ionicons name="chevron-back" size={26} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.title}>JOIN THE ARENA</Text>
            <Text muted style={styles.sub}>Sign up and win real cash playing BGMI & Free Fire</Text>
            <Input label="Full Name" value={name} onChangeText={setName} testID="signup-name-input" placeholder="Your name" />
            <Input label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" testID="signup-email-input" placeholder="you@example.com" />
            <Input label="Password" value={password} onChangeText={setPassword} secureTextEntry testID="signup-password-input" placeholder="Min 6 characters" />
            <Input label="Mobile (optional)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" testID="signup-phone-input" placeholder="10-digit number" />
            <Input label="Referral Code (optional)" value={ref} onChangeText={setRef} autoCapitalize="characters" testID="signup-ref-input" placeholder="Get ₹50 bonus" />
            <Button title="Create Account" onPress={onSubmit} loading={loading} testID="signup-submit-button" />
            <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 18, alignItems: 'center' }} testID="goto-login">
              <Text muted>Already have an account?  <Text style={{ color: colors.primary, fontWeight: '800' }}>Sign in</Text></Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 24 },
  back: { marginBottom: 12, width: 40 },
  title: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5, marginBottom: 6, color: '#fff' },
  sub: { marginBottom: 24, fontSize: 13 },
});
