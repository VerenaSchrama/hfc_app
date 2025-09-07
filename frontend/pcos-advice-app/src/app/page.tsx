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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-subtle">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-center">
            <Image src="/Image/HFClogo.png" alt="HerFoodCode Logo" width={40} height={40} className="mr-3" />
            <h1 className="text-2xl font-bold text-foreground">HerFoodCode</h1>
          </div>
          <p className="text-center text-text-muted text-sm mt-2">Decode which foods work for you.</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-foreground mb-4">Your Personalized Workbook</h2>
          <p className="text-xl text-text-light">Track your hormonal mechanisms and personalized interventions</p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="bg-card border border-subtle rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-xl">📖</span>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Dynamic Workbook</h3>
            <p className="text-text-muted text-sm">Personalized mechanisms and interventions based on your health profile</p>
          </div>
          <div className="bg-card border border-subtle rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-xl">💬</span>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">AI Assistant</h3>
            <p className="text-text-muted text-sm">Get personalized advice and answers about your health journey</p>
          </div>
          <div className="bg-card border border-subtle rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-xl">📊</span>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Progress Tracking</h3>
            <p className="text-text-muted text-sm">Monitor your daily reflections and intervention effectiveness</p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-accent border border-accent-border rounded-xl p-8 text-center">
          <h3 className="text-2xl font-semibold text-foreground mb-4">Ready to start your health journey?</h3>
          <p className="text-text-light mb-6">Join thousands of women who have transformed their hormonal health</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <button className="bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-8 rounded-lg transition-colors">
                Get Started
              </button>
            </Link>
            <Link href="/login">
              <button className="border border-primary text-primary font-semibold py-3 px-8 rounded-lg bg-card hover:bg-accent transition-colors">
                Sign In
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
