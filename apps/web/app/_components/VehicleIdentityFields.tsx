"use client";

import { VEHICLE_CATALOG, makeNames, modelsFor, vehicleYears } from "@glovebox/core";
import { useMemo, useState } from "react";

const fieldClass =
  "rounded-xl border border-white/10 bg-ink/60 px-4 py-2.5 font-body text-ivory outline-none transition focus:border-copper/60";

/**
 * Make, model and year — picked from the catalogue, never typed, and the same catalogue the phone
 * offers. One spelling per car is what makes a list of Vehicles comparable at all.
 *
 * A Vehicle recorded before the catalogue existed keeps whatever it was saved with: its make and
 * model stay in their lists, so opening the form and saving never quietly rewrites the car.
 */
export function VehicleIdentityFields({
  brand = "",
  model = "",
  year = null,
}: {
  brand?: string;
  model?: string;
  year?: number | null;
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

  return (
    <>
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
          Марка
        </option>
        {makes.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>

      <select
        name="model"
        required
        value={chosenModel}
        disabled={!make}
        onChange={(event) => setChosenModel(event.target.value)}
        className={`${fieldClass} disabled:opacity-50`}
      >
        <option value="" disabled>
          {make ? "Модел" : "Първо избери марка"}
        </option>
        {models.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>

      <select name="year" defaultValue={year ?? ""} className={fieldClass}>
        <option value="">Година</option>
        {years.map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </select>
    </>
  );
}
