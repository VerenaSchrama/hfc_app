'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../lib/auth';

export default function BottomNav() {
  const { isLoggedIn, loading } = useAuth();
  const pathname = usePathname();
  if (loading || !isLoggedIn) return null;
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
    <nav className="fixed bottom-0 left-0 w-full bg-card border-t border-subtle flex justify-around py-3 z-50 shadow-lg">
      {navItems.map(item => (
        <Link key={item.href} href={item.href} className={`flex flex-col items-center flex-1 py-2 ${isActive(item.href) ? 'text-primary font-semibold' : 'text-muted'}`}> 
          <span className="text-2xl mb-1">{item.icon}</span>
          <span className="text-xs font-medium">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
} 