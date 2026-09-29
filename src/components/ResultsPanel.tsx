import type { VerificationResult } from '@/lib/types';
import {
  ShieldCheck,
  ShieldAlert,
  FileText,
  Fingerprint,
  Calendar,
  User,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Info,
  Zap,
  ScanSearch,
  Gauge,
} from 'lucide-react';

interface ResultsPanelProps {
  result: VerificationResult;
}

export function ResultsPanel({ result }: ResultsPanelProps) {
  const { document_type, extracted_data, raw_text, tamper_analysis, processing_time_sec } = result;
  const isFlagged = tamper_analysis.is_flagged;
  const riskScore = tamper_analysis.risk_score_percent;

  const riskLevel = riskScore > 50 ? 'high' : riskScore > 25 ? 'medium' : 'low';
  const riskStyles = {
    high: { bg: 'bg-red-50/80', border: 'border-red-200', text: 'text-red-700', bar: 'bg-red-500', glow: 'shadow-red-500/10', icon: 'text-red-600', iconBg: 'bg-red-100' },
    medium: { bg: 'bg-amber-50/80', border: 'border-amber-200', text: 'text-amber-700', bar: 'bg-amber-500', glow: 'shadow-amber-500/10', icon: 'text-amber-600', iconBg: 'bg-amber-100' },
    low: { bg: 'bg-green-50/80', border: 'border-green-200', text: 'text-green-700', bar: 'bg-green-500', glow: 'shadow-green-500/10', icon: 'text-green-600', iconBg: 'bg-green-100' },
  }[riskLevel];

  // Circular gauge values
  const circumference = 2 * Math.PI * 42;
  const dashOffset = circumference - (riskScore / 100) * circumference;

  return (
    <div className="space-y-4">
      {/* Header + Risk Gauge */}
      <div className={`rounded-2xl border p-5 ${riskStyles.bg} ${riskStyles.border} shadow-sm ${riskStyles.glow}`}>
        <div className="flex items-center gap-5">
          {/* Circular gauge */}
          <div className="relative w-24 h-24 flex-shrink-0">
            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50" cy="50" r="42"
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
                className="text-white/60"
              />
              <circle
                cx="50" cy="50" r="42"
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                className={`${riskStyles.text} transition-all duration-1000 ease-out`}
                style={{ stroke: 'currentColor' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className={`text-2xl font-bold ${riskStyles.text}`}>{riskScore}</span>
              <span className={`text-xs ${riskStyles.text} opacity-70`}>% risk</span>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 mb-1">
              <div className={`w-9 h-9 rounded-xl ${riskStyles.iconBg} flex items-center justify-center flex-shrink-0`}>
                {isFlagged ? (
                  <ShieldAlert className={`w-5 h-5 ${riskStyles.icon}`} />
                ) : (
                  <ShieldCheck className={`w-5 h-5 ${riskStyles.icon}`} />
                )}
              </div>
              <h3 className="text-lg font-bold text-slate-800">
                {isFlagged ? 'Document Flagged' : 'Document Verified'}
              </h3>
            </div>
            <p className="text-sm text-slate-500">
              {document_type}
            </p>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1 text-xs text-slate-400 font-medium">
                <Clock className="w-3.5 h-3.5" />
                {processing_time_sec}s
              </div>
              <div className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${riskStyles.bg} ${riskStyles.text} border ${riskStyles.border}`}>
                {isFlagged ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                {riskLevel === 'high' ? 'High Risk' : riskLevel === 'medium' ? 'Medium Risk' : 'Low Risk'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Extracted Data */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <FileText className="w-4.5 h-4.5 text-blue-600" />
          </div>
          <h4 className="font-bold text-slate-800">Extracted Information</h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <DataField icon={Fingerprint} label="Document ID" value={extracted_data.id_number} />
          <DataField icon={User} label="Name" value={extracted_data.name} />
          <DataField icon={Calendar} label="Date" value={extracted_data.date} />
          {extracted_data.father_name && (
            <DataField icon={User} label="Father / Parent" value={extracted_data.father_name} />
          )}
          {extracted_data.gender && (
            <DataField icon={Info} label="Gender" value={extracted_data.gender} />
          )}
          {extracted_data.issuer && (
            <DataField icon={Info} label="Issuer" value={extracted_data.issuer} />
          )}
        </div>

        {extracted_data.address && (
          <div className="mt-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Address</p>
            <p className="text-sm text-slate-700 leading-relaxed">{extracted_data.address}</p>
          </div>
        )}
      </div>

      {/* Tamper Analysis Details */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <ShieldCheck className="w-4.5 h-4.5 text-blue-600" />
          </div>
          <h4 className="font-bold text-slate-800">Tamper Analysis Details</h4>
        </div>

        {/* Score cards */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <ScoreCard icon={Gauge} label="ELA Score" value={tamper_analysis.ela_score} max={100} />
          <ScoreCard icon={ScanSearch} label="Edge Consistency" value={tamper_analysis.edge_consistency_score} max={100} />
        </div>

        {/* Reasons */}
        <div className="space-y-2">
          {tamper_analysis.reasons.map((reason, idx) => {
            const isPositive = reason.toLowerCase().includes('no ') || reason.toLowerCase().includes('uniform') || reason.toLowerCase().includes('consistent') || reason.toLowerCase().includes('no editor');
            return (
              <div
                key={idx}
                className={`flex items-start gap-2.5 p-3 rounded-xl transition-all ${
                  isPositive ? 'bg-green-50/70' : 'bg-amber-50/70'
                }`}
              >
                <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${
                  isPositive ? 'bg-green-100' : 'bg-amber-100'
                }`}>
                  {isPositive ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  )}
                </div>
                <span className={`text-sm ${isPositive ? 'text-green-700' : 'text-amber-700'} leading-relaxed`}>
                  {reason}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Raw Text */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <Zap className="w-4.5 h-4.5 text-blue-600" />
          </div>
          <h4 className="font-bold text-slate-800">Raw OCR Text</h4>
        </div>
        <pre className="text-xs text-slate-600 bg-slate-50 rounded-xl p-4 overflow-x-auto whitespace-pre-wrap max-h-64 overflow-y-auto font-mono leading-relaxed border border-slate-100">
          {raw_text || 'No text extracted'}
        </pre>
      </div>
    </div>
  );
}

function DataField({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="group flex items-start gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100 hover:border-blue-200 transition-colors">
      <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
        <Icon className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
        <p className="text-sm font-medium text-slate-800 truncate mt-0.5">
          {value || <span className="text-slate-400 italic font-normal">Not detected</span>}
        </p>
      </div>
    </div>
  );
}

function ScoreCard({ icon: Icon, label, value, max }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number; max: number }) {
  const pct = (value / max) * 100;
  const color = pct > 50 ? 'bg-red-500' : pct > 25 ? 'bg-amber-500' : 'bg-green-500';
  const textColor = pct > 50 ? 'text-red-600' : pct > 25 ? 'text-amber-600' : 'text-green-600';

  return (
    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${textColor}`} />
        <span className="text-xs font-semibold text-slate-500">{label}</span>
        <span className={`ml-auto text-sm font-bold ${textColor}`}>
          {value.toFixed(1)}
        </span>
      </div>
      <div className="h-2 bg-slate-200/70 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-700 ease-out`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
