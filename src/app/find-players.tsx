import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Players } from '@/api/endpoints';
import type { ApiError } from '@/api/http';
import { useTheme } from '@/theme';
import { Header, Initials, Row } from '@/ui/bits';
import { Card, Field, Spinner, Txt } from '@/ui/primitives';

export default function FindPlayers() {
  const t = useTheme();
  const [text, setText] = useState('');
  const [q, setQ] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setQ(text.trim()), 300);
    return () => clearTimeout(timer);
  }, [text]);

  const results = useQuery({ queryKey: ['players', 'search', q], queryFn: () => Players.search(q), enabled: q.length >= 2 });
  const list = results.data ?? [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.background }}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: t.spacing.lg, gap: t.spacing.lg }}>
        <Header title="Find players" />
        <Field label="Player name" value={text} onChangeText={setText} autoFocus autoCapitalize="none" autoCorrect={false} />
        {q.length < 2 ? (
          <Txt color={t.colors.textMuted}>Type at least two letters of their display name.</Txt>
        ) : results.isPending ? (
          <Spinner />
        ) : results.isError ? (
          <Txt color={t.colors.danger}>{(results.error as ApiError).message}</Txt>
        ) : !list.length ? (
          <Txt color={t.colors.textMuted}>No players found.</Txt>
        ) : (
          <Card style={{ gap: 0 }}>
            {list.map((p) => (
              <Row
                key={p.user_id}
                leading={<Initials name={p.display_name} />}
                title={p.display_name}
                subtitle={`Level ${p.level}`}
                onPress={() => router.push(`/player/${p.user_id}`)}
              />
            ))}
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
