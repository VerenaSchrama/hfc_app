// src/app/strategy_overview/[strategyName]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { fetchStrategyDetails } from '../../../lib/api';
import { Strategy } from '../../../types';
import { ArrowLeft, Heart, Target, BookOpen } from 'lucide-react';
import Link from 'next/link';

const SYMPTOM_TAGS = ['bloating', 'constipation', 'acne', 'fatigue', 'headaches', 'anxiety', 'irregular cycles', 'pms', 'stressklachten', 'slaapproblemen', 'stemmingswisselingen', 'laag energieniveau'];


export default function StrategyDetailPage() {
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [loading, setLoading] = useState(true);
  const params = useParams();
  const strategyName = params.strategyName as string;

  useEffect(() => {
    if (!strategyName) return;

    const loadStrategyDetails = async () => {
      try {
        const decodedName = decodeURIComponent(strategyName);
        const details = await fetchStrategyDetails(decodedName);
        setStrategy(details);
      } catch (error) {
        console.error("Failed to load strategy details", error);
        // Optionally, redirect to a 404 page or show an error message
      } finally {
        setLoading(false);
      }
    };

    loadStrategyDetails();
  }, [strategyName]);

  if (loading) {
    return <div className="text-center p-12">Loading strategy...</div>;
  }

  if (!strategy) {
    return <div className="text-center p-12">Strategy not found.</div>;
  }

  // Handle different possible property names for tips, sources, etc.
  // For multilingual/dynamic property access, use:
  // @ts-ignore
  const tipsRaw = (strategy as any)['Practical tips'] || (strategy as any)['practical_tips'] || (strategy as any)['Praktische tips'] || '';
  const tips = tipsRaw
    .split(/•|\*|-/)
    .map((tip: string) => tip.trim())
    .filter(Boolean);
  // @ts-ignore
  const sourcesRaw = (strategy as any)['Sources'] || (strategy as any)['sources'] || (strategy as any)['Bron(nen)'] || '';
  const sources = sourcesRaw
    .split(';')
    .map((s: string) => s.trim())
    .filter(Boolean);
  // @ts-ignore
  const helpsWithRaw = (strategy as any)['Solves symptoms for'] || (strategy as any)['helps_with'] || (strategy as any)['Verhelpt klachten bij'] || '';
  const helpsWithTags = helpsWithRaw
    .split(',')
    .map((s: string) => s.trim().toLowerCase())
    .filter(Boolean);

  const goalTags = helpsWithTags.filter((t: string) => !SYMPTOM_TAGS.includes(t));
  const symptomTags = helpsWithTags.filter((t: string) => SYMPTOM_TAGS.includes(t));


  return (
    <div className="min-h-screen bg-white py-8 px-4">
      <div className="max-w-3xl mx-auto">
        
        <Link href="/strategy_selection" className="inline-flex items-center gap-2 text-pink-600 font-semibold mb-6 hover:underline">
            <ArrowLeft size={16} /> Terug naar strategieën
        </Link>

        <div className="text-center mb-6">
            {/* @ts-ignore */}
            <h1 className="text-4xl font-bold">{(strategy as any)['Strategy name'] || (strategy as any)['strategy_name'] || (strategy as any)['Strategie naam']}</h1>
            <span className="mt-2 inline-block text-xs font-bold text-white bg-pink-500 px-3 py-1 rounded-full">Aanbevolen strategie</span>
        </div>

        {/* What to do */}
        <div className="bg-pink-50/60 p-6 rounded-lg mb-4 flex items-start gap-4">
            <div className="bg-pink-500 p-2 rounded-full mt-1">
                <Target className="h-6 w-6 text-white" />
            </div>
            <div>
                <h3 className="font-bold text-lg">Wat ga je doen?</h3>
                {/* @ts-ignore */}
                <p className="text-gray-700">{(strategy as any)['Explanation'] || (strategy as any)['explanation'] || (strategy as any)['Uitleg']}</p>
            </div>
        </div>

         {/* Why it works */}
        <div className="bg-white border border-gray-200 p-6 rounded-lg mb-4 flex items-start gap-4">
            <div className="bg-purple-100 p-2 rounded-full mt-1">
                <Heart className="h-6 w-6 text-purple-600" />
            </div>
            <div>
                <h3 className="font-bold text-lg">Waarom werkt dit?</h3>
                {/* @ts-ignore */}
                <p className="text-gray-700">{(strategy as any)['Why'] || (strategy as any)['why'] || (strategy as any)['Waarom']}</p>
            </div>
        </div>

        {/* This helps with */}
        <div className="bg-white border border-gray-200 p-6 rounded-lg mb-4">
            <h3 className="font-bold text-lg mb-4">Dit helpt bij</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <h4 className="font-semibold text-sm mb-2 text-gray-600">Klachten</h4>
                    <div className="flex flex-wrap gap-2">
                       {symptomTags.map((tag: string) => (
                            <span key={tag} className="capitalize text-xs text-blue-800 bg-blue-100 px-3 py-1 rounded-full">{tag}</span>
                        ))}
                    </div>
                </div>
                <div>
                    <h4 className="font-semibold text-sm mb-2 text-gray-600">Doelen</h4>
                     <div className="flex flex-wrap gap-2">
                        {goalTags.map((tag: string) => (
                            <span key={tag} className="capitalize text-xs text-green-800 bg-green-100 px-3 py-1 rounded-full">{tag}</span>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        {/* Practical Tips */}
         <div className="bg-teal-50/70 p-6 rounded-lg mb-4">
            <h3 className="font-bold text-lg mb-4">Praktische tips</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
                {tips.map((tip: string, i: number) => (
                    <li key={i}>{tip}</li>
                ))}
            </ul>
        </div>

        {/* Scientific Sources */}
        <div className="bg-white border border-gray-200 p-6 rounded-lg">
            <h3 className="font-bold text-lg mb-4">Wetenschappelijke bronnen</h3>
            <div className="space-y-2">
                {sources.map((source: string, i: number) => (
                     <a key={i} href="#" className="flex items-center gap-2 text-sm text-gray-600 hover:text-pink-600 transition-colors">
                        <BookOpen size={14} /> {source}
                    </a>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
} 