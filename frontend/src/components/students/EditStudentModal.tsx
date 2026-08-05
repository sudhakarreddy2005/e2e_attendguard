import React, { useState } from 'react';
import { GlassModal } from '../ui/GlassModal';
import { Student } from '../../types/student';
import { studentService } from '../../services/studentService';
import { useAuth } from '../../contexts/AuthContext';
import { Save, Camera, ShieldCheck, Lock, Upload } from 'lucide-react';

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

  const { user } = useAuth();
  const userRoleNorm = (user?.role || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const isAdmin = ['admin', 'superadmin'].includes(userRoleNorm);

  const [rollNo, setRollNo] = useState(student.roll_no || '');
  const [name, setName] = useState(student.name || '');
  const [year, setYear] = useState(student.year || '3rd Year');
  const [department, setDepartment] = useState(student.department || 'CSE');
  const [section, setSection] = useState(student.section || 'A');
  const [phone, setPhone] = useState(student.contact_info?.phone || '');
  const [email, setEmail] = useState(student.contact_info?.email || '');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData();

      if (isAdmin && rollNo.trim().toUpperCase() !== student.roll_no.trim().toUpperCase()) {
        formData.append('new_roll_no', rollNo.trim().toUpperCase());
      }

      formData.append('name', name);
      formData.append('year', year);
      formData.append('department', department);
      formData.append('section', section);
      formData.append('phone', phone);
      formData.append('email', email);

      if (isAdmin && imageFile) {
        formData.append('image', imageFile);
      }

      const res = await studentService.updateStudent(student.roll_no, formData);

      if (res.success === false || res.error) {
        alert(res.error || 'Failed to update student profile');
        return;
      }

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
    <GlassModal isOpen={isOpen} onClose={onClose} title={`Edit Profile — ${student.name} (${student.roll_no})`}>
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        
        {/* Roll Number Section */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-slate-700 dark:text-slate-200 font-semibold">
              Roll Number
            </label>
            {isAdmin ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Admin Privileged
              </span>
            ) : (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-slate-500 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Admin Only
              </span>
            )}
          </div>
          <input
            type="text"
            value={isAdmin ? rollNo : student.roll_no}
            onChange={(e) => isAdmin && setRollNo(e.target.value.toUpperCase())}
            disabled={!isAdmin}
            placeholder="e.g. 23BQ1A05A9"
            className={`w-full px-3.5 py-2.5 rounded-2xl border font-mono font-bold transition-all ${
              isAdmin
                ? 'bg-white/80 dark:bg-white/10 border-[#007AFF]/30 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007AFF]/50'
                : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-slate-400 dark:text-slate-500 cursor-not-allowed'
            }`}
            required
          />
        </div>

        {/* Full Name */}
        <div>
          <label className="block text-slate-700 dark:text-slate-200 font-semibold mb-1">
            Full Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Student Full Name"
            className="w-full px-3.5 py-2.5 rounded-2xl bg-white/80 dark:bg-white/10 border border-black/10 dark:border-white/10 text-slate-800 dark:text-white focus:outline-none focus:border-[#007AFF] font-medium"
            required
          />
        </div>

        {/* Academic Year, Dept, Section */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-slate-700 dark:text-slate-200 font-semibold mb-1">
              Academic Year
            </label>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full px-3 py-2.5 rounded-2xl bg-white/80 dark:bg-white/10 border border-black/10 dark:border-white/10 text-slate-800 dark:text-white font-semibold"
            >
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-200 font-semibold mb-1">
              Department
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3 py-2.5 rounded-2xl bg-white/80 dark:bg-white/10 border border-black/10 dark:border-white/10 text-slate-800 dark:text-white font-semibold"
            >
              <option value="CSE">CSE</option>
              <option value="ECE">ECE</option>
              <option value="EEE">EEE</option>
              <option value="MECH">MECH</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-200 font-semibold mb-1">
              Section
            </label>
            <select
              value={section}
              onChange={(e) => setSection(e.target.value)}
              className="w-full px-3 py-2.5 rounded-2xl bg-white/80 dark:bg-white/10 border border-black/10 dark:border-white/10 text-slate-800 dark:text-white font-semibold"
            >
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
            </select>
          </div>
        </div>

        {/* Contact Phone & Email */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-700 dark:text-slate-200 font-semibold mb-1">
              Contact Phone
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 9876543210"
              className="w-full px-3.5 py-2.5 rounded-2xl bg-white/80 dark:bg-white/10 border border-black/10 dark:border-white/10 text-slate-800 dark:text-white focus:outline-none focus:border-[#007AFF]"
            />
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-200 font-semibold mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@vvit.net"
              className="w-full px-3.5 py-2.5 rounded-2xl bg-white/80 dark:bg-white/10 border border-black/10 dark:border-white/10 text-slate-800 dark:text-white focus:outline-none focus:border-[#007AFF]"
            />
          </div>
        </div>

        {/* Face Image Update Section */}
        <div className="pt-2 border-t border-black/5 dark:border-white/10">
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-slate-700 dark:text-slate-200 font-semibold flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-[#007AFF]" /> Face Registration Photo
            </label>
            {isAdmin ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#007AFF]/10 text-[#007AFF] flex items-center gap-1">
                <Upload className="w-3 h-3" /> Re-embed Vision Profile
              </span>
            ) : (
              <span className="text-[10px] text-slate-400">Admin Only</span>
            )}
          </div>

          {isAdmin ? (
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-dashed border-black/20 dark:border-white/20">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-12 h-12 rounded-xl object-cover ring-2 ring-[#007AFF]"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center font-bold">
                    <Camera className="w-5 h-5" />
                  </div>
                )}
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full text-xs text-slate-500 dark:text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#007AFF] file:text-white hover:file:bg-[#0056b3] cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Uploading a new photo will calculate fresh 512D ArcFace embeddings & remove old embeddings.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 text-slate-400 text-center">
              Photo re-registration is restricted to Administrators.
            </div>
          )}
        </div>

        {/* Action Buttons */}
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
            {isSubmitting ? 'Saving & Generating Embeddings...' : 'Save Profile Changes'}
          </button>
        </div>
      </form>
    </GlassModal>
  );
};
