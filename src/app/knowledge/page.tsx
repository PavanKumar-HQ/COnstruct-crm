"use client";

import React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/Shell";
import {
  BookOpen,
  Building2,
  Calendar,
  AlertTriangle,
  Plus,
  ArrowRight,
  TrendingUp,
  FileCheck2,
  Bookmark,
  ShieldCheck,
  CheckCircle2
} from "lucide-react";

export default function KnowledgeBasePage() {
  const articles: any[] = [];

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
                <BookOpen className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Operational Knowledge Base & Lessons Learned
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Standard operating procedures, quality specifications, site safety guidelines, and institutional memory.
            </p>
          </div>
        </div>

        {articles.length === 0 ? (
          <div className="liquid-glass-card rounded-2xl p-12 text-center border border-white/60">
            <BookOpen className="w-10 h-10 text-indigo-500 mx-auto mb-3 opacity-80" />
            <h3 className="text-sm font-semibold text-slate-800">No Knowledge Base Articles Published</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Centralized standard operating procedures (SOPs), concrete pour protocols, and compliance checklists will be published here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {articles.map((art) => (
              <div key={art.id} className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 flex flex-col justify-between space-y-3 hover:border-indigo-400 transition">
                <div className="text-xs font-bold text-slate-900 leading-snug">{art.title}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

