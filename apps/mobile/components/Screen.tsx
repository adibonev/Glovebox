import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/** Shared form-screen chrome: a back link, a title, and a keyboard-friendly scroll area. */
export function Screen({ title, children }: { title: string; children: ReactNode }) {
  const router = useRouter();
  return (
    <SafeAreaView className="flex-1 bg-ink" edges={["top"]}>
      <View className="px-5 pb-1 pt-2">
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text className="text-base text-muted">← Назад</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerClassName="px-5 pb-16" keyboardShouldPersistTaps="handled">
        <Text className="mb-6 mt-3 text-2xl font-semibold text-ivory">{title}</Text>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
