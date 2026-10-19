"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Trash2, Plus, Save, Download, ArrowUp, ArrowDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ChecklistItem {
  id?: string;
  item: string;
  description: string;
  result_type: "pass_fail" | "pass_fail_obs" | "measurement";
  photo_required: boolean;
  reference?: string;
}

const resultTypes = [
  { value: "pass_fail", label: "Pass/Fail" },
  { value: "pass_fail_obs", label: "Pass/Fail/Observation" },
  { value: "measurement", label: "Measurement Value" },
];

function CustomChecklistsList({ 
  onLoad, 
  setChecklistName, 
  setEquipmentType, 
  setChecklistType, 
  setItems 
}: { 
  onLoad: (data: any) => void;
  setChecklistName: (name: string) => void;
  setEquipmentType: (type: string) => void;
  setChecklistType: (type: "normal" | "full") => void;
  setItems: (items: ChecklistItem[]) => void;
}) {
  const [saved, setSaved] = useState<any[]>([]);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("customChecklists") || "[]");
    setSaved(data);
  }, []);

  const loadSavedChecklist = (data: any) => {
    setChecklistName(data.name);
    setEquipmentType(data.equipmentType);
    setChecklistType(data.checklistType);
    setItems(data.items.map((i: any, idx: number) => ({
      ...i,
      id: i.id || `item-${idx}`,
    })));
  };

  if (saved.length === 0) {
    return <p className="text-muted-foreground text-sm">No custom checklists saved yet.</p>;
  }

  return (
    <div className="space-y-2">
      {saved.map((checklist, idx) => (
        <div key={idx} className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
          <div>
            <p className="font-medium">{checklist.name}</p>
            <p className="text-sm text-muted-foreground">
              {checklist.equipmentType} • {checklist.checklistType} • {checklist.items.length} items
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => onLoad(checklist)}>
            Load
          </Button>
        </div>
      ))}
    </div>
  );
}

export default function ChecklistEditorPage() {
  const [items, setItems] = useState<ChecklistItem[]>([
    {
      id: "item-1",
      item: "",
      description: "",
      result_type: "pass_fail_obs",
      photo_required: false,
      reference: "",
    },
  ]);
  
  const [checklistName, setChecklistName] = useState("");
  const [equipmentType, setEquipmentType] = useState("");
  const [checklistType, setChecklistType] = useState<"normal" | "full">("normal");

  const addItem = () => {
    setItems([
      ...items,
      {
        id: `item-${Date.now()}`,
        item: "",
        description: "",
        result_type: "pass_fail_obs",
        photo_required: false,
        reference: "",
      },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
  };

  const updateItem = (index: number, field: keyof ChecklistItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const moveItem = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= items.length) return;
    
    const updated = [...items];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setItems(updated);
  };

  const saveChecklist = () => {
    const checklistData = {
      name: checklistName,
      equipmentType,
      checklistType,
      items: items.filter(i => i.item.trim()),
      createdAt: new Date().toISOString(),
    };
    
    const saved = JSON.parse(localStorage.getItem("customChecklists") || "[]");
    saved.push(checklistData);
    localStorage.setItem("customChecklists", JSON.stringify(saved));
    
    alert("Checklist saved successfully!");
    console.log("Checklist Saved:", checklistData);
  };

  const exportChecklist = () => {
    const checklistData = {
      name: checklistName,
      equipmentType,
      checklistType,
      items: items.filter(i => i.item.trim()),
      createdAt: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(checklistData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${checklistName.replace(/\s+/g, "-")}-${checklistType}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importChecklist = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        setChecklistName(data.name || "");
        setEquipmentType(data.equipmentType || "");
        setChecklistType(data.checklistType || "normal");
        setItems(data.items || []);
        alert("Checklist imported successfully!");
      } catch (err) {
        alert("Invalid checklist file format");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 px-4 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Checklist Editor</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Create and manage custom inspection checklists for any equipment type.
          </p>
        </div>
      </div>

      {/* Checklist Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Checklist Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="checklistName">Checklist Name</Label>
              <Input
                id="checklistName"
                placeholder="e.g., Forklift Monthly Inspection"
                value={checklistName}
                onChange={(e) => setChecklistName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="equipmentType">Equipment Type</Label>
              <Input
                id="equipmentType"
                placeholder="e.g., forklift, crane, scaffold"
                value={equipmentType}
                onChange={(e) => setEquipmentType(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="checklistType">Checklist Type</Label>
              <Select value={checklistType} onValueChange={(v) => setChecklistType(v as "normal" | "full")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal / Routine</SelectItem>
                  <SelectItem value="full">Full / Thorough</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Checklist Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Checklist Items</CardTitle>
          <div className="flex gap-2">
            <input 
              type="file" 
              accept=".json" 
              onChange={importChecklist} 
              className="hidden" 
              id="import-file"
            />
            <Button variant="outline" onClick={() => document.getElementById("import-file")?.click()} className="gap-2">
              <Download className="h-4 w-4" />
              Import
            </Button>
            <Button variant="outline" onClick={exportChecklist} className="gap-2">
              <Download className="h-4 w-4" />
              Export JSON
            </Button>
            <Button onClick={addItem} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {items.map((item, index) => (
              <div
                key={item.id || index}
                className="border rounded-xl p-5 bg-muted/20 space-y-4 relative"
              >
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold">Item {index + 1}</h2>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => moveItem(index, "up")}
                      disabled={index === 0}
                      className="p-1"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => moveItem(index, "down")}
                      disabled={index === items.length - 1}
                      className="p-1"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => removeItem(index)}
                      disabled={items.length <= 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor={`item-${index}`}>Item Title *</Label>
                    <Input
                      id={`item-${index}`}
                      placeholder="e.g., Body Condition, Pin Straightness"
                      value={item.item}
                      onChange={(e) => updateItem(index, "item", e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor={`result-${index}`}>Result Type</Label>
                    <Select
                      value={item.result_type}
                      onValueChange={(v) => updateItem(index, "result_type", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select result type" />
                      </SelectTrigger>
                      <SelectContent>
                        {resultTypes.map((rt) => (
                          <SelectItem key={rt.value} value={rt.value}>
                            {rt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor={`desc-${index}`}>Description</Label>
                  <Textarea
                    id={`desc-${index}`}
                    placeholder="Detailed inspection criteria, standards reference, etc."
                    value={item.description}
                    onChange={(e) => updateItem(index, "description", e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="grid gap-2 md:grid-cols-3">
                  <div className="grid gap-2">
                    <Label htmlFor={`ref-${index}`}>Reference Standard</Label>
                    <Input
                      id={`ref-${index}`}
                      placeholder="e.g., ISO 2415, ASME B30.26, NFPA 10"
                      value={item.reference || ""}
                      onChange={(e) => updateItem(index, "reference", e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <Switch
                      checked={item.photo_required}
                      onCheckedChange={(v) => updateItem(index, "photo_required", v)}
                    />
                    <Label className="text-sm text-muted-foreground cursor-pointer">
                      Photo Required
                    </Label>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {items.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No items added yet. Click "Add Item" to start building your checklist.</p>
            </div>
          )}

          <div className="flex justify-end gap-4 mt-6 pt-4 border-t">
            <Button variant="outline" onClick={exportChecklist} className="gap-2">
              <Download className="h-4 w-4" />
              Export as JSON
            </Button>
            <Button onClick={saveChecklist} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
              <Save className="h-4 w-4" />
              Save Checklist
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Saved Checklists */}
      <Card>
        <CardHeader>
          <CardTitle>Saved Custom Checklists</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomChecklistsList 
            onLoad={loadSavedChecklist}
            setChecklistName={setChecklistName}
            setEquipmentType={setEquipmentType}
            setChecklistType={setChecklistType}
            setItems={setItems}
          />
        </CardContent>
      </Card>
    </div>
  );

  function loadSavedChecklist(data: any) {
    setChecklistName(data.name);
    setEquipmentType(data.equipmentType);
    setChecklistType(data.checklistType);
    setItems(data.items.map((i: any, idx: number) => ({
      ...i,
      id: i.id || `item-${idx}`,
    })));
  }
}