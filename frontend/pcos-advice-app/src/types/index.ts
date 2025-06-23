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
    symptoms?: string[];
    preferences?: string[];
    goals?: string[];
}

export type MessageType = 'user' | 'bot';

export interface Message {
    id: string;
    type: MessageType;
    text: string;
}

export interface Strategy {
    // Keys as they come from the Python backend
    'Strategie naam': string;
    'Uitleg': string;
    'Waarom': string;
    'Verhelpt klachten bij': string;
    'Bron(nen)': string;
    'Praktische tips': string;
} 