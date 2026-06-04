import { colors } from "@glovebox/ui";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Wordmark } from "@/components/Wordmark";
import { supabase } from "@/lib/supabase";

type Mode = "signin" | "signup";

export default function LoginScreen() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        // On success the auth gate (RootNavigator) redirects to the dashboard.
      } else {
        const { error: err } = await supabase.auth.signUp({ email, password });
        if (err) throw err;
        setNotice("Изпратихме ти имейл за потвърждение. Потвърди и влез.");
        setMode("signin");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Възникна грешка. Опитай пак.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-ink">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View className="flex-1 justify-center px-6">
          {/* Wordmark */}
          <View className="mb-2 items-center">
            <Wordmark size={40} />
          </View>
          <Text className="mb-10 text-center text-base text-muted">
            Следи сроковете на колата си.
          </Text>

          {/* Tabs */}
          <View className="mb-6 flex-row rounded-2xl border border-white/10 bg-panel p-1">
            {(["signin", "signup"] as const).map((m) => (
              <Pressable
                key={m}
                onPress={() => {
                  setMode(m);
                  setError(null);
                  setNotice(null);
                }}
                className={`flex-1 rounded-xl py-3 ${mode === m ? "bg-emerald" : ""}`}
              >
                <Text
                  className={`text-center text-sm font-semibold ${
                    mode === m ? "text-ivory" : "text-muted"
                  }`}
                >
                  {m === "signin" ? "Вход" : "Регистрация"}
                </Text>
              </Pressable>
            ))}
          </View>

          <View className="gap-3">
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Имейл"
              placeholderTextColor={colors.dim}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              className="rounded-xl border border-white/10 bg-panel px-4 py-3.5 text-base text-ivory"
            />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Парола"
              placeholderTextColor={colors.dim}
              autoCapitalize="none"
              secureTextEntry
              className="rounded-xl border border-white/10 bg-panel px-4 py-3.5 text-base text-ivory"
            />
          </View>

          {error && <Text className="mt-4 text-sm text-status-expired">{error}</Text>}
          {notice && <Text className="mt-4 text-sm text-status-valid">{notice}</Text>}

          <Pressable
            onPress={submit}
            disabled={loading || !email || !password}
            className={`mt-6 items-center rounded-xl bg-emerald py-4 ${
              loading || !email || !password ? "opacity-50" : ""
            }`}
          >
            {loading ? (
              <ActivityIndicator color={colors.ivory} />
            ) : (
              <Text className="text-base font-semibold text-ivory">
                {mode === "signin" ? "Влез" : "Създай акаунт"}
              </Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
