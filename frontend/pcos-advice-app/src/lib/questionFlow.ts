// src/lib/questionFlow.ts
export interface Question {
    key: "cycle" | "symptoms" | "goals" | "dietaryRestrictions" | "whatWorks" | "extraThoughts" | "reason";
    question: string;
    type: 'custom-cycle-phase' | 'multi-select' | 'text';
    options: string[];
    multiple?: boolean;
    allowFreeTextIf?: string;
}

export const questions: Question[] = [
    {
      key: 'reason',
      question: 'In a few key words, what brings you to HerFoodCode?',
      type: 'text',
      options: []
    },
    {
        key: 'goals',
        question: 'What are your exact goals? (multiple options possible)',
        type: 'multi-select',
        options: ['More energy', 'Sleep better', 'Regulate cycle', 'Reduce cramps', 'Clearer skin', 'Improve digestion', 'Other'],
        allowFreeTextIf: 'Other'
    },
    {
      key: 'symptoms',
      question: 'What symptoms are you currently experiencing? (multiple options possible)',
      type: 'multi-select',
      options: ['Fatigue', 'Acne', 'Mood swings', 'Cramping', 'Headache', 'Bloating', 'Insulin resistance', 'Irregular cycle', 'No Cyle', 'Other'],
      allowFreeTextIf: 'Other'
    },
    {
      key: 'dietaryRestrictions',
      question: 'What do you need to consider or avoidwhen it comes to food? (multiple options possible)',
      type: 'multi-select',
      options: ['Vegetarian', 'Vegan', 'Gluten-free', 'Dairy-free', 'Sugar-free', 'FODMAP', 'Other'],
      allowFreeTextIf: 'Other'
    },
    {
      key: 'whatWorks',
      question: 'What do you already know that works for you? (e.g. "Eating more protein helps my focus", "Too much dairy triggers breakouts")',
      type: 'text',
      options: []
    },
    {
        key: 'cycle',
        question: 'In which phase of your cycle are you currently? (multiple options possible)',
        type: 'custom-cycle-phase',
        options: ['Menstruation', 'Follicular', 'Ovulation', 'Luteal'],
    },
    {
      key: 'extraThoughts',
      question: 'Are there any additional thoughts you want to share before I design your decode plan?',
      type: 'text',
      options: []
    }
  ];