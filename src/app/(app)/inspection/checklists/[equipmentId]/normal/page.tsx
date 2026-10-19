"use client";

import { useParams } from "next/navigation";
import ChecklistRenderer from "../ChecklistRenderer";
import { getChecklist } from "../checklist-data";

export default function NormalChecklistPage() {
  const params = useParams();
  const equipmentId = (params?.equipmentId as string) || "";
  const categories = getChecklist(equipmentId, "normal");

  return (
    <ChecklistRenderer
      title={`Normal Checklist – ${equipmentId.charAt(0).toUpperCase() + equipmentId.slice(1)}`}
      categories={categories}
      equipmentId={equipmentId}
      checklistType="normal"
    />
  );
}