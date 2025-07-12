// src/app/strategy_selection/page.tsx
// Trigger redeploy - latest trial period fix
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchStrategies, setStrategyWithTrial } from '../../lib/api';
import { IntakeData, Strategy, TrialPeriodCreate } from '../../types';
import { CheckCircle, Circle, RefreshCw, Flower, Calendar } from 'lucide-react';
import { auth } from '@/lib/auth';
import { setCurrentStrategy } from '@/lib/strategy';

export default function ChooseStrategiesPage() {
  const [recommendedStrategies, setRecommendedStrategies] = useState<Strategy[]>([]);
  const [selectedStrategies, setSelectedStrategies] = useState<Strategy[]>([]);
  const [intakeData, setIntakeData] = useState<IntakeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [trialPeriodType, setTrialPeriodType] = useState<string>("");
  const periodOptions = [
    { label: "14 days", value: "14" },
    { label: "28 days", value: "28" },
    { label: "6 weeks", value: "42" },
    { label: "8 weeks", value: "56" },
    { label: "Customized", value: "custom" },
  ];
  const [trialPeriod, setTrialPeriod] = useState<TrialPeriodCreate>({
    strategy_name: '',
    start_date: '',
    end_date: ''
  });
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
      const isSelected = prev.some(s => getStrategyName(s) === getStrategyName(strategy));
      if (isSelected) {
        // Deselect
        setTrialPeriodType("");
        setTrialPeriod({ strategy_name: '', start_date: '', end_date: '' });
        return [];
      } else {
        // Only one allowed
        const strategyName = getStrategyName(strategy);
        setTrialPeriod(prev => ({ ...prev, strategy_name: strategyName }));
        return [strategy];
      }
    });
  };
  
  const getStrategyName = (s: Strategy | Record<string, unknown>) => {
    return (
      (s as unknown as Record<string, unknown>)['Strategie naam'] ||
      (s as unknown as Record<string, unknown>)['Strategy name'] ||
      (s as unknown as Record<string, unknown>)['strategy_name'] ||
      (s as unknown as Record<string, unknown>)['name'] ||
      (s as unknown as Record<string, unknown>)['id'] ||
      ''
    ) as string;
  };

  const handleContinue = async () => {
    if (selectedStrategies.length === 0) return;
    
    const selectedName = getStrategyName(selectedStrategies[0]);
    setCurrentStrategy(selectedName);
    localStorage.setItem('selectedStrategies', JSON.stringify([selectedName]));
    
    // Save to backend with trial period
    const token = auth.getToken();
    if (token) {
      try {
        // Trial period is required
        if (trialPeriodType && trialPeriod.start_date && trialPeriod.end_date) {
          await setStrategyWithTrial(selectedName, {
            start_date: trialPeriod.start_date,
            end_date: trialPeriod.end_date
          });
        } else {
          alert('Please select a trial period before continuing.');
          return;
        }
      } catch {
        alert('Failed to update your strategy.');
        return;
      }
    }
    
    // Redirect to today page
    router.push('/today');
  };

  const calculateEndDate = (startDate: string, days: number) => {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + days - 1); // -1 because start date counts as day 1
    return end.toISOString().split('T')[0];
  };

  const handleTrialPeriodChange = (field: keyof TrialPeriodCreate, value: string) => {
    setTrialPeriod(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-calculate end date if start date changes and we have a strategy
      if (field === 'start_date' && value && updated.strategy_name) {
        // Default to 28 days (one cycle)
        updated.end_date = calculateEndDate(value, 28);
      }
      
      return updated;
    });
  };

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
                <div className="space-y-1 text-sm text-gray-700">
                  <div className="font-bold text-base mb-1">Your personal overview</div>
                  <div>
                    <span className="font-bold">Cycle phase:</span> {intakeData.cycle || <span className="italic text-gray-400">None provided</span>}
                  </div>
                  <div>
                    <span className="font-bold">Goals:</span> {intakeData.goals && intakeData.goals.length > 0 ? intakeData.goals.join(', ') : <span className="italic text-gray-400">None provided</span>}
                    <span className="ml-2 text-green-600">✔︎</span>
                    <div className="ml-4 text-xs text-gray-500">Note: {intakeData.goals_note || <span className="italic text-gray-400">None provided</span>} <span className="text-green-600">✔︎</span></div>
                  </div>
                  <div>
                    <span className="font-bold">Symptoms:</span> {intakeData.symptoms && intakeData.symptoms.length > 0 ? intakeData.symptoms.join(', ') : <span className="italic text-gray-400">None provided</span>}
                    <span className="ml-2 text-green-600">✔︎</span>
                    <div className="ml-4 text-xs text-gray-500">Note: {intakeData.symptoms_note || <span className="italic text-gray-400">None provided</span>} <span className="text-green-600">✔︎</span></div>
                  </div>
                  <div>
                    <span className="font-bold">Dietary restrictions:</span> {intakeData.dietaryRestrictions && intakeData.dietaryRestrictions.length > 0 ? intakeData.dietaryRestrictions.join(', ') : <span className="italic text-gray-400">None provided</span>}
                    <span className="ml-2 text-green-600">✔︎</span>
                    <div className="ml-4 text-xs text-gray-500">Note: {intakeData.dietaryRestrictions_note || <span className="italic text-gray-400">None provided</span>} <span className="text-green-600">✔︎</span></div>
                  </div>
                  <div>
                    <span className="font-bold">Reason:</span> {intakeData.reason || <span className="italic text-gray-400">None provided</span>}
                  </div>
                  <div>
                    <span className="font-bold">What works:</span> {intakeData.whatWorks || <span className="italic text-gray-400">None provided</span>}
                  </div>
                  <div>
                    <span className="font-bold">Extra thoughts:</span> {intakeData.extraThoughts || <span className="italic text-gray-400">None provided</span>}
                  </div>
                  <div className="pt-2 text-xs text-gray-500"><span className="text-green-600">✔︎</span> is used for recommended strategies</div>
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
          <p className="text-gray-600 mt-2">Based on your intake, we&apos;ve selected these strategies for you.</p>
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
          {recommendedStrategies.map((strategy) => {
            const s = strategy as Strategy;
            const strategyName = getStrategyName(s);
            const isSelected = selectedStrategies.some(sel => {
              const selS = sel as Strategy;
              return (
                getStrategyName(selS) === strategyName
              );
            });

            return (
              <div
                key={strategyName}
                onClick={() => toggleStrategy(strategy)}
                className={`p-5 rounded-lg border-2 cursor-pointer transition-all ${isSelected ? 'border-pink-500 bg-pink-50' : 'border-gray-200 bg-white'}`}
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-lg">{strategyName}</h3>
                  <div className="flex items-center gap-3">
                     <span className="text-xs font-bold text-pink-600 bg-pink-100 px-3 py-1 rounded-full">Recommended</span>
                     {isSelected ? <CheckCircle className="h-6 w-6 text-pink-500" /> : <Circle className="h-6 w-6 text-gray-300" />}
                  </div>
                </div>
                <div className="mt-2">
                    <p className="font-semibold text-sm text-gray-500">Why:</p>
                    <p className="text-sm text-gray-700">{
                      String(
                        (s as unknown as Record<string, unknown>)['Waarom'] ||
                        (s as unknown as Record<string, unknown>)['Why'] ||
                        (s as unknown as Record<string, unknown>)['why'] ||
                        ''
                      )
                    }</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Trial Period Selection */}
        {selectedStrategies.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mt-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-5 w-5 text-pink-500" />
              <h3 className="font-bold text-lg">Set Trial Period</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Choose how long you want to try this strategy.
            </p>
            <div className="flex flex-wrap gap-3 mb-4">
              {periodOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`px-4 py-2 rounded-lg border font-semibold transition-all ${trialPeriodType === opt.value ? 'bg-pink-500 text-white border-pink-500' : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-pink-100'}`}
                  onClick={() => {
                    setTrialPeriodType(opt.value);
                    if (opt.value !== 'custom') {
                      const today = new Date();
                      const start = today.toISOString().split('T')[0];
                      const end = calculateEndDate(start, parseInt(opt.value));
                      setTrialPeriod({
                        ...trialPeriod,
                        start_date: start,
                        end_date: end,
                      });
                    } else {
                      setTrialPeriod({ ...trialPeriod, start_date: '', end_date: '' });
                    }
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {trialPeriodType === 'custom' && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      id="startDate"
                      value={trialPeriod.start_date}
                      onChange={(e) => handleTrialPeriodChange('start_date', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-200"
                    />
                  </div>
                  <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      id="endDate"
                      value={trialPeriod.end_date}
                      onChange={(e) => handleTrialPeriodChange('end_date', e.target.value)}
                      min={trialPeriod.start_date || new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-200"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Continue Button */}
        <div className="text-center mt-8">
            <button
                onClick={handleContinue}
                disabled={selectedStrategies.length === 0 || !trialPeriodType || (trialPeriodType === 'custom' && (!trialPeriod.start_date || !trialPeriod.end_date))}
                className="w-full bg-pink-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-pink-600 disabled:bg-gray-300"
            >
                Confirm Strategy
            </button>
        </div>

      </div>
    </div>
  );
} 