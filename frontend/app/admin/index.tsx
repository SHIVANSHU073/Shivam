import { useEffect, useState, useCallback } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/src/components/Text';
import { colors, radii } from '@/src/theme';
import { api } from '@/src/api';
import { useAuth } from '@/src/AuthContext';

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try { setStats(await api.adminStats()); } catch {}
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const sections = [
    { icon: 'trophy', label: 'Tournaments', sub: 'Create, edit, publish', tint: colors.primary, route: '/admin/tournaments' },
    { icon: 'people', label: 'Users', sub: `${stats?.total_users || 0} total · ${stats?.banned_users || 0} banned`, tint: colors.secondary, route: '/admin/users' },
    { icon: 'cash', label: 'Withdrawals', sub: `${stats?.pending_withdrawals || 0} pending`, tint: colors.warning, route: '/admin/withdrawals' },
    { icon: 'shield-checkmark', label: 'KYC Verification', sub: `${stats?.pending_kyc || 0} pending`, tint: colors.success, route: '/admin/kyc' },
    { icon: 'document-text', label: 'Match Results', sub: `${stats?.pending_results || 0} pending`, tint: '#FF6A00', route: '/admin/results' },
    { icon: 'megaphone', label: 'Notifications', sub: 'Broadcast & alerts', tint: '#00FF66', route: '/admin/notify' },
    { icon: 'bar-chart', label: 'Analytics', sub: 'Revenue · users · top tournaments', tint: '#FFD700', route: '/admin/analytics' },
    { icon: 'time', label: 'Activity Logs', sub: 'Admin actions audit', tint: '#FF0055', route: '/admin/logs' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.bg }}>
        <LinearGradient colors={['rgba(157,0,255,0.3)', 'transparent']} style={s.headerWrap}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity onPress={() => router.back()} testID="admin-back"><Ionicons name="chevron-back" size={26} color="#fff" /></TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, letterSpacing: 2, color: colors.secondary, fontWeight: '900' }}>ADMIN CONTROL</Text>
              <Text style={s.title}>Dashboard</Text>
            </View>
            {user?.role === 'admin' && (
              <View style={s.lifetimeVip} testID="admin-lifetime-vip">
                <Ionicons name="diamond" size={12} color="#FFD700" />
                <Text style={{ fontSize: 9, color: '#FFD700', fontWeight: '900', letterSpacing: 1 }}>LIFETIME VIP</Text>
              </View>
            )}
          </View>
        </LinearGradient>
      </SafeAreaView>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={colors.primary} />}
      >
        {stats && (
          <View style={s.statsGrid}>
            <Stat label="USERS" value={stats.total_users} c={colors.primary} icon="people" />
            <Stat label="TOURNAMENTS" value={stats.total_tournaments} c={colors.secondary} icon="trophy" />
            <Stat label="ACTIVE MATCHES" value={stats.live_tournaments} c={colors.danger} icon="flame" />
            <Stat label="REVENUE" value={`₹${(stats.total_revenue || 0).toLocaleString('en-IN')}`} c={colors.success} icon="cash" />
            <Stat label="PEND WITHDRAW" value={stats.pending_withdrawals} c={colors.warning} icon="hourglass" />
            <Stat label="VIP MEMBERS" value={stats.vip_users} c="#FFD700" icon="diamond" />
            <Stat label="DEPOSITS ₹" value={(stats.deposits_total || 0).toLocaleString('en-IN')} c={colors.primary} icon="arrow-down" />
            <Stat label="PAYOUTS ₹" value={(stats.payouts_total || 0).toLocaleString('en-IN')} c={colors.secondary} icon="arrow-up" />
          </View>
        )}

        <Text style={s.section}>MANAGEMENT</Text>
        {sections.map((sec) => (
          <TouchableOpacity key={sec.label} style={s.row} activeOpacity={0.7} onPress={() => router.push(sec.route as any)} testID={`admin-nav-${sec.label.toLowerCase().replace(/ /g, '-')}`}>
            <View style={[s.rowIcon, { borderColor: sec.tint + '55', backgroundColor: sec.tint + '15' }]}>
              <Ionicons name={sec.icon as any} color={sec.tint} size={20} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '800', fontSize: 15 }}>{sec.label}</Text>
              <Text muted style={{ fontSize: 11, marginTop: 2 }}>{sec.sub}</Text>
            </View>
            <Ionicons name="chevron-forward" color={colors.textMuted} size={18} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const Stat: React.FC<{ label: string; value: any; c: string; icon: any }> = ({ label, value, c, icon }) => (
  <View style={[s.statCard, { borderColor: c + '55' }]}>
    <View style={[s.statIcon, { backgroundColor: c + '22' }]}>
      <Ionicons name={icon} color={c} size={14} />
    </View>
    <Text muted style={{ fontSize: 9, letterSpacing: 1.5, marginTop: 8 }}>{label}</Text>
    <Text style={{ fontSize: 18, fontWeight: '900', color: c, marginTop: 2 }}>{value}</Text>
  </View>
);

const s = StyleSheet.create({
  headerWrap: { paddingHorizontal: 20, paddingVertical: 16 },
  title: { fontSize: 26, fontWeight: '900', color: '#fff', marginTop: 4, letterSpacing: -0.5 },
  lifetimeVip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: 'rgba(255,215,0,0.15)', borderWidth: 1, borderColor: '#FFD700' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statCard: { flex: 1, minWidth: '47%', backgroundColor: colors.surface, borderWidth: 1, padding: 12, borderRadius: radii.md },
  statIcon: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  section: { fontSize: 13, fontWeight: '900', letterSpacing: 2, color: '#fff', marginTop: 24, marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.borderSubtle, borderWidth: 1, padding: 14, borderRadius: radii.md, marginBottom: 8, gap: 12 },
  rowIcon: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
