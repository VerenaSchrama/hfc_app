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

export interface TrialPeriod {
    id: number;
    strategy_name: string;
    start_date: string;
    end_date: string;
    is_active: boolean;
    created_at: string;
}

export interface TrialPeriodCreate {
    strategy_name: string;
    start_date: string;
    end_date: string;
}

export interface UserProfile {
    current_strategy: string;
    strategy_details: {
        'Strategie naam': string;
        Uitleg: string;
        Waarom: string;
        'Verhelpt klachten bij': string;
        'Praktische tips': string;
        'Bron(nen)': string;
    };
    goals?: string[];
    symptoms?: string[];
    currentStrategy?: {
        name: string;
    };
}

export interface Log {
    date: string;
    symptoms?: string[];
    notes?: string;
    strategy_applied?: boolean;
    energy?: number;
    mood?: number;
    symptom_scores?: Record<string, number>;
    extra_symptoms?: string;
    extra_notes?: string;
    applied_strategy?: boolean; // Keep for backward compatibility
} 