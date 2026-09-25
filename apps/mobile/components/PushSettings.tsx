import { colors } from "@glovebox/ui";
import { useState } from "react";
import { Alert, Linking, Pressable, Switch, Text, View } from "react-native";

import { useAuth } from "@/lib/auth";
import { disablePush, enablePush, usePushStatus } from "@/lib/push";

/** Opened when the phone itself blocks notifications: only the Settings app can undo that. */
export function explainBlockedPush() {
  Alert.alert(
    "Известията са спрени от телефона",
    "Пусни ги от Настройки → Glovebox → Известия. Като се върнеш, приложението ще го види.",
    [
      { text: "Не сега", style: "cancel" },
      { text: "Отвори настройките", onPress: () => void Linking.openSettings() },
    ],
  );
}

/**
 * "Известия на телефона": on or off for this device. Switching on asks the system the first time;
 * if the phone blocks them ("Don't Allow" once), it explains and opens Settings instead.
 */
export function PushSettings() {
  const { session } = useAuth();
  const { status, reaching, refresh } = usePushStatus();
  const [busy, setBusy] = useState(false);

  if (!status) return null;
  const blocked = status.enabled && status.permission === "denied";

  const toggle = async (on: boolean) => {
    if (!session) return;
    setBusy(true);
    try {
      if (on) {
        const allowed = await enablePush(session);
        if (allowed === "denied") explainBlockedPush();
      } else {
        await disablePush();
      }
    } finally {
      await refresh();
      setBusy(false);
    }
  };

  return (
    <View className="mb-4 rounded-2xl border border-white/10 bg-panel p-4">
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-semibold text-ivory">Известия на телефона</Text>
        <Switch
          value={reaching}
          disabled={busy}
          onValueChange={(on) => void toggle(on)}
          trackColor={{ true: colors.emerald, false: "#33413a" }}
          thumbColor={colors.ivory}
        />
      </View>
      <Text className="mt-1 text-xs leading-4 text-dim">
        {reaching
          ? "Идват в началото на срока за напомняне, 48 и 24 часа преди края, и веднъж след него."
          : blocked
            ? "Телефонът ги е спрял. Пусни ги от настройките на телефона."
            : "Изключени са. Без тях ще разбереш за срока само по имейл."}
      </Text>
      {blocked && (
        <Pressable onPress={() => void Linking.openSettings()} className="mt-3 self-start rounded-lg border border-copper/50 px-3 py-2">
          <Text className="text-sm font-semibold text-copper">Отвори настройките</Text>
        </Pressable>
      )}
    </View>
  );
}
