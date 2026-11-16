import { useState, type FormEvent } from "react";
import { Button, Field, Input, Textarea } from "@/components/ui";
import { isApiError } from "@/api";
import { TagsInput } from "./TagsInput";
import { validateTracked, type TrackedValues } from "./validation";

interface TrackedFormProps {
  initial?: TrackedValues;
  submitLabel: string;
  pending?: boolean;
  error?: unknown;
  onSubmit: (values: TrackedValues) => void;
  onCancel?: () => void;
}

const empty: TrackedValues = { alias: "", note: "", tags: [] };

export function TrackedForm({
  initial = empty,
  submitLabel,
  pending,
  error,
  onSubmit,
  onCancel,
}: TrackedFormProps) {
  const [values, setValues] = useState<TrackedValues>(initial);
  const [errors, setErrors] = useState<ReturnType<typeof validateTracked>>({});
  const serverMessage = isApiError(error) && error.status === 400 ? error.message : null;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const found = validateTracked(values);
    setErrors(found);
    if (Object.keys(found).length === 0) onSubmit(values);
  };

  return (
    <form onSubmit={submit} noValidate className="mt-5 space-y-4">
      <Field label="Alias" error={errors.alias} hint="Facultatif, 80 caractères maximum.">
        {(p) => (
          <Input
            {...p}
            value={values.alias}
            onChange={(e) => setValues({ ...values, alias: e.target.value })}
          />
        )}
      </Field>
      <Field label="Note" error={errors.note} hint="Facultatif, 1000 caractères maximum.">
        {(p) => (
          <Textarea
            {...p}
            value={values.note}
            onChange={(e) => setValues({ ...values, note: e.target.value })}
          />
        )}
      </Field>
      <Field label="Tags" error={errors.tags} hint="10 maximum, 24 caractères chacun.">
        {(p) => (
          <TagsInput
            id={p.id}
            invalid={p.invalid}
            aria-describedby={p["aria-describedby"]}
            value={values.tags}
            onChange={(tags) => setValues({ ...values, tags })}
          />
        )}
      </Field>
      {serverMessage && (
        <p role="alert" className="text-[13px] text-loss">
          {serverMessage}
        </p>
      )}
      <div className="flex justify-end gap-2 pt-1">
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            Annuler
          </Button>
        )}
        <Button type="submit" loading={pending}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
