"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Target,
  Plus,
  Search,
  Calendar,
  CheckSquare,
  Building2,
  ShieldCheck,
  ChevronRight,
  AlertCircle,
  Clock,
  ArrowRightCircle,
  MapPin,
  FileText,
  Phone,
  Mail,
  CheckCircle2,
  XCircle,
  CalendarDays,
  Compass,
  ArrowLeft,
  FileSpreadsheet,
  Layers,
  Calculator,
  Percent,
  TrendingUp
} from "lucide-react";

interface Lead {
  id: string;
  title: string;
  source: string;
  status: string;
  priority: string;
  estimatedBudget: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  siteAddress: string | null;
  requirements: string | null;
  convertedAt: string | null;
  createdAt: string;
  customerId?: string | null;
  customer?: { id: string; name: string } | null;
  assignedTo?: { id: string; fullName: string; email: string } | null;
  siteVisits?: SiteVisit[];
  activities?: Activity[];
  estimates?: EstimateSummary[];
}

interface SiteVisit {
  id: string;
  scheduledDate: string;
  status: string;
  siteAddress: string;
  notes?: string | null;
  outcomeNotes?: string | null;
  measurements?: any;
  completedAt?: string | null;
  assignedTo?: { id: string; fullName: string };
}

interface Activity {
  id: string;
  type: string;
  subject: string;
  description?: string | null;
  dueDate?: string | null;
  status: string;
  priority: string;
  outcomeNotes?: string | null;
  completedAt?: string | null;
  assignedTo?: { id: string; fullName: string };
}

interface EstimateSummary {
  id: string;
  estimateNumber: string;
  title: string;
  currentVersion: number;
  status: string;
  createdAt: string;
  revisions?: Array<{
    id: string;
    versionNumber: number;
    totalCost: string;
    sellingPricePreTax: string;
    totalAmount: string;
    status: string;
  }>;
}

interface BoqItemForm {
  itemCode: string;
  category: string;
  description: string;
  unit: string;
  quantity: number;
  materialRate: number;
  labourRate: number;
  equipmentRate: number;
  subcontractRate: number;
}

interface Customer {
  id: string;
  name: string;
  companyName: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  notes?: string | null;
  createdAt: string;
  contacts?: any[];
  leads?: any[];
  activities?: any[];
  siteVisits?: any[];
  estimates?: any[];
  _count?: { leads: number; activities: number; siteVisits: number };
}

export default function CRMApp() {
  const [activeTab, setActiveTab] = useState<"leads" | "customers" | "estimates">("leads");
  const [showNewLeadModal, setShowNewLeadModal] = useState<boolean>(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [estimatesList, setEstimatesList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Detail views
  const [activeLeadDetail, setActiveLeadDetail] = useState<Lead | null>(null);
  const [activeCustomerDetail, setActiveCustomerDetail] = useState<Customer | null>(null);
  const [activeEstimateDetail, setActiveEstimateDetail] = useState<any | null>(null);

  // Modals
  const [showStatusModal, setShowStatusModal] = useState<boolean>(false);
  const [statusUpdate, setStatusUpdate] = useState<string>("");
  const [lossReason, setLossReason] = useState<string>("");

  const [showScheduleModal, setShowScheduleModal] = useState<boolean>(false);
  const [scheduleData, setScheduleData] = useState({
    scheduledDate: "",
    siteAddress: "",
    notes: "",
  });

  const [showOutcomeModal, setShowOutcomeModal] = useState<SiteVisit | null>(null);
  const [outcomeData, setOutcomeData] = useState({
    outcomeNotes: "",
    plotAreaSqFt: "",
    roadWidthMeters: "",
  });

  const [showActivityModal, setShowActivityModal] = useState<boolean>(false);
  const [activityData, setActivityData] = useState({
    type: "CALL",
    subject: "",
    description: "",
    dueDate: "",
    priority: "MEDIUM",
  });

  // BOQ / Estimate Creation Modal
  const [showEstimateModal, setShowEstimateModal] = useState<boolean>(false);
  const [estimateFormData, setEstimateFormData] = useState({
    title: "Structural & Finishing Estimate",
    markupPercentage: 15,
    taxPercentage: 18,
    notes: "",
  });
  const [boqItemsList, setBoqItemsList] = useState<BoqItemForm[]>([
    {
      itemCode: "EXC-01",
      category: "EXCAVATION",
      description: "Earth work excavation by mechanical means in ordinary soil",
      unit: "cu.m",
      quantity: 250,
      materialRate: 0,
      labourRate: 140,
      equipmentRate: 160,
      subcontractRate: 0,
    },
    {
      itemCode: "RCC-M25",
      category: "SUPERSTRUCTURE_RCC",
      description: "M25 grade ready-mix concrete in columns, beams and suspended slabs",
      unit: "cu.m",
      quantity: 80,
      materialRate: 5200,
      labourRate: 1600,
      equipmentRate: 450,
      subcontractRate: 250,
    },
  ]);

  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // New Lead Form state
  const [newLeadForm, setNewLeadForm] = useState({
    title: "",
    source: "Direct Referral",
    priority: "MEDIUM",
    estimatedBudget: "",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    siteAddress: "",
    requirements: "",
  });

  const fetchLeads = async () => {
    setLoading(true);
    setError(null);
    try {
      let res = await fetch(`/api/leads?search=${encodeURIComponent(search)}`);
      if (!res.ok && res.status === 401) {
        // Auto-bootstrap demo session if unauthorized in development
        const authRes = await fetch("/api/auth/demo-session", { method: "POST" });
        if (authRes.ok) {
          res = await fetch(`/api/leads?search=${encodeURIComponent(search)}`);
        }
      }

      if (!res.ok) {
        if (res.status === 401) {
          setError("Session required: Click 'Demo Quick Login' below or in the sidebar to authenticate.");
          setLeads([]);
          return;
        }
        throw new Error("Failed to load leads from database");
      }
      const data = await res.json();
      setLeads(data.items || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeadDetail = async (leadId: string) => {
    try {
      const res = await fetch(`/api/leads/${leadId}`);
      if (!res.ok) throw new Error("Could not load lead details");
      const data = await res.json();
      setActiveLeadDetail(data);

      // Also query linked estimates
      const estRes = await fetch(`/api/estimates?leadId=${leadId}`);
      if (estRes.ok) {
        const estData = await estRes.json();
        setActiveLeadDetail((prev: any) => ({ ...prev, estimates: estData }));
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const fetchCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      let res = await fetch(`/api/customers?search=${encodeURIComponent(search)}`);
      if (!res.ok && res.status === 401) {
        const authRes = await fetch("/api/auth/demo-session", { method: "POST" });
        if (authRes.ok) {
          res = await fetch(`/api/customers?search=${encodeURIComponent(search)}`);
        }
      }
      if (!res.ok) {
        if (res.status === 401) {
          setError("Session required: Log in to view live organization data");
          setCustomers([]);
          return;
        }
        throw new Error("Failed to load customers from database");
      }
      const data = await res.json();
      setCustomers(data.items || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerDetail = async (customerId: string) => {
    try {
      const res = await fetch(`/api/customers/${customerId}`);
      if (!res.ok) throw new Error("Could not load customer details");
      const data = await res.json();
      setActiveCustomerDetail(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const fetchEstimates = async () => {
    setLoading(true);
    setError(null);
    try {
      let res = await fetch(`/api/estimates?search=${encodeURIComponent(search)}`);
      if (!res.ok && res.status === 401) {
        const authRes = await fetch("/api/auth/demo-session", { method: "POST" });
        if (authRes.ok) {
          res = await fetch(`/api/estimates?search=${encodeURIComponent(search)}`);
        }
      }
      if (!res.ok) {
        if (res.status === 401) {
          setError("Session required");
          return;
        }
        throw new Error("Failed to load estimates");
      }
      const data = await res.json();
      setEstimatesList(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchEstimateDetail = async (estimateId: string) => {
    try {
      const res = await fetch(`/api/estimates/${estimateId}`);
      if (!res.ok) throw new Error("Could not load estimate");
      const data = await res.json();
      setActiveEstimateDetail(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    if (activeTab === "leads") {
      fetchLeads();
    } else if (activeTab === "customers") {
      fetchCustomers();
    } else if (activeTab === "estimates") {
      fetchEstimates();
    }
  }, [activeTab, search]);

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const payload: any = {
        title: newLeadForm.title,
        source: newLeadForm.source,
        priority: newLeadForm.priority,
        contactName: newLeadForm.contactName || undefined,
        contactPhone: newLeadForm.contactPhone || undefined,
        contactEmail: newLeadForm.contactEmail || undefined,
        siteAddress: newLeadForm.siteAddress || undefined,
        requirements: newLeadForm.requirements || undefined,
      };

      if (newLeadForm.estimatedBudget) {
        payload.estimatedBudget = parseFloat(newLeadForm.estimatedBudget);
      }

      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create lead record");

      setSuccessMsg(`Lead "${json.title}" created successfully.`);
      setNewLeadForm({
        title: "",
        source: "Direct Referral",
        priority: "MEDIUM",
        estimatedBudget: "",
        contactName: "",
        contactPhone: "",
        contactEmail: "",
        siteAddress: "",
        requirements: "",
      });
      setActiveTab("leads");
      fetchLeads();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!activeLeadDetail || !statusUpdate) return;
    setActionLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/leads/${activeLeadDetail.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: statusUpdate,
          lossReason: statusUpdate === "LOST" ? lossReason : null,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update lead status");

      setSuccessMsg(`Status updated to ${json.status}.`);
      setShowStatusModal(false);
      setStatusUpdate("");
      setLossReason("");
      fetchLeadDetail(activeLeadDetail.id);
      fetchLeads();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleScheduleSiteVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLeadDetail) return;
    setActionLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/site-visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: activeLeadDetail.id,
          assignedToId: activeLeadDetail.assignedTo?.id || "00000000-0000-0000-0000-000000000000",
          scheduledDate: new Date(scheduleData.scheduledDate).toISOString(),
          siteAddress: scheduleData.siteAddress || activeLeadDetail.siteAddress || "Site Location",
          notes: scheduleData.notes || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to schedule site visit");

      setSuccessMsg("Site visit scheduled successfully.");
      setShowScheduleModal(false);
      setScheduleData({ scheduledDate: "", siteAddress: "", notes: "" });
      fetchLeadDetail(activeLeadDetail.id);
      fetchLeads();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecordVisitOutcome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showOutcomeModal || !activeLeadDetail) return;
    setActionLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const measurements: any = {};
      if (outcomeData.plotAreaSqFt) measurements.plotAreaSqFt = parseFloat(outcomeData.plotAreaSqFt);
      if (outcomeData.roadWidthMeters) measurements.roadWidthMeters = parseFloat(outcomeData.roadWidthMeters);

      const res = await fetch(`/api/site-visits/${showOutcomeModal.id}/outcome`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          outcomeNotes: outcomeData.outcomeNotes,
          measurements: Object.keys(measurements).length > 0 ? measurements : undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to record outcome");

      setSuccessMsg("Site visit outcome and measurements recorded.");
      setShowOutcomeModal(null);
      setOutcomeData({ outcomeNotes: "", plotAreaSqFt: "", roadWidthMeters: "" });
      fetchLeadDetail(activeLeadDetail.id);
      fetchLeads();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLeadDetail) return;
    setActionLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: activeLeadDetail.id,
          type: activityData.type,
          subject: activityData.subject,
          description: activityData.description || undefined,
          dueDate: activityData.dueDate ? new Date(activityData.dueDate).toISOString() : undefined,
          priority: activityData.priority,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create activity");

      setSuccessMsg("Follow-up task created.");
      setShowActivityModal(false);
      setActivityData({ type: "CALL", subject: "", description: "", dueDate: "", priority: "MEDIUM" });
      fetchLeadDetail(activeLeadDetail.id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteActivity = async (activityId: string) => {
    if (!activeLeadDetail) return;
    setActionLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/activities/${activityId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outcomeNotes: "Completed through CRM dashboard" }),
      });
      if (!res.ok) throw new Error("Failed to complete task");
      setSuccessMsg("Task marked as completed.");
      fetchLeadDetail(activeLeadDetail.id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConvertLead = async (leadId: string) => {
    setActionLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/leads/${leadId}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Lead conversion failed");

      setSuccessMsg(`Lead converted into Customer "${json.customer.name}" transactionally.`);
      if (activeLeadDetail) {
        fetchLeadDetail(leadId);
      }
      fetchLeads();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateEstimate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLeadDetail) return;
    setActionLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/estimates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: estimateFormData.title,
          leadId: activeLeadDetail.id,
          markupPercentage: Number(estimateFormData.markupPercentage),
          taxPercentage: Number(estimateFormData.taxPercentage),
          notes: estimateFormData.notes || undefined,
          items: boqItemsList,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create BOQ Estimate");

      setSuccessMsg(`Estimate ${json.estimate.estimateNumber} generated successfully.`);
      setShowEstimateModal(false);
      fetchLeadDetail(activeLeadDetail.id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveRevision = async (estimateId: string, revisionId: string) => {
    setActionLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/estimates/${estimateId}/revisions/${revisionId}/approve`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to approve revision");
      setSuccessMsg("Estimate revision approved as official baseline.");
      fetchEstimateDetail(estimateId);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800">
        <div className="p-5 border-b border-slate-800 flex items-center gap-3">
          <div className="p-1.5 bg-blue-600 rounded text-white">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white tracking-wide">CONSTRUCT CRM</h2>
            <p className="text-xs text-slate-400">Operations & BOQ</p>
          </div>
        </div>

        <nav className="p-4 space-y-1.5 flex-1">
          <a
            href="/dashboard"
            className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-left transition-colors text-slate-300 hover:bg-slate-800/60 hover:text-white"
          >
            <Building2 className="w-4 h-4 text-indigo-400" />
            <span>&larr; Executive Dashboard</span>
          </a>
          <button
            onClick={() => { setActiveTab("leads"); setActiveLeadDetail(null); setActiveCustomerDetail(null); setActiveEstimateDetail(null); }}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-left transition-colors ${
              activeTab === "leads" && !activeCustomerDetail && !activeEstimateDetail ? "bg-slate-800 text-white font-semibold" : "hover:bg-slate-800/60 text-slate-300"
            }`}
          >
            <Target className="w-4 h-4 text-blue-400" />
            <span>Leads & Pipeline</span>
          </button>
          <button
            onClick={() => { setActiveTab("estimates"); setActiveLeadDetail(null); setActiveCustomerDetail(null); setActiveEstimateDetail(null); }}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-left transition-colors ${
              activeTab === "estimates" && !activeEstimateDetail ? "bg-slate-800 text-white font-semibold" : "hover:bg-slate-800/60 text-slate-300"
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-amber-400" />
            <span>BOQ & Estimates</span>
          </button>
          <a
            href="/quotations"
            className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-left transition-colors text-slate-300 hover:bg-slate-800/60 hover:text-white"
          >
            <FileText className="w-4 h-4 text-blue-400" />
            <span>Formal Quotations</span>
          </a>
          <button
            onClick={() => { setActiveTab("customers"); setActiveLeadDetail(null); setActiveCustomerDetail(null); setActiveEstimateDetail(null); }}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-left transition-colors ${
              activeTab === "customers" ? "bg-slate-800 text-white font-semibold" : "hover:bg-slate-800/60 text-slate-300"
            }`}
          >
            <Users className="w-4 h-4 text-emerald-400" />
            <span>Customers & Accounts</span>
          </button>
          <button
            onClick={() => setShowNewLeadModal(true)}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-left transition-colors hover:bg-slate-800/60 text-slate-300"
          >
            <Plus className="w-4 h-4 text-indigo-400" />
            <span>Create New Lead</span>
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800 text-xs text-slate-400">
          <button
            onClick={async () => {
              const res = await fetch("/api/auth/demo-session", { method: "POST" });
              if (res.ok) {
                window.location.reload();
              }
            }}
            className="w-full mb-3 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium text-xs text-center transition shadow-xs"
          >
            Sync Demo Session
          </button>
          <div className="flex items-center gap-2 mb-1 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Phase 3.2 Operations Engine</span>
          </div>
          <p>Database: PostgreSQL 18 Local</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-auto">
        {/* Feedback banners */}
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-center gap-3 text-sm">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center gap-3 text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* 1. ESTIMATE DETAIL & REVISION VIEW */}
        {activeEstimateDetail && (
          <div>
            <button
              onClick={() => setActiveEstimateDetail(null)}
              className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-800 mb-4 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Estimates List</span>
            </button>

            <header className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-xl font-bold text-slate-900">{activeEstimateDetail.title}</h1>
                  <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded font-semibold border border-slate-200">
                    {activeEstimateDetail.estimateNumber}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    activeEstimateDetail.status === "APPROVED" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                  }`}>
                    {activeEstimateDetail.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Version: v{activeEstimateDetail.currentVersion} • Client: {activeEstimateDetail.customer?.name || activeEstimateDetail.lead?.title || "Direct Estimate"}
                </p>
              </div>
            </header>

            {/* Revisions Stack */}
            <div className="space-y-6">
              {activeEstimateDetail.revisions.map((rev: any) => (
                <div key={rev.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-slate-800">Revision {rev.versionNumber}</span>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        rev.status === "APPROVED" ? "bg-emerald-100 text-emerald-800" :
                        rev.status === "SUPERSEDED" ? "bg-slate-200 text-slate-600" :
                        "bg-blue-100 text-blue-800"
                      }`}>
                        {rev.status}
                      </span>
                      <span className="text-xs text-slate-400">Created: {new Date(rev.createdAt).toLocaleDateString()}</span>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-mono">
                      <div><span className="text-slate-400">Cost:</span> ₹{parseFloat(rev.totalCost).toLocaleString()}</div>
                      <div><span className="text-slate-400">Markup:</span> {rev.markupPercentage}%</div>
                      <div><span className="text-slate-400">Pre-Tax:</span> ₹{parseFloat(rev.sellingPricePreTax).toLocaleString()}</div>
                      <div className="font-bold text-slate-900"><span className="text-slate-400">Total:</span> ₹{parseFloat(rev.totalAmount).toLocaleString()}</div>
                      <div><span className="text-emerald-600 font-semibold">Margin: {rev.estimatedMargin}%</span></div>

                      {rev.status !== "APPROVED" && (
                        <button
                          onClick={() => handleApproveRevision(activeEstimateDetail.id, rev.id)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-sans font-medium"
                        >
                          Approve Baseline
                        </button>
                      )}
                    </div>
                  </div>

                  {/* BOQ Line Items Table */}
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-white text-slate-500 uppercase tracking-wider border-b border-slate-100">
                      <tr>
                        <th className="px-4 py-2.5">Code</th>
                        <th className="px-4 py-2.5">Category</th>
                        <th className="px-4 py-2.5">Description</th>
                        <th className="px-4 py-2.5">Qty / Unit</th>
                        <th className="px-4 py-2.5">Unit Cost</th>
                        <th className="px-4 py-2.5">Selling Rate</th>
                        <th className="px-4 py-2.5 text-right">Selling Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rev.items.map((item: any) => (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-2.5 font-mono text-slate-900">{item.itemCode}</td>
                          <td className="px-4 py-2.5 text-slate-500">{item.category}</td>
                          <td className="px-4 py-2.5 max-w-xs">{item.description}</td>
                          <td className="px-4 py-2.5 font-mono">{parseFloat(item.quantity)} {item.unit}</td>
                          <td className="px-4 py-2.5 font-mono">₹{parseFloat(item.unitCostRate).toLocaleString()}</td>
                          <td className="px-4 py-2.5 font-mono">₹{parseFloat(item.sellingRate).toLocaleString()}</td>
                          <td className="px-4 py-2.5 font-mono text-right font-semibold text-slate-900">
                            ₹{parseFloat(item.totalSellingPrice).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. ESTIMATES LIST TAB */}
        {activeTab === "estimates" && !activeEstimateDetail && (
          <div>
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">BOQ & Estimates Register</h1>
                <p className="text-sm text-slate-500 mt-1">Version-controlled commercial estimation engine with exact decimal rates.</p>
              </div>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search estimate number, title..."
                  className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </header>

            {loading ? (
              <div className="p-12 text-center text-sm text-slate-500 bg-white rounded-xl border border-slate-200">
                Querying database records...
              </div>
            ) : estimatesList.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
                <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-medium text-slate-800">No Estimates Created Yet</h3>
                <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
                  Open any Lead from the Leads Pipeline and click &ldquo;Generate BOQ Estimate&rdquo;.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3">Estimate Number</th>
                      <th className="px-6 py-3">Title / Scope</th>
                      <th className="px-6 py-3">Associated Account</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Latest Value</th>
                      <th className="px-6 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {estimatesList.map((est) => (
                      <tr key={est.id} className="hover:bg-slate-50/60 transition">
                        <td className="px-6 py-4 font-mono font-medium text-blue-600">
                          {est.estimateNumber}
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-900">
                          <div>{est.title}</div>
                          <span className="text-xs text-slate-400 font-normal">v{est.currentVersion} latest</span>
                        </td>
                        <td className="px-6 py-4 text-xs">
                          {est.customer?.name || est.lead?.title || "—"}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            est.status === "APPROVED" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                          }`}>
                            {est.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-900">
                          {est.revisions?.[0]?.totalAmount ? `₹${parseFloat(est.revisions[0].totalAmount).toLocaleString()}` : "—"}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => fetchEstimateDetail(est.id)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >
                            View BOQ &rarr;
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 3. LEAD DETAIL VIEW */}
        {activeLeadDetail && !activeEstimateDetail && (
          <div>
            <button
              onClick={() => setActiveLeadDetail(null)}
              className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-800 mb-4 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Leads List</span>
            </button>

            <header className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-xl font-bold text-slate-900">{activeLeadDetail.title}</h1>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    activeLeadDetail.status === "WON" ? "bg-emerald-100 text-emerald-800" :
                    activeLeadDetail.status === "LOST" ? "bg-rose-100 text-rose-800" :
                    "bg-blue-100 text-blue-800"
                  }`}>
                    {activeLeadDetail.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Source: {activeLeadDetail.source} • Priority: {activeLeadDetail.priority} • Created: {new Date(activeLeadDetail.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowEstimateModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-sm"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Generate BOQ Estimate</span>
                </button>
                <button
                  onClick={() => { setStatusUpdate(activeLeadDetail.status); setShowStatusModal(true); }}
                  className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  Change Status
                </button>
                <button
                  onClick={() => setShowScheduleModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Schedule Site Visit</span>
                </button>
                {!activeLeadDetail.convertedAt && activeLeadDetail.status !== "LOST" && (
                  <button
                    onClick={() => handleConvertLead(activeLeadDetail.id)}
                    disabled={actionLoading}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm"
                  >
                    <ArrowRightCircle className="w-3.5 h-3.5" />
                    <span>Convert to Customer</span>
                  </button>
                )}
              </div>
            </header>

            {/* Estimates on Lead Detail */}
            {activeLeadDetail.estimates && activeLeadDetail.estimates.length > 0 && (
              <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-5 mb-8">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                    <FileSpreadsheet className="w-4 h-4 text-amber-600" />
                    <span>Generated BOQ Estimates for Opportunity</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeLeadDetail.estimates.map((est: any) => (
                    <div key={est.id} className="p-4 bg-white rounded-lg border border-amber-200 shadow-sm flex items-center justify-between">
                      <div>
                        <span className="font-mono text-xs text-blue-600 font-semibold">{est.estimateNumber}</span>
                        <div className="text-sm font-semibold text-slate-800">{est.title}</div>
                        <span className="text-xs text-slate-500">v{est.currentVersion} • Status: {est.status}</span>
                      </div>
                      <button
                        onClick={() => fetchEstimateDetail(est.id)}
                        className="px-3 py-1.5 bg-slate-900 text-white rounded text-xs font-medium hover:bg-slate-800"
                      >
                        Open BOQ
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Lead Info */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Commercial & Contact</h3>
                <div>
                  <span className="text-xs text-slate-400">Contact Person</span>
                  <div className="text-sm font-medium text-slate-800">{activeLeadDetail.contactName || "None"}</div>
                  <div className="text-xs text-slate-500">{activeLeadDetail.contactPhone}</div>
                  <div className="text-xs text-slate-500">{activeLeadDetail.contactEmail}</div>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Estimated Budget</span>
                  <div className="text-sm font-semibold text-slate-900 font-mono">
                    {activeLeadDetail.estimatedBudget ? `₹${parseFloat(activeLeadDetail.estimatedBudget).toLocaleString()}` : "Not estimated"}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Site Location</span>
                  <div className="text-xs text-slate-700 mt-0.5">{activeLeadDetail.siteAddress || "Not specified"}</div>
                </div>
              </div>

              {/* Site Visits */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Site Visits & Inspections</h3>
                  <button
                    onClick={() => setShowScheduleModal(true)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    + Schedule
                  </button>
                </div>

                {!activeLeadDetail.siteVisits || activeLeadDetail.siteVisits.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-lg">
                    No site visits scheduled yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeLeadDetail.siteVisits.map((sv) => (
                      <div key={sv.id} className="p-3.5 bg-slate-50 rounded-lg border border-slate-100 text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-800">{new Date(sv.scheduledDate).toLocaleString()}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            sv.status === "COMPLETED" ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
                          }`}>
                            {sv.status}
                          </span>
                        </div>
                        <div className="text-slate-500">{sv.siteAddress}</div>
                        {sv.outcomeNotes && (
                          <div className="p-2 bg-white rounded border border-slate-200 text-slate-700 mt-2">
                            <span className="font-medium text-slate-900">Outcome:</span> {sv.outcomeNotes}
                          </div>
                        )}
                        {sv.status === "SCHEDULED" && (
                          <div className="pt-1 flex justify-end">
                            <button
                              onClick={() => setShowOutcomeModal(sv)}
                              className="text-blue-600 hover:text-blue-800 font-medium text-xs"
                            >
                              Record Outcome
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tasks & Activities */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Activities & Tasks</h3>
                  <button
                    onClick={() => setShowActivityModal(true)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    + Add Task
                  </button>
                </div>

                {!activeLeadDetail.activities || activeLeadDetail.activities.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-lg">
                    No follow-up tasks logged.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeLeadDetail.activities.map((act) => (
                      <div key={act.id} className="p-3.5 bg-slate-50 rounded-lg border border-slate-100 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-800">{act.subject}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            act.status === "COMPLETED" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                          }`}>
                            {act.status}
                          </span>
                        </div>
                        {act.status === "PENDING" && (
                          <div className="pt-1 flex justify-end">
                            <button
                              onClick={() => handleCompleteActivity(act.id)}
                              className="text-emerald-600 hover:text-emerald-800 font-medium text-xs"
                            >
                              Mark Completed
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 4. MAIN LEADS TABLE TAB */}
        {activeTab === "leads" && !activeLeadDetail && !activeCustomerDetail && !activeEstimateDetail && (
          <div>
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Leads & Opportunities</h1>
                <p className="text-sm text-slate-500 mt-1">Live persisted CRM records with verified status progression.</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by title, contact, phone..."
                    className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={() => setShowNewLeadModal(true)}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Lead</span>
                </button>
              </div>
            </header>

            {loading ? (
              <div className="p-12 text-center text-sm text-slate-500 bg-white rounded-xl border border-slate-200">
                Querying database records...
              </div>
            ) : leads.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
                <Target className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-medium text-slate-800">No Leads Found</h3>
                <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
                  Truthful database state. Click &ldquo;New Lead&rdquo; to add a verified sales enquiry.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3">Lead Title</th>
                      <th className="px-6 py-3">Contact</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Budget</th>
                      <th className="px-6 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {leads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-slate-50/60 transition">
                        <td className="px-6 py-4 font-medium text-slate-900">
                          <button
                            onClick={() => fetchLeadDetail(lead.id)}
                            className="text-left hover:text-blue-600 hover:underline"
                          >
                            <div>{lead.title}</div>
                          </button>
                          <span className="text-xs text-slate-400 font-normal">{lead.source}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div>{lead.contactName || "—"}</div>
                          <div className="text-xs text-slate-400">{lead.contactPhone || lead.contactEmail || "No contact info"}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            lead.status === "WON" ? "bg-emerald-100 text-emerald-800" :
                            lead.status === "LOST" ? "bg-rose-100 text-rose-800" :
                            "bg-blue-100 text-blue-800"
                          }`}>
                            {lead.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs">
                          {lead.estimatedBudget ? `₹${parseFloat(lead.estimatedBudget).toLocaleString()}` : "Not estimated"}
                        </td>
                        <td className="px-6 py-4 space-x-2">
                          <button
                            onClick={() => fetchLeadDetail(lead.id)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Manage Lead &rarr;
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 5. CUSTOMERS DIRECTORY TAB */}
        {activeTab === "customers" && !activeCustomerDetail && (
          <div>
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Customer Directory</h1>
                <p className="text-sm text-slate-500 mt-1">Verified accounts and converted client stakeholders.</p>
              </div>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search customers..."
                  className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </header>

            {loading ? (
              <div className="p-12 text-center text-sm text-slate-500 bg-white rounded-xl border border-slate-200">
                Querying database records...
              </div>
            ) : customers.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
                <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-medium text-slate-800">No Customers Found</h3>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3">Customer Name</th>
                      <th className="px-6 py-3">Contact Details</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Associated Records</th>
                      <th className="px-6 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customers.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/60 transition">
                        <td className="px-6 py-4 font-medium text-slate-900">
                          <button
                            onClick={() => fetchCustomerDetail(c.id)}
                            className="text-left hover:text-blue-600 hover:underline"
                          >
                            <div>{c.name}</div>
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <div>{c.email || "—"}</div>
                          <div className="text-xs text-slate-400">{c.phone || "—"}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {c.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500">
                          {c._count ? `${c._count.leads} Leads • ${c._count.siteVisits} Visits • ${c._count.activities} Tasks` : "—"}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => fetchCustomerDetail(c.id)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >
                            View Account &rarr;
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* MODAL: IN-PLACE CREATE LEAD */}
        {showNewLeadModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-2xl w-full p-6 max-h-[90vh] overflow-auto">
              <h2 className="text-lg font-semibold text-slate-900 mb-1">Create Construction Opportunity</h2>
              <p className="text-xs text-slate-500 mb-4">Capture enquiry details directly into the live CRM database.</p>
              <form onSubmit={async (e) => {
                await handleCreateLead(e);
                setShowNewLeadModal(false);
              }} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    Project Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newLeadForm.title}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, title: e.target.value })}
                    placeholder="e.g. Industrial Shed Construction"
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Source</label>
                    <select
                      value={newLeadForm.source}
                      onChange={(e) => setNewLeadForm({ ...newLeadForm, source: e.target.value })}
                      className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white"
                    >
                      <option value="Direct Referral">Direct Referral</option>
                      <option value="Website Enquiry">Website Enquiry</option>
                      <option value="Site Banner">Site Banner</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Priority</label>
                    <select
                      value={newLeadForm.priority}
                      onChange={(e) => setNewLeadForm({ ...newLeadForm, priority: e.target.value })}
                      className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Contact Name</label>
                    <input
                      type="text"
                      value={newLeadForm.contactName}
                      onChange={(e) => setNewLeadForm({ ...newLeadForm, contactName: e.target.value })}
                      className="w-full p-2.5 border border-slate-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Phone</label>
                    <input
                      type="text"
                      value={newLeadForm.contactPhone}
                      onChange={(e) => setNewLeadForm({ ...newLeadForm, contactPhone: e.target.value })}
                      className="w-full p-2.5 border border-slate-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Budget (₹)</label>
                    <input
                      type="number"
                      value={newLeadForm.estimatedBudget}
                      onChange={(e) => setNewLeadForm({ ...newLeadForm, estimatedBudget: e.target.value })}
                      className="w-full p-2.5 border border-slate-300 rounded-lg text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Site Address</label>
                  <input
                    type="text"
                    value={newLeadForm.siteAddress}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, siteAddress: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowNewLeadModal(false)}
                    className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                  >
                    {actionLoading ? "Saving..." : "Create Lead"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: GENERATE BOQ ESTIMATE */}
        {showEstimateModal && activeLeadDetail && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-3xl w-full p-6 max-h-[90vh] overflow-auto">
              <h3 className="text-base font-semibold text-slate-900 mb-1">
                Generate BOQ & Cost Estimate
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Calculate total cost, apply overhead & profit markup, and compute GST via exact decimal math.
              </p>

              <form onSubmit={handleCreateEstimate} className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-700 mb-1">Estimate Title</label>
                    <input
                      type="text"
                      required
                      value={estimateFormData.title}
                      onChange={(e) => setEstimateFormData({ ...estimateFormData, title: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Markup %</label>
                    <input
                      type="number"
                      required
                      value={estimateFormData.markupPercentage}
                      onChange={(e) => setEstimateFormData({ ...estimateFormData, markupPercentage: Number(e.target.value) })}
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                </div>

                {/* BOQ Items Editor */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase text-slate-600">BOQ Line Items</span>
                    <button
                      type="button"
                      onClick={() =>
                        setBoqItemsList([
                          ...boqItemsList,
                          {
                            itemCode: `ITEM-0${boqItemsList.length + 1}`,
                            category: "SUPERSTRUCTURE_RCC",
                            description: "New construction line item",
                            unit: "sq.m",
                            quantity: 100,
                            materialRate: 500,
                            labourRate: 200,
                            equipmentRate: 50,
                            subcontractRate: 0,
                          },
                        ])
                      }
                      className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                    >
                      + Add Item
                    </button>
                  </div>

                  <div className="space-y-2">
                    {boqItemsList.map((item, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg grid grid-cols-6 gap-2 text-xs">
                        <input
                          type="text"
                          value={item.itemCode}
                          onChange={(e) => {
                            const updated = [...boqItemsList];
                            updated[idx].itemCode = e.target.value;
                            setBoqItemsList(updated);
                          }}
                          placeholder="Code"
                          className="p-1.5 border border-slate-300 rounded text-xs"
                        />
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => {
                            const updated = [...boqItemsList];
                            updated[idx].description = e.target.value;
                            setBoqItemsList(updated);
                          }}
                          placeholder="Description"
                          className="col-span-2 p-1.5 border border-slate-300 rounded text-xs"
                        />
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => {
                            const updated = [...boqItemsList];
                            updated[idx].quantity = Number(e.target.value);
                            setBoqItemsList(updated);
                          }}
                          placeholder="Qty"
                          className="p-1.5 border border-slate-300 rounded text-xs"
                        />
                        <input
                          type="text"
                          value={item.unit}
                          onChange={(e) => {
                            const updated = [...boqItemsList];
                            updated[idx].unit = e.target.value;
                            setBoqItemsList(updated);
                          }}
                          placeholder="Unit"
                          className="p-1.5 border border-slate-300 rounded text-xs"
                        />
                        <input
                          type="number"
                          value={item.materialRate}
                          onChange={(e) => {
                            const updated = [...boqItemsList];
                            updated[idx].materialRate = Number(e.target.value);
                            setBoqItemsList(updated);
                          }}
                          placeholder="Mat Rate"
                          className="p-1.5 border border-slate-300 rounded text-xs"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowEstimateModal(false)}
                    className="px-4 py-2 text-xs text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm"
                  >
                    {actionLoading ? "Computing & Saving..." : "Generate Estimate"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: SCHEDULE SITE VISIT */}
        {showScheduleModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 max-w-md w-full p-6">
              <h3 className="text-base font-semibold text-slate-900 mb-1">Schedule Site Visit</h3>
              <form onSubmit={handleScheduleSiteVisit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Scheduled Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={scheduleData.scheduledDate}
                    onChange={(e) => setScheduleData({ ...scheduleData, scheduledDate: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowScheduleModal(false)}
                    className="px-4 py-2 text-sm text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg font-medium"
                  >
                    Schedule
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
