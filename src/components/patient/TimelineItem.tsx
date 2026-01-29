import React, { useState } from 'react';
import { ChevronRight, Trash2, Pencil } from 'lucide-react';
import { TimelineEvent, EventType } from '../../../types';

interface TimelineItemProps {
  event: TimelineEvent;
  onClick: () => void;
  onDelete?: (eventId: string) => void;
  onEdit?: (eventId: string, newNote: string) => void;
  isConnected?: boolean; // True if this is an adjustment connected to a consultation
}

const eventConfig: Record<EventType, { color: string; bgColor: string; label: string; badgeBg: string; badgeText: string }> = {
  initial: {
    color: 'bg-green-500',
    bgColor: 'bg-green-50',
    label: 'Consulta Inicial',
    badgeBg: 'bg-green-100',
    badgeText: 'text-green-700'
  },
  followup: {
    color: 'bg-blue-500',
    bgColor: 'bg-blue-50',
    label: 'Retorno',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-700'
  },
  adjustment: {
    color: 'bg-amber-500',
    bgColor: 'bg-amber-50',
    label: 'Ajuste de Plano',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-700'
  }
};

export function TimelineItem({ event, onClick, onDelete, onEdit, isConnected }: TimelineItemProps) {
  const config = eventConfig[event.type];
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editNote, setEditNote] = useState(event.adjustmentNote || '');

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return '';
    }
  };

  const getEventSummary = () => {
    if (event.type === 'adjustment') {
      return event.adjustmentNote || 'Ajuste no plano nutricional';
    }

    const result = event.result as any;
    if (result) {
      return result.nutritionalAssessment || result.diagnosis || 'Consulta realizada';
    }
    return 'Consulta realizada';
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const confirmDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(event.id);
    setShowDeleteConfirm(false);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const saveEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (editNote.trim()) {
      onEdit?.(event.id, editNote.trim());
    }
    setIsEditing(false);
  };

  const isAdjustment = event.type === 'adjustment';

  return (
    <div className={`relative ${isConnected ? 'pb-4' : 'pb-8'} last:pb-0`}>
      {/* Vertical line connector */}
      {!isConnected && (
        <div className="absolute left-[7px] top-4 bottom-0 w-0.5 bg-slate-200" />
      )}
      {isConnected && (
        <div className="absolute left-[7px] -top-4 h-4 w-0.5 bg-amber-300" />
      )}

      {/* Dot */}
      <div
        className={`absolute left-0 ${isConnected ? 'w-3 h-3 left-[2px]' : 'w-4 h-4'} rounded-full ${config.color}
                    ring-4 ring-white shadow-sm`}
      />

      {/* Content Card */}
      <div
        onClick={isEditing ? undefined : onClick}
        className={`${isConnected ? 'ml-6' : 'ml-8'} p-4 bg-white rounded-2xl border
                   ${isConnected ? 'border-amber-200 border-l-4 border-l-amber-400' : 'border-slate-200'}
                   hover:border-slate-300 hover:shadow-md ${isEditing ? '' : 'cursor-pointer'}
                   transition-all group relative`}
      >
        {/* Edit/Delete buttons for adjustments */}
        {isAdjustment && (onDelete || onEdit) && !isEditing && (
          <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onEdit && (
              <button
                onClick={handleEdit}
                className="p-1.5 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                title="Editar"
              >
                <Pencil size={14} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={handleDelete}
                className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                title="Excluir"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-2">
          <span className="text-sm font-bold text-slate-500">
            {formatDate(event.date)}
          </span>
          <span
            className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1
                        rounded-full ${config.badgeBg} ${config.badgeText}`}
          >
            {config.label}
          </span>
        </div>

        {/* Edit mode for adjustments */}
        {isEditing ? (
          <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
            <textarea
              value={editNote}
              onChange={(e) => setEditNote(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm resize-none focus:ring-2 focus:ring-amber-100 outline-none"
              rows={3}
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={(e) => { e.stopPropagation(); setIsEditing(false); setEditNote(event.adjustmentNote || ''); }}
                className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={saveEdit}
                className="px-3 py-1.5 text-xs bg-amber-500 text-white rounded-lg hover:bg-amber-600"
              >
                Salvar
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Summary */}
            <p className="text-slate-700 font-medium line-clamp-2 pr-8">
              {getEventSummary()}
            </p>

            {/* View details link (only for consultations) */}
            {!isAdjustment && (
              <div className="flex items-center gap-1 mt-3 text-sm text-blue-600 font-bold
                              group-hover:gap-2 transition-all">
                Ver detalhes
                <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete confirmation popup */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(false); }}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Trash2 size={24} className="text-red-500" />
              </div>
              <h3 className="text-lg font-black text-slate-900">Confirmar exclusão</h3>
              <p className="text-slate-500 text-sm mt-2">
                Tem certeza que quer deletar? Não é possível recuperar depois.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(false); }}
                className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
