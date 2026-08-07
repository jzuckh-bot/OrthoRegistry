import type { ChangeEvent, FocusEvent, Ref } from "react";
import type { FieldError } from "react-hook-form";
import { cn } from "@/lib/utils";

type Option<T extends string | number> = { value: T; label?: string; hint?: string };
type Registration = {
  name: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => unknown;
  onBlur: (event: FocusEvent<HTMLInputElement>) => unknown;
  ref: Ref<HTMLInputElement>;
};

export function SelectionCards<T extends string | number>({
  label,
  options,
  registration,
  selected,
  error,
  columns = 2,
}: {
  label: string;
  options: Option<T>[];
  registration: Registration;
  selected: T | undefined;
  error?: FieldError;
  columns?: 2 | 3;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold">{label}</legend>
      <div className={cn("mt-3 grid gap-2", columns === 3 ? "grid-cols-3" : "grid-cols-2")}>
        {options.map(({ value, label: optionLabel, hint }) => (
          <label key={value} className={cn(
            "relative flex min-h-14 cursor-pointer flex-col justify-center rounded-2xl border px-3 py-3 text-center transition active:scale-[.98]",
            selected === value ? "border-primary bg-primary text-white shadow-md shadow-primary/20" : "bg-card hover:border-primary/40",
          )}>
            <input className="sr-only" type="radio" value={value} {...registration} />
            <span className="text-sm font-semibold">{optionLabel ?? value}</span>
            {hint && <span className={cn("mt-0.5 text-xs", selected === value ? "text-white/75" : "text-muted")}>{hint}</span>}
          </label>
        ))}
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error.message}</p>}
    </fieldset>
  );
}
