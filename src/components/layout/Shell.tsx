"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
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
  FileText
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
  const [isDemoActive, setIsDemoActive] = useState(true);
  const [demoSwitching, setDemoSwitching] = useState(false);

  const navigationGroups: NavGroup[] = [
    {
      groupTitle: "Workspace",
      items: [
        { name: "Executive Dashboard", href: "/dashboard", icon: LayoutDashboard, isImplemented: true },
        { name: "My Work & Tasks", href: "/my-work", icon: CheckSquare, badge: "Planned", isImplemented: false },
        { name: "Notifications", href: "/notifications", icon: Bell, badge: "Planned", isImplemented: false },
        { name: "Global Search", href: "/search", icon: Search, badge: "Planned", isImplemented: false },
      ],
    },
    {
      groupTitle: "Business Development",
      items: [
        { name: "CRM & Leads", href: "/crm", icon: Users, isImplemented: true },
        { name: "Clients & Contacts", href: "/crm?tab=customers", icon: Building2, isImplemented: true },
        { name: "Estimates & BOQ", href: "/crm?tab=estimates", icon: FileSpreadsheet, isImplemented: true },
        { name: "Formal Quotations", href: "/quotations", icon: FileCheck, isImplemented: true },
        { name: "Contracts & Baseline", href: "/contracts", icon: FileText, badge: "Phase 3.3", isImplemented: false },
      ],
    },
    {
      groupTitle: "Project Execution",
      items: [
        { name: "Projects Portfolio", href: "/projects", icon: FolderKanban, badge: "Phase 4", isImplemented: false },
        { name: "Site Operations & Logs", href: "/site", icon: HardHat, badge: "Phase 4", isImplemented: false },
      ],
    },
    {
      groupTitle: "Finance & Treasury",
      items: [
        { name: "Income & Invoicing", href: "/finance/income", icon: Banknote, badge: "Phase 6", isImplemented: false },
        { name: "Expenses & Cost Control", href: "/finance/expenses", icon: Receipt, badge: "Phase 6", isImplemented: false },
        { name: "Treasury & Cash Flow", href: "/treasury", icon: Wallet, badge: "Phase 7", isImplemented: false },
      ],
    },
    {
      groupTitle: "Procurement & Resources",
      items: [
        { name: "Purchase Orders", href: "/procurement", icon: Truck, badge: "Phase 5", isImplemented: false },
        { name: "Inventory & Stores", href: "/inventory", icon: Package, badge: "Phase 5", isImplemented: false },
      ],
    },
    {
      groupTitle: "Knowledge & Operations",
      items: [
        { name: "Knowledge Base", href: "/knowledge", icon: BookOpen, badge: "Phase 8", isImplemented: false },
        { name: "Audit Trail", href: "/settings/audit", icon: Sliders, badge: "Active", isImplemented: true },
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
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <div className="md:hidden bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-600 rounded">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-sm tracking-tight">Construct OS</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1 rounded text-slate-300 hover:text-white"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`${
          mobileMenuOpen ? "block" : "hidden"
        } md:block w-full md:w-64 bg-slate-900 text-slate-300 flex-shrink-0 flex flex-col border-r border-slate-800`}
      >
        {/* Brand / Tenant Header */}
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg text-white">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white tracking-tight leading-tight">
                Apex BuildTech
              </div>
              <div className="text-xs text-indigo-400 font-medium">Enterprise OS</div>
            </div>
          </div>
          {/* Demo Tenant Badge */}
          <div className="mt-3 px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 rounded flex items-center justify-between text-xs text-amber-300 font-medium">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Demo Tenant Active
            </span>
            <span className="text-[10px] uppercase font-mono px-1 bg-amber-500/20 rounded">Dev</span>
          </div>
        </div>

        {/* Navigation Group Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navigationGroups.map((group) => (
            <div key={group.groupTitle}>
              <div className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                {group.groupTitle}
              </div>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = pathname === item.href || (item.href.includes("?") && pathname === item.href.split("?")[0]);
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={`flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                          isActive
                            ? "bg-indigo-600 text-white"
                            : item.isImplemented
                            ? "text-slate-200 hover:bg-slate-800 hover:text-white"
                            : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-300"
                        }`}
                      >
                        <span className="flex items-center gap-2.5 truncate">
                          <item.icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                          <span className="truncate">{item.name}</span>
                        </span>
                        {item.badge && (
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                              item.isImplemented
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                : "bg-slate-800 text-slate-400 border border-slate-700"
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

        {/* User / Session Switcher */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white">
                VM
              </div>
              <div className="text-left">
                <div className="text-xs font-medium text-white">Vikram Malhotra</div>
                <div className="text-[10px] text-slate-400">Managing Director</div>
              </div>
            </div>
          </div>
          <button
            onClick={handleQuickDemoLogin}
            disabled={demoSwitching}
            className="w-full text-center px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-medium border border-slate-700 transition flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            {demoSwitching ? "Syncing..." : "Sync Demo Session"}
          </button>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Universal Top Bar */}
        <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {pathname === "/dashboard"
                ? "Overview Dashboard"
                : pathname === "/crm"
                ? "CRM & Pipeline"
                : pathname === "/quotations"
                ? "Commercial Quotations"
                : "Operations Platform"}
            </span>
            <span className="text-slate-300">/</span>
            <span className="text-xs text-slate-700 font-mono">Branch: Bangalore HQ</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center text-xs text-slate-500 border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 gap-2">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span>Global Search (Cmd + K)</span>
            </div>
            <Link
              href="/crm"
              className="text-xs px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition"
            >
              + Quick Action
            </Link>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
