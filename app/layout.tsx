import './globals.css';
import { Inter } from 'next/font/google';
import { Providers } from '@/components/providers';
import type { Metadata, Viewport } from 'next'; // Import Viewport type

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

// The metadata object remains for SEO and application info
export const metadata: Metadata = {
  title: 'Electrical Code AI | ECAI',
  description:
    'Instant, verifiable answers to the California Electrical Code for professional electricians.',
  keywords: ['Electrical Code', 'NEC', 'CEC', 'Electrician Tool', 'Code Compliance', 'GFCI'],
  applicationName: 'ECAI',
};

// CRITICAL FIX: The viewport and themeColor are now exported separately
// This is the modern, correct way for Next.js 14+
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#2563EB', // Blue-600
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className={`${inter.variable} h-full font-sans bg-gray-100 text-gray-800 antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
