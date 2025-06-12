import { UserInput, AdviceResponse } from '../types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function getAdvice(userInput: UserInput): Promise<string> {
    try {
        const response = await fetch(`${API_URL}/advice`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userInput),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: AdviceResponse = await response.json();
        return data.answer;
    } catch (error) {
        console.error('Error fetching advice:', error);
        throw new Error('Failed to get advice. Please try again later.');
    }
} 