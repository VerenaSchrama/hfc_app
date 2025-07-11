'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function BottomNav() {
  const { isLoggedIn, loading } = useAuth();
  const pathname = usePathname();
  if (loading || !isLoggedIn) return null;
  const navItems = [
    { href: '/profile', label: 'Profile', icon: '👤' },
    { href: '/today', label: 'Today', icon: '📅' },
    { href: '/chat', label: 'Chat', icon: '💬' },
    { href: '/community', label: 'Community', icon: '👥' },
    { href: '/track', label: 'Track', icon: '📊' },
  ];
  
  const isActive = (href: string) => {
    if (href === '/profile') {
      return pathname === '/profile';
    }
    if (href === '/today') {
      return pathname === '/today';
    }
    if (href === '/chat') {
      return pathname === '/chat';
    }
    if (href === '/community') {
      return pathname === '/community';
    }
    if (href === '/track') {
      return pathname === '/track';
    }
    return false;
  };
  
  return (
    <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 flex justify-around py-2 z-50 shadow-md">
      {navItems.map(item => (
        <Link key={item.href} href={item.href} className={`flex flex-col items-center flex-1 py-1 ${isActive(item.href) ? 'text-pink-600 font-bold' : 'text-gray-500'}`}> 
          <span className="text-2xl">{item.icon}</span>
          <span className="text-xs mt-1">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
} 