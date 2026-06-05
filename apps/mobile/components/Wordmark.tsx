import { colors } from "@glovebox/ui";
import { Text, View } from "react-native";
import Svg, { Circle, Line } from "react-native-svg";

/** The 3-spoke steering wheel (9/3/6 o'clock — no top spoke), the brand's "o". */
export function Wheel({ size = 20, color = colors.copper }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Circle cx={50} cy={50} r={38} fill="none" stroke={color} strokeWidth={8} />
      <Line x1={12} y1={50} x2={88} y2={50} stroke={color} strokeWidth={7} strokeLinecap="round" />
      <Line x1={50} y1={50} x2={50} y2={88} stroke={color} strokeWidth={7} strokeLinecap="round" />
      <Circle cx={50} cy={50} r={10} fill={color} />
    </Svg>
  );
}

/** "Glovebox" with the steering-wheel as the "o" in "box" (brand wordmark). */
export function Wordmark({ size = 24 }: { size?: number }) {
  const text = { fontSize: size };
  return (
    <View className="flex-row items-center">
      <Text style={text} className="font-display text-ivory">
        Glove
      </Text>
      <Text style={text} className="font-display text-copper">
        b
      </Text>
      <View style={{ marginHorizontal: size * 0.02 }}>
        <Wheel size={size * 0.86} />
      </View>
      <Text style={text} className="font-display text-copper">
        x
      </Text>
    </View>
  );
}
