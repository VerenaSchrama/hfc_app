'use client';
import { v4 as uuidv4 } from 'uuid';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { questions } from '../lib/questionFlow';
import { IntakeData, Message } from '../types';
import MultiSelectOptions from './MultiSelectOptions';
import { CycleEstimator } from './CycleEstimator';
import { Bot, User } from 'lucide-react';

const OPTION_IDS = {
  DONT_KNOW: 'dont_know',
  NO_CYCLE: 'no_cycle'
};

const CYCLE_OPTIONS = [
  { id: OPTION_IDS.DONT_KNOW, title: "I don't know", description: "Let us help you figure it out" },
  { id: OPTION_IDS.NO_CYCLE, title: "I have no cycle", description: "For example due to pregnancy, menopause, or medical reasons" }
];

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [intakeData, setIntakeData] = useState<Partial<IntakeData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showEstimator, setShowEstimator] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    setMessages([
      { id: uuidv4(), type: 'bot', text: 'Hello! I will help you with defining your personalized nutrition decode plan. Let\'s start with a few questions.'},
      { id: uuidv4(), type: 'bot', text: questions[0].question },
    ]);
  }, []);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const proceedToNextStep = (currentInput: Partial<IntakeData>) => {
    if (currentQuestionIndex < questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      setMessages((prev) => [
        ...prev,
        { id: uuidv4(), type: 'bot', text: questions[nextIndex].question },
      ]);
    } else {
      setIsLoading(true);
      localStorage.setItem('intakeData', JSON.stringify(currentInput));
      setTimeout(() => {
        router.push('/plan');
        setIsLoading(false);
      }, 1000);
    }
  };

  const handleCycleOptionClick = (optionId: string, title: string) => {
    const userMessage: Message = { id: uuidv4(), type: 'user', text: title };
    setMessages(prev => [...prev, userMessage]);

    if (optionId === OPTION_IDS.DONT_KNOW) {
      setShowEstimator(true);
      return;
    }
    
    const phase = optionId === OPTION_IDS.NO_CYCLE ? 'follicular' : optionId;
    const updatedInput = { ...intakeData, cycle: phase };
    setIntakeData(updatedInput);
    proceedToNextStep(updatedInput);
  };

  const handleMultiSelectSubmit = (selected: string[]) => {
    const userMessage: Message = { id: uuidv4(), type: 'user', text: selected.join(', ') };
    setMessages((prev) => [...prev, userMessage]);

    const currentQuestion = questions[currentQuestionIndex];
    const updatedInput = { 
      ...intakeData,
      [currentQuestion.key]: selected
    };
    
    setIntakeData(updatedInput);
    proceedToNextStep(updatedInput);
  };

  const handleEstimatorComplete = (phase: string) => {
    setShowEstimator(false);
    const updatedInput = { ...intakeData, cycle: phase };
    setIntakeData(updatedInput);
    
    setMessages(prev => [...prev, {
        id: uuidv4(),
        type: 'bot',
        text: `Okay, based on your input, we'll assume you are in the ${phase} phase.`,
    }]);

    proceedToNextStep(updatedInput);
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isCycleQuestion = currentQuestion?.key === 'cycle';

  return (
    <div className="flex flex-col max-w-2xl mx-auto p-6 bg-white rounded-2xl shadow-lg border border-gray-100">
      <div ref={messagesEndRef} className="flex-1 overflow-y-auto mb-4 space-y-6 h-96 pr-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start gap-3 ${ message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.type === 'bot' && <Bot className="h-6 w-6 text-purple-500 flex-shrink-0 mt-1" />}
            <div
              className={`max-w-[85%] rounded-lg p-3 text-sm ${
                message.type === 'user'
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <p>{message.text}</p>
            </div>
            {message.type === 'user' && <User className="h-6 w-6 text-gray-500 flex-shrink-0 mt-1" />}
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-800 rounded-lg p-3">
              <p className="text-sm animate-pulse">Thinking...</p>
            </div>
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-gray-200">
        {isCycleQuestion && !showEstimator && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3 justify-center">
              {currentQuestion.options.map((opt: string) => (
                <button
                  key={opt}
                  onClick={() => handleCycleOptionClick(opt.toLowerCase(), opt)}
                  className="bg-purple-100 text-purple-800 font-semibold px-4 py-2 rounded-lg hover:bg-purple-200 transition-colors capitalize"
                >
                  {opt}
                </button>
              ))}
            </div>

            <div className="flex gap-4 pt-2">
              {CYCLE_OPTIONS.map(opt => (
                <div key={opt.id} className="flex-1 text-center">
                  <button
                    onClick={() => handleCycleOptionClick(opt.id, opt.title)}
                    className="w-full bg-purple-100 text-purple-800 font-bold py-3 px-5 rounded-lg hover:bg-purple-200 transition-colors"
                  >
                    {opt.title}
                  </button>
                  <p className="text-xs text-gray-500 mt-1 px-2">{opt.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {showEstimator && (
          <CycleEstimator onComplete={handleEstimatorComplete} />
        )}
        
        {!isCycleQuestion && currentQuestion && (
          <MultiSelectOptions options={currentQuestion.options} onSubmit={handleMultiSelectSubmit} />
        )}
      </div>
    </div>
  );
}