import { useState, useEffect } from 'react';
import { ChatMessage, UserInput, CyclePhase, Symptom, DietaryPreference, Goal } from '../types/chat';
import { getAdvice } from '../lib/api';

const QUESTIONS = [
  {
    id: 'cycle',
    text: 'In welke fase van je cyclus zit je momenteel?',
    options: ['menstruatie', 'folliculaire', 'ovulatie', 'luteale'] as CyclePhase[],
  },
  {
    id: 'symptoms',
    text: 'Welke symptomen ervaar je? (meerdere opties mogelijk)',
    options: [
      'vermoeidheid',
      'acne',
      'mood swings',
      'krampen',
      'hoofdpijn',
      'bloating',
      'insuline resistentie',
      'onregelmatige cyclus',
    ] as Symptom[],
    multiple: true,
  },
  {
    id: 'preferences',
    text: 'Wat zijn je dieetvoorkeuren? (meerdere opties mogelijk)',
    options: [
      'vegetarisch',
      'veganistisch',
      'glutenvrij',
      'lactosevrij',
      'keto',
      'paleo',
    ] as DietaryPreference[],
    multiple: true,
  },
  {
    id: 'goals',
    text: 'Wat zijn je doelen? (meerdere opties mogelijk)',
    options: [
      'meer energie',
      'huid verbeteren',
      'gewicht verliezen',
      'cyclus reguleren',
      'minder pijn',
      'betere stemming',
    ] as Goal[],
    multiple: true,
  },
];

export default function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userInput, setUserInput] = useState<UserInput>({
    symptoms: [],
    preferences: [],
    cycle: 'menstruatie',
    goals: [],
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Start the conversation
    setMessages([
      {
        id: '1',
        type: 'bot',
        content: 'Hallo! Ik ga je helpen met persoonlijk voedingsadvies. Laten we beginnen met een paar vragen.',
        timestamp: new Date(),
      },
      {
        id: '2',
        type: 'bot',
        content: QUESTIONS[0].text,
        timestamp: new Date(),
      },
    ]);
  }, []);

  const handleOptionSelect = async (option: string) => {
    const currentQuestion = QUESTIONS[currentQuestionIndex];
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: option,
      timestamp: new Date(),
    };

    setMessages((prev: ChatMessage[]) => [...prev, newMessage]);

    // Update user input based on the current question
    if (currentQuestion.id === 'cycle') {
      setUserInput((prev: UserInput) => ({ ...prev, cycle: option as CyclePhase }));
    } else if (currentQuestion.id === 'symptoms') {
      setUserInput((prev: UserInput) => ({
        ...prev,
        symptoms: currentQuestion.multiple
          ? [...prev.symptoms, option as Symptom]
          : [option as Symptom],
      }));
    } else if (currentQuestion.id === 'preferences') {
      setUserInput((prev: UserInput) => ({
        ...prev,
        preferences: currentQuestion.multiple
          ? [...prev.preferences, option as DietaryPreference]
          : [option as DietaryPreference],
      }));
    } else if (currentQuestion.id === 'goals') {
      setUserInput((prev: UserInput) => ({
        ...prev,
        goals: currentQuestion.multiple
          ? [...prev.goals, option as Goal]
          : [option as Goal],
      }));
    }

    // Move to next question or get advice
    if (currentQuestionIndex < QUESTIONS.length - 1) {
      setCurrentQuestionIndex((prev: number) => prev + 1);
      setMessages((prev: ChatMessage[]) => [
        ...prev,
        {
          id: Date.now().toString(),
          type: 'bot',
          content: QUESTIONS[currentQuestionIndex + 1].text,
          timestamp: new Date(),
        },
      ]);
    } else {
      // All questions answered, get advice
      setIsLoading(true);
      try {
        const advice = await getAdvice(userInput);
        setMessages((prev: ChatMessage[]) => [
          ...prev,
          {
            id: Date.now().toString(),
            type: 'bot',
            content: 'Ik heb alle informatie die ik nodig heb. Laat me een persoonlijk advies voor je samenstellen...',
            timestamp: new Date(),
          },
          {
            id: Date.now().toString(),
            type: 'bot',
            content: advice.answer,
            timestamp: new Date(),
          },
        ]);
      } catch (error) {
        setMessages((prev: ChatMessage[]) => [
          ...prev,
          {
            id: Date.now().toString(),
            type: 'bot',
            content: 'Sorry, er is iets misgegaan bij het ophalen van het advies. Probeer het later opnieuw.',
            timestamp: new Date(),
          },
        ]);
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto p-4">
      <div className="flex-1 overflow-y-auto mb-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.type === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-4 ${
                message.type === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-200 text-gray-800 rounded-lg p-4">
              Denken...
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {currentQuestionIndex < QUESTIONS.length &&
          QUESTIONS[currentQuestionIndex].options.map((option) => (
            <button
              key={option}
              onClick={() => handleOptionSelect(option)}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              {option}
            </button>
          ))}
      </div>
    </div>
  );
} 