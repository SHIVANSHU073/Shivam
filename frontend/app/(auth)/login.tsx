import { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/src/components/Text';
import { Input } from '@/src/components/Input';
import { Button } from '@/src/components/Button';
import { colors, radii } from '@/src/theme';
import { api } from '@/src/api';
import { useAuth } from '@/src/AuthContext';
import { useToast } from '@/src/components/Toast';

export default function Login() {
  const router = useRouter();
  const { signIn } = useAuth();
  const toast = useToast();
  const [mode, setMode] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('player@clutcharena.com');
  const [password, setPassword] = useState('Player@123');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const onEmailLogin = async () => {
    setLoading(true);
    try {
      const r: any = await api.login({ email, password });
      await signIn(r.token, r.user);
      toast.show('Welcome back, ' + r.user.name, 'success');
      router.replace('/(tabs)/home');
    } catch (e: any) {
      toast.show(e.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const onSendOtp = async () => {
    if (phone.length < 10) return toast.show('Enter valid 10-digit number', 'error');
    setLoading(true);
    try {
      const r: any = await api.otpSend({ phone });
      toast.show(`OTP sent (dev: ${r.dev_otp})`, 'success');
      setOtpSent(true);
    } catch (e: any) {
      toast.show(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const onVerifyOtp = async () => {
    setLoading(true);
    try {
      const r: any = await api.otpVerify({ phone, otp });
      await signIn(r.token, r.user);
      toast.show('Logged in!', 'success');
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
            <View style={styles.brand}>
              <Text style={styles.logo}>CLUTCH<Text style={{ color: colors.primary }}>ARENA</Text></Text>
              <Text muted style={styles.tag}>REAL CASH. REAL GLORY.</Text>
            </View>

            <View style={styles.tabs}>
              <TouchableOpacity style={[styles.tab, mode === 'email' && styles.tabActive]} onPress={() => setMode('email')} testID="login-tab-email">
                <Text style={[styles.tabText, mode === 'email' && { color: colors.primary }]}>Email</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tab, mode === 'otp' && styles.tabActive]} onPress={() => setMode('otp')} testID="login-tab-otp">
                <Text style={[styles.tabText, mode === 'otp' && { color: colors.primary }]}>Mobile OTP</Text>
              </TouchableOpacity>
            </View>

            {mode === 'email' ? (
              <View>
                <Input label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" testID="login-email-input" placeholder="you@clutcharena.com" />
                <Input label="Password" value={password} onChangeText={setPassword} secureTextEntry testID="login-password-input" placeholder="••••••••" />
                <Button title="Sign In" onPress={onEmailLogin} loading={loading} testID="login-submit-button" />
              </View>
            ) : (
              <View>
                <Input label="Mobile Number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="10-digit number" testID="otp-phone-input" />
                {otpSent && (
                  <Input label="OTP" value={otp} onChangeText={setOtp} keyboardType="number-pad" placeholder="6-digit OTP" testID="otp-code-input" />
                )}
                <Button
                  title={otpSent ? 'Verify OTP' : 'Send OTP'}
                  onPress={otpSent ? onVerifyOtp : onSendOtp}
                  loading={loading}
                  testID="otp-action-button"
                />
              </View>
            )}

            <View style={styles.divider}>
              <View style={styles.line} />
              <Text muted style={{ marginHorizontal: 8, fontSize: 11 }}>OR</Text>
              <View style={styles.line} />
            </View>

            <Button
              title="Continue with Google"
              variant="ghost"
              testID="login-google-button"
              onPress={() => toast.show('Google Auth available after deployment', 'info')}
            />

            <TouchableOpacity onPress={() => router.push('/(auth)/signup')} style={styles.signupLink} testID="goto-signup">
              <Text muted>New to ClutchArena?  </Text>
              <Text style={{ color: colors.primary, fontWeight: '800' }}>Create Account</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 24, flexGrow: 1, justifyContent: 'center' },
  brand: { alignItems: 'center', marginBottom: 36 },
  logo: { fontSize: 36, fontWeight: '900', color: '#fff', letterSpacing: -1 },
  tag: { letterSpacing: 4, fontSize: 11, marginTop: 6, fontWeight: '700' },
  tabs: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radii.md, padding: 4, marginBottom: 20, borderWidth: 1, borderColor: colors.borderSubtle },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: radii.sm },
  tabActive: { backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.borderActive },
  tabText: { fontWeight: '700', color: colors.textMuted, fontSize: 13 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  line: { flex: 1, height: 1, backgroundColor: colors.borderSubtle },
  signupLink: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
});
