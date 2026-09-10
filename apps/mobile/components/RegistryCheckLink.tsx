import { Ionicons } from "@expo/vector-icons";
import { registryCheckPage } from "@glovebox/core";
import { colors } from "@glovebox/ui";
import * as WebBrowser from "expo-web-browser";
import { Pressable, Text, View } from "react-native";

/** What the link says, for each Service Type that has a Registry Check Page. */
const COPY: Record<string, { title: string; body: string }> = {
  vignette: {
    title: "Провери винетката в BG TOLL",
    body: "Официалната проверка по регистрационен номер. Като затвориш страницата, се връщаш тук.",
  },
  tax: {
    title: "Провери данъка в НАП",
    body: "Справка за местните данъци с вход с ПИК или електронен подпис. Като затвориш страницата, се връщаш тук.",
  },
};

/**
 * The official page for an obligation the User holds no document for, opened inside the app.
 *
 * A sheet over the form rather than the phone's browser: the User looks the date up, closes the
 * page and is back on the form they were filling in, with nothing typed so far lost.
 */
export function RegistryCheckLink({ serviceType }: { serviceType: string | null | undefined }) {
  const url = serviceType ? registryCheckPage(serviceType) : null;
  const copy = serviceType ? COPY[serviceType] : undefined;
  if (!url || !copy) return null;

  return (
    <Pressable
      onPress={() =>
        void WebBrowser.openBrowserAsync(url, {
          controlsColor: colors.copper,
          toolbarColor: colors.ink,
          dismissButtonStyle: "close",
          // Android: keep the page in the app's own task, so Back returns to the form.
          createTask: false,
        })
      }
      accessibilityRole="link"
      className="mb-4 flex-row items-center gap-3 rounded-xl border border-copper/40 bg-copper/10 px-4 py-3.5"
    >
      <Ionicons name="open-outline" size={20} color={colors.copper} />
      <View className="flex-1">
        <Text className="text-base font-semibold text-ivory">{copy.title}</Text>
        <Text className="mt-0.5 text-xs leading-4 text-silver">{copy.body}</Text>
      </View>
    </Pressable>
  );
}
