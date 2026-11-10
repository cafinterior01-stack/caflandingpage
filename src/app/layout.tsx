import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'CAF Interiors | Your Comfortability Is Our Priority',
  description:
    'CAF Interiors — Luxury Interior Design and Bespoke Furniture. Your Comfortability Is Our Priority. We create beautiful, functional, and inspiring spaces through exceptional furniture, thoughtful interior design, and quality craftsmanship.',
  keywords: [
    'CAF Interiors',
    'Luxury Interior Design',
    'Bespoke Furniture',
    'Interior Decoration Nigeria',
    'Custom Furniture',
    'Luxury Living Spaces',
  ],
  openGraph: {
    title: 'CAF Interiors | Your Comfortability Is Our Priority',
    description:
      'Luxury Interior Design and Bespoke Furniture. Transforming everyday spaces into timeless sanctuaries of comfort and sophistication.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0a0a0a',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${jakarta.variable}`}>
      <body>{children}</body>
    </html>
  );
}
