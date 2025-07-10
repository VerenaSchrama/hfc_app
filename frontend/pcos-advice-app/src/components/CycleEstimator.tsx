// src/components/CycleEstimator.tsx
'use client';

import { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface CycleEstimatorProps {
  onComplete: (phase: string) => void;
}

export const CycleEstimator: React.FC<CycleEstimatorProps> = ({ onComplete }) => {
  const [menstruation1, setMenstruation1] = useState<Date | null>(null);
  const [menstruation2, setMenstruation2] = useState<Date | null>(null);
  const [error, setError] = useState('');

  const calculateCyclePhase = () => {
    if (!menstruation1 || !menstruation2) {
      setError('Please fill in both dates to continue.');
      return;
    }

    const cycleLength = Math.round((menstruation1.getTime() - menstruation2.getTime()) / (1000 * 60 * 60 * 24));
    const daysSinceLast = Math.round((new Date().getTime() - menstruation1.getTime()) / (1000 * 60 * 60 * 24));
    const dayInCycle = daysSinceLast % cycleLength;

    let phase = 'menstrual';
    if (dayInCycle >= 6 && dayInCycle <= 13) phase = 'follicular';
    else if (dayInCycle >= 14 && dayInCycle <= 16) phase = 'ovulatory';
    else if (dayInCycle >= 17) phase = 'luteal';

    onComplete(phase);
  };
  
  const handleSkip = () => {
    onComplete('menstruation'); // Default to menstruation if skipped
  };

  return (
    <div className="space-y-4 text-center p-4 border rounded-lg bg-gray-50">
      <p className="font-semibold">Let's estimate your cycle phase.</p>
      <p>Please enter your two most recent menstruation start dates:</p>
      <div className="flex justify-center gap-4">
        <DatePicker selected={menstruation2} onChange={(date: Date | null) => setMenstruation2(date)} placeholderText="First date" className="p-2 border rounded-md w-full" />
        <DatePicker selected={menstruation1} onChange={(date: Date | null) => setMenstruation1(date)} placeholderText="Most recent date" className="p-2 border rounded-md w-full"/>
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div className="flex justify-center gap-4 pt-2">
        <button onClick={calculateCyclePhase} className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
          Estimate My Phase
        </button>
        <button onClick={handleSkip} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors">
                      I don&apos;t know
        </button>
      </div>
    </div>
  );
};

export default CycleEstimator; 