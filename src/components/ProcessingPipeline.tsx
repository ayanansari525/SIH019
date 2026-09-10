import { Loader2, CheckCircle2, FileSearch, ScanLine, Brain, ShieldCheck } from 'lucide-react';

interface ProcessingPipelineProps {
  currentStep: string;
  progress: number;
}

const STEPS = [
  { label: 'Converting document', icon: FileSearch },
  { label: 'Preprocessing image', icon: ScanLine },
  { label: 'OCR text extraction', icon: ScanLine },
  { label: 'Parsing key fields', icon: Brain },
  { label: 'Tamper detection', icon: ShieldCheck },
];

export function ProcessingPipeline({ currentStep, progress }: ProcessingPipelineProps) {
  const stepIndex = STEPS.findIndex((s) => currentStep.toLowerCase().includes(s.label.toLowerCase().split(' ')[0]));

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8">
      <div className="flex items-center gap-3 mb-6">
        <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
        <h3 className="text-lg font-semibold text-slate-800">Processing your document</h3>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-slate-500 mb-2">
          <span>{currentStep}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {STEPS.map((step, idx) => {
          const isComplete = idx < stepIndex || progress === 100;
          const isActive = idx === stepIndex && progress < 100;
          const Icon = step.icon;

          return (
            <div
              key={idx}
              className={`
                flex items-center gap-3 p-3 rounded-xl transition-all duration-300
                ${isComplete ? 'bg-green-50' : isActive ? 'bg-blue-50' : 'bg-slate-50'}
              `}
            >
              <div className={`
                w-9 h-9 rounded-lg flex items-center justify-center transition-colors
                ${isComplete ? 'bg-green-100' : isActive ? 'bg-blue-100' : 'bg-slate-100'}
              `}>
                {isComplete ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : isActive ? (
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                ) : (
                  <Icon className="w-5 h-5 text-slate-400" />
                )}
              </div>
              <span className={`
                text-sm font-medium transition-colors
                ${isComplete ? 'text-green-700' : isActive ? 'text-blue-700' : 'text-slate-400'}
              `}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
