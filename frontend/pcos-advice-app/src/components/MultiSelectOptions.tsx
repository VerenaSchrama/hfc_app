// src/components/MultiSelectOptions.tsx
'use client';

import { useState } from 'react';

interface MultiSelectOptionsProps {
  options: string[];
  onSubmit: (selected: string[]) => void;
}

export default function MultiSelectOptions({ options, onSubmit }: MultiSelectOptionsProps) {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  const toggleOption = (option: string) => {
    setSelectedOptions((prev) =>
      prev.includes(option)
        ? prev.filter((item) => item !== option)
        : [...prev, option]
    );
  };

  const handleSubmit = () => {
    onSubmit(selectedOptions);
  };

  return (
    <div className="flex flex-col items-center">
      <div className="flex flex-wrap gap-2 justify-center mb-4">
        {options.map((option) => {
          const isSelected = selectedOptions.includes(option);
          return (
            <button
              key={option}
              onClick={() => toggleOption(option)}
              className={`font-semibold px-4 py-2 rounded-lg transition-colors border-2 ${
                isSelected
                  ? 'bg-purple-500 text-white border-purple-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-purple-400'
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
      <button
        onClick={handleSubmit}
        disabled={selectedOptions.length === 0}
        className="bg-purple-600 text-white font-bold px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        Continue
      </button>
    </div>
  );
} 