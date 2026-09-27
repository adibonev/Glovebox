import { Ionicons } from "@expo/vector-icons";
import { BILLING_ENABLED, hasPassword, signInProviders, type Plan } from "@glovebox/core";
import { colors } from "@glovebox/ui";
import { useRouter } from "expo-router";
import { useEffect, useState, type ReactNode } from "react";
import { Alert, Linking, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AnalyticsSetting } from "@/components/AnalyticsConsent";
import { Field, PrimaryButton } from "@/components/forms";
import { HelpSection } from "@/components/HelpSection";
import { InviteCard } from "@/components/InviteCard";
import { deleteAccount, getName, requestPasswordChange, updateName, updatePassword } from "@/lib/account";
import { signOut, useAuth } from "@/lib/auth";
import { SITE_URL } from "@/lib/config";
import { useGarage } from "@/lib/useGarage";

const PLAN_LABELS: Record<Plan, string> = { free: "Безплатен", pro: "Pro", legacy: "Legacy" };

/**
 * Profile and settings, in the website's order: who you are, how you sign in, your reminders,
 * then inviting, privacy and help. Signing out is an ordinary action; deleting the profile comes
 * last, apart, and asks twice.
 */
export default function ProfileTab() {
  const router = useRouter();
  const { session } = useAuth();
  const { data } = useGarage();
  const plan = data?.plan ?? "free";
  const userId = data?.userId;
  const isAdmin = data?.isAdmin ?? false;

  const [name, setName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [password, setPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [code, setCode] = useState("");
  const [awaitingCode, setAwaitingCode] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // A User who only ever signed in with Apple or Google has no password to change.
  const providers = signInProviders(session?.user.app_metadata?.providers ?? []);
  const canSetPassword = hasPassword(providers);
  const providerNames = providers.map((p) => (p === "apple" ? "Apple" : "Google")).join(" и ");

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
      Alert.alert("Името е запазено.");
    } catch {
      Alert.alert("Името не е запазено", "Провери връзката и опитай пак.");
    } finally {
      setSavingName(false);
    }
  };

  // Changing a password takes two steps: ask for a code, then send it with the new password.
  const askForCode = async () => {
    if (password.length < 6) {
      Alert.alert("Кратка парола", "Паролата трябва да е поне 6 символа.");
      return;
    }
    setSavingPassword(true);
    try {
      await requestPasswordChange();
      setAwaitingCode(true);
      Alert.alert("Провери пощата си", "Изпратихме ти код за потвърждение.");
    } catch {
      Alert.alert("Кодът не се изпрати", "Опитай пак след малко.");
    } finally {
      setSavingPassword(false);
    }
  };

  const savePassword = async () => {
    setSavingPassword(true);
    try {
      await updatePassword(password, code);
      setPassword("");
      setCode("");
      setAwaitingCode(false);
      Alert.alert("Паролата е сменена.");
    } catch {
      Alert.alert("Паролата не е сменена", "Кодът е грешен или изтекъл. Опитай пак.");
    } finally {
      setSavingPassword(false);
    }
  };

  const removeAccount = async () => {
    setDeleting(true);
    try {
      await deleteAccount();
      // The auth listener sees the cleared session and routes back to login.
    } catch {
      Alert.alert("Профилът не е изтрит", "Опитай пак след малко.");
      setDeleting(false);
    }
  };

  // Two steps on purpose: this erases everything and cannot be undone.
  const confirmDelete = () => {
    Alert.alert(
      "Изтриване на профила",
      "Профилът ти и всичко в него (колите, сроковете, документите и напомнянията) ще бъдат изтрити завинаги. Данните не могат да бъдат възстановени.",
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
        <Group title="Име и имейл">
          <Field label="Име" value={name} onChangeText={setName} placeholder="Твоето име" />
          <Text className="mb-1 text-sm text-muted">
            Имейл: <Text className="text-silver">{session?.user.email}</Text>
          </Text>
          <PrimaryButton label="Запази името" onPress={() => void saveName()} loading={savingName} />
        </Group>

        <Group title="Вход и парола">
          {!canSetPassword ? (
            <>
              <Text className="text-base text-ivory">Влизаш с {providerNames}.</Text>
              <Text className="mt-1.5 text-sm leading-5 text-silver">
                Профилът ти няма парола: при всеки вход {providers.includes("apple") ? "Apple" : "Google"} потвърждава,
                че си ти.
              </Text>
            </>
          ) : (
            <>
              <Field
                label="Нова парола"
                value={password}
                onChangeText={setPassword}
                placeholder="поне 6 символа"
                secureTextEntry
                autoCapitalize="none"
                editable={!awaitingCode}
              />
              {awaitingCode ? (
                <>
                  <Field
                    label="Код от имейла"
                    value={code}
                    onChangeText={setCode}
                    placeholder="6 цифри"
                    keyboardType="number-pad"
                    autoCapitalize="none"
                  />
                  <PrimaryButton
                    label="Смени паролата"
                    onPress={() => void savePassword()}
                    loading={savingPassword}
                    disabled={code.trim().length < 6}
                  />
                  <Pressable onPress={() => setAwaitingCode(false)} className="items-center py-3">
                    <Text className="text-sm text-dim">Откажи</Text>
                  </Pressable>
                </>
              ) : (
                <PrimaryButton
                  label="Изпрати код за смяна"
                  onPress={() => void askForCode()}
                  loading={savingPassword}
                  disabled={password.length < 6}
                />
              )}
            </>
          )}
        </Group>

        <Group title="Напомняния">
          <LinkRow
            icon="notifications-outline"
            label="Кога да ти напомняме"
            detail="Известия и колко дни преди срока"
            onPress={() => router.push("/reminders")}
          />
        </Group>

        {BILLING_ENABLED && (
          <Group title="План">
            <View className="flex-row items-center gap-2">
              <View className="rounded-lg border border-copper/40 bg-copper/15 px-2.5 py-1">
                <Text className="text-sm font-semibold text-copper">{PLAN_LABELS[plan]}</Text>
              </View>
            </View>
            {plan === "free" && (
              <Text className="mt-2 text-sm leading-5 text-silver">
                С Pro добавяш колкото искаш коли и срокове и получаваш известия. Надграждането е от сайта.
              </Text>
            )}
          </Group>
        )}

        {userId && <InviteCard userId={userId} />}
        <AnalyticsSetting />
        <HelpSection />

        {isAdmin && (
          <View className="mt-4 rounded-2xl border border-white/10 bg-panel px-4 py-3">
            <LinkRow
              icon="shield-outline"
              label="Администрация"
              detail="Отваря се в сайта"
              onPress={() => void Linking.openURL(`${SITE_URL}/admin`)}
            />
          </View>
        )}

        <Pressable onPress={signOut} accessibilityRole="button" className="mt-6 items-center rounded-xl border border-white/10 py-4">
          <Text className="text-base font-semibold text-silver">Изход</Text>
        </Pressable>

        {/* Right to erasure (GDPR Art. 17): required in-app by App Store Guideline 5.1.1(v). */}
        <View className="mt-8 rounded-2xl border border-status-expired/25 bg-panel p-4">
          <Text className="text-xs uppercase tracking-wider text-status-expired">Изтриване на профила</Text>
          <Text className="mt-2 text-sm leading-5 text-silver">
            Профилът и всичките ти данни (колите, сроковете, документите и напомнянията) се изтриват
            завинаги. Това не може да бъде отменено.
          </Text>
          <Pressable
            onPress={confirmDelete}
            disabled={deleting}
            className="mt-4 items-center rounded-xl border border-status-expired/50 py-3.5"
          >
            <Text className="text-base font-semibold text-status-expired">{deleting ? "Изтриване…" : "Изтрий профила"}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/** A titled card, the same small heading as "Покани приятел" and "Помощ" below it. */
function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="mt-4 rounded-2xl border border-white/10 bg-panel p-4">
      <Text className="mb-3 text-xs uppercase tracking-wider text-dim">{title}</Text>
      {children}
    </View>
  );
}

function LinkRow({
  icon,
  label,
  detail,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  detail: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} accessibilityRole="link" className="flex-row items-center gap-3 py-1">
      <Ionicons name={icon} size={20} color={colors.silver} />
      <View className="flex-1">
        <Text className="text-base text-ivory">{label}</Text>
        <Text className="text-xs text-dim">{detail}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.dim} />
    </Pressable>
  );
}
