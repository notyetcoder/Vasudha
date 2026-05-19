import type { Metadata, Viewport } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { Inter, Noto_Serif_Devanagari } from 'next/font/google';
import PageTransitionWrapper from '@/components/PageTransitionWrapper';

const fontSans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const fontSerif = Noto_Serif_Devanagari({
  subsets: ['latin'],
  variable: '--font-serif',
  weight: ['400', '700'],
  display: 'swap',
});

export const viewport: Viewport = {
  // Correct viewport for mobile — prevents iOS zoom on input focus
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // Theme color for browser chrome (Android status bar)
  themeColor: [
    { media: '(prefers-color-scheme: dark)',  color: '#0a0a0f' },
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
  ],
};

export const metadata: Metadata = {
  title: {
    default: 'Vasudha Connect | Community Family Tree',
    template: '%s | Vasudha Connect',
  },
  description: 'An interactive family tree for the community. Find your roots, explore family connections, and discover how everyone is related.',
  keywords: ['family tree', 'genealogy', 'Gujarati community', 'kutumb', 'vasudha', 'family connections'],
  metadataBase: new URL('https://vasu-dha.vercel.app'),
  icons: {
    icon: '/favicon.ico',
  },
  // PWA-like manifest hints
  applicationName: 'Vasudha Connect',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Vasudha',
  },
  formatDetection: {
    telephone: false, // Prevent iOS from linkifying phone-like numbers in content
  },
  openGraph: {
    title: 'Vasudha Connect | Community Family Tree',
    description: 'Explore and build your family tree within our community network.',
    url: 'https://vasu-dha.vercel.app',
    siteName: 'Vasudha Connect',
    locale: 'en_IN',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased overflow-x-hidden',
          fontSans.variable,
          fontSerif.variable
        )}
      >
        <div className="relative flex min-h-dvh flex-col">
          <PageTransitionWrapper>
            {children}
          </PageTransitionWrapper>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
