"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, Plus, Trash2, CheckCircle2, Sliders, Loader2 } from "lucide-react";

interface DefinitionCategory {
  id: number;
  code: string;
  name: string;
  items: DefinitionItem[];
  _count?: { items: number };
}

interface DefinitionItem {
  id: number;
  key: string;
  value: string;
  isActive: boolean;
  sortOrder: number;
}

export default function GeneralDefinitionsPage() {
  const [categories, setCategories] = useState<DefinitionCategory[]>([]);
  const [selectedCat, setSelectedCat] = useState<DefinitionCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchCat, setSearchCat] = useState("");
  const [searchItem, setSearchItem] = useState("");

  // Add Item Dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchDefinitions = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/setup/definitions");
      if (res.ok) {
        const json = await res.json();
        const cats = json.categories || [];
        setCategories(cats);
        if (cats.length > 0 && !selectedCat) {
          setSelectedCat(cats[0]);
        } else if (selectedCat) {
          const updated = cats.find((c: any) => c.id === selectedCat.id);
          if (updated) setSelectedCat(updated);
        }
      }
    } catch (err) {
      console.error("Failed to load definitions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDefinitions();
  }, []);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCat || !newKey || !newValue) return;

    try {
      setSubmitting(true);
      const res = await fetch("/api/setup/definitions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          definitionId: selectedCat.id,
          key: newKey,
          value: newValue,
        }),
      });
      if (res.ok) {
        setIsDialogOpen(false);
        setNewKey("");
        setNewValue("");
        fetchDefinitions();
      }
    } catch (err) {
      console.error("Error adding definition item:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCategories = categories.filter(
    (c) =>
      c.code.toLowerCase().includes(searchCat.toLowerCase()) ||
      c.name.toLowerCase().includes(searchCat.toLowerCase())
  );

  const filteredItems = (selectedCat?.items || []).filter(
    (item) =>
      item.key.toLowerCase().includes(searchItem.toLowerCase()) ||
      item.value.toLowerCase().includes(searchItem.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">General Definitions</h1>
        <p className="text-sm text-muted-foreground">
          Controlled master lookup tables, standard disclaimers, measurement units, and certification schemes
        </p>
      </div>

      {/* Two-Pane Master Detail Grid matching Screenshot Page 4 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Pane: Categories List (Col 5) */}
        <Card className="lg:col-span-5 border shadow-sm">
          <CardHeader className="p-4 border-b bg-muted/40 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">Master Categories</CardTitle>
            <Badge variant="outline" className="text-xs">
              {categories.length} Categories
            </Badge>
          </CardHeader>

          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Filter categories..."
                value={searchCat}
                onChange={(e) => setSearchCat(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>
          </div>

          <div className="divide-y max-h-[600px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              filteredCategories.map((cat) => {
                const isSelected = selectedCat?.id === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCat(cat)}
                    className={`w-full text-left p-3 flex items-center justify-between transition text-xs ${
                      isSelected
                        ? "bg-primary/10 text-primary font-bold border-l-4 border-primary"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <div>
                      <div className="font-semibold">{cat.code}</div>
                      <div className="text-[11px] text-muted-foreground font-normal line-clamp-1">
                        {cat.name}
                      </div>
                    </div>
                    <Badge variant={isSelected ? "default" : "secondary"} className="text-[10px] ml-2 shrink-0">
                      {cat.items?.length ?? cat._count?.items ?? 0}
                    </Badge>
                  </button>
                );
              })
            )}
          </div>
        </Card>

        {/* Right Pane: Items Details Table (Col 7) */}
        <Card className="lg:col-span-7 border shadow-sm flex flex-col">
          <CardHeader className="p-4 border-b bg-muted/40 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold">
                {selectedCat ? `${selectedCat.code} — Configuration Details` : "Details"}
              </CardTitle>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {selectedCat?.name}
              </p>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-8 shadow-sm">
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add Row
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Entry to {selectedCat?.code}</DialogTitle>
                  <DialogDescription>
                    Add a new lookup value for this controlled dropdown category.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddItem} className="space-y-4 py-2">
                  <div className="space-y-1">
                    <Label htmlFor="key">Key / Identifier *</Label>
                    <Input
                      id="key"
                      placeholder="e.g. HIGH or SWL_TONS"
                      value={newKey}
                      onChange={(e) => setNewKey(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="val">Display Value / Description *</Label>
                    <Input
                      id="val"
                      placeholder="e.g. High Priority (24h response)"
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      required
                    />
                  </div>
                  <DialogFooter className="pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save Entry
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>

          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search definition values..."
                value={searchItem}
                onChange={(e) => setSearchItem(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>
          </div>

          <div className="flex-1 overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="w-12 font-bold text-xs">#</TableHead>
                  <TableHead className="font-bold text-xs">Key</TableHead>
                  <TableHead className="font-bold text-xs">Value</TableHead>
                  <TableHead className="font-bold text-xs text-center w-20">Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center text-xs text-muted-foreground">
                      No definition values added yet. Click &quot;Add Row&quot; to configure.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item, idx) => (
                    <TableRow key={item.id} className="text-xs hover:bg-muted/10">
                      <TableCell className="font-mono text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell className="font-mono font-semibold">{item.key}</TableCell>
                      <TableCell className="font-medium text-foreground">{item.value}</TableCell>
                      <TableCell className="text-center">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
}
