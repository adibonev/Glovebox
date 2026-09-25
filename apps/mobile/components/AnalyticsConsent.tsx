import { colors } from "@glovebox/ui";
import { Pressable, Switch, Text, View } from "react-native";

import { useAnalyticsChoice } from "@/lib/analytics";

/**
 * Asked once, on the dashboard, after there is a car (not in the middle of signing up): may the
 * app count how it is used? Nothing is counted before a yes, and "Не" is as easy as "Да".
 */
export function AnalyticsConsentCard() {
  const { available, choice, choose } = useAnalyticsChoice();
  if (!available || choice !== null) return null;

  return (
    <View className="mb-4 rounded-2xl border border-white/10 bg-panel p-4">
      <Text className="text-base font-semibold text-ivory">Помагаш ли ни да подобрим Glovebox?</Text>
      <Text className="mt-1 text-sm leading-5 text-silver">
        Ако разрешиш, броим кои екрани се ползват и къде хората се отказват. Без имейл, без
        документи и без данните за колата.
      </Text>
      <View className="mt-3 flex-row gap-2">
        <Pressable onPress={() => void choose("granted")} className="flex-1 items-center rounded-xl bg-emerald py-3">
          <Text className="text-sm font-semibold text-ivory">Разреши</Text>
        </Pressable>
        <Pressable onPress={() => void choose("denied")} className="flex-1 items-center rounded-xl border border-white/15 py-3">
          <Text className="text-sm text-silver">Не</Text>
        </Pressable>
      </View>
    </View>
  );
}

/** The same choice in Профил, changeable at any time. */
export function AnalyticsSetting() {
  const { available, choice, choose } = useAnalyticsChoice();
  if (!available || choice === undefined) return null;

  return (
    <View className="mt-4 rounded-2xl border border-white/10 bg-panel p-4">
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-semibold text-ivory">Анонимна статистика</Text>
        <Switch
          value={choice === "granted"}
          onValueChange={(on) => void choose(on ? "granted" : "denied")}
          trackColor={{ true: colors.emerald, false: "#33413a" }}
          thumbColor={colors.ivory}
        />
      </View>
      <Text className="mt-1 text-xs leading-4 text-dim">
        Кои екрани се ползват. Без имейл, без документи и без данните за колата.
      </Text>
    </View>
  );
}
