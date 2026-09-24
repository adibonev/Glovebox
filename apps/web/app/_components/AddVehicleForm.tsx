import { addVehicle } from "../_lib/actions";
import { BodyTypePicker } from "./BodyTypePicker";
import { FuelTypePicker } from "./FuelTypePicker";
import { VehicleIdentityFields } from "./VehicleIdentityFields";

const fieldClass =
  "rounded-xl border border-white/10 bg-ink/60 px-4 py-2.5 font-body text-ivory outline-none transition focus:border-copper/60";

/** Empty state: create the user's first Vehicle. */
export function AddVehicleForm() {
  return (
    <form
      action={addVehicle}
      className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-md"
    >
      <p className="font-body text-silver/70">
        Добави колата си, за да започнеш да следиш сроковете.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <VehicleIdentityFields />
        <input name="plate" placeholder="Рег. номер" className={fieldClass} />
      </div>
      <input
        name="vin"
        maxLength={17}
        placeholder="VIN / рама (по избор)"
        className={`${fieldClass} uppercase placeholder:normal-case`}
      />
      <BodyTypePicker />
      <FuelTypePicker />
      <button
        type="submit"
        className="rounded-xl bg-emerald px-4 py-2.5 font-body font-semibold text-ivory transition hover:bg-emerald/90"
      >
        Добави кола
      </button>
    </form>
  );
}
