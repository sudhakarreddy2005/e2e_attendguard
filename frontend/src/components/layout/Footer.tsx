import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  ShieldCheck,
  Github,
  Linkedin,
  Twitter,
  Mail,
  ChevronDown,
  ExternalLink,
} from 'lucide-react';
import { SMOOTH_SPRING, EXPO_OUT } from '../../utils/motion-variants';

export interface FooterProps {
  institutionName?: string;
  systemStatus?: string;
}

interface FooterColumn {
  title: string;
  links: { label: string; href: string; external?: boolean; badge?: string }[];
}

const STREAMLINED_COLUMNS: FooterColumn[] = [
  {
    title: 'Platform',
    links: [
      { label: 'Core Features', href: '#features' },
      { label: '512D Biometrics Engine', href: '#telemetry', badge: 'v3.0' },
      { label: 'LangGraph Copilot AI', href: '#copilot', badge: 'AI' },
      { label: 'Entra ID SSO & Security', href: '#security' },
      { label: 'FAQ', href: '#faq' },
    ],
  },
  {
    title: 'Institution',
    links: [
      { label: 'VVIT Autonomous University', href: 'https://vvitguntur.com', external: true },
      { label: 'Dept of AI & Data Science', href: '#features' },
      { label: 'Dept of Computer Science & ML', href: '#features' },
      { label: 'Campus Security Operations', href: '#telemetry' },
    ],
  },
  {
    title: 'Legal & Security',
    links: [
      { label: 'Privacy & Data Policy', href: '#security' },
      { label: 'Terms of Service', href: '#security' },
      { label: 'Entra ID Federation', href: '#security' },
      { label: 'Audit Logging Compliance', href: '#security' },
    ],
  },
];

export const Footer: React.FC<FooterProps> = ({
  institutionName = 'Vasireddy Venkatadri Institute of Technology',
  systemStatus = 'Operational (99.9% SLA)',
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [openMobileGroups, setOpenMobileGroups] = useState<Record<string, boolean>>({});

  const toggleMobileGroup = (title: string) => {
    setOpenMobileGroups((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  return (
    <footer
      className="relative mt-12 rounded-2xl bg-slate-950 border border-slate-800/80 text-white backdrop-blur-3xl shadow-xl overflow-hidden"
      aria-label="Site footer"
    >
      <div className="relative z-10 p-6 md:p-8 space-y-6">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 pb-6 border-b border-white/10">
          {/* Brand Column */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full overflow-hidden shadow-md shrink-0 border border-white/30 bg-slate-900">
                <img src="/attendGuardlogov3.jpeg" alt="AttendGuard Logo" className="w-full h-full object-cover" />
              </div>
              <div>
                <span className="font-extrabold text-sm text-white tracking-tight block">
                  AttendGuard
                </span>
                <span className="text-[10px] text-slate-400 font-medium block">
                  Campus Intelligence Platform
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              512D ArcFace facial recognition, real-time spatial incident telemetry, and Microsoft Entra ID governance for higher education.
            </p>

            {/* Social Icons Row */}
            <div className="flex items-center gap-2 pt-1">
              {[
                { label: 'GitHub', icon: Github, href: 'https://github.com' },
                { label: 'LinkedIn', icon: Linkedin, href: 'https://linkedin.com' },
                { label: 'Twitter', icon: Twitter, href: 'https://twitter.com' },
                { label: 'Mail Support', icon: Mail, href: 'mailto:support@vvit.net' },
              ].map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 hover:border-[#007AFF]/40 text-slate-400 hover:text-white flex items-center justify-center transition-colors shadow-xs"
                    aria-label={social.label}
                    title={social.label}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* 3 Streamlined Link Columns */}
          <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-5">
            {STREAMLINED_COLUMNS.map((column) => {
              const isOpenMobile = !!openMobileGroups[column.title];
              return (
                <div key={column.title} className="space-y-2">
                  <h4 className="hidden sm:block text-[10px] font-mono font-extrabold uppercase tracking-widest text-slate-400 mb-2">
                    {column.title}
                  </h4>

                  <button
                    onClick={() => toggleMobileGroup(column.title)}
                    className="sm:hidden w-full py-1.5 border-b border-white/10 flex items-center justify-between text-[10px] font-mono font-extrabold uppercase tracking-widest text-slate-400 cursor-pointer"
                  >
                    <span>{column.title}</span>
                    <motion.div animate={{ rotate: isOpenMobile ? 180 : 0 }} transition={SMOOTH_SPRING}>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    </motion.div>
                  </button>

                  <div className="hidden sm:block">
                    <ul className="space-y-2 text-xs">
                      {column.links.map((link) => (
                        <li key={link.label}>
                          <a
                            href={link.href}
                            target={link.external ? '_blank' : undefined}
                            rel={link.external ? 'noopener noreferrer' : undefined}
                            className="text-slate-400 hover:text-white transition-colors flex items-center justify-between group"
                          >
                            <span className="group-hover:text-[#007AFF] transition-colors flex items-center gap-1">
                              {link.label}
                              {link.external && <ExternalLink className="w-3 h-3 opacity-50" />}
                            </span>
                            {link.badge && (
                              <span className="text-[9px] font-bold font-mono px-1 py-0.2 rounded bg-[#007AFF]/15 text-[#007AFF]">
                                {link.badge}
                              </span>
                            )}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <AnimatePresence>
                    {isOpenMobile && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: EXPO_OUT }}
                        className="sm:hidden overflow-hidden"
                      >
                        <ul className="space-y-1.5 text-xs pt-1 pb-2">
                          {column.links.map((link) => (
                            <li key={link.label}>
                              <a
                                href={link.href}
                                target={link.external ? '_blank' : undefined}
                                rel={link.external ? 'noopener noreferrer' : undefined}
                                className="text-slate-400 hover:text-white transition-colors flex items-center justify-between"
                              >
                                <span>{link.label}</span>
                                {link.badge && (
                                  <span className="text-[9px] font-bold font-mono px-1 py-0.2 rounded bg-[#007AFF]/15 text-[#007AFF]">
                                    {link.badge}
                                  </span>
                                )}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Bar: Copyright & System SLA */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] font-mono text-slate-400 pt-1">
          <p className="flex items-center gap-1.5 font-medium">
            <span>© 2026 AttendGuard.</span>
            <img src="/vvitlogo.png" alt="VVIT Logo" className="w-4 h-4 object-contain inline-block rounded-full bg-white p-0.5" />
            <span>{institutionName}. All rights reserved.</span>
          </p>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-[#30D158] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#30D158] animate-pulse" />
              {systemStatus}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
