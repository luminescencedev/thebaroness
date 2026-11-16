import { Navigate, createBrowserRouter, createMemoryRouter, type RouteObject } from "react-router";
import { RequireAuth } from "@/features/auth/RequireAuth";
import { HomePage } from "@/pages/HomePage";
import { LoginPage } from "@/pages/LoginPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { PlayerPage } from "@/pages/PlayerPage";
import { AuthCallbackPage } from "@/pages/AuthCallbackPage";
import { SearchPage } from "@/pages/SearchPage";
import { TrackedDetailPage } from "@/pages/TrackedDetailPage";
import { TrackedPage } from "@/pages/TrackedPage";
import { RootLayout } from "./RootLayout";

export const routes: RouteObject[] = [
  {
    element: <RootLayout />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/search", element: <SearchPage /> },
      { path: "/players/:steamId", element: <PlayerPage /> },
      { path: "/login", element: <LoginPage /> },
      { path: "/auth/callback", element: <AuthCallbackPage /> },
      { path: "/register", element: <Navigate to="/login" replace /> },
      {
        element: <RequireAuth />,
        children: [
          { path: "/tracked", element: <TrackedPage /> },
          { path: "/tracked/:id", element: <TrackedDetailPage /> },
        ],
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
];

export const createAppRouter = () => createBrowserRouter(routes);
export const createTestRouter = (initialEntries: string[]) =>
  createMemoryRouter(routes, { initialEntries });
