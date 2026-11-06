import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';

export default function TabsLayout() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: t.colors.background },
        tabBarActiveTintColor: t.colors.primary,
        tabBarInactiveTintColor: t.colors.textMuted,
        tabBarLabelStyle: { fontSize: t.fontSize.caption, lineHeight: 16 },
        tabBarStyle: {
          backgroundColor: t.colors.surface,
          borderTopColor: t.colors.border,
          height: 62 + insets.bottom,
          paddingTop: 6,
          paddingBottom: 6 + insets.bottom,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Play', tabBarIcon: ({ color, size }) => <Ionicons name="game-controller" color={color as string} size={size} /> }}
      />
      <Tabs.Screen
        name="matches"
        options={{ title: 'Matches', tabBarIcon: ({ color, size }) => <Ionicons name="list" color={color as string} size={size} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <Ionicons name="person" color={color as string} size={size} /> }}
      />
    </Tabs>
  );
}
