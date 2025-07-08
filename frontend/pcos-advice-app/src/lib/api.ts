// src/lib/api.ts
import { IntakeData, Strategy, AdviceResponse } from '../types';

const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

// src/lib/fetchAdvice.ts
export async function fetchAdvice(intake: IntakeData): Promise<AdviceResponse> {
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

export async function fetchStrategies(input: IntakeData): Promise<Strategy[]> {
  const response = await fetch(`${API_BASE_URL}/strategies`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("Failed to fetch strategies:", response.status, errorBody);
    throw new Error('Failed to fetch strategies');
  }

  const data = await response.json();
  return data.strategies || [];
}

export async function fetchStrategyDetails(strategyName: string): Promise<Strategy> {
  const response = await fetch(`${API_BASE_URL}/strategies/${encodeURIComponent(strategyName)}`);

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`Failed to fetch details for strategy ${strategyName}:`, response.status, errorBody);
    throw new Error(`Failed to fetch details for strategy ${strategyName}`);
  }

  return response.json();
} 