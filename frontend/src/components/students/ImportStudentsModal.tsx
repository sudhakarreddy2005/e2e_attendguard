import React, { useState } from 'react';
import { GlassModal } from '../ui/GlassModal';
import { studentService } from '../../services/studentService';
import { FileSpreadsheet, Upload, Download, CheckCircle2, AlertCircle, RefreshCw, X, FileText } from 'lucide-react';
import { Badge } from '../ui/Badge';

interface ImportStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ImportSummary {
  total_rows: number;
  imported_count: number;
  updated_count: number;
  skipped_count: number;
  errors: string[];
}

export const ImportStudentsModal: React.FC<ImportStudentsModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const ext = file.name.toLowerCase();
      if (!ext.endsWith('.csv') && !ext.endsWith('.xlsx') && !ext.endsWith('.xls')) {
        setErrorMessage('Invalid file format. Please upload a .csv or .xlsx / .xls file.');
        setSelectedFile(null);
        return;
      }
      setErrorMessage(null);
      setSelectedFile(file);
      setSummary(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const ext = file.name.toLowerCase();
      if (!ext.endsWith('.csv') && !ext.endsWith('.xlsx') && !ext.endsWith('.xls')) {
        setErrorMessage('Invalid file format. Please upload a .csv or .xlsx / .xls file.');
        setSelectedFile(null);
        return;
      }
      setErrorMessage(null);
      setSelectedFile(file);
      setSummary(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setErrorMessage(null);
    setSummary(null);

    try {
      const res = await studentService.importStudents(selectedFile);
      if (res.success && res.data) {
        setSummary(res.data);
        onSuccess();
      } else {
        setErrorMessage(res.error || 'Failed to process bulk import.');
      }
    } catch (err: any) {
      console.error('Import error:', err);
      setErrorMessage(err.response?.data?.detail || err.response?.data?.error || 'Import failed. Please verify file format.');
    } finally {
      setIsUploading(false);
    }
  };

  const resetModal = () => {
    setSelectedFile(null);
    setSummary(null);
    setErrorMessage(null);
  };

  return (
    <GlassModal isOpen={isOpen} onClose={onClose} title="Import Students (CSV / Excel)">
      <div className="space-y-4 text-xs">
        {/* Sample Template Bar */}
        <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <FileSpreadsheet className="w-5 h-5 text-[#007AFF] shrink-0" />
            <div>
              <p className="font-semibold text-slate-700 dark:text-slate-200">Need standard headers template?</p>
              <p className="text-[11px] text-slate-500">Supports columns: Roll_No, Name, Department, Section, Year, Phone, Email</p>
            </div>
          </div>
          <a
            href={studentService.getImportTemplateUrl()}
            download="AttendGuard_Student_Import_Template.csv"
            className="apple-btn-secondary px-3 py-1.5 text-[11px] font-bold flex items-center gap-1.5 shrink-0"
          >
            <Download className="w-3.5 h-3.5 text-[#007AFF]" /> Sample CSV
          </a>
        </div>

        {!summary ? (
          <>
            {/* Drag & Drop Upload Zone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-[#007AFF] rounded-2xl p-6 text-center transition-colors bg-white/40 dark:bg-white/[0.02] space-y-3 cursor-pointer relative"
            >
              <input
                type="file"
                accept=".csv, .xlsx, .xls"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />

              <div className="w-12 h-12 rounded-full bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center mx-auto">
                <Upload className="w-6 h-6" />
              </div>

              <div>
                <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">
                  {selectedFile ? selectedFile.name : 'Click to select or drag CSV / Excel file here'}
                </p>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  {selectedFile
                    ? `${(selectedFile.size / 1024).toFixed(1)} KB • Ready to import`
                    : 'Accepts .csv, .xlsx, or .xls format files'}
                </p>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-2xl bg-[#FF453A]/15 border border-[#FF453A]/30 text-[#FF453A] flex items-center gap-2 font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-black/5 dark:border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="apple-btn-secondary px-4 py-2 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
                className="apple-btn-primary px-5 py-2 text-xs font-bold shadow-md flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Processing Import...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" /> Import Student Records
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          /* Import Results Summary */
          <div className="space-y-4 pt-1">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 shrink-0" />
              <div>
                <h4 className="font-bold text-sm">Bulk Import Processed Successfully!</h4>
                <p className="text-[11px] opacity-90 mt-0.5">
                  Student directory and GuardDB database updated seamlessly.
                </p>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
                <p className="text-[10px] text-slate-500 font-bold uppercase">Total Rows</p>
                <p className="text-base font-extrabold text-slate-700 dark:text-slate-200 mt-0.5">{summary.total_rows}</p>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30">
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase">Created</p>
                <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">{summary.imported_count}</p>
              </div>
              <div className="p-3 rounded-2xl bg-[#007AFF]/15 border border-[#007AFF]/30">
                <p className="text-[10px] text-[#007AFF] font-bold uppercase">Updated</p>
                <p className="text-base font-extrabold text-[#007AFF] mt-0.5">{summary.updated_count}</p>
              </div>
              <div className="p-3 rounded-2xl bg-[#FF9F0A]/15 border border-[#FF9F0A]/30">
                <p className="text-[10px] text-[#FF9F0A] font-bold uppercase">Skipped</p>
                <p className="text-base font-extrabold text-[#FF9F0A] mt-0.5">{summary.skipped_count}</p>
              </div>
            </div>

            {summary.errors.length > 0 && (
              <div className="p-3 rounded-2xl bg-[#FF453A]/10 border border-[#FF453A]/20 space-y-1.5 max-h-36 overflow-y-auto">
                <p className="font-bold text-[#FF453A] text-[11px]">Warnings & Skipped Rows ({summary.errors.length}):</p>
                <ul className="space-y-1 text-[10px] text-slate-600 dark:text-slate-300 font-mono">
                  {summary.errors.map((err, i) => (
                    <li key={i}>• {err}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-black/5 dark:border-white/10">
              <button
                type="button"
                onClick={resetModal}
                className="apple-btn-secondary px-4 py-2 text-xs font-semibold cursor-pointer"
              >
                Import Another File
              </button>
              <button
                type="button"
                onClick={() => {
                  resetModal();
                  onClose();
                }}
                className="apple-btn-primary px-5 py-2 text-xs font-bold shadow-md cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </GlassModal>
  );
};
