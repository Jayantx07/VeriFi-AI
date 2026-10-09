'use client';

import React from 'react';
import { Fingerprint, ShieldCheck, AlertTriangle, KeyRound, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useWebAuthn } from '@/hooks/useWebAuthn';

interface PasskeyPromptProps {
  isOpen: boolean;
  onClose: () => void;
  transactionId: string;
  authSessionId: string;
  requesterEmail: string;
  amount: number;
  beneficiaryName: string;
  riskScore: number;
  onSuccess: (data: any) => void;
}

export function PasskeyPrompt({
  isOpen,
  onClose,
  transactionId,
  authSessionId,
  requesterEmail,
  amount,
  beneficiaryName,
  riskScore,
  onSuccess
}: PasskeyPromptProps) {
  const { triggerPasskeyAuth, isAuthenticating, authError } = useWebAuthn();

  if (!isOpen) return null;

  const handleAuthenticate = async () => {
    const res = await triggerPasskeyAuth(authSessionId, requesterEmail, transactionId);
    if (res.success) {
      onSuccess(res.data);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-amber-500/40 bg-slate-950 p-6 shadow-2xl shadow-amber-500/10">
        {/* Glow backdrop */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center">
          {/* Animated Biometric Radar Icon */}
          <div className="relative mb-5 flex items-center justify-center">
            <div className="absolute w-20 h-20 rounded-full bg-amber-500/20 animate-ping" />
            <div className="relative w-16 h-16 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/30 border border-amber-300/30">
              <Fingerprint className="w-9 h-9 text-slate-950 stroke-[2.2]" />
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold mb-2">
            <AlertTriangle className="w-3.5 h-3.5" />
            MEDIUM RISK STEP-UP REQUIRED
          </div>

          <h2 className="text-xl font-bold text-white tracking-tight">
            FIDO2 Hardware Passkey Challenge
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            VeriFi AI has intercepted transaction <span className="font-mono text-amber-300">#{transactionId}</span>. Biometric verification is mandated.
          </p>

          {/* Transaction Metadata Card */}
          <div className="w-full my-5 rounded-xl border border-slate-800 bg-slate-900/90 p-3.5 text-left text-xs space-y-2">
            <div className="flex justify-between items-center text-slate-400">
              <span>Amount:</span>
              <span className="font-bold text-white text-sm">${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Beneficiary:</span>
              <span className="font-semibold text-slate-200 truncate max-w-[180px]">{beneficiaryName}</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Risk Evaluation:</span>
              <span className="font-mono font-bold text-amber-400">{riskScore} / 100</span>
            </div>
            <div className="flex justify-between items-center text-slate-400 pt-1 border-t border-slate-800">
              <span>Approver:</span>
              <span className="font-mono text-slate-300 truncate max-w-[180px]">{requesterEmail}</span>
            </div>
          </div>

          {authError && (
            <div className="w-full mb-4 p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs text-left">
              {authError}
            </div>
          )}

          <div className="w-full flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={onClose}
              disabled={isAuthenticating}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              className="flex-1 !bg-gradient-to-r !from-amber-600 !to-yellow-500 hover:!from-amber-500 hover:!to-yellow-400 text-slate-950 font-bold"
              onClick={handleAuthenticate}
              isLoading={isAuthenticating}
            >
              <KeyRound className="w-4 h-4 mr-1 text-slate-950" />
              Verify Passkey
            </Button>
          </div>

          <div className="flex items-center gap-1.5 mt-4 text-[10px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>FIDO2 / WebAuthn Public-Key Cryptography — Phishing Immune</span>
          </div>
        </div>
      </div>
    </div>
  );
}
