import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * Shared form-screen chrome: a back link, a title, and a scroll area the keyboard cannot bury.
 *
 * Both mechanisms are needed, and they are not alternatives. `automaticallyAdjustKeyboardInsets`
 * is the iOS one: the scroll view grows its own insets when the keyboard appears, so the focused
 * field is scrolled into view instead of sitting under it. Android ignores that prop, so the
 * whole screen is wrapped in a KeyboardAvoidingView there instead.
 *
 * The generous bottom padding is part of the fix rather than styling: the last field in a form
 * has nothing below it to scroll into, and without the padding it stops just short of clearing
 * the keyboard.
 */
export function Screen({ title, children }: { title: string; children: ReactNode }) {
  const router = useRouter();
  return (
    <SafeAreaView className="flex-1 bg-ink" edges={["top"]}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "android" ? "height" : undefined}
      >
        <View className="px-5 pb-1 pt-2">
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Text className="text-base text-muted">← Назад</Text>
          </Pressable>
        </View>
        <ScrollView
          contentContainerClassName="px-5 pb-72"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          automaticallyAdjustKeyboardInsets
        >
          <Text className="mb-6 mt-3 text-2xl font-semibold text-ivory">{title}</Text>
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
