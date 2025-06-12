import React from 'react';
import { QuestionStep } from '../lib/questionFlow';

interface ChatStepProps {
    step: QuestionStep;
    value: string[] | string;
    onChange: (value: string[] | string) => void;
}

export default function ChatStep({ step, value, onChange }: ChatStepProps) {
    if (step.type === 'multi-select') {
        return (
            <div>
                <p className="mb-2 font-semibold">{step.question}</p>
                <div className="flex flex-wrap gap-2">
                    {step.options.map(option => (
                        <button
                            key={option}
                            type="button"
                            className={`px-4 py-2 rounded border ${Array.isArray(value) && value.includes(option) ? 'bg-blue-500 text-white' : 'bg-white text-gray-800'}`}
                            onClick={() => {
                                if (!Array.isArray(value)) return;
                                if (value.includes(option)) {
                                    onChange(value.filter(v => v !== option));
                                } else {
                                    onChange([...value, option]);
                                }
                            }}
                        >
                            {option}
                        </button>
                    ))}
                </div>
            </div>
        );
    }
    // single select
    return (
        <div>
            <p className="mb-2 font-semibold">{step.question}</p>
            <select
                className="border rounded px-4 py-2"
                value={typeof value === 'string' ? value : ''}
                onChange={e => onChange(e.target.value)}
            >
                <option value="">Select...</option>
                {step.options.map(option => (
                    <option key={option} value={option}>{option}</option>
                ))}
            </select>
        </div>
    );
} 