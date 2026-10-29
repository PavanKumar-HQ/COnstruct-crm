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
  FileText
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
  customer?: { id: string; name: string } | null;
}

interface Customer {
  id: string;
  name: string;
  companyName: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  createdAt: string;
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

  // Modal / action state
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [statusUpdate, setStatusUpdate] = useState<string>("");
  const [lossReason, setLossReason] = useState<string>("");
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // New Lead Form state
  const [formData, setFormData] = useState({
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
        title: formData.title,
        source: formData.source,
        priority: formData.priority,
        contactName: formData.contactName || undefined,
        contactPhone: formData.contactPhone || undefined,
        contactEmail: formData.contactEmail || undefined,
        siteAddress: formData.siteAddress || undefined,
        requirements: formData.requirements || undefined,
      };

      if (formData.estimatedBudget) {
        payload.estimatedBudget = parseFloat(formData.estimatedBudget);
      }

      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to create lead record");
      }

      setSuccessMsg(`Lead "${json.title}" successfully created and saved to database.`);
      setFormData({
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
    if (!selectedLead || !statusUpdate) return;
    setActionLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/leads/${selectedLead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: statusUpdate,
          lossReason: statusUpdate === "LOST" ? lossReason : null,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to update lead status");
      }

      setSuccessMsg(`Status updated to ${json.status}.`);
      setSelectedLead(null);
      setStatusUpdate("");
      setLossReason("");
      fetchLeads();
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
      if (!res.ok) {
        throw new Error(json.error || "Lead conversion failed");
      }

      setSuccessMsg(`Lead converted into Customer "${json.customer.name}" transactionally.`);
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
            <p className="text-xs text-slate-400">Phase 2 Operations</p>
          </div>
        </div>

        <nav className="p-4 space-y-1.5 flex-1">
          <button
            onClick={() => { setActiveTab("leads"); setSelectedLead(null); }}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-left transition-colors ${
              activeTab === "leads" ? "bg-slate-800 text-white font-semibold" : "hover:bg-slate-800/60 text-slate-300"
            }`}
          >
            <Target className="w-4 h-4 text-blue-400" />
            <span>Leads & Opportunities</span>
          </button>
          <button
            onClick={() => { setActiveTab("customers"); setSelectedLead(null); }}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-left transition-colors ${
              activeTab === "customers" ? "bg-slate-800 text-white font-semibold" : "hover:bg-slate-800/60 text-slate-300"
            }`}
          >
            <Users className="w-4 h-4 text-emerald-400" />
            <span>Customers & Accounts</span>
          </button>
          <button
            onClick={() => { setActiveTab("new_lead"); setSelectedLead(null); }}
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
        {/* Alerts / Error feedback */}
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-center gap-3 text-sm">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center gap-3 text-sm">
            <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* TAB 1: LEADS LIST & ACTIONS */}
        {activeTab === "leads" && (
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
                          <div>{lead.title}</div>
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
                            onClick={() => { setSelectedLead(lead); setStatusUpdate(lead.status); }}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Update Status
                          </button>
                          {!lead.convertedAt && lead.status !== "LOST" && (
                            <button
                              onClick={() => handleConvertLead(lead.id)}
                              disabled={actionLoading}
                              className="text-xs text-emerald-600 hover:text-emerald-800 font-medium"
                            >
                              Convert to Customer
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Status Update Modal */}
            {selectedLead && (
              <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-xl shadow-lg border border-slate-200 max-w-md w-full p-6">
                  <h3 className="text-base font-semibold text-slate-900 mb-1">
                    Update Pipeline Status: {selectedLead.title}
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
                        onClick={() => setSelectedLead(null)}
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
          </div>
        )}

        {/* TAB 2: CUSTOMERS DIRECTORY */}
        {activeTab === "customers" && (
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
                      <th className="px-6 py-3">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customers.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/60 transition">
                        <td className="px-6 py-4 font-medium text-slate-900">
                          <div>{c.name}</div>
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
                        <td className="px-6 py-4 text-xs text-slate-400">
                          {new Date(c.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: NEW LEAD FORM */}
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
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Residential Villa G+2 - Phase 3"
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Source</label>
                  <select
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
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
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
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
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    placeholder="Client Name"
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Phone</label>
                  <input
                    type="text"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    placeholder="+91..."
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Estimated Budget (₹)</label>
                  <input
                    type="number"
                    value={formData.estimatedBudget}
                    onChange={(e) => setFormData({ ...formData, estimatedBudget: e.target.value })}
                    placeholder="e.g. 5000000"
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Site Address</label>
                <input
                  type="text"
                  value={formData.siteAddress}
                  onChange={(e) => setFormData({ ...formData, siteAddress: e.target.value })}
                  placeholder="Plot/Survey No, Locality, City"
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Scope & Requirements</label>
                <textarea
                  rows={3}
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
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
      </main>
    </div>
  );
}
