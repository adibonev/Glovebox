/** A Bulgarian registration plate badge with the national tricolour. */
export function PlateBadge({ plate, size = "md" }: { plate: string; size?: "sm" | "md" }) {
  const sm = size === "sm";
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] font-mono font-semibold tracking-[0.06em] text-ivory ${
        sm ? "py-1 pl-1 pr-2.5 text-[13px]" : "py-1.5 pl-1.5 pr-3 text-[15px]"
      }`}
    >
      {/* Bulgarian flag — fixed real-world colours (white / green / red), not brand tokens. */}
      <span
        className={`relative flex flex-col overflow-hidden rounded-[4px] ring-1 ring-black/20 ${
          sm ? "h-[22px] w-[16px]" : "h-[26px] w-[19px]"
        }`}
        aria-label="BG"
      >
        <span className="flex-1 bg-white" />
        <span className="flex-1 bg-[#00966E]" />
        <span className="flex-1 bg-[#D62612]" />
        <span
          className={`absolute inset-x-0 bottom-0 text-center font-bold leading-none text-white ${
            sm ? "pb-[1px] text-[6px]" : "pb-[2px] text-[7px]"
          }`}
        >
          BG
        </span>
      </span>
      {plate}
    </span>
  );
}
