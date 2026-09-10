import { useState, useCallback } from 'react';
import { UploadZone } from '@/components/UploadZone';
import { ProcessingPipeline } from '@/components/ProcessingPipeline';
import { ResultsPanel } from '@/components/ResultsPanel';
import { HistoryPanel } from '@/components/HistoryPanel';
import { verifyDocument, type ProgressCallback } from '@/lib/verifyDocument';
import { saveVerification } from '@/lib/supabase';
import type { VerificationResult, VerificationRecord } from '@/lib/types';
import { ShieldCheck, ScanText, FileSearch, BrainCircuit, Lock, Github, Sparkles } from 'lucide-react';

type AppState = 'idle' | 'processing' | 'done' | 'error';

export default function App() {
  const [appState, setAppState] = useState<AppState>('idle');
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [historyKey, setHistoryKey] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    setAppState('processing');
    setProgress(0);
    setError(null);

    const onProgress: ProgressCallback = (step, prog) => {
      setCurrentStep(step);
      setProgress(prog);
    };

    const res = await verifyDocument(file, onProgress);

    if (res.status === 'error') {
      setAppState('error');
      setError(res.tamper_analysis.reasons[0] || 'An unknown error occurred');
      setResult(res);
    } else {
      setResult(res);
      setAppState('done');
      // Save to database
      await saveVerification(res);
      setHistoryKey((k) => k + 1);
    }
  }, []);

  const handleHistorySelect = (record: VerificationRecord) => {
    setResult({
      status: 'success',
      document_type: record.document_type as VerificationResult['document_type'],
      extracted_data: {
        id_number: record.extracted_data.id_number || '',
        name: record.extracted_data.name || '',
        date: record.extracted_data.date || '',
        father_name: record.extracted_data.father_name,
        address: record.extracted_data.address,
        gender: record.extracted_data.gender,
        issuer: record.extracted_data.issuer,
      },
      raw_text: record.raw_text,
      tamper_analysis: record.tamper_analysis,
      processing_time_sec: record.processing_time_sec,
      file_name: record.file_name,
      file_type: record.file_type,
    });
    setAppState('done');
  };

  const handleReset = () => {
    setAppState('idle');
    setResult(null);
    setProgress(0);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-sm">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800 leading-tight">DocuVerify AI</h1>
              <p className="text-xs text-slate-500 leading-tight">Smart Document Verification & Tamper Detection</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
            <Lock className="w-3.5 h-3.5" />
            <span>SIH PS-26188 Prototype</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Hero */}
        {appState === 'idle' && (
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              AI-Powered Document Verification
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-3 tracking-tight">
              Verify any document in seconds
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto text-base">
              Upload a scanned identity document or certificate. Our system extracts text via OCR,
              parses key fields, and runs forgery detection — all in your browser.
            </p>
          </div>
        )}

        {/* Feature badges */}
        {appState === 'idle' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8 max-w-3xl mx-auto">
            <FeatureBadge icon={FileSearch} label="Multi-format" sub="PDF, PNG, JPG" />
            <FeatureBadge icon={ScanText} label="OCR Engine" sub="Tesseract.js" />
            <FeatureBadge icon={BrainCircuit} label="Field Parsing" sub="Regex + heuristics" />
            <FeatureBadge icon={ShieldCheck} label="Tamper Check" sub="ELA + edge analysis" />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-6">
            {appState === 'idle' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8">
                <UploadZone onFileSelect={handleFileSelect} />
              </div>
            )}

            {appState === 'processing' && (
              <ProcessingPipeline currentStep={currentStep} progress={progress} />
            )}

            {(appState === 'done' || appState === 'error') && result && (
              <>
                {appState === 'error' && error && (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
                    <span className="text-red-600 text-lg">!</span>
                    <div>
                      <p className="text-sm font-medium text-red-700">Processing Error</p>
                      <p className="text-sm text-red-600 mt-1">{error}</p>
                    </div>
                  </div>
                )}
                {appState === 'done' && <ResultsPanel result={result} />}
                <button
                  onClick={handleReset}
                  className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                >
                  Verify Another Document
                </button>
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <HistoryPanel refreshKey={historyKey} onSelect={handleHistorySelect} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white/50 mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <p>DocuVerify AI — Smart India Hackathon 2026 Prototype (PS-26188)</p>
          <div className="flex items-center gap-3">
            <span>Client-side OCR + Forgery Detection</span>
            <Github className="w-3.5 h-3.5" />
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureBadge({
  icon: Icon,
  label,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  sub: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 p-4 rounded-xl bg-white border border-slate-200">
      <Icon className="w-5 h-5 text-blue-600" />
      <div className="text-center">
        <p className="text-sm font-semibold text-slate-700">{label}</p>
        <p className="text-xs text-slate-400">{sub}</p>
      </div>
    </div>
  );
}
