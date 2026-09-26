import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { vignetteExpiry, type VignetteKind } from "@glovebox/core";
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
import { todayAsDate } from "@/lib/mileage";

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

/** The picked calendar day as UTC midnight, the domain's date convention (see lib/mileage). */
const asDay = (date: Date) => new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));

/**
 * A date that may be left out: shows "Не е въведена" until picked, and can be cleared. For facts
 * the User may not have to hand, like the date of first registration. Returns the day as UTC
 * midnight, so a date picked just after local midnight is not saved as the day before.
 */
export function OptionalDateField({
  label,
  hint,
  value,
  onChange,
  minimumDate,
}: {
  label: string;
  hint?: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  /** The earliest day offered, e.g. 1 January of the car's year for its first registration. */
  minimumDate?: Date;
}) {
  const [show, setShow] = useState(false);
  const [temp, setTemp] = useState(value ?? new Date());

  const open = () => {
    setTemp(value ?? new Date());
    setShow(true);
  };

  return (
    <View className="mb-4">
      <Text className="mb-1.5 text-sm text-muted">{label}</Text>
      <View className="flex-row items-center gap-2">
        <Pressable onPress={open} className="flex-1 rounded-xl border border-white/10 bg-panel px-4 py-3.5">
          <Text className={`text-base ${value ? "text-ivory" : "text-dim"}`}>
            {value ? formatDateShort(value) : "Не е въведена"}
          </Text>
        </Pressable>
        {value && (
          <Pressable onPress={() => onChange(null)} hitSlop={8} className="px-2 py-3">
            <Text className="text-sm text-dim">Изчисти</Text>
          </Pressable>
        )}
      </View>
      {hint && <Text className="mt-1.5 text-xs leading-4 text-dim">{hint}</Text>}

      {Platform.OS === "android" && show && (
        <DateTimePicker
          value={value ?? new Date()}
          mode="date"
          maximumDate={new Date()}
          minimumDate={minimumDate}
          onChange={(event, date) => {
            setShow(false);
            if (event.type === "set" && date) onChange(asDay(date));
          }}
        />
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
                maximumDate={new Date()}
                minimumDate={minimumDate}
                onChange={(_event, date) => date && setTemp(date)}
              />
              <PrimaryButton
                label="Готово"
                onPress={() => {
                  onChange(asDay(temp));
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
const VIGNETTE_PRESETS: { label: string; kind: VignetteKind }[] = [
  { label: "Уикенд", kind: "weekend" },
  { label: "Седмица", kind: "weekly" },
  { label: "Месец", kind: "monthly" },
  { label: "Тримесечие", kind: "quarterly" },
  { label: "Година", kind: "annual" },
];

/**
 * The last valid day of a vignette bought today, by the rules in core: a weekend one ends on the
 * Sunday, a week counts today as day one, a year ends the day before the anniversary. Counting
 * plain days put every one of them a day late, and a day late is a fine.
 */
function presetExpiry(kind: VignetteKind): Date {
  return vignetteExpiry(todayAsDate(), kind);
}

const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

/**
 * The vignette lengths as one tap each. The chosen one stays lit while the date is still the one
 * it set, so it is clear what was picked; changing the date by hand puts the light out.
 */
export function VignettePresets({ value, onPick }: { value: Date; onPick: (date: Date) => void }) {
  const [picked, setPicked] = useState<string | null>(null);
  const lit = VIGNETTE_PRESETS.find((p) => p.label === picked && sameDay(value, presetExpiry(p.kind)));

  return (
    <View className="mb-4">
      <Text className="mb-1.5 text-sm text-muted">Бърз избор (винетка)</Text>
      <View className="flex-row flex-wrap gap-2">
        {VIGNETTE_PRESETS.map((p) => {
          const on = lit?.label === p.label;
          return (
            <Pressable
              key={p.label}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              onPress={() => {
                setPicked(p.label);
                onPick(presetExpiry(p.kind));
              }}
              className={
                on
                  ? "rounded-lg border border-copper bg-copper/20 px-3 py-2"
                  : "rounded-lg border border-white/10 bg-panel px-3 py-2"
              }
            >
              <Text className={on ? "text-[13px] font-semibold text-ivory" : "text-[13px] text-copper"}>
                {on ? `✓ ${p.label}` : p.label}
              </Text>
            </Pressable>
          );
        })}
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
