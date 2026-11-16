import { render } from "@testing-library/react";
import { RouterProvider } from "react-router/dom";
import { Providers } from "@/app/Providers";
import { createTestRouter } from "@/app/router";

/** Rend l'application complète sur une route donnée (routeur en mémoire). */
export function renderApp(route = "/") {
  const router = createTestRouter([route]);
  const utils = render(
    <Providers retry={false}>
      <RouterProvider router={router} />
    </Providers>,
  );
  return { ...utils, router };
}
