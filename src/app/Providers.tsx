import { useState, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { createQueryClient } from "./queryClient";

export function Providers({ children, retry = true }: { children: ReactNode; retry?: boolean }) {
  const [queryClient] = useState(() => createQueryClient({ retry }));
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          classNames: {
            toast:
              "!rounded-xl !border-0 !bg-[rgb(20_22_27/0.96)] !text-[13px] !shadow-[inset_0_0_0_1px_rgb(255_255_255/0.09),0_16px_40px_-12px_rgb(0_0_0/0.8)]",
            actionButton: "!bg-transparent !font-medium !text-[#b4abff]",
          },
        }}
      />
    </QueryClientProvider>
  );
}
