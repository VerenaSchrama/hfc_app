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

// ===== WORKBOOK TYPES =====

export interface Mechanism {
    id: string;
    title: string;
    description: string;
    user_notes?: string;
    confidence_score?: number; // From RAG pipeline
    source?: string;
    created_at: string;
    updated_at: string;
}

export interface Intervention {
    id: string;
    title: string;
    description: string;
    mechanism_id: string; // Links to mechanism
    user_notes?: string;
    is_tracking: boolean;
    tracking_frequency?: 'daily' | 'weekly' | 'as_needed';
    confidence_score?: number; // From RAG pipeline
    source?: string;
    created_at: string;
    updated_at: string;
}

export interface DailyReflection {
    id: string;
    date: string;
    energy_level: number; // 1-10 scale
    mood: number; // 1-10 scale
    symptoms: Record<string, number>; // symptom_name: severity_score
    notes: string;
    interventions_applied: string[]; // Array of intervention IDs
    additional_notes?: string;
    user_notes?: string;
    created_at: string;
    updated_at: string;
}

export interface WorkbookEntry {
    id: string;
    type: 'mechanism' | 'intervention' | 'reflection' | 'insight';
    title: string;
    content: string;
    user_notes?: string;
    source?: 'rag' | 'user' | 'chat' | 'upload';
    tags?: string[];
    created_at: string;
    updated_at: string;
}

export interface ArchiveItem {
    id: string;
    title: string;
    content: string;
    type: 'screenshot' | 'article' | 'text' | 'insight';
    source_url?: string;
    ai_insights?: string;
    suggested_mechanisms?: string[];
    suggested_interventions?: string[];
    tags?: string[];
    created_at: string;
}

export interface WorkbookData {
    mechanisms: Mechanism[];
    interventions: Intervention[];
    reflections: DailyReflection[];
    entries: WorkbookEntry[];
    last_updated: string;
}

export interface UploadData {
    type: 'screenshot' | 'article' | 'text';
    content: string;
    file?: File;
    source_url?: string;
}

export interface ProgressMetrics {
    mechanisms_tracked: number;
    interventions_active: number;
    reflections_this_week: number;
    completion_rate: number; // percentage
} 