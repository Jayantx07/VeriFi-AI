'use client';

import React, { useState } from 'react';
import { DollarSign, Send, Zap, Building2, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { TransactionVerifyRequest } from '@/types';

interface PaymentFormProps {
  onSubmit: (tx: TransactionVerifyRequest) => void;
  isLoading: boolean;
}

export function PaymentForm({ onSubmit, isLoading }: PaymentFormProps) {
  const [txId, setTxId] = useState('tx_90182');
  const [requesterEmail, setRequesterEmail] = useState('finance-director@enterprise.com');
  const [beneficiaryName, setBeneficiaryName] = useState('Apex Holdings Offshore Ltd');
  const [beneficiaryIban, setBeneficiaryIban] = useState('GB29NWBK60161331926819');
  const [amount, setAmount] = useState('420000');
  const [reference, setReference] = useState('Acquisition Escrow Q3');

  const handlePreFill = (scenario: 'low' | 'med' | 'high') => {
    const newId = `tx_${Math.floor(100000 + Math.random() * 900000)}`;
    setTxId(newId);

    if (scenario === 'low') {
      setRequesterEmail('accounting-lead@enterprise.com');
      setBeneficiaryName('Global Cloud Hosting LLC');
      setBeneficiaryIban('US82SVBK123456789012');
      setAmount('1250');
      setReference('Monthly Server Infrastructure');
    } else if (scenario === 'med') {
      setRequesterEmail('finance-director@enterprise.com');
      setBeneficiaryName('Industrial Fabrication Corp');
      setBeneficiaryIban('DE89370400440532013000');
      setAmount('65000');
      setReference('Factory Machinery Downpayment');
    } else {
      setRequesterEmail('finance-director@enterprise.com');
      setBeneficiaryName('Apex Holdings Offshore Ltd');
      setBeneficiaryIban('GB29NWBK60161331926819');
      setAmount('420000');
      setReference('Strict Confidential Escrow');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      transaction_id: txId,
      requester_email: requesterEmail,
      beneficiary_name: beneficiaryName,
      beneficiary_iban: beneficiaryIban,
      amount: parseFloat(amount) || 0,
      currency: 'USD',
      reference: reference
    });
  };

  return (
    <Card className="border-slate-800">
      <CardHeader>
        <CardTitle>
          <Building2 className="w-5 h-5 text-cyan-400" />
          <span>ERP Payment Initiation Gate</span>
        </CardTitle>
        <span className="text-xs text-slate-400">Mocking SAP / Oracle NetSuite</span>
      </CardHeader>

      {/* Scenario Presets Bar */}
      <div className="mb-5 pb-4 border-b border-slate-800/80">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          Quick Test Scenarios:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handlePreFill('low')}
            className="px-3 py-1.5 rounded-lg text-left text-xs bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-300 transition-colors"
          >
            <div className="font-bold">Routine Bill ($1,250)</div>
            <div className="text-[10px] text-emerald-400/80">Expected: PASS (&lt;30)</div>
          </button>
          <button
            type="button"
            onClick={() => handlePreFill('med')}
            className="px-3 py-1.5 rounded-lg text-left text-xs bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 text-amber-300 transition-colors"
          >
            <div className="font-bold">Unusual Amount ($65k)</div>
            <div className="text-[10px] text-amber-400/80">Expected: STEP-UP Passkey</div>
          </button>
          <button
            type="button"
            onClick={() => handlePreFill('high')}
            className="px-3 py-1.5 rounded-lg text-left text-xs bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-300 transition-colors"
          >
            <div className="font-bold">Spoofed Escrow ($420k)</div>
            <div className="text-[10px] text-rose-400/80">Expected: HOLD (&gt;70)</div>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Transaction ID</label>
            <input
              type="text"
              value={txId}
              onChange={(e) => setTxId(e.target.value)}
              className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Requester / Approver Email</label>
            <div className="relative">
              <input
                type="email"
                value={requesterEmail}
                onChange={(e) => setRequesterEmail(e.target.value)}
                className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 pl-8 text-slate-200 focus:border-cyan-500 focus:outline-none"
                required
              />
              <User className="w-4 h-4 text-slate-500 absolute left-2.5 top-2.5" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Beneficiary Legal Entity</label>
            <input
              type="text"
              value={beneficiaryName}
              onChange={(e) => setBeneficiaryName(e.target.value)}
              className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-slate-200 focus:border-cyan-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Beneficiary IBAN / Account</label>
            <input
              type="text"
              value={beneficiaryIban}
              onChange={(e) => setBeneficiaryIban(e.target.value)}
              className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Payment Amount (USD)</label>
            <div className="relative">
              <input
                type="number"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 pl-8 text-slate-100 font-bold focus:border-cyan-500 focus:outline-none"
                required
              />
              <DollarSign className="w-4 h-4 text-emerald-400 absolute left-2.5 top-2.5" />
            </div>
          </div>
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Remittance Reference</label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-slate-200 focus:border-cyan-500 focus:outline-none"
              required
            />
          </div>
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            className="w-full py-3"
            isLoading={isLoading}
          >
            <Send className="w-4 h-4 mr-2" />
            Execute VeriFi Transaction Interception Gate
          </Button>
        </div>
      </form>
    </Card>
  );
}
