"use client";

import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { UploadCloud, FileSpreadsheet, CheckCircle, AlertTriangle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export interface ParsedJobRow {
  index: number;
  data: Record<string, any>;
  status: 'VALID' | 'WARNING' | 'ERROR';
  errors: string[];
  warnings: string[];
}

export function BulkJobImporter() {
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<ParsedJobRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const processData = (data: any[]) => {
    setIsProcessing(true);
    
    // Simulate validation
    const parsedRows: ParsedJobRow[] = data.map((row, index) => {
      const errors: string[] = [];
      const warnings: string[] = [];
      
      // Basic validation rules based on requirements
      if (!row['Customer'] && !row['customer']) {
        errors.push('Customer is missing');
      }
      
      const acc = row['Accreditation'] || row['accreditation'];
      if (acc && !['EIAC', 'ENAS', 'NONE'].includes(acc.toUpperCase())) {
        errors.push(`Invalid accreditation: ${acc}`);
      }

      if (row['Job Number'] || row['job number']) {
        // Randomly simulate a duplicate job warning
        if (Math.random() > 0.9) {
          warnings.push(`Existing job number`);
        }
      }

      let status: 'VALID' | 'WARNING' | 'ERROR' = 'VALID';
      if (errors.length > 0) status = 'ERROR';
      else if (warnings.length > 0) status = 'WARNING';

      return { index, data: row, status, errors, warnings };
    });

    setRows(parsedRows);
    setIsProcessing(false);
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const f = acceptedFiles[0];
    setFile(f);
    
    const isCSV = f.name.endsWith('.csv');
    
    if (isCSV) {
      Papa.parse(f, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => processData(results.data),
      });
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);
        processData(jsonData);
      };
      reader.readAsArrayBuffer(f);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    accept: { 
      'text/csv': ['.csv'], 
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1 
  });

  const startImport = async () => {
    setIsImporting(true);
    const validRows = rows.filter(r => r.status !== 'ERROR');
    
    for (let i = 0; i < validRows.length; i++) {
      // Simulate API call for each valid row
      await new Promise(res => setTimeout(res, 50));
      setProgress(Math.round(((i + 1) / validRows.length) * 100));
    }
    
    setIsImporting(false);
    alert(`Successfully imported ${validRows.length} jobs.`);
    setFile(null);
    setRows([]);
    setProgress(0);
  };

  const stats = {
    total: rows.length,
    valid: rows.filter(r => r.status === 'VALID').length,
    warnings: rows.filter(r => r.status === 'WARNING').length,
    errors: rows.filter(r => r.status === 'ERROR').length,
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <div 
          {...getRootProps()} 
          className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-accent/50'
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-2">
            <div className="p-4 bg-primary/10 rounded-full">
              <UploadCloud className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-medium mt-2">Upload Excel or CSV</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Template fields: Job Number, Customer, Location, Service, Accreditation, Scheduled Date, Trainee Name...
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-card border rounded-xl overflow-hidden">
          <div className="p-6 border-b flex justify-between items-start">
            <div>
              <h3 className="text-xl font-medium flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-primary" />
                Bulk Job Import Preview
              </h3>
              <p className="text-sm text-muted-foreground mt-1">File: {file.name}</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm font-medium bg-muted/30 p-3 rounded-lg border">
              <div className="flex flex-col items-center">
                <span className="text-muted-foreground text-xs uppercase">Total</span>
                <span>{stats.total}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-green-500 text-xs uppercase">Valid</span>
                <span>{stats.valid}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-amber-500 text-xs uppercase">Warnings</span>
                <span>{stats.warnings}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-red-500 text-xs uppercase">Errors</span>
                <span>{stats.errors}</span>
              </div>
            </div>
          </div>
          
          <div className="max-h-[500px] overflow-y-auto divide-y bg-muted/10">
            {isProcessing ? (
              <div className="p-12 flex justify-center text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin mr-2" /> Validating rows...
              </div>
            ) : rows.length > 0 ? (
              rows.map(row => (
                <div key={row.index} className="p-4 flex gap-4 hover:bg-muted/30">
                  <div className="shrink-0 w-8 text-center text-muted-foreground text-xs pt-1">
                    #{row.index + 2} {/* +2 for header and 0-index */}
                  </div>
                  
                  <div className="flex-1 space-y-1">
                    <div className="text-sm font-medium">
                      {row.data['Job Number'] || row.data['job number'] || <span className="italic text-muted-foreground">System-generated ID</span>}
                      {' - '}
                      {row.data['Customer'] || row.data['customer'] || 'Unknown Customer'}
                    </div>
                    <div className="text-xs text-muted-foreground flex gap-4">
                      <span>Service: {row.data['Service'] || row.data['Training / Inspection Type'] || '-'}</span>
                      <span>Accreditation: {row.data['Accreditation'] || '-'}</span>
                    </div>
                  </div>
                  
                  <div className="shrink-0 w-48">
                    {row.status === 'ERROR' && (
                      <div className="text-red-500 text-xs space-y-1">
                        {row.errors.map((e, i) => <div key={i} className="flex items-start gap-1"><XCircle className="w-3 h-3 mt-0.5 shrink-0"/> ❌ {e}</div>)}
                      </div>
                    )}
                    {row.status === 'WARNING' && (
                      <div className="text-amber-500 text-xs space-y-1">
                        {row.warnings.map((e, i) => <div key={i} className="flex items-start gap-1"><AlertTriangle className="w-3 h-3 mt-0.5 shrink-0"/> ⚠ {e}</div>)}
                      </div>
                    )}
                    {row.status === 'VALID' && (
                      <div className="text-green-500 text-xs flex items-center gap-1">
                        <CheckCircle className="w-3 h-3"/> ✓ Ready
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : null}
          </div>
          
          <div className="p-4 border-t flex flex-col gap-4">
            {isImporting && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Processing...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
            
            <div className="flex justify-between items-center">
              <Button variant="outline" onClick={() => { setFile(null); setRows([]); }} disabled={isImporting}>
                Cancel
              </Button>
              <div className="flex gap-2">
                {stats.errors > 0 && (
                  <Button variant="outline" className="text-red-500 border-red-200 hover:bg-red-50" disabled={isImporting}>
                    Download Errors
                  </Button>
                )}
                <Button 
                  onClick={startImport} 
                  disabled={isImporting || stats.valid + stats.warnings === 0}
                  className={stats.errors > 0 ? "bg-amber-600 hover:bg-amber-700" : ""}
                >
                  {isImporting ? (
                    <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Creating Jobs...</span>
                  ) : (
                    `Create ${stats.valid + stats.warnings} Valid Jobs`
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
