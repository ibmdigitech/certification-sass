"use client";

import React, { useState, useEffect } from "react";
import { 
  FileText, 
  Plus, 
  Search, 
  Building2, 
  Calendar, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  Briefcase
} from "lucide-react";

interface Customer {
  id: number;
  name: string;
}

interface LPO {
  id: number;
  lpoNumber: string;
  amount: number | null;
  currency: string;
  issueDate: string | null;
  expiryDate: string | null;
  documentUrl: string | null;
  status: string;
  customer: {
    id: number;
    name: string;
  };
  job?: {
    id: number;
    jobNumber: string;
    title: string;
  };
  invoices?: Array<{
    id: number;
    invoiceNumber: string;
    total: number;
    status: string;
  }>;
}

export default function LPOManagementPage() {
  const [lpos, setLpos] = useState<LPO[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    lpoNumber: "",
    customerId: "",
    amount: "",
    currency: "AED",
    issueDate: new Date().toISOString().slice(0, 10),
    expiryDate: "",
    documentUrl: "",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [lpoRes, custRes] = await Promise.all([
        fetch("/api/lpos"),
        fetch("/api/customers"),
      ]);
      const lpoJson = await lpoRes.json();
      const custJson = await custRes.json();

      if (lpoJson.success) setLpos(lpoJson.lpos);
      if (custJson.customers) setCustomers(custJson.customers);
    } catch (err) {
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateLPO = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/lpos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create LPO");
      }

      setIsModalOpen(false);
      setFormData({
        lpoNumber: "",
        customerId: "",
        amount: "",
        currency: "AED",
        issueDate: new Date().toISOString().slice(0, 10),
        expiryDate: "",
        documentUrl: "",
      });
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredLpos = lpos.filter((l) =>
    l.lpoNumber.toLowerCase().includes(search.toLowerCase()) ||
    l.customer?.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <FileText className="w-7 h-7 text-indigo-600" />
            Client Purchase Orders (LPO)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Register and link customer LPOs to authorize inspection jobs and billing release.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          Register New LPO
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <Search className="w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search by LPO number or Customer name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent focus:outline-none text-sm text-slate-700 placeholder-slate-400"
        />
      </div>

      {/* LPO List / Cards */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading purchase orders...</div>
      ) : filteredLpos.length === 0 ? (
        <div className="p-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-700">No Purchase Orders Found</h3>
          <p className="text-sm text-slate-400 mt-1">Get started by registering a new client LPO.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredLpos.map((lpo) => (
            <div
              key={lpo.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition p-5 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                    {lpo.lpoNumber}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" />
                    {lpo.status}
                  </span>
                </div>

                <div>
                  <h3 className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-slate-400" />
                    {lpo.customer.name}
                  </h3>
                </div>

                <div className="text-sm text-slate-600 space-y-1.5 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5" /> Total Value:
                    </span>
                    <span className="font-semibold text-slate-800">
                      {lpo.amount ? `${lpo.currency} ${lpo.amount.toLocaleString()}` : "Not Specified"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> Issued:
                    </span>
                    <span>{lpo.issueDate ? new Date(lpo.issueDate).toLocaleDateString() : "—"}</span>
                  </div>

                  {lpo.expiryDate && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> Valid Until:
                      </span>
                      <span>{new Date(lpo.expiryDate).toLocaleDateString()}</span>
                    </div>
                  )}

                  {lpo.job && (
                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Briefcase className="w-3.5 h-3.5" /> Linked Job:
                      </span>
                      <span className="font-mono text-indigo-600">{lpo.job.jobNumber}</span>
                    </div>
                  )}
                </div>
              </div>

              {lpo.documentUrl && (
                <div className="pt-4 mt-3 border-t border-slate-100">
                  <a
                    href={lpo.documentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    View Attached Document
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal: Register New LPO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-indigo-600" />
              Register Client LPO / Purchase Order
            </h2>

            {error && (
              <div className="p-3 mb-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleCreateLPO} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  LPO / Purchase Order Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PO-2026-8941"
                  value={formData.lpoNumber}
                  onChange={(e) => setFormData({ ...formData, lpoNumber: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Customer / Client *
                </label>
                <select
                  required
                  value={formData.customerId}
                  onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                >
                  <option value="">Select Customer...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Authorized Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 15000"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Currency
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                  >
                    <option value="AED">AED</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="SAR">SAR</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Issue Date
                  </label>
                  <input
                    type="date"
                    value={formData.issueDate}
                    onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Document / Scan URL
                </label>
                <input
                  type="url"
                  placeholder="https://storage.certiai.com/lpos/..."
                  value={formData.documentUrl}
                  onChange={(e) => setFormData({ ...formData, documentUrl: e.target.value })}
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
                  {submitting ? "Saving..." : "Save LPO"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
