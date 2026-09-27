import { Ionicons } from "@expo/vector-icons";
import { colors } from "@glovebox/ui";
import { Pressable, Text, View } from "react-native";

import {
  SERVICE_TYPE_LABELS,
  STATUS_COLORS,
  formatCost,
  formatDateShort,
  formatDaysFigure,
} from "@/lib/labels";
import type { EnrichedRecord } from "@/lib/useGarage";

import { ServiceTypeIcon } from "./ServiceTypeIcon";

/**
 * One Service Record in a car's list, the same row as on the website: what it is, its date and
 * cost, and the days left, coloured when it needs attention. The whole row opens the record: no
 * small pencil and cross, and no "в сила" on every row saying what the colour already does.
 */
export function DeadlineRow({ item, onPress, first }: { item: EnrichedRecord; onPress: () => void; first?: boolean }) {
  const { record, status, days, expiring } = item;
  const color = expiring ? STATUS_COLORS[status] : colors.muted;
  const cost = formatCost(record.cost);
  const { figure, note } = formatDaysFigure(days);
  const label = SERVICE_TYPE_LABELS[record.serviceType] ?? record.serviceType;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${expiring ? `${figure} ${note}` : "разход"}`}
      className={`flex-row items-center gap-3 px-4 py-3.5 ${first ? "" : "border-t border-white/[0.06]"}`}
    >
      <View
        className="h-10 w-10 items-center justify-center rounded-xl border border-white/10"
        style={{ backgroundColor: `${color}14` }}
      >
        <ServiceTypeIcon type={record.serviceType} color={color} />
      </View>
      <View className="flex-1">
        <Text className="text-[15px] text-ivory">{label}</Text>
        <Text className="mt-0.5 text-xs text-dim">
          {formatDateShort(record.expiryDate)}
          {cost ? <Text className="text-copper"> · {cost}</Text> : null}
        </Text>
      </View>
      {expiring ? (
        <View className="items-end">
          <Text className="text-base font-semibold" style={{ color: status === "Valid" ? colors.ivory : color }}>
            {figure}
          </Text>
          <Text className="text-[11px]" style={{ color: status === "Valid" ? colors.dim : color }}>
            {note}
          </Text>
        </View>
      ) : (
        <Text className="text-[11px] uppercase tracking-wider text-dim">Разход</Text>
      )}
      <Ionicons name="chevron-forward" size={16} color={colors.dim} />
    </Pressable>
  );
}
