import { Loader2, CheckCircle2, FileSearch, ScanLine, Brain, ShieldCheck } from 'lucide-react';

interface ProcessingPipelineProps {
  currentStep: string;
  progress: number;
}

const STEPS = [
  { label: 'Converting document', desc: 'Loading and rendering pages', icon: FileSearch },
  { label: 'Preprocessing image', desc: 'Grayscale, denoise, threshold', icon: ScanLine },
  { label: 'OCR text extraction', desc: 'Reading text with Tesseract', icon: ScanLine },
  { label: 'Parsing key fields', desc: 'Detecting IDs, names, dates', icon: Brain },
  { label: 'Tamper detection', desc: 'ELA, edge analysis, metadata', icon: ShieldCheck },
];

export function ProcessingPipeline({ currentStep, progress }: ProcessingPipelineProps) {
  const stepIndex = STEPS.findIndex((s) => currentStep.toLowerCase().includes(s.label.toLowerCase().split(' ')[0]));

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="relative">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-white animate-spin" />
          </div>
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-800">Processing your document</h3>
          <p className="text-sm text-slate-400">This usually takes a few seconds</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center text-sm mb-2">
          <span className="text-slate-600 font-medium">{currentStep}</span>
          <span className="text-slate-400 font-mono text-xs tabular-nums">{Math.round(progress)}%</span>
        </div>
        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-500 ease-out relative"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-2.5">
        {STEPS.map((step, idx) => {
          const isComplete = idx < stepIndex || progress === 100;
          const isActive = idx === stepIndex && progress < 100;
          const Icon = step.icon;

          return (
            <div
              key={idx}
              className={`
                flex items-center gap-3 p-3.5 rounded-xl transition-all duration-300
                ${isComplete ? 'bg-green-50/70' : isActive ? 'bg-blue-50/70 ring-1 ring-blue-200/50' : 'bg-slate-50/50'}
              `}
            >
              <div className={`
                relative w-10 h-10 rounded-xl flex items-center justify-center transition-all
                ${isComplete ? 'bg-green-100' : isActive ? 'bg-blue-100' : 'bg-slate-100'}
              `}>
                {isComplete ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : isActive ? (
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                ) : (
                  <Icon className="w-5 h-5 text-slate-400" />
                )}
                {isActive && (
                  <div className="absolute inset-0 rounded-xl border-2 border-blue-300/40 animate-pulse-ring" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`
                  text-sm font-semibold transition-colors
                  ${isComplete ? 'text-green-700' : isActive ? 'text-blue-700' : 'text-slate-400'}
                `}>
                  {step.label}
                </p>
                <p className={`
                  text-xs mt-0.5 transition-colors
                  ${isComplete ? 'text-green-500/70' : isActive ? 'text-blue-500/70' : 'text-slate-400/70'}
                `}>
                  {step.desc}
                </p>
              </div>
              {isComplete && (
                <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 animate-scale-in" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
