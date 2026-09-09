"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  Compass, 
  Scale, 
  Award, 
  Briefcase, 
  Trophy, 
  Users 
} from "lucide-react";

export const WhySCTech = () => {
  const features = [
    {
      title: "Real World Experience",
      desc: "Work on production-grade repositories and engineering stacks.",
      icon: Compass,
      color: "text-blue-400",
      bg: "bg-blue-500/10 border-blue-500/20",
    },
    {
      title: "Industry Exposure",
      desc: "Connect directly with top technology founders and product managers.",
      icon: Scale,
      color: "text-indigo-400",
      bg: "bg-indigo-500/10 border-indigo-500/20",
    },
    {
      title: "Certificates & Recognition",
      desc: "Cryptographically verifiable certificates with QR verification.",
      icon: Award,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10 border-cyan-500/20",
    },
    {
      title: "Career Opportunities",
      desc: "Fast-track internship interviews and hiring pipelines.",
      icon: Briefcase,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
    },
    {
      title: "Hackathons & Rewards",
      desc: "Compete with developer peers and win attractive cash prizes.",
      icon: Trophy,
      color: "text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/20",
    },
    {
      title: "HR Interaction & Mentorship",
      desc: "Live interview prep, resume reviews, and leadership sessions.",
      icon: Users,
      color: "text-violet-400",
      bg: "bg-violet-500/10 border-violet-500/20",
    },
  ];

  return (
    <section className="py-16 bg-[#070B14] border-t border-slate-800/80 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
            Why SC TECH?
          </h2>
          <p className="text-xs text-slate-400 max-w-xl mx-auto mb-12">
            Empowering the next generation of engineers through verifiable experience, hackathons, and real-world internships.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
          {features.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                whileHover={{ y: -6, scale: 1.02 }}
                className="flex flex-col items-center text-center p-4 rounded-2xl bg-[#0C162E]/70 border border-slate-800 hover:border-blue-500/40 transition-all duration-300 group shadow-lg"
              >
                <div className={`w-12 h-12 rounded-2xl ${feat.bg} border flex items-center justify-center ${feat.color} mb-3 group-hover:scale-110 group-hover:rotate-6 transition-transform shadow-inner`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-xs font-bold text-white mb-1.5 leading-snug group-hover:text-blue-400 transition-colors">
                  {feat.title}
                </h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {feat.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
