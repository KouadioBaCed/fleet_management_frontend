import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Wrench, Car, Calendar, Clock, DollarSign, MapPin, X } from 'lucide-react';
import type { CalendarEvent } from '@/api/maintenance';

interface MaintenanceCalendarProps {
  events: CalendarEvent[];
  isLoading: boolean;
  onMonthChange: (startDate: string, endDate: string) => void;
  onEventClick: (event: CalendarEvent) => void;
}

const DAYS_OF_WEEK = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export default function MaintenanceCalendar({ events, isLoading, onMonthChange, onEventClick }: MaintenanceCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
    scheduled: { bg: '#E8EFED', text: '#6A8A82', dot: '#6A8A82' },
    in_progress: { bg: '#F5E8DD', text: '#B87333', dot: '#B87333' },
    completed: { bg: '#DBEAFE', text: '#1E40AF', dot: '#1E40AF' },
    cancelled: { bg: '#FEE2E2', text: '#DC2626', dot: '#DC2626' },
  };

  const typeConfig: Record<string, { color: string; label: string }> = {
    oil_change: { color: '#6A8A82', label: 'Vidange' },
    tire_change: { color: '#B87333', label: 'Pneus' },
    brake_service: { color: '#DC2626', label: 'Freins' },
    inspection: { color: '#7C3AED', label: 'Contrôle' },
    repair: { color: '#EA580C', label: 'Réparation' },
    preventive: { color: '#059669', label: 'Préventive' },
    other: { color: '#6B7280', label: 'Autre' },
  };

  // Calculate calendar grid
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Adjust for Monday start (0 = Monday, 6 = Sunday)
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek < 0) startDayOfWeek = 6;

    const daysInMonth = lastDay.getDate();
    const days: { date: Date; isCurrentMonth: boolean; events: CalendarEvent[] }[] = [];

    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false,
        events: [],
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const dateStr = date.toISOString().split('T')[0];
      const dayEvents = events.filter(e => e.date === dateStr);
      days.push({
        date,
        isCurrentMonth: true,
        events: dayEvents,
      });
    }

    // Next month days
    const remainingDays = 42 - days.length; // 6 rows * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
        events: [],
      });
    }

    return days;
  }, [currentDate, events]);

  // Notify parent of month change
  useEffect(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const startDate = new Date(year, month, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];
    onMonthChange(startDate, endDate);
  }, [currentDate]);

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEvent(event);
  };

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border-2 overflow-hidden" style={{ borderColor: '#E8ECEC' }}>
      {/* Calendar Header */}
      <div className="px-3 sm:px-6 py-3 sm:py-4 border-b-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0" style={{ borderColor: '#E8ECEC' }}>
        <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={goToPreviousMonth}
              className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            </button>
            <button
              onClick={goToNextMonth}
              className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            </button>
          </div>
          <h2 className="text-base sm:text-xl font-bold" style={{ color: '#191919' }}>
            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <button
            onClick={goToToday}
            className="sm:hidden px-2 py-1 rounded-lg font-medium text-xs transition-all hover:shadow-md"
            style={{ backgroundColor: '#E8EFED', color: '#6A8A82' }}
          >
            Auj.
          </button>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={goToToday}
            className="hidden sm:block px-4 py-2 rounded-lg font-medium text-sm transition-all hover:shadow-md flex-shrink-0"
            style={{ backgroundColor: '#E8EFED', color: '#6A8A82' }}
          >
            Aujourd'hui
          </button>

          {/* Legend */}
          <div className="flex items-center space-x-2 sm:space-x-3 sm:ml-4 sm:pl-4 sm:border-l-2" style={{ borderColor: '#E8ECEC' }}>
            {Object.entries(statusConfig).slice(0, 3).map(([key, config]) => (
              <div key={key} className="flex items-center space-x-1 sm:space-x-1.5 flex-shrink-0">
                <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full" style={{ backgroundColor: config.dot }} />
                <span className="text-[10px] sm:text-xs text-gray-600 capitalize whitespace-nowrap">
                  {key === 'scheduled' ? 'Planifié' : key === 'in_progress' ? 'En cours' : 'Terminé'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Days of Week Header */}
      <div className="grid grid-cols-7 border-b-2" style={{ borderColor: '#E8ECEC' }}>
        {DAYS_OF_WEEK.map((day) => (
          <div
            key={day}
            className="py-2 sm:py-3 text-center text-xs sm:text-sm font-semibold text-gray-600"
            style={{ backgroundColor: '#F8FAF9' }}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {calendarDays.map((day, index) => {
          const isCurrentDay = isToday(day.date);
          const hasEvents = day.events.length > 0;

          return (
            <div
              key={index}
              className={`min-h-[80px] sm:min-h-[120px] border-b border-r p-1 sm:p-2 transition-colors ${
                day.isCurrentMonth ? 'bg-white' : 'bg-gray-50'
              } ${hasEvents ? 'hover:bg-gray-50' : ''}`}
              style={{ borderColor: '#E8ECEC' }}
            >
              {/* Day Number */}
              <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                <span
                  className={`w-5 h-5 sm:w-7 sm:h-7 flex items-center justify-center rounded-full text-[10px] sm:text-sm font-semibold ${
                    isCurrentDay
                      ? 'bg-sage text-white'
                      : day.isCurrentMonth
                      ? 'text-gray-900'
                      : 'text-gray-400'
                  }`}
                  style={isCurrentDay ? { backgroundColor: '#6A8A82' } : {}}
                >
                  {day.date.getDate()}
                </span>
                {hasEvents && (
                  <span
                    className="text-[8px] sm:text-xs font-bold px-1 sm:px-1.5 py-0.5 rounded-full"
                    style={{ backgroundColor: '#E8EFED', color: '#6A8A82' }}
                  >
                    {day.events.length}
                  </span>
                )}
              </div>

              {/* Events */}
              <div className="space-y-0.5 sm:space-y-1">
                {day.events.slice(0, window.innerWidth < 640 ? 2 : 3).map((event) => {
                  const status = statusConfig[event.status] || statusConfig.scheduled;
                  const type = typeConfig[event.maintenance_type] || typeConfig.other;

                  return (
                    <button
                      key={event.id}
                      onClick={(e) => handleEventClick(event, e)}
                      className="w-full text-left px-1 sm:px-2 py-0.5 sm:py-1 rounded text-[8px] sm:text-xs font-medium truncate transition-all hover:shadow-md"
                      style={{
                        backgroundColor: status.bg,
                        color: status.text,
                        borderLeft: `2px solid ${type.color}`,
                      }}
                    >
                      <span className="hidden sm:inline">{event.vehicle_plate}</span>
                      <span className="sm:hidden">{event.vehicle_plate.slice(0, 6)}</span>
                    </button>
                  );
                })}
                {day.events.length > (window.innerWidth < 640 ? 2 : 3) && (
                  <span className="text-[8px] sm:text-xs text-gray-500 pl-1 sm:pl-2">
                    +{day.events.length - (window.innerWidth < 640 ? 2 : 3)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-sage border-t-transparent rounded-full animate-spin" style={{ borderColor: '#6A8A82', borderTopColor: 'transparent' }} />
        </div>
      )}

      {/* Event Detail Popup */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedEvent(null)}
          />
          <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md max-h-[85vh] sm:max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div
              className="h-2"
              style={{ backgroundColor: statusConfig[selectedEvent.status]?.dot || '#6A8A82' }}
            />
            <div className="p-4 sm:p-5">
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: statusConfig[selectedEvent.status]?.bg || '#E8EFED' }}
                  >
                    <Wrench
                      className="w-5 h-5 sm:w-6 sm:h-6"
                      style={{ color: statusConfig[selectedEvent.status]?.dot || '#6A8A82' }}
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-base sm:text-lg truncate" style={{ color: '#191919' }}>
                      {selectedEvent.maintenance_type_display}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600">{selectedEvent.status_display}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                </button>
              </div>

              {/* Details */}
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center space-x-2 sm:space-x-3 p-2.5 sm:p-3 rounded-xl" style={{ backgroundColor: '#F8FAF9' }}>
                  <Car className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" style={{ color: '#6A8A82' }} />
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs text-gray-500">Véhicule</p>
                    <p className="font-semibold text-sm sm:text-base truncate">{selectedEvent.vehicle_plate} - {selectedEvent.vehicle_brand} {selectedEvent.vehicle_model}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 sm:space-x-3 p-2.5 sm:p-3 rounded-xl" style={{ backgroundColor: '#F8FAF9' }}>
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" style={{ color: '#B87333' }} />
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs text-gray-500">Date prévue</p>
                    <p className="font-semibold text-sm sm:text-base">
                      {new Date(selectedEvent.date).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 sm:space-x-3 p-2.5 sm:p-3 rounded-xl" style={{ backgroundColor: '#F8FAF9' }}>
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" style={{ color: '#6A8A82' }} />
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs text-gray-500">Prestataire</p>
                    <p className="font-semibold text-sm sm:text-base truncate">{selectedEvent.service_provider || 'Non spécifié'}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 sm:space-x-3 p-2.5 sm:p-3 rounded-xl" style={{ backgroundColor: '#F8FAF9' }}>
                  <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" style={{ color: '#B87333' }} />
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs text-gray-500">Coût estimé</p>
                    <p className="font-semibold text-sm sm:text-base" style={{ color: '#B87333' }}>
                      {selectedEvent.total_cost.toFixed(2)} FCFA
                    </p>
                  </div>
                </div>

                {selectedEvent.description && (
                  <div className="p-2.5 sm:p-3 rounded-xl" style={{ backgroundColor: '#F8FAF9' }}>
                    <p className="text-[10px] sm:text-xs text-gray-500 mb-1">Description</p>
                    <p className="text-xs sm:text-sm text-gray-700">{selectedEvent.description}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2 sm:space-x-3 mt-4 sm:mt-5">
                <button
                  onClick={() => {
                    onEventClick(selectedEvent);
                    setSelectedEvent(null);
                  }}
                  className="flex-1 py-2 sm:py-2.5 rounded-xl font-semibold text-sm sm:text-base text-white transition-all hover:shadow-lg"
                  style={{ backgroundColor: '#6A8A82' }}
                >
                  Voir détails
                </button>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl font-semibold text-sm sm:text-base transition-all"
                  style={{ backgroundColor: '#E8ECEC', color: '#6B7280' }}
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
