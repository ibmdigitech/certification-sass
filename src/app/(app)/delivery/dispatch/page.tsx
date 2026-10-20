"use client";

import React, { useState, useEffect } from "react";
import { 
  Truck, 
  PackageCheck, 
  Search, 
  Plus, 
  CheckSquare, 
  Square, 
  Calendar, 
  User, 
  Phone, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  Award
} from "lucide-react";

interface Certificate {
  id: number;
  number: string;
  status: string;
  holderName?: string;
  job?: {
    jobNumber: string;
    customer?: {
      name: string;
    };
  };
}

interface DispatchRecord {
  id: number;
  recipientName: string | null;
  recipientPhone: string | null;
  method: string | null;
  trackingNumber: string | null;
  status: string | null;
  deliveryDate: string | null;
  dispatchItems: Array<{
    id: number;
    certificate: {
      id: number;
      number: string;
      holderName?: string;
    };
  }>;
}

export default function DeliveryDispatchPage() {
  const [dispatches, setDispatches] = useState<DispatchRecord[]>([]);
  const [availableCertificates, setAvailableCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCertIds, setSelectedCertIds] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    recipientName: "",
    recipientPhone: "",
    deliveryMethod: "HAND_DELIVERY",
    trackingNumber: "",
    notes: "",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [dispRes, certRes] = await Promise.all([
        fetch("/api/delivery/dispatch"),
        fetch("/api/certificates?limit=50"),
      ]);
      const dispData = await dispRes.json();
      const certData = await certRes.json();

      if (dispData.success) setDispatches(dispData.dispatches);
      if (certData.certificates) setAvailableCertificates(certData.certificates);
    } catch (err) {
      console.error("Failed to load delivery data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleSelectCert = (id: number) => {
    setSelectedCertIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleCreateDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCertIds.length === 0) {
      setError("Please select at least one certificate to bundle into this dispatch.");
      return;
    }
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/delivery/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          certificateIds: selectedCertIds,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create delivery dispatch");
      }

      setIsModalOpen(false);
      setSelectedCertIds([]);
      setFormData({
        recipientName: "",
        recipientPhone: "",
        deliveryMethod: "HAND_DELIVERY",
        trackingNumber: "",
        notes: "",
      });
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Truck className="w-7 h-7 text-indigo-600" />
            Multi-Certificate Delivery Dispatch
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Bundle and dispatch multiple inspection certificates & cards under a single delivery consignment.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          Create New Dispatch Consignment
        </button>
      </div>

      {/* Dispatches List */}
      {loading ? (
        <div className="p-16 text-center text-slate-400">Loading delivery dispatches...</div>
      ) : dispatches.length === 0 ? (
        <div className="p-16 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <PackageCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-700">No Dispatches Created Yet</h3>
          <p className="text-sm text-slate-400 mt-1">
            Create a consignment to dispatch multiple certificates to a client representative.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {dispatches.map((disp) => (
            <div
              key={disp.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition p-5 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono bg-slate-100 text-slate-700 px-2.5 py-1 rounded">
                    CONSIGNMENT #{disp.id}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" />
                    {disp.status || "DISPATCHED"}
                  </span>
                </div>

                <div className="text-sm space-y-1">
                  <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-slate-400" />
                    Recipient: {disp.recipientName || "Client Representative"}
                  </div>
                  {disp.recipientPhone && (
                    <div className="text-xs text-slate-500 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {disp.recipientPhone}
                    </div>
                  )}
                  <div className="text-xs text-slate-500 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-slate-400" />
                    Method: {disp.method}
                  </div>
                  {disp.trackingNumber && (
                    <div className="text-xs text-slate-500 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      Tracking: {disp.trackingNumber}
                    </div>
                  )}
                </div>

                {/* Bundled Items */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Bundled Certificates ({disp.dispatchItems?.length || 0})
                  </div>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {disp.dispatchItems?.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between text-xs bg-slate-50 px-2.5 py-1.5 rounded border border-slate-100 font-mono"
                      >
                        <span className="text-indigo-600 font-medium">
                          {item.certificate?.number}
                        </span>
                        <span className="text-slate-400 text-[10px]">
                          {item.certificate?.holderName || "Verified"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-3 border-t border-slate-100 text-xs text-slate-400 flex items-center justify-between">
                <span>Date Dispatched:</span>
                <span className="font-medium text-slate-600">
                  {disp.deliveryDate ? new Date(disp.deliveryDate).toLocaleDateString() : "—"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Create Dispatch Consignment */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
              <PackageCheck className="w-5 h-5 text-indigo-600" />
              Create Multi-Certificate Dispatch Consignment
            </h2>

            {error && (
              <div className="p-3 mb-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleCreateDispatch} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Recipient / Receiver Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Eng. Tariq Al Nuaimi"
                    value={formData.recipientName}
                    onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Recipient Contact Phone
                  </label>
                  <input
                    type="text"
                    placeholder="+971 50 123 4567"
                    value={formData.recipientPhone}
                    onChange={(e) => setFormData({ ...formData, recipientPhone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Delivery Method
                  </label>
                  <select
                    value={formData.deliveryMethod}
                    onChange={(e) => setFormData({ ...formData, deliveryMethod: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                  >
                    <option value="HAND_DELIVERY">Hand Delivery (Company Driver)</option>
                    <option value="COURIER">Courier Dispatch (Aramex / DHL)</option>
                    <option value="CLIENT_PICKUP">Client Collection at Office</option>
                    <option value="DIGITAL_PORTAL">Digital Portal Release Only</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Tracking / AWB Number (if Courier)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. AWB-98218491"
                    value={formData.trackingNumber}
                    onChange={(e) => setFormData({ ...formData, trackingNumber: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Certificate Selection List */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Select Certificates to Bundle ({selectedCertIds.length} Selected)</span>
                  <span className="text-indigo-600 font-normal">Click items to toggle</span>
                </label>
                <div className="border border-slate-200 rounded-lg max-h-48 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
                  {availableCertificates.length === 0 ? (
                    <div className="text-center text-slate-400 py-4 text-xs">
                      No certificates available for dispatch.
                    </div>
                  ) : (
                    availableCertificates.map((cert) => {
                      const isSelected = selectedCertIds.includes(cert.id);
                      return (
                        <div
                          key={cert.id}
                          onClick={() => toggleSelectCert(cert.id)}
                          className={`flex items-center justify-between p-2 rounded cursor-pointer transition text-xs ${
                            isSelected
                              ? "bg-indigo-50 border border-indigo-200"
                              : "hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-300 flex-shrink-0" />
                            )}
                            <div>
                              <div className="font-mono font-semibold text-slate-800">
                                {cert.number}
                              </div>
                              <div className="text-slate-400 text-[11px]">
                                {cert.holderName || cert.job?.customer?.name || "Certificate"}
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 font-semibold text-slate-600">
                            {cert.status}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
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
                  disabled={submitting || selectedCertIds.length === 0}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm transition disabled:opacity-50"
                >
                  {submitting ? "Creating Dispatch..." : `Dispatch ${selectedCertIds.length} Certificate(s)`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
