'use client';

import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { TransactionVerifyResponse } from '@/types';
import { ExternalLink, KeyRound, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface TransactionTableProps {
  transactions: TransactionVerifyResponse[];
  onSelectTransaction: (tx: TransactionVerifyResponse) => void;
  onTriggerPasskey: (tx: TransactionVerifyResponse) => void;
  selectedId?: string;
}

export function TransactionTable({
  transactions,
  onSelectTransaction,
  onTriggerPasskey,
  selectedId
}: TransactionTableProps) {
  if (transactions.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-8 text-center text-xs text-slate-500">
        No payment requests evaluated in this session yet. Submit a payment above to begin.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800 text-[10px]">
            <tr>
              <th className="py-3 px-4">Transaction ID</th>
              <th className="py-3 px-4">Gate Status</th>
              <th className="py-3 px-4">Risk Index</th>
              <th className="py-3 px-4">Evidence Seal</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-medium">
            {transactions.map((tx) => {
              const isSelected = selectedId === tx.transaction_id;
              return (
                <tr
                  key={tx.transaction_id}
                  className={`transition-colors hover:bg-slate-800/40 ${isSelected ? 'bg-cyan-950/20' : ''}`}
                >
                  <td className="py-3.5 px-4 font-mono text-cyan-300 font-bold">
                    #{tx.transaction_id}
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge variant={tx.status as any}>{tx.status}</Badge>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold">
                    <span
                      className={
                        tx.risk_score < 30
                          ? 'text-emerald-400'
                          : tx.risk_score <= 70
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }
                    >
                      {tx.risk_score}%
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                    {tx.evidence_seal ? (
                      <span className="text-cyan-400 truncate max-w-[140px] block" title={tx.evidence_seal.sha256_hash}>
                        {tx.evidence_seal.sha256_hash.slice(0, 14)}...
                      </span>
                    ) : (
                      <span className="text-slate-600">Pending</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-2">
                    {tx.status === 'step-up' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => onTriggerPasskey(tx)}
                        className="!bg-amber-500/20 !border-amber-500/40 !text-amber-300 hover:!bg-amber-500/30 text-xs py-1"
                      >
                        <KeyRound className="w-3 h-3 mr-1" />
                        Passkey Step-Up
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onSelectTransaction(tx)}
                      className="text-xs py-1 hover:text-cyan-300"
                    >
                      <ShieldAlert className="w-3 h-3 mr-1 text-cyan-400" />
                      Inspect Lineage
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
