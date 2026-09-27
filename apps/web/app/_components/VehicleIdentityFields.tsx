"use client";

import { VEHICLE_CATALOG, makeNames, modelsFor, vehicleYears } from "@glovebox/core";
import { useMemo, useState } from "react";

const fieldClass =
  "rounded-xl border border-white/10 bg-ink/60 px-4 py-2.5 font-body text-ivory outline-none transition focus:border-copper/60";
const labelClass = "font-body text-sm text-muted";

/**
 * Make, model and year, picked from the catalogue and never typed (the same catalogue the phone
 * offers), then the plate and the VIN. One spelling per car is what makes a list of Vehicles
 * comparable at all.
 *
 * A Vehicle recorded before the catalogue existed keeps whatever it was saved with: its make and
 * model stay in their lists, so opening the form and saving never quietly rewrites the car.
 */
export function VehicleIdentityFields({
  brand = "",
  model = "",
  year = null,
  plate = null,
  vin = null,
}: {
  brand?: string;
  model?: string;
  year?: number | null;
  plate?: string | null;
  vin?: string | null;
}) {
  const [make, setMake] = useState(brand);
  const [chosenModel, setChosenModel] = useState(model);

  const makes = useMemo(() => {
    const known = [...makeNames(VEHICLE_CATALOG)].sort((a, b) => a.localeCompare(b, "bg"));
    return brand && !known.includes(brand) ? [brand, ...known] : known;
  }, [brand]);

  const models = useMemo(() => {
    const known = modelsFor(VEHICLE_CATALOG, make);
    return chosenModel && !known.includes(chosenModel) ? [chosenModel, ...known] : known;
  }, [make, chosenModel]);

  const years = useMemo(() => vehicleYears(new Date()), []);

  // Every field says what it is: filled in, "2011" or "WAUZZZ…" alone did not.
  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Марка</span>
          <select
            name="brand"
            required
            value={make}
            onChange={(event) => {
              setMake(event.target.value);
              setChosenModel("");
            }}
            className={fieldClass}
          >
            <option value="" disabled>
              Избери марка
            </option>
            {makes.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Модел</span>
          <select
            name="model"
            required
            value={chosenModel}
            disabled={!make}
            onChange={(event) => setChosenModel(event.target.value)}
            className={`${fieldClass} disabled:opacity-50`}
          >
            <option value="" disabled>
              {make ? "Избери модел" : "Първо избери марка"}
            </option>
            {models.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Година</span>
          <select name="year" defaultValue={year ?? ""} className={fieldClass}>
            <option value="">Не е избрана</option>
            {years.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Регистрационен номер</span>
          <input name="plate" defaultValue={plate ?? ""} placeholder="СВ 1234 АВ" className={`${fieldClass} uppercase placeholder:normal-case`} />
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className={labelClass}>
          Рама (VIN) <span className="text-dim">· по избор</span>
        </span>
        <input
          name="vin"
          maxLength={17}
          defaultValue={vin ?? ""}
          placeholder="17 знака от талона, поле (E)"
          className={`${fieldClass} uppercase placeholder:normal-case`}
        />
      </label>
    </div>
  );
}
