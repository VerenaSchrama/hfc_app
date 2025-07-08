// src/types/index.ts
export type UserInput = {
    symptoms: string[];
    preferences: string[];
    cycle: string;
    goals: string[];
};

export type AdviceResponse = {
    answer: string;
};

export type ChatMessage = {
    id: string;
    type: 'question' | 'answer';
    content: string;
    options?: string[];
};

export interface IntakeData {
    cycle?: string;
  
    reason?: string;
  
    goals?: string[];
    goals_note?: string;
  
    symptoms?: string[];
    symptoms_note?: string;
  
    dietaryRestrictions?: string[];
    dietaryRestrictions_note?: string;
  
    whatWorks?: string;
  
    extraThoughts?: string;
  }

export type MessageType = 'user' | 'bot';

export interface Message {
    id: string;
    type: MessageType;
    text: string;
}

export interface Strategy {
    // Keys as they come from the Python backend
    'Strategy name': string;
    'Explanation': string;
    'Why': string;
    'Solves symptoms for': string;
    'Sources': string;
    'Practical tips': string;
} 