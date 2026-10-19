"use client";

import { useParams } from "next/navigation";
import ChecklistRenderer from "../ChecklistRenderer";
import { getChecklist } from "../checklist-data";

export default function FullChecklistPage() {
  const params = useParams();
  const equipmentId = (params?.equipmentId as string) || "";
  const categories = getChecklist(equipmentId, "full");

  return (
    <ChecklistRenderer
      title={`Full Checklist – ${equipmentId.charAt(0).toUpperCase() + equipmentId.slice(1)}`}
      categories={categories}
      equipmentId={equipmentId}
      checklistType="full"
    />
  );
}