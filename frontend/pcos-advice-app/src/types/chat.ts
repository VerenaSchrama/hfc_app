export type CyclePhase = 'menstruatie' | 'folliculaire' | 'ovulatie' | 'luteale';

export type Symptom = 
  | 'vermoeidheid'
  | 'acne'
  | 'mood swings'
  | 'krampen'
  | 'hoofdpijn'
  | 'bloating'
  | 'insuline resistentie'
  | 'onregelmatige cyclus';

export type DietaryPreference = 
  | 'vegetarisch'
  | 'veganistisch'
  | 'glutenvrij'
  | 'lactosevrij'
  | 'keto'
  | 'paleo';

export type Goal = 
  | 'meer energie'
  | 'huid verbeteren'
  | 'gewicht verliezen'
  | 'cyclus reguleren'
  | 'minder pijn'
  | 'betere stemming';

export interface UserInput {
  symptoms: Symptom[];
  preferences: DietaryPreference[];
  cycle: CyclePhase;
  goals: Goal[];
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

export interface AdviceResponse {
  answer: string;
}

export interface PhaseAdvice {
  phase: CyclePhase;
  recommendations: {
    category: string;
    items: string[];
  }[];
  tips: string[];
  foodsToAvoid: string[];
} 