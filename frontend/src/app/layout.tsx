import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import Script from 'next/script';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body
        className="min-h-screen bg-background text-foreground antialiased"
        suppressHydrationWarning
      >
        {/* Clean attributes injected by extensions (e.g., ap-style) before React hydrates */}
        <Script id="pre-hydration-clean" strategy="beforeInteractive">
          {`try {
            const clean = (el) => {
              if (!el) return;
              for (const a of Array.from(el.attributes)) {
                if (/^ap-/.test(a.name)) el.removeAttribute(a.name);
              }
            };
            clean(document.documentElement);
            clean(document.body);
          } catch (e) { /* noop */ }`}
        </Script>
        {children}
      </body>
    </html>
  );
}