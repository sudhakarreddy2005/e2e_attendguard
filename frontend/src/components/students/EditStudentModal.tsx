import React, { useState } from 'react';
import { GlassModal } from '../ui/GlassModal';
import { Student } from '../../types/student';
import { studentService } from '../../services/studentService';
import { UserCheck, Save, X } from 'lucide-react';

interface EditStudentModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditStudentModal: React.FC<EditStudentModalProps> = ({
  student,
  isOpen,
  onClose,
  onSuccess,
}) => {
  if (!student) return null;

  const [name, setName] = useState(student.name || '');
  const [year, setYear] = useState(student.year || '3rd Year');
  const [department, setDepartment] = useState(student.department || 'CSE');
  const [section, setSection] = useState(student.section || 'A');
  const [phone, setPhone] = useState(student.contact_info?.phone || '');
  const [email, setEmail] = useState(student.contact_info?.email || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await studentService.updateStudent(student.roll_no, {
        name,
        year,
        department,
        section,
        phone,
        email,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to update student profile:', err);
      alert(err.response?.data?.error || err.response?.data?.detail || 'Failed to update student profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <GlassModal isOpen={isOpen} onClose={onClose} title={`Edit Student Profile (${student.roll_no})`}>
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
            Roll Number (Immutable)
          </label>
          <input
            type="text"
            value={student.roll_no}
            disabled
            className="w-full px-3.5 py-2.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 font-mono text-slate-500 dark:text-slate-400 cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
            Full Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Student Full Name"
            className="w-full px-3.5 py-2.5 rounded-2xl bg-white/60 dark:bg-white/10 border border-black/10 dark:border-white/10 text-slate-700 dark:text-white focus:outline-none focus:border-[#007AFF] font-medium"
            required
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
              Academic Year
            </label>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full px-3 py-2.5 rounded-2xl bg-white/60 dark:bg-white/10 border border-black/10 dark:border-white/10 text-slate-700 dark:text-white font-semibold"
            >
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
              Department
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3 py-2.5 rounded-2xl bg-white/60 dark:bg-white/10 border border-black/10 dark:border-white/10 text-slate-700 dark:text-white font-semibold"
            >
              <option value="CSE">CSE</option>
              <option value="ECE">ECE</option>
              <option value="EEE">EEE</option>
              <option value="MECH">MECH</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
              Section
            </label>
            <select
              value={section}
              onChange={(e) => setSection(e.target.value)}
              className="w-full px-3 py-2.5 rounded-2xl bg-white/60 dark:bg-white/10 border border-black/10 dark:border-white/10 text-slate-700 dark:text-white font-semibold"
            >
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
              Contact Phone
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 9876543210"
              className="w-full px-3.5 py-2.5 rounded-2xl bg-white/60 dark:bg-white/10 border border-black/10 dark:border-white/10 text-slate-700 dark:text-white focus:outline-none focus:border-[#007AFF]"
            />
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@institution.edu"
              className="w-full px-3.5 py-2.5 rounded-2xl bg-white/60 dark:bg-white/10 border border-black/10 dark:border-white/10 text-slate-700 dark:text-white focus:outline-none focus:border-[#007AFF]"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/5 dark:border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="apple-btn-secondary px-4 py-2 text-xs font-semibold cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="apple-btn-primary px-5 py-2 text-xs font-bold shadow-md flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            {isSubmitting ? 'Saving Changes...' : 'Save Profile Changes'}
          </button>
        </div>
      </form>
    </GlassModal>
  );
};
