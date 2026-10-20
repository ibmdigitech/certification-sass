"use client";

import React, { useState, useEffect } from "react";
import { 
  Award, 
  Plus, 
  Search, 
  ShieldCheck, 
  Building2, 
  Calendar, 
  FileText, 
  CheckCircle2, 
  AlertTriangle,
  ExternalLink,
  ChevronRight
} from "lucide-react";

interface AccreditationApplication {
  id: number;
  standardReference: string;
  applicationNumber: string;
  submissionDate: string;
  status: string;
  requestedScopesJson: any;
  notes: string | null;
  authority: {
    id: number;
    code: string;
    name: string;
  };
  assessments: Array<{
    id: number;
    assessmentType: string;
    leadAssessor: string;
    startDate: string;
    outcome: string;
    nonconformities: any[];
  }>;
}

export default function AccreditationLifecyclePage() {
  const [applications, setApplications] = useState<AccreditationApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    authorityId: "1",
    applicationNumber: "",
    standardReference: "ISO/IEC 17020:2012 (Type A)",
    submissionDate: new Date().toISOString().slice(0, 10),
    requestedScopes: "LIFT_CRANE_MOBILE, LIFT_FORKLIFT, PRESS_VESSEL_AIR",
    notes: "",
  });

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/accreditation/applications");
      const data = await res.json();
      if (data.success) {
        setApplications(data.applications);
      }
    } catch (err) {
      console.error("Error loading accreditation applications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleCreateApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/accreditation/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorityId: formData.authorityId,
          applicationNumber: formData.applicationNumber,
          standardReference: formData.standardReference,
          submissionDate: formData.submissionDate,
          requestedScopes: formData.requestedScopes.split(",").map((s) => s.trim()),
          notes: formData.notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit application");
      }

      setIsModalOpen(false);
      setFormData({
        authorityId: "1",
        applicationNumber: "",
        standardReference: "ISO/IEC 17020:2012 (Type A)",
        submissionDate: new Date().toISOString().slice(0, 10),
        requestedScopes: "LIFT_CRANE_MOBILE, LIFT_FORKLIFT, PRESS_VESSEL_AIR",
        notes: "",
      });
      fetchApplications();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredApps = applications.filter(
    (app) =>
      app.applicationNumber.toLowerCase().includes(search.toLowerCase()) ||
      app.authority?.name.toLowerCase().includes(search.toLowerCase()) ||
      app.standardReference.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Award className="w-7 h-7 text-indigo-600" />
            Company Accreditation Governance
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            ISO/IEC 17020 & 17024 Body Lifecycle Tracking: EIAC, ENAS, UKAS & LEEA Authorities.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          Log Accreditation Application
        </button>
      </div>

      {/* Authority Badges Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-400 uppercase">EIAC (Dubai)</div>
          <div className="text-sm font-bold text-slate-800 mt-1">Inspection Body</div>
          <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Active Accredited
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-400 uppercase">ENAS (UAE)</div>
          <div className="text-sm font-bold text-slate-800 mt-1">Conformity Assessment</div>
          <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            Surveillance Due
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-400 uppercase">LEEA (UK)</div>
          <div className="text-sm font-bold text-slate-800 mt-1">Lifting Equipment Training</div>
          <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Full Member Body
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-400 uppercase">Highfield (UK)</div>
          <div className="text-sm font-bold text-slate-800 mt-1">Approved Training Center</div>
          <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Certified Center
          </span>
        </div>
      </div>

      {/* Applications List */}
      {loading ? (
        <div className="p-16 text-center text-slate-400">Loading accreditation records...</div>
      ) : filteredApps.length === 0 ? (
        <div className="p-16 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-700">No Accreditation Records Logged</h3>
          <p className="text-sm text-slate-400 mt-1">
            Log your initial applications, surveillance assessments, and granted scopes here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredApps.map((app) => (
            <div
              key={app.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition p-5 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded">
                    {app.applicationNumber}
                  </span>
                  <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {app.status}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900">{app.authority?.name}</h3>
                  <div className="text-xs text-indigo-600 font-medium mt-0.5">
                    {app.standardReference}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 space-y-1">
                  <div>
                    <span className="text-slate-400">Submission Date:</span>{" "}
                    {new Date(app.submissionDate).toLocaleDateString()}
                  </div>
                  <div>
                    <span className="text-slate-400">Assessments Logged:</span>{" "}
                    {app.assessments?.length || 0} stages
                  </div>
                </div>

                {/* Requested Scopes Badges */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Scope Category
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {Array.isArray(app.requestedScopesJson) &&
                      app.requestedScopesJson.map((scope: string, i: number) => (
                        <span
                          key={i}
                          className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono"
                        >
                          {scope}
                        </span>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Log Accreditation Application */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
              <Award className="w-5 h-5 text-indigo-600" />
              Log Accreditation Application / Surveillance
            </h2>

            {error && (
              <div className="p-3 mb-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleCreateApplication} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Accreditation Body *
                </label>
                <select
                  required
                  value={formData.authorityId}
                  onChange={(e) => setFormData({ ...formData, authorityId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                >
                  <option value="1">EIAC — Emirates International Accreditation Centre</option>
                  <option value="2">ENAS — Emirates National Accreditation System</option>
                  <option value="3">LEEA — Lifting Equipment Engineers Association</option>
                  <option value="4">Highfield Qualifications UK</option>
                  <option value="5">UKAS — United Kingdom Accreditation Service</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Application / Registration Reference Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. EIAC-IB-2026-0042"
                  value={formData.applicationNumber}
                  onChange={(e) => setFormData({ ...formData, applicationNumber: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Standard Reference
                </label>
                <input
                  type="text"
                  value={formData.standardReference}
                  onChange={(e) => setFormData({ ...formData, standardReference: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Requested Scopes (Comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="LIFT_CRANE_MOBILE, LIFT_FORKLIFT, PRESS_VESSEL_AIR"
                  value={formData.requestedScopes}
                  onChange={(e) => setFormData({ ...formData, requestedScopes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm transition disabled:opacity-50"
                >
                  {submitting ? "Logging..." : "Save Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
