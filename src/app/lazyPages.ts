import { lazy } from "react";

// Une page par chunk : le bundle initial reste léger.
export const HomePage = lazy(() =>
  import("@/pages/HomePage").then((m) => ({ default: m.HomePage })),
);
export const LoginPage = lazy(() =>
  import("@/pages/LoginPage").then((m) => ({ default: m.LoginPage })),
);
export const NotFoundPage = lazy(() =>
  import("@/pages/NotFoundPage").then((m) => ({ default: m.NotFoundPage })),
);
export const PlayerPage = lazy(() =>
  import("@/pages/PlayerPage").then((m) => ({ default: m.PlayerPage })),
);
export const SearchPage = lazy(() =>
  import("@/pages/SearchPage").then((m) => ({ default: m.SearchPage })),
);
export const TrackedDetailPage = lazy(() =>
  import("@/pages/TrackedDetailPage").then((m) => ({ default: m.TrackedDetailPage })),
);
export const TrackedPage = lazy(() =>
  import("@/pages/TrackedPage").then((m) => ({ default: m.TrackedPage })),
);
export const AuthCallbackPage = lazy(() =>
  import("@/pages/AuthCallbackPage").then((m) => ({ default: m.AuthCallbackPage })),
);
export const HeroesPage = lazy(() =>
  import("@/pages/HeroesPage").then((m) => ({ default: m.HeroesPage })),
);
export const HeroPage = lazy(() =>
  import("@/pages/HeroPage").then((m) => ({ default: m.HeroPage })),
);
export const LeaderboardPage = lazy(() =>
  import("@/pages/LeaderboardPage").then((m) => ({ default: m.LeaderboardPage })),
);
export const MatchPage = lazy(() =>
  import("@/pages/MatchPage").then((m) => ({ default: m.MatchPage })),
);
