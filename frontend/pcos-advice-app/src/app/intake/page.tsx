"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { questionFlow } from "../../lib/questionFlow";
import ChatStep from "../../components/ChatStep";
import { UserInput, ChatMessage } from '@/types';
import { getAdvice } from '@/api/advice';
import { v4 as uuidv4 } from 'uuid';

const QUESTIONS = [
    {
        id: 'symptoms',
        question: 'What symptoms are you experiencing?',
        options: ['fatigue', 'acne', 'irregular cycle', 'weight gain', 'hair loss', 'mood swings'],
    },
    {
        id: 'preferences',
        question: 'What are your dietary preferences?',
        options: ['vegan', 'vegetarian', 'no dairy', 'gluten-free', 'no restrictions'],
    },
    {
        id: 'cycle',
        question: 'Which phase of your cycle are you in?',
        options: ['follicular', 'ovulation', 'luteal', 'menstrual'],
    },
    {
        id: 'goals',
        question: 'What are your current health goals?',
        options: ['reduce insulin resistance', 'get back my period', 'manage weight', 'improve energy', 'balance hormones'],
    },
];

export default function IntakePage() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [currentStep, setCurrentStep] = useState(0);
    const [userInput, setUserInput] = useState<UserInput>({
        symptoms: [],
        preferences: [],
        cycle: '',
        goals: [],
    });
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleOptionSelect = async (option: string) => {
        const currentQuestion = QUESTIONS[currentStep];
        const newMessages = [...messages];

        // Add user's selection as a message
        newMessages.push({
            id: uuidv4(),
            type: 'answer',
            content: option,
        });

        // Update user input based on the current question type
        const updatedInput = { ...userInput };
        if (currentQuestion.id === 'cycle') {
            updatedInput.cycle = option;
        } else {
            updatedInput[currentQuestion.id as keyof Omit<UserInput, 'cycle'>] = [
                ...(updatedInput[currentQuestion.id as keyof Omit<UserInput, 'cycle'>] as string[]),
                option,
            ];
        }
        setUserInput(updatedInput);

        // Move to next question or submit
        if (currentStep < QUESTIONS.length - 1) {
            setCurrentStep(currentStep + 1);
            newMessages.push({
                id: uuidv4(),
                type: 'question',
                content: QUESTIONS[currentStep + 1].question,
                options: QUESTIONS[currentStep + 1].options,
            });
        } else {
            // Submit to backend
            setIsLoading(true);
            try {
                const advice = await getAdvice(updatedInput);
                newMessages.push({
                    id: uuidv4(),
                    type: 'answer',
                    content: advice,
                });
            } catch (error) {
                newMessages.push({
                    id: uuidv4(),
                    type: 'answer',
                    content: 'Sorry, there was an error getting your advice. Please try again.',
                });
            }
            setIsLoading(false);
        }

        setMessages(newMessages);
    };

    // Initialize first question
    useState(() => {
        setMessages([{
            id: uuidv4(),
            type: 'question',
            content: QUESTIONS[0].question,
            options: QUESTIONS[0].options,
        }]);
    });

    return (
        <div className="max-w-2xl mx-auto p-4">
            <div className="space-y-4 mb-4">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`p-4 rounded-lg ${message.type === 'question' ? 'bg-blue-100' : 'bg-gray-100'
                            }`}
                    >
                        <p className="text-lg">{message.content}</p>
                        {message.options && (
                            <div className="mt-2 flex flex-wrap gap-2">
                                {message.options.map((option) => (
                                    <button
                                        key={option}
                                        onClick={() => handleOptionSelect(option)}
                                        disabled={isLoading}
                                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
            {isLoading && (
                <div className="text-center text-gray-500">
                    Getting your personalized advice...
                </div>
            )}
        </div>
    );
} 