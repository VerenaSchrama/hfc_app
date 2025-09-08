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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center justify-center">
            <Image src="/Image/HFClogo.png" alt="HerFoodCode Logo" width={40} height={40} className="mr-3" />
            <h1 className="text-2xl font-bold text-gray-900">HerFoodCode</h1>
          </div>
          <p className="text-center text-gray-600 text-sm mt-2">Decode which foods work for you.</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Your Personalized Workbook</h2>
          <p className="text-xl text-gray-600">Track your hormonal mechanisms and personalized interventions</p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white border border-gray-200 rounded-xl p-6 text-center shadow-sm">
            <div className="w-12 h-12 bg-pink-500 rounded-lg flex items-center justify-center mx-auto mb-4 shadow-sm">
              <span className="text-white text-xl">📖</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Dynamic Workbook</h3>
            <p className="text-gray-600 text-sm">Personalized mechanisms and interventions based on your health profile</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-6 text-center shadow-sm">
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mx-auto mb-4 shadow-sm">
              <span className="text-white text-xl">💬</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Assistant</h3>
            <p className="text-gray-600 text-sm">Get personalized advice and answers about your health journey</p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-pink-50 border border-pink-200 rounded-xl p-8 text-center shadow-sm">
          <h3 className="text-2xl font-semibold text-gray-900 mb-4">Ready to start your health journey?</h3>
          <p className="text-gray-600 mb-6">Join thousands of women who have transformed their hormonal health</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <button className="bg-pink-500 hover:bg-pink-600 text-white font-semibold py-3 px-8 rounded-lg transition-colors shadow-sm">
                Get Started
              </button>
            </Link>
            <Link href="/login">
              <button className="border border-pink-500 text-pink-600 font-semibold py-3 px-8 rounded-lg bg-white hover:bg-pink-50 transition-colors shadow-sm">
                Sign In
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
