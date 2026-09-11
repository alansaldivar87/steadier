import type { Metadata, Viewport } from 'next';
import './globals.css';
import './workspace.css';
import { serverLocale } from '@/lib/i18n/server';
import { LanguageProvider } from '@/components/i18n';
export const metadata: Metadata = {
  title: 'Steadier · Our household',
  description: 'One clear next step for your household money.',
  robots: { index: false, follow: false },
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'Steadier', statusBarStyle: 'default' },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#164c3d' };
export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await serverLocale();
  return (
    <html lang={locale}>
      <body>
        <LanguageProvider initialLocale={locale}>{children}</LanguageProvider>
      </body>
    </html>
  );
}
