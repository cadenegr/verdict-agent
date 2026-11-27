import { useId } from "react";

interface RadioGroupProps<T extends string> {
  /** Visible group title. */
  label: string;
  value: T;
  options: ReadonlyArray<{ value: T; label: string }>;
  onChange: (value: T) => void;
}

/** A choice of a few options, shown as large tappable rows. */
export function RadioGroup<T extends string>({
  label,
  value,
  options,
  onChange,
}: RadioGroupProps<T>) {
  const name = useId();

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-3 text-lg font-semibold">{label}</legend>
      {options.map((option) => (
        <label
          key={option.value}
          className="flex min-h-tap cursor-pointer items-center gap-4 rounded-control border-2 border-line bg-surface px-4 hover:bg-raised has-checked:border-brand has-checked:bg-raised"
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className="size-6 shrink-0 accent-brand"
          />
          <span>{option.label}</span>
        </label>
      ))}
    </fieldset>
  );
}
