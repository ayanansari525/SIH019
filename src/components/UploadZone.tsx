import { useRef, useState, useCallback } from 'react';
import { Upload, FileText, X } from 'lucide-react';

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
          relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer
          transition-all duration-300
          ${dragOver
            ? 'border-blue-500 bg-blue-50 scale-[1.01]'
            : 'border-slate-300 bg-slate-50/50 hover:border-blue-400 hover:bg-blue-50/30'
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

        {selectedFile ? (
          <div className="flex items-center justify-center gap-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-sm border border-slate-200">
              <FileText className="w-6 h-6 text-blue-600" />
              <div className="text-left">
                <p className="text-sm font-medium text-slate-800">{selectedFile.name}</p>
                <p className="text-xs text-slate-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
              </div>
              {!disabled && (
                <button onClick={clearFile} className="ml-2 p-1 rounded-lg hover:bg-slate-100 transition-colors">
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className={`
              w-16 h-16 rounded-2xl flex items-center justify-center
              bg-gradient-to-br from-blue-100 to-cyan-100
              transition-transform duration-300 ${dragOver ? 'scale-110' : ''}
            `}>
              <Upload className="w-7 h-7 text-blue-600" />
            </div>
            <div>
              <p className="text-base font-semibold text-slate-700">
                Drop your document here, or click to browse
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Supports PDF, PNG, JPG, JPEG — up to 20MB
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-600 font-medium">{error}</p>
      )}
    </div>
  );
}
