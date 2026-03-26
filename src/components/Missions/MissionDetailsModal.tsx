import { useState, useEffect } from 'react';
import { X, Navigation, MapPin, Calendar, User, Car, Clock, Package, FileText, Phone, Mail, Building, Activity, Pause, Play, Fuel, Gauge, StopCircle } from 'lucide-react';
import type { Mission } from '@/types';
import { tripsApi, type TripStop } from '@/api/trips';

interface MissionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  mission: Mission | null;
  statusConfig: any;
  priorityConfig: any;
}

function formatDuration(startTime: string, pauseMinutes: number = 0): string {
  const start = new Date(startTime);
  const now = new Date();
  const totalSec = Math.max(0, Math.floor((now.getTime() - start.getTime()) / 1000) - pauseMinutes * 60);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export default function MissionDetailsModal({ isOpen, onClose, mission, statusConfig, priorityConfig }: MissionDetailsModalProps) {
  const [, setTick] = useState(0);
  const [stopHistory, setStopHistory] = useState<TripStop[]>([]);

  // Live timer for in_progress missions
  useEffect(() => {
    if (!isOpen || mission?.status !== 'in_progress') return;
    const timer = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(timer);
  }, [isOpen, mission?.status]);

  // Load stop history when trip is available
  useEffect(() => {
    if (!isOpen || !mission?.active_trip?.id) {
      setStopHistory([]);
      return;
    }
    tripsApi.getStops(mission.active_trip.id).then(data => {
      setStopHistory(data.stops);
    }).catch(() => {});
  }, [isOpen, mission?.active_trip?.id]);

  if (!isOpen || !mission) return null;

  const status = statusConfig[mission.status];
  const priority = priorityConfig[mission.priority];
  const isInProgress = mission.status === 'in_progress';
  const trip = mission.active_trip;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header with gradient background */}
        <div className="h-48 relative overflow-hidden" style={{ backgroundColor: status?.bg || '#E8ECEC' }}>
          <div className="absolute inset-0 flex items-center justify-center">
            <Navigation className="w-32 h-32 opacity-20" style={{ color: status?.dot || '#6B7280' }} />
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 rounded-xl flex items-center justify-center bg-white/90 hover:bg-white transition-all shadow-lg"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
          <div className="absolute bottom-6 left-6">
            <h2 className="text-3xl font-bold text-white mb-2" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
              {mission.title}
            </h2>
            <p className="text-white/90 text-lg font-medium" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
              {mission.mission_code}
            </p>
          </div>
          <div className="absolute top-4 left-4 flex gap-2">
            <div
              className="px-4 py-2 rounded-full text-sm font-semibold flex items-center space-x-2 shadow-lg"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', color: status?.text || '#6B7280' }}
            >
              <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: status?.dot || '#6B7280' }} />
              <span>{status?.label || mission.status}</span>
            </div>
            <div
              className="px-4 py-2 rounded-full text-sm font-semibold shadow-lg"
              style={{ backgroundColor: priority?.bg || '#E8ECEC', color: priority?.text || '#6B7280' }}
            >
              {priority?.label || mission.priority}
            </div>
          </div>
        </div>

        {/* Details Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-8">
          {/* Live Trip Banner (in_progress only) */}
          {isInProgress && trip && (
            <div className="mb-8">
              <div className="relative overflow-hidden rounded-xl border-2" style={{ borderColor: '#B87333' }}>
                {/* Animated top bar */}
                <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #B87333, #D4956B, #B87333)' }} />
                <div className="p-6" style={{ backgroundColor: 'rgba(245, 232, 221, 0.4)' }}>
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#B87333' }}>
                        <Activity className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold" style={{ color: '#191919' }}>Mission en cours</h3>
                        <p className="text-xs text-gray-500">Démarrée à {formatTime(trip.start_time)}</p>
                      </div>
                    </div>
                    <div
                      className="px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5"
                      style={{
                        backgroundColor: trip.status === 'paused' ? '#FEF3C7' : '#D1FAE5',
                        color: trip.status === 'paused' ? '#D97706' : '#059669',
                      }}
                    >
                      {trip.status === 'paused' ? (
                        <><Pause className="w-3 h-3" /> En pause</>
                      ) : (
                        <><Play className="w-3 h-3" /> Active</>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                      <Clock className="w-5 h-5 mx-auto mb-1" style={{ color: '#B87333' }} />
                      <p className="text-lg font-bold" style={{ color: '#191919' }}>
                        {formatDuration(trip.start_time, trip.pause_duration_minutes)}
                      </p>
                      <p className="text-[10px] text-gray-500 uppercase font-semibold">Durée active</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                      <Gauge className="w-5 h-5 mx-auto mb-1" style={{ color: '#6A8A82' }} />
                      <p className="text-lg font-bold" style={{ color: '#191919' }}>
                        {trip.start_mileage ? `${Number(trip.start_mileage).toLocaleString('fr-FR')}` : '-'}
                      </p>
                      <p className="text-[10px] text-gray-500 uppercase font-semibold">Km départ</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                      <Fuel className="w-5 h-5 mx-auto mb-1" style={{ color: '#2563EB' }} />
                      <p className="text-lg font-bold" style={{ color: '#191919' }}>
                        {trip.start_fuel_level ? `${Number(trip.start_fuel_level)}%` : '-'}
                      </p>
                      <p className="text-[10px] text-gray-500 uppercase font-semibold">Carburant départ</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                      <Pause className="w-5 h-5 mx-auto mb-1" style={{ color: '#D97706' }} />
                      <p className="text-lg font-bold" style={{ color: '#191919' }}>
                        {trip.pause_duration_minutes > 0 ? `${trip.pause_duration_minutes} min` : '0 min'}
                      </p>
                      <p className="text-[10px] text-gray-500 uppercase font-semibold">Temps de pause</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Itinéraire */}
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: '#191919' }}>
              <MapPin className="w-6 h-6" style={{ color: '#6A8A82' }} />
              Itinéraire
            </h3>
            <div className="bg-gradient-to-br from-sage/5 to-transparent rounded-xl p-6 border-2" style={{ borderColor: '#E8EFED' }}>
              <div className="flex items-start space-x-4 mb-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm" style={{ backgroundColor: '#6A8A82' }}>
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">Point de départ (Origine)</p>
                  <p className="text-lg font-bold" style={{ color: '#191919' }}>{mission.origin_address}</p>
                  {mission.origin_latitude && mission.origin_longitude && (
                    <p className="text-xs text-gray-500 mt-1">
                      GPS: {Number(mission.origin_latitude).toFixed(6)}, {Number(mission.origin_longitude).toFixed(6)}
                    </p>
                  )}
                </div>
              </div>
              <div className="h-8 border-l-2 border-dashed ml-5" style={{ borderColor: '#6A8A82' }} />

              {/* Checkpoints intermédiaires */}
              {mission.checkpoints && mission.checkpoints.length > 0 && mission.checkpoints.map((checkpoint, index) => (
                <div key={checkpoint.id || index}>
                  <div className="flex items-start space-x-4 mb-4">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm" style={{ backgroundColor: '#D4956B' }}>
                      <span className="text-white font-bold text-sm">{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600 mb-1">Point de livraison {index + 1}</p>
                      <p className="text-lg font-bold" style={{ color: '#191919' }}>{checkpoint.address}</p>
                      {checkpoint.notes && (
                        <p className="text-sm text-gray-500 mt-1">{checkpoint.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="h-8 border-l-2 border-dashed ml-5" style={{ borderColor: '#D4956B' }} />
                </div>
              ))}

              <div className="flex items-start space-x-4 mb-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm" style={{ backgroundColor: '#B87333' }}>
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">Point d'arrivée (Destination)</p>
                  <p className="text-lg font-bold" style={{ color: '#191919' }}>{mission.destination_address}</p>
                  {mission.destination_latitude && mission.destination_longitude && (
                    <p className="text-xs text-gray-500 mt-1">
                      GPS: {Number(mission.destination_latitude).toFixed(6)}, {Number(mission.destination_longitude).toFixed(6)}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg mt-4" style={{ backgroundColor: '#F0F3F2' }}>
                <Navigation className="w-5 h-5" style={{ color: '#B87333' }} />
                <span className="text-sm font-medium text-gray-600">Distance estimée:</span>
                <span className="text-sm font-bold" style={{ color: '#191919' }}>{mission.estimated_distance} km</span>
              </div>
            </div>
          </div>

          {/* Horaires */}
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: '#191919' }}>
              <Clock className="w-6 h-6" style={{ color: '#6A8A82' }} />
              {mission.status === 'completed' ? 'Durée de la mission' : 'Horaires prévus'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Début */}
              <div className="bg-gradient-to-br from-sage/5 to-transparent rounded-xl p-5 border-2" style={{ borderColor: '#E8EFED' }}>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center shadow-sm" style={{ backgroundColor: '#6A8A82' }}>
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                      {mission.status === 'completed' ? 'Début' : 'Début prévu'}
                    </p>
                    <p className="text-base font-bold" style={{ color: '#191919' }}>
                      {new Date(mission.status === 'completed' && mission.actual_start ? mission.actual_start : mission.scheduled_start).toLocaleString('fr-FR', {
                        weekday: 'long',
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                    <p className="text-lg font-bold" style={{ color: '#6A8A82' }}>
                      {new Date(mission.status === 'completed' && mission.actual_start ? mission.actual_start : mission.scheduled_start).toLocaleString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Fin */}
              <div className="bg-gradient-to-br from-copper/5 to-transparent rounded-xl p-5 border-2" style={{ borderColor: '#F5E8DD' }}>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center shadow-sm" style={{ backgroundColor: '#B87333' }}>
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                      {mission.status === 'completed' ? 'Fin' : 'Fin prévue'}
                    </p>
                    <p className="text-base font-bold" style={{ color: '#191919' }}>
                      {new Date(mission.status === 'completed' && mission.actual_end ? mission.actual_end : mission.scheduled_end).toLocaleString('fr-FR', {
                        weekday: 'long',
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                    <p className="text-lg font-bold" style={{ color: '#B87333' }}>
                      {new Date(mission.status === 'completed' && mission.actual_end ? mission.actual_end : mission.scheduled_end).toLocaleString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Durée totale pour missions terminées */}
            {mission.status === 'completed' && mission.actual_start && mission.actual_end && (
              <div className="mt-4 flex items-center gap-2 p-3 rounded-lg" style={{ backgroundColor: '#D1FAE5' }}>
                <Clock className="w-5 h-5" style={{ color: '#059669' }} />
                <span className="text-sm font-medium" style={{ color: '#059669' }}>Durée totale :</span>
                <span className="text-sm font-bold" style={{ color: '#059669' }}>
                  {(() => {
                    const totalMin = Math.floor((new Date(mission.actual_end).getTime() - new Date(mission.actual_start).getTime()) / 60000);
                    const h = Math.floor(totalMin / 60);
                    const m = totalMin % 60;
                    return h > 0 ? `${h}h ${m}min` : `${m} min`;
                  })()}
                </span>
              </div>
            )}
          </div>

          {/* Assignation */}
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: '#191919' }}>
              <User className="w-6 h-6" style={{ color: '#6A8A82' }} />
              Assignation
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Chauffeur */}
              <div className="bg-gradient-to-br from-sage/5 to-transparent rounded-xl p-5 border-2" style={{ borderColor: '#E8EFED' }}>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center shadow-sm" style={{ backgroundColor: '#6A8A82' }}>
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Chauffeur</p>
                    <p className="text-lg font-bold" style={{ color: '#191919' }}>
                      {(mission as any).driver?.full_name || mission.driver_name || 'Non assigné'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Véhicule */}
              <div className="bg-gradient-to-br from-copper/5 to-transparent rounded-xl p-5 border-2" style={{ borderColor: '#F5E8DD' }}>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center shadow-sm" style={{ backgroundColor: '#B87333' }}>
                    <Car className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Véhicule</p>
                    <p className="text-lg font-bold" style={{ color: '#191919' }}>
                      {(mission as any).vehicle?.brand && (mission as any).vehicle?.model
                        ? `${(mission as any).vehicle.brand} ${(mission as any).vehicle.model}`
                        : mission.vehicle_plate || 'Non assigné'}
                    </p>
                    {(mission as any).vehicle?.license_plate && (
                      <p className="text-sm text-gray-500 font-mono">{(mission as any).vehicle.license_plate}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Informations Livraison */}
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: '#191919' }}>
              <Package className="w-6 h-6" style={{ color: '#6A8A82' }} />
              Informations de Livraison
            </h3>
            <div className="bg-gradient-to-br from-sage/5 to-transparent rounded-xl p-6 border-2" style={{ borderColor: '#E8EFED' }}>
              {/* Description de la mission */}
              {mission.description && (
                <div className="mb-6">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#6A8A82' }}>
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Description</p>
                      <p className="text-sm" style={{ color: '#191919' }}>{mission.description}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Infos complémentaires en grille */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Type de mission */}
                <div className="flex items-center space-x-3 p-3 rounded-lg" style={{ backgroundColor: '#F0F3F2' }}>
                  <Package className="w-5 h-5" style={{ color: '#6A8A82' }} />
                  <div>
                    <p className="text-xs text-gray-600">Statut actuel</p>
                    <p className="text-sm font-semibold" style={{ color: status?.text || '#191919' }}>
                      {status?.label || mission.status}
                    </p>
                  </div>
                </div>

                {/* Priorité détaillée */}
                <div className="flex items-center space-x-3 p-3 rounded-lg" style={{ backgroundColor: '#F0F3F2' }}>
                  <div
                    className="w-5 h-5 rounded-full"
                    style={{ backgroundColor: priority?.dot || '#6B7280' }}
                  />
                  <div>
                    <p className="text-xs text-gray-600">Niveau de priorité</p>
                    <p className="text-sm font-semibold" style={{ color: priority?.text || '#191919' }}>
                      {priority?.label || mission.priority}
                    </p>
                  </div>
                </div>
              </div>

              {/* Notes additionnelles */}
              {mission.notes && (
                <div className="mt-4 p-4 rounded-lg border-2 border-dashed" style={{ borderColor: '#E8ECEC' }}>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Notes additionnelles</p>
                  <p className="text-sm text-gray-600">{mission.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Contact Responsable */}
          {(mission.responsible_person_name || mission.responsible_person_phone) && (
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: '#191919' }}>
                <Phone className="w-6 h-6" style={{ color: '#6A8A82' }} />
                Contact Responsable
              </h3>
              <div className="bg-gradient-to-br from-sage/5 to-transparent rounded-xl p-6 border-2" style={{ borderColor: '#E8EFED' }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mission.responsible_person_name && (
                    <div className="flex items-center space-x-3 p-3 rounded-lg" style={{ backgroundColor: '#F0F3F2' }}>
                      <User className="w-5 h-5" style={{ color: '#6A8A82' }} />
                      <div>
                        <p className="text-xs text-gray-600">Nom du responsable</p>
                        <p className="text-sm font-semibold" style={{ color: '#191919' }}>{mission.responsible_person_name}</p>
                      </div>
                    </div>
                  )}
                  {mission.responsible_person_phone && (
                    <div className="flex items-center space-x-3 p-3 rounded-lg" style={{ backgroundColor: '#F0F3F2' }}>
                      <Phone className="w-5 h-5" style={{ color: '#B87333' }} />
                      <div>
                        <p className="text-xs text-gray-600">Téléphone</p>
                        <p className="text-sm font-semibold" style={{ color: '#191919' }}>{mission.responsible_person_phone}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Arrêts signalés */}
          {stopHistory.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: '#191919' }}>
                <StopCircle className="w-6 h-6 text-red-500" />
                Arrêts signalés ({stopHistory.length})
              </h3>
              <div className="bg-gradient-to-br from-red-50/50 to-transparent rounded-xl p-6 border-2 border-red-100">
                <div className="space-y-3">
                  {stopHistory.map((stop) => (
                    <div
                      key={stop.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-white border border-red-100"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">
                          {stop.reason === 'delivery' && '📦'}
                          {stop.reason === 'client' && '👤'}
                          {stop.reason === 'mechanical' && '⚠️'}
                          {stop.reason === 'checkpoint' && '🛡️'}
                          {stop.reason === 'other' && '📋'}
                        </span>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: '#191919' }}>
                            {stop.reason_display}
                          </p>
                          {stop.notes && (
                            <p className="text-xs text-gray-500 italic mt-0.5">{stop.notes}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-0.5">
                            {new Date(stop.stopped_at).toLocaleString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold" style={{ color: '#B87333' }}>
                          {stop.duration_seconds >= 60
                            ? `${Math.floor(stop.duration_seconds / 60)} min`
                            : `${stop.duration_seconds} s`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Résumé rapide */}
          <div className="bg-gradient-to-r from-sage/10 to-copper/10 rounded-xl p-6 border-2" style={{ borderColor: '#E8EFED' }}>
            <h4 className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-4">Résumé de la mission</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold" style={{ color: '#B87333' }}>
                  {isInProgress && trip
                    ? formatDuration(trip.start_time, trip.pause_duration_minutes)
                    : (() => {
                        const totalSec = Math.max(0, Math.round((new Date(mission.scheduled_end).getTime() - new Date(mission.scheduled_start).getTime()) / 1000));
                        const h = Math.floor(totalSec / 3600);
                        const m = Math.floor((totalSec % 3600) / 60);
                        const s = totalSec % 60;
                        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
                      })()
                  }
                </p>
                <p className="text-xs text-gray-600">{isInProgress ? 'écoulées' : 'prévues'}</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold" style={{ color: '#6A8A82' }}>{(mission.checkpoints?.length || 0) + 2}</p>
                <p className="text-xs text-gray-600">points de passage</p>
              </div>
              <div className="text-center">
                <div
                  className="w-8 h-8 rounded-full mx-auto mb-1 flex items-center justify-center"
                  style={{ backgroundColor: status?.bg || '#E8ECEC' }}
                >
                  <div
                    className={`w-3 h-3 rounded-full ${isInProgress ? 'animate-pulse' : ''}`}
                    style={{ backgroundColor: status?.dot || '#6B7280' }}
                  />
                </div>
                <p className="text-xs text-gray-600">{status?.label || mission.status}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t-2 bg-gray-50 flex justify-between items-center" style={{ borderColor: '#E8ECEC' }}>
          <div className="text-sm text-gray-500">
            <p>Code: <span className="font-semibold">{mission.mission_code}</span></p>
            {mission.created_at && (
              <p className="text-xs mt-1">
                Créée le {new Date(mission.created_at).toLocaleString('fr-FR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl font-semibold transition-all hover:shadow-md"
            style={{ backgroundColor: '#6A8A82', color: '#ffffff' }}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
