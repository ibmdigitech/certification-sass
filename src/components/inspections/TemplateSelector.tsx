"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { FileText, Star, Check } from "lucide-react";
import { format } from "date-fns";

interface TemplateSelectorProps {
  templates: Array<{
    id: number;
    name: string;
    description?: string;
    type: string;
    isDefault: boolean;
    createdAt: string | Date;
    creator?: { name: string };
  }>;
  selectedTemplateId?: number;
  onSelect: (templateId: number) => void;
  onCreateTemplate?: () => void;
}

export function TemplateSelector({
  templates,
  selectedTemplateId,
  onSelect,
  onCreateTemplate,
}: TemplateSelectorProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Select Report Template
        </CardTitle>
        {onCreateTemplate && (
          <Button variant="outline" size="sm" onClick={onCreateTemplate}>
            Create Template
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {templates.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No templates available</p>
            <p className="text-sm">Create a template to get started</p>
          </div>
        ) : (
          <RadioGroup
            value={selectedTemplateId?.toString()}
            onValueChange={(value) => onSelect(parseInt(value))}
            className="space-y-3"
          >
            {templates.map((template) => (
              <div
                key={template.id}
                className={`flex items-start space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedTemplateId === template.id ? "border-blue-500 bg-blue-50" : "border-gray-200"
                }`}
              >
                <RadioGroupItem value={template.id.toString()} id={`template-${template.id}`} className="mt-1" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`template-${template.id}`} className="font-medium cursor-pointer">
                      {template.name}
                    </Label>
                    {template.isDefault && (
                      <Badge variant="secondary" className="gap-1">
                        <Star className="h-3 w-3 fill-current" />
                        Default
                      </Badge>
                    )}
                    <Badge variant="outline">{template.type}</Badge>
                  </div>
                  {template.description && (
                    <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                    <span>Created: {format(new Date(template.createdAt), "MMM d, yyyy")}</span>
                    {template.creator && <span>By: {template.creator.name}</span>}
                  </div>
                </div>
                {selectedTemplateId === template.id && (
                  <Check className="h-5 w-5 text-blue-500 mt-1" />
                )}
              </div>
            ))}
          </RadioGroup>
        )}
      </CardContent>
    </Card>
  );
}