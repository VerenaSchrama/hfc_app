// src/app/layout.tsx
import './globals.css';
import { Inter } from 'next/font/google';
import React from 'react';
import BottomNav from '../components/BottomNav';
import Header from '../components/Header';
import { usePathname } from 'next/navigation';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'HerFoodCode',
  description: 'Decode which foods work for you',
};

export default function RootLayout({ children }: React.PropsWithChildren) {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  // If using SSR, fallback to rendering header everywhere
  const showHeader = pathname !== '/';
  return (
    <html lang="en">
      <body className={`${inter.className} bg-pink-50 min-h-screen flex flex-col`}>
        {showHeader && <Header />}
        <main className="flex-1 w-full max-w-3xl mx-auto px-2 pb-24">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}