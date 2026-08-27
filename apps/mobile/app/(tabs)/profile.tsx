import { BILLING_ENABLED, type Plan } from "@glovebox/core";
import { useEffect, useState } from "react";
import { Alert, Linking, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Field, PrimaryButton } from "@/components/forms";
import { deleteAccount, getName, updateName, updatePassword } from "@/lib/account";
import { signOut, useAuth } from "@/lib/auth";
import { SITE_URL } from "@/lib/config";
import { useGarage } from "@/lib/useGarage";

const PLAN_LABELS: Record<Plan, string> = { free: "Free", pro: "Pro", legacy: "Legacy" };

export default function ProfileTab() {
  const { session } = useAuth();
  const { data } = useGarage();
  const plan = data?.plan ?? "free";
  const userId = data?.userId;
  const isAdmin = data?.isAdmin ?? false;

  const [name, setName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [password, setPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    getName(userId)
      .then((n) => active && setName(n))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [userId]);

  const saveName = async () => {
    if (!userId) return;
    setSavingName(true);
    try {
      await updateName(userId, name);
      Alert.alert("Запазено", "Името е обновено.");
    } catch (e) {
      Alert.alert("Грешка", e instanceof Error ? e.message : "Неуспешен запис.");
    } finally {
      setSavingName(false);
    }
  };

  const savePassword = async () => {
    if (password.length < 6) {
      Alert.alert("Кратка парола", "Паролата трябва да е поне 6 символа.");
      return;
    }
    setSavingPassword(true);
    try {
      await updatePassword(password);
      setPassword("");
      Alert.alert("Запазено", "Паролата е сменена.");
    } catch (e) {
      Alert.alert("Грешка", e instanceof Error ? e.message : "Неуспешна смяна.");
    } finally {
      setSavingPassword(false);
    }
  };

  const removeAccount = async () => {
    setDeleting(true);
    try {
      await deleteAccount();
      // The auth listener sees the cleared session and routes back to login.
    } catch (e) {
      Alert.alert("Грешка", e instanceof Error ? e.message : "Изтриването не успя.");
      setDeleting(false);
    }
  };

  // Two steps on purpose: this erases everything and cannot be undone.
  const confirmDelete = () => {
    Alert.alert(
      "Изтриване на акаунта",
      "Профилът ти и всичко към него — автомобили, услуги, документи и напомняния — ще бъдат изтрити завинаги. Данните не могат да бъдат възстановени.",
      [
        { text: "Отказ", style: "cancel" },
        {
          text: "Продължи",
          style: "destructive",
          onPress: () =>
            Alert.alert("Сигурен ли си?", "Последна възможност да се откажеш.", [
              { text: "Отказ", style: "cancel" },
              { text: "Изтрий завинаги", style: "destructive", onPress: removeAccount },
            ]),
        },
      ],
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-ink" edges={["top"]}>
      <View className="px-5 pb-3 pt-2">
        <Text className="text-2xl font-semibold text-ivory">Профил</Text>
      </View>

      <ScrollView contentContainerClassName="px-5 pb-10" keyboardShouldPersistTaps="handled">
        <View className="rounded-2xl border border-white/10 bg-panel p-4">
          <Text className="text-xs uppercase tracking-wider text-dim">Имейл</Text>
          <Text className="mt-1 text-base text-ivory">{session?.user.email ?? "—"}</Text>

          {BILLING_ENABLED && (
            <>
              <View className="my-4 h-px bg-white/10" />
              <Text className="text-xs uppercase tracking-wider text-dim">План</Text>
              <View className="mt-1.5 flex-row items-center gap-2">
                <View className="rounded-lg border border-copper/40 bg-copper/15 px-2.5 py-1">
                  <Text className="text-sm font-semibold text-copper">{PLAN_LABELS[plan]}</Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Name */}
        <View className="mt-4 rounded-2xl border border-white/10 bg-panel p-4">
          <Field label="Име" value={name} onChangeText={setName} placeholder="Твоето име" />
          <PrimaryButton label="Запази името" onPress={saveName} loading={savingName} />
        </View>

        {/* Password */}
        <View className="mt-4 rounded-2xl border border-white/10 bg-panel p-4">
          <Field
            label="Нова парола"
            value={password}
            onChangeText={setPassword}
            placeholder="поне 6 символа"
            secureTextEntry
            autoCapitalize="none"
          />
          <PrimaryButton
            label="Смени паролата"
            onPress={savePassword}
            loading={savingPassword}
            disabled={password.length < 6}
          />
        </View>

        {BILLING_ENABLED && plan === "free" && (
          <View className="mt-4 rounded-2xl border border-copper/40 bg-panel p-4">
            <Text className="text-base font-semibold text-ivory">Надгради до Pro</Text>
            <Text className="mt-1 text-sm text-silver">
              Неограничено автомобили и услуги, push известия и още. Надграждането става от уеб
              приложението (плащане в приложението идва скоро).
            </Text>
          </View>
        )}

        {isAdmin && (
          <Pressable
            onPress={() => Linking.openURL(`${SITE_URL}/admin`)}
            className="mt-4 flex-row items-center justify-center gap-2 rounded-xl border border-copper/40 bg-copper/10 py-4"
          >
            <Text className="text-base font-semibold text-copper">♛ Админ панел</Text>
          </Pressable>
        )}

        <Pressable onPress={signOut} className="mt-6 items-center rounded-xl border border-white/10 py-4">
          <Text className="text-base font-semibold text-status-expired">Изход</Text>
        </Pressable>

        {/* Right to erasure (GDPR Art. 17) — required in-app by App Store Guideline 5.1.1(v). */}
        <View className="mt-8 rounded-2xl border border-status-expired/25 bg-panel p-4">
          <Text className="text-xs uppercase tracking-wider text-status-expired">
            Изтриване на акаунта
          </Text>
          <Text className="mt-2 text-sm leading-5 text-silver">
            Профилът и всичките ти данни — автомобили, услуги, документи и напомняния — се
            изтриват завинаги. Действието е необратимо.
          </Text>
          <Pressable
            onPress={confirmDelete}
            disabled={deleting}
            className="mt-4 items-center rounded-xl border border-status-expired/50 py-3.5"
          >
            <Text className="text-base font-semibold text-status-expired">
              {deleting ? "Изтриване…" : "Изтрий акаунта"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
