export interface ChecklistItem {
  id: string;
  title: string;
  category: string;
  required: boolean;
  observation?: string;
  status?: "pass" | "fail" | "na" | "cf";
  reference?: string;
}

export interface ChecklistCategory {
  category: string;
  items: ChecklistItem[];
}

export const checklistData: Record<string, { normal: ChecklistCategory[]; full: ChecklistCategory[] }> = {
  shackles: {
    normal: [
      {
        category: "Documentation",
        items: [
          { id: "sh-01", title: "Certificate of conformity available", category: "Documentation", required: true, reference: "ISO 2415" },
          { id: "sh-02", title: "Previous test certificate on file", category: "Documentation", required: true, reference: "" },
          { id: "sh-03", title: "Identification marking legible (SWL, manufacturer, grade)", category: "Documentation", required: true, reference: "ASME B30.26" },
        ],
      },
      {
        category: "Visual Inspection",
        items: [
          { id: "sh-04", title: "Body deformation or bending", category: "Visual Inspection", required: true, reference: "" },
          { id: "sh-05", title: "Pin/bolt condition - no wear or damage", category: "Visual Inspection", required: true, reference: "" },
          { id: "sh-06", title: "Thread condition - no cross-threading", category: "Visual Inspection", required: true, reference: "" },
          { id: "sh-07", title: "No corrosion, pitting, or nicks", category: "Visual Inspection", required: true, reference: "" },
          { id: "sh-08", title: "No cracks (magnetic particle test if required)", category: "Visual Inspection", required: true, reference: "" },
          { id: "sh-09", title: "Wear on crown/bow within limits", category: "Visual Inspection", required: true, reference: "" },
        ],
      },
      {
        category: "Functional Test",
        items: [
          { id: "sh-10", title: "Pin engagement smooth and secure", category: "Functional Test", required: true, reference: "" },
          { id: "sh-11", title: "Thread engagement full and smooth", category: "Functional Test", required: true, reference: "" },
          { id: "sh-12", title: "SWL marking clearly legible", category: "Functional Test", required: true, reference: "" },
        ],
      },
      {
        category: "Proof Load Test",
        items: [
          { id: "sh-13", title: "Proof load applied per standard", category: "Proof Load Test", required: true, reference: "" },
          { id: "sh-14", title: "No permanent deformation after proof load", category: "Proof Load Test", required: true, reference: "" },
        ],
      },
    ],
    full: [
      {
        category: "Documentation",
        items: [
          { id: "sh-01", title: "Certificate of conformity available", category: "Documentation", required: true, reference: "ISO 2415" },
          { id: "sh-02", title: "Previous test certificate on file", category: "Documentation", required: true, reference: "" },
          { id: "sh-03", title: "Identification marking legible (SWL, manufacturer, grade)", category: "Documentation", required: true, reference: "ASME B30.26" },
          { id: "sh-03a", title: "Material traceability certificate", category: "Documentation", required: true, reference: "EN 10204 3.1" },
          { id: "sh-03b", title: "Heat treatment records", category: "Documentation", required: false, reference: "" },
        ],
      },
      {
        category: "Visual Inspection",
        items: [
          { id: "sh-04", title: "Body deformation or bending", category: "Visual Inspection", required: true, reference: "" },
          { id: "sh-05", title: "Pin/bolt condition - no wear or damage", category: "Visual Inspection", required: true, reference: "" },
          { id: "sh-06", title: "Thread condition - no cross-threading", category: "Visual Inspection", required: true, reference: "" },
          { id: "sh-07", title: "No corrosion, pitting, or nicks", category: "Visual Inspection", required: true, reference: "" },
          { id: "sh-08", title: "No cracks (magnetic particle test if required)", category: "Visual Inspection", required: true, reference: "" },
          { id: "sh-09", title: "Wear on crown/bow within limits", category: "Visual Inspection", required: true, reference: "" },
          { id: "sh-09a", title: "Thickness measurements at critical points", category: "Visual Inspection", required: true, reference: "" },
          { id: "sh-09b", title: "Surface finish condition", category: "Visual Inspection", required: false, reference: "" },
        ],
      },
      {
        category: "Functional Test",
        items: [
          { id: "sh-10", title: "Pin engagement smooth and secure", category: "Functional Test", required: true, reference: "" },
          { id: "sh-11", title: "Thread engagement full and smooth", category: "Functional Test", required: true, reference: "" },
          { id: "sh-12", title: "SWL marking clearly legible", category: "Functional Test", required: true, reference: "" },
          { id: "sh-12a", title: "Bolt torque verification", category: "Functional Test", required: true, reference: "" },
        ],
      },
      {
        category: "Proof Load Test",
        items: [
          { id: "sh-13", title: "Proof load applied per standard", category: "Proof Load Test", required: true, reference: "" },
          { id: "sh-14", title: "No permanent deformation after proof load", category: "Proof Load Test", required: true, reference: "" },
          { id: "sh-14a", title: "Load test certificate issued", category: "Proof Load Test", required: true, reference: "" },
        ],
      },
    ],
  },
  slings: {
    normal: [
      {
        category: "Documentation",
        items: [
          { id: "sl-01", title: "Certificate of conformity available", category: "Documentation", required: true, reference: "ISO 2307" },
          { id: "sl-02", title: "Previous inspection records", category: "Documentation", required: true, reference: "" },
          { id: "sl-03", title: "Identification tag legible (WLL, material, length)", category: "Documentation", required: true, reference: "ASME B30.9" },
        ],
      },
      {
        category: "Visual Inspection - Wire Rope Slings",
        items: [
          { id: "sl-04", title: "No broken wires (count per lay length)", category: "Visual Inspection", required: true, reference: "ISO 4309" },
          { id: "sl-05", title: "No kinking, birdcaging, or distortion", category: "Visual Inspection", required: true, reference: "" },
          { id: "sl-06", title: "No corrosion or heat damage", category: "Visual Inspection", required: true, reference: "" },
          { id: "sl-07", title: "End fittings secure (swaged, spliced, clamped)", category: "Visual Inspection", required: true, reference: "" },
          { id: "sl-08", title: "Thimble condition", category: "Visual Inspection", required: true, reference: "" },
        ],
      },
      {
        category: "Visual Inspection - Chain Slings",
        items: [
          { id: "sl-09", title: "No stretched or elongated links", category: "Visual Inspection", required: true, reference: "" },
          { id: "sl-10", title: "No nicks, gouges, or wear > 10%", category: "Visual Inspection", required: true, reference: "" },
          { id: "sl-11", title: "Hooks - no deformation, latch functional", category: "Visual Inspection", required: true, reference: "" },
          { id: "sl-12", title: "Master link condition", category: "Visual Inspection", required: true, reference: "" },
        ],
      },
      {
        category: "Visual Inspection - Synthetic Slings",
        items: [
          { id: "sl-13", title: "No cuts, tears, or abrasion", category: "Visual Inspection", required: true, reference: "" },
          { id: "sl-14", title: "No UV degradation or chemical damage", category: "Visual Inspection", required: true, reference: "" },
          { id: "sl-15", title: "Stitching intact", category: "Visual Inspection", required: true, reference: "" },
          { id: "sl-16", title: "Label/tag legible", category: "Visual Inspection", required: true, reference: "" },
        ],
      },
    ],
    full: [
      {
        category: "Documentation",
        items: [
          { id: "sl-01", title: "Certificate of conformity available", category: "Documentation", required: true, reference: "ISO 2307" },
          { id: "sl-02", title: "Previous inspection records", category: "Documentation", required: true, reference: "" },
          { id: "sl-03", title: "Identification tag legible (WLL, material, length)", category: "Documentation", required: true, reference: "ASME B30.9" },
          { id: "sl-03a", title: "Manufacturer's test certificate", category: "Documentation", required: false, reference: "" },
        ],
      },
      {
        category: "Visual Inspection - Wire Rope Slings",
        items: [
          { id: "sl-04", title: "No broken wires (count per lay length)", category: "Visual Inspection", required: true, reference: "ISO 4309" },
          { id: "sl-05", title: "No kinking, birdcaging, or distortion", category: "Visual Inspection", required: true, reference: "" },
          { id: "sl-06", title: "No corrosion or heat damage", category: "Visual Inspection", required: true, reference: "" },
          { id: "sl-07", title: "End fittings secure (swaged, spliced, clamped)", category: "Visual Inspection", required: true, reference: "" },
          { id: "sl-08", title: "Thimble condition", category: "Visual Inspection", required: true, reference: "" },
          { id: "sl-08a", title: "Diameter measurements", category: "Visual Inspection", required: true, reference: "" },
          { id: "sl-08b", title: "Lay length measurements", category: "Visual Inspection", required: false, reference: "" },
        ],
      },
      {
        category: "Visual Inspection - Chain Slings",
        items: [
          { id: "sl-09", title: "No stretched or elongated links", category: "Visual Inspection", required: true, reference: "" },
          { id: "sl-10", title: "No nicks, gouges, or wear > 10%", category: "Visual Inspection", required: true, reference: "" },
          { id: "sl-11", title: "Hooks - no deformation, latch functional", category: "Visual Inspection", required: true, reference: "" },
          { id: "sl-12", title: "Master link condition", category: "Visual Inspection", required: true, reference: "" },
          { id: "sl-12a", title: "Link thickness measurements", category: "Visual Inspection", required: true, reference: "" },
        ],
      },
      {
        category: "Visual Inspection - Synthetic Slings",
        items: [
          { id: "sl-13", title: "No cuts, tears, or abrasion", category: "Visual Inspection", required: true, reference: "" },
          { id: "sl-14", title: "No UV degradation or chemical damage", category: "Visual Inspection", required: true, reference: "" },
          { id: "sl-15", title: "Stitching intact", category: "Visual Inspection", required: true, reference: "" },
          { id: "sl-16", title: "Label/tag legible", category: "Visual Inspection", required: true, reference: "" },
        ],
      },
      {
        category: "Load Testing",
        items: [
          { id: "sl-17", title: "Proof load test performed", category: "Load Testing", required: true, reference: "" },
          { id: "sl-18", title: "Load test certificate issued", category: "Load Testing", required: true, reference: "" },
        ],
      },
    ],
  },
  "lifting-equipment": {
    normal: [
      {
        category: "General",
        items: [
          { id: "le-01", title: "Equipment identification plate visible", category: "General", required: true, reference: "" },
          { id: "le-02", title: "SWL/WLL clearly marked", category: "General", required: true, reference: "" },
          { id: "le-03", title: "Current test certificate displayed", category: "General", required: true, reference: "" },
        ],
      },
      {
        category: "Structural",
        items: [
          { id: "le-04", title: "No cracks, deformation, or corrosion", category: "Structural", required: true, reference: "" },
          { id: "le-05", title: "Welds intact - no cracks", category: "Structural", required: true, reference: "" },
          { id: "le-06", title: "Bolts/nuts tight and secure", category: "Structural", required: true, reference: "" },
        ],
      },
      {
        category: "Mechanical",
        items: [
          { id: "le-07", title: "Moving parts lubricated", category: "Mechanical", required: true, reference: "" },
          { id: "le-08", title: "Brakes functional", category: "Mechanical", required: true, reference: "" },
          { id: "le-08", title: "Limit switches operational", category: "Mechanical", required: true, reference: "" },
        ],
      },
      {
        category: "Safety Devices",
        items: [
          { id: "le-09", title: "Overload protection functional", category: "Safety Devices", required: true, reference: "" },
          { id: "le-10", title: "Emergency stop operational", category: "Safety Devices", required: true, reference: "" },
          { id: "le-11", title: "Warning alarms working", category: "Safety Devices", required: true, reference: "" },
        ],
      },
    ],
    full: [
      {
        category: "General",
        items: [
          { id: "le-01", title: "Equipment identification plate visible", category: "General", required: true, reference: "" },
          { id: "le-02", title: "SWL/WLL clearly marked", category: "General", required: true, reference: "" },
          { id: "le-03", title: "Current test certificate displayed", category: "General", required: true, reference: "" },
          { id: "le-03a", title: "Manufacturer's manual available", category: "General", required: true, reference: "" },
          { id: "le-03b", title: "Maintenance log up to date", category: "General", required: true, reference: "" },
        ],
      },
      {
        category: "Structural",
        items: [
          { id: "le-04", title: "No cracks, deformation, or corrosion", category: "Structural", required: true, reference: "" },
          { id: "le-05", title: "Welds intact - no cracks", category: "Structural", required: true, reference: "" },
          { id: "le-06", title: "Bolts/nuts tight and secure", category: "Structural", required: true, reference: "" },
          { id: "le-06a", title: "Thickness measurements at critical points", category: "Structural", required: true, reference: "" },
        ],
      },
      {
        category: "Mechanical",
        items: [
          { id: "le-07", title: "Moving parts lubricated", category: "Mechanical", required: true, reference: "" },
          { id: "le-08", title: "Brakes functional", category: "Mechanical", required: true, reference: "" },
          { id: "le-08", title: "Limit switches operational", category: "Mechanical", required: true, reference: "" },
          { id: "le-08a", title: "Brake torque test", category: "Mechanical", required: true, reference: "" },
        ],
      },
      {
        category: "Safety Devices",
        items: [
          { id: "le-09", title: "Overload protection functional", category: "Safety Devices", required: true, reference: "" },
          { id: "le-10", title: "Emergency stop operational", category: "Safety Devices", required: true, reference: "" },
          { id: "le-11", title: "Warning alarms working", category: "Safety Devices", required: true, reference: "" },
          { id: "le-11a", title: "Load indicator accuracy test", category: "Safety Devices", required: true, reference: "" },
        ],
      },
      {
        category: "Load Test",
        items: [
          { id: "le-12", title: "Proof load test performed", category: "Load Test", required: true, reference: "" },
          { id: "le-13", title: "Deflection measurements recorded", category: "Load Test", required: true, reference: "" },
        ],
      },
    ],
  },
  electrical: {
    normal: [
      {
        category: "Documentation",
        items: [
          { id: "el-01", title: "Single line diagram available", category: "Documentation", required: true, reference: "" },
          { id: "el-02", title: "Previous test records", category: "Documentation", required: true, reference: "" },
          { id: "el-03", title: "Risk assessment completed", category: "Documentation", required: true, reference: "" },
        ],
      },
      {
        category: "Visual Inspection",
        items: [
          { id: "el-04", title: "Enclosure condition - no damage", category: "Visual Inspection", required: true, reference: "" },
          { id: "el-05", title: "Cable insulation intact", category: "Visual Inspection", required: true, reference: "" },
          { id: "el-06", title: "No signs of overheating/burning", category: "Visual Inspection", required: true, reference: "" },
          { id: "el-07", title: "Gland plates secure", category: "Visual Inspection", required: true, reference: "" },
        ],
      },
      {
        category: "Earthing & Bonding",
        items: [
          { id: "el-08", title: "Earth continuity test passed", category: "Earthing & Bonding", required: true, reference: "" },
          { id: "el-09", title: "Earth electrode resistance < 1 ohm", category: "Earthing & Bonding", required: true, reference: "" },
          { id: "el-10", title: "Equipotential bonding complete", category: "Earthing & Bonding", required: true, reference: "" },
        ],
      },
      {
        category: "Protection Devices",
        items: [
          { id: "el-11", title: "RCD/RCBO test passed", category: "Protection Devices", required: true, reference: "" },
          { id: "el-12", title: "MCB/MCCB trip test passed", category: "Protection Devices", required: true, reference: "" },
          { id: "el-13", title: "Emergency stop functional", category: "Protection Devices", required: true, reference: "" },
        ],
      },
    ],
    full: [
      {
        category: "Documentation",
        items: [
          { id: "el-01", title: "Single line diagram available", category: "Documentation", required: true, reference: "" },
          { id: "el-02", title: "Previous test records", category: "Documentation", required: true, reference: "" },
          { id: "el-03", title: "Risk assessment completed", category: "Documentation", required: true, reference: "" },
          { id: "el-03a", title: "Schematic diagrams", category: "Documentation", required: false, reference: "" },
        ],
      },
      {
        category: "Visual Inspection",
        items: [
          { id: "el-04", title: "Enclosure condition - no damage", category: "Visual Inspection", required: true, reference: "" },
          { id: "el-05", title: "Cable insulation intact", category: "Visual Inspection", required: true, reference: "" },
          { id: "el-06", title: "No signs of overheating/burning", category: "Visual Inspection", required: true, reference: "" },
          { id: "el-07", title: "Gland plates secure", category: "Visual Inspection", required: true, reference: "" },
          { id: "el-07a", title: "Terminal tightness verified", category: "Visual Inspection", required: true, reference: "" },
        ],
      },
      {
        category: "Earthing & Bonding",
        items: [
          { id: "el-08", title: "Earth continuity test passed", category: "Earthing & Bonding", required: true, reference: "" },
          { id: "el-09", title: "Earth electrode resistance < 1 ohm", category: "Earthing & Bonding", required: true, reference: "" },
          { id: "el-10", title: "Equipotential bonding complete", category: "Earthing & Bonding", required: true, reference: "" },
        ],
      },
      {
        category: "Protection Devices",
        items: [
          { id: "el-11", title: "RCD/RCBO test passed", category: "Protection Devices", required: true, reference: "" },
          { id: "el-12", title: "MCB/MCCB trip test passed", category: "Protection Devices", required: true, reference: "" },
          { id: "el-13", title: "Emergency stop functional", category: "Protection Devices", required: true, reference: "" },
        ],
      },
      {
        category: "Insulation Resistance",
        items: [
          { id: "el-14", title: "Phase to phase > 1 MΩ", category: "Insulation Resistance", required: true, reference: "" },
          { id: "el-15", title: "Phase to earth > 1 MΩ", category: "Insulation Resistance", required: true, reference: "" },
          { id: "el-16", title: "Polarity check passed", category: "Insulation Resistance", required: true, reference: "" },
        ],
      },
      {
        category: "Functional Tests",
        items: [
          { id: "el-17", title: "Load test - voltage drop < 5%", category: "Functional Tests", required: true, reference: "" },
          { id: "el-18", title: "Phase sequence correct", category: "Functional Tests", required: true, reference: "" },
        ],
      },
    ],
  },
  fire: {
    normal: [
      {
        category: "Fire Extinguishers",
        items: [
          { id: "fe-01", title: "Correct type for hazard", category: "Fire Extinguishers", required: true, reference: "" },
          { id: "fe-02", title: "Pressure gauge in green zone", category: "Fire Extinguishers", required: true, reference: "" },
          { id: "fe-03", title: "Pin and tamper seal intact", category: "Fire Extinguishers", required: true, reference: "" },
          { id: "fe-04", title: "Nozzle/hose unobstructed", category: "Fire Extinguishers", required: true, reference: "" },
          { id: "fe-05", title: "Mounted at correct height", category: "Fire Extinguishers", required: true, reference: "" },
          { id: "fe-06", title: "Signage visible", category: "Fire Extinguishers", required: true, reference: "" },
        ],
      },
      {
        category: "Fire Detection",
        items: [
          { id: "fe-07", title: "Smoke detectors clean and unobstructed", category: "Fire Detection", required: true, reference: "" },
          { id: "fe-08", title: "Manual call points accessible", category: "Fire Detection", required: true, reference: "" },
          { id: "fe-09", title: "Alarm sounders operational", category: "Fire Detection", required: true, reference: "" },
        ],
      },
      {
        category: "Emergency Lighting & Exits",
        items: [
          { id: "fe-10", title: "Exit routes clear", category: "Emergency Lighting & Exits", required: true, reference: "" },
          { id: "fe-11", title: "Emergency lights functional", category: "Emergency Lighting & Exits", required: true, reference: "" },
          { id: "fe-12", title: "Exit signs illuminated", category: "Emergency Lighting & Exits", required: true, reference: "" },
        ],
      },
    ],
    full: [
      {
        category: "Fire Extinguishers",
        items: [
          { id: "fe-01", title: "Correct type for hazard", category: "Fire Extinguishers", required: true, reference: "" },
          { id: "fe-02", title: "Pressure gauge in green zone", category: "Fire Extinguishers", required: true, reference: "" },
          { id: "fe-03", title: "Pin and tamper seal intact", category: "Fire Extinguishers", required: true, reference: "" },
          { id: "fe-04", title: "Nozzle/hose unobstructed", category: "Fire Extinguishers", required: true, reference: "" },
          { id: "fe-05", title: "Mounted at correct height", category: "Fire Extinguishers", required: true, reference: "" },
          { id: "fe-06", title: "Signage visible", category: "Fire Extinguishers", required: true, reference: "" },
          { id: "fe-06a", title: "Hydrostatic test current", category: "Fire Extinguishers", required: true, reference: "" },
          { id: "fe-06b", title: "Weight check within limits", category: "Fire Extinguishers", required: true, reference: "" },
        ],
      },
      {
        category: "Fire Detection",
        items: [
          { id: "fe-07", title: "Smoke detectors clean and unobstructed", category: "Fire Detection", required: true, reference: "" },
          { id: "fe-08", title: "Manual call points accessible", category: "Fire Detection", required: true, reference: "" },
          { id: "fe-09", title: "Alarm sounders operational", category: "Fire Detection", required: true, reference: "" },
          { id: "fe-09a", title: "Detector sensitivity test", category: "Fire Detection", required: true, reference: "" },
        ],
      },
      {
        category: "Emergency Lighting & Exits",
        items: [
          { id: "fe-10", title: "Exit routes clear", category: "Emergency Lighting & Exits", required: true, reference: "" },
          { id: "fe-11", title: "Emergency lights functional", category: "Emergency Lighting & Exits", required: true, reference: "" },
          { id: "fe-12", title: "Exit signs illuminated", category: "Emergency Lighting & Exits", required: true, reference: "" },
          { id: "fe-12a", title: "Duration test (1/3 hr)", category: "Emergency Lighting & Exits", required: true, reference: "" },
        ],
      },
      {
        category: "Fire Suppression Systems",
        items: [
          { id: "fe-13", title: "Sprinkler heads unobstructed", category: "Fire Suppression Systems", required: true, reference: "" },
          { id: "fe-14", title: "Valve positions correct (open/closed)", category: "Fire Suppression Systems", required: true, reference: "" },
          { id: "fe-15", title: "Pressure gauges reading normal", category: "Fire Suppression Systems", required: true, reference: "" },
        ],
      },
    ],
  },
  "pressure-vessels": {
    normal: [
      {
        category: "Documentation",
        items: [
          { id: "pv-01", title: "Design code compliance (ASME VIII, PD 5500)", category: "Documentation", required: true, reference: "" },
          { id: "pv-02", title: "Current examination certificate", category: "Documentation", required: true, reference: "" },
          { id: "pv-03", title: "Safe operating limits posted", category: "Documentation", required: true, reference: "" },
        ],
      },
      {
        category: "External Visual",
        items: [
          { id: "pv-04", title: "No external corrosion or damage", category: "External Visual", required: true, reference: "" },
          { id: "pv-05", title: "Insulation condition", category: "External Visual", required: true, reference: "" },
          { id: "pv-06", title: "Supports and foundations sound", category: "External Visual", required: true, reference: "" },
        ],
      },
      {
        category: "Safety Devices",
        items: [
          { id: "pv-07", title: "Safety valve set pressure correct", category: "Safety Devices", required: true, reference: "" },
          { id: "pv-08", title: "Safety valve test certificate current", category: "Safety Devices", required: true, reference: "" },
          { id: "pv-09", title: "Pressure gauge calibrated", category: "Safety Devices", required: true, reference: "" },
        ],
      },
    ],
    full: [
      {
        category: "Documentation",
        items: [
          { id: "pv-01", title: "Design code compliance (ASME VIII, PD 5500)", category: "Documentation", required: true, reference: "" },
          { id: "pv-02", title: "Current examination certificate", category: "Documentation", required: true, reference: "" },
          { id: "pv-03", title: "Safe operating limits posted", category: "Documentation", required: true, reference: "" },
          { id: "pv-03a", title: "Design drawings and calculations", category: "Documentation", required: false, reference: "" },
        ],
      },
      {
        category: "External Visual",
        items: [
          { id: "pv-04", title: "No external corrosion or damage", category: "External Visual", required: true, reference: "" },
          { id: "pv-05", title: "Insulation condition", category: "External Visual", required: true, reference: "" },
          { id: "pv-06", title: "Supports and foundations sound", category: "External Visual", required: true, reference: "" },
          { id: "pv-06a", title: "Thickness measurements (UT)", category: "External Visual", required: true, reference: "" },
        ],
      },
      {
        category: "Internal Visual",
        items: [
          { id: "pv-07", title: "No internal corrosion/scaling", category: "Internal Visual", required: true, reference: "" },
          { id: "pv-08", title: "Welds intact", category: "Internal Visual", required: true, reference: "" },
          { id: "pv-09", title: "Nozzles and connections sound", category: "Internal Visual", required: true, reference: "" },
        ],
      },
      {
        category: "Safety Devices",
        items: [
          { id: "pv-10", title: "Safety valve set pressure correct", category: "Safety Devices", required: true, reference: "" },
          { id: "pv-11", title: "Safety valve test certificate current", category: "Safety Devices", required: true, reference: "" },
          { id: "pv-12", title: "Pressure gauge calibrated", category: "Safety Devices", required: true, reference: "" },
          { id: "pv-13", title: "Bursting disc condition (if fitted)", category: "Safety Devices", required: true, reference: "" },
        ],
      },
      {
        category: "Hydrostatic/Pneumatic Test",
        items: [
          { id: "pv-14", title: "Test pressure achieved", category: "Hydrostatic Test", required: true, reference: "" },
          { id: "pv-15", title: "No leaks during hold period", category: "Hydrostatic Test", required: true, reference: "" },
        ],
      },
    ],
  },
  scaffolding: {
    normal: [
      {
        category: "Foundations",
        items: [
          { id: "sc-01", title: "Ground/floor capable of supporting scaffold", category: "Foundations", required: true, reference: "" },
          { id: "sc-02", title: "Base plates/sole boards used", category: "Foundations", required: true, reference: "" },
          { id: "sc-03", title: "Standards vertical (plumb)", category: "Foundations", required: true, reference: "" },
        ],
      },
      {
        category: "Structure",
        items: [
          { id: "sc-04", title: "Ledgers horizontal and level", category: "Structure", required: true, reference: "" },
          { id: "sc-05", title: "Transoms correctly positioned", category: "Structure", required: true, reference: "" },
          { id: "sc-06", title: "Bracing installed (plan & elevation)", category: "Structure", required: true, reference: "" },
          { id: "sc-07", title: "Couplers tight and correct type", category: "Structure", required: true, reference: "" },
        ],
      },
      {
        category: "Platforms",
        items: [
          { id: "sc-08", title: "Boards - no damage, correct grade", category: "Platforms", required: true, reference: "" },
          { id: "sc-09", title: "Guardrails (top 950mm, mid 470mm)", category: "Platforms", required: true, reference: "" },
          { id: "sc-10", title: "Toe boards (min 150mm)", category: "Platforms", required: true, reference: "" },
          { id: "sc-11", title: "No gaps > 25mm in platform", category: "Platforms", required: true, reference: "" },
        ],
      },
      {
        category: "Access & Safety",
        items: [
          { id: "sc-12", title: "Ladder/stair access provided", category: "Access & Safety", required: true, reference: "" },
          { id: "sc-13", title: "Ties to structure at required frequency", category: "Access & Safety", required: true, reference: "" },
          { id: "sc-14", title: "Loading capacity displayed", category: "Access & Safety", required: true, reference: "" },
        ],
      },
    ],
    full: [
      {
        category: "Foundations",
        items: [
          { id: "sc-01", title: "Ground/floor capable of supporting scaffold", category: "Foundations", required: true, reference: "" },
          { id: "sc-02", title: "Base plates/sole boards used", category: "Foundations", required: true, reference: "" },
          { id: "sc-03", title: "Standards vertical (plumb)", category: "Foundations", required: true, reference: "" },
          { id: "sc-03a", title: "Settlement check", category: "Foundations", required: true, reference: "" },
        ],
      },
      {
        category: "Structure",
        items: [
          { id: "sc-04", title: "Ledgers horizontal and level", category: "Structure", required: true, reference: "" },
          { id: "sc-05", title: "Transoms correctly positioned", category: "Structure", required: true, reference: "" },
          { id: "sc-06", title: "Bracing installed (plan & elevation)", category: "Structure", required: true, reference: "" },
          { id: "sc-07", title: "Couplers tight and correct type", category: "Structure", required: true, reference: "" },
          { id: "sc-07a", title: "Tube condition - no splits/corrosion", category: "Structure", required: true, reference: "" },
        ],
      },
      {
        category: "Platforms",
        items: [
          { id: "sc-08", title: "Boards - no damage, correct grade", category: "Platforms", required: true, reference: "" },
          { id: "sc-09", title: "Guardrails (top 950mm, mid 470mm)", category: "Platforms", required: true, reference: "" },
          { id: "sc-10", title: "Toe boards (min 150mm)", category: "Platforms", required: true, reference: "" },
          { id: "sc-11", title: "No gaps > 25mm in platform", category: "Platforms", required: true, reference: "" },
          { id: "sc-11a", title: "Board support spacing correct", category: "Platforms", required: true, reference: "" },
        ],
      },
      {
        category: "Access & Safety",
        items: [
          { id: "sc-12", title: "Ladder/stair access provided", category: "Access & Safety", required: true, reference: "" },
          { id: "sc-13", title: "Ties to structure at required frequency", category: "Access & Safety", required: true, reference: "" },
          { id: "sc-14", title: "Loading capacity displayed", category: "Access & Safety", required: true, reference: "" },
          { id: "sc-14a", title: "Tag system (Green/Red) implemented", category: "Access & Safety", required: true, reference: "" },
        ],
      },
      {
        category: "Inspection Regime",
        items: [
          { id: "sc-15", title: "Initial inspection after erection", category: "Inspection Regime", required: true, reference: "" },
          { id: "sc-16", title: "7-day periodic inspections", category: "Inspection Regime", required: true, reference: "" },
          { id: "sc-17", title: "After adverse weather/event", category: "Inspection Regime", required: true, reference: "" },
        ],
      },
    ],
  },
  training: {
    normal: [
      {
        category: "Trainee Verification",
        items: [
          { id: "tr-01", title: "Trainee identity verified (Emirates ID/Passport)", category: "Trainee Verification", required: true, reference: "" },
          { id: "tr-02", title: "Medical fitness certificate valid", category: "Trainee Verification", required: true, reference: "" },
          { id: "tr-03", title: "Pre-requisite qualifications met", category: "Trainee Verification", required: true, reference: "" },
        ],
      },
      {
        category: "Training Delivery",
        items: [
          { id: "tr-04", title: "Course syllabus followed", category: "Training Delivery", required: true, reference: "" },
          { id: "tr-05", title: "Theory session completed", category: "Training Delivery", required: true, reference: "" },
          { id: "tr-06", title: "Practical session completed", category: "Training Delivery", required: true, reference: "" },
          { id: "tr-07", title: "Training materials provided", category: "Training Delivery", required: true, reference: "" },
        ],
      },
      {
        category: "Assessment",
        items: [
          { id: "tr-08", title: "Written assessment passed", category: "Assessment", required: true, reference: "" },
          { id: "tr-09", title: "Practical assessment passed", category: "Assessment", required: true, reference: "" },
          { id: "tr-10", title: "Assessor qualified and authorized", category: "Assessment", required: true, reference: "" },
        ],
      },
      {
        category: "Certification",
        items: [
          { id: "tr-11", title: "Certificate issued with correct details", category: "Certification", required: true, reference: "" },
          { id: "tr-12", title: "Validity period correct per course", category: "Certification", required: true, reference: "" },
          { id: "tr-13", title: "QR code and verification link active", category: "Certification", required: true, reference: "" },
        ],
      },
    ],
    full: [
      {
        category: "Trainee Verification",
        items: [
          { id: "tr-01", title: "Trainee identity verified (Emirates ID/Passport)", category: "Trainee Verification", required: true, reference: "" },
          { id: "tr-02", title: "Medical fitness certificate valid", category: "Trainee Verification", required: true, reference: "" },
          { id: "tr-03", title: "Pre-requisite qualifications met", category: "Trainee Verification", required: true, reference: "" },
          { id: "tr-03a", title: "Previous training records checked", category: "Trainee Verification", required: false, reference: "" },
        ],
      },
      {
        category: "Training Delivery",
        items: [
          { id: "tr-04", title: "Course syllabus followed", category: "Training Delivery", required: true, reference: "" },
          { id: "tr-05", title: "Theory session completed", category: "Training Delivery", required: true, reference: "" },
          { id: "tr-06", title: "Practical session completed", category: "Training Delivery", required: true, reference: "" },
          { id: "tr-07", title: "Training materials provided", category: "Training Delivery", required: true, reference: "" },
          { id: "tr-07a", title: "Attendance register complete", category: "Training Delivery", required: true, reference: "" },
        ],
      },
      {
        category: "Assessment",
        items: [
          { id: "tr-08", title: "Written assessment passed", category: "Assessment", required: true, reference: "" },
          { id: "tr-09", title: "Practical assessment passed", category: "Assessment", required: true, reference: "" },
          { id: "tr-10", title: "Assessor qualified and authorized", category: "Assessment", required: true, reference: "" },
          { id: "tr-10a", title: "Assessment records retained", category: "Assessment", required: true, reference: "" },
        ],
      },
      {
        category: "Certification",
        items: [
          { id: "tr-11", title: "Certificate issued with correct details", category: "Certification", required: true, reference: "" },
          { id: "tr-12", title: "Validity period correct per course", category: "Certification", required: true, reference: "" },
          { id: "tr-13", title: "QR code and verification link active", category: "Certification", required: true, reference: "" },
          { id: "tr-13a", title: "Certificate registered in system", category: "Certification", required: true, reference: "" },
        ],
      },
    ],
  },
};

export function getChecklist(equipmentId: string, type: "normal" | "full"): ChecklistCategory[] {
  return checklistData[equipmentId]?.[type] || [];
}