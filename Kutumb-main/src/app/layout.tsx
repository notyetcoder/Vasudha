

import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { Inter, Noto_Serif_Devanagari } from 'next/font/google';
import PageTransitionWrapper from '@/components/PageTransitionWrapper';

const fontSans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const fontSerif = Noto_Serif_Devanagari({
  subsets: ['latin'],
  variable: '--font-serif',
  weight: ['400', '700']
});

export const metadata: Metadata = {
  title: {
    default: 'वसुधैव कुटुम्बकम् | Community Family Tree',
    template: '%s | वसुधैव कुटुम्बकम्',
  },
  description: 'An interactive family tree platform to connect roots, document heritage, and build a stronger future for the community.',
  keywords: ['family tree', 'genealogy', 'community', 'heritage', 'vasudha', 'kutumbakam'],
   metadataBase: new URL('https://vasudha-connect.web.app'),
   icons: {
    icon: 'https://upload.wikimedia.org/wikipedia/commons/7/7f/Rotating_earth_animated_transparent.gif',
   },
  openGraph: {
    title: 'वसुधैव कुटुम्बकम् | Community Family Tree',
    description: 'Explore and build your family tree within our community network.',
    url: 'https://vasudha-connect.web.app',
    siteName: 'वसुधैव कुटुम्बकम्',
    images: [
      {
        url: 'https://vasudha-connect.web.app/og-image.png', // It's good practice to have an OG image
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
   twitter: {
    card: 'summary_large_image',
    title: 'वसुधैव कुटुम्बकम् | Community Family Tree',
    description: 'Explore and build your family tree within our community network.',
    images: ['https://vasudha-connect.web.app/og-image.png'],
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
          'min-h-screen bg-background font-sans antialiased',
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
