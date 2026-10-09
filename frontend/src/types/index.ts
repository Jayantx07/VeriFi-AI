export interface IntentAnalysisResult {
  intent: string;
  urgency_score: number;
  financial_action_detected: boolean;
  secrecy_detected: boolean;
  key_extracted_entities?: {
    urgency_cues?: string[];
    secrecy_cues?: string[];
    financial_cues?: string[];
  };
}

export interface EmailIngestRequest {
  sender: string;
  recipient: string;
  subject: string;
  body: string;
  spf_result: 'pass' | 'fail' | 'softfail' | 'neutral';
  dkim_result: 'pass' | 'fail' | 'none';
  timestamp?: string;
}

export interface EmailIngestResponse {
  event_id: string;
  status: string;
  node_id: string;
  intent_analysis: IntentAnalysisResult;
  pii_redacted_body: string;
}

export interface AudioIngestResponse {
  event_id: string;
  caller: string;
  target_identity: string;
  deepfake_score: number;
  verdict: 'authentic_human' | 'ambiguous_quality' | 'suspicious_synthetic';
  node_id: string;
  duration_seconds: number;
}

export interface EvidenceSeal {
  sha256_hash: string;
  s3_uri: string;
  sealed_at: string;
  canonical_digest?: Record<string, any>;
}

export interface TransactionVerifyRequest {
  transaction_id: string;
  requester_email: string;
  beneficiary_name: string;
  beneficiary_iban: string;
  amount: number;
  currency?: string;
  reference?: string;
  timestamp?: string;
}

export interface TransactionVerifyResponse {
  transaction_id: string;
  status: 'pass' | 'step-up' | 'hold';
  risk_score: number;
  risk_factors: string[];
  message?: string;
  challenge_required?: string;
  auth_session_id?: string;
  evidence_seal?: EvidenceSeal;
}

export interface GraphNode {
  id: string;
  type: 'User' | 'Email' | 'Call' | 'Payment';
  label: string;
  risk: number;
  properties?: Record<string, any>;
}

export interface GraphEdge {
  source: string;
  target: string;
  relationship: string;
  properties?: Record<string, any>;
}

export interface LineageGraphResponse {
  transaction_id: string;
  risk_score: number;
  status: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  evidence_seal?: EvidenceSeal;
}
