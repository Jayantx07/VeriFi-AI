'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Building2,
  Cpu,
  Sparkles,
  Database,
  Fingerprint,
  RefreshCw,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { PaymentForm } from '@/components/erp/PaymentForm';
import { TransactionTable } from '@/components/erp/TransactionTable';
import { RiskScoreMeter } from '@/components/analyst/RiskScoreMeter';
import { LineageGraphView } from '@/components/analyst/LineageGraphView';
import { EvidenceSealCard } from '@/components/analyst/EvidenceSealCard';
import { SensorSimulator } from '@/components/sensors/SensorSimulator';
import { PasskeyPrompt } from '@/components/auth/PasskeyPrompt';
import { Card } from '@/components/ui/Card';
import {
  verifyTransaction,
  fetchTransactions,
  fetchLineageGraph,
  checkBackendHealth
} from '@/lib/api';
import {
  TransactionVerifyRequest,
  TransactionVerifyResponse,
  LineageGraphResponse
} from '@/types';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'erp' | 'analyst' | 'sensors'>('erp');
  const [transactions, setTransactions] = useState<TransactionVerifyResponse[]>([]);
  const [selectedTx, setSelectedTx] = useState<TransactionVerifyResponse | null>(null);
  const [lineageData, setLineageData] = useState<LineageGraphResponse | null>(null);
  const [isLoadingTx, setIsLoadingTx] = useState(false);
  const [health, setHealth] = useState<{ healthy: boolean; neo4j: boolean }>({
    healthy: false,
    neo4j: false
  });

  // Passkey Modal State
  const [passkeyModalOpen, setPasskeyModalOpen] = useState(false);
  const [pendingPasskeyTx, setPendingPasskeyTx] = useState<TransactionVerifyResponse | null>(null);

  // Poll health & fetch initial transactions
  const loadData = async () => {
    const h = await checkBackendHealth();
    setHealth(h);
    const txs = await fetchTransactions();
    setTransactions(txs);
    if (txs.length > 0 && !selectedTx) {
      setSelectedTx(txs[0]);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Whenever selectedTx changes, fetch graph lineage
  useEffect(() => {
    if (selectedTx) {
      fetchLineageGraph(selectedTx.transaction_id)
        .then((data) => setLineageData(data))
        .catch(() => {
          // Fallback view if not yet in graph
          setLineageData({
            transaction_id: selectedTx.transaction_id,
            risk_score: selectedTx.risk_score,
            status: selectedTx.status,
            nodes: [
              {
                id: `Payment_${selectedTx.transaction_id}`,
                type: 'Payment',
                label: `Payment #${selectedTx.transaction_id}`,
                risk: selectedTx.risk_score
              }
            ],
            edges: [],
            evidence_seal: selectedTx.evidence_seal
          });
        });
    }
  }, [selectedTx]);

  const handleExecutePayment = async (txRequest: TransactionVerifyRequest) => {
    setIsLoadingTx(true);
    try {
      const result = await verifyTransaction(txRequest);
      setTransactions((prev) => [result, ...prev.filter((t) => t.transaction_id !== result.transaction_id)]);
      setSelectedTx(result);

      if (result.status === 'step-up') {
        setPendingPasskeyTx(result);
        setPasskeyModalOpen(true);
      } else if (result.status === 'hold') {
        setActiveTab('analyst');
      }
    } catch (err: any) {
      alert(err.message || 'Payment execution failed');
    } finally {
      setIsLoadingTx(false);
    }
  };

  const handlePasskeySuccess = (verifyResult: any) => {
    // Update transaction to authorized
    setTransactions((prev) =>
      prev.map((t) =>
        t.transaction_id === verifyResult.transaction_id
          ? {
              ...t,
              status: 'pass',
              message: verifyResult.message,
              evidence_seal: verifyResult.evidence_seal
            }
          : t
      )
    );
    if (selectedTx?.transaction_id === verifyResult.transaction_id) {
      setSelectedTx((prev) =>
        prev
          ? {
              ...prev,
              status: 'pass',
              evidence_seal: verifyResult.evidence_seal
            }
          : null
      );
    }
    setPendingPasskeyTx(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Enterprise Navigation */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-lg px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-cyan-400/30">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-white">
                  VeriFi <span className="text-cyan-400">AI</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
                  v1.0 MVP
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Transaction-Authorization Layer · FIDO2 Passkey Gate · Neo4j Temporal Lineage
              </p>
            </div>
          </div>

          {/* Engine Status Indicators */}
          <div className="hidden md:flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>FastAPI Gateway:</span>
              <span className={`font-mono font-bold ${health.healthy ? 'text-emerald-400' : 'text-amber-400'}`}>
                {health.healthy ? 'ONLINE' : 'CONNECTING'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              <span>Neo4j Graph:</span>
              <span className="font-mono font-bold text-emerald-400">ARMED (72h)</span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
              <Fingerprint className="w-3.5 h-3.5 text-amber-400" />
              <span>FIDO2 WebAuthn:</span>
              <span className="font-mono font-bold text-cyan-400">READY</span>
            </div>

            <button
              onClick={loadData}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition-colors"
              title="Refresh State"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex-1 space-y-6">
        {/* Navigation Tabs Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('erp')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'erp'
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Building2 className="w-4 h-4" />
              ERP Payment Gateway
            </button>

            <button
              onClick={() => setActiveTab('analyst')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'analyst'
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              Fraud Analyst & Graph Lineage
              {selectedTx?.status === 'hold' && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('sensors')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'sensors'
                  ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.15)]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Multimodal Sensor Lab
            </button>
          </div>

          {selectedTx && (
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 font-mono">
              <span>Active Target:</span>
              <span className="text-cyan-300 font-bold">#{selectedTx.transaction_id}</span>
              <span className="uppercase text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-200">
                {selectedTx.status}
              </span>
            </div>
          )}
        </div>

        {/* Tab 1: ERP Gateway */}
        {activeTab === 'erp' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Payment Execution Form */}
              <div className="lg:col-span-7">
                <PaymentForm onSubmit={handleExecutePayment} isLoading={isLoadingTx} />
              </div>

              {/* Real-time Authorization Status summary card */}
              <div className="lg:col-span-5 space-y-4">
                {selectedTx ? (
                  <div className="space-y-4">
                    <RiskScoreMeter
                      score={selectedTx.risk_score}
                      status={selectedTx.status}
                      factors={selectedTx.risk_factors}
                    />

                    {selectedTx.status === 'step-up' && (
                      <Card glow className="border-amber-500/40 bg-amber-950/20 text-center p-5">
                        <Fingerprint className="w-8 h-8 text-amber-400 mx-auto mb-2 animate-bounce" />
                        <h4 className="text-sm font-bold text-amber-300">Biometric Verification Mandated</h4>
                        <p className="text-xs text-slate-400 mt-1 mb-3">
                          VeriFi AI has quarantined this transaction pending hardware FIDO2 Passkey approval.
                        </p>
                        <button
                          onClick={() => {
                            setPendingPasskeyTx(selectedTx);
                            setPasskeyModalOpen(true);
                          }}
                          className="w-full py-2.5 rounded-lg bg-gradient-to-r from-amber-600 to-yellow-500 text-slate-950 font-bold text-xs hover:from-amber-500 hover:to-yellow-400 transition-all cursor-pointer"
                        >
                          Authenticate with Passkey
                        </button>
                      </Card>
                    )}

                    {selectedTx.status === 'hold' && (
                      <Card glow className="border-rose-500/40 bg-rose-950/20 text-center p-5">
                        <ShieldAlert className="w-8 h-8 text-rose-400 mx-auto mb-2 animate-pulse" />
                        <h4 className="text-sm font-bold text-rose-300">Fraud Intercepted & Frozen</h4>
                        <p className="text-xs text-slate-400 mt-1 mb-3">
                          Correlated multi-vector spoofing discovered in Neo4j Lineage Graph. Settlement halted.
                        </p>
                        <button
                          onClick={() => setActiveTab('analyst')}
                          className="w-full py-2 rounded-lg bg-rose-600/30 border border-rose-500/40 text-rose-200 text-xs font-semibold hover:bg-rose-600/50 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          View Fraud Lineage Graph
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </Card>
                    )}
                  </div>
                ) : (
                  <Card className="border-dashed border-slate-800 text-center py-12 text-slate-500 text-xs">
                    Initiate a transaction to observe real-time risk fusion and authorization gating.
                  </Card>
                )}
              </div>
            </div>

            {/* Transaction Ledger Table */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-slate-300 tracking-wide uppercase">
                  Evaluated Transactions Ledger
                </h4>
                <span className="text-xs text-slate-500">
                  {transactions.length} Total Records
                </span>
              </div>
              <TransactionTable
                transactions={transactions}
                onSelectTransaction={(tx) => {
                  setSelectedTx(tx);
                  setActiveTab('analyst');
                }}
                onTriggerPasskey={(tx) => {
                  setPendingPasskeyTx(tx);
                  setPasskeyModalOpen(true);
                }}
                selectedId={selectedTx?.transaction_id}
              />
            </div>
          </div>
        )}

        {/* Tab 2: Fraud Analyst & Lineage Graph */}
        {activeTab === 'analyst' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {selectedTx ? (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-5">
                    <RiskScoreMeter
                      score={selectedTx.risk_score}
                      status={selectedTx.status}
                      factors={selectedTx.risk_factors}
                    />
                  </div>
                  <div className="lg:col-span-7">
                    <EvidenceSealCard
                      seal={selectedTx.evidence_seal}
                      transactionId={selectedTx.transaction_id}
                    />
                  </div>
                </div>

                {/* Lineage Graph Subgraph Visualizer */}
                <LineageGraphView
                  nodes={lineageData?.nodes || []}
                  edges={lineageData?.edges || []}
                  transactionId={selectedTx.transaction_id}
                />
              </>
            ) : (
              <Card className="text-center py-16 border-dashed border-slate-800 text-slate-400 text-xs">
                Select or initiate a transaction to view its temporal correlation lineage and cryptographic evidence seal.
              </Card>
            )}
          </div>
        )}

        {/* Tab 3: Sensor Ingestion Lab */}
        {activeTab === 'sensors' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <SensorSimulator />
          </div>
        )}
      </main>

      {/* Hardware FIDO2 Passkey Challenge Modal */}
      {pendingPasskeyTx && (
        <PasskeyPrompt
          isOpen={passkeyModalOpen}
          onClose={() => setPasskeyModalOpen(false)}
          transactionId={pendingPasskeyTx.transaction_id}
          authSessionId={pendingPasskeyTx.auth_session_id || 'session_fallback'}
          requesterEmail={'finance-director@enterprise.com'}
          amount={420000}
          beneficiaryName={'Apex Holdings Offshore Ltd'}
          riskScore={pendingPasskeyTx.risk_score}
          onSuccess={handlePasskeySuccess}
        />
      )}
    </div>
  );
}
