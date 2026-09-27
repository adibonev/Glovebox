import { useLocalSearchParams, useRouter } from "expo-router";
import { Text } from "react-native";

import { PushSettings } from "@/components/PushSettings";
import { ReminderSettings } from "@/components/ReminderSettings";
import { Screen } from "@/components/Screen";
import { useGarage } from "@/lib/useGarage";

/**
 * When and how reminders come: notifications on this phone, and how many days before each kind
 * of deadline. Reached from Профил, and as the last step of adding a car. What is due is on the
 * dashboard, so it is not listed a second time here.
 */
export default function RemindersScreen() {
  const router = useRouter();
  const { data } = useGarage();
  // Arrived from a new car's setup (vehicle/setup): saving is its last step, and ends on the
  // dashboard with the car confirmed. The flag is cleared first, or every later save would too.
  const { setup } = useLocalSearchParams<{ setup?: string }>();
  const onSaved = () => {
    if (setup !== "1") return;
    router.setParams({ setup: undefined });
    router.replace("/?added=1");
  };

  return (
    <Screen title="Напомняния">
      {setup === "1" && (
        <Text className="-mt-3 mb-5 text-sm leading-5 text-silver">
          Последна стъпка. Избери кога да ти напомняме и натисни „Запази“.
        </Text>
      )}
      <PushSettings />
      {data?.userId && <ReminderSettings userId={data.userId} onSaved={onSaved} />}
    </Screen>
  );
}
