import React from 'react';
import { ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';

interface RiskScoreMeterProps {
  score: number;
  status: 'pass' | 'step-up' | 'hold' | string;
  factors?: string[];
}

export function RiskScoreMeter({ score, status, factors = [] }: RiskScoreMeterProps) {
  const getTheme = () => {
    if (score < 30) {
      return {
        color: 'text-emerald-400',
        stroke: '#10b981',
        bgGlow: 'shadow-[0_0_30px_rgba(16,185,129,0.2)]',
        border: 'border-emerald-500/30',
        label: 'LOW RISK — PASS',
        icon: ShieldCheck,
        badgeBg: 'bg-emerald-500/15 text-emerald-400'
      };
    }
    if (score <= 70) {
      return {
        color: 'text-amber-400',
        stroke: '#f59e0b',
        bgGlow: 'shadow-[0_0_30px_rgba(245,158,11,0.2)]',
        border: 'border-amber-500/30',
        label: 'MEDIUM RISK — STEP-UP CHALLENGE',
        icon: ShieldAlert,
        badgeBg: 'bg-amber-500/15 text-amber-400'
      };
    }
    return {
      color: 'text-rose-400',
      stroke: '#f43f5e',
      bgGlow: 'shadow-[0_0_35px_rgba(244,63,94,0.3)]',
      border: 'border-rose-500/40',
      label: 'CRITICAL RISK — TRANSACTION FROZEN',
      icon: ShieldX,
      badgeBg: 'bg-rose-500/15 text-rose-400'
    };
  };

  const theme = getTheme();
  const Icon = theme.icon;

  // SVG circular meter math
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className={`relative rounded-2xl border ${theme.border} bg-slate-900/80 backdrop-blur-md p-6 ${theme.bgGlow}`}>
      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Radial Gauge */}
        <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 128 128">
            <circle
              cx="64"
              cy="64"
              r={radius}
              className="text-slate-800"
              strokeWidth="10"
              stroke="currentColor"
              fill="transparent"
            />
            <circle
              cx="64"
              cy="64"
              r={radius}
              stroke={theme.stroke}
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className={`text-3xl font-extrabold tracking-tight font-mono ${theme.color}`}>
              {score}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">/ 100 Risk</span>
          </div>
        </div>

        {/* Evaluation Summary */}
        <div className="flex-1 text-center sm:text-left space-y-2">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${theme.badgeBg}`}>
              <Icon className="w-4 h-4" />
              {theme.label}
            </div>
            <span className="text-xs text-slate-400 font-mono">Status: <strong className="text-slate-200 uppercase">{status}</strong></span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            {score < 30
              ? 'Transaction characteristics conform to corporate financial baselines with zero anomalous sensor correlation in the 72h window.'
              : score <= 70
              ? 'Moderate behavioral anomaly or new offshore beneficiary detected. Hardware-bound biometric authentication mandated.'
              : 'Definitive Business Email Compromise or synthetic audio indicators detected. Settlement halted & evidence cryptographically sealed.'}
          </p>

          {/* Triggered Factors */}
          {factors.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-800 space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Correlated Risk Indicators ({factors.length}):
              </span>
              <ul className="space-y-1">
                {factors.map((f, i) => (
                  <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                    <span className="text-rose-400 font-bold">•</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
