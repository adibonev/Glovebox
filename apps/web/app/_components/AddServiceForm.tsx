import { addService } from "../_lib/actions";
import { SERVICE_TYPE_LABELS } from "../_lib/labels";

const fieldClass =
  "rounded-xl border border-white/10 bg-ink/60 px-3 py-2.5 font-body text-sm text-ivory outline-none transition focus:border-copper/60";

/** Add a Service Record (obligation) to the vehicle. Progressive server-action form. */
export function AddServiceForm({ vehicleId }: { vehicleId: string }) {
  return (
    <form
      action={addService}
      className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md sm:flex-row sm:items-center"
    >
      <input type="hidden" name="vehicleId" value={vehicleId} />
      <select name="serviceType" required defaultValue="" className={`${fieldClass} sm:flex-1`}>
        <option value="" disabled>
          Вид услуга…
        </option>
        {Object.entries(SERVICE_TYPE_LABELS).map(([code, label]) => (
          <option key={code} value={code}>
            {label}
          </option>
        ))}
      </select>
      <input type="date" name="expiryDate" required className={fieldClass} />
      <button
        type="submit"
        className="rounded-xl bg-emerald px-4 py-2.5 font-body text-sm font-semibold text-ivory transition hover:bg-emerald/90"
      >
        Добави
      </button>
    </form>
  );
}
