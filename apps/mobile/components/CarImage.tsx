import { Image, View } from "react-native";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";

import coupe from "../assets/cars/coupe.webp";
import hatchback from "../assets/cars/hatchback.webp";
import pickup from "../assets/cars/pickup.webp";
import sedan from "../assets/cars/sedan.webp";
import suv from "../assets/cars/suv.webp";
import wagon from "../assets/cars/wagon.webp";

import type { BodyType } from "@/lib/bodyType";

// The webp silhouettes are shared with web (static imports → Metro asset ids).
const CAR_IMAGES: Record<BodyType, number> = { hatchback, sedan, wagon, suv, coupe, pickup };

/** The vehicle silhouette on a soft emerald halo (mirrors the web VehicleCard look). */
export function CarImage({ bodyType, height = 160 }: { bodyType: BodyType; height?: number }) {
  return (
    <View className="w-full items-center justify-center" style={{ height }}>
      <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: "absolute" }}>
        <Defs>
          <RadialGradient id="halo" cx="50%" cy="50%" rx="55%" ry="42%">
            <Stop offset="0" stopColor="#1F6347" stopOpacity={0.45} />
            <Stop offset="0.6" stopColor="#C4954C" stopOpacity={0.05} />
            <Stop offset="1" stopColor="#1F6347" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100" height="100" fill="url(#halo)" />
      </Svg>
      <Image source={CAR_IMAGES[bodyType]} resizeMode="contain" style={{ width: "92%", height: "92%" }} />
    </View>
  );
}
