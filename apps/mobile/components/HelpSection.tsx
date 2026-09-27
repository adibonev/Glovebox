import { Ionicons } from "@expo/vector-icons";
import { colors } from "@glovebox/ui";
import * as Application from "expo-application";
import * as WebBrowser from "expo-web-browser";
import { Alert, Linking, Pressable, Text, View } from "react-native";

import { APP_STORE_REVIEW_URL, SITE_URL, SUPPORT_EMAIL } from "@/lib/config";

type Icon = keyof typeof Ionicons.glyphMap;

/**
 * The website's pages worth reaching from inside the app. The landing page is /start: "/" shows a
 * signed-in person their dashboard, and the in-app browser may well be signed in.
 */
const PAGES: { label: string; path: string; icon: Icon }[] = [
  { label: "Чести въпроси", path: "/start#chzv", icon: "help-circle-outline" },
  { label: "Поверителност", path: "/privacy", icon: "shield-checkmark-outline" },
  { label: "Общи условия", path: "/terms", icon: "document-text-outline" },
  { label: "За нас", path: "/za-nas", icon: "information-circle-outline" },
];

/**
 * "Помощ" in the profile: questions, a way to write, and the legal pages. Before, the privacy
 * policy and the terms were only on the sign-in screen, and Apple asks for the privacy policy to
 * be reachable inside the app (Guideline 5.1.1(i)).
 */
export function HelpSection() {
  const open = (path: string) => void WebBrowser.openBrowserAsync(`${SITE_URL}${path}`).catch(() => {});

  // A phone with no mail app set up cannot open mailto:, so the address is also said out loud.
  const write = () =>
    void Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Glovebox")}`).catch(() =>
      Alert.alert("Пиши ни", `На ${SUPPORT_EMAIL}`),
    );

  const version = Application.nativeApplicationVersion;
  const build = Application.nativeBuildVersion;

  return (
    <View className="mt-4">
      <View className="overflow-hidden rounded-2xl border border-white/10 bg-panel">
        <Text className="px-4 pb-1 pt-4 text-xs uppercase tracking-wider text-dim">Помощ</Text>
        <Row icon="mail-outline" label="Пиши ни" detail={SUPPORT_EMAIL} onPress={write} />
        {PAGES.map((page) => (
          <Row key={page.path} icon={page.icon} label={page.label} onPress={() => open(page.path)} />
        ))}
        {/* The stars themselves are asked for by the system after a scan; this is for anyone who
            goes looking to say something. */}
        <Row
          icon="star-outline"
          label="Оцени Glovebox"
          onPress={() => void Linking.openURL(APP_STORE_REVIEW_URL).catch(() => {})}
        />
      </View>
      {version && (
        <Text selectable className="mt-3 text-center text-xs text-dim">
          Glovebox {version}
          {build ? ` (${build})` : ""}
        </Text>
      )}
    </View>
  );
}

function Row({ icon, label, detail, onPress }: { icon: Icon; label: string; detail?: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      className="flex-row items-center gap-3 border-t border-white/5 px-4 py-3.5"
    >
      <Ionicons name={icon} size={20} color={colors.silver} />
      <View className="flex-1">
        <Text className="text-base text-ivory">{label}</Text>
        {detail && <Text className="text-xs text-dim">{detail}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.dim} />
    </Pressable>
  );
}
