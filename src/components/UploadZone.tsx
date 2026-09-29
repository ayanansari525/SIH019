import { useRef, useState, useCallback } from 'react';
import { Upload, FileText, X, ImageIcon } from 'lucide-react';

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

const ACCEPTED_TYPES = ['.pdf', '.png', '.jpg', '.jpeg'];
const ACCEPTED_MIME = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];

export function UploadZone({ onFileSelect, disabled }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const validateFile = (file: File): boolean => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ACCEPTED_TYPES.includes(ext) && !ACCEPTED_MIME.includes(file.type)) {
      setError('Please upload a PDF, PNG, or JPG file.');
      return false;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError('File size must be under 20MB.');
      return false;
    }
    setError(null);
    return true;
  };

  const handleFile = useCallback((file: File) => {
    if (validateFile(file)) {
      setSelectedFile(file);
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [disabled, handleFile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const clearFile = () => {
    setSelectedFile(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="w-full">
      <div
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-2xl p-8 sm:p-14 text-center cursor-pointer
          transition-all duration-300 overflow-hidden
          ${dragOver
            ? 'border-blue-500 bg-blue-50/80 scale-[1.01] shadow-lg shadow-blue-500/10'
            : 'border-slate-300 bg-slate-50/30 hover:border-blue-400 hover:bg-blue-50/20'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
        />

        {/* Animated background glow on drag */}
        {dragOver && (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-100/30 to-cyan-100/20 animate-pulse-ring" />
        )}

        {selectedFile ? (
          <div className="relative flex items-center justify-center gap-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-4 bg-white rounded-2xl px-5 py-4 shadow-md border border-slate-200 animate-scale-in">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-slate-800">{selectedFile.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{(selectedFile.size / 1024).toFixed(1)} KB</p>
              </div>
              {!disabled && (
                <button
                  onClick={clearFile}
                  className="ml-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors group"
                >
                  <X className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="relative flex flex-col items-center gap-4">
            <div className={`
              relative w-20 h-20 rounded-3xl flex items-center justify-center
              bg-gradient-to-br from-blue-100 to-cyan-100
              transition-transform duration-300 ${dragOver ? 'scale-110' : ''}
            `}>
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-200/50 to-cyan-200/50 blur-md" />
              <Upload className="relative w-8 h-8 text-blue-600" />
            </div>
            <div>
              <p className="text-base font-semibold text-slate-700">
                Drop your document here, or <span className="text-blue-600">browse</span>
              </p>
              <p className="text-sm text-slate-400 mt-1.5">
                Supports PDF, PNG, JPG, JPEG — up to 20MB
              </p>
            </div>
            {/* Format pills */}
            <div className="flex items-center gap-2 mt-2">
              {['PDF', 'PNG', 'JPG'].map((fmt) => (
                <span key={fmt} className="flex items-center gap-1 text-xs font-medium text-slate-500 bg-white px-2.5 py-1 rounded-full border border-slate-200">
                  <ImageIcon className="w-3 h-3 text-slate-400" />
                  {fmt}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-600 font-medium animate-fade-in">{error}</p>
      )}
    </div>
  );
}
