"use client";
import { useState, useRef, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { ChatStep } from "@/components/ChatStep";
import { fetchChatHistoryAndSend } from "@/lib/api";
import { auth } from "@/lib/auth";

const QUICK_QUESTIONS = [
  "Why am I so tired?",
  "Why is my strategy important to follow?",
  "Help with my cravings",
  "Feeling bloated today",
  "Best foods for my cycle phase",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<{id: string, type: 'user' | 'bot', text: string, timestamp?: string}[]>([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch chat history on mount
  useEffect(() => {
    const fetchHistory = async () => {
      const token = auth.getToken();
      if (!token) return;
      setIsLoading(true);
      try {
        const res = await fetchChatHistoryAndSend("", token); // Empty question just to get history
        setMessages(res.history.map((m) => ({
          id: uuidv4(),
          type: m.sender === 'user' ? 'user' : 'bot',
          text: m.text,
          timestamp: m.timestamp,
        })));
      } catch {
        // Optionally show error
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const token = auth.getToken();
    if (!token) return;
    setMessages((prev) => [
      ...prev,
      { id: uuidv4(), type: "user", text: input.trim() },
    ]);
    setInput("");
    setIsLoading(true);
    try {
      const res = await fetchChatHistoryAndSend(input.trim(), token);
      setMessages(res.history.map((m) => ({
        id: uuidv4(),
        type: m.sender === 'user' ? 'user' : 'bot',
        text: m.text,
        timestamp: m.timestamp,
      })));
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: uuidv4(), type: "bot", text: "Sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickQuestion = (q: string) => {
    setInput(q);
    setTimeout(() => handleSend(), 100);
  };

  return (
    <div className="flex flex-col items-center min-h-[70vh] py-8 px-2">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg border border-gray-100 p-6 flex flex-col">
        <h1 className="text-2xl font-bold mb-1 text-gray-900 text-center">Chat with HerFoodCode</h1>
        <p className="text-center text-green-900 mb-4">Ask me all you need, I am science-based and always up to date</p>
        <div className="mb-3">
          <span className="text-sm text-green-900 font-semibold">Quick questions:</span>
          <div className="flex flex-wrap gap-2 mt-2">
            {QUICK_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => handleQuickQuestion(q)}
                className="bg-white border border-green-200 text-green-900 rounded-lg px-4 py-2 text-sm font-medium hover:bg-green-50 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 min-h-[200px] max-h-[350px] px-1" style={{ background: "#fcfbf7", borderRadius: 12 }}>
          {messages.map((msg, idx) => (
            <div key={msg.id}>
              <ChatStep type={msg.type as 'bot' | 'user'} isLast={idx === messages.length - 1}>
                {msg.text}
              </ChatStep>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-pink-100 text-gray-900 rounded-2xl p-4 animate-pulse mt-2">
                <p className="text-sm">HerFoodCode is thinking…</p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <form
          className="flex items-center gap-2 border border-green-200 rounded-lg px-2 py-1 bg-white"
          onSubmit={e => { e.preventDefault(); handleSend(); }}
        >
          <input
            type="text"
            className="flex-1 px-3 py-2 rounded-lg outline-none bg-transparent"
            placeholder="Ask me anything about your nutrition..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          />
          <button
            type="submit"
            className="bg-orange-300 hover:bg-orange-400 text-white rounded-full p-2 transition-colors"
            aria-label="Send"
            disabled={!input.trim()}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l15.75-7.5-7.5 15.75-2.25-6.75-6.75-2.25z" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
} 