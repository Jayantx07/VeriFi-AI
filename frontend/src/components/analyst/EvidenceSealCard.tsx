'use client';

import React, { useState } from 'react';
import { ShieldCheck, Copy, Check, Cloud, FileCode, Lock } from 'lucide-react';
import { EvidenceSeal } from '@/types';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';

interface EvidenceSealCardProps {
  seal?: EvidenceSeal;
  transactionId: string;
}

export function EvidenceSealCard({ seal, transactionId }: EvidenceSealCardProps) {
  const [copied, setCopied] = useState(false);

  if (!seal) {
    return (
      <Card className="border-dashed border-slate-800 text-center py-8">
        <Lock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
        <h4 className="text-sm font-semibold text-slate-400">No Evidence Seal Generated</h4>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Cryptographic evidence seals are automatically minted upon High-Risk Holds or FIDO2 Passkey step-up authorizations.
        </p>
      </Card>
    );
  }

  const copyHash = () => {
    navigator.clipboard.writeText(seal.sha256_hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card glow className="border-cyan-500/30">
      <CardHeader>
        <CardTitle>
          <ShieldCheck className="w-5 h-5 text-cyan-400" />
          <span>Tamper-Evident Cryptographic Evidence Seal</span>
        </CardTitle>
        <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
          SHA-256 Verified
        </span>
      </CardHeader>

      <div className="space-y-4 text-xs">
        {/* SHA-256 Digest Box */}
        <div>
          <span className="text-slate-400 font-semibold block mb-1">
            Canonical SHA-256 Digest:
          </span>
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-cyan-300">
            <span className="truncate flex-1">{seal.sha256_hash}</span>
            <button
              onClick={copyHash}
              className="p-1 hover:text-white text-slate-400 rounded transition-colors"
              title="Copy Hash"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* AWS S3 & Sealed At grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 flex items-start gap-2.5">
            <Cloud className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <div className="truncate">
              <span className="text-slate-400 block font-semibold text-[10px] uppercase">AWS S3 Evidence Bucket</span>
              <span className="text-slate-200 font-mono text-[11px] truncate block">{seal.s3_uri}</span>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-slate-400 block font-semibold text-[10px] uppercase">Sealed At (UTC)</span>
              <span className="text-slate-200 font-mono text-[11px]">
                {new Date(seal.sealed_at).toUTCString()}
              </span>
            </div>
          </div>
        </div>

        {/* Canonical Digest Payload Accordion */}
        {seal.canonical_digest && (
          <div className="pt-2">
            <span className="text-slate-400 font-semibold block mb-1 flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5 text-slate-400" />
              Canonical Audit Manifest:
            </span>
            <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[10px] text-slate-300 max-h-36 overflow-auto font-mono">
              {JSON.stringify(seal.canonical_digest, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </Card>
  );
}
