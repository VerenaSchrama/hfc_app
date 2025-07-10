// src/lib/api.ts
import { IntakeData, Strategy, AdviceResponse, UserProfile, TrialPeriod, Log } from '../types';
import { auth } from "./auth";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1` : 'http://127.0.0.1:8000/api/v1';

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

export async function fetchChatAnswer(question: string): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/advice`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ question }),
  });
  if (!response.ok) {
    const errorBody = await response.text();
    console.error('Failed to fetch chat answer:', response.status, errorBody);
    throw new Error('Failed to fetch chat answer');
  }
  const data = await response.json();
  return data.answer;
}

export async function fetchChatHistoryAndSend(question: string, token: string): Promise<{history: {sender: string, text: string, timestamp: string}[]}> {
  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ question }),
  });
  if (!response.ok) {
    const errorBody = await response.text();
    console.error('Failed to fetch chat history:', response.status, errorBody);
    throw new Error('Failed to fetch chat history');
  }
  return response.json();
} 

export async function getTrackedSymptoms(): Promise<string[]> {
  const token = auth.getToken();
  const res = await fetch(`${API_BASE_URL}/symptoms`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch symptoms');
  return res.json();
}

export async function setTrackedSymptoms(symptoms: string[]): Promise<void> {
  const token = auth.getToken();
  const res = await fetch(`${API_BASE_URL}/symptoms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(symptoms),
  });
  if (!res.ok) throw new Error('Failed to set symptoms');
}

export async function getTodayLog(): Promise<Log | null> {
  const token = auth.getToken();
  const res = await fetch(`${API_BASE_URL}/logs/today`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch today log');
  return res.json();
}

export async function upsertTodayLog(logData: Partial<Log>): Promise<void> {
  const token = auth.getToken();
  const res = await fetch(`${API_BASE_URL}/logs/today`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(logData),
  });
  if (!res.ok) throw new Error('Failed to save today log');
}

export async function getLogs(params?: { start?: string, end?: string }): Promise<Log[]> {
  const token = auth.getToken();
  let url = `${API_BASE_URL}/logs`;
  if (params && (params.start || params.end)) {
    const q = [];
    if (params.start) q.push(`start=${encodeURIComponent(params.start)}`);
    if (params.end) q.push(`end=${encodeURIComponent(params.end)}`);
    url += `?${q.join('&')}`;
  }
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch logs');
  return res.json();
}

export async function patchLog(date: string, logData: Partial<Log>): Promise<void> {
  const token = auth.getToken();
  const res = await fetch(`${API_BASE_URL}/logs/${date}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(logData),
  });
  if (!res.ok) throw new Error('Failed to update log');
}

// --- Trial Period API Functions ---
export async function getTrialPeriods(): Promise<TrialPeriod[]> {
  const token = auth.getToken();
  const res = await fetch(`${API_BASE_URL}/trial_periods`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch trial periods');
  return res.json();
}

export async function createTrialPeriod(trialData: { strategy_name: string, start_date: string, end_date: string }): Promise<TrialPeriod> {
  const token = auth.getToken();
  const res = await fetch(`${API_BASE_URL}/trial_periods`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(trialData),
  });
  if (!res.ok) throw new Error('Failed to create trial period');
  return res.json();
}

export async function setStrategyWithTrial(strategyName: string, trialPeriod?: { start_date: string, end_date: string }): Promise<void> {
  const token = auth.getToken();
  const data: { strategy_name: string; trial_period?: { start_date: string; end_date: string } } = { strategy_name: strategyName };
  if (trialPeriod) {
    data.trial_period = trialPeriod;
  }
  
  const res = await fetch(`${API_BASE_URL}/set_strategy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to set strategy');
} 

export async function getUserProfile(): Promise<UserProfile> {
  const token = auth.getToken();
  const res = await fetch(`${API_BASE_URL}/profile`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch user profile');
  return res.json();
} 