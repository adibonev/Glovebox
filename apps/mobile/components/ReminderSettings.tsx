import { isExpiringServiceType } from "@glovebox/core";
import { colors } from "@glovebox/ui";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Switch, Text, View } from "react-native";

import { SERVICE_TYPE_LABELS, SERVICE_TYPE_ORDER } from "@/lib/labels";
import {
  DEFAULT_WINDOWS,
  WINDOW_OPTIONS,
  loadReminderConfig,
  saveReminderConfig,
  type ReminderConfig,
} from "@/lib/reminderSettings";

const TYPES = SERVICE_TYPE_ORDER.filter(isExpiringServiceType);

/** Email-reminder toggle + per-Service-Type Reminder Windows (mirrors the web settings). */
export function ReminderSettings({ userId, onSaved }: { userId: string; onSaved: () => void }) {
  const [config, setConfig] = useState<ReminderConfig | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    loadReminderConfig(userId)
      .then((c) => active && setConfig(c))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [userId]);

  if (!config) {
    return (
      <View className="mb-4 items-center rounded-2xl border border-white/10 bg-panel p-4">
        <ActivityIndicator color={colors.copper} />
      </View>
    );
  }

  const save = async () => {
    setSaving(true);
    try {
      await saveReminderConfig(userId, config);
      onSaved();
    } catch {
      // best-effort
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="mb-4 rounded-2xl border border-white/10 bg-panel p-4">
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-semibold text-ivory">Имейл напомняния</Text>
        <Switch
          value={config.enabled}
          onValueChange={(v) => setConfig({ ...config, enabled: v })}
          trackColor={{ true: colors.emerald, false: "#33413a" }}
          thumbColor={colors.ivory}
        />
      </View>
      <Text className="mt-1 text-xs text-dim">
        Колко дни преди изтичане да те подсетим — за всеки вид услуга. Push известията в
        приложението идват автоматично.
      </Text>

      {config.enabled &&
        TYPES.map((type) => (
          <View key={type} className="border-t border-white/[0.06] py-2.5">
            <Text className="mb-1.5 text-sm text-ivory">{SERVICE_TYPE_LABELS[type] ?? type}</Text>
            <View className="flex-row flex-wrap items-center gap-1.5">
              {WINDOW_OPTIONS.map((opt) => {
                const active = (config.windows[type] ?? DEFAULT_WINDOWS[type]) === opt;
                return (
                  <Pressable
                    key={opt}
                    onPress={() => setConfig({ ...config, windows: { ...config.windows, [type]: opt } })}
                    className={`rounded-lg border px-2.5 py-1.5 ${
                      active ? "border-copper bg-copper/20" : "border-white/10"
                    }`}
                  >
                    <Text className={`text-[13px] ${active ? "text-copper" : "text-muted"}`}>{opt}</Text>
                  </Pressable>
                );
              })}
              <Text className="pl-1 text-[12px] text-dim">дни</Text>
            </View>
          </View>
        ))}

      <Pressable
        onPress={save}
        disabled={saving}
        className={`mt-3 items-center rounded-xl bg-emerald py-3 ${saving ? "opacity-50" : ""}`}
      >
        {saving ? (
          <ActivityIndicator color={colors.ivory} />
        ) : (
          <Text className="font-semibold text-ivory">Запази</Text>
        )}
      </Pressable>
    </View>
  );
}
