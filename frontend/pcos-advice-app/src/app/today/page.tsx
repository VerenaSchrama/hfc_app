"use client";
import { useEffect, useState } from 'react';
import { getTrialPeriods, getUserProfile } from '@/lib/api';
import { TrialPeriod, UserProfile } from '@/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

interface StrategyDetails {
  'Strategie naam': string;
  Uitleg: string;
  Waarom: string;
  'Verhelpt klachten bij': string;
  'Praktische tips': string;
  'Bron(nen)': string;
  error?: string;
}

export default function TodayPage() {
  const router = useRouter();
  const { isLoggedIn, loading } = useAuth();
  const [strategy, setStrategy] = useState<StrategyDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [trialPeriod, setTrialPeriod] = useState<TrialPeriod | null>(null);

  useEffect(() => {
    if (!loading && !isLoggedIn) {
      router.push('/login');
    }
  }, [isLoggedIn, loading, router]);

  useEffect(() => {
    const fetchProfileAndData = async () => {
      if (loading || !isLoggedIn) return; // Only fetch if not loading or not logged in
      setError(null);
      try {
        const userProfile: UserProfile = await getUserProfile();
        // Fetch strategy details
        const strategyName = userProfile.current_strategy;
        // Fetch strategy details from profile.strategy_details
        setStrategy(userProfile.strategy_details);
        // Fetch trial period for current strategy
        const periods = await getTrialPeriods();
        const normalize = (s: string) => s?.trim().toLowerCase();
        let active = periods.find((p: TrialPeriod) => normalize(p.strategy_name) === normalize(strategyName) && p.is_active);
        if (!active) {
          active = periods.find((p: TrialPeriod) => p.is_active);
        }
        setTrialPeriod(active || null);
      } catch {
        setError('Failed to load your profile or strategy.');
        setStrategy(null);
      }
    };
    fetchProfileAndData();
  }, [loading, isLoggedIn]); // Add loading and isLoggedIn to dependencies


  if (loading || !isLoggedIn) return null;
  if (error) {
    return <div className="max-w-2xl mx-auto py-10 text-center text-red-500">{error}</div>;
  }
  if (!strategy) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 pb-20">
      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-indigo-500/10"></div>
        <div className="relative bg-white/80 backdrop-blur-sm border-b border-pink-200/50 px-6 py-12 shadow-lg">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
                  <span className="text-white text-2xl">🍽️</span>
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
                    Your Food Strategy
                  </h1>
                  <p className="text-gray-600 text-xl">Personalized tips for your current approach</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-8">

        {/* Strategy Card */}
        <div className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-2xl p-8 mb-8 flex flex-col gap-4 shadow-lg">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-white text-xl">🎯</span>
            </div>
            <div className="font-bold text-2xl text-gray-900">{strategy['Strategie naam']}</div>
          </div>
          <div className="text-gray-700 text-lg leading-relaxed mb-4">{strategy.Uitleg}</div>
          <div className="flex gap-3 flex-wrap mb-4">
            {strategy['Verhelpt klachten bij']?.split(',').map((tag) => (
              <span key={tag} className="bg-gradient-to-r from-pink-100 to-purple-100 text-pink-700 text-sm font-semibold px-4 py-2 rounded-xl border border-pink-200">{tag.trim()}</span>
            ))}
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-pink-200">
            <div className="text-sm text-gray-600 mb-2"><span className="font-semibold">Why:</span> {strategy.Waarom}</div>
            <div className="text-sm text-gray-600"><span className="font-semibold">Sources:</span> {strategy['Bron(nen)']}</div>
          </div>
        </div>

        {trialPeriod && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-pink-200/50 p-8 mb-8">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-xl">📅</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Trial Period</h2>
                  <p className="text-gray-600 mt-1 text-lg">{trialPeriod.start_date} to {trialPeriod.end_date}</p>
                </div>
              </div>
              <span className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 px-4 py-2 rounded-full text-sm font-bold border border-green-200">Active</span>
            </div>
            <div className="flex flex-col sm:flex-row justify-between items-center w-full">
              <div className="flex-1">
                <div className="text-lg text-gray-600 mb-2 sm:mb-0 font-semibold">
                  Successfully applied: 0 days
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Key Tips for Today with Chat Button */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white text-lg">💡</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Key Tips for Today</h2>
          </div>
          <Link href="/chat">
            <button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-xl text-base shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5">
              Chat for more info
            </button>
          </Link>
        </div>

        {/* Practical Tips */}
        <div className="flex flex-col gap-6 mb-8">
          {strategy['Praktische tips']?.split(';').map((tip, i) => (
            <div key={i} className="bg-white/80 backdrop-blur-sm border border-pink-200/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-sm font-bold">{i + 1}</span>
                </div>
                <div className="font-bold text-xl text-gray-900">Tip {i + 1}</div>
              </div>
              <div className="text-gray-700 text-lg leading-relaxed">{tip.trim()}</div>
            </div>
          ))}
        </div>

        {/* Placeholder for recipes and focus */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-pink-200/50 shadow-lg mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white text-lg">🍳</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Quick Recipes</h2>
          </div>
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6 text-center text-yellow-700 font-semibold text-lg">More recipes coming soon!</div>
        </div>

        <div className="bg-gradient-to-r from-orange-50 to-pink-50 border border-orange-200 rounded-2xl p-8 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white text-lg">🎯</span>
            </div>
            <div className="font-bold text-2xl text-gray-900">Today&apos;s Focus</div>
          </div>
          <div className="text-gray-700 text-lg">Personalized focus coming soon!</div>
        </div>
      </div>
    </div>
  );
} 