'use client';

import React, { useState } from 'react';
import { Mail, Mic, Send, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ingestEmail, ingestAudio } from '@/lib/api';
import { EmailIngestResponse, AudioIngestResponse } from '@/types';

export function SensorSimulator() {
  const [activeTab, setActiveTab] = useState<'email' | 'audio'>('email');

  // Email form state
  const [sender, setSender] = useState('ceo-urgent@executive-channel-direct.com');
  const [recipient, setRecipient] = useState('finance-director@enterprise.com');
  const [subject, setSubject] = useState('STRICT CONFIDENTIAL: Urgent Escrow Transfer Required');
  const [body, setBody] = useState(
    'Please immediately wire $420,000 to the attached vendor account GB29NWBK60161331926819 for the undisclosed Q3 merger. Do not discuss over standard channels.'
  );
  const [spf, setSpf] = useState<'pass' | 'fail'>('fail');
  const [dkim, setDkim] = useState<'pass' | 'fail'>('fail');
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [emailResult, setEmailResult] = useState<EmailIngestResponse | null>(null);

  // Audio form state
  const [caller, setCaller] = useState('Robert Thorne (CEO Deepfake)');
  const [target, setTarget] = useState('finance-director@enterprise.com');
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [audioResult, setAudioResult] = useState<AudioIngestResponse | null>(null);

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEmailLoading(true);
    try {
      const res = await ingestEmail({
        sender,
        recipient,
        subject,
        body,
        spf_result: spf,
        dkim_result: dkim
      });
      setEmailResult(res);
    } catch (err: any) {
      alert(err.message || 'Email ingestion failed');
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handleSendAudio = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAudioLoading(true);
    try {
      const formData = new FormData();
      formData.append('caller_identity', caller);
      formData.append('target_identity', target);

      // Create a dummy .wav blob representing recorded voice call
      const dummyBlob = new Blob(['RIFF_MOCK_WAVE_DATA_SYNTHETIC_DEEPFAKE_VOCAL_SAMPLE'], {
        type: 'audio/wav'
      });
      formData.append('audio_file', dummyBlob, 'ceo_synthetic_sample.wav');

      const res = await ingestAudio(formData);
      setAudioResult(res);
    } catch (err: any) {
      alert(err.message || 'Audio ingestion failed');
    } finally {
      setIsAudioLoading(false);
    }
  };

  return (
    <Card className="border-slate-800">
      <CardHeader>
        <CardTitle>
          <Sparkles className="w-5 h-5 text-amber-400" />
          <span>Multimodal Communication Sensor Ingestion Lab</span>
        </CardTitle>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('email')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'email'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            Email Sensor (SPF/Bedrock)
          </button>
          <button
            onClick={() => setActiveTab('audio')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'audio'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            Zoom Audio (Wav2Vec2)
          </button>
        </div>
      </CardHeader>

      {activeTab === 'email' ? (
        <div className="space-y-4 text-xs">
          <form onSubmit={handleSendEmail} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Sender Email</label>
                <input
                  type="text"
                  value={sender}
                  onChange={(e) => setSender(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-slate-200 focus:border-amber-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Target Approver</label>
                <input
                  type="email"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-slate-200 focus:border-amber-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-slate-400 font-semibold mb-1">Email Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-slate-200 focus:border-amber-500 focus:outline-none"
                  required
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-slate-400 font-semibold mb-1">SPF Status</label>
                  <select
                    value={spf}
                    onChange={(e) => setSpf(e.target.value as any)}
                    className="w-full rounded-lg bg-slate-950 border border-slate-800 px-2.5 py-2 text-slate-200 focus:border-amber-500 focus:outline-none"
                  >
                    <option value="fail">FAIL (Spoofed)</option>
                    <option value="pass">PASS (Valid)</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-slate-400 font-semibold mb-1">DKIM Status</label>
                  <select
                    value={dkim}
                    onChange={(e) => setDkim(e.target.value as any)}
                    className="w-full rounded-lg bg-slate-950 border border-slate-800 px-2.5 py-2 text-slate-200 focus:border-amber-500 focus:outline-none"
                  >
                    <option value="fail">FAIL (Spoofed)</option>
                    <option value="pass">PASS (Valid)</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Email Body (Raw Text with PII)</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={3}
                className="w-full rounded-lg bg-slate-950 border border-slate-800 p-2.5 text-slate-200 focus:border-amber-500 focus:outline-none font-mono text-[11px]"
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full !bg-gradient-to-r !from-amber-600 !to-orange-600"
              isLoading={isEmailLoading}
            >
              <Send className="w-4 h-4 mr-2" />
              Ingest Email & Correlate into Neo4j Graph
            </Button>
          </form>

          {emailResult && (
            <div className="mt-4 p-4 rounded-xl border border-amber-500/30 bg-slate-950 text-slate-200 space-y-2">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Email Event Sealed in Lineage Graph (#{emailResult.node_id})
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block font-semibold mb-1">Presidio PII Redacted Body:</span>
                  <p className="font-mono text-slate-300">{emailResult.pii_redacted_body}</p>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block font-semibold mb-1">Amazon Bedrock Extraction:</span>
                  <pre className="font-mono text-[10px] text-amber-300 overflow-auto max-h-24">
                    {JSON.stringify(emailResult.intent_analysis, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4 text-xs">
          <form onSubmit={handleSendAudio} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Simulated Caller Identity</label>
                <input
                  type="text"
                  value={caller}
                  onChange={(e) => setCaller(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-slate-200 focus:border-rose-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Target Identity</label>
                <input
                  type="email"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-slate-200 focus:border-rose-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-300 block">Zoom Audio Sensor Stream</span>
                <span className="text-[11px] text-slate-500 font-mono">Simulating live executive voice stream (ceo_synthetic_sample.wav)</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-mono">
                Wav2Vec2 Ready
              </span>
            </div>

            <Button
              type="submit"
              variant="danger"
              className="w-full"
              isLoading={isAudioLoading}
            >
              <Mic className="w-4 h-4 mr-2" />
              Upload Audio Clip & Score Deepfake Likelihood
            </Button>
          </form>

          {audioResult && (
            <div className="mt-4 p-4 rounded-xl border border-rose-500/30 bg-slate-950 text-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-rose-400 font-bold">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  Voice Analysis Result (#{audioResult.node_id})
                </span>
                <span className="text-xs font-mono font-bold text-rose-400">
                  {(audioResult.deepfake_score * 100).toFixed(1)}% Synthetic Voice
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Classification Verdict: <strong className="text-rose-400 uppercase font-mono">{audioResult.verdict}</strong>.
                Call node linked to target approver in Neo4j Lineage Graph for next 72 hours.
              </p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
