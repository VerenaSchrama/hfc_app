'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../lib/auth';

export default function BottomNav() {
  const { isLoggedIn, loading } = useAuth();
  const pathname = usePathname();
  
  // Don't show on login/register pages
  if (pathname === '/login' || pathname === '/register' || pathname === '/') {
    return null;
  }
  
  // Show loading state if still loading
  if (loading) {
    return (
      <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 flex justify-around py-3 z-[60] shadow-lg">
        <div className="flex items-center justify-center flex-1 py-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
        </div>
      </nav>
    );
  }
  const navItems = [
    { href: '/today', label: 'Today', icon: '📅' },
    { href: '/workbook', label: 'Workbook', icon: '📖' },
    { href: '/recipe', label: 'Recipe', icon: '🍽️' },
    { href: '/profile', label: 'Profile', icon: '👤' },
  ];
  
  const isActive = (href: string) => {
    if (href === '/workbook') {
      return pathname === '/workbook';
    }
    if (href === '/profile') {
      return pathname === '/profile';
    }
    if (href === '/today') {
      return pathname === '/today';
    }
    if (href === '/recipe') {
      return pathname === '/recipe';
    }
    return false;
  };
  
  return (
    <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 flex justify-around py-3 z-[60] shadow-lg">
      {navItems.map(item => (
        <Link key={item.href} href={item.href} className={`flex flex-col items-center flex-1 py-2 ${isActive(item.href) ? 'text-green-600 font-semibold' : 'text-gray-500'}`}> 
          <span className="text-2xl mb-1">{item.icon}</span>
          <span className="text-xs font-medium">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
} 