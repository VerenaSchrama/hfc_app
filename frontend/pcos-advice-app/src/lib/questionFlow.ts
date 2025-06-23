export interface Question {
    key: 'cycle' | 'symptoms' | 'preferences' | 'goals';
    question: string;
    type: 'custom-cycle-phase' | 'multi-select';
    options: string[];
}

export const questions: Question[] = [
    {
        key: 'cycle',
        question: 'In which phase of your cycle are you currently?',
        type: 'custom-cycle-phase',
        options: ['Menstruation', 'Follicular', 'Ovulation', 'Luteal'],
    },
    {
        key: 'symptoms',
        question: 'What symptoms are you experiencing? (multiple options possible)',
        type: 'multi-select',
        options: ['Fatigue', 'Acne', 'Mood swings', 'Cramping', 'Headache', 'Bloating', 'Insulin resistance', 'Irregular cycle'],
    },
    {
        key: 'preferences',
        question: 'What are your dietary preferences? (multiple options possible)',
        type: 'multi-select',
        options: ['Vegetarian', 'Vegan', 'Gluten-free', 'Lactose-free', 'Keto', 'Paleo'],
    },
    {
        key: 'goals',
        question: 'What are your goals? (multiple options possible)',
        type: 'multi-select',
        options: ['More energy', 'Improve skin', 'Lose weight', 'Regulate cycle', 'Less pain', 'Better mood'],
    },
]; 