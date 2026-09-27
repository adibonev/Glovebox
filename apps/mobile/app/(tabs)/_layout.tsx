import { Ionicons } from "@expo/vector-icons";
import { colors } from "@glovebox/ui";
import { Tabs } from "expo-router";

import { useInviteClaim } from "@/lib/invite";
import { useNotificationRoutes, usePushRegistration } from "@/lib/push";
import { usePendingShare } from "@/lib/share";

/**
 * Bottom tab bar: the same five places as the website's top nav, in the same order (Табло, Коли,
 * Документи, Анализ, Профил). Reminder settings are a screen of their own, reached from Профил.
 */
export default function TabsLayout() {
  usePushRegistration();
  useNotificationRoutes();
  useInviteClaim();
  usePendingShare();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.copper,
        tabBarInactiveTintColor: colors.dim,
        tabBarStyle: {
          backgroundColor: colors.ink2,
          borderTopColor: "rgba(255,255,255,0.08)",
        },
        tabBarLabelStyle: { fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Табло",
          tabBarIcon: ({ color, size }) => <Ionicons name="speedometer-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="vehicles"
        options={{
          title: "Коли",
          tabBarIcon: ({ color, size }) => <Ionicons name="car-sport-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="documents"
        options={{
          title: "Документи",
          tabBarIcon: ({ color, size }) => <Ionicons name="document-text-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="analysis"
        options={{
          title: "Анализ",
          tabBarIcon: ({ color, size }) => <Ionicons name="pie-chart-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Профил",
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
