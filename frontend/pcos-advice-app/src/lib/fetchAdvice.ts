import { IntakeInput, AdviceResponse } from '../types';

export async function fetchAdvice(intake: IntakeInput): Promise<AdviceResponse> {
    const res = await fetch('/api/get-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(intake),
    });
    if (!res.ok) {
        throw new Error('Failed to fetch advice');
    }
    return res.json();
} 