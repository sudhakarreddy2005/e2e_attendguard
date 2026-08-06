import React, { useEffect, useState } from 'react';
import { Users, Search, Plus, Download, Eye, Trash2, ChevronDown, ShieldAlert, FileSpreadsheet } from 'lucide-react';
import { studentService } from '../services/studentService';
import { Student } from '../types/student';
import { StudentProfileModal } from '../components/students/StudentProfileModal';
import { EditStudentModal } from '../components/students/EditStudentModal';
import { ImportStudentsModal } from '../components/students/ImportStudentsModal';
import { WebcamPhotoInput } from '../components/students/WebcamPhotoInput';
import { PageTransition } from '../components/ui/PageTransition';
import { EmptyState } from '../components/ui/EmptyState';
import { SkeletonTableRow } from '../components/ui/Skeleton';
import { GlassModal } from '../components/ui/GlassModal';
import { useAuth } from '../contexts/AuthContext';

export const StudentsPage: React.FC = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [sectionFilter, setSectionFilter] = useState('ALL');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);

  // Lazy Yielding / Pagination state to prevent crashes
  const [displayLimit, setDisplayLimit] = useState(10);

  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [newRollNo, setNewRollNo] = useState('');
  const [newName, setNewName] = useState('');
  const [newDept, setNewDept] = useState('CSE');
  const [newSection, setNewSection] = useState('A');
  const [newYear, setNewYear] = useState('3rd Year');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Role permissions check:
  const normalizedRole = (user?.role || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const canDeleteStudent = ['admin', 'superadmin', 'principal', 'deo', 'hod'].includes(normalizedRole);
  const canEditStudent = ['admin', 'superadmin', 'deo'].includes(normalizedRole);

  const fetchStudents = () => {
    setIsLoading(true);
    studentService.getStudents()
      .then((data) => setStudents(data))
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const filteredStudents = students.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.roll_no.toLowerCase().includes(search.toLowerCase());
    const matchesDept = deptFilter === 'ALL' || s.department === deptFilter;
    const matchesSection = sectionFilter === 'ALL' || s.section === sectionFilter;
    return matchesSearch && matchesDept && matchesSection;
  });

  // Lazy yielded list slice
  const visibleStudents = filteredStudents.slice(0, displayLimit);

  const handleLoadMore = () => {
    setDisplayLimit((prev) => prev + 10);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile) return;
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('roll_no', newRollNo);
    formData.append('name', newName);
    formData.append('department', newDept);
    formData.append('section', newSection);
    formData.append('year', newYear);
    formData.append('image', imageFile);

    try {
      await studentService.registerStudent(formData);
      setShowRegisterModal(false);
      setNewRollNo('');
      setNewName('');
      setImageFile(null);
      fetchStudents();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStudent = async (student: Student) => {
    if (!canDeleteStudent) {
      alert('Access Denied: Only Admin, Principal, DEO, and HOD can delete student records.');
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to delete student ${student.name} (${student.roll_no})?\n\nThis action will permanently delete their profile, face embeddings, violation logs, and training photos from GuardDB.`
      )
    ) {
      return;
    }

    try {
      await studentService.deleteStudent(student.roll_no);
      fetchStudents();
    } catch (err: any) {
      alert(err.response?.data?.detail || err.response?.data?.error?.message || 'Failed to delete student');
    }
  };

  const exportCSV = () => {
    const headers = 'Roll No,Name,Department,Section,Violations,Late,Bunk,Dress Code\n';
    const rows = filteredStudents.map((s) => `${s.roll_no},"${s.name}",${s.department},${s.section},${s.violations_count},${s.late_count},${s.bunk_count},${s.dress_code_count}`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AttendGuard_Students_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <PageTransition className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200">Student Directory</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Yielding {visibleStudents.length} of {filteredStudents.length} matching enrolled students (GuardDB)
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button onClick={exportCSV} className="apple-btn-secondary flex items-center gap-2 px-4 py-2.5 text-xs font-semibold cursor-pointer">
            <Download className="w-4 h-4 text-[#007AFF]" strokeWidth={2} /> Export CSV
          </button>
          {canEditStudent && (
            <button onClick={() => setShowImportModal(true)} className="apple-btn-secondary flex items-center gap-2 px-4 py-2.5 text-xs font-semibold cursor-pointer" title="Import Students from CSV / Excel">
              <FileSpreadsheet className="w-4 h-4 text-[#34C759]" strokeWidth={2} /> Import CSV / Excel
            </button>
          )}
          <button onClick={() => setShowRegisterModal(true)} className="apple-btn-primary flex items-center gap-2 px-4 py-2.5 text-xs font-bold shadow-md cursor-pointer">
            <Plus className="w-4 h-4 text-white" strokeWidth={2} /> Register Student
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="glass-panel p-4.5 rounded-[22px] flex flex-col sm:flex-row items-center gap-3.5 shadow-md">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setDisplayLimit(10);
            }}
            placeholder="Search by name or roll number..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/60 dark:bg-white/10 border border-black/10 dark:border-white/10 text-xs text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-[#007AFF] font-medium"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" strokeWidth={2} />
        </div>
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <select
            value={deptFilter}
            onChange={(e) => {
              setDeptFilter(e.target.value);
              setDisplayLimit(10);
            }}
            className="px-3.5 py-2.5 rounded-2xl bg-white/60 dark:bg-white/10 border border-black/10 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="ALL">All Depts</option>
            <option value="CSE">CSE</option>
            <option value="ECE">ECE</option>
            <option value="EEE">EEE</option>
            <option value="MECH">MECH</option>
            <option value="CIVIL">CIVIL</option>
            <option value="IT">IT</option>
            <option value="CIC">CIC</option>
            <option value="CSO">CSO</option>
            <option value="CSM">CSM</option>
            <option value="AIDS">AIDS</option>
          </select>
          <select
            value={sectionFilter}
            onChange={(e) => {
              setSectionFilter(e.target.value);
              setDisplayLimit(10);
            }}
            className="px-3.5 py-2.5 rounded-2xl bg-white/60 dark:bg-white/10 border border-black/10 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="ALL">All Sections</option>
            <option value="A">Section A</option>
            <option value="B">Section B</option>
            <option value="C">Section C</option>
            <option value="D">Section D</option>
          </select>
        </div>
      </div>

      {/* Student Table */}
      <div className="glass-panel rounded-[24px] overflow-hidden shadow-lg border border-white/60 dark:border-white/10 space-y-2">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-black/10 dark:border-white/10 bg-white/50 dark:bg-white/[0.04] text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                <th className="py-4 px-4.5">Student</th>
                <th className="py-4 px-4.5">Roll Number</th>
                <th className="py-4 px-4.5">Class</th>
                <th className="py-4 px-4.5 text-center">Violations</th>
                <th className="py-4 px-4.5 text-center">Breakdown</th>
                <th className="py-4 px-4.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/10 text-xs">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => <SkeletonTableRow key={i} columns={6} />)
              ) : visibleStudents.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState icon={Users} title="No students found" subtitle="Try adjusting your search or filter criteria." />
                  </td>
                </tr>
              ) : (
                visibleStudents.map((s) => (
                  <tr
                    key={s.roll_no}
                    onClick={() => setSelectedStudent(s)}
                    className="table-row-hover even:bg-white/35 dark:even:bg-white/[0.02] cursor-pointer"
                  >
                    <td className="py-3.5 px-4.5 font-semibold text-slate-700 dark:text-slate-200">
                      <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden border-2 border-white/80 dark:border-white/20 shadow-sm ring-2 ring-pink-300/30 shrink-0">
                          <img
                            src={studentService.getStudentImage(s.roll_no, s.updated_at)}
                            alt={s.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=FFB6C1&color=700&bold=true&rounded=true`;
                            }}
                          />
                        </div>
                        <span className="font-semibold text-slate-700 dark:text-slate-200">{s.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4.5 font-mono font-semibold text-[#007AFF] dark:text-[#0A84FF]">{s.roll_no}</td>
                    <td className="py-3.5 px-4.5 font-medium text-slate-600 dark:text-slate-300">{s.department}-{s.section}</td>
                    <td className="py-3.5 px-4.5 text-center font-bold text-slate-700 dark:text-slate-200">{s.violations_count}</td>
                    <td className="py-3.5 px-4.5 text-center">
                      <div className="flex items-center justify-center gap-1.5 text-[10px]">
                        <span className="px-2 py-0.5 rounded-full bg-[#FF9F0A]/15 text-[#FF9F0A] font-bold">L: {s.late_count || 0}</span>
                        <span className="px-2 py-0.5 rounded-full bg-[#FF453A]/15 text-[#FF453A] font-bold">B: {s.bunk_count || 0}</span>
                        <span className="px-2 py-0.5 rounded-full bg-[#BF5AF2]/15 text-[#BF5AF2] font-bold">D: {s.dress_code_count || 0}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedStudent(s);
                          }}
                          className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-[#007AFF] transition-colors cursor-pointer"
                          title="View Profile"
                        >
                          <Eye className="w-4 h-4" strokeWidth={2} />
                        </button>
                        {canDeleteStudent && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteStudent(s);
                            }}
                            className="p-2 rounded-xl hover:bg-[#FF453A]/15 text-[#FF453A] transition-colors cursor-pointer"
                            title="Delete Student Record (Admin/HOD/DEO/Principal)"
                          >
                            <Trash2 className="w-4 h-4" strokeWidth={2} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Lazy Yielding / Load More Control Bar */}
        {filteredStudents.length > visibleStudents.length && (
          <div className="p-4 border-t border-black/5 dark:border-white/10 flex flex-col items-center justify-center space-y-2 bg-white/40 dark:bg-white/5">
            <p className="text-xs text-slate-500 font-medium">
              Yielding {visibleStudents.length} of {filteredStudents.length} students to prevent browser memory overload.
            </p>
            <button
              onClick={handleLoadMore}
              className="apple-btn-secondary px-6 py-2.5 text-xs font-bold flex items-center gap-2 shadow-sm"
            >
              <ChevronDown className="w-4 h-4 text-[#007AFF]" strokeWidth={2} /> Load Next 10 Students
            </button>
          </div>
        )}
      </div>

      {selectedStudent && (
        <StudentProfileModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
          canEdit={canEditStudent}
          onEdit={() => {
            const st = selectedStudent;
            setSelectedStudent(null);
            setEditingStudent(st);
          }}
        />
      )}

      {editingStudent && (
        <EditStudentModal
          student={editingStudent}
          isOpen={!!editingStudent}
          onClose={() => setEditingStudent(null)}
          onSuccess={fetchStudents}
        />
      )}

      <ImportStudentsModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={fetchStudents}
      />

      {/* Register Student GlassModal */}
      <GlassModal isOpen={showRegisterModal} onClose={() => setShowRegisterModal(false)} title="Register Student">
        <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">Roll Number</label>
            <input type="text" value={newRollNo} onChange={(e) => setNewRollNo(e.target.value.toUpperCase())} placeholder="e.g. 23BQ1A05A9" className="w-full px-3.5 py-2.5 rounded-2xl bg-white/60 dark:bg-white/10 border border-black/10 dark:border-white/10 font-mono text-slate-700 dark:text-white focus:outline-none focus:border-[#007AFF]" required />
          </div>
          <div>
            <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">Full Name</label>
            <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. John Doe" className="w-full px-3.5 py-2.5 rounded-2xl bg-white/60 dark:bg-white/10 border border-black/10 dark:border-white/10 text-slate-700 dark:text-white focus:outline-none focus:border-[#007AFF]" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">Department</label>
              <select value={newDept} onChange={(e) => setNewDept(e.target.value)} className="w-full px-3.5 py-2.5 rounded-2xl bg-white/60 dark:bg-white/10 border border-black/10 dark:border-white/10 text-slate-700 dark:text-white font-semibold">
                <option value="CSE">CSE</option>
                <option value="ECE">ECE</option>
                <option value="EEE">EEE</option>
                <option value="MECH">MECH</option>
                <option value="CIVIL">CIVIL</option>
                <option value="IT">IT</option>
                <option value="CIC">CIC</option>
                <option value="CSO">CSO</option>
                <option value="CSM">CSM</option>
                <option value="AIDS">AIDS</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">Section</label>
              <select value={newSection} onChange={(e) => setNewSection(e.target.value)} className="w-full px-3.5 py-2.5 rounded-2xl bg-white/60 dark:bg-white/10 border border-black/10 dark:border-white/10 text-slate-700 dark:text-white font-semibold">
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
                <option value="D">Section D</option>
              </select>
            </div>
          </div>
          <WebcamPhotoInput
            selectedFile={imageFile}
            onImageSelected={setImageFile}
            label="Face Registration Photo"
            required
          />
          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowRegisterModal(false)} className="apple-btn-secondary px-4 py-2 text-xs font-semibold">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="apple-btn-primary px-4 py-2 text-xs font-bold shadow-md disabled:opacity-50">{isSubmitting ? 'Registering...' : 'Register Student'}</button>
          </div>
        </form>
      </GlassModal>
    </PageTransition>
  );
};
