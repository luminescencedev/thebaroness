import { useEffect, useRef, useState, type ComponentProps } from "react";
import { cn } from "@/components/ui";

/** Apparition à l'entrée dans la fenêtre. Sans IntersectionObserver, le contenu est visible d'emblée. */
export function Reveal({
  delay = 0,
  className,
  style,
  ...props
}: ComponentProps<"div"> & { delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(typeof IntersectionObserver === "undefined");

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      data-visible={visible}
      style={{ ["--reveal-delay" as string]: `${delay}ms`, ...style }}
      className={cn("reveal", className)}
      {...props}
    />
  );
}
