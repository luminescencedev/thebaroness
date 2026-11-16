import { Link } from "react-router";
import { useDocumentTitle } from "@/app/useDocumentTitle";
import { BrandMark } from "@/components/brand";
import { buttonStyles } from "@/components/ui";

export function NotFoundPage() {
  useDocumentTitle("Page introuvable");
  return (
    <div className="card relative mx-auto flex max-w-xl flex-col items-center gap-3 overflow-hidden px-6 py-16 text-center">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_0%,rgb(91_75_240/0.2),transparent_70%)]"
      />
      <div className="relative">
        <BrandMark size={88} />
      </div>
      <p
        aria-hidden="true"
        className="relative bg-gradient-to-b from-white to-[#3a3f4a] bg-clip-text text-[56px] leading-none font-semibold tracking-[-0.045em] text-transparent"
      >
        404
      </p>
      <h1 className="relative text-base font-medium tracking-[-0.01em]">Page introuvable</h1>
      <p className="relative text-[13px] text-muted">
        Cette page n&apos;existe pas, ou ne vous appartient pas.
      </p>
      <Link to="/" className={`${buttonStyles("secondary")} relative mt-2`}>
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
