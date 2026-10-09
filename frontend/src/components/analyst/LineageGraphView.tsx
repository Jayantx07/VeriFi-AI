'use client';

import React, { useState } from 'react';
import { Mail, PhoneCall, UserCheck, DollarSign, ArrowRight, ShieldAlert, Sparkles } from 'lucide-react';
import { GraphNode, GraphEdge } from '@/types';

interface LineageGraphViewProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  transactionId: string;
}

export function LineageGraphView({ nodes, edges, transactionId }: LineageGraphViewProps) {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'User':
        return <UserCheck className="w-5 h-5 text-sky-400" />;
      case 'Email':
        return <Mail className="w-5 h-5 text-amber-400" />;
      case 'Call':
        return <PhoneCall className="w-5 h-5 text-rose-400" />;
      case 'Payment':
        return <DollarSign className="w-5 h-5 text-emerald-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-slate-400" />;
    }
  };

  const getNodeColor = (type: string, risk: number) => {
    if (risk >= 70) return 'border-rose-500/80 bg-rose-950/60 shadow-[0_0_20px_rgba(244,63,94,0.35)]';
    if (risk >= 30) return 'border-amber-500/80 bg-amber-950/60 shadow-[0_0_20px_rgba(245,158,11,0.35)]';
    if (type === 'User') return 'border-sky-500/80 bg-sky-950/60 shadow-[0_0_15px_rgba(14,165,233,0.25)]';
    return 'border-emerald-500/80 bg-emerald-950/60 shadow-[0_0_15px_rgba(16,185,129,0.25)]';
  };

  return (
    <div className="relative rounded-2xl border border-slate-800 bg-slate-950/90 overflow-hidden shadow-2xl">
      {/* Background Grid Accent */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#38bdf8 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />

      {/* Header bar */}
      <div className="relative z-10 flex items-center justify-between border-b border-slate-800/80 px-6 py-3.5 bg-slate-900/60 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <h4 className="text-sm font-semibold tracking-wide text-white uppercase">
            Neo4j 72-Hour Temporal Lineage Graph
          </h4>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="font-mono text-cyan-300">TX: {transactionId}</span>
          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
            {nodes.length} Nodes · {edges.length} Edges
          </span>
        </div>
      </div>

      <div className="relative p-6 min-h-[380px] flex flex-col justify-between">
        {/* Nodes Layout Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
          {/* Column 1: Communication Sensors */}
          <div className="space-y-4">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              1. Ingested Sensors (Email / Calls)
            </span>
            <div className="space-y-3">
              {nodes
                .filter((n) => n.type === 'Email' || n.type === 'Call')
                .map((node) => (
                  <div
                    key={node.id}
                    onClick={() => setSelectedNode(node)}
                    className={`cursor-pointer rounded-xl border p-4 transition-all duration-200 transform hover:scale-[1.02] ${getNodeColor(
                      node.type,
                      node.risk
                    )} ${selectedNode?.id === node.id ? 'ring-2 ring-cyan-400 scale-[1.02]' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getNodeIcon(node.type)}
                        <span className="text-xs font-bold text-white uppercase tracking-wider">
                          {node.type} Node
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-amber-400">
                        {node.risk}% Risk
                      </span>
                    </div>
                    <p className="text-xs text-slate-200 font-medium line-clamp-2">{node.label}</p>
                    {node.properties?.spf_result && (
                      <div className="mt-2 flex gap-1.5 text-[10px]">
                        <span className={`px-1.5 py-0.5 rounded ${node.properties.spf_result === 'fail' ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                          SPF: {node.properties.spf_result.toUpperCase()}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded ${node.properties.dkim_result === 'fail' ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                          DKIM: {node.properties.dkim_result.toUpperCase()}
                        </span>
                      </div>
                    )}
                    {node.properties?.deepfake_score !== undefined && (
                      <div className="mt-2 text-[10px] text-rose-300 bg-rose-500/20 px-2 py-0.5 rounded inline-block">
                        Wav2Vec2 Score: {node.properties.deepfake_score}
                      </div>
                    )}
                  </div>
                ))}
              {nodes.filter((n) => n.type === 'Email' || n.type === 'Call').length === 0 && (
                <div className="p-4 rounded-xl border border-dashed border-slate-800 text-xs text-slate-500 text-center">
                  No anomalous sensor events found in 72h window
                </div>
              )}
            </div>
          </div>

          {/* Column 2: User Entity */}
          <div className="space-y-4">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              2. Target Approver / Requester
            </span>
            <div className="space-y-3">
              {nodes
                .filter((n) => n.type === 'User')
                .map((node) => (
                  <div
                    key={node.id}
                    onClick={() => setSelectedNode(node)}
                    className={`cursor-pointer rounded-xl border p-4 transition-all duration-200 transform hover:scale-[1.02] ${getNodeColor(
                      node.type,
                      node.risk
                    )} ${selectedNode?.id === node.id ? 'ring-2 ring-cyan-400 scale-[1.02]' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getNodeIcon(node.type)}
                        <span className="text-xs font-bold text-white uppercase tracking-wider">
                          Corporate Identity
                        </span>
                      </div>
                    </div>
                    <p className="text-xs font-mono text-cyan-200 break-all">{node.label}</p>
                    <div className="mt-3 text-[10px] text-slate-400 flex items-center gap-1">
                      <ArrowRight className="w-3 h-3 text-cyan-400" />
                      <span>Lineage Correlated Requester</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Column 3: Payment Node */}
          <div className="space-y-4">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              3. ERP Settlement Target
            </span>
            <div className="space-y-3">
              {nodes
                .filter((n) => n.type === 'Payment')
                .map((node) => (
                  <div
                    key={node.id}
                    onClick={() => setSelectedNode(node)}
                    className={`cursor-pointer rounded-xl border p-4 transition-all duration-200 transform hover:scale-[1.02] ${getNodeColor(
                      node.type,
                      node.risk
                    )} ${selectedNode?.id === node.id ? 'ring-2 ring-cyan-400 scale-[1.02]' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getNodeIcon(node.type)}
                        <span className="text-xs font-bold text-white uppercase tracking-wider">
                          Payment Request
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-rose-400">
                        {node.risk}% Risk
                      </span>
                    </div>
                    <p className="text-xs text-slate-200 font-bold">{node.label}</p>
                    <div className="mt-2 text-[10px] text-slate-400 font-mono">
                      Target IBAN: {node.properties?.beneficiary_iban || 'Direct Settlement'}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Selected Node Inspector Details Drawer */}
        {selectedNode && (
          <div className="mt-6 rounded-xl border border-cyan-500/40 bg-slate-900/90 p-4 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                Node Inspector: {selectedNode.type} (#{selectedNode.id})
              </span>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-slate-400 hover:text-white text-xs"
              >
                Close
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
              <div>
                <span className="text-slate-500 block">Identifier:</span>
                <span className="text-slate-200 break-all">{selectedNode.id}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Assigned Risk:</span>
                <span className="text-amber-400 font-bold">{selectedNode.risk}%</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500 block">Graph Properties:</span>
                <pre className="text-[10px] text-slate-300 max-h-20 overflow-auto bg-slate-950 p-2 rounded">
                  {JSON.stringify(selectedNode.properties, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
