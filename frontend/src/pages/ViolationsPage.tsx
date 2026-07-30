import React, { useEffect, useState, useRef } from 'react';
import { AlertTriangle, Plus, Trash2, CheckCircle, Search, Upload, Image as ImageIcon, RefreshCw, Calendar, Filter, X } from 'lucide-react';
import { violationService } from '../services/violationService';
import { studentService } from '../services/studentService';
import { Violation } from '../types/violation';
import { Badge } from '../components/ui/Badge';
import { PageTransition } from '../components/ui/PageTransition';
import { EmptyState } from '../components/ui/EmptyState';
import { SkeletonTableRow } from '../components/ui/Skeleton';
import { GlassModal } from '../components/ui/GlassModal';

const VIOLATION_TYPE_STYLES: Record<string, string> = {
  'Late Arrival': 'bg-[#FF9F0A]/15 text-[#FF9F0A] border-[#FF9F0A]/30',
  'Dress Code': 'bg-[#BF5AF2]/15 text-[#BF5AF2] border-[#BF5AF2]/30',
  'Bunk': 'bg-[#FF453A]/15 text-[#FF453A] border-[#FF453A]/30',
};

export const ViolationsPage: React.FC = () => {
  const [violations, setViolations] = useState<Violation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Lazy Yielding limit state (10 items per batch)
  const [displayLimit, setDisplayLimit] = useState(10);

  // Filters
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [locationFilter, setLocationFilter] = useState('ALL');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');

  // Reset lazy yield limit whenever filter criteria change
  useEffect(() => {
    setDisplayLimit(10);
  }, [search, typeFilter, locationFilter, deptFilter, dateFilter]);

  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [rollNo, setRollNo] = useState('');
  const [vType, setVType] = useState('Late Arrival');
  const [location, setLocation] = useState('Central Block');
  const [dept, setDept] = useState('CSE');
  const [section, setSection] = useState('A');
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Drag & Drop / Image Comparison states
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
  const [dbStudentImage, setDbStudentImage] = useState<string | null>(null);
  const [matchedStudentName, setMatchedStudentName] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchViolations = () => {
    setIsLoading(true);
    violationService.getViolations()
      .then((data) => setViolations(data))
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchViolations();
  }, []);

  // When rollNo changes, attempt to look up DB image & name
  useEffect(() => {
    if (rollNo.trim().length >= 5) {
      const dbUrl = studentService.getStudentImage(rollNo.trim().toUpperCase());
      setDbStudentImage(dbUrl);
      studentService.getStudents().then((all) => {
        const found = all.find((s) => s.roll_no.toUpperCase() === rollNo.trim().toUpperCase());
        if (found) {
          setMatchedStudentName(found.name);
          setDept(found.department);
          setSection(found.section);
        }
      }).catch(() => {});
    } else {
      setDbStudentImage(null);
      setMatchedStudentName(null);
    }
  }, [rollNo]);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, JPEG, WEBP, HEIF).');
      return;
    }
    setUploadedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const clearAllFilters = () => {
    setSearch('');
    setTypeFilter('ALL');
    setLocationFilter('ALL');
    setDeptFilter('ALL');
    setDateFilter('');
  };

  const filteredViolations = violations.filter((v) => {
    // 1. Search text match
    const matchesSearch =
      v.roll_no.toLowerCase().includes(search.toLowerCase()) ||
      (v.student_name || '').toLowerCase().includes(search.toLowerCase()) ||
      v.location.toLowerCase().includes(search.toLowerCase()) ||
      v.remarks.toLowerCase().includes(search.toLowerCase());

    // 2. Type filter
    const matchesType = typeFilter === 'ALL' || v.type === typeFilter;

    // 3. Location filter
    const matchesLocation = locationFilter === 'ALL' || v.location.toLowerCase() === locationFilter.toLowerCase();

    // 4. Dept filter
    const matchesDept = deptFilter === 'ALL' || (v.department || '').toUpperCase() === deptFilter.toUpperCase();

    // 5. Date Calendar filter
    let matchesDate = true;
    if (dateFilter) {
      const rawDateStr = v.created_at || v.iso_date || v.date || '';
      if (rawDateStr) {
        try {
          const isoFormatted = new Date(rawDateStr).toISOString().slice(0, 10);
          matchesDate = isoFormatted === dateFilter || rawDateStr.startsWith(dateFilter);
        } catch {
          matchesDate = rawDateStr.includes(dateFilter);
        }
      }
    }

    return matchesSearch && matchesType && matchesLocation && matchesDept && matchesDate;
  });

  const yieldedViolations = filteredViolations.slice(0, displayLimit);
  const hasMoreViolations = filteredViolations.length > displayLimit;

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this violation record?')) return;
    try {
      await violationService.deleteViolation(id);
      fetchViolations();
    } catch {
      alert('Failed to delete');
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await violationService.updateStatus(id, newStatus);
      fetchViolations();
    } catch {
      alert('Failed to update');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await violationService.createViolation({
        roll_no: rollNo.toUpperCase(),
        type: vType,
        location,
        department: dept,
        section,
        remarks: remarks || (uploadedFile ? 'Uploaded image incident log' : 'Manual entry'),
      });
      setShowAddModal(false);
      setRollNo('');
      setRemarks('');
      setUploadedFile(null);
      setUploadedImagePreview(null);
      setDbStudentImage(null);
      fetchViolations();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Creation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFiltered = search || typeFilter !== 'ALL' || locationFilter !== 'ALL' || deptFilter !== 'ALL' || dateFilter !== '';

  return (
    <PageTransition className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200">Violation Incident Log</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Showing {yieldedViolations.length} of {filteredViolations.length} incident records ({violations.length} total in GuardDB)
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="apple-btn-primary flex items-center gap-2 px-4 py-2.5 text-xs font-bold shadow-md self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-white" strokeWidth={2} /> Log New Incident
        </button>
      </div>

      {/* Advanced Search & Multi-Filter Control Bar with Calendar Date Picker */}
      <div className="glass-panel p-4 rounded-[24px] space-y-3 shadow-md border border-white/60 dark:border-white/10">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
          <Filter className="w-4 h-4 text-[#007AFF]" strokeWidth={2} />
          <span>Incident Filter Controls</span>
          {isFiltered && (
            <button
              onClick={clearAllFilters}
              className="ml-auto text-[11px] font-semibold text-[#FF453A] hover:underline flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" /> Clear Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {/* Search Bar */}
          <div className="relative sm:col-span-2 lg:col-span-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student / roll no..."
              className="w-full pl-9 pr-3 py-2 rounded-2xl bg-white/70 dark:bg-white/10 border border-slate-200 dark:border-white/10 text-xs text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-[#007AFF]"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" strokeWidth={2} />
          </div>

          {/* Date Calendar Picker */}
          <div className="relative">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-2xl bg-white/70 dark:bg-white/10 border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-[#007AFF]"
              title="Filter by Date"
            />
            <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" strokeWidth={2} />
          </div>

          {/* Violation Type Dropdown */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-2xl bg-white/70 dark:bg-white/10 border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-[#007AFF]"
            >
              <option value="ALL">All Categories</option>
              <option value="Late Arrival">Late Arrival</option>
              <option value="Dress Code">Dress Code</option>
              <option value="Bunk">Bunk</option>
            </select>
          </div>

          {/* Location Dropdown */}
          <div>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-2xl bg-white/70 dark:bg-white/10 border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-[#007AFF]"
            >
              <option value="ALL">All Locations</option>
              <option value="Central Block">Central Block</option>
              <option value="A Block">A Block</option>
              <option value="B Block">B Block</option>
              <option value="C Block">C Block</option>
              <option value="D Block">D Block</option>
            </select>
          </div>

          {/* Department Dropdown */}
          <div>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-2xl bg-white/70 dark:bg-white/10 border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-[#007AFF]"
            >
              <option value="ALL">All Depts</option>
              <option value="CSE">CSE</option>
              <option value="ECE">ECE</option>
              <option value="EEE">EEE</option>
              <option value="MECH">MECH</option>
            </select>
          </div>
        </div>
      </div>

      {/* Violations Table */}
      <div className="glass-panel rounded-[24px] overflow-hidden shadow-lg border border-white/60 dark:border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-black/10 dark:border-white/10 bg-white/50 dark:bg-white/[0.04] text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                <th className="py-4 px-4.5">Student</th>
                <th className="py-4 px-4.5">Violation Type</th>
                <th className="py-4 px-4.5">Location</th>
                <th className="py-4 px-4.5">Date & Time</th>
                <th className="py-4 px-4.5">Remarks</th>
                <th className="py-4 px-4.5 text-center">Status</th>
                <th className="py-4 px-4.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/10 text-xs">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonTableRow key={i} columns={7} />)
              ) : yieldedViolations.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState icon={AlertTriangle} title="No violations found" subtitle="No incident records match your selected date or criteria." />
                  </td>
                </tr>
              ) : (
                yieldedViolations.map((v) => (
                  <tr key={v._id} className="table-row-hover even:bg-white/35 dark:even:bg-white/[0.02]">
                    <td className="py-3.5 px-4.5">
                      <div className="font-semibold text-slate-700 dark:text-slate-200">{v.student_name || 'Student'}</div>
                      <div className="text-[11px] font-mono text-[#007AFF] font-bold">{v.roll_no}</div>
                    </td>
                    <td className="py-3.5 px-4.5">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${VIOLATION_TYPE_STYLES[v.type] || 'bg-black/5 text-slate-600 border-black/10'}`}>
                        {v.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4.5 text-slate-600 dark:text-slate-300 font-medium">{v.location}</td>
                    <td className="py-3.5 px-4.5 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                      {v.created_at ? new Date(v.created_at).toLocaleDateString() : v.date || 'Today'}
                    </td>
                    <td className="py-3.5 px-4.5 text-slate-500 dark:text-slate-400 max-w-xs truncate">{v.remarks}</td>
                    <td className="py-3.5 px-4.5 text-center">
                      <Badge variant={v.status === 'Resolved' ? 'success' : v.status === 'Reviewed' ? 'info' : 'warning'} dot>
                        {v.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {v.status === 'Pending' && (
                          <button onClick={() => handleUpdateStatus(v._id, 'Resolved')} className="p-1.5 rounded-xl hover:bg-[#30D158]/15 text-[#30D158] transition-colors" title="Mark Resolved">
                            <CheckCircle className="w-4 h-4" strokeWidth={2} />
                          </button>
                        )}
                        <button onClick={() => handleDelete(v._id)} className="p-1.5 rounded-xl hover:bg-[#FF453A]/15 text-[#FF453A] transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" strokeWidth={2} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Lazy Yielding Load More Controls */}
        {hasMoreViolations && (
          <div className="flex flex-col items-center justify-center p-4 border-t border-black/5 dark:border-white/10 space-y-2 bg-white/40 dark:bg-white/[0.02]">
            <p className="text-xs text-slate-500 font-medium">
              Showing <span className="font-bold text-slate-700 dark:text-slate-200">{yieldedViolations.length}</span> of <span className="font-bold text-slate-700 dark:text-slate-200">{filteredViolations.length}</span> incident records
            </p>
            <button
              onClick={() => setDisplayLimit((prev) => prev + 10)}
              className="apple-btn-secondary px-6 py-2 text-xs font-bold shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#007AFF]" />
              Load Next 10 Incidents
            </button>
          </div>
        )}
      </div>

      {/* Log Violation Modal */}
      <GlassModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Log Incident with Image Verification" maxWidth="max-w-xl">
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          {/* Drag and Drop Zone */}
          <div>
            <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1.5">
              Upload Image (Supports PNG, JPG, JPEG, WEBP, HEIF)
            </label>
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
                dragActive ? 'border-[#007AFF] bg-[#007AFF]/10' : 'border-slate-300 dark:border-white/20 hover:border-[#007AFF]/60 bg-black/5 dark:bg-white/5'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/webp, image/heic, image/heif"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                className="hidden"
              />
              <Upload className="w-7 h-7 mx-auto text-[#007AFF] mb-1 animate-bounce" strokeWidth={2} />
              <p className="font-semibold text-slate-700 dark:text-slate-200">
                Drag & drop incident photo here, or <span className="text-[#007AFF] underline">browse file</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Supports PNG, JPG, JPEG, WEBP, HEIF</p>
            </div>
          </div>

          {/* Side-by-Side Comparison Preview */}
          {(uploadedImagePreview || dbStudentImage) && (
            <div className="p-3.5 rounded-2xl bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-[#007AFF]" /> Side-by-Side Face Verification
                </span>
                {matchedStudentName && <span className="text-[11px] font-bold text-[#30D158]">{matchedStudentName}</span>}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                {/* Uploaded Image */}
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-semibold text-slate-400 mb-1">Uploaded Incident Photo</span>
                  <div className="w-28 h-28 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-white/20 shadow-xs flex items-center justify-center">
                    {uploadedImagePreview ? (
                      <img src={uploadedImagePreview} alt="Uploaded" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px] text-slate-400">No upload</span>
                    )}
                  </div>
                </div>

                {/* DB Enrolled Image */}
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-semibold text-slate-400 mb-1">Database Enrolled Photo</span>
                  <div className="w-28 h-28 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-white/20 shadow-xs flex items-center justify-center">
                    {dbStudentImage ? (
                      <img
                        src={dbStudentImage}
                        alt="DB Enrolled"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(rollNo || 'Student')}&background=007AFF&color=fff`;
                        }}
                      />
                    ) : (
                      <span className="text-[10px] text-slate-400">Enter Roll No</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form Fields */}
          <div>
            <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">Student Roll Number</label>
            <input
              type="text"
              value={rollNo}
              onChange={(e) => setRollNo(e.target.value.toUpperCase())}
              placeholder="e.g. 23BQ1A05A9"
              className="w-full px-3.5 py-2.5 rounded-2xl bg-white/60 dark:bg-white/10 border border-black/10 dark:border-white/10 font-mono text-slate-700 dark:text-white focus:outline-none focus:border-[#007AFF]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">Violation Type</label>
              <select
                value={vType}
                onChange={(e) => setVType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-white/60 dark:bg-white/10 border border-black/10 dark:border-white/10 text-slate-700 dark:text-white font-semibold"
              >
                <option value="Late Arrival">Late Arrival</option>
                <option value="Dress Code">Dress Code</option>
                <option value="Bunk">Bunk</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">Location</label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-white/60 dark:bg-white/10 border border-black/10 dark:border-white/10 text-slate-700 dark:text-white font-semibold"
              >
                <option value="Central Block">Central Block</option>
                <option value="A Block">A Block</option>
                <option value="B Block">B Block</option>
                <option value="C Block">C Block</option>
                <option value="D Block">D Block</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">Remarks</label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Add details..."
              className="w-full px-3.5 py-2 rounded-2xl bg-white/60 dark:bg-white/10 border border-black/10 dark:border-white/10 text-slate-700 dark:text-white focus:outline-none focus:border-[#007AFF] h-16"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowAddModal(false)} className="apple-btn-secondary px-4 py-2 text-xs font-semibold">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="apple-btn-primary px-4 py-2 text-xs font-bold shadow-md disabled:opacity-50">
              {isSubmitting ? 'Logging...' : 'Log Violation Incident'}
            </button>
          </div>
        </form>
      </GlassModal>
    </PageTransition>
  );
};
