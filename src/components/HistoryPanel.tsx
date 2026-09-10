import { useEffect, useState } from 'react';
import type { VerificationRecord } from '@/lib/types';
import { fetchVerifications, clearVerifications } from '@/lib/supabase';
import { History, ShieldCheck, ShieldAlert, FileText, Clock, Trash2, RefreshCw } from 'lucide-react';

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
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <History className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-slate-800">Verification History</h3>
        <span className="ml-auto text-xs text-slate-400">{records.length} records</span>
        {records.length > 0 && (
          <button
            onClick={handleClear}
            disabled={clearing}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-red-600 disabled:opacity-50 transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
          >
            {clearing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            {clearing ? 'Clearing...' : 'Clear All'}
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8 text-slate-400 text-sm">
          Loading history...
        </div>
      ) : records.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-slate-400">
          <FileText className="w-8 h-8 mb-2 opacity-50" />
          <p className="text-sm">No verifications yet</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
          {records.map((record) => (
            <button
              key={record.id}
              onClick={() => onSelect(record)}
              className="w-full text-left p-3 rounded-xl border border-slate-100 hover:border-blue-300 hover:bg-blue-50/30 transition-all duration-200 group"
            >
              <div className="flex items-start gap-3">
                <div className={`
                  w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0
                  ${record.is_flagged ? 'bg-red-100' : 'bg-green-100'}
                `}>
                  {record.is_flagged ? (
                    <ShieldAlert className="w-4 h-4 text-red-600" />
                  ) : (
                    <ShieldCheck className="w-4 h-4 text-green-600" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {record.file_name}
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs text-slate-500">{record.document_type}</span>
                    <span className={`
                      text-xs font-medium px-2 py-0.5 rounded-full
                      ${record.risk_score > 50 ? 'bg-red-100 text-red-700' : record.risk_score > 25 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}
                    `}>
                      {record.risk_score}% risk
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
                    <Clock className="w-3 h-3" />
                    {new Date(record.created_at).toLocaleString()}
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
