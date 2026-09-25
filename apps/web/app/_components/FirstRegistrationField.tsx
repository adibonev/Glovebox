const fieldClass =
  "rounded-xl border border-white/10 bg-ink/60 px-4 py-2.5 font-body text-ivory outline-none transition focus:border-copper/60";

/**
 * Date of first registration, field (B) of the registration certificate. Optional: with it the
 * app knows when the statutory Roadworthiness Inspections fall due for a car under five years old.
 */
export function FirstRegistrationField({ value }: { value?: string | null }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-body text-sm text-muted">
        Дата на първа регистрация <span className="text-dim">· по избор, поле (B) на талона</span>
      </span>
      <input type="date" name="firstRegistration" defaultValue={value ?? ""} className={fieldClass} />
    </label>
  );
}
