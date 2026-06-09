import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/src/theme';

const tabIcon = (name: any) => ({ color, size }: { color: string; size: number }) => (
  <Ionicons name={name} size={size} color={color} />
);

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'rgba(5,5,10,0.92)',
          borderTopColor: colors.borderSubtle,
          borderTopWidth: 1,
          height: 64 + insets.bottom,
          paddingBottom: insets.bottom + 6,
          paddingTop: 8,
        },
        tabBarBackground: () => (
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
        ),
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Home', tabBarIcon: tabIcon('flash') }} />
      <Tabs.Screen name="tournaments" options={{ title: 'Battles', tabBarIcon: tabIcon('trophy') }} />
      <Tabs.Screen name="wallet" options={{ title: 'Wallet', tabBarIcon: tabIcon('wallet') }} />
      <Tabs.Screen name="leaderboard" options={{ title: 'Ranks', tabBarIcon: tabIcon('podium') }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: tabIcon('person-circle') }} />
    </Tabs>
  );
}
