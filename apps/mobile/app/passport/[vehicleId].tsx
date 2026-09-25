import {
  SupabasePassportLinkRepository,
  SupabaseUserRepository,
  SupabaseVehicleRepository,
  type PassportLink,
  type Vehicle,
} from "@glovebox/core";
import { colors } from "@glovebox/ui";
import * as WebBrowser from "expo-web-browser";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, Share, Switch, Text, View } from "react-native";

import { Choice } from "@/components/choices";
import { PrimaryButton } from "@/components/forms";
import { Screen } from "@/components/Screen";
import { useAuth } from "@/lib/auth";
import { SITE_URL } from "@/lib/config";
import { supabase } from "@/lib/supabase";

const vehicleRepo = new SupabaseVehicleRepository(supabase);
const userRepo = new SupabaseUserRepository(supabase);
const linkRepo = new SupabasePassportLinkRepository(supabase);

const passportUrl = (token: string) => `${SITE_URL}/p/${token}`;

const openPage = (url: string) =>
  WebBrowser.openBrowserAsync(url, {
    controlsColor: colors.copper,
    toolbarColor: colors.ink,
    dismissButtonStyle: "close",
    createTask: false,
  });

/**
 * A Vehicle's passport: everything recorded about the car on one page, behind one link the owner
 * can send to a buyer and stop at any time. The page and its PDF live on the web; the app makes
 * the link and hands it on.
 */
export default function PassportScreen() {
  const { vehicleId } = useLocalSearchParams<{ vehicleId: string }>();
  const { session } = useAuth();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [link, setLink] = useState<PassportLink | null>(null);
  const [includeCosts, setIncludeCosts] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      const [found, current] = await Promise.all([
        vehicleRepo.getById(vehicleId),
        linkRepo.activeForVehicle(vehicleId),
      ]);
      if (!active) return;
      setVehicle(found);
      setLink(current);
    })()
      .catch(() => active && setError("Паспортът не се зареди. Провери връзката и опитай пак."))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [vehicleId]);

  const create = async () => {
    if (!session) return;
    setBusy(true);
    setError(null);
    try {
      const user = await userRepo.findOrCreateByAuthId({
        authUserId: session.user.id,
        email: session.user.email ?? "",
      });
      setLink(await linkRepo.create({ vehicleId, userId: user.id, includeCosts }));
    } catch {
      setError("Паспортът не беше създаден. Опитай пак.");
    } finally {
      setBusy(false);
    }
  };

  const revoke = () => {
    if (!link) return;
    Alert.alert("Спри връзката", "Спира веднага. QR кодът на вече пратените PDF-и спира да води до паспорта.", [
      { text: "Отказ", style: "cancel" },
      {
        text: "Спри",
        style: "destructive",
        onPress: async () => {
          try {
            await linkRepo.revoke(link.id);
            setLink(null);
          } catch {
            setError("Връзката не беше спряна. Опитай пак.");
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <Screen title="Паспорт на колата">
        <View className="mt-10 items-center">
          <ActivityIndicator color={colors.copper} />
        </View>
      </Screen>
    );
  }

  const name = vehicle ? `${vehicle.brand} ${vehicle.model}` : "Паспорт на колата";
  const url = link ? passportUrl(link.token) : null;

  return (
    <Screen title={name}>
      <Text className="-mt-3 mb-6 text-base leading-6 text-silver">
        Всичко за колата на един лист: пробегът от всеки преглед, кога какво е подновявано и
        ремонтите. Пращаш връзката на купувач или сваляш PDF. На PDF-а има QR код към същата
        страница, така че купувачът вижда, че данните не са пипани.
      </Text>

      {error && <Text className="mb-4 text-sm text-status-expired">{error}</Text>}

      {link && url ? (
        <>
          <View className="mb-4 rounded-xl border border-white/10 bg-panel p-4">
            <Text className="text-xs text-muted">
              Връзката работи{link.includeCosts ? ", със сумите" : ", без сумите"}.
            </Text>
            <Text selectable className="mt-1.5 text-sm text-ivory">
              {url}
            </Text>
          </View>
          <Choice
            title="Изпрати връзката"
            body="На купувач, в обява или на когото прецениш."
            tone="copper"
            onPress={() => void Share.share({ message: `Паспорт на ${name}: ${url}`, url })}
          />
          <Choice title="Отвори паспорта" body="Виж го така, както ще го види купувачът." tone="emerald" onPress={() => void openPage(url)} />
          <Choice title="Свали PDF" body="За печат или за прикачване към имейл." tone="plain" onPress={() => void openPage(`${url}/pdf`)} />
          <Pressable onPress={revoke} className="mt-3 items-center py-3">
            <Text className="text-sm font-semibold text-status-expired">Спри връзката</Text>
          </Pressable>
        </>
      ) : (
        <>
          <View className="mb-4 flex-row items-center justify-between rounded-xl border border-white/10 bg-panel p-4">
            <View className="flex-1 pr-4">
              <Text className="text-base text-ivory">Покажи и сумите</Text>
              <Text className="mt-0.5 text-xs text-dim">Колко са стрували полиците, прегледите и ремонтите.</Text>
            </View>
            <Switch
              value={includeCosts}
              onValueChange={setIncludeCosts}
              trackColor={{ true: colors.emerald, false: "#33413a" }}
              thumbColor={colors.ivory}
            />
          </View>
          <PrimaryButton label="Създай паспорт" onPress={() => void create()} loading={busy} />
        </>
      )}
    </Screen>
  );
}
