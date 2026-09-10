/*
# Create verifications table for document verification history

1. New Tables
- `verifications`
  - `id` (uuid, primary key)
  - `file_name` (text, name of the uploaded file)
  - `file_type` (text, mime type of the uploaded file)
  - `document_type` (text, detected document type e.g. Aadhaar, PAN, Passport)
  - `extracted_data` (jsonb, structured key-value pairs extracted from the document)
  - `raw_text` (text, full OCR-extracted text)
  - `tamper_analysis` (jsonb, forgery/tamper detection results)
  - `is_flagged` (boolean, whether the document was flagged as potentially tampered)
  - `risk_score` (numeric, tamper risk score 0-100)
  - `processing_time_sec` (numeric, time taken to process)
  - `created_at` (timestamptz, when the verification was run)

2. Security
- Enable RLS on `verifications`.
- Single-tenant app (no sign-in): allow anon + authenticated full CRUD since data is intentionally shared for demo purposes.
*/

CREATE TABLE IF NOT EXISTS verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name text NOT NULL,
  file_type text NOT NULL,
  document_type text NOT NULL DEFAULT 'Unknown',
  extracted_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  raw_text text NOT NULL DEFAULT '',
  tamper_analysis jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_flagged boolean NOT NULL DEFAULT false,
  risk_score numeric NOT NULL DEFAULT 0,
  processing_time_sec numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_verifications" ON verifications;
CREATE POLICY "anon_select_verifications" ON verifications FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_verifications" ON verifications;
CREATE POLICY "anon_insert_verifications" ON verifications FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_verifications" ON verifications;
CREATE POLICY "anon_update_verifications" ON verifications FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_verifications" ON verifications;
CREATE POLICY "anon_delete_verifications" ON verifications FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_verifications_created_at ON verifications (created_at DESC);
