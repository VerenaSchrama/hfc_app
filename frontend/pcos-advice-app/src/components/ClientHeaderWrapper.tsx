'use client';
import { usePathname } from 'next/navigation';
import Header from './Header';
import BottomNav from './BottomNav';
 
export default function ClientHeaderWrapper() {
  const pathname = usePathname();
  
  // Pages that don't need header or bottom nav
  const noNavPages = ['/login', '/register', '/'];
  
  if (noNavPages.includes(pathname)) {
    return null;
  }
  
  return (
    <>
      <Header />
      <BottomNav />
    </>
  );
} 