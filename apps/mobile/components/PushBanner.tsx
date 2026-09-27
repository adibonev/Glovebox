import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@glovebox/ui";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { useAuth } from "@/lib/auth";
import { enablePush, usePushStatus } from "@/lib/push";

import { explainBlockedPush } from "./PushSettings";

const SNOOZED_UNTIL = "glovebox.pushBanner.snoozedUntil";
const WEEK = 7 * 24 * 60 * 60 * 1000;

/**
 * Said on the dashboard while notifications do not reach this phone: the whole point of the app
 * is the tap on the shoulder before a date, and without them there is only e-mail. One tap turns
 * them on, or leads to Settings when the phone blocks them. "Не сега" puts it away for a week.
 *
 * Split in two, the state and the banner, because the dashboard shows one banner at a time and
 * must know whether this one wants the place before it gives it away.
 */
export function usePushBanner() {
  const { session } = useAuth();
  const { status, reaching, refresh } = usePushStatus();
  const [snoozed, setSnoozed] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(SNOOZED_UNTIL)
      .then((until) => setSnoozed(until !== null && Number(until) > Date.now()))
      .catch(() => setSnoozed(false));
  }, []);

  const show = !!status && !reaching && !snoozed && !!session;
  const blocked = !!status && status.enabled && status.permission === "denied";

  const turnOn = async () => {
    if (!session) return;
    if (blocked) {
      explainBlockedPush();
      return;
    }
    const allowed = await enablePush(session);
    if (allowed === "denied") explainBlockedPush();
    await refresh();
  };

  const later = () => {
    setSnoozed(true);
    void AsyncStorage.setItem(SNOOZED_UNTIL, String(Date.now() + WEEK));
  };

  return { show, blocked, turnOn, later };
}

/** The banner itself; the dashboard decides with `usePushBanner().show` whether it is the one shown. */
export function PushBanner({ banner }: { banner: ReturnType<typeof usePushBanner> }) {
  const { blocked, turnOn, later } = banner;

  return (
    <View className="mb-4 rounded-2xl border border-copper/50 bg-copper/10 p-4">
      <View className="flex-row items-start gap-3">
        <Ionicons name="notifications-off-outline" size={22} color={colors.copper} />
        <View className="flex-1">
          <Text className="text-base font-semibold text-ivory">Известията са спрени.</Text>
          <Text className="mt-0.5 text-sm leading-5 text-silver">
            Без тях ще разбереш, че нещо изтича, само по имейл.
          </Text>
        </View>
      </View>
      <View className="mt-3 flex-row gap-2">
        <Pressable onPress={() => void turnOn()} className="flex-1 items-center rounded-xl bg-emerald py-3">
          <Text className="text-sm font-semibold text-ivory">{blocked ? "Отвори настройките" : "Пусни известията"}</Text>
        </Pressable>
        <Pressable onPress={later} className="items-center justify-center rounded-xl border border-white/15 px-4">
          <Text className="text-sm text-silver">Не сега</Text>
        </Pressable>
      </View>
    </View>
  );
}
