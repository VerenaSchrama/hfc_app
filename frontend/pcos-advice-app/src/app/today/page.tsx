"use client";
import { useEffect, useState } from 'react';
import { getCurrentStrategy } from '@/lib/strategy';
import Link from 'next/link';

interface StrategyDetails {
  'Strategie naam': string;
  Uitleg: string;
  Waarom: string;
  'Verhelpt klachten bij': string;
  'Praktische tips': string;
  'Bron(nen)': string;
  error?: string;
}

const tips = [
  {
    title: 'Morning Protein Power',
    level: 'Easy',
    description: 'Start your day with 20–30g of protein to stabilize blood sugar and reduce afternoon cravings.',
    tags: ['Breakfast'],
  },
  {
    title: 'Hydration with Electrolytes',
    level: 'Easy',
    description: 'Add a pinch of sea salt to your water to support adrenal function and energy levels.',
    tags: ['Hydration'],
  },
  {
    title: 'Anti-Inflammatory Spices',
    level: 'Moderate',
    description: 'Include turmeric, ginger, and cinnamon in your meals to reduce inflammation naturally.',
    tags: ['Cooking'],
  },
];

const recipes = [
  { title: 'Hormone Balance Smoothie', time: '5 min', desc: 'Spinach, avocado, berries, protein powder' },
  { title: 'Golden Milk Latte', time: '3 min', desc: 'Turmeric, coconut milk, honey, cinnamon' },
  { title: 'Seed Cycling Energy Balls', time: '15 min', desc: 'Pumpkin seeds, flax seeds, dates, almond butter' },
];

const BACKEND_URL = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  ? 'http://127.0.0.1:8000'
  : '';

export default function TodayPage() {
  const [strategy, setStrategy] = useState<StrategyDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStrategy = async () => {
      const name = getCurrentStrategy() || 'Bloedsuiker in balans';
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${BACKEND_URL}/api/v1/strategies/${encodeURIComponent(name)}`);
        const data = await res.json();
        if (data.error) {
          setError('Strategy not found. Please select a valid strategy.');
          setStrategy(null);
        } else {
          setStrategy(data);
        }
      } catch (e) {
        setError('Failed to load strategy. Please check your connection or try again later.');
        setStrategy(null);
      }
      setLoading(false);
    };
    fetchStrategy();
  }, []);

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
        <div className="font-bold text-gray-900 mb-1">Today's Focus</div>
        <div className="text-gray-700 mb-2">Personalized focus coming soon!</div>
      </div>
    </div>
  );
} 