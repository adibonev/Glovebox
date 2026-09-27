import { Wheel } from "./Wheel";

/**
 * The "Glovebox" wordmark: "Glove" in ivory, "box" in copper with the steering wheel for its "o"
 * (brand/BRAND.md). Sized by the font size in `className`. Read aloud as one word.
 */
export function Wordmark({ className = "text-[25px]" }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label="Glovebox"
      className={`flex items-baseline font-brand font-semibold leading-none tracking-tight ${className}`}
    >
      <span className="text-ivory">Glove</span>
      <span className="flex items-baseline text-copper">
        b
        <Wheel style={{ width: "0.82em", height: "0.82em", transform: "translateY(0.08em)", margin: "0 0.01em" }} />
        x
      </span>
    </span>
  );
}
