/** A Bulgarian/EU registration plate badge. */
export function PlateBadge({ plate, size = "md" }: { plate: string; size?: "sm" | "md" }) {
  const sm = size === "sm";
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] font-mono font-semibold tracking-[0.06em] text-ivory ${
        sm ? "py-1 pl-1 pr-2.5 text-[13px]" : "py-1.5 pl-1.5 pr-3 text-[15px]"
      }`}
    >
      {/* EU/BG plate emblem — fixed real-world flag colours, not brand tokens. */}
      <span
        className={`flex flex-col items-center justify-end rounded-[4px] bg-[#0b3a8f] font-bold leading-none text-[#ffcf3a] ${
          sm ? "h-[22px] w-[18px] pb-0.5 text-[7px]" : "h-[26px] w-[22px] pb-1 text-[8px]"
        }`}
      >
        <span aria-hidden className="mb-[2px] text-[7px]">
          ★
        </span>
        BG
      </span>
      {plate}
    </span>
  );
}
