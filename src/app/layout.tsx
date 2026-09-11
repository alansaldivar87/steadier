import type { Metadata, Viewport } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'Steadier · Our household',
  description: 'One clear next step for your household money.',
  robots: { index: false, follow: false },
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'Steadier', statusBarStyle: 'default' },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#164c3d' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
