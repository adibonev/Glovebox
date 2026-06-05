import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { colors } from "@glovebox/ui";
import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from "react-native";

import { formatDateShort } from "@/lib/labels";

/** Labeled text input. */
export function Field({ label, ...props }: { label: string } & TextInputProps) {
  return (
    <View className="mb-4">
      <Text className="mb-1.5 text-sm text-muted">{label}</Text>
      <TextInput
        placeholderTextColor={colors.dim}
        className="rounded-xl border border-white/10 bg-panel px-4 py-3.5 text-base text-ivory"
        {...props}
      />
    </View>
  );
}

/** A wrap of selectable chips (Service Type / body type pickers). */
export function ChipPicker<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T | null;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <View className="mb-4">
      <Text className="mb-2 text-sm text-muted">{label}</Text>
      <View className="flex-row flex-wrap gap-2">
        {options.map((option) => {
          const active = option.value === value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              className={`rounded-xl border px-3.5 py-2.5 ${
                active ? "border-copper bg-copper/20" : "border-white/10 bg-panel"
              }`}
            >
              <Text className={`text-sm ${active ? "text-ivory" : "text-muted"}`}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** A date field backed by the native picker (Android dialog, iOS spinner-in-a-sheet). */
export function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
}) {
  const [show, setShow] = useState(false);
  const [temp, setTemp] = useState(value);

  const onAndroidChange = (event: DateTimePickerEvent, date?: Date) => {
    setShow(false);
    if (event.type === "set" && date) onChange(date);
  };

  return (
    <View className="mb-4">
      <Text className="mb-1.5 text-sm text-muted">{label}</Text>
      <Pressable
        onPress={() => {
          setTemp(value);
          setShow(true);
        }}
        className="rounded-xl border border-white/10 bg-panel px-4 py-3.5"
      >
        <Text className="text-base text-ivory">{formatDateShort(value)}</Text>
      </Pressable>

      {Platform.OS === "android" && show && (
        <DateTimePicker value={value} mode="date" onChange={onAndroidChange} />
      )}

      {Platform.OS === "ios" && (
        <Modal visible={show} transparent animationType="fade">
          <View className="flex-1 justify-end bg-black/50">
            <View className="rounded-t-3xl border-t border-white/10 bg-panel2 p-4">
              <DateTimePicker
                value={temp}
                mode="date"
                display="spinner"
                themeVariant="dark"
                onChange={(_event, date) => date && setTemp(date)}
              />
              <PrimaryButton
                label="Готово"
                onPress={() => {
                  onChange(temp);
                  setShow(false);
                }}
              />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

/** Primary (emerald) action button. */
export function PrimaryButton({
  label,
  onPress,
  disabled,
  loading,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={`mt-2 items-center rounded-xl bg-emerald py-4 ${
        disabled || loading ? "opacity-50" : ""
      }`}
    >
      {loading ? (
        <ActivityIndicator color={colors.ivory} />
      ) : (
        <Text className="text-base font-semibold text-ivory">{label}</Text>
      )}
    </Pressable>
  );
}

/** Quick "valid until" presets for a Vignette (BG durations) — sets Expiry from today. */
const VIGNETTE_PRESETS: { label: string; days: number }[] = [
  { label: "Уикенд", days: 3 },
  { label: "Седмица", days: 7 },
  { label: "Месец", days: 30 },
  { label: "Тримесечие", days: 90 },
  { label: "Година", days: 365 },
];

export function VignettePresets({ onPick }: { onPick: (date: Date) => void }) {
  return (
    <View className="mb-4">
      <Text className="mb-1.5 text-sm text-muted">Бърз избор (винетка)</Text>
      <View className="flex-row flex-wrap gap-2">
        {VIGNETTE_PRESETS.map((p) => (
          <Pressable
            key={p.label}
            onPress={() => {
              const d = new Date();
              d.setDate(d.getDate() + p.days);
              onPick(d);
            }}
            className="rounded-lg border border-white/10 bg-panel px-3 py-2"
          >
            <Text className="text-[13px] text-copper">{p.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

/** Destructive text button (delete). */
export function DangerButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="mt-4 items-center py-3">
      <Text className="text-base font-semibold text-status-expired">{label}</Text>
    </Pressable>
  );
}
