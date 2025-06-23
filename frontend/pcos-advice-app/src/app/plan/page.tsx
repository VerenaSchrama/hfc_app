'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchStrategies } from '../../lib/api';
import { IntakeData, Strategy } from '../../types';
import { CheckCircle, Circle, RefreshCw, Flower, ChevronDown } from 'lucide-react';

export default function ChooseStrategiesPage() {
  const [recommendedStrategies, setRecommendedStrategies] = useState<Strategy[]>([]);
  const [selectedStrategies, setSelectedStrategies] = useState<Strategy[]>([]);
  const [intakeData, setIntakeData] = useState<IntakeData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const intakeString = localStorage.getItem('intakeData');
    if (!intakeString) {
      router.push('/intake');
      return;
    }
    const data = JSON.parse(intakeString);
    setIntakeData(data);

    const loadStrategies = async () => {
      try {
        const fetchedStrategies = await fetchStrategies(data);
        setRecommendedStrategies(fetchedStrategies);
        setSelectedStrategies([]); // Start with none selected
      } catch (error) {
        console.error("Failed to load strategies", error);
      } finally {
        setLoading(false);
      }
    };
    loadStrategies();
  }, [router]);

  const toggleStrategy = (strategy: Strategy) => {
    setSelectedStrategies(prev => {
      const isSelected = prev.some(s => s['Strategie naam'] === strategy['Strategie naam']);
      if (isSelected) {
        // Deselect
        return prev.filter(s => s['Strategie naam'] !== strategy['Strategie naam']);
      } else {
        // Select, but only if less than 3
        if (prev.length < 3) {
          return [...prev, strategy];
        } else {
          return prev; // Do nothing if already 3 selected
        }
      }
    });
  };
  
  const handleContinue = () => {
    const selectedNames = selectedStrategies.map(s => s['Strategie naam']);
    localStorage.setItem('selectedStrategies', JSON.stringify(selectedNames));
    if (selectedNames.length > 0) {
      router.push(`/plan/${encodeURIComponent(selectedNames[0])}`);
    }
  }

  if (loading) {
    return <div className="text-center p-12">Loading your recommended strategies...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Top Summary Card */}
        {intakeData && (
          <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 mb-8">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Flower className="h-8 w-8 text-pink-500" />
                <div>
                  <p className="font-bold capitalize">{intakeData.cycle || 'No Cycle'}</p>
                  <p className="text-sm text-gray-500 capitalize">
                    { [...(intakeData.symptoms || []), ...(intakeData.goals || [])].join(', ')}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => { localStorage.clear(); router.push('/intake'); }} 
                className="flex items-center gap-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg"
              >
                <RefreshCw size={14} /> Restart
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold">Choose your strategies</h1>
          <p className="text-gray-600 mt-2">Based on your intake, we've selected these strategies for you.</p>
          <p className="font-bold text-pink-500 mt-1">Choose up to 3 to start with.</p>
        </div>

        {/* Selected Counter */}
        <div className="text-center mb-6">
          <span className="bg-gray-200 text-gray-800 font-semibold px-4 py-2 rounded-full">
            {selectedStrategies.length} / 3 selected
          </span>
        </div>

        {/* Strategies */}
        <div className="space-y-4">
          {recommendedStrategies.map(strategy => {
            const isSelected = selectedStrategies.some(s => s['Strategie naam'] === strategy['Strategie naam']);
            return (
              <div
                key={strategy['Strategie naam']}
                onClick={() => toggleStrategy(strategy)}
                className={`p-5 rounded-lg border-2 cursor-pointer transition-all ${isSelected ? 'border-pink-500 bg-pink-50' : 'border-gray-200 bg-white'}`}
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-lg">{strategy['Strategie naam']}</h3>
                  <div className="flex items-center gap-3">
                     <span className="text-xs font-bold text-pink-600 bg-pink-100 px-3 py-1 rounded-full">Recommended</span>
                     {isSelected ? <CheckCircle className="h-6 w-6 text-pink-500" /> : <Circle className="h-6 w-6 text-gray-300" />}
                  </div>
                </div>
                <div className="mt-2">
                    <p className="font-semibold text-sm text-gray-500">Why:</p>
                    <p className="text-sm text-gray-700">{strategy['Waarom']}</p>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Continue Button */}
        <div className="text-center mt-8">
            <button
                onClick={handleContinue}
                disabled={selectedStrategies.length === 0}
                className="w-full bg-pink-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-pink-600 disabled:bg-gray-300"
            >
                Continue
            </button>
        </div>

      </div>
    </div>
  );
} 