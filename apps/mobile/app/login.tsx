import { colors } from "@glovebox/ui";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Linking from "expo-linking";
import { useEffect, useState } from "react";
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
import { SITE_URL } from "@/lib/config";
import { signInWithApple, signInWithProvider } from "@/lib/oauth";
import { supabase } from "@/lib/supabase";

type Mode = "signin" | "signup";

export default function LoginScreen() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [appleAvailable, setAppleAvailable] = useState(false);

  // Show the Apple button only where the OS supports it (iOS 13+).
  useEffect(() => {
    if (Platform.OS !== "ios") return;
    AppleAuthentication.isAvailableAsync()
      .then(setAppleAvailable)
      .catch(() => setAppleAvailable(false));
  }, []);

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
        // Without emailRedirectTo the confirmation link goes to the Site URL — the
        // website — which is a dead end for someone who signed up on their phone.
        const { error: err } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: Linking.createURL("auth-callback") },
        });
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

  const continueWithGoogle = async () => {
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      await signInWithProvider("google");
      // On success the auth gate routes into the app.
    } catch (e) {
      setError(e instanceof Error ? e.message : "Възникна грешка при входа с Google.");
    } finally {
      setLoading(false);
    }
  };

  const continueWithApple = async () => {
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      await signInWithApple();
      // On success the auth gate routes into the app.
    } catch (e) {
      setError(e instanceof Error ? e.message : "Възникна грешка при входа с Apple.");
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

          {/* Divider */}
          <View className="my-6 flex-row items-center gap-3">
            <View className="h-px flex-1 bg-white/10" />
            <Text className="text-xs uppercase tracking-wider text-dim">или</Text>
            <View className="h-px flex-1 bg-white/10" />
          </View>

          {/* Social sign-in. Apple Sign-In is required on iOS when another provider (Google) is
              offered (App Store Guideline 4.8); it uses Apple's native, auto-localized button. */}
          {appleAvailable && (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
              cornerRadius={12}
              style={{ height: 56, marginBottom: 12 }}
              onPress={continueWithApple}
            />
          )}

          <Pressable
            onPress={continueWithGoogle}
            disabled={loading}
            className={`flex-row items-center justify-center gap-3 rounded-xl border border-white/15 bg-panel py-4 ${
              loading ? "opacity-50" : ""
            }`}
          >
            <View className="h-5 w-5 items-center justify-center rounded-full bg-ivory">
              <Text className="text-sm font-bold text-emerald">G</Text>
            </View>
            <Text className="text-base font-semibold text-ivory">Продължи с Google</Text>
          </Pressable>

          {/* GDPR transparency: the User has to be told what they are agreeing to before an
              account exists, and the web sign-up already says this. Applies to every route in,
              which is why it sits below the social buttons rather than under the form. */}
          <Text className="mt-7 text-center text-xs leading-5 text-dim">
            С продължаването приемаш{" "}
            <Text className="text-copper" onPress={() => Linking.openURL(`${SITE_URL}/terms`)}>
              Общите условия
            </Text>{" "}
            и{" "}
            <Text className="text-copper" onPress={() => Linking.openURL(`${SITE_URL}/privacy`)}>
              Политиката за поверителност
            </Text>
            .
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
