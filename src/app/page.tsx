import { Shield, Building2, HardHat, FileSpreadsheet, Banknote } from "lucide-react";

export default function HomePage() {
  return (
    <main className="max-w-5xl mx-auto px-6 py-12">
      <header className="border-b border-slate-200 pb-8 mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-slate-900 text-white rounded-lg">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Construct CRM & Project Operations
            </h1>
            <p className="text-sm text-slate-500">
              Production-Grade Construction Operations & Financial Control Engine
            </p>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-3 text-slate-900 font-semibold text-base">
            <Shield className="w-5 h-5 text-indigo-600" />
            <span>Architecture & Security Foundation</span>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Multi-tenant organization boundary, role-based access control (RBAC),
            cryptographic session management, server-side permission assertions, and append-only audit logging.
          </p>
        </div>

        <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-3 text-slate-900 font-semibold text-base">
            <Banknote className="w-5 h-5 text-emerald-600" />
            <span>Operational Finance Precision</span>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Decimal-safe arithmetic (20-digit precision) for contract values, change orders, progressive billing,
            and commitment ledgers without floating-point errors.
          </p>
        </div>
      </section>

      <div className="p-6 bg-slate-100 rounded-xl border border-slate-200 text-center">
        <p className="text-xs text-slate-500 font-mono">
          Phase 1 Foundation Active • Environment: PostgreSQL 18 Local / Isolated Test DB Verified
        </p>
      </div>
    </main>
  );
}

