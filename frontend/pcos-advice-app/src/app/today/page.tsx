"use client";
import { useEffect, useState } from 'react';
import { getTrialPeriods, getUserProfile } from '@/lib/api';
import { TrialPeriod, UserProfile } from '@/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/auth';

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
  const [strategy, setStrategy] = useState<StrategyDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trialPeriod, setTrialPeriod] = useState<TrialPeriod | null>(null);
  const [currentDay, setCurrentDay] = useState(0);

  useEffect(() => {
    if (!auth.isLoggedIn()) {
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    const fetchProfileAndData = async () => {
      setLoading(true);
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
      setLoading(false);
    };
    fetchProfileAndData();
  }, []);

  useEffect(() => {
    // Fetch logs for progress bar
    const fetchLogs = async () => {
      if (trialPeriod) {
        const today = new Date();
        const start = new Date(trialPeriod.start_date);
        setCurrentDay(Math.max(1, Math.min(
          Math.floor((today.getTime() - start.getTime()) / (1000*60*60*24)) + 1,
          Math.floor((new Date(trialPeriod.end_date).getTime() - start.getTime()) / (1000*60*60*24)) + 1
        )));
      }
    };
    fetchLogs();
  }, [trialPeriod]);

  if (loading) {
    return <div className="max-w-2xl mx-auto py-10 text-center text-gray-500">Loading your strategy...</div>;
  }
  if (error) {
    return <div className="max-w-2xl mx-auto py-10 text-center text-red-500">{error}</div>;
  }
  if (!strategy) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto py-6">
      <h1 className="text-2xl font-bold text-center mb-1 text-gray-900">Your Food Strategy</h1>
      <div className="text-center text-olive-700 mb-6">Personalized tips for your current approach</div>

      {/* Strategy Card */}
      <div className="bg-green-50 border border-green-100 rounded-xl p-5 mb-6 flex flex-col gap-2 shadow-sm">
        <div className="flex justify-between items-center mb-1">
          <div className="font-bold text-lg text-gray-800">{strategy['Strategie naam']}</div>
        </div>
        <div className="text-gray-700 mb-2">{strategy.Uitleg}</div>
        <div className="flex gap-2 flex-wrap mb-2">
          {strategy['Verhelpt klachten bij']?.split(',').map((tag) => (
            <span key={tag} className="bg-gray-100 text-gray-700 text-xs font-semibold px-3 py-1 rounded-full">{tag.trim()}</span>
          ))}
        </div>
        <div className="text-sm text-gray-500">Why: {strategy.Waarom}</div>
        <div className="text-sm text-gray-500">Sources: {strategy['Bron(nen)']}</div>
      </div>

      {trialPeriod && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Trial Period</h2>
              <p className="text-gray-600 mt-1">{trialPeriod.start_date} to {trialPeriod.end_date}</p>
            </div>
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">Active</span>
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-center w-full">
            <div className="flex-1">
              <div className="text-sm text-gray-500 mb-1">
                Day {currentDay} of {Math.floor((new Date(trialPeriod.end_date).getTime() - new Date(trialPeriod.start_date).getTime()) / (1000*60*60*24)) + 1}
              </div>
              {/* Progress Bar */}
              <div className="w-full h-3 bg-pink-100 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-pink-400 transition-all duration-300"
                  style={{ width: `${Math.round((currentDay / (Math.floor((new Date(trialPeriod.end_date).getTime() - new Date(trialPeriod.start_date).getTime()) / (1000*60*60*24)) + 1)) * 100)}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-400 mb-2">Progress through your strategy period</div>
              <div className="text-sm text-gray-500 mb-2 sm:mb-0">
                Successfully applied: 0 days
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Key Tips for Today with Chat Button */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold text-gray-900">Key Tips for Today</h2>
        <Link href="/chat">
          <button className="border border-pink-500 text-pink-600 font-bold py-2 px-5 rounded-lg text-base shadow-sm transition-colors hover:bg-pink-50">
            Chat for more info
          </button>
        </Link>
      </div>

      {/* Practical Tips */}
      <div className="flex flex-col gap-4 mb-6">
        {strategy['Praktische tips']?.split(';').map((tip, i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
            <div className="font-semibold text-gray-900 mb-1">Tip {i + 1}</div>
            <div className="text-gray-700">{tip.trim()}</div>
          </div>
        ))}
      </div>

      {/* Placeholder for recipes and focus */}
      <h2 className="text-lg font-semibold text-gray-900 mb-2">Quick Recipes</h2>
      <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 text-center text-yellow-700 font-medium mb-6">More recipes coming soon!</div>

      <div className="bg-orange-50 border border-orange-100 rounded-xl p-5 mt-8 shadow-sm">
        <div className="font-bold text-gray-900 mb-1">Today&apos;s Focus</div>
        <div className="text-gray-700 mb-2">Personalized focus coming soon!</div>
      </div>
    </div>
  );
} 