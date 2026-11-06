import { useMutation } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { useState } from 'react';
import { Linking, Pressable, Switch, View } from 'react-native';
import { Profile } from '@/api/endpoints';
import type { ApiError } from '@/api/http';
import { ASSETS } from '@/config/assets';
import { LINKS } from '@/config/links';
import { palettes, type PaletteName } from '@/config/theme';
import { usePrefs } from '@/state/prefs';
import { useMe, useMeta, useStats } from '@/state/queries';
import { queryClient, useSession } from '@/state/session';
import { toast } from '@/state/toast';
import { useTheme } from '@/theme';
import { Confirm } from '@/ui/Confirm';
import { Btn, Card, Field, RemoteImage, Screen, SectionTitle, Spinner, Txt } from '@/ui/primitives';

function Stat({ label, value }: { label: string; value: number | string }) {
  const t = useTheme();
  return (
    <View style={{ flexBasis: '30%', flexGrow: 1, alignItems: 'center', gap: 2 }}>
      <Txt variant="title">{value}</Txt>
      <Txt variant="caption" center color={t.colors.textMuted}>
        {label}
      </Txt>
    </View>
  );
}

function LinkRow({ label, url }: { label: string; url: string }) {
  const t = useTheme();
  return (
    <Pressable accessibilityRole="link" onPress={() => Linking.openURL(url)} style={{ paddingVertical: t.spacing.sm }}>
      <Txt>{label}</Txt>
    </Pressable>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Txt>{label}</Txt>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onChange}
        thumbColor={value ? t.colors.primary : t.colors.textMuted}
        trackColor={{ true: t.colors.surfaceRaised, false: t.colors.border }}
      />
    </View>
  );
}

export default function ProfileTab() {
  const t = useTheme();
  const me = useMe();
  const stats = useStats();
  const meta = useMeta();
  const prefs = usePrefs();
  const logout = useSession((s) => s.logout);
  const deleteAccount = useSession((s) => s.deleteAccount);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState<string>();
  const [deleting, setDeleting] = useState(false);
  const [typed, setTyped] = useState('');
  const [deleteBusy, setDeleteBusy] = useState(false);

  const saveName = useMutation({
    mutationFn: () => Profile.update({ display_name: name.trim() }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['me'] });
      setEditing(false);
    },
    onError: (e: ApiError) => setNameError(e.field('display_name') ?? e.message),
  });

  const confirmDelete = async () => {
    setDeleteBusy(true);
    try {
      await deleteAccount();
    } catch (e) {
      toast((e as ApiError).message, 'danger');
      setDeleteBusy(false);
      setDeleting(false);
    }
  };

  const s = stats.data;
  const support = meta.data?.support_email ? `mailto:${meta.data.support_email}` : LINKS.support;

  return (
    <Screen scroll edges={['top', 'left', 'right']}>
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.md }}>
        <RemoteImage uri={ASSETS.avatars.player} label="Your avatar" style={{ width: 64, height: 64, borderRadius: 32 }} />
        <View style={{ flex: 1, minWidth: 0 }}>
          {me.data ? (
            <>
              <Txt variant="title" numberOfLines={1}>
                {me.data.display_name}
              </Txt>
              <Txt variant="small" color={t.colors.textMuted}>
                @{me.data.username} · Level {me.data.level} · {me.data.xp} XP
              </Txt>
            </>
          ) : (
            <Spinner />
          )}
        </View>
        <Btn
          small
          variant="secondary"
          label="Edit"
          disabled={!me.data}
          onPress={() => {
            setName(me.data?.display_name ?? '');
            setNameError(undefined);
            setEditing(true);
          }}
        />
      </Card>

      {s ? (
        <Card>
          <SectionTitle>Stats</SectionTitle>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: t.spacing.lg, paddingTop: t.spacing.sm }}>
            <Stat label="Played" value={s.matches_played} />
            <Stat label="Wins" value={s.wins} />
            <Stat label="Best streak" value={s.best_win_streak} />
            <Stat label="Moves" value={s.moves_played} />
            <Stat label="Words used" value={s.distinct_words} />
            <Stat label="Daily streak" value={s.daily_streak} />
          </View>
        </Card>
      ) : null}

      {s?.ratings.length ? (
        <Card>
          <SectionTitle>Ratings</SectionTitle>
          {s.ratings.map((r) => (
            <View key={`${r.pool}-${r.season}`} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Txt style={{ textTransform: 'capitalize' }}>{r.pool.replace(/-/g, ' ')}</Txt>
              <Txt variant="bodyBold">{Math.round(r.rating)}</Txt>
            </View>
          ))}
        </Card>
      ) : null}

      <Card>
        <SectionTitle>Appearance</SectionTitle>
        <View style={{ flexDirection: 'row', gap: t.spacing.sm }}>
          {(Object.keys(palettes) as PaletteName[]).map((key) => (
            <Pressable
              key={key}
              accessibilityRole="radio"
              accessibilityState={{ selected: prefs.palette === key }}
              accessibilityLabel={key}
              onPress={() => prefs.set({ palette: key })}
              style={{
                flex: 1,
                padding: t.spacing.md,
                borderRadius: t.radius.md,
                backgroundColor: palettes[key].background,
                borderWidth: 2,
                borderColor: prefs.palette === key ? t.colors.primary : t.colors.border,
              }}
            >
              <Txt variant="small" center color={palettes[key].text} style={{ textTransform: 'capitalize', fontWeight: '800' }}>
                {key}
              </Txt>
            </Pressable>
          ))}
        </View>
        <ToggleRow label="Sound" value={prefs.sound} onChange={(sound) => prefs.set({ sound })} />
        <ToggleRow label="Vibration" value={prefs.haptics} onChange={(haptics) => prefs.set({ haptics })} />
      </Card>

      <Card style={{ gap: 0 }}>
        <LinkRow label="Help & support" url={support} />
        <LinkRow label="Privacy policy" url={LINKS.privacy} />
        <LinkRow label="Terms of service" url={LINKS.terms} />
      </Card>

      <Btn variant="secondary" label="Log out" onPress={logout} />
      <Btn
        variant="ghost"
        label="Delete account"
        onPress={() => {
          setTyped('');
          setDeleting(true);
        }}
      />
      <Txt variant="caption" center color={t.colors.textMuted}>
        Version {Constants.expoConfig?.version}
      </Txt>

      {editing ? (
        <Confirm
          title="Change your name"
          message="This is what your rivals see."
          confirmLabel="Save"
          busy={saveName.isPending}
          confirmDisabled={name.trim().length < 3}
          onConfirm={() => saveName.mutate()}
          onCancel={() => setEditing(false)}
        >
          <Field label="Display name" value={name} onChangeText={setName} maxLength={30} autoFocus error={nameError} />
        </Confirm>
      ) : null}

      {deleting ? (
        <Confirm
          title="Delete your account?"
          message="This permanently removes your account, stats and purchases. It can't be undone. Type DELETE to confirm."
          confirmLabel="Delete my account"
          danger
          busy={deleteBusy}
          confirmDisabled={typed !== 'DELETE'}
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(false)}
        >
          <Field label="Type DELETE" value={typed} onChangeText={setTyped} autoCapitalize="characters" autoCorrect={false} />
        </Confirm>
      ) : null}
    </Screen>
  );
}
