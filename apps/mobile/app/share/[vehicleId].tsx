import {
  SupabaseUserRepository,
  SupabaseVehicleRepository,
  shareLink,
  type Vehicle,
  type VehiclePerson,
} from "@glovebox/core";
import { colors } from "@glovebox/ui";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, Share, Text, View } from "react-native";

import { PrimaryButton } from "@/components/forms";
import { Screen } from "@/components/Screen";
import { track } from "@/lib/analytics";
import { useAuth } from "@/lib/auth";
import { SITE_URL } from "@/lib/config";
import { sharing } from "@/lib/share";
import { supabase } from "@/lib/supabase";

const vehicleRepo = new SupabaseVehicleRepository(supabase);
const userRepo = new SupabaseUserRepository(supabase);

const who = (person: VehiclePerson) => person.name?.trim() || person.email;

/**
 * Who follows this car. The owner sends a one-time link to a family member and can remove anyone;
 * a member sees who shared it and can stop following it.
 */
export default function ShareScreen() {
  const { vehicleId } = useLocalSearchParams<{ vehicleId: string }>();
  const { session } = useAuth();
  const router = useRouter();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [me, setMe] = useState<string | null>(null);
  const [people, setPeople] = useState<VehiclePerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session) return;
    try {
      const [user, found] = await Promise.all([
        userRepo.findOrCreateByAuthId({ authUserId: session.user.id, email: session.user.email ?? "" }),
        vehicleRepo.getById(vehicleId),
      ]);
      setMe(user.id);
      setVehicle(found);
      setPeople(await sharing.people(vehicleId));
    } catch {
      setError("Споделянето още не е включено. Опитай по-късно.");
    } finally {
      setLoading(false);
    }
  }, [session, vehicleId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading || !vehicle || !me) {
    return (
      <Screen title="Споделяне">
        <View className="mt-10 items-center">
          {loading ? <ActivityIndicator color={colors.copper} /> : <Text className="text-muted">{error}</Text>}
        </View>
      </Screen>
    );
  }

  const owner = vehicle.userId === me;
  const name = `${vehicle.brand} ${vehicle.model}`;
  const members = people.filter((person) => !person.isOwner);
  const ownerPerson = people.find((person) => person.isOwner);

  const invite = async () => {
    setBusy(true);
    setError(null);
    try {
      const link = shareLink(SITE_URL, await sharing.invite(vehicle.id, me));
      const result = await Share.share({
        message: `Сподели с мен ${name} в Glovebox, за да следим сроковете заедно: ${link}`,
        url: link,
      });
      if (result.action === Share.sharedAction) track("vehicle_shared");
    } catch {
      setError("Поканата не беше създадена. Опитай пак.");
    } finally {
      setBusy(false);
    }
  };

  const remove = (person: VehiclePerson) => {
    const leaving = person.userId === me;
    Alert.alert(
      leaving ? "Спри да следиш колата" : "Премахни от колата",
      leaving
        ? `${name} изчезва от гаража ти и спираш да получаваш напомняния за нея.`
        : `${who(person)} спира да вижда ${name} и да получава напомняния за нея.`,
      [
        { text: "Отказ", style: "cancel" },
        {
          text: leaving ? "Спри" : "Премахни",
          style: "destructive",
          onPress: async () => {
            try {
              await sharing.remove(vehicle.id, person.userId);
              if (leaving) router.replace("/(tabs)/vehicles");
              else await load();
            } catch {
              setError("Не се получи. Опитай пак.");
            }
          },
        },
      ],
    );
  };

  return (
    <Screen title={owner ? "Сподели колата" : name}>
      {owner ? (
        <Text className="-mt-3 mb-6 text-base leading-6 text-silver">
          Прати връзка на човека, с когото карате {name}. Като я отвори в Glovebox, вижда и
          подновява сроковете и получава напомнянията. Връзката работи веднъж, седем дни.
        </Text>
      ) : (
        <Text className="-mt-3 mb-6 text-base leading-6 text-silver">
          Колата е споделена с теб{ownerPerson ? ` от ${who(ownerPerson)}` : ""}. Виждаш и
          подновяваш сроковете ѝ и получаваш напомнянията.
        </Text>
      )}

      {error && <Text className="mb-4 text-sm text-status-expired">{error}</Text>}

      {owner && <PrimaryButton label="Изпрати покана" onPress={() => void invite()} loading={busy} />}

      <Text className="mb-2 mt-7 text-xs uppercase tracking-wider text-dim">Кой следи колата</Text>
      {people.map((person) => (
        <View
          key={person.userId}
          className="mb-2 flex-row items-center justify-between rounded-xl border border-white/10 bg-panel px-4 py-3"
        >
          <View className="flex-1 pr-3">
            <Text className="text-base text-ivory" numberOfLines={1}>
              {person.userId === me ? "Ти" : who(person)}
            </Text>
            <Text className="text-xs text-dim">{person.isOwner ? "Собственик" : "Член на семейството"}</Text>
          </View>
          {!person.isOwner && (owner || person.userId === me) && (
            <Pressable onPress={() => remove(person)} hitSlop={8}>
              <Text className="text-sm text-status-expired">{person.userId === me ? "Спри" : "Премахни"}</Text>
            </Pressable>
          )}
        </View>
      ))}
      {owner && members.length === 0 && (
        <Text className="text-sm text-dim">Още никой. Колата я следиш само ти.</Text>
      )}
    </Screen>
  );
}
