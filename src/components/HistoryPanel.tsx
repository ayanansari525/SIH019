import { useEffect, useState } from 'react';
import type { VerificationRecord } from '@/lib/types';
import { fetchVerifications, clearVerifications } from '@/lib/supabase';
import { History, ShieldCheck, ShieldAlert, FileText, Clock, Trash2, RefreshCw, Inbox } from 'lucide-react';

interface HistoryPanelProps {
  refreshKey: number;
  onSelect: (record: VerificationRecord) => void;
}

export function HistoryPanel({ refreshKey, onSelect }: HistoryPanelProps) {
  const [records, setRecords] = useState<VerificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const data = await fetchVerifications();
      if (!cancelled) {
        setRecords(data);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [refreshKey]);

  const handleClear = async () => {
    setClearing(true);
    const success = await clearVerifications();
    if (success) {
      setRecords([]);
    }
    setClearing(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
          <History className="w-4.5 h-4.5 text-blue-600" />
        </div>
        <h3 className="font-bold text-slate-800">History</h3>
        <span className="ml-auto text-xs text-slate-400 font-medium tabular-nums">{records.length} {records.length === 1 ? 'record' : 'records'}</span>
        {records.length > 0 && (
          <button
            onClick={handleClear}
            disabled={clearing}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-red-600 disabled:opacity-50 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-red-50 border border-transparent hover:border-red-100"
          >
            {clearing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            {clearing ? 'Clearing...' : 'Clear All'}
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-2.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-3.5 rounded-xl border border-slate-100 animate-shimmer" style={{ height: 72 }} />
          ))}
        </div>
      ) : records.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-300">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-3">
            <Inbox className="w-7 h-7 text-slate-300" />
          </div>
          <p className="text-sm font-medium text-slate-400">No verifications yet</p>
          <p className="text-xs text-slate-400/70 mt-1">Upload a document to get started</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1 -mr-1">
          {records.map((record, idx) => (
            <button
              key={record.id}
              onClick={() => onSelect(record)}
              className="w-full text-left p-3.5 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 hover:shadow-sm transition-all duration-200 group animate-fade-in"
              style={{ animationDelay: `${idx * 0.03}s` }}
            >
              <div className="flex items-start gap-3">
                <div className={`
                  w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110
                  ${record.is_flagged ? 'bg-red-100' : 'bg-green-100'}
                `}>
                  {record.is_flagged ? (
                    <ShieldAlert className="w-4.5 h-4.5 text-red-600" />
                  ) : (
                    <ShieldCheck className="w-4.5 h-4.5 text-green-600" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-blue-700 transition-colors">
                    {record.file_name}
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs text-slate-500 font-medium">{record.document_type}</span>
                    <span className={`
                      text-xs font-semibold px-2 py-0.5 rounded-full
                      ${record.risk_score > 50 ? 'bg-red-100 text-red-700' : record.risk_score > 25 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}
                    `}>
                      {record.risk_score}% risk
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-1.5 text-xs text-slate-400">
                    <Clock className="w-3 h-3" />
                    {new Date(record.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
