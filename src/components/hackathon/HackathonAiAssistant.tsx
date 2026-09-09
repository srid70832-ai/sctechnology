"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  Bot, 
  Sparkles, 
  X, 
  Send, 
  Loader2, 
  MessageSquare, 
  ChevronDown, 
  HelpCircle,
  Clock,
  Users,
  Code2,
  Trophy
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface HackathonAiAssistantProps {
  hackathonId: string;
  hackathonTitle?: string;
  isRegistered?: boolean;
  userTeam?: any;
}

export const HackathonAiAssistant: React.FC<HackathonAiAssistantProps> = ({
  hackathonId,
  hackathonTitle = "Hackathon",
  isRegistered = false,
  userTeam = null,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `👋 Hi! I'm your **SC TECH Hackathon AI Mentor** for **${hackathonTitle}**.\n\nI can help you understand rules, deadlines, team formation, problem statements, judging criteria, or brainstorm technical solutions for your project.\n\nHow can I help you today?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    { label: "Submission Deadline", prompt: "When is the project submission deadline in IST?" },
    { label: "Team Registration", prompt: "How do I create or join a team for this hackathon?" },
    { label: "Judging Rubric", prompt: "What criteria will judges use to evaluate our submission?" },
    { label: "Problem Statements", prompt: "What are the problem statements for this hackathon?" },
    { label: "Architecture Advice", prompt: "What tech stack and architecture do you recommend for a winning project?" },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (userPrompt?: string) => {
    const query = userPrompt || input;
    if (!query.trim() || loading) return;

    const newMessages: Message[] = [...messages, { role: "user", content: query.trim() }];
    setMessages(newMessages);
    if (!userPrompt) setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/hackathon-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hackathonId,
          messages: newMessages,
          userContext: {
            isRegistered,
            teamName: userTeam?.name,
            teamId: userTeam?.teamId,
            isLeader: userTeam?.leaderId === userTeam?.leaderId,
            hasSubmitted: !!userTeam?.submission,
          },
        }),
      });

      const data = await res.json();
      if (res.ok && data.reply) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { 
            role: "assistant", 
            content: data.error || "Sorry, I had trouble processing that request. Please try again." 
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Connection error. Please check your internet connection." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Widget Trigger Button */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="group flex items-center gap-3 px-5 py-3 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-xs shadow-2xl shadow-blue-500/40 border border-blue-400/30 transition-all transform hover:-translate-y-1 active:translate-y-0"
          >
            <div className="relative">
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <span className="tracking-wide">SC TECH AI Mentor</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/20 font-mono">24/7</span>
          </button>
        )}
      </div>

      {/* Floating Chat Drawer Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[94vw] sm:w-[440px] h-[580px] max-h-[85vh] rounded-3xl bg-[#0B0F19] border border-blue-500/40 shadow-2xl shadow-blue-900/40 flex flex-col overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="px-5 py-3.5 bg-gradient-to-r from-slate-900 via-blue-950/60 to-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-600/30 border border-blue-400/40">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-white tracking-wide">SC TECH AI Mentor</h4>
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Online
                  </span>
                </div>
                <p className="text-[10px] text-blue-300/80 truncate max-w-[220px]">
                  Context: {hackathonTitle}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition"
                title="Close Assistant"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Prompts Bar */}
          <div className="px-3 py-2 bg-slate-950/80 border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            {quickPrompts.map((qp, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(qp.prompt)}
                disabled={loading}
                className="px-2.5 py-1 rounded-full bg-slate-900 hover:bg-blue-600/20 text-[10px] font-medium text-slate-300 hover:text-blue-300 border border-slate-800 hover:border-blue-500/30 whitespace-nowrap transition shrink-0"
              >
                {qp.label}
              </button>
            ))}
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
            {messages.map((m, idx) => {
              const isUser = m.role === "user";
              return (
                <div
                  key={idx}
                  className={`flex ${isUser ? "justify-end" : "justify-start gap-2.5"}`}
                >
                  {!isUser && (
                    <div className="w-6 h-6 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 leading-relaxed text-xs shadow-md ${
                      isUser
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-none"
                        : "bg-slate-900/90 border border-slate-800 text-slate-200 rounded-tl-none whitespace-pre-line"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              );
            })}
            {loading && (
              <div className="flex items-center gap-2 text-slate-400 text-xs pl-8">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                <span className="text-[11px] text-slate-400">Mentor is formulating guidance...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-slate-950 border-t border-slate-800/80 shrink-0">
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
                placeholder="Ask about rules, problem, deadlines, or tech..."
                disabled={loading}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-md shadow-blue-600/30 transition disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
