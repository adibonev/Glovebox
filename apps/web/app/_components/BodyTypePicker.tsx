import { BODY_TYPES, BODY_TYPE_LABELS, type BodyType } from "../_lib/bodyType";

/**
 * Body type chooser: pure-CSS radio chips (name="bodyType") showing each silhouette,
 * so the picked type drives the car image on the dashboard/garage. No client JS.
 */
export function BodyTypePicker({ value = "sedan" }: { value?: BodyType }) {
  return (
    <fieldset>
      <legend className="mb-2 font-mono text-[11px] uppercase tracking-[0.18em] text-dim">
        Тип каросерия
      </legend>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {BODY_TYPES.map((type) => (
          <label key={type} className="cursor-pointer">
            <input
              type="radio"
              name="bodyType"
              value={type}
              defaultChecked={type === value}
              className="peer sr-only"
            />
            <span className="flex flex-col items-center gap-1 rounded-xl border border-white/10 bg-ink/40 px-1.5 py-2 text-muted transition hover:border-white/25 peer-checked:border-copper/60 peer-checked:bg-copper/[0.08] peer-checked:text-copper">
              <img
                src={`/cars/${type}.webp`}
                alt=""
                aria-hidden
                draggable={false}
                className="h-8 w-auto max-w-full select-none object-contain"
              />
              <span className="font-body text-[11px] leading-none">{BODY_TYPE_LABELS[type]}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
