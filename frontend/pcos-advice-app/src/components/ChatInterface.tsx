// src/components/ChatInterface.tsx
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
  { id: OPTION_IDS.NO_CYCLE, title: "I have no cycle", description: "For example due to pregnancy, menopause, PCOS or medical reasons" }
];

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [intakeData, setIntakeData] = useState<Partial<IntakeData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false); //check if the user has completed the intake questions
  const [showEstimator, setShowEstimator] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [showFreeText, setShowFreeText] = useState(false);
  const [freeTextValue, setFreeTextValue] = useState('');

  useEffect(() => {
    setMessages([
      { id: uuidv4(), type: 'bot', text: 'Hi, I will help you with setting up your personalized nutrition decode plan. Let\'s start with a few questions to understand your situation and needs better.'},
      { id: uuidv4(), type: 'bot', text: questions[0].question },
    ]);
  }, []);
  
  useEffect(() => { //scroll to bottom of chat interface when new message is added
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const proceedToNextStep = (currentInput: Partial<IntakeData>) => { //proceed to next step in the question flow
    if (currentQuestionIndex < questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      setMessages((prev) => [
        ...prev,
        { id: uuidv4(), type: 'bot', text: questions[nextIndex].question },
      ]);
    } else {
      setIsComplete(true); // 🔑 markeer intake als afgerond
      setIsLoading(true);
      localStorage.setItem('intakeData', JSON.stringify(currentInput));
      // Log voor navigatie
      console.log('Navigating to /strategy_selection with intakeData:', localStorage.getItem('intakeData'));
      setTimeout(() => {
        router.push('/strategy_selection');
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
    
    const phase = optionId === OPTION_IDS.NO_CYCLE ? 'menstruation' : optionId; //if user has no cycle, set phase to menstruation -> replace later with option to not set a phase/discovery
    const updatedInput = { ...intakeData, cycle: phase };
    setIntakeData(updatedInput);
    proceedToNextStep(updatedInput);
  };

  const handleMultiSelectSubmit = (selected: string[]) => {
    const currentQuestion = questions[currentQuestionIndex];
    const userMessage: Message = {
      id: uuidv4(),
      type: 'user',
      text: selected.join(', ')
    };
    setMessages((prev) => [...prev, userMessage]);
  
    // Filter zonder free-text trigger
    const cleanedSelections = selected.filter((opt) => opt !== currentQuestion.allowFreeTextIf);
  
    // Bouw de nieuwe intakeData
    const updatedInput = {
      ...intakeData,
      [currentQuestion.key]: cleanedSelections
    };
    // Log en sla direct op
    console.log('Saving intakeData to localStorage (multi-select):', updatedInput);
    localStorage.setItem('intakeData', JSON.stringify(updatedInput));
    setIntakeData(updatedInput);
  
    // Activeer vrije tekst als trigger gekozen is
    if (selected.includes(currentQuestion.allowFreeTextIf ?? '')) {
      setShowFreeText(true);
    } else {
      proceedToNextStep(updatedInput);
    }
  };

  const handleTextSubmit = (text: string) => {
    const currentQuestion = questions[currentQuestionIndex];
    // Voeg user message toe aan chat
    const userMessage: Message = { id: uuidv4(), type: 'user', text };
    setMessages((prev) => [...prev, userMessage]);

    // Bouw nieuwe intakeData
    const updatedInput = {
      ...intakeData,
      [currentQuestion.key]: text
    };
    // Log en sla direct op
    console.log('Saving intakeData to localStorage (text):', updatedInput);
    localStorage.setItem('intakeData', JSON.stringify(updatedInput));
    setIntakeData(updatedInput);
    proceedToNextStep(updatedInput);
  };

  const handleContinue = () => {
    const currentQuestion = questions[currentQuestionIndex];
    const baseKey = currentQuestion.key;
    const noteKey = `${baseKey}_note`;

    // Voeg user message toe aan chat als het vrije tekst is NA multi-select
    if (showFreeText && freeTextValue) {
      const userMessage: Message = { id: uuidv4(), type: 'user', text: freeTextValue };
      setMessages((prev) => [...prev, userMessage]);
    }

    const updatedInput: Partial<IntakeData> = {
      ...intakeData,
      ...(showFreeText && freeTextValue ? { [noteKey]: freeTextValue } : {}),
    };
    // Log en sla direct op
    console.log('Saving intakeData to localStorage (free text):', updatedInput);
    localStorage.setItem('intakeData', JSON.stringify(updatedInput));
    setIntakeData(updatedInput);
    // Extra check: log localStorage direct voor navigatie
    console.log('localStorage intakeData before navigation:', localStorage.getItem('intakeData'));
    proceedToNextStep(updatedInput);
    setFreeTextValue('');
    setShowFreeText(false);
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

  const currentQuestion = questions[currentQuestionIndex]; //get the current question based on the current question index
  const isCycleQuestion = currentQuestion?.key === 'cycle'; //check if the current question is a cycle question

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
              <p className="text-sm animate-pulse">Matching your needs with nutrition plans...</p>
            </div>
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-gray-200">
        {isCycleQuestion && !showEstimator && !isComplete && (
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
        
        {!isComplete && !showEstimator && currentQuestion && (
          <>
            {currentQuestion.type === 'text' && !isComplete && !showFreeText && (
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 border rounded-lg px-3 py-2"
                  value={freeTextValue}
                  onChange={e => setFreeTextValue(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && freeTextValue.trim()) { handleTextSubmit(freeTextValue.trim()); setFreeTextValue(''); } }}
                  placeholder="Type your answer..."
                />
                <button
                  className="bg-purple-500 text-white px-4 py-2 rounded-lg font-bold"
                  disabled={!freeTextValue.trim()}
                  onClick={() => { handleTextSubmit(freeTextValue.trim()); setFreeTextValue(''); }}
                >
                  Continue
                </button>
              </div>
            )}

    {currentQuestion.type === 'multi-select' && !showFreeText && (
      <MultiSelectOptions
        options={currentQuestion.options}
        onSubmit={handleMultiSelectSubmit}
      />
    )}
  </>
)}

          {showFreeText && (
            <div className="mt-4 space-y-4">
              <input
                type="text"
                id="freeText"
                value={freeTextValue}
                onChange={(e) => setFreeTextValue(e.target.value)}
                className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm"
                placeholder="Bijv. tomaat, chocolade, etc."
              />
              <button
                onClick={handleContinue}
                className="w-full bg-purple-600 text-white font-bold py-3 px-5 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Continue
              </button>
            </div>
          )}
      </div>
    </div>
  );
}