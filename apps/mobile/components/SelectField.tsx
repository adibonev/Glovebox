import { colors } from "@glovebox/ui";
import { useMemo, useState } from "react";
import { FlatList, Modal, Pressable, Text, TextInput, View } from "react-native";

/**
 * A field whose value is picked from a list instead of typed.
 *
 * Left to type it, three people enter "VW", "Volkswagen" and "Фолксваген" for the same car, and
 * nothing afterwards can put those back together. The list is the one spelling of each make and
 * model; the search box is what keeps two thousand models usable on a phone.
 */
export function SelectField({
  label,
  value,
  options,
  onChange,
  placeholder,
  disabled,
  disabledHint,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
  disabledHint?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return needle ? options.filter((option) => option.toLowerCase().includes(needle)) : options;
  }, [options, query]);

  return (
    <View className="mb-4">
      <Text className="mb-1.5 text-sm text-muted">{label}</Text>
      <Pressable
        onPress={() => {
          if (disabled) return;
          setQuery("");
          setOpen(true);
        }}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value || placeholder}`}
        className={`flex-row items-center justify-between rounded-xl border border-white/10 bg-panel px-4 py-3.5 ${
          disabled ? "opacity-50" : ""
        }`}
      >
        <Text className={`text-base ${value ? "text-ivory" : "text-dim"}`}>
          {value || placeholder}
        </Text>
        <Text className="text-base text-muted">▾</Text>
      </Pressable>
      {disabled && disabledHint ? (
        <Text className="mt-1 text-xs text-dim">{disabledHint}</Text>
      ) : null}

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View className="flex-1 justify-end bg-black/60">
          <View className="h-[78%] rounded-t-3xl border-t border-white/10 bg-panel2 p-4">
            <View className="mb-3 flex-row items-center gap-2">
              <TextInput
                autoFocus
                value={query}
                onChangeText={setQuery}
                placeholder="Търси…"
                placeholderTextColor={colors.dim}
                className="flex-1 rounded-xl border border-white/10 bg-panel px-4 py-3 text-base text-ivory"
              />
              <Pressable onPress={() => setOpen(false)} hitSlop={10} className="px-2 py-2">
                <Text className="text-base text-copper">Затвори</Text>
              </Pressable>
            </View>

            <FlatList
              data={shown}
              keyExtractor={(option) => option}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    onChange(item);
                    setOpen(false);
                  }}
                  className="border-b border-white/[0.06] py-3.5"
                >
                  <Text className={`text-base ${item === value ? "text-copper" : "text-ivory"}`}>
                    {item}
                  </Text>
                </Pressable>
              )}
              ListEmptyComponent={
                <Text className="py-6 text-center text-sm text-muted">Няма съвпадение.</Text>
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
