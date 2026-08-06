import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform, useReducedMotion, useInView } from 'framer-motion';
import {
  ShieldCheck,
  Scan,
  AlertTriangle,
  FileBarChart2,
  Sparkles,
  ArrowRight,
  Brain,
  ChevronDown,
  Globe,
  Radio,
  Compass,
  LayoutDashboard,
  Building2,
  Key,
  Terminal,
  LogOut,
  Loader2,
  AlertCircle,
  Sun,
  Moon,
  Shield,
  Layers,
  Lock,
  Mail,
  Send,
} from 'lucide-react';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../services/msalConfig';
import { authService } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { PageTransition } from '../components/ui/PageTransition';
import { Footer } from '../components/layout/Footer';
import {
  EXPO_OUT,
  SMOOTH_SPRING,
  staggerContainer,
  blurFadeInUp,
  scaleIn,
  clipPathReveal,
} from '../utils/motion-variants';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const { instance } = useMsal();
  const { user, isAuthenticated, login, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  // Login Loading / Error State
  const [authError, setAuthError] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authStatusMessage, setAuthStatusMessage] = useState('');

  // Scroll State for Floating Navbar
  const [isScrolled, setIsScrolled] = useState(false);
  const { scrollY } = useScroll();
  const heroParallaxY = useTransform(scrollY, [0, 400], [0, -12]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Telemetry Stream Tab & FAQ State
  const [activeTab, setActiveTab] = useState<'vision' | 'zones' | 'copilot' | 'analytics'>('vision');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [activeNavHover, setActiveNavHover] = useState<string | null>(null);

  // Simulated Typing Effect for AI Copilot Section
  const [typedText, setTypedText] = useState('');
  const fullPrompt = 'Filter late gate entry violations for AIDS department at Main Gate';
  const copilotRef = useRef<HTMLDivElement>(null);
  const isCopilotInView = useInView(copilotRef, { once: true, margin: '-10% 0px' });

  useEffect(() => {
    if (isCopilotInView) {
      let idx = 0;
      const interval = setInterval(() => {
        if (idx <= fullPrompt.length) {
          setTypedText(fullPrompt.slice(0, idx));
          idx++;
        } else {
          clearInterval(interval);
        }
      }, 25);
      return () => clearInterval(interval);
    }
  }, [isCopilotInView]);

  // Role Navigation Helper
  const navigateByRole = (roleStr?: string) => {
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

  // Direct Microsoft Entra Login Handler from Landing Page
  const handleMicrosoftLogin = async (useRedirect = false) => {
    setAuthError('');
    setIsAuthLoading(true);
    setAuthStatusMessage(useRedirect ? 'Redirecting to Microsoft sign in...' : 'Opening Microsoft sign in...');

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
        console.warn('Popup login failed, using redirect fallback:', popupErr);
        setAuthStatusMessage('Popup closed. Redirecting to Microsoft sign in...');
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

      setAuthStatusMessage('Authenticating with AttendGuard Backend...');
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
        setAuthError(res.message || 'Microsoft authentication failed on server');
      }
    } catch (err: any) {
      console.error('Microsoft login error:', err);
      setAuthError(err.response?.data?.detail || err.message || 'Microsoft sign-in failed. Please try again.');
    } finally {
      setIsAuthLoading(false);
      setAuthStatusMessage('');
    }
  };

  const handleActionClick = () => {
    if (isAuthenticated && user) {
      navigateByRole(user.role);
    } else {
      handleMicrosoftLogin(false);
    }
  };

  const formatRoleDisplay = (r?: string) => {
    if (!r) return 'User';
    const norm = r.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (norm === 'SUPERADMIN') return 'Super Admin';
    if (norm === 'PRINCIPAL') return 'Principal';
    if (norm === 'HOD') return 'HOD';
    if (norm === 'DEO') return 'DEO';
    if (norm === 'SECURITY') return 'Security';
    if (norm === 'STUDENT') return 'Student';
    return r;
  };

  return (
    <PageTransition className="space-y-12 sm:space-y-16 pb-12 select-none max-w-5xl mx-auto px-4 sm:px-6 font-sans">
      {/* ═══════════════════════════════════════════════════════
         SECTION 1: FLOATING GLASS NAVBAR (z-[100] & Backdrop Blur)
         ═══════════════════════════════════════════════════════ */}
      <motion.header
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: EXPO_OUT }}
        className={`sticky top-3 z-[100] transition-all duration-300 ${
          isScrolled
            ? 'glass-panel py-1.5 px-4 rounded-full border border-slate-200/80 dark:border-white/15 shadow-xl backdrop-blur-2xl bg-white/85 dark:bg-slate-950/85 max-w-3xl mx-auto'
            : 'bg-transparent py-2 px-1 max-w-5xl mx-auto'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/home')}>
            <motion.div
              whileHover={{ scale: 1.08, rotate: 4 }}
              whileTap={{ scale: 0.94 }}
              transition={SMOOTH_SPRING}
              className="w-7.5 h-7.5 rounded-xl bg-gradient-to-tr from-[#007AFF] via-[#00C6FF] to-[#30D158] flex items-center justify-center text-white shadow-md shrink-0"
            >
              <ShieldCheck className="w-4 h-4 text-white" />
            </motion.div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xs text-slate-900 dark:text-white tracking-tight">
                AttendGuard
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#007AFF]/10 text-[#007AFF] dark:text-[#0A84FF] font-bold border border-[#007AFF]/20">
                v3.0
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-5 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
            {[
              { label: 'Features', href: '#features' },
              { label: 'Telemetry', href: '#telemetry' },
              { label: 'Mail Workflows', href: '#workflow' },
              { label: 'Security', href: '#security' },
              { label: 'Copilot AI', href: '#copilot' },
              { label: 'FAQ', href: '#faq' },
            ].map((link) => (
              <a
                key={link.label}
                href={link.href}
                onMouseEnter={() => setActiveNavHover(link.label)}
                onMouseLeave={() => setActiveNavHover(null)}
                className="relative py-0.5 text-slate-600 dark:text-slate-300 hover:text-[#007AFF] dark:hover:text-white transition-colors"
              >
                {link.label}
                {activeNavHover === link.label && (
                  <motion.div
                    layoutId="nav-underline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#007AFF] rounded-full"
                    transition={SMOOTH_SPRING}
                  />
                )}
              </a>
            ))}
          </nav>

          {/* Single Sign-In Button + Theme Switcher */}
          <div className="flex items-center gap-1.5">
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              transition={SMOOTH_SPRING}
              onClick={toggleTheme}
              className="p-1.5 rounded-lg bg-slate-200/70 dark:bg-white/10 hover:bg-slate-300/80 dark:hover:bg-white/15 text-slate-800 dark:text-slate-200 transition-colors border border-slate-300/60 dark:border-white/10 cursor-pointer shadow-xs"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? (
                <Sun className="w-3.5 h-3.5 text-[#FF9F0A]" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-[#007AFF]" />
              )}
            </motion.button>

            {isAuthenticated && user ? (
              <div className="flex items-center gap-1.5">
                <motion.button
                  whileHover={{ scale: 1.03, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  transition={SMOOTH_SPRING}
                  onClick={() => navigateByRole(user.role)}
                  className="apple-btn-primary px-3 py-1.5 rounded-lg text-[11px] font-bold shadow-xs flex items-center gap-1 cursor-pointer text-white"
                >
                  <LayoutDashboard className="w-3 h-3" />
                  <span>Enter App</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  transition={SMOOTH_SPRING}
                  onClick={() => logout()}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-[#FF453A] hover:bg-[#FF453A]/10 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </motion.button>
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.97 }}
                transition={SMOOTH_SPRING}
                onClick={() => handleMicrosoftLogin(false)}
                disabled={isAuthLoading}
                className="apple-btn-primary px-3 py-1.5 rounded-lg text-[11px] font-bold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 text-white"
              >
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 23 23" fill="none">
                  <rect x="1" y="1" width="10" height="10" fill="#F25022" />
                  <rect x="12" y="1" width="10" height="10" fill="#7FBA00" />
                  <rect x="1" y="12" width="10" height="10" fill="#00A4EF" />
                  <rect x="12" y="12" width="10" height="10" fill="#FFB900" />
                </svg>
                <span>{isAuthLoading ? 'Connecting...' : 'Sign in (@vvit.net)'}</span>
              </motion.button>
            )}
          </div>
        </div>
      </motion.header>

      {/* Auth Toast Notification */}
      <AnimatePresence>
        {(authError || (isAuthLoading && authStatusMessage)) && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: EXPO_OUT }}
            className={`max-w-md mx-auto p-2.5 rounded-xl text-[11px] font-semibold flex items-center justify-between gap-2 shadow-xs ${
              authError
                ? 'bg-[#FF453A]/15 border border-[#FF453A]/30 text-[#FF453A]'
                : 'bg-[#0078D4]/15 border border-[#0078D4]/30 text-[#0078D4] dark:text-[#2896F3]'
            }`}
          >
            <div className="flex items-center gap-2">
              {isAuthLoading ? (
                <Loader2 className="w-3 h-3 animate-spin text-[#0078D4] dark:text-[#2896F3]" />
              ) : (
                <AlertCircle className="w-3 h-3 shrink-0" />
              )}
              <span>{authError || authStatusMessage}</span>
            </div>
            {authError && (
              <button onClick={() => setAuthError('')} className="text-[10px] font-bold underline cursor-pointer">
                Dismiss
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════
         SECTION 2: HERO SECTION (Balanced & Executive)
         ═══════════════════════════════════════════════════════ */}
      <motion.section
        variants={staggerContainer(0.05, 0.03)}
        initial="hidden"
        animate="visible"
        className="relative text-center space-y-4 max-w-2xl mx-auto pt-2"
      >
        <motion.div variants={scaleIn} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#007AFF]/10 dark:bg-white/10 border border-[#007AFF]/20 dark:border-white/15 backdrop-blur-xl text-[11px] font-bold text-[#007AFF] dark:text-white shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-[#30D158] animate-pulse" />
          <Sparkles className="w-3.5 h-3.5 text-[#007AFF]" />
          <span>Realtime Biometrics &amp; Zonal Telemetry Engine v3.0</span>
        </motion.div>

        <motion.h1 variants={blurFadeInUp} className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
          Automated Campus Security <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-[#007AFF] to-[#00C6FF] dark:from-white dark:via-[#007AFF] dark:to-[#00C6FF]">
            &amp; Biometric Intelligence
          </span>
        </motion.h1>

        <motion.p variants={blurFadeInUp} className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium max-w-lg mx-auto leading-relaxed">
          High-performance 512D ArcFace face recognition, gate incident logging, and automated Microsoft Graph email escalation for official @vvit.net accounts.
        </motion.p>

        {/* Hero CTA Buttons */}
        <motion.div variants={blurFadeInUp} className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
          {isAuthenticated && user ? (
            <motion.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              transition={SMOOTH_SPRING}
              onClick={() => navigateByRole(user.role)}
              className="apple-btn-primary px-5 py-2.5 text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer rounded-xl text-white"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Enter {formatRoleDisplay(user.role)} Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              transition={SMOOTH_SPRING}
              onClick={() => handleMicrosoftLogin(false)}
              disabled={isAuthLoading}
              className="apple-btn-primary px-5 py-2.5 text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer rounded-xl disabled:opacity-50 text-white"
            >
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 23 23" fill="none">
                <rect x="1" y="1" width="10" height="10" fill="#F25022" />
                <rect x="12" y="1" width="10" height="10" fill="#7FBA00" />
                <rect x="1" y="12" width="10" height="10" fill="#00A4EF" />
                <rect x="12" y="12" width="10" height="10" fill="#FFB900" />
              </svg>
              <span>{isAuthLoading ? 'Connecting...' : 'Sign in with Microsoft (@vvit.net)'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </motion.button>
          )}

          <motion.button
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            transition={SMOOTH_SPRING}
            onClick={handleActionClick}
            className="apple-btn-secondary px-4.5 py-2.5 text-xs font-bold flex items-center gap-1.5 cursor-pointer rounded-xl border border-slate-300 dark:border-white/10"
          >
            <Scan className="w-3.5 h-3.5 text-[#007AFF]" />
            <span>Explore Platform</span>
          </motion.button>
        </motion.div>
      </motion.section>

      {/* ═══════════════════════════════════════════════════════
         SECTION 3: GRAYSCALE INSTITUTIONAL TRUST BAR
         ═══════════════════════════════════════════════════════ */}
      <section className="space-y-2 border-y border-slate-200/80 dark:border-white/10 py-4 bg-slate-50/40 dark:bg-white/[0.01]">
        <p className="text-center text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          Trusted for Autonomous Campus Governance
        </p>
        <div className="relative overflow-hidden group">
          <motion.div
            animate={shouldReduceMotion ? {} : { x: ['0%', '-50%'] }}
            transition={{ repeat: Infinity, ease: 'linear', duration: 30 }}
            className="flex items-center gap-8 whitespace-nowrap w-max"
          >
            {[
              { name: 'VVIT Autonomous University', code: 'VVIT-AUTONOMOUS' },
              { name: 'JNTUK Academic Operations', code: 'JNTUK-AFFILIATED' },
              { name: 'Dept of AI & Data Science', code: 'DEPT-AIDS' },
              { name: 'Dept of Computer Science & ML', code: 'DEPT-CSM' },
              { name: 'Campus Security & Gate Post Ops', code: 'SEC-OPERATIONS' },
              { name: 'VVIT Autonomous University', code: 'VVIT-AUTONOMOUS' },
              { name: 'JNTUK Academic Operations', code: 'JNTUK-AFFILIATED' },
              { name: 'Dept of AI & Data Science', code: 'DEPT-AIDS' },
              { name: 'Dept of Computer Science & ML', code: 'DEPT-CSM' },
              { name: 'Campus Security & Gate Post Ops', code: 'SEC-OPERATIONS' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 opacity-60 hover:opacity-100 hover:text-[#007AFF] dark:hover:text-[#007AFF] transition-all duration-300 cursor-pointer">
                <Building2 className="w-3.5 h-3.5 opacity-80" />
                <span className="font-sans text-[11px] tracking-tight">{item.name}</span>
                <span className="text-[9px] font-mono opacity-50">[{item.code}]</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
         SECTION 4: LIVE TELEMETRY STREAM & BIOMETRICS ENGINE
         ═══════════════════════════════════════════════════════ */}
      <motion.section
        id="telemetry"
        style={{ y: heroParallaxY }}
        variants={clipPathReveal}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-8% 0px' }}
        className="rounded-xl glass-panel p-4 sm:p-5 border border-slate-200 dark:border-white/15 shadow-lg overflow-hidden relative bg-white/90 dark:bg-slate-900/50 scroll-mt-28 transition-all duration-300 hover:border-[#007AFF]/40"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-white/10 mb-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#30D158]/10 border border-[#30D158]/20 text-[#30D158] font-mono text-[10px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#30D158] animate-pulse" />
              <span>LIVE TELEMETRY STREAM</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 hidden sm:inline">attendguard.vvit.net/ops</span>
          </div>

          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 dark:bg-white/10 text-[10px] font-bold border border-slate-200 dark:border-transparent relative">
            {[
              { id: 'vision', label: 'Biometrics', icon: Scan },
              { id: 'zones', label: 'Zones', icon: Radio },
              { id: 'copilot', label: 'Copilot AI', icon: Brain },
              { id: 'analytics', label: 'Analytics', icon: FileBarChart2 },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`relative px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 cursor-pointer z-10 ${
                    isActive ? 'text-[#007AFF] dark:text-white font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-telemetry-pill"
                      className="absolute inset-0 bg-white dark:bg-slate-800 rounded-md shadow-xs border border-slate-200 dark:border-white/10 -z-10"
                      transition={SMOOTH_SPRING}
                    />
                  )}
                  <Icon className="w-3 h-3" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Telemetry Tab Content */}
        <div>
          <AnimatePresence mode="wait">
            {/* 1. ArcFace Biometric Vector Analysis */}
            {activeTab === 'vision' && (
              <motion.div key="vision" variants={blurFadeInUp} initial="hidden" animate="visible" exit="hidden" className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2 rounded-lg bg-slate-900 dark:bg-slate-950 text-white p-4 space-y-3 relative overflow-hidden flex flex-col justify-between border border-slate-800 dark:border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-[#30D158] flex items-center gap-1.5 font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#30D158] animate-ping" />
                      512D_ARCFACE_EMBEDDING_ENGINE
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 font-mono text-slate-300">Latency: 38ms</span>
                  </div>

                  <div className="py-4 flex flex-col items-center justify-center space-y-1.5 border border-dashed border-white/15 rounded bg-white/[0.02]">
                    <div className="relative">
                      <Scan className="w-8 h-8 text-[#007AFF] animate-pulse" />
                      <div className="absolute -inset-1 border border-[#30D158]/50 rounded-full animate-ping pointer-events-none" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-bold text-white">InsightFace Neural Feature Matching</p>
                      <p className="text-[10px] text-slate-400">AIDS • CSM • CIC • CSO • IT • CIVIL (Sections A–D)</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>Cosine Distance: 0.28</span>
                    <span className="text-[#30D158] font-bold">Matching Accuracy: 99.82%</span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <motion.div
                    whileHover={{ y: -2 }}
                    transition={SMOOTH_SPRING}
                    className="p-3 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-1 shadow-xs hover:border-[#007AFF]/40 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200">Biometric Verification</span>
                      <span className="text-[9px] text-[#30D158] font-bold px-1.5 py-0.2 rounded bg-[#30D158]/10">VERIFIED</span>
                    </div>
                    <p className="text-xs font-extrabold text-slate-900 dark:text-white">Institutional Token #849</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">AIDS • Section A</p>
                  </motion.div>

                  <motion.div
                    whileHover={{ y: -2 }}
                    transition={SMOOTH_SPRING}
                    className="p-3 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-1 shadow-xs hover:border-[#007AFF]/40 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200">RTSP Gateway</span>
                      <span className="text-[9px] text-[#007AFF] font-bold px-1.5 py-0.2 rounded bg-[#007AFF]/10">ONLINE</span>
                    </div>
                    <p className="text-xs font-extrabold text-slate-900 dark:text-white">Main Gate Gatekeeper Post</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Continuous Stream Scanner</p>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {/* 2. Realtime Spatial Zone Telemetry */}
            {activeTab === 'zones' && (
              <motion.div key="zones" variants={blurFadeInUp} initial="hidden" animate="visible" exit="hidden" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { title: 'Main Gate Post', sub: 'Primary Entry Telemetry', stat: '1,420 today', icon: Radio, color: 'text-[#007AFF]', bg: 'bg-[#007AFF]/15' },
                  { title: 'Playground Zone', sub: 'Sports Complex Monitoring', stat: '12 incidents', icon: Compass, color: 'text-[#FF9F0A]', bg: 'bg-[#FF9F0A]/15' },
                  { title: 'OAT Quadrangle', sub: 'Open Air Theatre Area', stat: 'Active Monitoring', icon: Layers, color: 'text-[#BF5AF2]', bg: 'bg-[#BF5AF2]/15' },
                ].map((zone) => {
                  const Icon = zone.icon;
                  return (
                    <motion.div
                      key={zone.title}
                      whileHover={{ y: -3, scale: 1.01 }}
                      transition={SMOOTH_SPRING}
                      className="p-3.5 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-1.5 shadow-xs hover:border-[#007AFF]/40 cursor-pointer"
                    >
                      <div className={`p-1.5 w-7 h-7 rounded ${zone.bg} ${zone.color} flex items-center justify-center font-bold`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">{zone.title}</h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">{zone.sub}</p>
                      </div>
                      <div className="pt-1 border-t border-slate-200 dark:border-white/10 flex justify-between text-[10px] font-bold">
                        <span className="text-slate-500 dark:text-slate-400">Status:</span>
                        <span className={zone.color}>{zone.stat}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}

            {/* 3. LangGraph NLP Copilot Pipeline */}
            {activeTab === 'copilot' && (
              <motion.div key="copilot" variants={blurFadeInUp} initial="hidden" animate="visible" exit="hidden" className="rounded-lg bg-slate-900 dark:bg-slate-950 text-white p-3.5 space-y-2.5 border border-slate-800 dark:border-white/10">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#BF5AF2]">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>COPILOT_LANGGRAPH_PIPELINE</span>
                </div>
                <div className="p-2.5 rounded bg-white/5 border border-white/10 text-[11px] space-y-1 text-slate-200 font-mono">
                  <p className="text-[#007AFF] font-bold">&gt; "Filter late gate entry violations for AIDS department"</p>
                  <p className="text-slate-400">Extracted Entities: Dept=[AIDS], Zone=[Main Gate], Violation=[Late Arrival]</p>
                  <p className="text-[#30D158] font-bold">Found 8 matched student records with 100% confidence.</p>
                </div>
              </motion.div>
            )}

            {/* 4. Institutional Cohort Analytics */}
            {activeTab === 'analytics' && (
              <motion.div key="analytics" variants={blurFadeInUp} initial="hidden" animate="visible" exit="hidden" className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                {[
                  { label: 'Total Enrolled', val: '2,840', color: 'text-slate-900 dark:text-white' },
                  { label: 'AIDS Cohort', val: '480', color: 'text-slate-900 dark:text-white' },
                  { label: 'CSM Cohort', val: '520', color: 'text-slate-900 dark:text-white' },
                  { label: 'Active Flags', val: '34', color: 'text-[#FF453A]' },
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ y: -2 }}
                    transition={SMOOTH_SPRING}
                    className="p-3 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-0.5 shadow-xs hover:border-[#007AFF]/40 cursor-pointer"
                  >
                    <p className="text-slate-500 dark:text-slate-400 font-bold text-[10px]">{stat.label}</p>
                    <p className={`text-xl font-black ${stat.color}`}>{stat.val}</p>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.section>

      {/* ═══════════════════════════════════════════════════════
         SECTION 5: CORE FEATURES BENTO GRID
         ═══════════════════════════════════════════════════════ */}
      <section id="features" className="space-y-4 scroll-mt-28">
        <div className="text-center max-w-lg mx-auto space-y-0.5">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Core Intelligence Modules</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Modular bento architecture for campus security management.</p>
        </div>

        <motion.div variants={staggerContainer(0.05)} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-8% 0px' }} className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <motion.div
            variants={blurFadeInUp}
            whileHover={{ y: -4, scale: 1.005 }}
            transition={SMOOTH_SPRING}
            onClick={handleActionClick}
            className="glass-card p-5 sm:p-6 rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-900/40 cursor-pointer space-y-3 group relative overflow-hidden md:col-span-2 shadow-xs hover:border-[#007AFF]/40 hover:shadow-md dark:hover:border-[#007AFF]/40"
          >
            <div className="flex items-center justify-between">
              <div className="w-8.5 h-8.5 rounded-lg bg-[#007AFF]/15 text-[#007AFF] flex items-center justify-center font-bold">
                <Scan className="w-4.5 h-4.5" />
              </div>
              <span className="text-[10px] font-bold text-[#007AFF] px-2 py-0.5 rounded-full bg-[#007AFF]/10">ArcFace 512D</span>
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-[#007AFF] transition-colors flex items-center justify-between">
                <span>Neural Face Biometrics &amp; Live Registration</span>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                Direct browser webcam capture with instant student verification across AIDS, CSM, CIC, CSO, IT, and CIVIL departments (Sections A–D).
              </p>
            </div>
            <div className="pt-1 flex flex-wrap gap-1.5 text-[10px] font-bold">
              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200">512D Embeddings</span>
              <span className="px-2 py-0.5 rounded bg-[#30D158]/10 text-[#30D158]">&lt; 38ms Latency</span>
            </div>
          </motion.div>

          <motion.div
            variants={blurFadeInUp}
            whileHover={{ y: -4, scale: 1.005 }}
            transition={SMOOTH_SPRING}
            onClick={handleActionClick}
            className="glass-card p-5 sm:p-6 rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-900/40 cursor-pointer space-y-3 group relative overflow-hidden shadow-xs hover:border-[#FF453A]/40 hover:shadow-md dark:hover:border-[#FF453A]/40"
          >
            <div className="w-8.5 h-8.5 rounded-lg bg-[#FF453A]/15 text-[#FF453A] flex items-center justify-center font-bold">
              <AlertTriangle className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#FF453A] transition-colors flex items-center justify-between">
                <span>Location Disciplinary Logging</span>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                Auto-generate preset violation remarks for Main Gate, OAT, and Playground.
              </p>
            </div>
            <div className="pt-1 flex flex-wrap gap-1.5 text-[10px] font-bold">
              <span className="px-2 py-0.5 rounded bg-[#FF453A]/10 text-[#FF453A]">Zone Logging</span>
              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200">Preset Notes</span>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════
         SECTION 6: LEVEL-WISE EMAIL ESCALATION WORKFLOW
         ═══════════════════════════════════════════════════════ */}
      <section id="workflow" className="space-y-4 scroll-mt-28">
        <div className="text-center max-w-lg mx-auto space-y-0.5">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#FF9F0A]">Automated Disciplinary Workflow</span>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-1.5">
            <Mail className="w-4 h-4 text-[#FF9F0A]" /> Multi-Tier Level Email Escalation
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Automated Microsoft Graph email dispatch based on cumulative student violation thresholds.</p>
        </div>

        <motion.div variants={staggerContainer(0.05)} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-8% 0px' }} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {[
            { level: 'Level 1', threshold: '5 Violations', title: 'Student Warning', desc: 'Direct advisory warning email dispatched to official student @vvit.net address.', target: 'Student', color: 'text-[#007AFF]', bg: 'bg-[#007AFF]/10 border-[#007AFF]/25' },
            { level: 'Level 2', threshold: '10 Violations', title: 'Faculty & HOD Escalation', desc: 'Formal escalation notice sent to Class Counsellor and Department HOD.', target: 'HOD + Counsellor', color: 'text-[#FF9F0A]', bg: 'bg-[#FF9F0A]/10 border-[#FF9F0A]/25' },
            { level: 'Level 3', threshold: '15 Violations', title: 'Disciplinary Summons', desc: 'Hearing summons issued to Disciplinary Committee and Student Welfare Cell.', target: 'Discipline Cell', color: 'text-[#FF453A]', bg: 'bg-[#FF453A]/10 border-[#FF453A]/25' },
            { level: 'Audit SLA', threshold: '100% Graph SLA', title: 'Microsoft Graph Dispatch', desc: 'Idempotency tracking with retry queues to prevent duplicate email alerts.', target: 'Graph API', color: 'text-[#30D158]', bg: 'bg-[#30D158]/10 border-[#30D158]/25' },
          ].map((item, idx) => (
            <motion.div
              key={idx}
              variants={blurFadeInUp}
              whileHover={{ y: -4, scale: 1.01 }}
              transition={SMOOTH_SPRING}
              className="p-4 rounded-xl glass-card border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-900/40 space-y-2.5 hover:border-[#007AFF]/40 shadow-xs cursor-pointer"
            >
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className={`font-extrabold ${item.color}`}>{item.level}</span>
                <span className={`px-1.5 py-0.2 rounded font-bold border ${item.bg} ${item.color}`}>{item.threshold}</span>
              </div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                <Send className="w-3.5 h-3.5 text-slate-400" />
                <span>{item.title}</span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
              <span className="inline-block text-[9px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 font-bold">
                Target: {item.target}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════
         SECTION 7: SECURITY & PRIVACY
         ═══════════════════════════════════════════════════════ */}
      <section id="security" className="space-y-4 scroll-mt-28">
        <div className="text-center max-w-lg mx-auto space-y-0.5">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-1.5">
            <Shield className="w-4 h-4 text-[#007AFF]" /> Institutional Security &amp; Access Control
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Role authorization, session encryption, and Entra ID identity protection.</p>
        </div>

        <motion.div variants={staggerContainer(0.05)} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-8% 0px' }} className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <motion.div
            variants={blurFadeInUp}
            whileHover={{ y: -4, scale: 1.01 }}
            transition={SMOOTH_SPRING}
            className="p-5 rounded-xl glass-card border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-900/40 space-y-2 shadow-xs hover:border-[#007AFF]/40 hover:shadow-md cursor-pointer"
          >
            <Key className="w-4.5 h-4.5 text-[#007AFF]" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">Role Authorization</h3>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">Privileged access matrix for SuperAdmin, Principal, HOD, DEO, Security, and Students.</p>
          </motion.div>

          <motion.div
            variants={blurFadeInUp}
            whileHover={{ y: -4, scale: 1.01 }}
            transition={SMOOTH_SPRING}
            className="p-5 rounded-xl glass-card border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-900/40 space-y-2 shadow-xs hover:border-[#30D158]/40 hover:shadow-md cursor-pointer"
          >
            <Lock className="w-4.5 h-4.5 text-[#30D158]" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">JWT Session Encryption</h3>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">Domain-bound bearer tokens signed with ECDSA for high-security campus API requests.</p>
          </motion.div>

          <motion.div
            variants={blurFadeInUp}
            whileHover={{ y: -4, scale: 1.01 }}
            transition={SMOOTH_SPRING}
            className="p-5 rounded-xl glass-card border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-900/40 space-y-2 shadow-xs hover:border-[#BF5AF2]/40 hover:shadow-md cursor-pointer"
          >
            <Globe className="w-4.5 h-4.5 text-[#BF5AF2]" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">Entra ID SSO</h3>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">Verified institutional login enforcing @vvit.net domain identity verification.</p>
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════
         SECTION 8: AI COPILOT QUERY AGENT
         ═══════════════════════════════════════════════════════ */}
      <section id="copilot" ref={copilotRef} className="space-y-4 scroll-mt-28">
        <div className="text-center max-w-lg mx-auto space-y-0.5">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#BF5AF2]" /> AI Campus Copilot
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Natural language query agent for institutional intelligence.</p>
        </div>

        <motion.div
          variants={blurFadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-8% 0px' }}
          whileHover={{ border-[#BF5AF2]/50, y: -2 }}
          transition={SMOOTH_SPRING}
          className="rounded-xl bg-slate-900 dark:bg-slate-950 text-white p-5 space-y-3 border border-slate-800 dark:border-white/15 shadow-xl"
        >
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#BF5AF2]">
            <Terminal className="w-3.5 h-3.5" />
            <span>COPILOT_LANGGRAPH_AGENT</span>
          </div>

          <div className="p-3 rounded-lg bg-white/5 border border-white/10 font-mono text-xs text-slate-200 min-h-[48px] flex items-center">
            <span>&gt; {typedText}</span>
            <span className="w-1.5 h-3.5 bg-[#007AFF] ml-1 animate-pulse" />
          </div>

          <AnimatePresence>
            {typedText.length >= fullPrompt.length && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: EXPO_OUT }}
                className="p-3 rounded-lg bg-[#30D158]/10 border border-[#30D158]/30 space-y-1.5 text-xs"
              >
                <p className="text-[#30D158] font-bold flex items-center gap-1.5 text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5" /> Intent Extracted: DISCIPLINARY_INCIDENT_QUERY
                </p>
                <div className="text-slate-300 font-mono text-[10px] grid grid-cols-2 sm:grid-cols-4 gap-2 pt-0.5">
                  <div>Department: <span className="text-white font-bold">AIDS</span></div>
                  <div>Zone: <span className="text-white font-bold">Main Gate</span></div>
                  <div>Violation: <span className="text-white font-bold">Late Arrival</span></div>
                  <div>Results: <span className="text-[#30D158] font-bold">8 matched</span></div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════
     SECTION 9: COMPACT FAQ ACCORDION
         ═══════════════════════════════════════════════════════ */}
      <section id="faq" className="glass-panel p-5 sm:p-6 rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-900/40 space-y-4 scroll-mt-28 shadow-xs max-w-3xl mx-auto">
        <div className="text-center max-w-md mx-auto space-y-0.5">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Frequently Asked Questions</h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Answers regarding biometrics and Entra ID authentication.</p>
        </div>

        <div className="space-y-2">
          {[
            { q: 'How does the ArcFace 512D Neural Biometrics engine operate?', a: 'AttendGuard extracts a 512-dimensional vector per student face using InsightFace ArcFace models. Recognition operates in < 38ms with adaptive cosine distance thresholds.' },
            { q: 'Which campus locations & departments are supported in version 3.0?', a: 'Version 3.0 supports 6 major departments (AIDS, CSM, CIC, CSO, IT, CIVIL) across Sections A–D, and tracks physical campus zones including Main Gate, Playground, and OAT.' },
            { q: 'How are disciplinary violation alerts dispatched to institutional emails?', a: 'When an incident is logged, AttendGuard triggers an automated Microsoft Graph API email workflow with idempotency history tracking to prevent duplicate alerts.' },
            { q: 'How does Entra ID Authentication & auto-provisioning work?', a: 'Users sign in using Microsoft Entra ID SSO (@vvit.net). Authenticated student profiles are automatically matched against the MongoDB institutional registry.' },
          ].map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className={`rounded-lg border bg-white dark:bg-white/5 overflow-hidden transition-all duration-200 shadow-xs ${
                  isOpen
                    ? 'border-slate-300 dark:border-white/20 border-l-2 border-l-[#007AFF] dark:border-l-[#007AFF]'
                    : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
                }`}
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full px-4 py-3 text-left text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between gap-2 cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={SMOOTH_SPRING}>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: EXPO_OUT }}
                      className="px-4 pb-3 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-white/5 pt-2"
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
         SECTION 10: PRODUCTION FOOTER COMPONENT
         ═══════════════════════════════════════════════════════ */}
      <Footer institutionName="Vasireddy Venkatadri Institute of Technology" systemStatus="Operational (99.9% SLA)" />
    </PageTransition>
  );
};

export default LandingPage;
