import React, { useState, useEffect } from 'react';
import { UserPlus, CheckCircle2, XCircle, Search, Clock, ShieldCheck, Trash2, AlertTriangle } from 'lucide-react';
import { authService } from '../services/authService';
import { PageTransition } from '../components/ui/PageTransition';
import { EmptyState } from '../components/ui/EmptyState';
import { SkeletonTableRow } from '../components/ui/Skeleton';
import { GlassModal } from '../components/ui/GlassModal';

export const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState('faculty');
  const [inviteDept, setInviteDept] = useState('CSE');
  const [inviteDesignation, setInviteDesignation] = useState('Assistant Professor');
  const [formMsg, setFormMsg] = useState({ text: '', type: '' });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await authService.listUsers();
      let rawList: any[] = [];
      if (res && res.data) {
        rawList = Array.isArray(res.data) ? res.data : [];
      } else if (Array.isArray(res)) {
        rawList = res;
      }
      setUsers(rawList);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg({ text: '', type: '' });
    try {
      const res = await authService.inviteUser({
        email: inviteEmail,
        name: inviteName,
        role: inviteRole,
        department: inviteDept,
        designation: inviteDesignation,
      });
      if (res && res.success) {
        setFormMsg({ text: res.message || 'User onboarded!', type: 'success' });
        setTimeout(() => {
          setShowInviteModal(false);
          setInviteEmail('');
          setInviteName('');
          loadData();
        }, 1500);
      }
    } catch (err: any) {
      setFormMsg({ text: err.response?.data?.detail || 'Failed to onboard user', type: 'error' });
    }
  };

  const handleRoleChange = async (userIdentifier: string, newRole: string) => {
    try {
      await authService.updateUserRole(userIdentifier, newRole);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusToggle = async (userIdentifier: string, currentStatus: boolean) => {
    try {
      await authService.toggleUserStatus(userIdentifier, !currentStatus);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    const targetEmail = userToDelete.email || userToDelete.username;
    setIsDeleting(true);
    try {
      await authService.deleteUser(targetEmail);
      setUserToDelete(null);
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete user account');
    } finally {
      setIsDeleting(false);
    }
  };

  const loadAuditLogs = async () => {
    setShowAuditModal(true);
    try {
      const res = await authService.getAuditLogs();
      if (res && res.data) {
        setAuditLogs(Array.isArray(res.data) ? res.data : []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    const emailStr = String(u.email || u.username || '').toLowerCase();
    const nameStr = String(u.name || u.display_name || u.username || '').toLowerCase();
    const roleStr = String(u.role || '').toLowerCase();
    return emailStr.includes(q) || nameStr.includes(q) || roleStr.includes(q);
  });

  return (
    <PageTransition className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
            Institutional User Management
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#0078D4]/15 text-[#0078D4] dark:text-[#2896F3] font-semibold border border-[#0078D4]/30">
              Super Admin Portal
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Manage official VVIT Microsoft Entra ID (@vvit.net) accounts, assign RBAC roles, and audit access
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button onClick={loadAuditLogs} className="apple-btn-secondary flex items-center gap-2 px-4 py-2.5 text-xs font-semibold">
            <Clock className="w-4 h-4 text-[#BF5AF2]" strokeWidth={2} /> Security Audit Log
          </button>
          <button onClick={() => setShowInviteModal(true)} className="apple-btn-primary flex items-center gap-2 px-4 py-2.5 text-xs font-bold shadow-md">
            <UserPlus className="w-4 h-4 text-white" strokeWidth={2} /> Onboard New User
          </button>
        </div>
      </div>

      <div className="glass-panel p-4 rounded-[22px] flex items-center justify-between shadow-md">
        <div className="relative w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" strokeWidth={2} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by email, name, or role..."
            className="w-full pl-10 pr-4 py-2 rounded-2xl bg-black/5 dark:bg-white/10 text-xs border border-white/20 dark:border-white/10 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-[#007AFF]"
          />
        </div>
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Enrolled VVIT Users: {users.length}</span>
      </div>

      <div className="glass-panel rounded-[24px] overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-black/5 dark:bg-white/[0.04] border-b border-black/10 dark:border-white/10 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4">User Info</th>
                <th className="p-4">Institutional Role</th>
                <th className="p-4">Department & Designation</th>
                <th className="p-4">Auth Provider</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/10">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => <SkeletonTableRow key={i} columns={6} />)
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState title="No users found" subtitle="No users match your search query." />
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u, idx) => {
                  const userEmail = u.email || u.username || 'admin@vvit.net';
                  const userName = u.name || u.display_name || u.username || u.email || 'User';
                  const initial = userName[0] ? userName[0].toUpperCase() : 'U';
                  const userKey = u._id || userEmail || `user-${idx}`;

                  return (
                    <tr key={userKey} className="table-row-hover">
                      <td className="p-4">
                        <div className="flex items-center gap-3.5">
                          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#0078D4] to-[#00A4EF] text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                            {initial}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-700 dark:text-slate-200">{userName}</p>
                            <p className="text-[11px] text-slate-400 font-mono">{userEmail}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <select
                          value={(u.role || 'STUDENT').toUpperCase()}
                          onChange={(e) => handleRoleChange(userEmail, e.target.value)}
                          className="px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10 text-slate-700 dark:text-slate-200 font-semibold text-xs capitalize"
                        >
                          <option value="SUPER_ADMIN">Super Admin</option>
                          <option value="PRINCIPAL">Principal</option>
                          <option value="HOD">HOD</option>
                          <option value="DEO">DEO</option>
                          <option value="SECURITY">Security Staff</option>
                          <option value="STUDENT">Student</option>
                        </select>
                      </td>
                      <td className="p-4 text-slate-500 dark:text-slate-400">
                        <p className="font-semibold text-slate-700 dark:text-slate-200">{u.department || 'N/A'}</p>
                        <p className="text-[11px]">{u.designation || 'Staff'}</p>
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold border bg-[#0078D4]/15 text-[#0078D4] dark:text-[#2896F3] border-[#0078D4]/30 flex items-center gap-1 w-fit">
                          <ShieldCheck className="w-3 h-3" /> Microsoft Entra ID
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1 w-fit ${
                            u.is_active !== false
                              ? 'bg-[#30D158]/15 text-[#30D158] border border-[#30D158]/30'
                              : 'bg-[#FF453A]/15 text-[#FF453A] border border-[#FF453A]/30'
                          }`}
                        >
                          {u.is_active !== false ? <CheckCircle2 className="w-3 h-3" strokeWidth={2} /> : <XCircle className="w-3 h-3" strokeWidth={2} />}
                          {u.is_active !== false ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleStatusToggle(userEmail, u.is_active !== false)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                              u.is_active !== false ? 'bg-[#FF9500]/15 text-[#FF9500] hover:bg-[#FF9500]/25' : 'bg-[#30D158]/15 text-[#30D158] hover:bg-[#30D158]/25'
                            }`}
                          >
                            {u.is_active !== false ? 'Suspend' : 'Activate'}
                          </button>

                          <button
                            onClick={() => setUserToDelete(u)}
                            title="Delete User Account"
                            className="p-1.5 rounded-xl bg-[#FF453A]/15 text-[#FF453A] hover:bg-[#FF453A] hover:text-white transition-all cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" strokeWidth={2} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Onboard User Modal */}
      <GlassModal isOpen={showInviteModal} onClose={() => setShowInviteModal(false)} title="Onboard VVIT Institutional User">
        {formMsg.text && (
          <div className={`p-3 rounded-2xl text-xs font-semibold mb-3 ${formMsg.type === 'success' ? 'bg-[#30D158]/15 text-[#30D158]' : 'bg-[#FF453A]/15 text-[#FF453A]'}`}>
            {formMsg.text}
          </div>
        )}
        <form onSubmit={handleInviteUser} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-500 dark:text-slate-400 mb-1 font-semibold">VVIT Email (@vvit.net)</label>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="faculty@vvit.net"
              className="w-full px-3.5 py-2.5 rounded-2xl bg-black/5 dark:bg-white/10 border border-white/20 dark:border-white/10 text-slate-700 dark:text-white font-mono"
              required
            />
          </div>
          <div>
            <label className="block text-slate-500 dark:text-slate-400 mb-1 font-semibold">Full Name</label>
            <input
              type="text"
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              placeholder="Dr. A. Srinivas"
              className="w-full px-3.5 py-2.5 rounded-2xl bg-black/5 dark:bg-white/10 border border-white/20 dark:border-white/10 text-slate-700 dark:text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-500 dark:text-slate-400 mb-1 font-semibold">Role</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-black/5 dark:bg-white/10 border border-white/20 dark:border-white/10 text-slate-700 dark:text-white font-semibold"
              >
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="PRINCIPAL">Principal</option>
                <option value="HOD">HOD</option>
                <option value="DEO">DEO</option>
                <option value="SECURITY">Security Staff</option>
                <option value="STUDENT">Student</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-500 dark:text-slate-400 mb-1 font-semibold">Dept</label>
              <select
                value={inviteDept}
                onChange={(e) => setInviteDept(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-black/5 dark:bg-white/10 border border-white/20 dark:border-white/10 text-slate-700 dark:text-white font-semibold"
              >
                <option value="CSE">CSE</option>
                <option value="ECE">ECE</option>
                <option value="EEE">EEE</option>
                <option value="MECH">MECH</option>
                <option value="CIVIL">CIVIL</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-slate-500 dark:text-slate-400 mb-1 font-semibold">Designation</label>
            <input
              type="text"
              value={inviteDesignation}
              onChange={(e) => setInviteDesignation(e.target.value)}
              placeholder="Head of Department"
              className="w-full px-3.5 py-2.5 rounded-2xl bg-black/5 dark:bg-white/10 border border-white/20 dark:border-white/10 text-slate-700 dark:text-white"
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowInviteModal(false)} className="apple-btn-secondary px-4 py-2 text-xs font-semibold">
              Cancel
            </button>
            <button type="submit" className="apple-btn-primary px-4 py-2 text-xs font-bold shadow-md">
              Onboard User
            </button>
          </div>
        </form>
      </GlassModal>

      {/* Delete User Confirmation Modal */}
      <GlassModal isOpen={!!userToDelete} onClose={() => setUserToDelete(null)} title="Delete Institutional User Account">
        {userToDelete && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-[#FF453A]/10 border border-[#FF453A]/30 flex items-start gap-3 text-[#FF453A]">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm">Irreversible Database Deletion</p>
                <p className="mt-1 font-medium text-xs">
                  Deleting <strong className="font-mono">{userToDelete.email || userToDelete.username}</strong> will remove their account privileges, authentication records, and IAM role assignment from GuardDB.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 space-y-1 font-mono text-[11px]">
              <p><span className="text-slate-400 font-sans">Name:</span> {userToDelete.name || userToDelete.display_name || userToDelete.username}</p>
              <p><span className="text-slate-400 font-sans">Role:</span> {userToDelete.role}</p>
              <p><span className="text-slate-400 font-sans">Email:</span> {userToDelete.email || userToDelete.username}</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/5 dark:border-white/10">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="apple-btn-secondary px-4 py-2 text-xs font-semibold cursor-pointer"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={isDeleting}
                className="px-4 py-2 rounded-2xl bg-[#FF453A] hover:bg-[#D73A30] text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeleting ? 'Deleting...' : 'Confirm Permanent Deletion'}</span>
              </button>
            </div>
          </div>
        )}
      </GlassModal>

      {/* Audit Log Modal */}
      <GlassModal isOpen={showAuditModal} onClose={() => setShowAuditModal(false)} title="Security Audit Log Trail" maxWidth="max-w-2xl">
        <div className="max-h-[60vh] overflow-y-auto divide-y divide-black/5 dark:divide-white/10 pr-1 text-xs">
          {auditLogs.length === 0 ? (
            <EmptyState title="No audit logs" subtitle="No security events have been recorded yet." />
          ) : (
            auditLogs.map((log, idx) => (
              <div key={idx} className="py-2.5 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-[#0078D4] dark:text-[#2896F3] font-mono">{log.user || 'system'}</span>
                  <span className="text-slate-400">{log.created_at ? new Date(log.created_at).toLocaleString() : 'Just now'}</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 font-medium">{log.description}</p>
              </div>
            ))
          )}
        </div>
      </GlassModal>
    </PageTransition>
  );
};
