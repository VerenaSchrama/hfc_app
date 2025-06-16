import { UserInput, AdviceResponse } from '../types/chat';

const API_BASE_URL = 'http://localhost:8000';

export async function getAdvice(input: UserInput): Promise<AdviceResponse> {
  const response = await fetch(`${API_BASE_URL}/advice`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error('Failed to get advice');
  }

  return response.json();
} 