"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { 
  Sparkles, 
  X, 
  Send, 
  Loader2, 
  Bot, 
  User, 
  ExternalLink, 
  Check, 
  Copy, 
  Globe, 
  Layers, 
  FolderGit2, 
  Trash2, 
  Minimize2, 
  Maximize2,
  Code2,
  CheckCircle2,
  Zap,
  ArrowRight
} from "lucide-react";
import { useToast } from "@/components/providers/ToastProvider";
import { auth } from "@/lib/firebase";

interface Message {
  id: string;
  sender: "user" | "gemini";
  text: string;
  projectBlueprint?: any;
  publishedUrl?: string;
  timestamp: string;
}

export function AdminGeminiChatWidget() {
  const { success, error } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-1",
      sender: "gemini",
      text: "👋 Welcome Admin! I am your **SC TECH Gemini AI Copilot**.\n\nAsk me to **generate real-world project statements, design 8-task engineering blueprints**, or solve platform queries. When I generate a project, you can **publish it directly to the live website** with one click!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isMinimized]);

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputMessage.trim();
    if (!textToSend || loading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setLoading(true);

    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/ai/admin-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: textToSend,
          conversationHistory: messages.slice(-8).map((m) => ({
            sender: m.sender === "user" ? "user" : "model",
            text: m.text,
          })),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const geminiMsg: Message = {
          id: `gemini-${Date.now()}`,
          sender: "gemini",
          text: data.text || "Here is the real-world project statement and blueprint:",
          projectBlueprint: data.projectBlueprint || null,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, geminiMsg]);
      } else {
        error(data.error || "Gemini assistant encountered an issue.");
        setMessages((prev) => [
          ...prev,
          {
            id: `gemini-err-${Date.now()}`,
            sender: "gemini",
            text: "⚠️ Sorry, I encountered an issue while generating the response. Please verify your Gemini API key or try again.",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch (err) {
      console.error(err);
      error("Network error talking to Gemini AI");
    } finally {
      setLoading(false);
    }
  };

  const handlePublishToWeb = async (msgId: string, blueprint: any) => {
    if (!blueprint || publishingId) return;

    setPublishingId(msgId);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/ai/admin-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          publishProjectData: blueprint,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        success(`🎉 "${blueprint.title}" published live to web catalog!`);
        // Update message state with published url
        setMessages((prev) =>
          prev.map((m) =>
            m.id === msgId
              ? { ...m, publishedUrl: data.projectUrl || `/projects/${data.projectSlug}` }
              : m
          )
        );
      } else {
        error(data.error || "Failed to publish project to web");
      }
    } catch {
      error("Network error while publishing project");
    } finally {
      setPublishingId(null);
    }
  };

  const handleCopyBlueprint = (msgId: string, blueprint: any) => {
    navigator.clipboard.writeText(JSON.stringify(blueprint, null, 2));
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const clearChat = () => {
    setMessages([
      {
        id: "welcome-cleared",
        sender: "gemini",
        text: "✨ Chat cleared. How can I assist you with real-world projects or platform administration today?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const QUICK_PROMPTS = [
    "🚀 Generate AI Resume Screening Project & 8 Tasks",
    "💡 Architect FinTech Fraud Detection Engine",
    "🛡️ Create Cybersecurity Zero-Trust Gateway Blueprint",
    "☁️ Distributed Cloud Stream Processing Platform",
  ];

  return (
    <>
      {/* Floating Bottom-Right Trigger Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={() => setIsOpen(true)}
            className="group relative px-4 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-bold text-xs shadow-2xl shadow-indigo-500/40 hover:scale-105 transition-all flex items-center gap-2.5 border border-indigo-400/40 cursor-pointer"
          >
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500" />
            </span>

            <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-cyan-200 animate-pulse" />
            </div>

            <div className="text-left hidden sm:block">
              <div className="text-[11px] font-black tracking-wide leading-tight">Gemini AI Assistant</div>
              <div className="text-[9px] text-cyan-200 font-medium">Generate & Publish Projects</div>
            </div>
          </button>
        </div>
      )}

      {/* Floating Chat Modal / Drawer */}
      {isOpen && (
        <div
          className={`fixed bottom-6 right-4 sm:right-6 z-50 w-[92vw] sm:w-[480px] bg-[#0B0F19]/95 backdrop-blur-xl border border-indigo-500/30 rounded-3xl shadow-2xl shadow-black/80 flex flex-col transition-all overflow-hidden text-slate-100 ${
            isMinimized ? "h-16" : "h-[620px] max-h-[85vh]"
          }`}
        >
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border-b border-indigo-500/20 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
                <Sparkles className="w-4 h-4 text-cyan-200" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-black text-white">Gemini AI • Project Architect</h3>
                  <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[9px] font-bold border border-indigo-500/30">
                    1.5 FLASH
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">SC TECH Real-World Statements & Live Web Publishing</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={clearChat}
                title="Clear conversation"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setIsMinimized(!isMinimized)}
                title={isMinimized ? "Expand" : "Minimize"}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={() => setIsOpen(false)}
                title="Close"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body content if not minimized */}
          {!isMinimized && (
            <>
              {/* Message List */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
                
                {/* Quick Prompts Carousel if fewer messages */}
                {messages.length <= 2 && (
                  <div className="space-y-2 pb-2">
                    <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider block">
                      💡 Quick Admin Actions
                    </span>
                    <div className="flex flex-col gap-1.5">
                      {QUICK_PROMPTS.map((qp, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(qp)}
                          className="w-full text-left p-2 rounded-xl bg-slate-900/90 hover:bg-indigo-950/60 border border-slate-800 hover:border-indigo-500/40 text-[11px] text-slate-300 hover:text-white transition flex items-center justify-between group cursor-pointer"
                        >
                          <span className="line-clamp-1">{qp}</span>
                          <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-indigo-400 shrink-0 ml-1" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((m) => {
                  const isUser = m.sender === "user";
                  return (
                    <div
                      key={m.id}
                      className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}
                    >
                      {!isUser && (
                        <div className="w-6 h-6 rounded-lg bg-indigo-600/30 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5 border border-indigo-500/30">
                          <Bot className="w-3.5 h-3.5" />
                        </div>
                      )}

                      <div className={`max-w-[85%] space-y-2.5 ${isUser ? "items-end" : "items-start"}`}>
                        <div
                          className={`p-3.5 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                            isUser
                              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-none shadow-md"
                              : "bg-slate-900/90 border border-slate-800 text-slate-200 rounded-tl-none shadow-md"
                          }`}
                        >
                          {/* Remove json block from display text if present so raw JSON doesn't clutter */}
                          {m.text.replace(/```json:project_blueprint[\s\S]*?```/g, "").trim()}
                        </div>

                        {/* If Project Blueprint is Generated, Render Interactive Publish Card */}
                        {m.projectBlueprint && (
                          <div className="p-4 rounded-2xl bg-gradient-to-b from-indigo-950/50 to-slate-950 border border-indigo-500/40 space-y-3 shadow-xl">
                            <div className="flex items-center justify-between">
                              <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-[10px] font-bold border border-indigo-500/30">
                                {m.projectBlueprint.category || "Full Stack"}
                              </span>
                              <span className="text-[10px] font-bold text-amber-400">
                                {m.projectBlueprint.difficulty || "INTERMEDIATE"}
                              </span>
                            </div>

                            <div>
                              <h4 className="font-bold text-white text-xs">{m.projectBlueprint.title}</h4>
                              <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
                                {m.projectBlueprint.shortDescription}
                              </p>
                            </div>

                            {/* Tech stack tags */}
                            {m.projectBlueprint.technologyStack && (
                              <div className="flex flex-wrap gap-1">
                                {m.projectBlueprint.technologyStack.slice(0, 4).map((tech: string, idx: number) => (
                                  <span
                                    key={idx}
                                    className="px-1.5 py-0.5 rounded bg-slate-900 text-[9px] text-slate-300 border border-slate-800 font-mono"
                                  >
                                    {tech}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Action Buttons: Publish to Web & Copy */}
                            <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center gap-2">
                              {m.publishedUrl ? (
                                <Link
                                  href={m.publishedUrl}
                                  target="_blank"
                                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600/20 text-emerald-300 font-bold text-[11px] border border-emerald-500/30 flex items-center gap-1.5 hover:bg-emerald-600/30 transition"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>Live on Web Catalog → View</span>
                                  <ExternalLink className="w-3 h-3" />
                                </Link>
                              ) : (
                                <button
                                  type="button"
                                  disabled={publishingId === m.id}
                                  onClick={() => handlePublishToWeb(m.id, m.projectBlueprint)}
                                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-[11px] shadow-md shadow-blue-600/20 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                >
                                  {publishingId === m.id ? (
                                    <>
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      <span>Publishing to Web...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Globe className="w-3.5 h-3.5 text-cyan-300" />
                                      <span>Publish Directly to Web</span>
                                    </>
                                  )}
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleCopyBlueprint(m.id, m.projectBlueprint)}
                                className="px-2.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-[11px] font-semibold border border-slate-800 transition flex items-center gap-1 cursor-pointer"
                              >
                                {copiedId === m.id ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-400" />
                                    <span className="text-emerald-300">Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3 text-slate-400" />
                                    <span>JSON</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        )}

                        <span className="text-[9px] text-slate-500 block px-1">
                          {m.timestamp}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {loading && (
                  <div className="flex items-center gap-2 text-slate-400 text-xs py-2">
                    <div className="w-6 h-6 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center shrink-0">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    </div>
                    <span className="animate-pulse">Gemini is architecting project statement...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-3 bg-slate-950 border-t border-slate-800 shrink-0 space-y-1.5">
                <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-2xl px-3 py-1.5 focus-within:border-indigo-500">
                  <textarea
                    ref={textareaRef}
                    rows={1}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Ask Gemini to generate a project, problem statement..."
                    className="w-full bg-transparent text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none resize-none max-h-24 py-1"
                  />
                  <button
                    type="button"
                    disabled={!inputMessage.trim() || loading}
                    onClick={() => handleSendMessage()}
                    className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition disabled:opacity-40 cursor-pointer shrink-0"
                  >
                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="flex items-center justify-between text-[9px] text-slate-500 px-1">
                  <span>Press Enter to send • Shift+Enter for newline</span>
                  <span className="text-indigo-400">⚡ Live Web Publishing</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
