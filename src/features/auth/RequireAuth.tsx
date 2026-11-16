import { Navigate, Outlet, useLocation } from "react-router";
import { useSession } from "./useSession";

/** Route privée : sans session, redirige vers /login en gardant la destination. */
export function RequireAuth() {
  const session = useSession();
  const location = useLocation();
  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}
