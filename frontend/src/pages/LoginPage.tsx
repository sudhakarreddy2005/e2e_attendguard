import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, AlertCircle, Building2, Loader2, ArrowRight } from 'lucide-react';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../services/msalConfig';
import { authService } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';

export const LoginPage: React.FC = () => {
  const { instance } = useMsal();
  const { login } = useAuth();
  const navigate = useNavigate();

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

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
        await instance.initialize();
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

  const handleMicrosoftLogin = async (useRedirect = false) => {
    setError('');
    setIsLoading(true);
    setStatusMessage(useRedirect ? 'Redirecting to Microsoft sign in...' : 'Opening Microsoft sign in...');

    try {
      await instance.initialize();

      if (useRedirect) {
        await instance.loginRedirect(loginRequest);
        return;
      }

      let loginResponse;
      try {
        loginResponse = await instance.loginPopup(loginRequest);
      } catch (popupErr: any) {
        console.warn('Popup login failed, attempting redirect fallback:', popupErr);
        setStatusMessage('Popup closed. Redirecting to Microsoft login page...');
        await instance.loginRedirect(loginRequest);
        return;
      }

      if (!loginResponse || !loginResponse.idToken) {
        throw new Error('No ID token received from Microsoft Entra ID');
      }

      const accountEmail = loginResponse.account?.username?.toLowerCase() || '';
      if (!accountEmail.endsWith('@vvit.net')) {
        throw new Error(`Domain '${accountEmail.split('@')[1] || accountEmail}' is not authorized. Only official @vvit.net Microsoft accounts are permitted.`);
      }

      setStatusMessage('Authenticating with AttendGuard Backend...');
      const res = await authService.microsoftLogin(loginResponse.idToken);

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
      console.error('Microsoft login error:', err);
      let errMsg = err.response?.data?.detail || err.message || 'Microsoft sign-in failed. Please try again.';
      if (errMsg.includes('AADSTS9002326') || errMsg.includes('Single-Page Application')) {
        errMsg = "Azure AD Configuration Note: Change your App Registration platform type from 'Web' to 'Single-Page Application (SPA)' in Azure Entra Portal.";
      }
      setError(errMsg);
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
              <button
                type="button"
                onClick={() => handleMicrosoftLogin(true)}
                className="mt-1 text-[11px] font-bold underline text-[#0078D4] dark:text-[#2896F3] flex items-center gap-1 hover:opacity-80"
              >
                Try Full Page Redirect Login <ArrowRight className="w-3 h-3" />
              </button>
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
              onClick={() => handleMicrosoftLogin(false)}
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
          </div>

          {/* Institutional Security Footer */}
          <div className="mt-8 pt-4 border-t border-slate-100 dark:border-white/5 text-center">
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
              Only authorized institutional users (@vvit.net) may access AttendGuard.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
