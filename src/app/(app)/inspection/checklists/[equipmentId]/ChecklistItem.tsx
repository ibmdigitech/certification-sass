"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface ChecklistItemProps {
  item: {
    id: string;
    title: string;
    category: string;
    required: boolean;
    reference?: string;
  };
  value: {
    status: "pass" | "fail" | "na" | "cf";
    observation: string;
  };
  onChange: (id: string, field: "status" | "observation", value: string) => void;
}

export default function ChecklistItem({ item, value, onChange }: ChecklistItemProps) {
  const statusColors = {
    pass: "bg-emerald-100 text-emerald-800 border-emerald-200",
    fail: "bg-red-100 text-red-800 border-red-200",
    na: "bg-gray-100 text-gray-800 border-gray-200",
    cf: "bg-red-100 text-red-800 border-red-200",
  };

  const statusLabels = {
    pass: "PASS",
    fail: "FAIL",
    na: "N/A",
    cf: "CRITICAL FAIL",
  };

  return (
    <div className="border rounded-lg p-4 bg-white space-y-3">
      <div className="flex items-start gap-3">
        <div className="flex items-center space-x-2">
          <Checkbox
            checked={value.status === "pass"}
            onCheckedChange={(checked) => {
              onChange(item.id, "status", checked ? "pass" : "na");
            }}
            aria-label={`Mark ${item.title} as pass`}
          />
          <div className="min-w-[200px]">
            <p className="font-medium text-sm">{item.title}</p>
            {item.reference && (
              <p className="text-xs text-muted-foreground">Ref: {item.reference}</p>
            )}
            {item.required && (
              <Badge variant="secondary" className="mt-1 text-xs">Required</Badge>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 ml-6">
          {(["pass", "fail", "na", "cf"] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => onChange(item.id, "status", status)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-all ${
                value.status === status ? statusColors[status] : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
              }`}
            >
              {statusLabels[status]}
            </button>
          ))}
        </div>

        <div className="ml-6">
          <Textarea
            placeholder="Observation / Remarks..."
            value={value.observation}
            onChange={(e) => onChange(item.id, "observation", e.target.value)}
            rows={2}
            className="text-sm"
          />
        </div>
      </div>
    </div>
  );
}