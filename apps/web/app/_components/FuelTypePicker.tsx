import { FUEL_TYPES, type FuelType } from "@glovebox/core";

import { FUEL_TYPE_LABELS } from "../_lib/fuelType";

/**
 * Fuel chooser: pure-CSS radio chips (name="fuelType"), no client JS.
 *
 * Nothing is pre-selected. A Vehicle saved before this field existed has no Fuel Type, and
 * guessing petrol for it would be a fact nobody entered.
 */
export function FuelTypePicker({ value }: { value?: FuelType | null }) {
  return (
    <fieldset>
      <legend className="mb-2 font-mono text-[11px] uppercase tracking-[0.18em] text-dim">
        Гориво
      </legend>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {FUEL_TYPES.map((type) => (
          <label key={type} className="cursor-pointer">
            <input
              type="radio"
              name="fuelType"
              value={type}
              defaultChecked={type === value}
              className="peer sr-only"
            />
            <span className="flex items-center justify-center rounded-xl border border-white/10 bg-ink/40 px-2 py-2.5 text-center font-body text-[12px] leading-none text-muted transition hover:border-white/25 peer-checked:border-copper/60 peer-checked:bg-copper/[0.08] peer-checked:text-copper">
              {FUEL_TYPE_LABELS[type]}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
