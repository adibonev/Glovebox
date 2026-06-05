import "../global.css";

import { Fraunces_600SemiBold, useFonts } from "@expo-google-fonts/fraunces";
import { colors } from "@glovebox/ui";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider, useAuth } from "@/lib/auth";

// Paint the native root view dark so there's no white flash before React mounts.
void SystemUI.setBackgroundColorAsync(colors.ink);
void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // Fraunces (display serif) for the wordmark + numerals; UI body stays system (Cyrillic-safe).
  const [fontsLoaded] = useFonts({ Fraunces_600SemiBold });

  useEffect(() => {
    if (fontsLoaded) void SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null; // keep the splash up until the font is ready

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.ink }}>
      <SafeAreaProvider>
        <AuthProvider>
          <StatusBar style="light" />
          <RootNavigator />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/** Redirects between the auth screen and the app depending on the session (auth gate). */
function RootNavigator() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const onLoginScreen = segments[0] === "login";
    if (!session && !onLoginScreen) router.replace("/login");
    else if (session && onLoginScreen) router.replace("/");
  }, [session, loading, segments, router]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.ink }}>
        <ActivityIndicator color={colors.copper} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.ink },
        animation: "fade",
      }}
    />
  );
}
