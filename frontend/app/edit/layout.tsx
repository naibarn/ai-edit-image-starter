import type { ReactNode } from 'react';
import { Toaster } from '@/components/ui/sonner';
import '../globals.css';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-background text-foreground">
        <header className="border-b">
          <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
            <div className="font-semibold">AI Image Studio</div>
            <nav className="text-sm text-muted-foreground">/edit</nav>
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-6 py-6">
          {children}
        </div>

        {/* shadcn + sonner toaster */}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
