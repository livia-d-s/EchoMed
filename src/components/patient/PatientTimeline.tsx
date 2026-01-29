import React from 'react';
import { Clock } from 'lucide-react';
import { TimelineEvent } from '../../../types';
import { TimelineItem } from './TimelineItem';

interface PatientTimelineProps {
  events: TimelineEvent[];
  onEventClick: (event: TimelineEvent) => void;
  onDeleteEvent?: (eventId: string) => void;
  onEditEvent?: (eventId: string, newNote: string) => void;
}

interface EventGroup {
  consultation: TimelineEvent;
  adjustments: TimelineEvent[];
}

export function PatientTimeline({ events, onEventClick, onDeleteEvent, onEditEvent }: PatientTimelineProps) {
  // Sort events by date (most recent first)
  const sortedEvents = [...events].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Group adjustments with their parent consultations
  // An adjustment belongs to the most recent consultation before it
  const groupedEvents = (): (EventGroup | TimelineEvent)[] => {
    const consultations = sortedEvents.filter(e => e.type !== 'adjustment');
    const adjustments = sortedEvents.filter(e => e.type === 'adjustment');
    const groups: (EventGroup | TimelineEvent)[] = [];

    consultations.forEach((consultation, index) => {
      // Find adjustments that belong to this consultation
      // (adjustments that happened after this consultation but before the next one)
      const nextConsultation = consultations[index - 1]; // Previous in sorted order = next in time
      const relatedAdjustments = adjustments.filter(adj => {
        const adjDate = new Date(adj.date).getTime();
        const consultDate = new Date(consultation.date).getTime();
        const nextDate = nextConsultation ? new Date(nextConsultation.date).getTime() : Infinity;
        return adjDate >= consultDate && adjDate < nextDate;
      });

      if (relatedAdjustments.length > 0) {
        groups.push({
          consultation,
          adjustments: relatedAdjustments.sort((a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
          )
        });
      } else {
        groups.push(consultation);
      }
    });

    // Handle orphan adjustments (before any consultation)
    const orphanAdjustments = adjustments.filter(adj => {
      const adjDate = new Date(adj.date).getTime();
      const firstConsultation = consultations[consultations.length - 1];
      return firstConsultation && adjDate < new Date(firstConsultation.date).getTime();
    });
    orphanAdjustments.forEach(adj => groups.push(adj));

    return groups;
  };

  if (events.length === 0) {
    return (
      <div className="py-16 bg-white border-2 border-dashed border-slate-200
                      rounded-[2rem] flex flex-col items-center justify-center text-slate-400">
        <Clock size={40} className="mb-4 opacity-50" />
        <p className="font-bold text-lg">Nenhum evento registrado</p>
        <p className="text-sm mt-1">Inicie uma consulta para começar o histórico</p>
      </div>
    );
  }

  const eventGroups = groupedEvents();

  return (
    <div className="max-w-2xl">
      {/* Section Header */}
      <div className="flex items-center gap-2 mb-6">
        <div className="w-1 h-6 bg-blue-600 rounded-full" />
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">
          Linha do Tempo
        </h3>
        <span className="text-xs text-slate-400 ml-2">
          {events.length} {events.length === 1 ? 'evento' : 'eventos'}
        </span>
      </div>

      {/* Timeline */}
      <div className="relative pl-2">
        {eventGroups.map((item, index) => {
          // Check if it's a group or single event
          if ('consultation' in item) {
            // It's a group with consultation + adjustments
            return (
              <div key={item.consultation.id} className="mb-2">
                <TimelineItem
                  event={item.consultation}
                  onClick={() => onEventClick(item.consultation)}
                />
                {/* Connected adjustments */}
                <div className="ml-8 mt-2 space-y-2">
                  {item.adjustments.map((adjustment) => (
                    <TimelineItem
                      key={adjustment.id}
                      event={adjustment}
                      onClick={() => onEventClick(adjustment)}
                      onDelete={onDeleteEvent}
                      onEdit={onEditEvent}
                      isConnected
                    />
                  ))}
                </div>
              </div>
            );
          } else {
            // It's a single event
            return (
              <TimelineItem
                key={item.id}
                event={item}
                onClick={() => onEventClick(item)}
                onDelete={item.type === 'adjustment' ? onDeleteEvent : undefined}
                onEdit={item.type === 'adjustment' ? onEditEvent : undefined}
              />
            );
          }
        })}
      </div>
    </div>
  );
}
