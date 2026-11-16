import { useState, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { createQueryClient } from "./queryClient";

export function Providers({ children, retry = true }: { children: ReactNode; retry?: boolean }) {
  const [queryClient] = useState(() => createQueryClient({ retry }));
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster theme="dark" position="bottom-right" />
    </QueryClientProvider>
  );
}
