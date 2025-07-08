// src/app/layout.tsx
import './globals.css';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'HerFoodCode',
  description: 'Decode which foods work for you and your cycle',
};

function Header() {
  return (
    <header className="w-full flex flex-col items-center py-6 bg-white border-b border-gray-100 mb-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-pink-500 text-3xl">🍃</span>
        <span className="text-2xl font-bold text-gray-900">HerFoodCode</span>
      </div>
      <div className="text-gray-600 text-md">Decode which foods work for you and your cycle</div>
    </header>
  );
}

function BottomNav() {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const navItems = [
    { href: '/profile', label: 'Profile', icon: '��' },
    { href: '/today', label: 'Today', icon: '📅' },
    { href: '/chat', label: 'Chat', icon: '💬' },
    { href: '/community', label: 'Community', icon: '👥' },
    { href: '/track', label: 'Track', icon: '📊' },
  ];
  return (
    <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 flex justify-around py-2 z-50 shadow-md">
      {navItems.map(item => (
        <Link key={item.href} href={item.href} className={`flex flex-col items-center flex-1 py-1 ${pathname.startsWith(item.href) ? 'text-pink-600 font-bold' : 'text-gray-500'}`}> 
          <span className="text-2xl">{item.icon}</span>
          <span className="text-xs mt-1">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}

export default function RootLayout({ children }: React.PropsWithChildren) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-pink-50 min-h-screen flex flex-col`}>
        <Header />
        <main className="flex-1 w-full max-w-3xl mx-auto px-2 pb-24">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}