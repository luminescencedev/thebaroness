import { Navigate, createBrowserRouter, createMemoryRouter, type RouteObject } from "react-router";
import { RequireAuth } from "@/features/auth/RequireAuth";
import {
  AuthCallbackPage,
  GroupDetailPage,
  GroupsPage,
  HeroesPage,
  HeroPage,
  HomePage,
  LeaderboardPage,
  MatchPage,
  LoginPage,
  NotFoundPage,
  PlayerPage,
  SearchPage,
  TrackedDetailPage,
  TrackedPage,
} from "./lazyPages";
import { RootLayout } from "./RootLayout";

export const routes: RouteObject[] = [
  {
    element: <RootLayout />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/search", element: <SearchPage /> },
      { path: "/players/:steamId", element: <PlayerPage /> },
      { path: "/heroes", element: <HeroesPage /> },
      { path: "/heroes/:heroId", element: <HeroPage /> },
      { path: "/leaderboard", element: <LeaderboardPage /> },
      { path: "/matches/:matchId", element: <MatchPage /> },
      { path: "/login", element: <LoginPage /> },
      { path: "/auth/callback", element: <AuthCallbackPage /> },
      { path: "/register", element: <Navigate to="/login" replace /> },
      {
        element: <RequireAuth />,
        children: [
          { path: "/tracked", element: <TrackedPage /> },
          { path: "/tracked/:id", element: <TrackedDetailPage /> },
          { path: "/groups", element: <GroupsPage /> },
          { path: "/groups/:id", element: <GroupDetailPage /> },
        ],
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
];

export const createAppRouter = () => createBrowserRouter(routes);
export const createTestRouter = (initialEntries: string[]) =>
  createMemoryRouter(routes, { initialEntries });
