'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, Heart, Upload, Loader2, Send } from 'lucide-react';
import { WorkbookData } from '../types';
import { auth } from '../lib/auth';

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
  
  // Log workbook data for debugging
  console.log('Workbook data available for chat:', workbookData ? 'Yes' : 'No');
  if (workbookData) {
    console.log('Mechanisms:', workbookData.mechanisms?.length || 0);
    console.log('Interventions:', workbookData.interventions?.length || 0);
  }

  useEffect(() => {
    setMounted(true);
    // Load existing chat history
    loadChatHistory();
  }, []);

  const loadChatHistory = async () => {
    try {
      const token = auth.getToken();
      if (!token) {
        console.log('No auth token found for chat history');
        return;
      }

      console.log('Loading chat history...');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/chat`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Chat history response:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Chat history loaded:', data.history?.length || 0, 'messages');
        setChatHistory(data.history || []);
      } else {
        console.error('Failed to load chat history:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const quickQuestions = [
    "How can I improve my insulin sensitivity faster?",
    "Why am I still having energy crashes?",
    "Should I add any new interventions this week?",
    "How do I know if my cortisol is improving?",
    "What should I eat for my current cycle phase?",
    "How long should I try this intervention?",
    "Why is this mechanism important for me?",
    "What if I can't follow this intervention?"
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

      console.log('Sending message:', userMessage);
      console.log('Workbook context available:', !!workbookData);

      // Add user message to chat immediately
      const newUserMessage: ChatMessage = {
        sender: 'user',
        text: userMessage,
        timestamp: new Date().toISOString()
      };
      setChatHistory(prev => [...prev, newUserMessage]);

      try {
        const token = auth.getToken();
        if (!token) {
          throw new Error('No authentication token');
        }

        console.log('Making chat API call...');
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/chat`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ question: userMessage }),
        });

        console.log('Chat API response:', response.status);
        if (response.ok) {
          const data = await response.json();
          console.log('Chat response received:', data.history?.length || 0, 'messages');
          setChatHistory(data.history || []);
        } else {
          const errorText = await response.text();
          console.error('Chat API error:', response.status, errorText);
          throw new Error(`Failed to get response: ${response.status}`);
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
            <div className="bg-pink-50 border border-pink-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle className="h-5 w-5 text-pink-600" />
                <h3 className="font-semibold text-gray-900">AI Assistant</h3>
              </div>
              <p className="text-gray-700 text-sm">
                Hi! I&apos;m here to help with your workbook. You can ask me about your mechanisms, interventions, or any questions about your hormonal health journey. What would you like to know?
              </p>
              <div className="text-xs text-gray-500 mt-2">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>

            {/* Quick Questions */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-900">Quick questions</h4>
              <div className="grid grid-cols-1 gap-2">
                {quickQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => setMessage(question)}
                    className="w-full text-left bg-white border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm"
                  >
                    <Heart className="h-4 w-4 text-pink-500" />
                    <span className="text-sm text-gray-700">{question}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          /* Chat History */
          <div className="space-y-4">
            {chatHistory.map((msg, index) => (
              <div
                key={index}
                className={`rounded-lg p-4 shadow-sm ${
                  msg.sender === 'user'
                    ? 'bg-pink-500 text-white ml-8'
                    : 'bg-gray-100 text-gray-900 mr-8'
                }`}
              >
                <p className="text-sm">{msg.text}</p>
                <div className={`text-xs mt-2 ${
                  msg.sender === 'user' ? 'text-white/70' : 'text-gray-500'
                }`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
            
            {/* Loading indicator */}
            {isLoading && (
              <div className="bg-gray-100 rounded-lg p-4 mr-8 shadow-sm">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-pink-500" />
                  <span className="text-sm text-gray-700">Thinking...</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-6 border-t border-gray-200 bg-white">
        <div className="flex gap-3">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask about your workbook..."
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !message.trim()}
            className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </div>
        
        {/* Quick Upload Button */}
        <div className="mt-4">
          <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors shadow-sm">
            <Upload className="h-4 w-4" />
            Quick Upload
          </button>
        </div>
      </div>
    </div>
  );
}
