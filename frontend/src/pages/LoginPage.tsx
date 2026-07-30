import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Lock, User, ArrowRight, AlertCircle, ChevronDown, Building2, Shield, Eye, EyeOff } from 'lucide-react';
import { authService } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';

export const LoginPage: React.FC = () => {
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDevSSOModal, setShowDevSSOModal] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const devAccounts = [
    { email: '23BQ1A05A9@vvit.net', role: 'Super Admin', name: 'K.Sudhakar Reddy', desc: 'Full System Control & User Invites' },
    { email: 'principal@vvit.net', role: 'Principal', name: 'Dr. Y. Mallikarjuna', desc: 'Campus Dashboard & Audit Reports' },
    { email: 'hod.cse@vvit.net', role: 'HOD (CSE)', name: 'Dr. A. Srinivas', desc: 'Department Analytics & Faculty Supervision' },
    { email: 'faculty.c@vvit.net', role: 'Faculty', name: 'Prof. M. Rajesh', desc: 'Class Attendance & Student Profiles' },
    { email: 'security.gate1@vvit.net', role: 'Security Staff', name: 'S. Ramprakash', desc: 'Gate Live Scanner & Violation Logging' },
    { email: 'deo.admin@vvit.net', role: 'DEO', name: 'P. Latha', desc: 'Student Registration & Records Editing' },
  ];

  const navigateByRole = (roleStr: string) => {
    const norm = (roleStr || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (norm.includes('security')) {
      navigate('/detect');
    } else if (norm === 'faculty') {
      navigate('/students');
    } else {
      navigate('/dashboard');
    }
  };

  const handleGoogleSSO = async (selectedEmail?: string) => {
    setError(''); setIsLoading(true);
    const targetEmail = selectedEmail || '23BQ1A05A9@vvit.net';
    try {
      const mockIdToken = btoa(JSON.stringify({ sub: `google_${targetEmail}`, email: targetEmail, name: devAccounts.find(a => a.email === targetEmail)?.name || targetEmail.split('@')[0], picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', email_verified: true }));
      const res = await authService.googleLogin(mockIdToken);
      if (res.success && res.data?.access_token) {
        login(res.data.access_token, { username: res.data.email, role: res.data.role, display_name: res.data.display_name || res.data.name, email: res.data.email, profile_photo: res.data.profile_photo });
        navigateByRole(res.data.role);
      } else { setError(res.message || 'Google SSO verification failed'); }
    } catch (err: any) { setError(err.response?.data?.detail || 'Institutional authentication failed'); }
    finally { setIsLoading(false); setShowDevSSOModal(false); }
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setIsLoading(true);
    try {
      const res = await authService.login(username, password);
      if (res.success && res.data?.access_token) {
        login(res.data.access_token, { username: res.data.username, role: res.data.role, display_name: res.data.display_name });
        navigateByRole(res.data.role);
      } else { setError(res.message || 'Login failed'); }
    } catch (err: any) { setError(err.response?.data?.detail || 'Invalid IT Administrator credentials'); }
    finally { setIsLoading(false); }
  };

  return (
    <div className="min-h-screen text-slate-900 dark:text-white flex items-center justify-center p-4 relative overflow-hidden select-none font-sans">
      {/* Floating Orbs */}
      <div className="login-orb w-[500px] h-[500px] -top-40 -left-40 bg-[#007AFF]/25" />
      <div className="login-orb w-[400px] h-[400px] -bottom-32 -right-32 bg-[#BF5AF2]/20" style={{ animationDelay: '-7s' }} />
      <div className="login-orb w-[300px] h-[300px] top-1/2 left-1/3 bg-[#30D158]/15" style={{ animationDelay: '-14s' }} />

      <div className="w-full max-w-lg relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="glass-panel rounded-[32px] p-8 sm:p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-56 h-1 bg-gradient-to-r from-transparent via-[#007AFF] to-transparent blur-xs" />

          <div className="flex flex-col items-center text-center mb-8">
            <motion.div whileHover={{ scale: 1.05, rotate: 2 }} className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#007AFF] via-[#00C6FF] to-[#BF5AF2] p-0.5 shadow-2xl mb-4 border border-white/40">
              <div className="w-full h-full bg-slate-950/80 backdrop-blur-xl rounded-[14px] flex items-center justify-center text-white">
                <ShieldCheck className="w-9 h-9 text-[#007AFF] dark:text-[#0A84FF]" strokeWidth={2} />
              </div>
            </motion.div>
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] font-bold bg-[#007AFF]/15 text-[#007AFF] dark:text-[#0A84FF] border border-[#007AFF]/30 mb-3 backdrop-blur-md">
              <Building2 className="w-3.5 h-3.5" strokeWidth={2} /> Institutional Access • @vvit.net
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">AttendGuard <span className="text-[#007AFF] dark:text-[#0A84FF]">3.0</span></h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs font-medium">AI Campus Monitoring Platform</p>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-6 p-3.5 rounded-2xl bg-[#FF453A]/15 border border-[#FF453A]/30 text-[#FF453A] text-xs font-medium flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={2} />{error}
            </motion.div>
          )}

          <div className="space-y-4">
            <button onClick={() => setShowDevSSOModal(true)} disabled={isLoading} className="w-full py-4 px-6 rounded-2xl apple-btn-primary text-white font-bold text-sm shadow-xl flex items-center justify-center gap-3 transition-all duration-250 cursor-pointer disabled:opacity-50">
              <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" /></svg>
              <span>Continue with Google Workspace</span>
            </button>
            <p className="text-[11px] text-center text-slate-400 font-medium">Only authorized institutional emails (<code className="text-[#007AFF] font-mono">@vvit.net</code>) are permitted.</p>
          </div>

          <div className="mt-8 pt-6 border-t border-white/20 dark:border-white/10">
            <button onClick={() => setShowAdminLogin(!showAdminLogin)} className="w-full flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
              <span className="flex items-center gap-2"><Lock className="w-3.5 h-3.5 text-slate-400" strokeWidth={2} /> IT Administrator Emergency Login</span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showAdminLogin ? 'rotate-180' : ''}`} strokeWidth={2} />
            </button>
            <AnimatePresence>
              {showAdminLogin && (
                <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} onSubmit={handleAdminSubmit} className="mt-4 space-y-3.5 pt-2">
                  <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Admin Username" className="w-full px-4 py-3 rounded-2xl bg-black/5 dark:bg-white/10 text-slate-900 dark:text-white text-xs border border-white/20 dark:border-white/10 focus:outline-none focus:border-[#007AFF] font-medium" required />
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Admin Password" className="w-full px-4 py-3 rounded-2xl bg-black/5 dark:bg-white/10 text-slate-900 dark:text-white text-xs border border-white/20 dark:border-white/10 focus:outline-none focus:border-[#007AFF] font-medium pr-10" required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-white">
                      {showPassword ? <EyeOff className="w-4 h-4" strokeWidth={2} /> : <Eye className="w-4 h-4" strokeWidth={2} />}
                    </button>
                  </div>
                  <button type="submit" disabled={isLoading} className="w-full py-3 rounded-2xl apple-btn-secondary text-xs font-bold transition-all flex items-center justify-center gap-2">Sign In as Local Admin</button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* SSO Account Selector Modal */}
      <AnimatePresence>
        {showDevSSOModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-md glass-panel rounded-[28px] p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><Shield className="w-5 h-5 text-[#007AFF]" strokeWidth={2} /><h3 className="text-sm font-bold text-slate-900 dark:text-white">Select Institutional Account</h3></div>
                <button onClick={() => setShowDevSSOModal(false)} className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-white">✕</button>
              </div>
              <p className="text-xs text-slate-400 font-medium">Select an account to test Google OAuth SSO login and RBAC permissions:</p>
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {devAccounts.map((acc) => (
                  <motion.div key={acc.email} whileHover={{ scale: 1.01 }} onClick={() => handleGoogleSSO(acc.email)} className="p-3.5 rounded-2xl bg-white/40 dark:bg-white/[0.04] hover:bg-[#007AFF]/15 border border-white/30 dark:border-white/10 hover:border-[#007AFF]/40 cursor-pointer transition-all flex items-center justify-between group">
                    <div>
                      <div className="flex items-center gap-2"><span className="font-bold text-xs text-slate-900 dark:text-white">{acc.name}</span><span className="text-[10px] px-2 py-0.5 rounded-full bg-[#007AFF]/15 text-[#007AFF] font-bold">{acc.role}</span></div>
                      <p className="text-[11px] font-mono text-slate-400 mt-0.5">{acc.email}</p>
                      <p className="text-[10px] text-slate-500">{acc.desc}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#007AFF] group-hover:translate-x-1 transition-all shrink-0" strokeWidth={2} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
