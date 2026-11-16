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
                  className="pressable -mr-1 ml-0.5 rounded-full px-1 text-subtle hover-text"
                >
                  ×
                </button>
              </Tag>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
