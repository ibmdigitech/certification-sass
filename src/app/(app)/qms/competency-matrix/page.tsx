"use client";

import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  Search, 
  Award, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Download, 
  Filter, 
  UserCheck, 
  FileText 
} from "lucide-react";

interface ScopeStatus {
  level: string;
  validUntil: string;
  daysRemaining: number;
  status: "ACTIVE" | "EXPIRING_SOON" | "EXPIRED";
}

interface EngineerMatrixEntry {
  engineerId: number;
  employeeId: string;
  name: string;
  designation: string;
  primaryDiscipline: string;
  scopes: Record<string, ScopeStatus>;
}

const SCOPE_COLUMNS = [
  { code: "LIFT_CRANE_MOBILE", label: "Mobile Crane" },
  { code: "LIFT_CRANE_OVERHEAD", label: "Overhead Crane" },
  { code: "LIFT_FORKLIFT", label: "Forklift" },
  { code: "LIFT_MEWP", label: "MEWP / Manlift" },
  { code: "PRESS_VESSEL_AIR", label: "Pressure Vessel" },
  { code: "PRESS_BOILER_STEAM", label: "Boiler / Steam" },
  { code: "SCAFF_INSPECT", label: "Scaffolding" },
  { code: "TRAIN_FORKLIFT_OPERATOR", label: "Forklift Trainer" },
  { code: "TRAIN_CRANE_OPERATOR", label: "Crane Trainer" },
  { code: "TRAIN_FIRST_AID_CPR", label: "First Aid Trainer" },
];

export default function CompetencyMatrixPage() {
  const [matrix, setMatrix] = useState<EngineerMatrixEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterDiscipline, setFilterDiscipline] = useState("ALL");
  const [timestamp, setTimestamp] = useState<string>("");

  useEffect(() => {
    fetchMatrix();
  }, []);

  const fetchMatrix = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/qms/competency-matrix");
      const data = await res.json();
      if (data.success) {
        setMatrix(data.engineers);
        setTimestamp(data.timestamp);
      }
    } catch (err) {
      console.error("Failed to load competency matrix:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredEngineers = matrix.filter((eng) => {
    const matchesSearch =
      eng.name.toLowerCase().includes(search.toLowerCase()) ||
      eng.employeeId.toLowerCase().includes(search.toLowerCase()) ||
      eng.designation.toLowerCase().includes(search.toLowerCase());
    const matchesDiscipline =
      filterDiscipline === "ALL" || eng.primaryDiscipline === filterDiscipline;
    return matchesSearch && matchesDiscipline;
  });

  const getStatusBadge = (scope?: ScopeStatus) => {
    if (!scope) {
      return (
        <span className="text-slate-300 font-mono text-xs text-center block">
          —
        </span>
      );
    }

    if (scope.status === "ACTIVE") {
      return (
        <div className="flex flex-col items-center">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-2.5 h-2.5" />
            Active
          </span>
          <span className="text-[9px] text-slate-400 mt-0.5">
            {scope.daysRemaining}d left
          </span>
        </div>
      );
    }

    if (scope.status === "EXPIRING_SOON") {
      return (
        <div className="flex flex-col items-center">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
            <AlertTriangle className="w-2.5 h-2.5" />
            Expiring
          </span>
          <span className="text-[9px] text-amber-600 font-medium mt-0.5">
            {scope.daysRemaining}d left
          </span>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <XCircle className="w-2.5 h-2.5" />
          Expired
        </span>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-full mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-indigo-600" />
            ISO/IEC 17020 Inspector Competency Matrix
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Clause 6.1 Legal Authorization Registry. Real-time scope verification for EIAC, ENAS & UKAS audits.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-medium shadow-sm transition"
          >
            <Download className="w-4 h-4" />
            Export Audit Record
          </button>
        </div>
      </div>

      {/* Control Bar: Search & Discipline Filter */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 w-full sm:w-96">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search inspector name, employee ID, or title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent focus:outline-none text-sm text-slate-700 placeholder-slate-400"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterDiscipline}
            onChange={(e) => setFilterDiscipline(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Disciplines</option>
            <option value="MECHANICAL">Mechanical</option>
            <option value="ELECTRICAL">Electrical</option>
            <option value="CIVIL">Civil</option>
            <option value="SAFETY">Safety / Training</option>
          </select>
        </div>
      </div>

      {/* Audit Readiness Summary Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Active Inspectors</div>
            <div className="text-xl font-bold text-slate-800">{matrix.length}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Standard Scopes</div>
            <div className="text-xl font-bold text-slate-800">{SCOPE_COLUMNS.length}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Audit Standard</div>
            <div className="text-sm font-bold text-slate-800">ISO/IEC 17020:2012</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Last Live Sync</div>
            <div className="text-xs font-semibold text-slate-700">
              {timestamp ? new Date(timestamp).toLocaleTimeString() : "Synchronizing..."}
            </div>
          </div>
        </div>
      </div>

      {/* The Dynamic Matrix Table */}
      {loading ? (
        <div className="p-16 text-center text-slate-400">Loading competency matrix...</div>
      ) : filteredEngineers.length === 0 ? (
        <div className="p-16 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-700">No Inspector Records Registered</h3>
          <p className="text-sm text-slate-400 mt-1">
            Inspector records will appear here as EngineerProfiles are authorized by the Technical Manager.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4 sticky left-0 bg-slate-50 z-10 w-64 shadow-[1px_0_0_0_rgba(0,0,0,0.05)]">
                  Inspector / Engineer
                </th>
                <th className="py-3 px-3 w-28">Discipline</th>
                {SCOPE_COLUMNS.map((col) => (
                  <th key={col.code} className="py-3 px-2 text-center w-28">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredEngineers.map((eng) => (
                <tr key={eng.engineerId} className="hover:bg-slate-50/50 transition">
                  <td className="py-3 px-4 sticky left-0 bg-white z-10 shadow-[1px_0_0_0_rgba(0,0,0,0.05)]">
                    <div className="font-semibold text-slate-900">{eng.name}</div>
                    <div className="text-xs text-slate-400 font-mono mt-0.5">
                      {eng.employeeId} · {eng.designation}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-xs font-medium text-slate-600">
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 text-[10px]">
                      {eng.primaryDiscipline}
                    </span>
                  </td>
                  {SCOPE_COLUMNS.map((col) => (
                    <td key={col.code} className="py-3 px-2 text-center">
                      {getStatusBadge(eng.scopes[col.code])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
