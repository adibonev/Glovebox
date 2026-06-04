import { colors, statusColors } from "@glovebox/ui";
import { Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

import type { Counts, UrgentView } from "@/lib/useGarage";

const R = 80;
const C = 2 * Math.PI * R;
const ARC = C * 0.75; // a 270° gauge, open at the bottom (matches web)

/** The instrument gauge for the nearest deadline + the three status counts. */
export function GaugePanel({ urgent, counts }: { urgent: UrgentView; counts: Counts }) {
  return (
    <View className="rounded-3xl border border-white/10 bg-panel p-5">
      <Text className="text-[11px] uppercase tracking-[2px] text-muted">Най-близък срок</Text>

      {urgent ? <Gauge urgent={urgent} /> : <AllClear />}

      <View className="my-4 h-px bg-white/10" />

      <View className="flex-row">
        <Stat n={counts.valid} label="в сила" color={colors.ivory} dot={statusColors.valid} />
        <Stat n={counts.expiring} label="изтичат" color={statusColors.expiring} dot={statusColors.expiring} />
        <Stat n={counts.expired} label="изтекли" color={statusColors.expired} dot={statusColors.expired} />
      </View>
    </View>
  );
}

function Gauge({ urgent }: { urgent: NonNullable<UrgentView> }) {
  const frac = Math.max(0, Math.min(1, urgent.fraction));
  const displayFrac = urgent.expired ? 1 : frac; // overdue → full alarming ring
  const offset = ARC * (1 - displayFrac);

  return (
    <View className="my-3 items-center">
      <View style={{ width: 210, height: 210 }}>
        <Svg width="100%" height="100%" viewBox="0 0 200 200">
          <Circle
            cx={100}
            cy={100}
            r={R}
            fill="none"
            stroke="rgba(255,255,255,0.07)"
            strokeWidth={14}
            strokeLinecap="round"
            strokeDasharray={[ARC, C]}
            transform="rotate(135 100 100)"
          />
          <Circle
            cx={100}
            cy={100}
            r={R}
            fill="none"
            stroke={urgent.color}
            strokeWidth={14}
            strokeLinecap="round"
            strokeDasharray={[ARC, C]}
            strokeDashoffset={offset}
            transform="rotate(135 100 100)"
          />
        </Svg>
        <View className="absolute inset-0 items-center justify-center">
          <Text style={{ color: urgent.color }} className="text-6xl font-semibold leading-none">
            {Math.abs(urgent.days)}
          </Text>
          <Text style={{ color: urgent.color }} className="mt-1.5 text-xs uppercase tracking-[3px]">
            дни
          </Text>
          <Text className="mt-1.5 max-w-[150px] text-center text-[13px] text-muted">
            {urgent.expired ? `${urgent.typeLabel} изтече` : `до ${urgent.typeLabel}`}
          </Text>
        </View>
      </View>
    </View>
  );
}

function AllClear() {
  return (
    <View className="my-3 h-[210px] items-center justify-center gap-3">
      <View
        className="h-20 w-20 items-center justify-center rounded-full border"
        style={{ borderColor: `${statusColors.valid}4D`, backgroundColor: `${statusColors.valid}1A` }}
      >
        <Text style={{ color: statusColors.valid }} className="text-3xl">
          ✓
        </Text>
      </View>
      <Text className="text-sm text-muted">Няма наближаващи срокове</Text>
    </View>
  );
}

function Stat({ n, label, color, dot }: { n: number; label: string; color: string; dot: string }) {
  return (
    <View className="flex-1 items-center">
      <Text style={{ color }} className="text-2xl font-semibold leading-none">
        {n}
      </Text>
      <View className="mt-1.5 flex-row items-center gap-1.5">
        <View className="h-[7px] w-[7px] rounded-full" style={{ backgroundColor: dot }} />
        <Text className="text-[11px] text-muted">{label}</Text>
      </View>
    </View>
  );
}
