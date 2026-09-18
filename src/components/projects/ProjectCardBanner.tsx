"use client";

import React, { useState } from "react";
import { Sparkles, Lock } from "lucide-react";

export interface ProjectCardBannerProps {
  id?: string;
  slug?: string;
  title?: string;
  category?: string;
  difficulty?: string;
  bannerUrl?: string | null;
  imageUrl?: string | null;
  thumbnail?: string | null;
  accessType?: "FREE" | "PRO" | string;
  accessLevel?: string;
  isFeatured?: boolean;
  className?: string;
  aspectRatio?: "16/9" | "auto" | "video";
  showBadges?: boolean;
}

export const ProjectCardBanner: React.FC<ProjectCardBannerProps> = ({
  id = "",
  slug = "",
  title = "",
  category = "",
  difficulty = "INTERMEDIATE",
  bannerUrl,
  imageUrl,
  thumbnail,
  accessType,
  accessLevel,
  isFeatured = false,
  className = "",
  aspectRatio = "16/9",
  showBadges = true,
}) => {
  const [imgError, setImgError] = useState(false);
  const explicitImage = bannerUrl || imageUrl || thumbnail;

  const isFree =
    String(accessType || "").toUpperCase() === "FREE" ||
    String(accessLevel || "").toUpperCase() === "FREE";

  const resolvedDifficulty = difficulty?.toUpperCase() || "INTERMEDIATE";

  // Identify topic key
  const combinedKey = `${id} ${slug} ${title} ${category}`.toLowerCase();

  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl bg-[#080E1C] border border-slate-800/80 group ${
        aspectRatio === "16/9" ? "aspect-video" : "h-40 sm:h-44"
      } ${className}`}
    >
      {/* Background Graphic */}
      <div className="absolute inset-0 w-full h-full transition-transform duration-500 ease-out group-hover:scale-105">
        {explicitImage && !imgError ? (
          <img
            src={explicitImage}
            alt={title || "Project Banner"}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <TopicSvgGraphic topicKey={combinedKey} title={title} />
        )}
      </div>

      {/* Dark Gradient Overlay for Contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#070B14]/90 via-[#070B14]/25 to-black/30 pointer-events-none" />

      {/* Badges Overlay */}
      {showBadges && (
        <>
          {/* Top Left: FREE / PRO and FEATURED */}
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10 pointer-events-none">
            {isFree ? (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[9px] font-black tracking-wider uppercase shadow-md flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> FREE
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-600/95 text-white text-[9px] font-black tracking-wider uppercase shadow-md flex items-center gap-1 border border-indigo-400/30">
                <Lock className="w-2.5 h-2.5" /> PRO
              </span>
            )}

            {isFeatured && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[9px] font-black tracking-wider uppercase shadow-md">
                Featured
              </span>
            )}
          </div>

          {/* Bottom Right: Difficulty Badge */}
          <div className="absolute bottom-2.5 right-2.5 z-10 pointer-events-none">
            <span
              className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider backdrop-blur-md border ${
                resolvedDifficulty === "ADVANCED"
                  ? "bg-rose-950/80 text-rose-300 border-rose-500/30"
                  : resolvedDifficulty === "BEGINNER"
                  ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/30"
                  : "bg-blue-950/80 text-blue-300 border-blue-500/30"
              }`}
            >
              {resolvedDifficulty}
            </span>
          </div>
        </>
      )}
    </div>
  );
};

// =========================================================================
// TOPIC SPECIFIC SVG VECTOR GRAPHICS
// =========================================================================

function TopicSvgGraphic({ topicKey, title }: { topicKey: string; title: string }) {
  // 1. AI Recruitment / Matching
  if (topicKey.includes("recruitment") || topicKey.includes("talent") || topicKey.includes("resume") || topicKey.includes("matching")) {
    return (
      <svg className="w-full h-full" viewBox="0 0 400 225" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="225" fill="#0A1128" />
        <path d="M0 45H400M0 90H400M0 135H400M0 180H400M80 0V225M160 0V225M240 0V225M320 0V225" stroke="#1E293B" strokeWidth="0.5" strokeOpacity="0.4" />
        <circle cx="200" cy="112" r="85" fill="#3B82F6" fillOpacity="0.12" />
        {/* Candidate Node */}
        <circle cx="110" cy="112" r="28" fill="#0F172A" stroke="#3B82F6" strokeWidth="2" />
        <circle cx="110" cy="102" r="9" fill="#38BDF8" />
        <path d="M98 124C98 117 103 114 110 114C117 114 122 117 122 124" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />
        {/* Radar match lines */}
        <line x1="138" y1="112" x2="262" y2="112" stroke="#60A5FA" strokeWidth="1.5" strokeDasharray="4 4" />
        <circle cx="200" cy="112" r="18" fill="#1E1B4B" stroke="#818CF8" strokeWidth="2" />
        <text x="200" y="116" fill="#A5B4FC" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">98%</text>
        {/* Target Job Node */}
        <circle cx="290" cy="112" r="28" fill="#0F172A" stroke="#8B5CF6" strokeWidth="2" />
        <rect x="278" y="101" width="24" height="22" rx="4" fill="#6366F1" fillOpacity="0.3" stroke="#818CF8" strokeWidth="1.5" />
        <path d="M285 97H295V101H285V97Z" stroke="#818CF8" strokeWidth="1.5" fill="#4F46E5" />
        <text x="200" y="180" fill="#94A3B8" fontSize="10" fontWeight="600" textAnchor="middle" fontFamily="monospace">SEMANTIC TALENT MATCHER</text>
      </svg>
    );
  }

  // 2. Fraud Detection / Financial Risk
  if (topicKey.includes("fraud") || topicKey.includes("risk scoring")) {
    return (
      <svg className="w-full h-full" viewBox="0 0 400 225" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="225" fill="#080D1A" />
        <circle cx="200" cy="112" r="70" stroke="#EF4444" strokeWidth="1" strokeDasharray="3 3" opacity="0.3" />
        <circle cx="200" cy="112" r="50" stroke="#F59E0B" strokeWidth="1" strokeDasharray="4 4" opacity="0.4" />
        {/* Shield */}
        <path d="M200 65L240 85V120C240 145 200 165 200 165C200 165 160 145 160 120V85L200 65Z" fill="#1E1B4B" stroke="#6366F1" strokeWidth="2" />
        <path d="M190 115L198 123L214 103" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {/* Pulse waveform */}
        <path d="M40 112H130L145 80L155 140L165 112H235L245 75L255 145L270 112H360" stroke="#EF4444" strokeWidth="1.5" strokeOpacity="0.7" />
        <text x="200" y="190" fill="#F87171" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">&lt;50ms RISK SCORING ENGINE</text>
      </svg>
    );
  }

  // 3. Healthcare / EHR / Tele-consultation
  if (topicKey.includes("health") || topicKey.includes("medical") || topicKey.includes("tele-consultation") || topicKey.includes("ehr")) {
    return (
      <svg className="w-full h-full" viewBox="0 0 400 225" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="225" fill="#06121E" />
        <path d="M20 112H110L125 65L140 160L155 90L170 125L180 112H220L235 60L250 165L265 85L280 112H380" stroke="#06B6D4" strokeWidth="2" strokeLinecap="round" />
        <circle cx="200" cy="112" r="34" fill="#082F49" stroke="#0EA5E9" strokeWidth="2" />
        <rect x="194" y="94" width="12" height="36" rx="3" fill="#38BDF8" />
        <rect x="182" y="106" width="36" height="12" rx="3" fill="#38BDF8" />
        <text x="200" y="185" fill="#38BDF8" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">EHR TELE-HEALTH VAULT</text>
      </svg>
    );
  }

  // 4. SaaS / Project Management / Agile
  if (topicKey.includes("saas") || topicKey.includes("project management") || topicKey.includes("sprint")) {
    return (
      <svg className="w-full h-full" viewBox="0 0 400 225" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="225" fill="#090E1F" />
        <rect x="60" y="45" width="80" height="125" rx="8" fill="#1E293B" stroke="#334155" />
        <rect x="68" y="55" width="40" height="6" rx="3" fill="#64748B" />
        <rect x="68" y="70" width="64" height="22" rx="4" fill="#0F172A" stroke="#475569" strokeWidth="0.8" />
        <rect x="68" y="98" width="64" height="22" rx="4" fill="#0F172A" stroke="#475569" strokeWidth="0.8" />

        <rect x="160" y="45" width="80" height="125" rx="8" fill="#1E293B" stroke="#3B82F6" strokeWidth="1.5" />
        <rect x="168" y="55" width="50" height="6" rx="3" fill="#3B82F6" />
        <rect x="168" y="70" width="64" height="28" rx="4" fill="#1D4ED8" fillOpacity="0.3" stroke="#60A5FA" strokeWidth="1" />
        <rect x="174" y="78" width="40" height="4" rx="2" fill="#93C5FD" />
        <rect x="174" y="86" width="24" height="4" rx="2" fill="#60A5FA" />

        <rect x="260" y="45" width="80" height="125" rx="8" fill="#1E293B" stroke="#10B981" strokeWidth="1" />
        <rect x="268" y="55" width="35" height="6" rx="3" fill="#10B981" />
        <rect x="268" y="70" width="64" height="22" rx="4" fill="#064E3B" fillOpacity="0.4" stroke="#34D399" strokeWidth="0.8" />
        <text x="200" y="195" fill="#93C5FD" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">MULTI-TENANT AGILE ENGINE</text>
      </svg>
    );
  }

  // 5. Cybersecurity / SIEM
  if (topicKey.includes("cybersecurity") || topicKey.includes("siem") || topicKey.includes("threat")) {
    return (
      <svg className="w-full h-full" viewBox="0 0 400 225" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="225" fill="#060A14" />
        <circle cx="200" cy="112" r="80" stroke="#059669" strokeWidth="0.7" strokeDasharray="3 3" opacity="0.4" />
        <circle cx="200" cy="112" r="55" stroke="#10B981" strokeWidth="0.8" opacity="0.5" />
        <circle cx="200" cy="112" r="30" stroke="#34D399" strokeWidth="1" opacity="0.7" />
        <line x1="200" y1="32" x2="200" y2="192" stroke="#059669" strokeWidth="0.7" opacity="0.4" />
        <line x1="120" y1="112" x2="280" y2="112" stroke="#059669" strokeWidth="0.7" opacity="0.4" />
        <circle cx="240" cy="75" r="4" fill="#EF4444" />
        <circle cx="240" cy="75" r="8" stroke="#EF4444" strokeWidth="1" opacity="0.7" />
        <circle cx="160" cy="140" r="3" fill="#F59E0B" />
        <text x="200" y="195" fill="#34D399" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">SOC TELEMETRY & MITRE SIEM</text>
      </svg>
    );
  }

  // 6. RAG / Document Intelligence
  if (topicKey.includes("document") || topicKey.includes("rag") || topicKey.includes("intelligence")) {
    return (
      <svg className="w-full h-full" viewBox="0 0 400 225" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="225" fill="#0A0E1A" />
        <rect x="90" y="50" width="70" height="95" rx="6" fill="#1E293B" stroke="#475569" />
        <line x1="105" y1="65" x2="145" y2="65" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
        <line x1="105" y1="75" x2="140" y2="75" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="105" y1="85" x2="135" y2="85" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="105" y1="95" x2="145" y2="95" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M165 95L235 95" stroke="#8B5CF6" strokeWidth="2" strokeDasharray="3 3" />
        <circle cx="200" cy="95" r="16" fill="#2E1065" stroke="#A78BFA" strokeWidth="1.5" />
        <path d="M195 91L200 96L205 91M195 99H205" stroke="#C4B5FD" strokeWidth="1.5" strokeLinecap="round" />
        <rect x="240" y="55" width="85" height="85" rx="8" fill="#1E1B4B" stroke="#6366F1" strokeWidth="1.5" />
        <rect x="250" y="68" width="50" height="5" rx="2.5" fill="#818CF8" />
        <rect x="250" y="78" width="65" height="4" rx="2" fill="#A5B4FC" fillOpacity="0.6" />
        <rect x="250" y="86" width="60" height="4" rx="2" fill="#A5B4FC" fillOpacity="0.6" />
        <rect x="250" y="98" width="40" height="12" rx="3" fill="#4338CA" />
        <text x="270" y="107" fill="#E0E7FF" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">[p. 42 CITED]</text>
        <text x="200" y="190" fill="#A78BFA" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">HYBRID RAG VECTOR SEARCH</text>
      </svg>
    );
  }

  // 7. IoT / Smart Campus
  if (topicKey.includes("iot") || topicKey.includes("campus") || topicKey.includes("energy")) {
    return (
      <svg className="w-full h-full" viewBox="0 0 400 225" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="225" fill="#08101E" />
        <rect x="140" y="60" width="120" height="95" rx="6" fill="#0F172A" stroke="#0284C7" strokeWidth="1.5" />
        <rect x="155" y="75" width="20" height="20" rx="3" fill="#0369A1" fillOpacity="0.5" stroke="#38BDF8" />
        <rect x="190" y="75" width="20" height="20" rx="3" fill="#0369A1" fillOpacity="0.5" stroke="#38BDF8" />
        <rect x="225" y="75" width="20" height="20" rx="3" fill="#10B981" fillOpacity="0.6" stroke="#34D399" />
        <rect x="155" y="110" width="20" height="20" rx="3" fill="#0369A1" fillOpacity="0.5" stroke="#38BDF8" />
        <rect x="190" y="110" width="20" height="20" rx="3" fill="#0369A1" fillOpacity="0.5" stroke="#38BDF8" />
        <rect x="225" y="110" width="20" height="20" rx="3" fill="#0369A1" fillOpacity="0.5" stroke="#38BDF8" />
        <circle cx="80" cy="90" r="15" fill="#0C4A6E" stroke="#38BDF8" />
        <path d="M72 88C75 84 85 84 88 88M68 83C73 78 87 78 92 83" stroke="#38BDF8" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="95" y1="95" x2="140" y2="105" stroke="#0284C7" strokeWidth="1" strokeDasharray="3 3" />
        <text x="200" y="190" fill="#38BDF8" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">MQTT TELEMETRY & FACILITY IoT</text>
      </svg>
    );
  }

  // 8. Computer Vision / Safety
  if (topicKey.includes("vision") || topicKey.includes("safety") || topicKey.includes("ppe")) {
    return (
      <svg className="w-full h-full" viewBox="0 0 400 225" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="225" fill="#0A0C14" />
        <path d="M70 65H50V85M330 65H350V85M50 145V165H70M350 145V165H330" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
        <rect x="160" y="60" width="80" height="40" rx="3" fill="#F59E0B" fillOpacity="0.1" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="4 2" />
        <rect x="160" y="48" width="68" height="12" rx="2" fill="#F59E0B" />
        <text x="164" y="57" fill="#000" fontSize="8" fontWeight="black" fontFamily="sans-serif">HARDHAT: 99%</text>
        <rect x="150" y="105" width="100" height="55" rx="3" fill="#10B981" fillOpacity="0.1" stroke="#10B981" strokeWidth="1.5" />
        <rect x="150" y="93" width="76" height="12" rx="2" fill="#10B981" />
        <text x="154" y="102" fill="#000" fontSize="8" fontWeight="black" fontFamily="sans-serif">HI-VIS VEST: 97%</text>
        <text x="200" y="195" fill="#FBBF24" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">EDGE TENSORFLOW.JS CV</text>
      </svg>
    );
  }

  // 9. Blockchain / Verifiable Credential
  if (topicKey.includes("blockchain") || topicKey.includes("credential") || topicKey.includes("identity")) {
    return (
      <svg className="w-full h-full" viewBox="0 0 400 225" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="225" fill="#080D1E" />
        <rect x="70" y="80" width="65" height="50" rx="6" fill="#1E1B4B" stroke="#6366F1" strokeWidth="1.5" />
        <text x="102" y="108" fill="#818CF8" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">BLOCK 01</text>
        <line x1="135" y1="105" x2="165" y2="105" stroke="#A855F7" strokeWidth="2" strokeDasharray="3 3" />

        <rect x="165" y="70" width="70" height="70" rx="8" fill="#2E1065" stroke="#A855F7" strokeWidth="2" />
        <circle cx="200" cy="100" r="16" fill="#7E22CE" stroke="#D8B4FE" strokeWidth="1.5" />
        <path d="M195 100L199 104L206 96" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="235" y1="105" x2="265" y2="105" stroke="#A855F7" strokeWidth="2" strokeDasharray="3 3" />

        <rect x="265" y="80" width="65" height="50" rx="6" fill="#1E1B4B" stroke="#6366F1" strokeWidth="1.5" />
        <text x="297" y="108" fill="#818CF8" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">BLOCK 02</text>
        <text x="200" y="185" fill="#C084FC" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">W3C VERIFIABLE CREDENTIALS</text>
      </svg>
    );
  }

  // 10. BI Analytics / Data Lake
  if (topicKey.includes("analytics") || topicKey.includes("business intelligence") || topicKey.includes("data lake")) {
    return (
      <svg className="w-full h-full" viewBox="0 0 400 225" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="225" fill="#0A0F1D" />
        <rect x="80" y="55" width="110" height="95" rx="6" fill="#0F172A" stroke="#1E293B" />
        <rect x="95" y="105" width="12" height="35" rx="2" fill="#3B82F6" />
        <rect x="115" y="85" width="12" height="55" rx="2" fill="#60A5FA" />
        <rect x="135" y="70" width="12" height="70" rx="2" fill="#93C5FD" />
        <rect x="155" y="90" width="12" height="50" rx="2" fill="#2563EB" />
        <rect x="210" y="55" width="110" height="95" rx="6" fill="#0F172A" stroke="#1E293B" />
        <path d="M225 125L245 105L265 115L285 85L305 75" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
        <path d="M225 125L245 105L265 115L285 85L305 75V140H225Z" fill="#10B981" fillOpacity="0.15" />
        <text x="200" y="190" fill="#60A5FA" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">REAL-TIME BI DATA LAKE</text>
      </svg>
    );
  }

  // 11. E-Commerce Multi-Vendor
  if (topicKey.includes("ecommerce") || topicKey.includes("e-commerce") || topicKey.includes("marketplace") || topicKey.includes("store")) {
    return (
      <svg className="w-full h-full" viewBox="0 0 400 225" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="225" fill="#0D111A" />
        <rect x="80" y="65" width="60" height="70" rx="6" fill="#1E293B" stroke="#334155" />
        <rect x="90" y="75" width="40" height="30" rx="4" fill="#3B82F6" fillOpacity="0.3" stroke="#60A5FA" />
        <rect x="90" y="112" width="25" height="5" rx="2" fill="#94A3B8" />
        <rect x="90" y="121" width="18" height="5" rx="2" fill="#10B981" />

        <rect x="155" y="55" width="90" height="90" rx="8" fill="#1E1B4B" stroke="#6366F1" strokeWidth="1.5" />
        <circle cx="190" cy="120" r="5" fill="#818CF8" />
        <circle cx="215" cy="120" r="5" fill="#818CF8" />
        <path d="M175 80H183L192 108H222L229 88H187" stroke="#A5B4FC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        <rect x="260" y="65" width="60" height="70" rx="6" fill="#1E293B" stroke="#334155" />
        <rect x="270" y="75" width="40" height="30" rx="4" fill="#10B981" fillOpacity="0.3" stroke="#34D399" />
        <rect x="270" y="112" width="25" height="5" rx="2" fill="#94A3B8" />
        <rect x="270" y="121" width="18" height="5" rx="2" fill="#10B981" />
        <text x="200" y="185" fill="#A5B4FC" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">HEADLESS MULTI-VENDOR MARKETPLACE</text>
      </svg>
    );
  }

  // 12. Weather Telemetry
  if (topicKey.includes("weather") || topicKey.includes("meteorological") || topicKey.includes("air quality")) {
    return (
      <svg className="w-full h-full" viewBox="0 0 400 225" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="225" fill="#081424" />
        <circle cx="160" cy="85" r="28" fill="#F59E0B" fillOpacity="0.8" />
        <circle cx="160" cy="85" r="38" stroke="#F59E0B" strokeWidth="1" strokeDasharray="4 4" opacity="0.4" />
        <path d="M175 115H240C248 115 255 108 255 100C255 93 250 87 243 86C242 75 232 67 220 67C211 67 203 72 200 80C197 78 193 77 189 77C180 77 173 84 173 93C167 94 162 99 162 105C162 111 167 115 175 115Z" fill="#38BDF8" fillOpacity="0.9" />
        <rect x="80" y="130" width="70" height="28" rx="4" fill="#0C4A6E" stroke="#0284C7" />
        <text x="115" y="148" fill="#E0F2FE" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">28°C • AQI 42</text>
        <rect x="250" y="130" width="70" height="28" rx="4" fill="#0C4A6E" stroke="#0284C7" />
        <text x="285" y="148" fill="#E0F2FE" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">98% HUMID</text>
        <text x="200" y="195" fill="#38BDF8" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">WEATHER & AIR QUALITY RADAR</text>
      </svg>
    );
  }

  // 13. AI Recipe & Nutrition
  if (topicKey.includes("recipe") || topicKey.includes("nutrition") || topicKey.includes("cook")) {
    return (
      <svg className="w-full h-full" viewBox="0 0 400 225" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="225" fill="#130C16" />
        <circle cx="150" cy="100" r="45" fill="#24142B" stroke="#D946EF" strokeWidth="2" />
        <circle cx="150" cy="100" r="30" fill="#3B1745" stroke="#E879F9" strokeWidth="1" strokeDasharray="3 3" />
        <path d="M142 85V115M146 85V115M138 85V95C138 98 142 100 144 100" stroke="#F0ABFC" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M158 85C154 85 154 95 158 98V115" stroke="#F0ABFC" strokeWidth="1.5" strokeLinecap="round" />
        <rect x="220" y="60" width="105" height="80" rx="8" fill="#1F1024" stroke="#A21CAF" />
        <rect x="232" y="72" width="40" height="12" rx="3" fill="#EC4899" />
        <text x="252" y="81" fill="#FFF" fontSize="7" fontWeight="bold" textAnchor="middle">PROTEIN 35g</text>
        <rect x="232" y="90" width="40" height="12" rx="3" fill="#06B6D4" />
        <text x="252" y="99" fill="#FFF" fontSize="7" fontWeight="bold" textAnchor="middle">CARBS 40g</text>
        <rect x="232" y="108" width="40" height="12" rx="3" fill="#EAB308" />
        <text x="252" y="117" fill="#FFF" fontSize="7" fontWeight="bold" textAnchor="middle">FATS 12g</text>
        <text x="200" y="185" fill="#F0ABFC" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">AI CHEF & MACRO CALCULATOR</text>
      </svg>
    );
  }

  // 14. Developer Portfolio / Resume / Tools
  if (topicKey.includes("portfolio") || topicKey.includes("resume") || topicKey.includes("developer")) {
    return (
      <svg className="w-full h-full" viewBox="0 0 400 225" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="225" fill="#070B14" />
        <rect x="70" y="45" width="260" height="120" rx="8" fill="#0F172A" stroke="#3B82F6" strokeWidth="1.5" />
        <rect x="70" y="45" width="260" height="24" rx="8" fill="#1E293B" />
        <circle cx="85" cy="57" r="4" fill="#EF4444" />
        <circle cx="97" cy="57" r="4" fill="#F59E0B" />
        <circle cx="109" cy="57" r="4" fill="#10B981" />
        <text x="200" y="61" fill="#94A3B8" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">developer-portfolio.tsx</text>
        <text x="85" y="90" fill="#F472B6" fontSize="9" fontFamily="monospace">const <tspan fill="#60A5FA">engineer</tspan> = &#123;</text>
        <text x="95" y="105" fill="#93C5FD" fontSize="9" fontFamily="monospace">  stack: <tspan fill="#34D399">[&quot;Next.js&quot;, &quot;TypeScript&quot;, &quot;Tailwind&quot;]</tspan>,</text>
        <text x="95" y="120" fill="#93C5FD" fontSize="9" fontFamily="monospace">  status: <tspan fill="#FBBF24">&quot;Ready for Impact 🚀&quot;</tspan></text>
        <text x="85" y="135" fill="#F472B6" fontSize="9" fontFamily="monospace">&#125;;</text>
        <text x="200" y="195" fill="#60A5FA" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">INTERACTIVE DEVELOPER SHOWCASE</text>
      </svg>
    );
  }

  // 15. Real-Time Chat / Collaboration / Support
  if (topicKey.includes("chat") || topicKey.includes("collaboration") || topicKey.includes("support")) {
    return (
      <svg className="w-full h-full" viewBox="0 0 400 225" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="225" fill="#0A0E1A" />
        <rect x="80" y="45" width="130" height="50" rx="10" fill="#1E293B" stroke="#334155" />
        <text x="95" y="68" fill="#E2E8F0" fontSize="9" fontFamily="sans-serif">Hey! PR #104 ready for review</text>
        <circle cx="195" cy="83" r="4" fill="#10B981" />
        <rect x="190" y="105" width="130" height="50" rx="10" fill="#1D4ED8" fillOpacity="0.4" stroke="#60A5FA" />
        <text x="205" y="128" fill="#DBEAFE" fontSize="9" fontFamily="sans-serif">Merged & deployed to stage 🚀</text>
        <text x="200" y="190" fill="#93C5FD" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">REAL-TIME TEAM COLLABORATION</text>
      </svg>
    );
  }

  // 16. Fallback Graphic
  return (
    <svg className="w-full h-full" viewBox="0 0 400 225" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="225" fill="#070E1E" />
      <circle cx="200" cy="112" r="80" fill="#3B82F6" fillOpacity="0.12" />
      <path d="M0 45H400M0 90H400M0 135H400M0 180H400M80 0V225M160 0V225M240 0V225M320 0V225" stroke="#1E293B" strokeWidth="0.5" strokeOpacity="0.4" />
      <rect x="150" y="62" width="100" height="100" rx="16" fill="#0F172A" stroke="#3B82F6" strokeWidth="2" />
      <circle cx="180" cy="95" r="6" fill="#38BDF8" />
      <circle cx="220" cy="95" r="6" fill="#38BDF8" />
      <circle cx="200" cy="130" r="6" fill="#60A5FA" />
      <path d="M180 101V118C180 124 186 130 194 130M220 101V118C220 124 214 130 206 130" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />
      <text x="200" y="195" fill="#93C5FD" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
        {title ? title.slice(0, 30).toUpperCase() : "REAL-WORLD PRODUCTION CODEBASE"}
      </text>
    </svg>
  );
}
