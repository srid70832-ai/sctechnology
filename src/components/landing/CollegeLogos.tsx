"use client";

import React from "react";
import { motion } from "framer-motion";
import { GraduationCap, Landmark, Award, BookOpen, School, Building2 } from "lucide-react";

export const CollegeLogos = () => {
  const colleges = [
    { name: "IIT Kharagpur", icon: Landmark, color: "text-indigo-400" },
    { name: "Anna University", icon: GraduationCap, color: "text-amber-400" },
    { name: "VIT", icon: Award, color: "text-blue-400" },
    { name: "SRM University", icon: Building2, color: "text-cyan-400" },
    { name: "Amrita Vishwa Vidyapeetham", icon: BookOpen, color: "text-rose-400" },
    { name: "RV College of Engineering", icon: School, color: "text-emerald-400" },
  ];

  return (
    <section className="py-12 bg-[#070B14] border-y border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-8"
        >
          Trusted by Students from Top Colleges & Universities
        </motion.p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-5 items-center justify-center">
          {colleges.map((c, i) => {
            const Icon = c.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                whileHover={{ y: -4 }}
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#0C162E]/50 border border-slate-800 hover:border-blue-500/40 transition-all duration-300 group shadow-md"
              >
                <div className={`w-10 h-10 rounded-full bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform ${c.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-slate-300 text-center leading-tight">
                  {c.name}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
