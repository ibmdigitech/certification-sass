"use client";

import { useState } from "react";
import { ChecklistCategory } from "./checklist-data";
import ChecklistItem from "./ChecklistItem";
import { Button } from "@/components/ui/button";

interface ChecklistRendererProps {
  title: string;
  categories: ChecklistCategory[];
  equipmentId: string;
  checklistType: "normal" | "full";
}

export default function ChecklistRenderer({ title, categories, equipmentId, checklistType }: ChecklistRendererProps) {
  const [formData, setFormData] = useState<Record<string, { status: "pass" | "fail" | "na" | "cf"; observation: string }>>({});

  // Initialize form data
  if (Object.keys(formData).length === 0) {
    const initialData: Record<string, { status: "pass" | "fail" | "na" | "cf"; observation: string }> = {};
    categories.forEach((cat) => {
      cat.items.forEach((item) => {
        initialData[item.id] = { status: "na", observation: "" };
      });
    });
    setFormData(initialData);
  }

  const handleChange = (itemId: string, field: "status" | "observation", value: string) => {
    setFormData((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], [field]: value },
    }));
  };

  const handleSubmit = async () => {
    // Collect all results
    const results = categories.flatMap((cat) =>
      cat.items.map((item) => ({
        itemId: item.id,
        category: cat.category,
        title: item.title,
        status: formData[item.id]?.status || "na",
        observation: formData[item.id]?.observation || "",
        required: item.required,
        reference: item.reference,
      }))
    );

    try {
      const response = await fetch("/api/inspection/checklist-results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          equipmentId,
          checklistType,
          results,
        }),
      });

      if (response.ok) {
        alert("Checklist submitted successfully!");
      } else {
        alert("Failed to submit checklist");
      }
    } catch (error) {
      console.error("Submit error:", error);
      alert("Error submitting checklist");
    }
  };

  const getCategoryProgress = (category: ChecklistCategory) => {
    const total = category.items.length;
    const completed = category.items.filter((item) => formData[item.id]?.status !== "na").length;
    return { completed, total, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            Print
          </Button>
          <Button onClick={handleSubmit} className="bg-emerald-600 hover:bg-emerald-700">
            Submit Checklist
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {categories.map((category, catIndex) => {
          const progress = getCategoryProgress(category);
          return (
            <div key={catIndex} className="border rounded-xl overflow-hidden bg-white">
              <div className="bg-muted/30 px-5 py-3 border-b flex items-center justify-between">
                <h2 className="font-semibold text-lg">{category.category}</h2>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span>{progress.completed} / {progress.total} completed</span>
                  <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all"
                      style={{ width: `${progress.percentage}%` }}
                    />
                  </div>
                  <span>{progress.percentage}%</span>
                </div>
              </div>

              <div className="p-4 space-y-3">
                {category.items.map((item, itemIndex) => (
                  <ChecklistItem
                    key={`${catIndex}-${itemIndex}`}
                    item={item}
                    value={formData[item.id] || { status: "na", observation: "" }}
                    onChange={handleChange}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}