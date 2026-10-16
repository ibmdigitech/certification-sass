"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { GitMerge, ArrowRight, AlertTriangle, CheckCircle2, Loader2, ShieldAlert } from "lucide-react";

interface CustomerOption {
  id: number;
  name: string | null;
  code: string | null;
  contact: string | null;
  status: string;
  _count?: { sites: number; assets: number; jobs: number };
}

export default function CustomersMergePage() {
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [sourceId, setSourceId] = useState<string>("");
  const [targetId, setTargetId] = useState<string>("");
  const [merging, setMerging] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/customers");
      if (res.ok) {
        const json = await res.json();
        setCustomers((json.customers || []).filter((c: any) => c.status !== "merged_archived"));
      }
    } catch (err) {
      console.error("Failed to load customers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const sourceCustomer = customers.find((c) => String(c.id) === sourceId);
  const targetCustomer = customers.find((c) => String(c.id) === targetId);

  const handleMerge = async () => {
    if (!sourceId || !targetId || sourceId === targetId) return;

    try {
      setMerging(true);
      setResultMessage(null);
      const res = await fetch("/api/customers/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceCustomerId: Number(sourceId),
          targetCustomerId: Number(targetId),
        }),
      });

      const json = await res.json();
      if (res.ok) {
        setResultMessage(
          `Successfully merged ${json.sourceName} into ${json.targetName}. Reassigned ${json.sitesMoved} sites, ${json.assetsMoved} assets, and ${json.jobsMoved} jobs without data loss.`
        );
        setSourceId("");
        setTargetId("");
        fetchCustomers();
      } else {
        alert(json.error || "Merge failed");
      }
    } catch (err) {
      console.error("Failed to merge:", err);
    } finally {
      setMerging(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Customers Merge Utility</h1>
        <p className="text-sm text-muted-foreground">
          Consolidate duplicate customer profiles, reassign registered assets, sites, and job histories safely
        </p>
      </div>

      {resultMessage && (
        <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 p-4 rounded-xl flex items-start gap-3 text-sm">
          <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Merge Operation Completed</p>
            <p className="text-xs mt-0.5">{resultMessage}</p>
          </div>
        </div>
      )}

      {/* Warning Box */}
      <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl flex items-start gap-3 text-sm text-amber-800 dark:text-amber-400">
        <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <p className="font-bold">Transaction-Safe Consolidation Rule</p>
          <p>
            All historical certificates, issued inspection reports, quotations, timesheets, and invoices will be atomically reassigned to the target customer. The source account will be archived rather than deleted to ensure complete compliance traceability.
          </p>
        </div>
      </div>

      {/* Select From/To Card matching Screenshot Page 4 */}
      <Card className="border shadow-sm">
        <CardHeader className="bg-muted/40 border-b pb-4">
          <CardTitle className="text-base font-semibold">Select From / To Customer</CardTitle>
          <CardDescription>Choose the source profile to be merged and the target master profile</CardDescription>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* From Customer */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-red-600 dark:text-red-400">
                1. From Customer (Source to Archive) *
              </Label>
              <Select value={sourceId} onValueChange={setSourceId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select source customer" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {customers
                    .filter((c) => String(c.id) !== targetId)
                    .map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name || c.contact} ({c.code || `#${c.id}`})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              {sourceCustomer && (
                <div className="p-3 bg-muted/40 rounded-lg text-xs space-y-1 border">
                  <div className="font-semibold">{sourceCustomer.name || sourceCustomer.contact}</div>
                  <div className="text-muted-foreground flex gap-3 text-[11px]">
                    <span>{sourceCustomer._count?.sites ?? 0} Sites</span>
                    <span>{sourceCustomer._count?.assets ?? 0} Assets</span>
                    <span>{sourceCustomer._count?.jobs ?? 0} Jobs</span>
                  </div>
                </div>
              )}
            </div>

            {/* To Customer */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                2. To Customer (Master to Keep) *
              </Label>
              <Select value={targetId} onValueChange={setTargetId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select target customer" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {customers
                    .filter((c) => String(c.id) !== sourceId)
                    .map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name || c.contact} ({c.code || `#${c.id}`})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              {targetCustomer && (
                <div className="p-3 bg-muted/40 rounded-lg text-xs space-y-1 border">
                  <div className="font-semibold">{targetCustomer.name || targetCustomer.contact}</div>
                  <div className="text-muted-foreground flex gap-3 text-[11px]">
                    <span>{targetCustomer._count?.sites ?? 0} Sites</span>
                    <span>{targetCustomer._count?.assets ?? 0} Assets</span>
                    <span>{targetCustomer._count?.jobs ?? 0} Jobs</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>

        <CardFooter className="bg-muted/20 border-t pt-4 flex justify-end">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                disabled={!sourceId || !targetId || sourceId === targetId || merging}
                className="shadow-sm"
              >
                {merging ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <GitMerge className="mr-2 h-4 w-4" />
                )}
                Execute Customer Merge
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Customer Consolidation</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to merge <strong>{sourceCustomer?.name}</strong> into{" "}
                  <strong>{targetCustomer?.name}</strong>?
                  <br />
                  <br />
                  All linked sites, equipment assets, and jobs will be permanently reassigned to the target customer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleMerge}>
                  Yes, Execute Merge
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      </Card>
    </div>
  );
}
