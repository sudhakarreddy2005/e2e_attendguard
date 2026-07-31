import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Lock, ArrowRight, AlertCircle, ChevronDown, Building2, Shield, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../services/msalConfig';
import { authService } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';

export const LoginPage: React.FC = () => {
  const { instance } = useMsal();
  const { login } = useAuth();
  const navigate = useNavigate();

  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [showDevSSOModal, setShowDevSSOModal] = useState(false);

  const devAccounts = [
    { email: '23BQ1A05A9@vvit.net', role: 'SUPER_ADMIN', name: 'K.Sudhakar Reddy', desc: 'Full System Control & Institutional IAM Super Admin' },
    { email: 'principal@vvit.net', role: 'PRINCIPAL', name: 'Dr. Y. Mallikarjuna', desc: 'Campus Executive Dashboard & Audit Reports' },
    { email: 'hod.cse@vvit.net', role: 'HOD', name: 'Dr. A. Srinivas (HOD CSE)', desc: 'Department Analytics & Student Profiles' },
    { email: 'deo.admin@vvit.net', role: 'DEO', name: 'P. Latha', desc: 'Data Entry & Student Profile Management' },
    { email: 'security.gate1@vvit.net', role: 'SECURITY', name: 'S. Ramprakash', desc: 'Gate Recognition & Scanner' },
    { email: '23bq1a05b0@vvit.net', role: 'STUDENT', name: 'Student 23BQ1A05B0', desc: 'Student Self-Service Portal & Compliance History' },
    { email: '23bq1a0501@vvit.net', role: 'STUDENT', name: 'A. Vidhaya', desc: 'Student Self-Service Portal & Personal Logs' },
  ];

  const navigateByRole = (roleStr: string) => {
    const norm = (roleStr || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (norm === 'SECURITY') {
      navigate('/detect');
    } else if (norm === 'DEO') {
      navigate('/students');
    } else if (norm === 'STUDENT') {
      navigate('/student-portal');
    } else {
      navigate('/dashboard');
    }
  };

  // Handle redirect response coming back from Microsoft Entra ID
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const response = await instance.handleRedirectPromise();
        if (response && response.idToken) {
          setIsLoading(true);
          setStatusMessage('Authenticating with AttendGuard Backend...');

          const accountEmail = response.account?.username?.toLowerCase() || '';
          if (!accountEmail.endsWith('@vvit.net')) {
            throw new Error(`Domain '${accountEmail.split('@')[1] || accountEmail}' is not authorized. Only official @vvit.net Microsoft accounts are permitted.`);
          }

          const res = await authService.microsoftLogin(response.idToken);
          if (res.success && res.data?.access_token) {
            login(res.data.access_token, {
              username: res.data.email,
              role: res.data.role,
              display_name: res.data.display_name || res.data.name,
              email: res.data.email,
              permissions: res.data.permissions || [],
              profile_photo: res.data.profile_photo,
            });
            navigateByRole(res.data.role);
          } else {
            setError(res.message || 'Microsoft authentication failed on server');
          }
        }
      } catch (err: any) {
        console.error('Redirect auth handling error:', err);
        setError(err.response?.data?.detail || err.message || 'Failed to authenticate via Microsoft redirect');
      } finally {
        setIsLoading(false);
        setStatusMessage('');
      }
    };

    handleRedirectResult();
  }, [instance]);

  const handleMicrosoftLogin = async () => {
    setError('');
    setIsLoading(true);
    setStatusMessage('Opening Microsoft sign in...');

    try {
      // Try popup authentication first
      const loginResponse = await instance.loginPopup(loginRequest);
      setStatusMessage('Verifying identity with Microsoft Entra ID...');

      const idToken = loginResponse.idToken;
      if (!idToken) {
        throw new Error('No ID token received from Microsoft Entra ID');
      }

      const accountEmail = loginResponse.account?.username?.toLowerCase() || '';
      if (!accountEmail.endsWith('@vvit.net')) {
        throw new Error(`Domain '${accountEmail.split('@')[1] || accountEmail}' is not authorized. Only official @vvit.net Microsoft accounts are permitted.`);
      }

      setStatusMessage('Authenticating with AttendGuard Backend...');
      const res = await authService.microsoftLogin(idToken);

      if (res.success && res.data?.access_token) {
        login(res.data.access_token, {
          username: res.data.email,
          role: res.data.role,
          display_name: res.data.display_name || res.data.name,
          email: res.data.email,
          permissions: res.data.permissions || [],
          profile_photo: res.data.profile_photo,
        });
        navigateByRole(res.data.role);
      } else {
        setError(res.message || 'Microsoft authentication failed on server');
      }
    } catch (err: any) {
      console.warn('Popup login failed or closed, checking error:', err);

      const errString = String(err.message || err.errorCode || err);

      if (errString.includes('popup_window_error') || errString.includes('user_cancelled') || errString.includes('interaction_in_progress')) {
        // Fall back to full-page redirect flow if popup window is blocked or closed by user/browser
        try {
          setStatusMessage('Redirecting to Microsoft sign-in page...');
          await instance.loginRedirect(loginRequest);
          return;
        } catch (redirectErr: any) {
          console.error('Redirect fallback error:', redirectErr);
        }
      }

      let errMsg = err.response?.data?.detail || err.message || 'Microsoft sign-in failed. Please try again or use the test switcher.';
      if (errMsg.includes('AADSTS9002326') || errMsg.includes('Single-Page Application')) {
        errMsg = "Azure AD Portal Setup Required: Change your App Registration platform type from 'Web' to 'Single-Page Application (SPA)' in Azure Entra Portal (Redirect URI: http://localhost:5173).";
      }
      setError(errMsg);
      setIsLoading(false);
      setStatusMessage('');
    }
  };

  const handleDevEntraSSO = async (selectedEmail: string) => {
    setError('');
    setIsLoading(true);
    setStatusMessage('Simulating Microsoft Entra ID authentication...');

    try {
      const selectedAcc = devAccounts.find(a => a.email.toLowerCase() === selectedEmail.toLowerCase());
      const mockIdToken = btoa(
        JSON.stringify({
          sub: `entra_${selectedEmail}`,
          oid: `00000000-0000-0000-0000-000000000001`,
          tid: 'f6981b0a-3915-4628-be7e-368196415f8f',
          preferred_username: selectedEmail,
          email: selectedEmail,
          name: selectedAcc?.name || selectedEmail.split('@')[0],
          aud: '8b51b70f-d5de-4b5f-b347-a8b477ea361e',
          iss: 'https://login.microsoftonline.com/f6981b0a-3915-4628-be7e-368196415f8f/v2.0',
        })
      );

      const res = await authService.microsoftLogin(mockIdToken);
      if (res.success && res.data?.access_token) {
        login(res.data.access_token, {
          username: res.data.email,
          role: res.data.role,
          display_name: res.data.display_name || res.data.name,
          email: res.data.email,
          permissions: res.data.permissions || [],
          profile_photo: res.data.profile_photo,
        });
        navigateByRole(res.data.role);
      } else {
        setError(res.message || 'Microsoft SSO verification failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Institutional authentication failed');
    } finally {
      setIsLoading(false);
      setStatusMessage('');
      setShowDevSSOModal(false);
    }
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    setStatusMessage('Authenticating Administrator...');
    try {
      const res = await authService.login(username, password);
      if (res.success && res.data?.access_token) {
        login(res.data.access_token, {
          username: res.data.username,
          role: res.data.role,
          display_name: res.data.display_name,
          permissions: res.data.permissions || ['*'],
        });
        navigateByRole(res.data.role);
      } else {
        setError(res.message || 'Login failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid IT Administrator credentials');
    } finally {
      setIsLoading(false);
      setStatusMessage('');
    }
  };

  return (
    <div className="min-h-screen text-slate-900 dark:text-white flex items-center justify-center p-4 relative overflow-hidden select-none font-sans">
      {/* Dynamic Liquid Glass Background Orbs */}
      <div className="login-orb w-[520px] h-[520px] -top-40 -left-40 bg-[#0078D4]/25 blur-3xl animate-pulse" />
      <div className="login-orb w-[420px] h-[420px] -bottom-32 -right-32 bg-[#5C2D91]/20 blur-3xl" style={{ animationDelay: '-6s' }} />
      <div className="login-orb w-[340px] h-[340px] top-1/2 left-1/3 bg-[#00A4EF]/15 blur-2xl" style={{ animationDelay: '-12s' }} />

      <div className="w-full max-w-lg relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="glass-panel rounded-[36px] p-8 sm:p-11 shadow-2xl relative overflow-hidden border border-white/40 dark:border-white/10 backdrop-blur-2xl bg-white/70 dark:bg-slate-950/70"
        >
          {/* Top Apple Gradient Glow Line */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-1 bg-gradient-to-r from-transparent via-[#0078D4] to-transparent blur-xs" />

          {/* Header Section */}
          <div className="flex flex-col items-center text-center mb-8">
            <motion.div
              whileHover={{ scale: 1.06, rotate: 2 }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#0078D4] via-[#00A4EF] to-[#5C2D91] p-0.5 shadow-2xl mb-4 border border-white/40"
            >
              <div className="w-full h-full bg-slate-950/85 backdrop-blur-xl rounded-[14px] flex items-center justify-center text-white">
                <ShieldCheck className="w-9 h-9 text-[#0078D4] dark:text-[#2896F3]" strokeWidth={2} />
              </div>
            </motion.div>

            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] font-bold bg-[#0078D4]/15 text-[#0078D4] dark:text-[#2896F3] border border-[#0078D4]/30 mb-3 backdrop-blur-md">
              <Building2 className="w-3.5 h-3.5" strokeWidth={2} /> Institutional Access • @vvit.net
            </span>

            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              AttendGuard <span className="text-[#0078D4] dark:text-[#2896F3]">3.0</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs font-medium">
              Sign in using your official VVIT Microsoft account
            </p>
          </div>

          {/* Error & Loading Status Displays */}
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-6 p-4 rounded-2xl bg-[#FF453A]/15 border border-[#FF453A]/30 text-[#FF453A] text-xs font-semibold flex flex-col gap-2 shadow-sm"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={2} />
                <span>{error}</span>
              </div>
            </motion.div>
          )}

          {isLoading && statusMessage && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-3.5 rounded-2xl bg-[#0078D4]/10 border border-[#0078D4]/30 text-[#0078D4] dark:text-[#2896F3] text-xs font-semibold flex items-center justify-center gap-2.5"
            >
              <Loader2 className="w-4 h-4 animate-spin text-[#0078D4] dark:text-[#2896F3]" />
              <span>{statusMessage}</span>
            </motion.div>
          )}

          {/* Main Action: Sign in with Microsoft */}
          <div className="space-y-4">
            <button
              onClick={handleMicrosoftLogin}
              disabled={isLoading}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#0078D4] to-[#005A9E] hover:from-[#006CBE] hover:to-[#004E8C] active:scale-[0.99] text-white font-bold text-sm shadow-xl flex items-center justify-center gap-3 transition-all duration-200 cursor-pointer disabled:opacity-50 border border-white/20"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="1" y="1" width="10" height="10" fill="#F25022" />
                <rect x="12" y="1" width="10" height="10" fill="#7FBA00" />
                <rect x="1" y="12" width="10" height="10" fill="#00A4EF" />
                <rect x="12" y="12" width="10" height="10" fill="#FFB900" />
              </svg>
              <span>{isLoading ? 'Connecting to Microsoft...' : 'Sign in with Microsoft'}</span>
            </button>

            {/* Quick Test Accounts Switcher Button */}
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowDevSSOModal(true)}
                className="text-[11px] text-slate-500 hover:text-[#0078D4] dark:text-slate-400 dark:hover:text-[#2896F3] font-medium transition-colors cursor-pointer flex items-center gap-1 underline underline-offset-4"
              >
                <Shield className="w-3.5 h-3.5" /> Fast Test Account Switcher (@vvit.net)
              </button>
            </div>
          </div>

          {/* IT Administrator Emergency Login Accordion */}
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-white/10">
            <button
              onClick={() => setShowAdminLogin(!showAdminLogin)}
              className="w-full flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-slate-400" strokeWidth={2} /> IT Administrator Emergency Login
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showAdminLogin ? 'rotate-180' : ''}`} strokeWidth={2} />
            </button>

            <AnimatePresence>
              {showAdminLogin && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleAdminSubmit}
                  className="mt-4 space-y-3.5 pt-2"
                >
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Admin Username"
                    className="w-full px-4 py-3 rounded-2xl bg-black/5 dark:bg-white/10 text-slate-900 dark:text-white text-xs border border-slate-200 dark:border-white/10 focus:outline-none focus:border-[#0078D4] font-medium"
                    required
                  />
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Admin Password"
                      className="w-full px-4 py-3 rounded-2xl bg-black/5 dark:bg-white/10 text-slate-900 dark:text-white text-xs border border-slate-200 dark:border-white/10 focus:outline-none focus:border-[#0078D4] font-medium pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" strokeWidth={2} /> : <Eye className="w-4 h-4" strokeWidth={2} />}
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    Sign In as Local Admin
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          {/* Institutional Security Footer */}
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/5 text-center">
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
              Only authorized institutional users may access AttendGuard.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Developer Account Selector Modal */}
      <AnimatePresence>
        {showDevSSOModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md glass-panel rounded-[32px] p-6 shadow-2xl space-y-4 border border-white/20 bg-white/90 dark:bg-slate-950/90"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-[#0078D4]" strokeWidth={2} />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Select VVIT Microsoft Account</h3>
                </div>
                <button
                  onClick={() => setShowDevSSOModal(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer px-2 py-1"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Test Microsoft Entra ID SSO login & RBAC permissions for VVIT accounts:
              </p>
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {devAccounts.map((acc) => (
                  <motion.div
                    key={acc.email}
                    whileHover={{ scale: 1.01 }}
                    onClick={() => handleDevEntraSSO(acc.email)}
                    className="p-3.5 rounded-2xl bg-white/60 dark:bg-white/[0.04] hover:bg-[#0078D4]/15 border border-slate-200 dark:border-white/10 hover:border-[#0078D4]/40 cursor-pointer transition-all flex items-center justify-between group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">{acc.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#0078D4]/15 text-[#0078D4] dark:text-[#2896F3] font-bold">
                          {acc.role}
                        </span>
                      </div>
                      <p className="text-[11px] font-mono text-slate-400 mt-0.5">{acc.email}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">{acc.desc}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#0078D4] group-hover:translate-x-1 transition-all shrink-0" strokeWidth={2} />
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
