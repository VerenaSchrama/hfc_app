import React from 'react';
import { AdviceResponse } from '../types';

interface PhaseAdviceTableProps {
    advice: AdviceResponse;
}

const phaseOrder = ['Menstrual', 'Follicular', 'Ovulatory', 'Luteal'];

export default function PhaseAdviceTable({ advice }: PhaseAdviceTableProps) {
    return (
        <div className="overflow-x-auto">
            {phaseOrder.map(phase => (
                advice[phase] && (
                    <div key={phase} className="mb-8">
                        <h2 className="text-xl font-bold mb-2">{phase} Phase</h2>
                        <table className="min-w-full border border-gray-300">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="px-4 py-2 border">Food</th>
                                    <th className="px-4 py-2 border">Reason</th>
                                </tr>
                            </thead>
                            <tbody>
                                {advice[phase].map((item, idx) => (
                                    <tr key={idx}>
                                        <td className="px-4 py-2 border">{item.food}</td>
                                        <td className="px-4 py-2 border">{item.reason}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )
            ))}
        </div>
    );
} 