import { IntakeInput } from '../types';

export function validateInput(input: IntakeInput): boolean {
    if (!input.symptoms.length) return false;
    if (!input.preferences.length) return false;
    if (!input.cycle) return false;
    if (!input.goals.length) return false;
    return true;
} 