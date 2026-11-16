import type { ReactNode, SVGProps } from "react";

/** Jeu d'icônes du shell : trait 1.75, arrondi, 24x24. */
function Icon({ children, ...props }: SVGProps<SVGSVGElement> & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="size-[17px] flex-none"
      {...props}
    >
      {children}
    </svg>
  );
}
type P = SVGProps<SVGSVGElement>;

export const HomeIcon = (p: P) => (
  <Icon {...p}>
    <path d="M4 11 12 4l8 7M6 9.5V20h12V9.5" />
  </Icon>
);
export const SearchIcon = (p: P) => (
  <Icon {...p}>
    <circle cx="10.7" cy="10.7" r="6.6" />
    <path d="m15.5 15.5 4.8 4.8" />
  </Icon>
);
export const PersonIcon = (p: P) => (
  <Icon {...p}>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5 20c.4-4 2.8-6 7-6s6.6 2 7 6" />
  </Icon>
);
export const SparkIcon = (p: P) => (
  <Icon {...p}>
    <path d="m12 2 2.6 7.4L22 12l-7.4 2.6L12 22l-2.6-7.4L2 12l7.4-2.6L12 2Z" />
  </Icon>
);
export const ChartIcon = (p: P) => (
  <Icon {...p}>
    <path d="M3 20.5h18M3.5 18V4" />
    <path d="m6 16 4.2-5.5 3.2 2.7L20 6" />
  </Icon>
);
export const BookmarkIcon = (p: P) => (
  <Icon {...p}>
    <path d="M6 3.8h12v16.8l-6-4.3-6 4.3V3.8Z" />
  </Icon>
);
export const UsersIcon = (p: P) => (
  <Icon {...p}>
    <circle cx="8.7" cy="8.1" r="3" />
    <path d="M2.8 19c.7-3.1 2.9-5 5.9-5s5.2 1.9 5.9 5" />
    <path d="M15 5.5a3 3 0 0 1 0 5.8M17.3 14.3c2.1.4 3.5 2.1 3.9 4.7" />
  </Icon>
);
export const MenuIcon = ({ className, ...p }: P) => (
  <Icon {...p} className={`size-5 ${className ?? ""}`}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Icon>
);
export const ChevronIcon = ({ className, ...p }: P) => (
  <Icon {...p} className={`size-3.5 flex-none ${className ?? ""}`}>
    <path d="m7 10 5 5 5-5" />
  </Icon>
);
export const SlashIcon = ({ className, ...p }: P) => (
  <Icon {...p} className={`size-3.5 flex-none text-[#4b4d54] ${className ?? ""}`}>
    <path d="m9 5 7 7-7 7" />
  </Icon>
);
