'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, Heart, Upload } from 'lucide-react';
import { WorkbookData } from '../types';

interface WorkbookChatInterfaceProps {
  workbookData?: WorkbookData | null;
}

export default function WorkbookChatInterface({ workbookData }: WorkbookChatInterfaceProps) {
  const [message, setMessage] = useState('');
  const [mounted, setMounted] = useState(false);
  
  // Use workbookData to prevent unused variable warning
  console.log('Workbook data available:', workbookData ? 'Yes' : 'No');

  useEffect(() => {
    setMounted(true);
  }, []);

  const quickQuestions = [
    "How can I improve my insulin sensitivity faster?",
    "Why am I still having energy crashes?",
    "Should I add any new interventions this week?",
    "How do I know if my cortisol is improving?"
  ];

  if (!mounted) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 p-6 space-y-4">
          <div className="bg-gray-100 rounded-lg p-4">
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="p-6 border-t border-subtle">
          <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  const handleSendMessage = () => {
    if (message.trim()) {
      // TODO: Implement chat functionality
      console.log('Sending message:', message);
      setMessage('');
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Messages */}
      <div className="flex-1 p-6 space-y-4 overflow-y-auto">
        {/* Assistant Message */}
        <div className="bg-gray-100 rounded-lg p-4">
          <p className="text-foreground">
            Hi! I&apos;m here to help with your workbook. You can ask me about your mechanisms, interventions, or any questions about your hormonal health journey. What would you like to know?
          </p>
          <div className="text-xs text-muted mt-2">20:04</div>
        </div>

        {/* Quick Questions */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground">Quick questions</h4>
          {quickQuestions.map((question, index) => (
            <button
              key={index}
              onClick={() => setMessage(question)}
              className="w-full text-left bg-white border border-subtle rounded-lg p-3 hover:bg-accent transition-colors flex items-center gap-2"
            >
              <Heart className="h-4 w-4 text-primary" />
              <span className="text-sm text-foreground">{question}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className="p-6 border-t border-subtle">
        <div className="flex gap-3">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask about your workbook..."
            className="flex-1 px-4 py-2 border border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <button
            onClick={handleSendMessage}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2"
          >
            <MessageCircle className="h-4 w-4" />
            Send
          </button>
        </div>
        
        {/* Quick Upload Button */}
        <div className="mt-4">
          <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors">
            <Upload className="h-4 w-4" />
            Quick Upload
          </button>
        </div>
      </div>
    </div>
  );
}
