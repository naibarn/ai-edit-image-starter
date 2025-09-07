"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster({ ...props }: React.ComponentProps<typeof Sonner>) {
  return (
    <Sonner
      theme="system"
      duration={3000}
      toastOptions={{ classNames: { toast: "rounded-2xl shadow-lg" } }}
      {...props}
    />
  );
}
