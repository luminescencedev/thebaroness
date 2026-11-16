import { initials } from "@/lib/format";
import { cn } from "./cn";

interface AvatarProps {
  name: string;
  src?: string | null;
  className?: string;
}

/** Avatar de remplacement (initiales) quand avatarUrl est null. */
export function Avatar({ name, src, className }: AvatarProps) {
  if (src) {
    return <img src={src} alt="" className={cn("size-10 rounded-full object-cover", className)} />;
  }
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-border-strong bg-surface-strong text-sm font-semibold text-muted",
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
