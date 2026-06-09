import { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ImageBackground, FlatList } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/src/components/Text';
import { colors, radii, shadow } from '@/src/theme';
import { useAuth } from '@/src/AuthContext';
import { api } from '@/src/api';

const HERO = 'https://images.pexels.com/photos/13930769/pexels-photo-13930769.jpeg';

export default function Home() {
  const router = useRouter();
  const { user, refresh } = useAuth();
  const insets = useSafeAreaInsets();
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [notifCount, setNotifCount] = useState(0);

  const load = useCallback(async () => {
    try {
      const [t, b, n] = await Promise.all([
        api.tournaments({ status: 'upcoming' }),
        api.banners(),
        api.notifications().catch(() => ({ notifications: [] })),
      ]);
      setTournaments(((t as any).tournaments || []).slice(0, 6));
      setBanners((b as any).banners || []);
      setNotifCount(((n as any).notifications || []).filter((x: any) => !x.read).length);
      await refresh();
    } catch {}
  }, [refresh]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const walletTotal = user ? user.wallet.deposit + user.wallet.winning + user.wallet.bonus + user.wallet.referral : 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ImageBackground source={{ uri: HERO }} style={{ height: 280 + insets.top }} imageStyle={{ opacity: 0.55 }}>
        <LinearGradient colors={['rgba(5,5,10,0.5)', 'rgba(5,5,10,0.85)', colors.bg]} style={StyleSheet.absoluteFill} />
        <SafeAreaView edges={['top']} style={{ flex: 1 }}>
          <View style={styles.headerRow}>
            <View>
              <Text muted style={{ fontSize: 11, letterSpacing: 2 }}>WELCOME BACK</Text>
              <Text style={styles.greet} testID="home-username">{(user?.name || 'Player').toUpperCase()}</Text>
            </View>
            <TouchableOpacity testID="open-notifications" style={styles.iconBtn} onPress={() => router.push('/notifications')}>
              <Ionicons name="notifications" color={colors.primary} size={22} />
              {notifCount > 0 && (
                <View style={styles.badge}>
                  <Text style={{ fontSize: 9, fontWeight: '900', color: '#fff' }}>{notifCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => router.push('/(tabs)/wallet')} activeOpacity={0.9} style={[styles.walletCard, shadow.purple]} testID="home-wallet-card">
            <LinearGradient colors={['rgba(157,0,255,0.25)', 'rgba(0,229,255,0.18)']} style={styles.walletGrad}>
              <Text style={{ letterSpacing: 2, color: '#fff', fontSize: 11, fontWeight: '700' }}>TOTAL BALANCE</Text>
              <Text style={styles.walletAmount} testID="home-wallet-amount">₹{walletTotal.toFixed(2)}</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
                <View><Text muted style={{ fontSize: 10 }}>DEPOSIT</Text><Text style={styles.subAmt}>₹{user?.wallet.deposit.toFixed(0) || 0}</Text></View>
                <View><Text muted style={{ fontSize: 10 }}>WINNING</Text><Text style={[styles.subAmt, { color: colors.success }]}>₹{user?.wallet.winning.toFixed(0) || 0}</Text></View>
                <View><Text muted style={{ fontSize: 10 }}>BONUS</Text><Text style={styles.subAmt}>₹{user?.wallet.bonus.toFixed(0) || 0}</Text></View>
                <View><Text muted style={{ fontSize: 10 }}>REFERRAL</Text><Text style={styles.subAmt}>₹{user?.wallet.referral.toFixed(0) || 0}</Text></View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </SafeAreaView>
      </ImageBackground>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 120, paddingTop: 8 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={styles.actionsRow}>
          <Quick icon="game-controller" label="BGMI" onPress={() => router.push({ pathname: '/(tabs)/tournaments', params: { game: 'BGMI' } } as any)} testID="quick-bgmi" />
          <Quick icon="flame" label="FREE FIRE" onPress={() => router.push({ pathname: '/(tabs)/tournaments', params: { game: 'FREEFIRE' } } as any)} testID="quick-ff" />
          <Quick icon="trophy" label="MY MATCHES" onPress={() => router.push('/profile/match-history')} testID="quick-history" />
          <Quick icon="people" label="REFER" onPress={() => router.push('/profile/referral')} testID="quick-referral" />
        </View>

        {banners.length > 0 && (
          <FlatList
            data={banners}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(b) => b.banner_id}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
            style={{ marginVertical: 6 }}
            renderItem={({ item }) => (
              <ImageBackground source={{ uri: item.image_url || item.image_base64 }} style={styles.banner} imageStyle={{ borderRadius: radii.lg }}>
                <LinearGradient colors={['transparent', 'rgba(5,5,10,0.85)']} style={[StyleSheet.absoluteFill, { borderRadius: radii.lg }]} />
                <Text style={styles.bannerText}>{item.title}</Text>
              </ImageBackground>
            )}
          />
        )}

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>UPCOMING BATTLES</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/tournaments')} testID="see-all-tournaments">
            <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 12 }}>SEE ALL →</Text>
          </TouchableOpacity>
        </View>

        {tournaments.map((t) => (
          <TournamentCard key={t.tournament_id} t={t} onPress={() => router.push(`/tournament/${t.tournament_id}` as any)} />
        ))}
      </ScrollView>
    </View>
  );
}

const Quick: React.FC<{ icon: any; label: string; onPress: () => void; testID?: string }> = ({ icon, label, onPress, testID }) => (
  <TouchableOpacity style={styles.quick} onPress={onPress} testID={testID} activeOpacity={0.7}>
    <View style={styles.quickIcon}>
      <Ionicons name={icon} size={22} color={colors.primary} />
    </View>
    <Text style={styles.quickLabel}>{label}</Text>
  </TouchableOpacity>
);

export const TournamentCard: React.FC<{ t: any; onPress: () => void }> = ({ t, onPress }) => {
  const startTime = t.start_time ? new Date(t.start_time) : null;
  const time = startTime ? startTime.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
  const filled = t.registered || 0;
  const pct = t.max_slots ? Math.min(100, (filled / t.max_slots) * 100) : 0;
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.tCard} testID={`tournament-card-${t.tournament_id}`}>
      <View style={styles.tHeader}>
        <View style={styles.gameTag}><Text style={{ fontSize: 9, fontWeight: '900', color: '#fff', letterSpacing: 1 }}>{t.game}</Text></View>
        <View style={styles.modeTag}><Text style={{ fontSize: 9, fontWeight: '900', color: colors.primary, letterSpacing: 1 }}>{t.mode}</Text></View>
        {t.status === 'live' && <View style={styles.liveTag}><Text style={{ fontSize: 9, fontWeight: '900', color: '#fff', letterSpacing: 1 }}>● LIVE</Text></View>}
      </View>
      <Text style={styles.tTitle} numberOfLines={1}>{t.title}</Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
        <View>
          <Text muted style={{ fontSize: 10, letterSpacing: 1 }}>PRIZE POOL</Text>
          <Text style={styles.prizeAmt}>₹{t.prize_pool?.toLocaleString('en-IN')}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text muted style={{ fontSize: 10, letterSpacing: 1 }}>ENTRY</Text>
          <Text style={styles.feeAmt}>₹{t.entry_fee}</Text>
        </View>
      </View>
      <View style={styles.slotBar}>
        <View style={[styles.slotFill, { width: `${pct}%` }]} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
        <Text muted style={{ fontSize: 11 }}>{filled}/{t.max_slots} slots</Text>
        <Text muted style={{ fontSize: 11 }}>{time}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8 },
  greet: { fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: -0.5, marginTop: 2 },
  iconBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(0,229,255,0.1)', borderWidth: 1, borderColor: colors.borderActive, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: -2, right: -2, backgroundColor: colors.danger, paddingHorizontal: 5, height: 16, minWidth: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  walletCard: { marginTop: 16, marginHorizontal: 20, borderRadius: radii.lg, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(157,0,255,0.4)' },
  walletGrad: { padding: 20 },
  walletAmount: { fontSize: 36, fontWeight: '900', color: '#fff', letterSpacing: -1, marginTop: 4 },
  subAmt: { fontSize: 13, fontWeight: '800', color: '#fff', marginTop: 2 },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 16, paddingVertical: 18 },
  quick: { alignItems: 'center', width: 72 },
  quickIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(0,229,255,0.08)', borderWidth: 1, borderColor: colors.borderSubtle, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5, color: colors.text, marginTop: 6, textAlign: 'center' },
  banner: { width: 280, height: 120, padding: 16, justifyContent: 'flex-end', overflow: 'hidden', borderRadius: radii.lg },
  bannerText: { color: '#fff', fontWeight: '900', fontSize: 18, letterSpacing: -0.3 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 12, marginBottom: 8 },
  sectionTitle: { fontSize: 14, fontWeight: '900', letterSpacing: 2, color: '#fff' },
  tCard: { backgroundColor: colors.surface, borderColor: colors.borderSubtle, borderWidth: 1, borderRadius: radii.lg, padding: 16, marginHorizontal: 20, marginBottom: 12 },
  tHeader: { flexDirection: 'row', gap: 6 },
  gameTag: { backgroundColor: colors.secondary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  modeTag: { backgroundColor: 'rgba(0,229,255,0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, borderWidth: 1, borderColor: colors.borderActive },
  liveTag: { backgroundColor: colors.danger, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  tTitle: { fontSize: 17, fontWeight: '800', color: '#fff', marginTop: 10 },
  prizeAmt: { fontSize: 22, fontWeight: '900', color: colors.success, marginTop: 2 },
  feeAmt: { fontSize: 18, fontWeight: '900', color: colors.primary, marginTop: 2 },
  slotBar: { height: 5, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 3, marginTop: 14, overflow: 'hidden' },
  slotFill: { height: 5, backgroundColor: colors.primary, borderRadius: 3 },
});
