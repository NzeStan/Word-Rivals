import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Friends } from '@/api/endpoints';
import { useMe } from '@/state/queries';
import { useTheme } from '@/theme';

type IconName = keyof typeof Ionicons.glyphMap;

function icon(name: IconName) {
  return function TabIcon({ color, size }: { color: unknown; size: number }) {
    return <Ionicons name={name} color={color as string} size={size} />;
  };
}

export default function TabsLayout() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const me = useMe();
  const requests = useQuery({ queryKey: ['friends', 'requests'], queryFn: Friends.requests });
  const incoming = (requests.data ?? []).filter((r) => r.to_user.user_id === me.data?.user_id).length;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: t.colors.background },
        tabBarActiveTintColor: t.colors.primary,
        tabBarInactiveTintColor: t.colors.textMuted,
        tabBarLabelStyle: { fontSize: t.fontSize.caption, lineHeight: 16 },
        tabBarBadgeStyle: { backgroundColor: t.colors.danger, color: t.colors.textOnPrimary },
        tabBarStyle: {
          backgroundColor: t.colors.surface,
          borderTopColor: t.colors.border,
          height: 62 + insets.bottom,
          paddingTop: 6,
          paddingBottom: 6 + insets.bottom,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Play', tabBarIcon: icon('game-controller') }} />
      <Tabs.Screen name="matches" options={{ title: 'Matches', tabBarIcon: icon('list') }} />
      <Tabs.Screen name="compete" options={{ title: 'Compete', tabBarIcon: icon('trophy') }} />
      <Tabs.Screen
        name="friends"
        options={{ title: 'Friends', tabBarIcon: icon('people'), tabBarBadge: incoming || undefined }}
      />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: icon('person') }} />
    </Tabs>
  );
}
