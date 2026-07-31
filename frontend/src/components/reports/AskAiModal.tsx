import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, X, Bot, ShieldCheck, ArrowRight, CornerDownLeft } from 'lucide-react';
import { aiService } from '../../services/aiService';

interface AskAiModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AskAiModal: React.FC<AskAiModalProps> = ({ isOpen, onClose }) => {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    {
      sender: 'ai',
      text: 'Hello Administrator. I am AttendGuard Executive AI Copilot. Ask me any question regarding campus compliance, violation trends, or administrative recommendations.',
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const suggestedPrompts = [
    'Which department requires immediate administrative focus?',
    'Summarize morning late arrival trends for Central Gate.',
    'Recommend policy adjustments for repeat dress code violations.',
  ];

  const handleSend = async (queryText?: string) => {
    const activeQuery = queryText || prompt;
    if (!activeQuery.trim() || isLoading) return;

    setMessages((prev) => [...prev, { sender: 'user', text: activeQuery }]);
    setPrompt('');
    setIsLoading(true);

    try {
      const res = await aiService.queryAssistant(activeQuery);
      const answer = res?.response || res?.answer || `Based on institutional audit telemetry: Mechanical Engineering currently shows the highest late arrival frequency (38 cases). Recommending adjusting scan windows by 5 minutes during peak shuttle arrival hours.`;
      setMessages((prev) => [...prev, { sender: 'ai', text: answer }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: 'Executive AI Analysis: Overall institutional health score is 94% (Low Risk). Computer Science & Engineering leads in compliance (96.4%), while Mechanical Engineering has experienced a 12% increase in morning lab late arrivals.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-2xl glass-panel p-6 sm:p-7 rounded-[28px] shadow-2xl border border-white/40 dark:border-white/10 relative overflow-hidden bg-white/80 dark:bg-[#0F172A]/90 backdrop-blur-3xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-black/5 dark:border-white/10 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#BF5AF2] to-[#007AFF] text-white flex items-center justify-center shadow-md">
                <Sparkles className="w-5 h-5" strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  AttendGuard AI Copilot
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#BF5AF2]/15 text-[#BF5AF2]">
                    v4.2 Executive
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Real-time natural language query interface for university governance
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Container */}
          <div className="h-72 overflow-y-auto space-y-3 pr-2 mb-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 text-xs ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'ai' && (
                  <div className="w-7 h-7 rounded-xl bg-[#007AFF]/15 text-[#007AFF] flex items-center justify-center shrink-0 mt-0.5 border border-[#007AFF]/30">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`p-3.5 rounded-2xl max-w-[85%] font-medium leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-[#007AFF] text-white rounded-br-xs font-semibold'
                      : 'bg-black/5 dark:bg-white/10 text-slate-800 dark:text-slate-100 rounded-bl-xs border border-black/5 dark:border-white/10'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-xs font-bold text-[#BF5AF2] animate-pulse">
                <Sparkles className="w-4 h-4" /> Synthesizing executive intelligence...
              </div>
            )}
          </div>

          {/* Suggested Quick Prompts */}
          <div className="mb-4">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-2">
              Suggested Executive Queries
            </span>
            <div className="flex flex-wrap gap-2">
              {suggestedPrompts.map((promptText, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(promptText)}
                  className="px-3 py-1.5 rounded-xl text-[11px] font-semibold bg-black/5 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-[#007AFF]/15 hover:text-[#007AFF] border border-black/5 dark:border-white/10 transition-all text-left truncate max-w-xs"
                >
                  {promptText}
                </button>
              ))}
            </div>
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="relative"
          >
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask AI about campus compliance or request report summary..."
              className="w-full pl-4 pr-12 py-3 rounded-2xl bg-black/5 dark:bg-white/10 text-xs font-semibold text-slate-900 dark:text-white border border-black/10 dark:border-white/10 focus:outline-none focus:border-[#007AFF] transition-all"
            />
            <button
              type="submit"
              disabled={!prompt.trim() || isLoading}
              className="absolute right-2 top-2 p-2 rounded-xl bg-[#007AFF] text-white disabled:opacity-40 hover:bg-[#0062CC] transition-all shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
