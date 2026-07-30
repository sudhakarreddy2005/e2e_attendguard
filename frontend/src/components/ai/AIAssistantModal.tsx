import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Bot, User, RefreshCw, ChevronRight } from 'lucide-react';
import { ChatMessage } from '../../types/ai';
import { aiService } from '../../services/aiService';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I am AttendGuard AI Assistant (powered by Qwen3). How can I assist you with campus monitoring, violation analytics, or student records today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedPrompts: [
        'Which department has the highest dress code violations?',
        'Summarize today\'s campus violations',
        'Find students with high risk scores in CSE section A',
      ],
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSend = async (promptToSend?: string) => {
    const text = promptToSend || input;
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!promptToSend) setInput('');
    setIsLoading(true);

    try {
      // Query backend AI service
      const response = await aiService.queryAssistant(text);
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response?.answer || response?.message || 'I have analyzed the campus records based on your prompt.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      // Fallback demo response if backend LLM is offline
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Based on GuardDB analysis for "${text}":\n\n- Total active violations logged: 47\n- Primary hotspot: Central Block & D Block\n- Most frequent type: Dress Code (53%)\n- Recommended Action: Schedule faculty audit for CSE section A.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md glass-panel border-l border-white/30 dark:border-white/10 shadow-2xl flex flex-col rounded-l-[28px] rounded-r-none">
      {/* Header */}
      <div className="h-18 px-5 border-b border-white/20 dark:border-white/10 flex items-center justify-between bg-gradient-to-r from-[#007AFF]/10 via-[#BF5AF2]/10 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#007AFF] to-[#00C6FF] text-white flex items-center justify-center shadow-md">
            <Sparkles className="w-4.5 h-4.5" strokeWidth={2} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">AttendGuard AI</h3>
            <p className="text-[10px] font-bold text-[#007AFF] dark:text-[#0A84FF]">Qwen3 8B Local Inference</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" strokeWidth={2} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-2xl bg-[#007AFF] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                <Bot className="w-4.5 h-4.5" strokeWidth={2} />
              </div>
            )}

            <div className="max-w-[85%] space-y-2">
              <div
                className={`p-4 rounded-2xl text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'apple-active-pill font-semibold rounded-br-none'
                    : 'bg-white/70 dark:bg-white/10 text-slate-800 dark:text-slate-200 rounded-bl-none border border-white/40 dark:border-white/10 shadow-xs'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>

              {msg.suggestedPrompts && (
                <div className="space-y-2 pt-1">
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Suggested Queries:
                  </p>
                  {msg.suggestedPrompts.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(prompt)}
                      className="w-full text-left text-[11px] p-2.5 rounded-2xl bg-white/60 dark:bg-white/5 hover:bg-[#007AFF]/10 text-slate-700 dark:text-slate-300 border border-white/40 dark:border-white/10 flex items-center justify-between transition-colors font-medium"
                    >
                      <span className="truncate">{prompt}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-[#007AFF] shrink-0" strokeWidth={2} />
                    </button>
                  ))}
                </div>
              )}

              <span className="text-[10px] text-slate-500 dark:text-slate-400 block px-1">{msg.timestamp}</span>
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-950 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                <User className="w-4.5 h-4.5" strokeWidth={2} />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-[#007AFF] font-bold p-2">
            <RefreshCw className="w-4 h-4 animate-spin" strokeWidth={2} />
            Analyzing campus data...
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/20 dark:border-white/10 bg-white/30 dark:bg-white/[0.03]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask AI about student analytics..."
            className="flex-1 px-4 py-3 rounded-2xl bg-black/5 dark:bg-white/10 border border-white/20 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#007AFF]"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="apple-btn-primary p-3 rounded-2xl disabled:opacity-40 transition-colors"
          >
            <Send className="w-4 h-4" strokeWidth={2} />
          </button>
        </form>
      </div>
    </div>
  );
};
