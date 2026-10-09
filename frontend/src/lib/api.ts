import {
  EmailIngestRequest,
  EmailIngestResponse,
  AudioIngestResponse,
  TransactionVerifyRequest,
  TransactionVerifyResponse,
  LineageGraphResponse
} from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

export async function checkBackendHealth() {
  try {
    const res = await fetch('http://localhost:8000/health');
    if (!res.ok) return { healthy: false, neo4j: false };
    const data = await res.json();
    return { healthy: true, neo4j: data.neo4j_connected };
  } catch {
    return { healthy: false, neo4j: false };
  }
}

export async function ingestEmail(payload: EmailIngestRequest): Promise<EmailIngestResponse> {
  const res = await fetch(`${API_BASE}/sensors/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to ingest email' }));
    throw new Error(err.detail || 'Failed to ingest email');
  }
  return res.json();
}

export async function ingestAudio(formData: FormData): Promise<AudioIngestResponse> {
  const res = await fetch(`${API_BASE}/sensors/audio`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to ingest audio' }));
    throw new Error(err.detail || 'Failed to ingest audio');
  }
  return res.json();
}

export async function verifyTransaction(payload: TransactionVerifyRequest): Promise<TransactionVerifyResponse> {
  const res = await fetch(`${API_BASE}/verify-transaction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to verify transaction' }));
    throw new Error(err.detail || 'Failed to verify transaction');
  }
  return res.json();
}

export async function getPasskeyOptions(authSessionId: string, userEmail: string, transactionId: string) {
  const res = await fetch(`${API_BASE}/passkey/generate-options`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      auth_session_id: authSessionId,
      user_email: userEmail,
      transaction_id: transactionId
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to generate passkey challenge' }));
    throw new Error(err.detail || 'Failed to generate passkey challenge');
  }
  return res.json();
}

export async function verifyPasskeyCredential(authSessionId: string, transactionId: string, credential: any) {
  const res = await fetch(`${API_BASE}/passkey/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      auth_session_id: authSessionId,
      transaction_id: transactionId,
      credential
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Passkey verification failed' }));
    throw new Error(err.detail || 'Passkey verification failed');
  }
  return res.json();
}

export async function fetchTransactions(): Promise<TransactionVerifyResponse[]> {
  const res = await fetch(`${API_BASE}/audit/transactions`);
  if (!res.ok) return [];
  return res.json();
}

export async function fetchLineageGraph(transactionId: string): Promise<LineageGraphResponse> {
  const res = await fetch(`${API_BASE}/audit/lineage/${transactionId}`);
  if (!res.ok) {
    throw new Error('Failed to retrieve lineage graph');
  }
  return res.json();
}
