import { useState, useCallback } from 'react';
import { UploadZone } from '@/components/UploadZone';
import { ProcessingPipeline } from '@/components/ProcessingPipeline';
import { ResultsPanel } from '@/components/ResultsPanel';
import { HistoryPanel } from '@/components/HistoryPanel';
import { verifyDocument, type ProgressCallback } from '@/lib/verifyDocument';
import { saveVerification } from '@/lib/supabase';
import type { VerificationResult, VerificationRecord } from '@/lib/types';
import { ShieldCheck, ScanText, FileSearch, BrainCircuit, Lock, Sparkles, FileCheck2, Layers } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-50 relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-blue-100/40 blur-3xl" />
        <div className="absolute top-1/3 -left-40 w-80 h-80 rounded-full bg-cyan-100/30 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 rounded-full bg-teal-100/20 blur-3xl" />
      </div>

      {/* Header */}
      <header className="border-b border-slate-200/70 bg-white/70 backdrop-blur-xl sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <ShieldCheck className="w-5 h-5 text-white" />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-300 opacity-0 hover:opacity-100 blur transition-opacity" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800 leading-tight tracking-tight">DocuVerify AI</h1>
              <p className="text-xs text-slate-500 leading-tight">Smart Document Verification & Tamper Detection</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 font-medium">
            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
              <Lock className="w-3.5 h-3.5" />
            </div>
            <span>SIH PS-26188</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 relative">
        {/* Hero */}
        {appState === 'idle' && (
          <div className="text-center mb-8 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-medium mb-5">
              <Sparkles className="w-3.5 h-3.5" />
              AI-Powered Document Verification
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-3 tracking-tight">
              Verify any document
              <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent"> in seconds</span>
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto text-base leading-relaxed">
              Upload a scanned identity document or certificate. Our system extracts text via OCR,
              parses key fields, and runs forgery detection — all in your browser.
            </p>
          </div>
        )}

        {/* Feature badges */}
        {appState === 'idle' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8 max-w-3xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
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
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm animate-scale-in">
                <UploadZone onFileSelect={handleFileSelect} />
              </div>
            )}

            {appState === 'processing' && (
              <div className="animate-scale-in">
                <ProcessingPipeline currentStep={currentStep} progress={progress} />
              </div>
            )}

            {(appState === 'done' || appState === 'error') && result && (
              <div className="space-y-4 animate-fade-in-up">
                {appState === 'error' && error && (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-red-600 text-sm font-bold">!</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-red-700">Processing Error</p>
                      <p className="text-sm text-red-600 mt-1">{error}</p>
                    </div>
                  </div>
                )}
                {appState === 'done' && <ResultsPanel result={result} />}
                <button
                  onClick={handleReset}
                  className="w-full py-3.5 rounded-xl bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 text-slate-700 hover:text-blue-700 font-medium transition-all duration-200 flex items-center justify-center gap-2 group"
                >
                  <FileCheck2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  Verify Another Document
                </button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <HistoryPanel refreshKey={historyKey} onSelect={handleHistorySelect} />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/70 bg-white/40 mt-12 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <p>DocuVerify AI — Smart India Hackathon 2026 Prototype (PS-26188)</p>
          <div className="flex items-center gap-3">
            <Layers className="w-3.5 h-3.5" />
            <span>Client-side OCR + Forgery Detection</span>
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
    <div className="group flex flex-col items-center gap-2 p-4 rounded-xl bg-white border border-slate-200/80 hover:border-blue-200 hover:shadow-md hover:shadow-blue-500/5 transition-all duration-200">
      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
        <Icon className="w-5 h-5 text-blue-600" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-slate-700">{label}</p>
        <p className="text-xs text-slate-400">{sub}</p>
      </div>
    </div>
  );
}
