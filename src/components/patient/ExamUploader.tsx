import React, { useRef, useState } from 'react';
import { FileText, Plus, X, Loader2, AlertCircle } from 'lucide-react';
import { PatientExam } from '../../../types';
import { extractTextFromPdf, MAX_PDF_FILE_SIZE } from '../../utils/pdfExtract';

interface ExamUploaderProps {
  exams: PatientExam[];
  onChange: (exams: PatientExam[]) => void;
  compact?: boolean; // tighter spacing for use inside popups
}

const formatDate = (d: any) => {
  try {
    if (!d) return '';
    const date = typeof d === 'string' ? new Date(d) : new Date(d);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  } catch {
    return '';
  }
};

const formatFileSize = (bytes?: number) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export function ExamUploader({ exams, onChange, compact = false }: ExamUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Apenas arquivos PDF são aceitos.');
      return;
    }
    if (file.size > MAX_PDF_FILE_SIZE) {
      setError('PDF acima de 10MB. Tente um arquivo menor.');
      return;
    }

    setIsUploading(true);
    try {
      const text = await extractTextFromPdf(file);
      if (!text || text.length < 10) {
        setError('Não foi possível extrair texto do PDF. Verifique se o arquivo não é uma imagem escaneada.');
        return;
      }
      const newExam: PatientExam = {
        id: `exam_${Date.now()}`,
        fileName: file.name,
        uploadedAt: new Date().toISOString(),
        extractedText: text,
        sizeBytes: file.size,
      };
      onChange([...exams, newExam]);
    } catch (err) {
      console.error('PDF extraction error:', err);
      setError('Erro ao processar o PDF. Tente outro arquivo.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const removeExam = (examId: string) => {
    onChange(exams.filter(e => e.id !== examId));
  };

  return (
    <div className={compact ? '' : ''}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Exames laboratoriais {exams.length > 0 && <span className="text-slate-400 normal-case">({exams.length})</span>}
        </span>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
        >
          {isUploading ? (
            <>
              <Loader2 size={11} className="animate-spin" /> Processando
            </>
          ) : (
            <>
              <Plus size={11} /> Anexar PDF
            </>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,.pdf"
          onChange={handleInputChange}
          className="hidden"
        />
      </div>

      {error && (
        <div className="mb-2 flex items-start gap-2 p-2 bg-red-50 border border-red-100 rounded-lg text-xs text-red-700">
          <AlertCircle size={11} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {exams.length === 0 ? (
        <p className="text-xs text-slate-400">
          Nenhum exame. A IA considerará os PDFs anexados durante a análise.
        </p>
      ) : (
        <div className="space-y-1.5">
          {exams.map((exam) => (
            <div
              key={exam.id}
              className="flex items-center gap-2.5 p-2 bg-slate-50 rounded-lg border border-slate-100 group"
            >
              <FileText size={13} className="text-blue-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-700 truncate">{exam.fileName}</p>
                <p className="text-[10px] text-slate-400">
                  {formatDate(exam.uploadedAt)}
                  {exam.sizeBytes ? ` • ${formatFileSize(exam.sizeBytes)}` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeExam(exam.id)}
                className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                title="Remover"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
