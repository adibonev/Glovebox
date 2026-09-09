import { DOCUMENT_SCAN_ENABLED } from "@glovebox/core";
import { useRouter } from "expo-router";
import { Pressable, Text } from "react-native";

import { Screen } from "@/components/Screen";

/**
 * The one way into adding a Vehicle: pick how, then do it.
 *
 * Both routes existed before as two buttons sitting next to each other on the Vehicles tab,
 * which put the question in a place a User only reaches after already deciding to add a car —
 * and put it nowhere else. Asking here means every entry point (the empty dashboard, the
 * Vehicles tab, the first screen after registering) leads to the same question.
 */
export default function AddVehicleScreen() {
  const router = useRouter();

  return (
    <Screen title="Добави автомобил">
      <Text className="mb-6 text-base leading-6 text-silver">
        Как искаш да въведеш колата?
      </Text>

      {DOCUMENT_SCAN_ENABLED && (
        <Pressable
          onPress={() => router.replace("/vehicle/scan")}
          className="mb-3 rounded-2xl border border-copper/60 bg-copper/15 p-5"
        >
          <Text className="text-lg font-semibold text-ivory">Снимай документа за преглед</Text>
          <Text className="mt-1.5 text-sm leading-5 text-silver">
            От талона се попълват марката, моделът, регистрационният номер, рамата и срокът на
            прегледа. Проверяваш ги, преди да се запишат.
          </Text>
        </Pressable>
      )}

      <Pressable
        onPress={() => router.replace("/vehicle/new")}
        className="rounded-2xl border border-emerald/60 bg-emerald/15 p-5"
      >
        <Text className="text-lg font-semibold text-ivory">Въведи ръчно</Text>
        <Text className="mt-1.5 text-sm leading-5 text-silver">
          Попълваш полетата сам. Работи винаги, включително без документ подръка и без интернет.
        </Text>
      </Pressable>
    </Screen>
  );
}
