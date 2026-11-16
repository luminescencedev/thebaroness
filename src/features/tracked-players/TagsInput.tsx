import { useState } from "react";
import { Input, Tag } from "@/components/ui";

interface TagsInputProps {
  id: string;
  value: string[];
  onChange: (tags: string[]) => void;
  invalid?: boolean;
  "aria-describedby"?: string;
}

/** Saisie de tags : Entrée ou virgule pour ajouter, bouton pour retirer. */
export function TagsInput({ id, value, onChange, invalid, ...aria }: TagsInputProps) {
  const [draft, setDraft] = useState("");

  const commit = () => {
    const tag = draft.trim();
    setDraft("");
    if (tag && !value.includes(tag)) onChange([...value, tag]);
  };

  return (
    <div className="space-y-2">
      <Input
        id={id}
        value={draft}
        invalid={invalid}
        placeholder="Ajouter un tag, puis Entrée"
        onChange={(e) => {
          if (e.target.value.endsWith(",")) {
            setDraft(e.target.value.slice(0, -1));
            commit();
          } else setDraft(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          }
        }}
        onBlur={commit}
        {...aria}
      />
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label="Tags">
          {value.map((tag) => (
            <li key={tag}>
              <Tag>
                {tag}
                <button
                  type="button"
                  aria-label={`Retirer le tag ${tag}`}
                  onClick={() => onChange(value.filter((t) => t !== tag))}
                  className="icon-btn pressable -mr-1.5 ml-0.5 grid size-6 place-items-center rounded-full text-subtle"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    aria-hidden="true"
                    className="size-2.5"
                  >
                    <path d="m6 6 12 12M18 6 6 18" />
                  </svg>
                </button>
              </Tag>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
