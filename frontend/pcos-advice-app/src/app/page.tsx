// src/app/page.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const { isLoggedIn, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoggedIn && !loading) {
      router.push('/workbook');
    }
  }, [isLoggedIn, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isLoggedIn) {
    return null; // Will redirect to workbook
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-background px-4">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-lg border border-subtle p-8 flex flex-col items-center">
        <div className="mb-8">
          <Image src="/Image/HFClogo.png" alt="HerFoodCode Logo" width={80} height={80} className="mx-auto" />
        </div>
        <h1 className="text-4xl font-bold text-foreground mb-3 text-center">HerFoodCode</h1>
        <p className="text-lg text-secondary font-medium mb-8 text-center">Your Personalized Food Digital Workbook</p>
        <div className="bg-primary-light bg-opacity-10 border border-primary rounded-lg p-6 mb-8 text-center">
          <p className="text-base text-foreground leading-relaxed">
            Track your hormonal health journey with personalized mechanisms, interventions, and daily reflections.
          </p>
        </div>
        <div className="flex flex-col gap-4 w-full">
          <Link href="/register">
            <button className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-6 rounded-lg transition-colors text-lg shadow-sm">
              Start Your Journey
            </button>
          </Link>
          <Link href="/login">
            <button className="w-full border border-primary text-primary font-semibold py-3 px-6 rounded-lg bg-card hover:bg-primary hover:bg-opacity-5 transition-colors text-lg shadow-sm">
              Welcome Back
            </button>
          </Link>
        </div>
      </div>
      <div className="flex justify-center gap-8 mt-12">
        <div className="flex flex-col items-center">
          <span className="bg-primary-light bg-opacity-20 text-primary rounded-full p-4 mb-3 text-2xl">📖</span>
          <span className="text-sm text-secondary font-medium">Dynamic Workbook</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="bg-primary-light bg-opacity-20 text-primary rounded-full p-4 mb-3 text-2xl">💬</span>
          <span className="text-sm text-secondary font-medium">AI Chat</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="bg-primary-light bg-opacity-20 text-primary rounded-full p-4 mb-3 text-2xl">📊</span>
          <span className="text-sm text-secondary font-medium">Track Progress</span>
        </div>
      </div>
    </div>
  );
}
