import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

const TONES = {
  copper: "border-copper/60 bg-copper/15",
  emerald: "border-emerald/60 bg-emerald/15",
  plain: "border-white/15 bg-white/[0.04]",
};

/** One large, described way forward — "photograph it" or "type it in". */
export function Choice({
  title,
  body,
  tone,
  onPress,
}: {
  title: string;
  body: string;
  tone: keyof typeof TONES;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} className={`mb-3 rounded-2xl border p-5 ${TONES[tone]}`}>
      <Text className="text-lg font-semibold text-ivory">{title}</Text>
      <Text className="mt-1.5 text-sm leading-5 text-silver">{body}</Text>
    </Pressable>
  );
}

/** A short remark above a form: what was read off a document, or what to check. */
export function Notice({ children }: { children: ReactNode }) {
  return (
    <View className="mb-4 rounded-xl border border-copper/40 bg-panel p-4">
      <Text className="text-sm leading-5 text-silver">{children}</Text>
    </View>
  );
}
