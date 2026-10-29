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
  ArrowLeft
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
  _count?: { leads: number; activities: number; siteVisits: number };
}

export default function CRMApp() {
  const [activeTab, setActiveTab] = useState<"leads" | "customers" | "new_lead">("leads");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Detail views
  const [activeLeadDetail, setActiveLeadDetail] = useState<Lead | null>(null);
  const [activeCustomerDetail, setActiveCustomerDetail] = useState<Customer | null>(null);

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
      const res = await fetch(`/api/leads?search=${encodeURIComponent(search)}`);
      if (!res.ok) {
        if (res.status === 401) {
          setError("Session required: Log in to view live organization data");
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
    } catch (err: any) {
      setError(err.message);
    }
  };

  const fetchCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/customers?search=${encodeURIComponent(search)}`);
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

  useEffect(() => {
    if (activeTab === "leads") {
      fetchLeads();
    } else if (activeTab === "customers") {
      fetchCustomers();
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
            <p className="text-xs text-slate-400">Operations Suite</p>
          </div>
        </div>

        <nav className="p-4 space-y-1.5 flex-1">
          <button
            onClick={() => { setActiveTab("leads"); setActiveLeadDetail(null); setActiveCustomerDetail(null); }}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-left transition-colors ${
              activeTab === "leads" && !activeCustomerDetail ? "bg-slate-800 text-white font-semibold" : "hover:bg-slate-800/60 text-slate-300"
            }`}
          >
            <Target className="w-4 h-4 text-blue-400" />
            <span>Leads & Pipeline</span>
          </button>
          <button
            onClick={() => { setActiveTab("customers"); setActiveLeadDetail(null); setActiveCustomerDetail(null); }}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-left transition-colors ${
              activeTab === "customers" ? "bg-slate-800 text-white font-semibold" : "hover:bg-slate-800/60 text-slate-300"
            }`}
          >
            <Users className="w-4 h-4 text-emerald-400" />
            <span>Customers & Accounts</span>
          </button>
          <button
            onClick={() => { setActiveTab("new_lead"); setActiveLeadDetail(null); setActiveCustomerDetail(null); }}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-left transition-colors ${
              activeTab === "new_lead" ? "bg-slate-800 text-white font-semibold" : "hover:bg-slate-800/60 text-slate-300"
            }`}
          >
            <Plus className="w-4 h-4 text-indigo-400" />
            <span>Create New Lead</span>
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800 text-xs text-slate-500">
          <div className="flex items-center gap-2 mb-1 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Tenant Isolated & RBAC Active</span>
          </div>
          <p>Database: PostgreSQL 18 Live</p>
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

        {/* 1. LEAD DETAIL VIEW */}
        {activeLeadDetail && (
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
                <button
                  onClick={() => setShowActivityModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Add Task</span>
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
                <div>
                  <span className="text-xs text-slate-400">Requirements</span>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{activeLeadDetail.requirements || "No notes"}</p>
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
                            {sv.measurements && (
                              <div className="mt-1 text-[11px] text-slate-500 font-mono">
                                Measurements: {JSON.stringify(sv.measurements)}
                              </div>
                            )}
                          </div>
                        )}
                        {sv.status === "SCHEDULED" && (
                          <div className="pt-1 flex justify-end">
                            <button
                              onClick={() => setShowOutcomeModal(sv)}
                              className="text-blue-600 hover:text-blue-800 font-medium text-xs"
                            >
                              Record Outcome & Measurements
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
                        <div className="text-slate-500 text-[11px]">
                          Type: {act.type} • Due: {act.dueDate ? new Date(act.dueDate).toLocaleDateString() : "No deadline"}
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

        {/* 2. CUSTOMER DETAIL VIEW */}
        {activeCustomerDetail && (
          <div>
            <button
              onClick={() => setActiveCustomerDetail(null)}
              className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-800 mb-4 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Customers</span>
            </button>

            <header className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-slate-900">{activeCustomerDetail.name}</h1>
                  {activeCustomerDetail.companyName && (
                    <p className="text-xs text-slate-500">{activeCustomerDetail.companyName}</p>
                  )}
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  {activeCustomerDetail.status}
                </span>
              </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Contact Information</h3>
                <div className="text-xs text-slate-600 space-y-1">
                  <div><span className="text-slate-400">Email:</span> {activeCustomerDetail.email || "—"}</div>
                  <div><span className="text-slate-400">Phone:</span> {activeCustomerDetail.phone || "—"}</div>
                  <div><span className="text-slate-400">Notes:</span> {activeCustomerDetail.notes || "None"}</div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Linked Projects & Leads</h3>
                {!activeCustomerDetail.leads || activeCustomerDetail.leads.length === 0 ? (
                  <div className="p-4 text-xs text-slate-400 bg-slate-50 rounded">No linked opportunities.</div>
                ) : (
                  <div className="space-y-2">
                    {activeCustomerDetail.leads.map((l: any) => (
                      <div key={l.id} className="p-2.5 bg-slate-50 rounded border border-slate-100 text-xs flex justify-between">
                        <span className="font-medium text-slate-800">{l.title}</span>
                        <span className="text-slate-500 font-mono">{l.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 3. MAIN LEADS TABLE TAB */}
        {activeTab === "leads" && !activeLeadDetail && !activeCustomerDetail && (
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
                  onClick={() => setActiveTab("new_lead")}
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

        {/* 4. CUSTOMERS TABLE TAB */}
        {activeTab === "customers" && !activeCustomerDetail && !activeLeadDetail && (
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
                <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
                  Convert a won lead or create an account to view client records.
                </p>
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
                          {c.companyName && <span className="text-xs text-slate-400 font-normal">{c.companyName}</span>}
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

        {/* 5. NEW LEAD FORM TAB */}
        {activeTab === "new_lead" && (
          <div className="max-w-2xl bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-1">Create Construction Opportunity</h2>
            <p className="text-xs text-slate-500 mb-6">
              Captures customer requirements and project specifications directly to PostgreSQL.
            </p>

            <form onSubmit={handleCreateLead} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Project / Opportunity Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newLeadForm.title}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, title: e.target.value })}
                  placeholder="e.g. Residential Villa G+2 - Phase 3"
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <option value="Walk-in">Walk-in</option>
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Contact Name</label>
                  <input
                    type="text"
                    value={newLeadForm.contactName}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, contactName: e.target.value })}
                    placeholder="Client Name"
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Phone</label>
                  <input
                    type="text"
                    value={newLeadForm.contactPhone}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, contactPhone: e.target.value })}
                    placeholder="+91..."
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Estimated Budget (₹)</label>
                  <input
                    type="number"
                    value={newLeadForm.estimatedBudget}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, estimatedBudget: e.target.value })}
                    placeholder="e.g. 5000000"
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
                  placeholder="Plot/Survey No, Locality, City"
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Scope & Requirements</label>
                <textarea
                  rows={3}
                  value={newLeadForm.requirements}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, requirements: e.target.value })}
                  placeholder="Built-up area, architectural requirements, soil notes..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveTab("leads")}
                  className="px-4 py-2.5 text-sm text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition"
                >
                  {actionLoading ? "Saving..." : "Create Lead"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* MODAL: SCHEDULE SITE VISIT */}
        {showScheduleModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 max-w-md w-full p-6">
              <h3 className="text-base font-semibold text-slate-900 mb-1">Schedule Site Visit</h3>
              <p className="text-xs text-slate-500 mb-4">Assigns inspection to staff and tracks progress in CRM.</p>

              <form onSubmit={handleScheduleSiteVisit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Scheduled Date & Time <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={scheduleData.scheduledDate}
                    onChange={(e) => setScheduleData({ ...scheduleData, scheduledDate: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Site Address</label>
                  <input
                    type="text"
                    value={scheduleData.siteAddress}
                    onChange={(e) => setScheduleData({ ...scheduleData, siteAddress: e.target.value })}
                    placeholder={activeLeadDetail?.siteAddress || "Site Location"}
                    className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Inspection Notes / Scope</label>
                  <textarea
                    rows={2}
                    value={scheduleData.notes}
                    onChange={(e) => setScheduleData({ ...scheduleData, notes: e.target.value })}
                    placeholder="e.g. Bring measuring tape, soil test check..."
                    className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowScheduleModal(false)}
                    className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                  >
                    {actionLoading ? "Scheduling..." : "Schedule Visit"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: RECORD OUTCOME & MEASUREMENTS */}
        {showOutcomeModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 max-w-md w-full p-6">
              <h3 className="text-base font-semibold text-slate-900 mb-1">Record Site Inspection Outcome</h3>
              <p className="text-xs text-slate-500 mb-4">Captures measurements and site verification notes.</p>

              <form onSubmit={handleRecordVisitOutcome} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Inspection Outcome & Notes <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={outcomeData.outcomeNotes}
                    onChange={(e) => setOutcomeData({ ...outcomeData, outcomeNotes: e.target.value })}
                    placeholder="Ground level, accessibility, water table observations..."
                    className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Plot Area (Sq. Ft)</label>
                    <input
                      type="number"
                      value={outcomeData.plotAreaSqFt}
                      onChange={(e) => setOutcomeData({ ...outcomeData, plotAreaSqFt: e.target.value })}
                      placeholder="e.g. 2400"
                      className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Road Width (Meters)</label>
                    <input
                      type="number"
                      value={outcomeData.roadWidthMeters}
                      onChange={(e) => setOutcomeData({ ...outcomeData, roadWidthMeters: e.target.value })}
                      placeholder="e.g. 12"
                      className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowOutcomeModal(null)}
                    className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                  >
                    {actionLoading ? "Saving..." : "Record & Complete Visit"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: ADD FOLLOW-UP TASK */}
        {showActivityModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 max-w-md w-full p-6">
              <h3 className="text-base font-semibold text-slate-900 mb-1">Create Follow-up Activity</h3>
              <p className="text-xs text-slate-500 mb-4">Set action items and SLA deadlines.</p>

              <form onSubmit={handleCreateActivity} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Type</label>
                    <select
                      value={activityData.type}
                      onChange={(e) => setActivityData({ ...activityData, type: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white"
                    >
                      <option value="CALL">Call</option>
                      <option value="MEETING">Meeting</option>
                      <option value="TASK">Task</option>
                      <option value="NOTE">Note</option>
                      <option value="EMAIL">Email</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Priority</label>
                    <select
                      value={activityData.priority}
                      onChange={(e) => setActivityData({ ...activityData, priority: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Subject <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={activityData.subject}
                    onChange={(e) => setActivityData({ ...activityData, subject: e.target.value })}
                    placeholder="e.g. Send revised architectural quotation"
                    className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Due Date</label>
                  <input
                    type="datetime-local"
                    value={activityData.dueDate}
                    onChange={(e) => setActivityData({ ...activityData, dueDate: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={activityData.description}
                    onChange={(e) => setActivityData({ ...activityData, description: e.target.value })}
                    placeholder="Details about the task..."
                    className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowActivityModal(false)}
                    className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                  >
                    {actionLoading ? "Saving..." : "Create Task"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: STATUS UPDATE */}
        {showStatusModal && activeLeadDetail && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 max-w-md w-full p-6">
              <h3 className="text-base font-semibold text-slate-900 mb-1">
                Update Pipeline Status: {activeLeadDetail.title}
              </h3>
              <p className="text-xs text-slate-500 mb-4">Enforces validation and records immutable audit history.</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Status</label>
                  <select
                    value={statusUpdate}
                    onChange={(e) => setStatusUpdate(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white"
                  >
                    <option value="NEW">NEW</option>
                    <option value="QUALIFIED">QUALIFIED</option>
                    <option value="SITE_VISIT_SCHEDULED">SITE_VISIT_SCHEDULED</option>
                    <option value="SITE_VISIT_COMPLETED">SITE_VISIT_COMPLETED</option>
                    <option value="ESTIMATION">ESTIMATION</option>
                    <option value="QUOTATION_SENT">QUOTATION_SENT</option>
                    <option value="NEGOTIATION">NEGOTIATION</option>
                    <option value="WON">WON</option>
                    <option value="LOST">LOST</option>
                  </select>
                </div>

                {statusUpdate === "LOST" && (
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Loss Reason <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={lossReason}
                      onChange={(e) => setLossReason(e.target.value)}
                      placeholder="e.g. Budget mismatch, competitor chosen"
                      className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                    />
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => setShowStatusModal(false)}
                    className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateStatus}
                    disabled={actionLoading}
                    className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                  >
                    {actionLoading ? "Updating..." : "Save Status"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
