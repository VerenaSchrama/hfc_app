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