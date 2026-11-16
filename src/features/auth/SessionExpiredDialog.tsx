import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import { Dialog, buttonStyles } from "@/components/ui";
import { onSessionExpired } from "./sessionExpired";

/** Session expirée (401 sur une route privée) : une boîte de dialogue, pas un écran blanc. */
export function SessionExpiredDialog() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => onSessionExpired(() => setOpen(true)), []);

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      title="Session expirée"
      description="Reconnectez-vous avec Steam pour continuer. Vos données sont conservées."
    >
      <div className="mt-6 flex justify-end">
        <Link
          to="/login"
          state={{ from: pathname }}
          onClick={() => setOpen(false)}
          className={buttonStyles("primary")}
        >
          Se reconnecter
        </Link>
      </div>
    </Dialog>
  );
}
