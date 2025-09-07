'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, Heart, Upload, Loader2 } from 'lucide-react';
import { WorkbookData } from '../types';

interface WorkbookChatInterfaceProps {
  workbookData?: WorkbookData | null;
}

interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
}

export default function WorkbookChatInterface({ workbookData }: WorkbookChatInterfaceProps) {
  const [message, setMessage] = useState('');
  const [mounted, setMounted] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Use workbookData to prevent unused variable warning
  console.log('Workbook data available:', workbookData ? 'Yes' : 'No');

  useEffect(() => {
    setMounted(true);
    // Load existing chat history
    loadChatHistory();
  }, []);

  const loadChatHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/v1/chat', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setChatHistory(data.history || []);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

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

  const handleSendMessage = async () => {
    if (message.trim() && !isLoading) {
      const userMessage = message.trim();
      setMessage('');
      setIsLoading(true);

      // Add user message to chat immediately
      const newUserMessage: ChatMessage = {
        sender: 'user',
        text: userMessage,
        timestamp: new Date().toISOString()
      };
      setChatHistory(prev => [...prev, newUserMessage]);

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token');
        }

        const response = await fetch('/api/v1/chat', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ question: userMessage }),
        });

        if (response.ok) {
          const data = await response.json();
          setChatHistory(data.history || []);
        } else {
          throw new Error('Failed to get response');
        }
      } catch (error) {
        console.error('Error sending message:', error);
        // Add error message to chat
        const errorMessage: ChatMessage = {
          sender: 'bot',
          text: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date().toISOString()
        };
        setChatHistory(prev => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Messages */}
      <div className="flex-1 p-6 space-y-4 overflow-y-auto">
        {/* Show chat history or welcome message */}
        {chatHistory.length === 0 ? (
          <>
            {/* Welcome Message */}
            <div className="bg-gray-100 rounded-lg p-4">
              <p className="text-foreground">
                Hi! I&apos;m here to help with your workbook. You can ask me about your mechanisms, interventions, or any questions about your hormonal health journey. What would you like to know?
              </p>
              <div className="text-xs text-muted mt-2">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
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
          </>
        ) : (
          /* Chat History */
          <div className="space-y-4">
            {chatHistory.map((msg, index) => (
              <div
                key={index}
                className={`rounded-lg p-4 ${
                  msg.sender === 'user'
                    ? 'bg-primary text-white ml-8'
                    : 'bg-gray-100 text-foreground mr-8'
                }`}
              >
                <p className="text-sm">{msg.text}</p>
                <div className={`text-xs mt-2 ${
                  msg.sender === 'user' ? 'text-primary-100' : 'text-muted'
                }`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
            
            {/* Loading indicator */}
            {isLoading && (
              <div className="bg-gray-100 rounded-lg p-4 mr-8">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm text-foreground">Thinking...</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-6 border-t border-subtle">
        <div className="flex gap-3">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask about your workbook..."
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
            onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !message.trim()}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MessageCircle className="h-4 w-4" />
            )}
            {isLoading ? 'Sending...' : 'Send'}
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
