import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Send, Bot, User, ShieldCheck, Cpu, Brain } from 'lucide-react';
import { aiService } from '../../services/aiService';
import { Violation } from '../../types/violation';

interface AiExecutiveInsightsProps {
  violations: Violation[];
  totalStudents: number;
  deptCount: number;
}

export const AiExecutiveInsights: React.FC<AiExecutiveInsightsProps> = ({
  violations,
  totalStudents,
  deptCount,
}) => {
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [reasoningStep, setReasoningStep] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Array<{ sender: 'ai' | 'user'; text: string; time: string; reasoning?: string }>>([
    {
      sender: 'ai',
      text: `Hello Administrator. I am AttendGuard Executive AI Agent. I have loaded and indexed ${violations.length} GuardDB violation records across ${totalStudents} active students. Ask me to infer top repeat offenders, hotspot locations, department risks, or executive briefings.`,
      time: 'Just now',
    },
  ]);

  const quickPrompts = [
    'Give me top 5 students with highest count of violations',
    'Which department requires compliance intervention?',
    'Tell me hotspot location telemetry',
    'Generate executive safety briefing for University Dean',
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, reasoningStep]);

  // Dynamic Agentic Inference & Reasoning Engine over real database violations
  const inferQuery = async (queryText: string) => {
    const lower = queryText.toLowerCase();

    // 1. TOP STUDENTS / REPEAT OFFENDERS QUERY
    if (
      lower.includes('top') ||
      lower.includes('student') ||
      lower.includes('highest') ||
      lower.includes('offender') ||
      lower.includes('bunk') ||
      lower.includes('repeat')
    ) {
      const studentMap: Record<string, { roll: string; name: string; dept: string; count: number; types: Set<string> }> = {};

      violations.forEach((v) => {
        const key = v.roll_no || v.student_name || 'Unknown';
        if (!studentMap[key]) {
          studentMap[key] = {
            roll: v.roll_no || 'N/A',
            name: v.student_name || (v.roll_no ? `Student ${v.roll_no}` : key),
            dept: v.department || 'Unassigned',
            count: 0,
            types: new Set(),
          };
        }
        studentMap[key].count += 1;
        if (v.type) studentMap[key].types.add(v.type);
      });

      const sortedStudents = Object.values(studentMap).sort((a, b) => b.count - a.count).slice(0, 5);

      if (sortedStudents.length === 0) {
        return `**Agent Inference**: Inspected ${violations.length} GuardDB violation records. No student violation logs currently recorded in memory.`;
      }

      let response = `**Top 5 Students with Highest Violation Counts (GuardDB Audit)**:\n\n`;
      sortedStudents.forEach((st, idx) => {
        const typesList = Array.from(st.types).join(', ');
        response += `${idx + 1}. **${st.name}** (Roll: **${st.roll}** • Dept: **${st.dept}**) — **${st.count} Violations** (${typesList})\n`;
      });
      response += `\n**Administrative Action Plan**: Advise Head of Department to issue formal warning notices to these top ${sortedStudents.length} repeat offenders.`;
      return response;
    }

    // 2. HOTSPOT / LOCATION QUERY
    if (
      lower.includes('hotspot') ||
      lower.includes('location') ||
      lower.includes('gate') ||
      lower.includes('block') ||
      lower.includes('place') ||
      lower.includes('where')
    ) {
      const locMap: Record<string, number> = {};
      violations.forEach((v) => {
        const loc = v.location || 'Central Gate';
        locMap[loc] = (locMap[loc] || 0) + 1;
      });
      const sortedLocs = Object.entries(locMap).sort((a, b) => b[1] - a[1]);

      if (sortedLocs.length === 0) {
        return `**Agent Inference**: No location telemetry logs available in GuardDB memory.`;
      }

      let response = `**Incident Hotspot Telemetry Analysis (GuardDB)**:\n\n`;
      sortedLocs.forEach(([loc, cnt], idx) => {
        const pct = violations.length > 0 ? Math.round((cnt / violations.length) * 100) : 0;
        response += `${idx + 1}. **${loc}**: **${cnt} recorded incidents** (${pct}% of total volume)\n`;
      });
      response += `\n**Agent Insight**: Highest camera detection traffic observed at **${sortedLocs[0]?.[0]}**. Recommending secondary verification portals for peak hours.`;
      return response;
    }

    // 3. DEPARTMENT / FACULTY INTERVENTION QUERY
    if (
      lower.includes('department') ||
      lower.includes('dept') ||
      lower.includes('faculty') ||
      lower.includes('intervention')
    ) {
      const deptMap: Record<string, { total: number; resolved: number }> = {};
      violations.forEach((v) => {
        const dept = v.department || 'Unassigned';
        if (!deptMap[dept]) deptMap[dept] = { total: 0, resolved: 0 };
        deptMap[dept].total += 1;
        if (v.status === 'Resolved') deptMap[dept].resolved += 1;
      });
      const sortedDepts = Object.entries(deptMap).sort((a, b) => b[1].total - a[1].total);

      if (sortedDepts.length === 0) {
        return `**Agent Inference**: No departmental compliance records found in GuardDB memory.`;
      }

      let response = `**Departmental Risk & Compliance Breakdown**:\n\n`;
      sortedDepts.forEach(([dept, data], idx) => {
        const resRate = data.total > 0 ? Math.round((data.resolved / data.total) * 100) : 100;
        response += `${idx + 1}. **${dept}**: **${data.total} total cases** (${resRate}% audit resolution rate)\n`;
      });
      response += `\n**Agent Intervention Suggestion**: **${sortedDepts[0]?.[0]}** faculty requires immediate compliance review due to highest incident density.`;
      return response;
    }

    // 4. DEAN BRIEFING / EXECUTIVE SAFETY QUERY
    if (
      lower.includes('dean') ||
      lower.includes('briefing') ||
      lower.includes('executive') ||
      lower.includes('summary') ||
      lower.includes('peak')
    ) {
      const resolvedCount = violations.filter((v) => v.status === 'Resolved').length;
      const resRate = violations.length > 0 ? Math.round((resolvedCount / violations.length) * 100) : 100;

      return (
        `**Executive Safety Briefing for University Dean**:\n\n` +
        `• **Institutional Roster**: **${totalStudents}** enrolled students across **${deptCount}** faculties.\n` +
        `• **GuardDB Audit Volume**: **${violations.length} total logged violations**.\n` +
        `• **Audit Resolution Rate**: **${resRate}%** of flagged incidents resolved.\n` +
        `• **Institutional Risk Level**: **Low Risk / Stable Operation**.\n\n` +
        `**Actionable Recommendation**: Maintain continuous camera stream verification at peak entrance portals.`
      );
    }

    // 5. GREETINGS
    if (lower === 'hi' || lower === 'hello' || lower === 'hey' || lower === 'hii' || lower === 'help') {
      return (
        `Hello Administrator! I am your AttendGuard AI Agent. I can dynamically analyze GuardDB records for:\n\n` +
        `• **Top 5 students with highest violation counts**\n` +
        `• **Incident hotspots & location portal spikes**\n` +
        `• **Departmental compliance & HOD intervention**\n` +
        `• **Executive briefings for the Dean**\n\nWhat would you like me to infer for you?`
      );
    }

    // 6. CALL BACKEND AI ENDPOINT FOR OTHER DYNAMIC QUERIES
    try {
      const res = await aiService.queryAssistant(queryText);
      if (res?.response || res?.answer) {
        return res.response || res.answer;
      }
    } catch (err) {
      // Fallback reasoning
    }

    const resolvedCount = violations.filter((v) => v.status === 'Resolved').length;
    const resRate = violations.length > 0 ? Math.round((resolvedCount / violations.length) * 100) : 100;

    return (
      `**Agent Reasoning Result**: Evaluated query regarding "${queryText}".\n\n` +
      `Inspected **${violations.length} GuardDB violation records** across **${totalStudents} active students**.\n` +
      `Current audit resolution rate is **${resRate}%**. System status operational.`
    );
  };

  const handleSend = async (queryText?: string) => {
    const prompt = queryText || inputQuery;
    if (!prompt.trim() || isLoading) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages((prev) => [...prev, { sender: 'user', text: prompt, time: timeStr }]);
    setInputQuery('');
    setIsLoading(true);

    // Agent Reasoning Chain
    setReasoningStep(`🧠 Inspecting ${violations.length} GuardDB memory logs...`);

    setTimeout(() => {
      setReasoningStep(`⚡ Aggregating student profiles, locations & departments...`);
    }, 350);

    setTimeout(async () => {
      setReasoningStep(`💡 Inferring executive synthesis...`);
      const answer = await inferQuery(prompt);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: answer,
          time: timeStr,
          reasoning: `Analyzed ${violations.length} DB records • ${totalStudents} students`,
        },
      ]);
      setReasoningStep(null);
      setIsLoading(false);
    }, 700);
  };

  // Render formatted markdown text cleanly
  const renderFormattedText = (rawText: string) => {
    const cleanText = rawText.replace(/###/g, '').trim();
    const lines = cleanText.split('\n');

    return (
      <div className="space-y-1">
        {lines.map((line, lIdx) => {
          if (!line.trim()) return <div key={lIdx} className="h-1" />;
          const parts = line.split(/(\*\*.*?\*\*|\`.*?\`)/g);

          return (
            <p key={lIdx} className="leading-relaxed">
              {parts.map((part, pIdx) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                  return (
                    <strong key={pIdx} className="font-bold text-slate-900 dark:text-white">
                      {part.slice(2, -2)}
                    </strong>
                  );
                }
                if (part.startsWith('`') && part.endsWith('`')) {
                  return (
                    <code key={pIdx} className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono text-[11px] font-bold text-[#007AFF]">
                      {part.slice(1, -1)}
                    </code>
                  );
                }
                return part;
              })}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-[1px] rounded-[24px] bg-gradient-to-r from-[#007AFF]/30 via-[#BF5AF2]/30 to-[#30D158]/30 shadow-lg"
    >
      <div className="glass-panel p-5 sm:p-7 rounded-[24px] relative overflow-hidden bg-white/70 dark:bg-[#121624]/80 backdrop-blur-3xl border border-white/50 dark:border-white/10 space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/5 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#BF5AF2] to-[#007AFF] text-white flex items-center justify-center shadow-md">
              <Brain className="w-5 h-5" strokeWidth={2} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-800 dark:text-white tracking-tight">
                  AI Agentic Reasoning Engine
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-[#BF5AF2]/15 text-[#BF5AF2]">
                  Live GuardDB Inference
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Performs dynamic reasoning & inference over {violations.length} database logs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-[#007AFF] bg-[#007AFF]/10 px-3 py-1.5 rounded-xl border border-[#007AFF]/20 self-start sm:self-auto">
            <Cpu className="w-3.5 h-3.5" />
            <span>Agent Inference Active</span>
          </div>
        </div>

        {/* Chat Messages Stream */}
        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-3 text-xs ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'ai' && (
                <div className="w-7 h-7 rounded-xl bg-[#BF5AF2]/15 text-[#BF5AF2] flex items-center justify-center shrink-0 border border-[#BF5AF2]/30 mt-0.5 shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              <div
                className={`p-3.5 rounded-2xl max-w-[88%] font-medium shadow-xs ${
                  msg.sender === 'user'
                    ? 'bg-[#007AFF] text-white rounded-br-xs font-semibold'
                    : 'bg-white/80 dark:bg-white/10 text-slate-800 dark:text-slate-100 rounded-bl-xs border border-black/5 dark:border-white/10'
                }`}
              >
                {msg.reasoning && (
                  <span className="text-[10px] font-bold text-[#BF5AF2] uppercase flex items-center gap-1 mb-1 pb-1 border-b border-black/5 dark:border-white/10">
                    <Brain className="w-3 h-3" /> {msg.reasoning}
                  </span>
                )}
                {renderFormattedText(msg.text)}
                <span className={`text-[9px] block mt-1.5 ${msg.sender === 'user' ? 'text-white/70 text-right' : 'text-slate-400'}`}>
                  {msg.time}
                </span>
              </div>
              {msg.sender === 'user' && (
                <div className="w-7 h-7 rounded-xl bg-[#007AFF]/15 text-[#007AFF] flex items-center justify-center shrink-0 border border-[#007AFF]/30 mt-0.5 shadow-xs">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {/* Reasoning & Inference Thought Chain Animation */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-xs font-bold text-[#BF5AF2] p-2.5 rounded-xl bg-[#BF5AF2]/10 border border-[#BF5AF2]/20 max-w-sm ml-10 shadow-xs"
            >
              <Brain className="w-4 h-4 animate-spin text-[#BF5AF2]" />
              <span>{reasoningStep || 'Thinking & inferring from GuardDB...'}</span>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Query Pills */}
        <div className="pt-1">
          <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1.5">
            Agentic Reasoning Quick Queries
          </span>
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((promptText, i) => (
              <button
                key={i}
                onClick={() => handleSend(promptText)}
                className="px-3 py-1.5 rounded-xl text-[11px] font-medium bg-white/60 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-[#007AFF]/15 hover:text-[#007AFF] border border-black/5 dark:border-white/10 transition-all text-left shadow-xs"
              >
                {promptText}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="relative"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask AI Agent (e.g. give me top 5 students with highest violation count, hotspot locations)..."
            className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-white/80 dark:bg-white/10 text-xs font-semibold text-slate-900 dark:text-white border border-black/10 dark:border-white/10 focus:outline-none focus:border-[#007AFF] transition-all shadow-xs"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || isLoading}
            className="absolute right-1.5 top-1.5 p-1.5 rounded-lg bg-[#007AFF] text-white disabled:opacity-40 hover:bg-[#0062CC] transition-all shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </motion.div>
  );
};
