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
} from 'lucide-react';

interface ResultsPanelProps {
  result: VerificationResult;
}

export function ResultsPanel({ result }: ResultsPanelProps) {
  const { document_type, extracted_data, raw_text, tamper_analysis, processing_time_sec } = result;
  const isFlagged = tamper_analysis.is_flagged;
  const riskScore = tamper_analysis.risk_score_percent;

  const riskColor = riskScore > 50 ? 'red' : riskScore > 25 ? 'amber' : 'green';
  const riskBg = {
    red: 'bg-red-50 border-red-200',
    amber: 'bg-amber-50 border-amber-200',
    green: 'bg-green-50 border-green-200',
  }[riskColor];
  const riskText = {
    red: 'text-red-700',
    amber: 'text-amber-700',
    green: 'text-green-700',
  }[riskColor];
  const riskBar = {
    red: 'bg-red-500',
    amber: 'bg-amber-500',
    green: 'bg-green-500',
  }[riskColor];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center gap-3">
          {isFlagged ? (
            <div className="w-11 h-11 rounded-xl bg-red-100 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6 text-red-600" />
            </div>
          ) : (
            <div className="w-11 h-11 rounded-xl bg-green-100 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-green-600" />
            </div>
          )}
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              {isFlagged ? 'Document Flagged' : 'Document Verified'}
            </h3>
            <p className="text-sm text-slate-500">
              {document_type} — Processed in {processing_time_sec}s
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Clock className="w-4 h-4" />
          <span>{processing_time_sec}s</span>
        </div>
      </div>

      {/* Risk Score */}
      <div className={`rounded-2xl border p-5 ${riskBg}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className={`w-5 h-5 ${riskText}`} />
            <span className={`font-semibold ${riskText}`}>Tamper Risk Score</span>
          </div>
          <span className={`text-2xl font-bold ${riskText}`}>{riskScore}%</span>
        </div>
        <div className="h-2.5 bg-white/60 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${riskBar}`}
            style={{ width: `${riskScore}%` }}
          />
        </div>
      </div>

      {/* Extracted Data */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-blue-600" />
          <h4 className="font-semibold text-slate-800">Extracted Information</h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <DataField icon={Fingerprint} label="Document ID" value={extracted_data.id_number} />
          <DataField icon={User} label="Name" value={extracted_data.name} />
          <DataField icon={Calendar} label="Date" value={extracted_data.date} />
          {extracted_data.father_name && (
            <DataField icon={User} label="Father/Parent" value={extracted_data.father_name} />
          )}
          {extracted_data.gender && (
            <DataField icon={Info} label="Gender" value={extracted_data.gender} />
          )}
          {extracted_data.issuer && (
            <DataField icon={Info} label="Issuer" value={extracted_data.issuer} />
          )}
        </div>

        {extracted_data.address && (
          <div className="mt-3 p-3 bg-slate-50 rounded-xl">
            <p className="text-xs font-medium text-slate-500 mb-1">Address</p>
            <p className="text-sm text-slate-700">{extracted_data.address}</p>
          </div>
        )}
      </div>

      {/* Tamper Analysis Details */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="w-5 h-5 text-blue-600" />
          <h4 className="font-semibold text-slate-800">Tamper Analysis Details</h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <ScoreCard label="ELA Score" value={tamper_analysis.ela_score} max={100} unit="" />
          <ScoreCard label="Edge Consistency" value={tamper_analysis.edge_consistency_score} max={100} unit="" />
        </div>

        <div className="space-y-2">
          {tamper_analysis.reasons.map((reason, idx) => {
            const isPositive = reason.toLowerCase().includes('no ') || reason.toLowerCase().includes('uniform') || reason.toLowerCase().includes('consistent') || reason.toLowerCase().includes('no editor');
            return (
              <div
                key={idx}
                className={`flex items-start gap-2 p-3 rounded-xl ${
                  isPositive ? 'bg-green-50' : 'bg-amber-50'
                }`}
              >
                {isPositive ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                )}
                <span className={`text-sm ${isPositive ? 'text-green-700' : 'text-amber-700'}`}>
                  {reason}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Raw Text */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-5 h-5 text-blue-600" />
          <h4 className="font-semibold text-slate-800">Raw OCR Text</h4>
        </div>
        <pre className="text-xs text-slate-600 bg-slate-50 rounded-xl p-4 overflow-x-auto whitespace-pre-wrap max-h-64 overflow-y-auto font-mono leading-relaxed">
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
    <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
      <Icon className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="text-sm font-medium text-slate-800 truncate">
          {value || <span className="text-slate-400 italic">Not detected</span>}
        </p>
      </div>
    </div>
  );
}

function ScoreCard({ label, value, max, unit }: { label: string; value: number; max: number; unit: string }) {
  const pct = (value / max) * 100;
  const color = pct > 50 ? 'bg-red-500' : pct > 25 ? 'bg-amber-500' : 'bg-green-500';

  return (
    <div className="p-3 bg-slate-50 rounded-xl">
      <div className="flex justify-between items-baseline mb-2">
        <span className="text-xs font-medium text-slate-500">{label}</span>
        <span className="text-sm font-bold text-slate-700">
          {value.toFixed(1)}{unit}
        </span>
      </div>
      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
