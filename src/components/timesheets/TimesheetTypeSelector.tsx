"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TimesheetTypeSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function TimesheetTypeSelector({ value, onChange }: TimesheetTypeSelectorProps) {
  return (
    <div className="px-4">
      <Tabs
        value={value}
        onValueChange={onChange}
        className="w-full"
      >
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="INSPECTION">Inspection Timesheets</TabsTrigger>
          <TabsTrigger value="TRAINING">Training Timesheets</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
