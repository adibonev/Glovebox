import Link from "next/link";

import { updateVehicle } from "@/app/_lib/actions";

import { BodyTypePicker } from "../../_components/BodyTypePicker";
import { parseBodyType } from "../../_lib/bodyType";

const fieldClass =
  "rounded-xl border border-white/10 bg-ink/60 px-4 py-2.5 font-body text-ivory outline-none transition focus:border-copper/60";

export type EditableVehicle = {
  id: string;
  brand: string;
  model: string;
  year: number | null;
  plate: string | null;
  vin: string | null;
  bodyType: string | null;
};

/** Edit a Vehicle's identity (brand / model / year / plate). */
export function EditVehicleForm({ vehicle }: { vehicle: EditableVehicle }) {
  return (
    <form
      action={updateVehicle}
      className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-md"
    >
      <input type="hidden" name="id" value={vehicle.id} />
      <div className="grid gap-3 sm:grid-cols-2">
        <input name="brand" required defaultValue={vehicle.brand} placeholder="Марка (напр. BMW)" className={fieldClass} />
        <input name="model" required defaultValue={vehicle.model} placeholder="Модел (напр. 320d)" className={fieldClass} />
        <input
          name="year"
          type="number"
          defaultValue={vehicle.year ?? ""}
          placeholder="Година"
          className={fieldClass}
        />
        <input
          name="plate"
          defaultValue={vehicle.plate ?? ""}
          placeholder="Рег. номер"
          className={fieldClass}
        />
      </div>
      <input
        name="vin"
        maxLength={17}
        defaultValue={vehicle.vin ?? ""}
        placeholder="VIN / рама (по избор)"
        className={`${fieldClass} uppercase placeholder:normal-case`}
      />
      <BodyTypePicker value={parseBodyType(vehicle.bodyType)} />
      <div className="flex items-center gap-2">
        <button
          type="submit"
          className="rounded-xl bg-emerald px-4 py-2.5 font-body font-semibold text-ivory transition hover:bg-emerald/90"
        >
          Запази
        </button>
        <Link
          href="/vehicles"
          className="rounded-xl border border-white/10 px-4 py-2.5 font-body font-medium text-muted transition hover:text-ivory"
        >
          Отказ
        </Link>
      </div>
    </form>
  );
}
