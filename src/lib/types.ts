export type DocumentType =
  | 'Aadhaar Card'
  | 'PAN Card'
  | 'Passport'
  | 'Driving License'
  | 'Voter ID (EPIC)'
  | 'Generic Certificate'
  | 'Unknown';

export interface ExtractedData {
  id_number: string;
  name: string;
  date: string;
  father_name?: string;
  address?: string;
  gender?: string;
  issuer?: string;
}

export interface TamperAnalysis {
  is_flagged: boolean;
  risk_score_percent: number;
  reasons: string[];
  ela_score: number;
  edge_consistency_score: number;
  metadata_findings: string[];
}

export interface VerificationResult {
  status: 'success' | 'error';
  document_type: DocumentType;
  extracted_data: ExtractedData;
  raw_text: string;
  tamper_analysis: TamperAnalysis;
  processing_time_sec: number;
  file_name: string;
  file_type: string;
}

export interface ProcessedImage {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
}

export interface VerificationRecord {
  id: string;
  file_name: string;
  file_type: string;
  document_type: string;
  extracted_data: Record<string, string>;
  raw_text: string;
  tamper_analysis: TamperAnalysis;
  is_flagged: boolean;
  risk_score: number;
  processing_time_sec: number;
  created_at: string;
}
