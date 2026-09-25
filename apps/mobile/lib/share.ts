import AsyncStorage from "@react-native-async-storage/async-storage";
import { SupabaseUserRepository, SupabaseVehicleSharingRepository } from "@glovebox/core";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Alert } from "react-native";

import { track } from "./analytics";
import { useAuth } from "./auth";
import { supabase } from "./supabase";

const PENDING = "glovebox.pendingShareToken";

export const sharing = new SupabaseVehicleSharingRepository(supabase);
const users = new SupabaseUserRepository(supabase);

/** Keep a car invitation until there is someone signed in to accept it. */
export async function rememberShareToken(token: string): Promise<void> {
  await AsyncStorage.setItem(PENDING, token);
}

/**
 * Accept an invitation for the signed-in User and say how it went. The users row must exist
 * first: a brand-new account may not have one until its first screen provisions it.
 */
export async function acceptShare(authUserId: string, email: string, token: string): Promise<boolean> {
  await users.findOrCreateByAuthId({ authUserId, email });
  const vehicleId = await sharing.join(token);
  if (vehicleId) track("vehicle_joined");
  Alert.alert(
    vehicleId ? "Колата е в гаража ти" : "Поканата не важи",
    vehicleId
      ? "Виждаш сроковете ѝ, можеш да ги подновяваш и ще получаваш напомнянията."
      : "Използвана е или е изтекла. Помоли за нова.",
  );
  return vehicleId !== null;
}

/**
 * An invitation opened before signing in is accepted right after. Mount in the signed-in area.
 */
export function usePendingShare() {
  const { session } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!session) return;
    void (async () => {
      const token = await AsyncStorage.getItem(PENDING);
      if (!token) return;
      await AsyncStorage.removeItem(PENDING);
      if (await acceptShare(session.user.id, session.user.email ?? "", token)) {
        router.push("/(tabs)/vehicles");
      }
    })().catch(() => {
      // Offline: the token is gone, but the link still works when opened again.
    });
  }, [session, router]);
}
