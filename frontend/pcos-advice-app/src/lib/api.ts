// src/lib/api.ts
import { IntakeData, Strategy, AdviceResponse, UserProfile, TrialPeriod, Log, Mechanism, Intervention, DailyReflection, ArchiveItem, WorkbookData } from '../types';
import { auth } from "./auth";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL
  ? process.env.NEXT_PUBLIC_API_URL
  : 'http://127.0.0.1:8000';

export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const token = auth.getValidToken();
    if (!token) {
        throw new Error('Authentication required. Please log in again.');
    }
    
    const response = await fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            'Authorization': `Bearer ${token}`,
        },
    });
    
    // Handle authentication errors globally
    auth.handleApiError(response);
    
    if (!response.ok) {
        const errorBody = await response.text();
        console.error("Failed to fetch with auth:", response.status, errorBody);
        
        if (response.status === 401) {
            throw new Error('Authentication expired. Please log in again.');
        }
        
        throw new Error(`Request failed: ${response.status}`);
    }
    return response.json();
};

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

// ===== WORKBOOK API FUNCTIONS =====

export async function generateWorkbook(intakeData: IntakeData): Promise<{success: boolean, workbook: WorkbookData, message: string}> {
  const token = auth.getToken();
  const url = `${API_BASE_URL}/api/v1/workbook/generate`;
  console.log('generateWorkbook - URL:', url);
  console.log('generateWorkbook - Token:', token ? 'exists' : 'missing');
  console.log('generateWorkbook - Intake data:', intakeData);
  
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(intakeData),
  });
  
  console.log('generateWorkbook - Response status:', res.status);
  console.log('generateWorkbook - Response ok:', res.ok);
  
  if (!res.ok) {
    const errorText = await res.text();
    console.error('generateWorkbook - Error response:', errorText);
    throw new Error(`Failed to generate workbook: ${res.status} ${errorText}`);
  }
  
  const result = await res.json();
  console.log('generateWorkbook - Success result:', result);
  return result;
}

export async function getWorkbook(): Promise<{success: boolean, workbook: WorkbookData}> {
  const token = auth.getToken();
  console.log('getWorkbook - Making request to:', `${API_BASE_URL}/api/v1/workbook`);
  console.log('getWorkbook - Token exists:', !!token);
  
  const res = await fetch(`${API_BASE_URL}/api/v1/workbook`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  
  console.log('getWorkbook - Response status:', res.status, res.statusText);
  
  if (!res.ok) {
    const errorText = await res.text();
    console.error('getWorkbook - Error response:', errorText);
    throw new Error(`Failed to fetch workbook: ${res.status} - ${errorText}`);
  }
  
  const data = await res.json();
  console.log('getWorkbook - Success response:', data);
  return data;
}

export async function createMechanism(mechanismData: Partial<Mechanism>): Promise<{success: boolean, mechanism: Mechanism, message: string}> {
  const token = auth.getToken();
  const res = await fetch(`${API_BASE_URL}/api/v1/workbook/mechanisms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(mechanismData),
  });
  if (!res.ok) throw new Error('Failed to create mechanism');
  return res.json();
}

export async function updateMechanism(mechanismId: string, mechanismData: Partial<Mechanism>): Promise<{success: boolean, message: string}> {
  const token = auth.getToken();
  const res = await fetch(`${API_BASE_URL}/api/v1/workbook/mechanisms/${mechanismId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(mechanismData),
  });
  if (!res.ok) throw new Error('Failed to update mechanism');
  return res.json();
}

export async function createIntervention(interventionData: Partial<Intervention>): Promise<{success: boolean, intervention: Intervention, message: string}> {
  const token = auth.getToken();
  const res = await fetch(`${API_BASE_URL}/api/v1/workbook/interventions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(interventionData),
  });
  if (!res.ok) throw new Error('Failed to create intervention');
  return res.json();
}

export async function updateIntervention(interventionId: string, interventionData: Partial<Intervention>): Promise<{success: boolean, message: string}> {
  const token = auth.getToken();
  const res = await fetch(`${API_BASE_URL}/api/v1/workbook/interventions/${interventionId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(interventionData),
  });
  if (!res.ok) throw new Error('Failed to update intervention');
  return res.json();
}

export async function createReflection(reflectionData: Partial<DailyReflection>): Promise<{success: boolean, reflection: DailyReflection, message: string}> {
  const token = auth.getToken();
  const res = await fetch(`${API_BASE_URL}/api/v1/workbook/reflections`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(reflectionData),
  });
  if (!res.ok) throw new Error('Failed to create reflection');
  return res.json();
}

export async function getArchive(): Promise<{success: boolean, archive: ArchiveItem[]}> {
  const token = auth.getToken();
  const res = await fetch(`${API_BASE_URL}/api/v1/workbook/archive`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch archive');
  return res.json();
}

// ===== NEW USER FLOW API FUNCTIONS =====

export async function activateIntervention(interventionId: string): Promise<{success: boolean, message: string, intervention: Intervention, mechanism: Mechanism}> {
  const token = auth.getToken();
  const res = await fetch(`${API_BASE_URL}/api/v1/workbook/interventions/${interventionId}/activate`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to activate intervention');
  return res.json();
}

export async function archiveIntervention(interventionId: string): Promise<{success: boolean, message: string, intervention: Intervention, mechanism: Mechanism}> {
  const token = auth.getToken();
  const res = await fetch(`${API_BASE_URL}/api/v1/workbook/interventions/${interventionId}/archive`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to archive intervention');
  return res.json();
}

export async function getActiveWorkbook(): Promise<{success: boolean, workbook: WorkbookData}> {
  const token = auth.getToken();
  const res = await fetch(`${API_BASE_URL}/api/v1/workbook/active`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch active workbook');
  return res.json();
}

export async function getSuggestedWorkbook(): Promise<{success: boolean, workbook: WorkbookData}> {
  const token = auth.getToken();
  const res = await fetch(`${API_BASE_URL}/api/v1/workbook/suggested`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch suggested workbook');
  return res.json();
}

export async function completeIntervention(interventionId: string, trialData: {start_date: string, end_date: string, notes?: string}): Promise<{success: boolean, message: string, intervention: Intervention, mechanism: Mechanism, trial_period: {id: number, strategy_name: string, start_date: string, end_date: string, notes: string}}> {
  const token = auth.getToken();
  const res = await fetch(`${API_BASE_URL}/api/v1/workbook/interventions/${interventionId}/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(trialData),
  });
  if (!res.ok) throw new Error('Failed to complete intervention');
  return res.json();
}

export async function getCompletedWorkbook(): Promise<{success: boolean, workbook: {interventions: Intervention[], trial_periods: Record<string, {id: number, strategy_name: string, start_date: string, end_date: string, notes: string}>, last_updated: string}}> {
  const token = auth.getToken();
  const res = await fetch(`${API_BASE_URL}/api/v1/workbook/completed`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch completed workbook');
  return res.json();
} 