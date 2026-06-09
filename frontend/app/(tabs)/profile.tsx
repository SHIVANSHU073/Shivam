import { useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, Share } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/src/components/Text';
import { Button } from '@/src/components/Button';
import { colors, radii } from '@/src/theme';
import { useAuth } from '@/src/AuthContext';
import { useToast } from '@/src/components/Toast';
import { pickImage } from '@/src/utils/image';
import { api } from '@/src/api';

export default function Profile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, signOut, refresh } = useAuth();
  const toast = useToast();
  const [vip, setVip] = useState<any>(null);

  const loadVip = async () => {
    try { setVip(await api.vipStatus()); } catch {}
  };
  useFocusEffect(useCallback(() => { refresh(); loadVip(); }, [refresh]));

  if (!user) return null;

  const onShareRef = async () => {
    try {
      await Share.share({ message: `Join ClutchArena & win real cash playing BGMI/Free Fire! Use my code ${user.referral_code} for ₹50 bonus.` });
    } catch {}
  };

  const changeAvatar = async () => {
    try {
      const r = await pickImage({ aspect: [1, 1], quality: 0.4 });
      if (!r) return;
      await api.updateProfile({ avatar_base64: r.base64 });
      toast.show('Avatar updated', 'success');
      await refresh();
    } catch (e: any) { toast.show(e.message, 'error'); }
  };

  const kycColor = user.kyc_status === 'approved' ? colors.success : user.kyc_status === 'pending' ? colors.warning : colors.danger;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.bg }}>
        <LinearGradient colors={['rgba(157,0,255,0.25)', 'transparent']} style={styles.headerWrap}>
          <TouchableOpacity onPress={changeAvatar} style={styles.avatarWrap} testID="change-avatar-btn">
            <View style={styles.avatar}>
              {user.avatar_base64 ? <Image source={{ uri: user.avatar_base64 }} style={{ width: '100%', height: '100%', borderRadius: 48 }} /> : <Text style={{ fontSize: 34, fontWeight: '900' }}>{user.name?.[0]?.toUpperCase()}</Text>}
            </View>
            <View style={styles.cameraBadge}>
              <Ionicons name="camera" size={14} color={colors.bg} />
            </View>
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 }}>
            <Text style={styles.name} testID="profile-name">{user.name}</Text>
            {vip?.active && (
              <View style={styles.vipChip} testID="profile-vip-badge">
                <Ionicons name="diamond" size={11} color="#FFD700" />
                <Text style={{ fontSize: 10, fontWeight: '900', color: '#FFD700', letterSpacing: 1 }}>VIP</Text>
              </View>
            )}
          </View>
          <Text muted style={{ fontSize: 12 }}>{user.email || user.phone}</Text>
          <View style={[styles.kycBadge, { borderColor: kycColor }]}>
            <View style={[styles.kycDot, { backgroundColor: kycColor }]} />
            <Text style={{ fontSize: 11, fontWeight: '800', letterSpacing: 1, color: kycColor }}>KYC {user.kyc_status.toUpperCase()}</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 + insets.bottom }}>
        {!vip?.active && (
          <TouchableOpacity onPress={() => router.push('/vip')} activeOpacity={0.85} testID="profile-vip-upsell">
            <LinearGradient colors={['#FFD700', '#FF6A00', colors.secondary]} style={styles.vipUpsell}>
              <Ionicons name="diamond" size={28} color="#fff" />
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '900', color: '#fff', fontSize: 15, letterSpacing: 1 }}>UNLOCK VIP</Text>
                <Text style={{ color: '#fff', fontSize: 11, opacity: 0.95 }}>10% off fees · 2× referrals · Exclusive tournaments</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        )}

        <View style={styles.refCard} testID="profile-referral-card">
          <View style={{ flex: 1 }}>
            <Text muted style={{ fontSize: 10, letterSpacing: 1.5 }}>YOUR REFERRAL CODE</Text>
            <Text style={styles.refCode}>{user.referral_code}</Text>
            <Text muted style={{ fontSize: 11, marginTop: 4 }}>Share & earn ₹{vip?.active ? 50 : 25} per friend</Text>
          </View>
          <TouchableOpacity onPress={onShareRef} style={styles.shareBtn} testID="share-referral-btn">
            <Ionicons name="share-social" color={colors.primary} size={18} />
          </TouchableOpacity>
        </View>

        <MenuItem icon="diamond" label={vip?.active ? 'VIP Membership' : 'Get VIP'} badge={vip?.active ? 'ACTIVE' : undefined} onPress={() => router.push('/vip')} testID="menu-vip" tint="#FFD700" />
        <MenuItem icon="person" label="Edit Profile" onPress={() => router.push('/profile/edit')} testID="menu-edit-profile" />
        <MenuItem icon="shield-checkmark" label="KYC Verification" badge={user.kyc_status} onPress={() => router.push('/profile/kyc')} testID="menu-kyc" />
        <MenuItem icon="trophy" label="Match History" onPress={() => router.push('/profile/match-history')} testID="menu-history" />
        <MenuItem icon="people" label="Referral Dashboard" onPress={() => router.push('/profile/referral')} testID="menu-referral" />
        <MenuItem icon="people-circle" label="My Teams" onPress={() => router.push('/profile/teams')} testID="menu-teams" />
        <MenuItem icon="chatbubbles" label="Support" onPress={() => router.push('/profile/support')} testID="menu-support" />
        <MenuItem icon="notifications" label="Notifications" onPress={() => router.push('/notifications')} testID="menu-notifications" />

        {user.role === 'admin' && (
          <>
            <Text style={[styles.section, { marginTop: 24 }]}>ADMIN</Text>
            <MenuItem icon="speedometer" label="Admin Dashboard" onPress={() => router.push('/admin')} testID="menu-admin" tint={colors.secondary} />
          </>
        )}

        <Button title="Sign Out" variant="ghost" onPress={async () => { await signOut(); router.replace('/(auth)/login'); }} testID="signout-btn" style={{ marginTop: 28 }} />
        <Text muted style={{ textAlign: 'center', fontSize: 10, marginTop: 24, letterSpacing: 2 }}>CLUTCHARENA v1.0</Text>
      </ScrollView>
    </View>
  );
}

const MenuItem: React.FC<{ icon: any; label: string; onPress: () => void; badge?: string; testID?: string; tint?: string }> = ({ icon, label, onPress, badge, testID, tint = colors.primary }) => (
  <TouchableOpacity onPress={onPress} style={styles.menu} activeOpacity={0.7} testID={testID}>
    <View style={[styles.menuIcon, { borderColor: tint + '44' }]}>
      <Ionicons name={icon} color={tint} size={18} />
    </View>
    <Text style={{ flex: 1, fontWeight: '700', fontSize: 14 }}>{label}</Text>
    {badge && <Text style={[styles.menuBadge, { color: tint }]}>{badge.toUpperCase()}</Text>}
    <Ionicons name="chevron-forward" color={colors.textMuted} size={18} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  headerWrap: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 20 },
  avatarWrap: { padding: 4, borderRadius: 52, borderWidth: 2, borderColor: colors.primary },
  avatar: { width: 96, height: 96, borderRadius: 48, backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  cameraBadge: { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.bg },
  name: { fontSize: 22, fontWeight: '900', color: '#fff' },
  vipChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: 'rgba(255,215,0,0.15)', borderWidth: 1, borderColor: '#FFD700' },
  kycBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, marginTop: 10 },
  kycDot: { width: 6, height: 6, borderRadius: 3 },
  vipUpsell: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: radii.lg, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,215,0,0.5)' },
  refCard: { flexDirection: 'row', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderActive, borderRadius: radii.lg, padding: 18, alignItems: 'center', marginBottom: 18 },
  refCode: { fontSize: 22, fontWeight: '900', color: colors.primary, letterSpacing: 2, marginTop: 4 },
  shareBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,229,255,0.12)', borderWidth: 1, borderColor: colors.borderActive, alignItems: 'center', justifyContent: 'center' },
  menu: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.borderSubtle, borderWidth: 1, padding: 14, borderRadius: radii.md, marginBottom: 8, gap: 12 },
  menuIcon: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,229,255,0.06)' },
  menuBadge: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  section: { fontSize: 11, fontWeight: '900', letterSpacing: 2, color: colors.textMuted, marginBottom: 8 },
});
