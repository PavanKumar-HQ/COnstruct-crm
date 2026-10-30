"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Kanban,
  CheckSquare,
  Users,
  Building2,
  FileSpreadsheet,
  FileCheck,
  FolderKanban,
  HardHat,
  Banknote,
  Receipt,
  CreditCard,
  Wallet,
  Truck,
  Package,
  BookOpen,
  FolderGit2,
  Sliders,
  Bell,
  Search,
  ChevronDown,
  Sparkles,
  ExternalLink,
  Menu,
  X,
  FileText,
  ShieldCheck
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: any;
  badge?: string;
  isImplemented: boolean;
}

interface NavGroup {
  groupTitle: string;
  items: NavItem[];
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoSwitching, setDemoSwitching] = useState(false);

  const navigationGroups: NavGroup[] = [
    {
      groupTitle: "Workspace",
      items: [
        { name: "Executive Dashboard", href: "/dashboard", icon: LayoutDashboard, isImplemented: true },
        { name: "Executive Pipeline", href: "/pipeline", icon: Kanban, badge: "Live", isImplemented: true },
        { name: "My Work & Tasks", href: "/my-work", icon: CheckSquare, badge: "Live", isImplemented: true },
      ],
    },
    {
      groupTitle: "Business Development",
      items: [
        { name: "CRM & Leads", href: "/crm", icon: Users, isImplemented: true },
        { name: "Formal Quotations", href: "/quotations", icon: FileCheck, isImplemented: true },
        { name: "Prime Contracts", href: "/contracts", icon: FileText, badge: "Live", isImplemented: true },
      ],
    },
    {
      groupTitle: "Project Execution",
      items: [
        { name: "Projects Portfolio", href: "/projects", icon: FolderKanban, badge: "Live", isImplemented: true },
        { name: "Site Operations & Logs", href: "/site", icon: HardHat, badge: "Live", isImplemented: true },
      ],
    },
    {
      groupTitle: "Finance & Treasury",
      items: [
        { name: "Income & Invoicing", href: "/finance/income", icon: Banknote, badge: "Live", isImplemented: true },
        { name: "Expenses & Cost Codes", href: "/finance/expenses", icon: Receipt, badge: "Live", isImplemented: true },
        { name: "Treasury & Cash Flow", href: "/treasury", icon: Wallet, badge: "Live", isImplemented: true },
      ],
    },
    {
      groupTitle: "Procurement & Resources",
      items: [
        { name: "Purchase Orders", href: "/procurement", icon: Truck, badge: "Live", isImplemented: true },
        { name: "Inventory & Stores", href: "/inventory", icon: Package, badge: "Live", isImplemented: true },
      ],
    },
    {
      groupTitle: "Knowledge & Compliance",
      items: [
        { name: "Knowledge Base", href: "/knowledge", icon: BookOpen, badge: "Live", isImplemented: true },
        { name: "Audit Trail", href: "/settings/audit", icon: Sliders, badge: "Protected", isImplemented: true },
      ],
    },
  ];

  const handleQuickDemoLogin = async () => {
    setDemoSwitching(true);
    try {
      const res = await fetch("/api/auth/demo-session", { method: "POST" });
      if (res.ok) {
        window.location.reload();
      } else {
        alert("Demo organization not seeded. Run 'pnpm db:seed:demo' in terminal.");
      }
    } catch {
      alert("Failed to activate demo session");
    } finally {
      setDemoSwitching(false);
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden liquid-bg flex flex-col md:flex-row text-slate-800">
      {/* Mobile Top Header with Liquid Glass */}
      <div className="md:hidden liquid-glass-dark text-white px-4 py-3 flex items-center justify-between border-b border-white/10 z-30 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 liquid-glass-button-primary rounded-xl">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-sm tracking-tight text-white/95">Construct OS</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 rounded-lg liquid-glass-subtle text-slate-200 hover:text-white"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Backdrop for Mobile Menu */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-slate-950/60 backdrop-blur-md z-30 transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation with Apple Liquid Glass Translucency */}
      <aside
        className={`${
          mobileMenuOpen
            ? "fixed inset-y-0 left-0 z-40 w-72 flex flex-col"
            : "hidden"
        } md:flex md:static md:w-64 md:h-full liquid-glass-sidebar text-slate-300 flex-shrink-0 flex-col z-20`}
      >
        {/* Brand / Tenant Header */}
        <div className="p-4 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 liquid-glass-button-primary rounded-xl shadow-lg">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white tracking-tight leading-tight">
                  Apex BuildTech
                </div>
                <div className="text-[11px] text-indigo-300 font-medium tracking-wide">Enterprise OS</div>
              </div>
            </div>
            {mobileMenuOpen && (
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="md:hidden p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          {/* Active Organization Badge with Frosted Pill */}
          <div className="mt-3 px-2.5 py-1.5 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between text-xs text-slate-300 font-medium backdrop-blur-md">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse"></span>
              <span className="text-[11px] text-slate-200">Live Organization</span>
            </span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-md">Active</span>
          </div>
        </div>

        {/* Navigation Group Items (Dedicated Independent Scroll) */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-4 space-y-6">
          {navigationGroups.map((group) => (
            <div key={group.groupTitle}>
              <div className="px-3 text-[10px] font-bold text-slate-400/80 uppercase tracking-wider mb-2">
                {group.groupTitle}
              </div>
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
                          isActive
                            ? "bg-white/15 text-white font-semibold shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)] border border-white/20 backdrop-blur-md"
                            : "text-slate-300 hover:bg-white/10 hover:text-white border border-transparent"
                        }`}
                      >
                        <span className="flex items-center gap-2.5 truncate">
                          <item.icon className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${isActive ? "text-indigo-300" : "text-slate-400"}`} />
                          <span className="truncate">{item.name}</span>
                        </span>
                        {item.badge && (
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                              item.badge === "Live"
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.2)]"
                                : "bg-white/10 text-slate-300 border border-white/15"
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* User / Session Switcher (Liquid Glass Footer) */}
        <div className="p-3 border-t border-white/10 bg-slate-950/40 backdrop-blur-xl flex-shrink-0">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white shadow-md">
                VM
              </div>
              <div className="text-left">
                <div className="text-xs font-semibold text-white/90">Vikram Malhotra</div>
                <div className="text-[10px] text-slate-400">Managing Director</div>
              </div>
            </div>
          </div>
          <button
            onClick={handleQuickDemoLogin}
            disabled={demoSwitching}
            className="w-full text-center px-2 py-1.5 liquid-glass-subtle hover:bg-white/20 text-slate-200 rounded-xl text-[11px] font-medium border border-white/15 transition flex items-center justify-center gap-1.5 shadow-xs"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            {demoSwitching ? "Re-authorizing..." : "Active Session"}
          </button>
        </div>
      </aside>

      {/* Main Content Viewport with Separate Independent Scroll and Apple Liquid Glass Canopy */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-slate-50/60 backdrop-blur-3xl">
        {/* Universal Liquid Top Bar */}
        <header className="liquid-glass-header px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between flex-shrink-0 z-10">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider truncate">
              {pathname === "/dashboard"
                ? "Executive Overview"
                : pathname === "/pipeline"
                ? "Executive Pipeline"
                : pathname === "/projects"
                ? "Projects Portfolio"
                : pathname === "/crm"
                ? "CRM & Pipeline"
                : pathname === "/quotations"
                ? "Commercial Quotations"
                : pathname === "/contracts"
                ? "Prime Contracts"
                : pathname === "/treasury"
                ? "Treasury & Cash"
                : pathname === "/finance/income"
                ? "Income & Invoicing"
                : pathname === "/finance/expenses"
                ? "Expenses & Costs"
                : pathname === "/procurement"
                ? "Procurement & POs"
                : pathname === "/inventory"
                ? "Inventory & Stores"
                : pathname === "/knowledge"
                ? "Knowledge Base"
                : pathname === "/my-work"
                ? "My Work"
                : "Operations Platform"}
            </span>
            <span className="hidden sm:inline text-slate-400">/</span>
            <span className="hidden sm:inline text-xs text-slate-500 font-mono">Bangalore HQ</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <Link
              href="/pipeline"
              className="text-xs px-3 py-1.5 liquid-glass-subtle hover:bg-white/70 text-indigo-700 rounded-xl font-semibold transition flex items-center gap-1.5 border border-indigo-200/50 shadow-xs"
            >
              <Kanban className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Executive Pipeline</span>
              <span className="sm:hidden">Pipeline</span>
            </Link>
            <Link
              href="/crm"
              className="text-xs px-3.5 py-1.5 liquid-glass-button-primary text-white rounded-xl font-medium transition"
            >
              + Quick Action
            </Link>
          </div>
        </header>

        {/* Page Content Body (Independently Scrollable Container with Liquid Atmosphere) */}
        <main className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
