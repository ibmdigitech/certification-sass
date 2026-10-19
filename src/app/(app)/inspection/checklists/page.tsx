"use client";

import { ListChecks, ClipboardList, Wrench, Cable, Flame, Gauge, ShieldCheck, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const equipmentTypes = [
  { id: "shackles", name: "Shackles", icon: Wrench },
  { id: "slings", name: "Slings", icon: Cable },
  { id: "lifting-equipment", name: "Lifting Equipment", icon: ListChecks },
  { id: "electrical", name: "Electrical", icon: ClipboardList },
  { id: "fire", name: "Fire Equipment", icon: Flame },
  { id: "pressure-vessels", name: "Pressure Vessels", icon: Gauge },
  { id: "training", name: "Training Certificates", icon: ShieldCheck },
  { id: "scaffolding", name: "Scaffolding", icon: Building2 },
];

export default function EquipmentChecklistsPage() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Equipment Checklists</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage Normal & Full checklists for all equipment categories.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {equipmentTypes.map((eq) => {
          const Icon = eq.icon;
          return (
            <div key={eq.id} className="border rounded-xl p-5 bg-muted/20 hover:bg-muted/30 transition">
              <div className="flex items-center gap-3 mb-3">
                <Icon className="h-8 w-8 text-muted-foreground" />
                <h2 className="font-semibold text-lg">{eq.name}</h2>
              </div>

              <div className="flex flex-col gap-3 mt-4">
                <Link href={`/inspection/checklists/${eq.id}/normal`} className="w-full">
                  <Button variant="outline" className="w-full">Normal Checklist</Button>
                </Link>

                <Link href={`/inspection/checklists/${eq.id}/full`} className="w-full">
                  <Button className="w-full">Full Checklist</Button>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}