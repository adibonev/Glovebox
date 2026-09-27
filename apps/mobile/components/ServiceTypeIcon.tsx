import { Ionicons } from "@expo/vector-icons";

type IconName = keyof typeof Ionicons.glyphMap;

/** One picture per Service Type, the phone's counterpart of the website's drawn icons. */
const ICONS: Record<string, IconName> = {
  civil_liability: "shield-outline",
  casco: "umbrella-outline",
  vignette: "trail-sign-outline",
  inspection: "clipboard-outline",
  tax: "cash-outline",
  fire_extinguisher: "flame-outline",
  maintenance: "settings-outline",
  repair: "build-outline",
};

export function ServiceTypeIcon({ type, size = 20, color }: { type: string; size?: number; color: string }) {
  return <Ionicons name={ICONS[type] ?? "document-text-outline"} size={size} color={color} />;
}
