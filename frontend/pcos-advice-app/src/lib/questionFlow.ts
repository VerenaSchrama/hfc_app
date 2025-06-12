export type QuestionType = 'multi-select' | 'select';

export interface QuestionStep {
    key: keyof import('../types').IntakeInput;
    question: string;
    type: QuestionType;
    options: string[];
}

export const questionFlow: QuestionStep[] = [
    {
        key: 'symptoms',
        question: 'Which symptoms are you experiencing?',
        type: 'multi-select',
        options: [
            'Irregular periods',
            'Acne',
            'Weight gain',
            'Hair loss',
            'Excess hair growth',
            'Mood changes',
            'Fatigue',
        ],
    },
    {
        key: 'preferences',
        question: 'Do you have any dietary preferences?',
        type: 'multi-select',
        options: [
            'Vegetarian',
            'Vegan',
            'Gluten-free',
            'Dairy-free',
            'No preference',
        ],
    },
    {
        key: 'cycle',
        question: 'Which phase of your menstrual cycle are you in?',
        type: 'select',
        options: [
            'I don not have a (regular) cycle',
            'Menstrual',
            'Follicular',
            'Ovulatory',
            'Luteal',
        ],
    },
    {
        key: 'goals',
        question: 'What are your health goals?',
        type: 'multi-select',
        options: [
            'Get my period back',
            'Weight management',
            'Clearer skin',
            'Improved mood',
            'Regular cycles',
            'Increased energy',
        ],
    },
]; 