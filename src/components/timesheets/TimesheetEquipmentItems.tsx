"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit } from "lucide-react";

interface EquipmentItem {
  id: number;
  equipmentId: number | null;
  equipmentType: string | null;
  equipmentDescription: string | null;
  manufacturer: string | null;
  model: string | null;
  serialNumber: string | null;
  equipmentCode: string | null;
  quantity: number | null;
  inspectionResult: string | null;
  inspectionDate: string | null;
  remarks: string | null;
  certificateStatus: string | null;
  reportStatus: string | null;
  createdAt: string;
  updatedAt: string;
}

interface TimesheetEquipmentItemsProps {
  equipmentItems: EquipmentItem[];
  onUpdate: (items: EquipmentItem[]) => void;
  editable?: boolean;
}

const INSPECTION_RESULT_LABELS: Record<string, string> = {
  PASSED: "Passed",
  FAILED: "Failed",
  PENDING: "Pending",
  NOT_APPLICABLE: "N/A",
};

const CERTIFICATE_STATUS_LABELS: Record<string, string> = {
  ISSUED: "Issued",
  PENDING: "Pending",
  NOT_APPLICABLE: "N/A",
  FAILED: "Failed",
};

const REPORT_STATUS_LABELS: Record<string, string> = {
  GENERATED: "Generated",
  PENDING: "Pending",
  NOT_APPLICABLE: "N/A",
};

export function TimesheetEquipmentItems({
  equipmentItems,
  onUpdate,
  editable = true,
}: TimesheetEquipmentItemsProps) {
  const [items, setItems] = useState<EquipmentItem[]>(equipmentItems);

  const handleAdd = () => {
    const newItem: EquipmentItem = {
      id: Date.now(),
      equipmentId: null,
      equipmentType: "",
      equipmentDescription: "",
      manufacturer: "",
      model: "",
      serialNumber: "",
      equipmentCode: "",
      quantity: 1,
      inspectionResult: "PENDING",
      inspectionDate: "",
      remarks: "",
      certificateStatus: "PENDING",
      reportStatus: "PENDING",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [...items, newItem];
    setItems(updated);
    onUpdate(updated);
  };

  const handleUpdate = (id: number, field: keyof EquipmentItem, value: unknown) => {
    const updated = items.map((item) =>
      item.id === id ? { ...item, [field]: value } : item
    );
    setItems(updated);
    onUpdate(updated);
  };

  const handleRemove = (id: number) => {
    if (!confirm("Remove this equipment item?")) return;
    const updated = items.filter((item) => item.id !== id);
    setItems(updated);
    onUpdate(updated);
  };

  const handleQuantityChange = (id: number, value: string) => {
    const numValue = parseInt(value);
    handleUpdate(id, "quantity", isNaN(numValue) ? null : numValue);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Equipment Items</span>
          {editable && (
            <Button size="sm" onClick={handleAdd}>
              <Plus className="mr-2 h-4 w-4" />
              Add Equipment
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No equipment items added.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Equipment Type/Desc</TableHead>
                  <TableHead>Manufacturer / Model</TableHead>
                  <TableHead>Serial / Code</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Inspection</TableHead>
                  <TableHead>Certificate</TableHead>
                  <TableHead>Report</TableHead>
                  {editable && <TableHead className="w-[100px]">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="p-3 align-top">
                      <div className="space-y-1">
                        {editable ? (
                          <>
                            <input
                              type="text"
                              placeholder="Type"
                              value={item.equipmentType || ""}
                              onChange={(e) => handleUpdate(item.id, "equipmentType", e.target.value)}
                              className="w-full text-sm border rounded px-2 py-1"
                            />
                            <input
                              type="text"
                              placeholder="Description"
                              value={item.equipmentDescription || ""}
                              onChange={(e) => handleUpdate(item.id, "equipmentDescription", e.target.value)}
                              className="w-full text-sm border rounded px-2 py-1"
                            />
                          </>
                        ) : (
                          <>
                            <p className="font-medium">{item.equipmentType || item.equipmentDescription || "—"}</p>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="p-3 align-top">
                      <div className="space-y-1">
                        {editable ? (
                          <>
                            <input
                              type="text"
                              placeholder="Manufacturer"
                              value={item.manufacturer || ""}
                              onChange={(e) => handleUpdate(item.id, "manufacturer", e.target.value)}
                              className="w-full text-sm border rounded px-2 py-1"
                            />
                            <input
                              type="text"
                              placeholder="Model"
                              value={item.model || ""}
                              onChange={(e) => handleUpdate(item.id, "model", e.target.value)}
                              className="w-full text-sm border rounded px-2 py-1"
                            />
                          </>
                        ) : (
                          <>
                            <p className="text-sm">{item.manufacturer || "—"}</p>
                            <p className="text-sm text-muted-foreground">{item.model || ""}</p>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="p-3 align-top">
                      <div className="space-y-1">
                        {editable ? (
                          <>
                            <input
                              type="text"
                              placeholder="Serial #"
                              value={item.serialNumber || ""}
                              onChange={(e) => handleUpdate(item.id, "serialNumber", e.target.value)}
                              className="w-full text-sm border rounded px-2 py-1"
                            />
                            <input
                              type="text"
                              placeholder="Code"
                              value={item.equipmentCode || ""}
                              onChange={(e) => handleUpdate(item.id, "equipmentCode", e.target.value)}
                              className="w-full text-sm border rounded px-2 py-1"
                            />
                          </>
                        ) : (
                          <>
                            <p className="text-sm font-mono">{item.serialNumber || "—"}</p>
                            <p className="text-sm text-muted-foreground">{item.equipmentCode || ""}</p>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="p-3 align-top">
                      {editable ? (
                        <input
                          type="number"
                          min="1"
                          value={item.quantity || 1}
                          onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                          className="w-16 text-sm border rounded px-2 py-1"
                        />
                      ) : (
                        <p>{item.quantity || 1}</p>
                      )}
                    </td>
                    <td className="p-3 align-top">
                      {editable ? (
                        <select
                          value={item.inspectionResult || ""}
                          onChange={(e) => handleUpdate(item.id, "inspectionResult", e.target.value || null)}
                          className="text-sm border rounded px-2 py-1 w-full"
                        >
                          <option value="">Not set</option>
                          <option value="PENDING">Pending</option>
                          <option value="PASSED">Passed</option>
                          <option value="FAILED">Failed</option>
                          <option value="NOT_APPLICABLE">N/A</option>
                        </select>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          {INSPECTION_RESULT_LABELS[item.inspectionResult || ""] || item.inspectionResult || "—"}
                        </Badge>
                      )}
                    </td>
                    <td className="p-3 align-top">
                      {editable ? (
                        <select
                          value={item.certificateStatus || ""}
                          onChange={(e) => handleUpdate(item.id, "certificateStatus", e.target.value || null)}
                          className="text-sm border rounded px-2 py-1 w-full"
                        >
                          <option value="">Not set</option>
                          <option value="ISSUED">Issued</option>
                          <option value="PENDING">Pending</option>
                          <option value="NOT_APPLICABLE">N/A</option>
                          <option value="FAILED">Failed</option>
                        </select>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          {CERTIFICATE_STATUS_LABELS[item.certificateStatus || ""] || item.certificateStatus || "—"}
                        </Badge>
                      )}
                    </td>
                    <td className="p-3 align-top">
                      {editable ? (
                        <select
                          value={item.reportStatus || ""}
                          onChange={(e) => handleUpdate(item.id, "reportStatus", e.target.value || null)}
                          className="text-sm border rounded px-2 py-1 w-full"
                        >
                          <option value="">Not set</option>
                          <option value="GENERATED">Generated</option>
                          <option value="PENDING">Pending</option>
                          <option value="NOT_APPLICABLE">N/A</option>
                        </select>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          {REPORT_STATUS_LABELS[item.reportStatus || ""] || item.reportStatus || "—"}
                        </Badge>
                      )}
                    </td>
                    {editable && (
                      <td className="p-3 align-top">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemove(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
