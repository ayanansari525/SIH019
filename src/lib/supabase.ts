import { createClient } from '@supabase/supabase-js';
import type { VerificationRecord, VerificationResult } from './types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Saves a verification result to the database.
 */
export async function saveVerification(result: VerificationResult): Promise<void> {
  const { error } = await supabase.from('verifications').insert({
    file_name: result.file_name,
    file_type: result.file_type,
    document_type: result.document_type,
    extracted_data: result.extracted_data,
    raw_text: result.raw_text,
    tamper_analysis: result.tamper_analysis,
    is_flagged: result.tamper_analysis.is_flagged,
    risk_score: result.tamper_analysis.risk_score_percent,
    processing_time_sec: result.processing_time_sec,
  });

  if (error) {
    console.error('Failed to save verification:', error);
  }
}

/**
 * Fetches all verification records, most recent first.
 */
export async function fetchVerifications(): Promise<VerificationRecord[]> {
  const { data, error } = await supabase
    .from('verifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Failed to fetch verifications:', error);
    return [];
  }

  return (data || []) as VerificationRecord[];
}

/**
 * Deletes all verification records from the database.
 */
export async function clearVerifications(): Promise<boolean> {
  const { error } = await supabase.from('verifications').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  if (error) {
    console.error('Failed to clear verifications:', error);
    return false;
  }

  return true;
}
