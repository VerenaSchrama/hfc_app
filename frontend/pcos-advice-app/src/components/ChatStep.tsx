'use client';

import { ReactNode } from 'react';
import { Bot, User } from 'lucide-react';

interface ChatStepProps {
  type: 'bot' | 'user' | 'date-picker' | 'multi-select';
  children: ReactNode;
  isLast: boolean;
}

const icons = {
  bot: <Bot className="h-6 w-6 text-pink-300" />,
  user: <User className="h-6 w-6 text-purple-300" />,
};

export const ChatStep = ({ type, children, isLast }: ChatStepProps) => {
  const isBot = type === 'bot';
  const showIcon = type === 'bot' || type === 'user';
  
  const iconContainerClass = isBot
    ? 'bg-pink-900/50'
    : 'bg-purple-900/50';

  const messageBubbleClass = isBot
    ? 'bg-gray-800/80'
    : 'bg-purple-800/60';

  return (
    <div className={`flex items-start gap-4 ${isLast ? 'animate-fade-in' : ''}`}>
      {showIcon && (
        <div className={`flex-shrink-0 rounded-full h-10 w-10 flex items-center justify-center ${iconContainerClass}`}>
          {isBot ? icons.bot : icons.user}
        </div>
      )}
      <div className={`rounded-2xl p-4 flex-grow ${!showIcon ? 'ml-14' : ''} ${messageBubbleClass}`}>
        {children}
      </div>
    </div>
  );
}; 