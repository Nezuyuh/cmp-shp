'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import { useAuth } from '@/hooks/useAuth';
import { productsApi } from '@/lib/api';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

const SYSTEM_FIELDS = ['name', 'brand', 'category', 'price', 'stock', 'sku', 'image_url', '(skip)'];

type ParsedRow = Record<string, string>;

interface SkippedRow {
  row: Record<string, string>;
  reason: string;
}

interface ImportResult {
  imported: number;
  skipped: SkippedRow[];
}

export default function AdminImportPage() {
  const router = useRouter();
  const { user, isAdmin, loading: authLoading } = useAuth();

  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [preview, setPreview] = useState<ParsedRow[]>([]);
  const [allRows, setAllRows] = useState<ParsedRow[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [importError, setImportError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.replace('/');
    }
  }, [user, isAdmin, authLoading, router]);

  const processFile = useCallback((file: File) => {
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext ?? '')) {
      setImportError('Only .xlsx, .xls, and .csv files are supported.');
      return;
    }
    setFileName(file.name);
    setResult(null);
    setImportError('');

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<ParsedRow>(sheet, { defval: '' });

        if (rows.length === 0) {
          setImportError('The file appears to be empty.');
          return;
        }

        const cols = Object.keys(rows[0]);
        setHeaders(cols);
        setPreview(rows.slice(0, 5));
        setAllRows(rows);

        // Auto-map columns that match known system fields (case-insensitive)
        const autoMap: Record<string, string> = {};
        for (const col of cols) {
          const lower = col.toLowerCase().replace(/\s+/g, '_');
          const match = SYSTEM_FIELDS.find((f) => f !== '(skip)' && f === lower);
          autoMap[col] = match ?? '(skip)';
        }
        setMapping(autoMap);
      } catch {
        setImportError('Failed to parse file. Make sure it is a valid spreadsheet.');
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleImport = async () => {
    setImporting(true);
    setImportError('');
    setResult(null);

    // Build rows using mapping
    const mappedRows = allRows.map((row) => {
      const mapped: Record<string, unknown> = {};
      for (const [col, field] of Object.entries(mapping)) {
        if (field !== '(skip)') {
          mapped[field] = row[col];
        }
      }
      return mapped;
    });

    try {
      const res = await productsApi.import(mappedRows);
      setResult(res as ImportResult);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Import failed.');
    } finally {
      setImporting(false);
    }
  };

  const reset = () => {
    setFileName('');
    setHeaders([]);
    setPreview([]);
    setAllRows([]);
    setMapping({});
    setResult(null);
    setImportError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (authLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <svg className="h-8 w-8 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Import Products</h1>
        <p className="mt-1 text-slate-400">Upload a CSV or Excel file to bulk-import products</p>
      </div>

      {/* Drop zone */}
      <Card className="mb-6">
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-12 cursor-pointer transition-colors ${
            dragging
              ? 'border-blue-500 bg-blue-500/10'
              : fileName
              ? 'border-green-500/50 bg-green-500/5'
              : 'border-slate-600 hover:border-slate-500 hover:bg-slate-700/30'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileInput}
            className="hidden"
          />
          {fileName ? (
            <>
              <svg className="h-10 w-10 text-green-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="font-medium text-white">{fileName}</p>
              <p className="text-sm text-slate-400 mt-1">{allRows.length} rows detected</p>
              <button
                onClick={(e) => { e.stopPropagation(); reset(); }}
                className="mt-3 text-xs text-red-400 hover:text-red-300 transition-colors"
              >
                Remove file
              </button>
            </>
          ) : (
            <>
              <svg className="h-12 w-12 text-slate-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-base font-medium text-slate-300">
                {dragging ? 'Drop file here' : 'Drag & drop or click to select'}
              </p>
              <p className="text-sm text-slate-500 mt-1">Supports .xlsx, .xls, .csv</p>
            </>
          )}
        </div>
      </Card>

      {importError && !headers.length && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {importError}
        </div>
      )}

      {/* Preview & mapping */}
      {headers.length > 0 && (
        <>
          {/* Preview table */}
          <Card className="mb-6">
            <h2 className="text-base font-semibold text-white mb-3">
              Preview (first {preview.length} rows)
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-700">
                    {headers.map((h) => (
                      <th key={h} className="px-3 py-2 text-left text-slate-400 font-medium whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {preview.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-700/20">
                      {headers.map((h) => (
                        <td key={h} className="px-3 py-2 text-slate-300 whitespace-nowrap max-w-[150px] truncate">
                          {row[h]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Column mapping */}
          <Card className="mb-6">
            <h2 className="text-base font-semibold text-white mb-1">Column Mapping</h2>
            <p className="text-sm text-slate-400 mb-4">
              Map each column from your file to the corresponding system field.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {headers.map((col) => (
                <div key={col} className="flex items-center gap-3 rounded-lg bg-[#0f172a] px-3 py-2">
                  <span className="text-sm text-slate-300 flex-1 truncate font-medium" title={col}>
                    {col}
                  </span>
                  <svg className="h-4 w-4 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                  <select
                    value={mapping[col] ?? '(skip)'}
                    onChange={(e) => setMapping((m) => ({ ...m, [col]: e.target.value }))}
                    className="rounded border border-slate-600 bg-[#1e293b] px-2 py-1 text-xs text-white focus:border-blue-500 focus:outline-none shrink-0"
                  >
                    {SYSTEM_FIELDS.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </Card>

          {importError && (
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
              {importError}
            </div>
          )}

          <div className="flex gap-3">
            <Button
              size="lg"
              onClick={handleImport}
              loading={importing}
              disabled={importing}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 11l3 3m0 0l3-3m-3 3V5" />
              </svg>
              Import {allRows.length} Row{allRows.length !== 1 ? 's' : ''}
            </Button>
            <Button variant="secondary" size="lg" onClick={reset} disabled={importing}>
              Reset
            </Button>
          </div>
        </>
      )}

      {/* Results */}
      {result && (
        <Card className="mt-6">
          <h2 className="text-base font-semibold text-white mb-4">Import Results</h2>

          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex items-center gap-2 rounded-lg bg-green-500/10 border border-green-500/30 px-4 py-3">
              <span className="text-xl">✅</span>
              <div>
                <p className="text-2xl font-bold text-green-400">{result.imported}</p>
                <p className="text-xs text-green-400/80">Imported</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30 px-4 py-3">
              <span className="text-xl">⚠️</span>
              <div>
                <p className="text-2xl font-bold text-yellow-400">{result.skipped.length}</p>
                <p className="text-xs text-yellow-400/80">Skipped</p>
              </div>
            </div>
          </div>

          {result.skipped.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-300 mb-2">Skipped Rows</h3>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {result.skipped.map((s, i) => (
                  <div key={i} className="rounded-lg bg-yellow-500/5 border border-yellow-500/20 px-3 py-2 text-xs">
                    <p className="text-yellow-400 font-medium mb-1">⚠️ {s.reason}</p>
                    <p className="text-slate-400 font-mono truncate">
                      {Object.entries(s.row)
                        .slice(0, 3)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(' | ')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
