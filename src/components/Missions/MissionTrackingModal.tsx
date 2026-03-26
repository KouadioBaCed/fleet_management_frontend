import { useState, useEffect, useCallback } from 'react';
import {
  X,
  MapPin,
  Navigation,
  Clock,
  AlertTriangle,
  CheckCircle,
  Loader2,
  RefreshCw,
  User,
  Car,
  Gauge,
  Battery,
  Bell,
  BellOff,
  ArrowRight,
  Timer,
  AlertCircle,
  Compass,
  Radio,
} from 'lucide-react';
import { missionsApi, type MissionTrackingData, type MissionAlert } from '@/api/missions';
import type { Mission } from '@/types';

interface MissionTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  mission: Mission | null;
}

const REFRESH_INTERVAL = 10000; // 10 seconds

const SEVERITY_CONFIG = {
  none: { color: '#6A8A82', bgColor: '#E8EFED', label: 'Normal' },
  info: { color: '#3B82F6', bgColor: '#DBEAFE', label: 'Information' },
  warning: { color: '#B87333', bgColor: '#F5E8DD', label: 'Avertissement' },
  critical: { color: '#DC2626', bgColor: '#FEE2E2', label: 'Critique' },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  low: { label: 'Faible', color: '#6B7280', bgColor: '#E8ECEC' },
  medium: { label: 'Moyenne', color: '#6A8A82', bgColor: '#E8EFED' },
  high: { label: 'Haute', color: '#B87333', bgColor: '#F5E8DD' },
  urgent: { label: 'Urgente', color: '#DC2626', bgColor: '#FEE2E2' },
};

export default function MissionTrackingModal({ isOpen, onClose, mission }: MissionTrackingModalProps) {
  const [trackingData, setTrackingData] = useState<MissionTrackingData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);

  const fetchTrackingData = useCallback(async () => {
    if (!mission) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await missionsApi.getTracking(mission.id);
      setTrackingData(data);
      setLastRefresh(new Date());
    } catch (err: any) {
      console.error('Failed to fetch tracking data:', err);
      setError(err.response?.data?.error || 'Erreur lors du chargement des données');
    } finally {
      setIsLoading(false);
    }
  }, [mission]);

  // Initial fetch and auto-refresh
  useEffect(() => {
    if (isOpen && mission) {
      fetchTrackingData();

      if (isAutoRefresh) {
        const interval = setInterval(fetchTrackingData, REFRESH_INTERVAL);
        return () => clearInterval(interval);
      }
    }
  }, [isOpen, mission, isAutoRefresh, fetchTrackingData]);

  const handleAcknowledgeAlert = async (alertId: number) => {
    if (!mission) return;

    try {
      await missionsApi.acknowledgeAlert(mission.id, alertId);
      // Refresh data to update alerts list
      fetchTrackingData();
    } catch (err: any) {
      console.error('Failed to acknowledge alert:', err);
    }
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTimeAgo = (dateStr: string | null) => {
    if (!dateStr) return 'Jamais';
    const diff = Date.now() - new Date(dateStr).getTime();
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h`;
  };

  if (!isOpen) return null;

  const delaySeverity = trackingData?.delay_status.severity || 'none';
  const severityConfig = SEVERITY_CONFIG[delaySeverity];
  const priority = PRIORITY_CONFIG[trackingData?.mission.priority || 'medium'];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2" style={{ borderColor: '#E8ECEC' }}>
          <div className="flex items-center space-x-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center relative"
              style={{ backgroundColor: severityConfig.bgColor }}
            >
              <Radio className="w-6 h-6" style={{ color: severityConfig.color }} />
              {isAutoRefresh && (
                <span
                  className="absolute -top-1 -right-1 w-3 h-3 rounded-full animate-pulse"
                  style={{ backgroundColor: '#6A8A82' }}
                />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold" style={{ color: '#191919' }}>
                Suivi en temps réel
              </h2>
              <p className="text-sm text-gray-500">
                {trackingData?.mission.mission_code || mission?.mission_code}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAutoRefresh(!isAutoRefresh)}
              className={`p-2.5 rounded-xl transition-all ${isAutoRefresh ? 'shadow-md' : ''}`}
              style={{
                backgroundColor: isAutoRefresh ? '#E8EFED' : '#F3F4F6',
                color: isAutoRefresh ? '#6A8A82' : '#6B7280',
              }}
              title={isAutoRefresh ? 'Desactiver actualisation auto' : 'Activer actualisation auto'}
            >
              <RefreshCw className={`w-5 h-5 ${isAutoRefresh ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
            </button>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-all"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading && !trackingData ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-10 h-10 animate-spin text-gray-400 mb-4" />
              <p className="text-gray-500">Chargement des données...</p>
            </div>
          ) : error && !trackingData ? (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 flex flex-col items-center">
              <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
              <p className="text-red-700 font-medium mb-4">{error}</p>
              <button
                onClick={fetchTrackingData}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
              >
                Reessayer
              </button>
            </div>
          ) : trackingData ? (
            <div className="space-y-6">
              {/* Status Banner */}
              {trackingData.delay_status.is_delayed && (
                <div
                  className="rounded-xl p-4 flex items-center gap-4"
                  style={{ backgroundColor: severityConfig.bgColor }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: 'white' }}
                  >
                    <AlertTriangle className="w-6 h-6" style={{ color: severityConfig.color }} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold" style={{ color: severityConfig.color }}>
                      {trackingData.delay_status.delay_type === 'start' && 'Retard au demarrage'}
                      {trackingData.delay_status.delay_type === 'progress' && 'Mission accompli'}
                      {trackingData.delay_status.delay_type === 'arrival' && 'Retard a l\'arrivee'}
                    </h3>
                    <p className="text-sm" style={{ color: severityConfig.color }}>
                      Retard de {trackingData.delay_status.delay_minutes} minutes
                    </p>
                  </div>
                  <div
                    className="px-4 py-2 rounded-lg font-bold text-lg"
                    style={{ backgroundColor: 'white', color: severityConfig.color }}
                  >
                    +{trackingData.delay_status.delay_minutes} min
                  </div>
                </div>
              )}

              {/* Mission Info + GPS Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Mission Info */}
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Navigation className="w-5 h-5" style={{ color: '#6A8A82' }} />
                      Mission
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Titre</span>
                        <span className="font-semibold text-gray-900">{trackingData.mission.title}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Priorite</span>
                        <span
                          className="px-3 py-1 rounded-full text-sm font-medium"
                          style={{ backgroundColor: priority.bgColor, color: priority.color }}
                        >
                          {priority.label}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Chauffeur</span>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900">{trackingData.mission.driver_name}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Vehicule</span>
                        <div className="flex items-center gap-2">
                          <Car className="w-4 h-4 text-gray-400" />
                          <span className="font-mono font-bold text-gray-900">{trackingData.mission.vehicle_plate}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Schedule */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Clock className="w-5 h-5" style={{ color: '#6A8A82' }} />
                      Planning
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Début prévu</span>
                        <span className="font-medium text-gray-900">{formatDateTime(trackingData.schedule.scheduled_start)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Fin prévue</span>
                        <span className="font-medium text-gray-900">{formatDateTime(trackingData.schedule.scheduled_end)}</span>
                      </div>
                      {trackingData.schedule.actual_start && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Début réel</span>
                          <span className="font-medium" style={{ color: '#6A8A82' }}>
                            {formatDateTime(trackingData.schedule.actual_start)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Route */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <MapPin className="w-5 h-5" style={{ color: '#6A8A82' }} />
                      Itinéraire
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: '#6A8A82' }}
                        >
                          <MapPin className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Origine</p>
                          <p className="text-sm font-medium text-gray-900">{trackingData.origin.address}</p>
                        </div>
                      </div>
                      <div className="h-4 border-l-2 border-dashed ml-4" style={{ borderColor: '#6A8A82' }} />
                      <div className="flex items-start gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: '#B87333' }}
                        >
                          <MapPin className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Destination</p>
                          <p className="text-sm font-medium text-gray-900">{trackingData.destination.address}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* GPS Position */}
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                        <Compass className="w-5 h-5" style={{ color: '#6A8A82' }} />
                        Position GPS
                      </h3>
                      {trackingData.last_update && (
                        <span className="text-xs text-gray-500">
                          Mis a jour il y a {formatTimeAgo(trackingData.last_update)}
                        </span>
                      )}
                    </div>

                    {trackingData.current_position ? (
                      <div className="space-y-4">
                        {/* Coordinates Display */}
                        <div
                          className="rounded-xl p-4 text-center"
                          style={{ backgroundColor: '#191919' }}
                        >
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-gray-400 mb-1">Latitude</p>
                              <p className="font-mono text-lg text-white">
                                {trackingData.current_position.latitude.toFixed(6)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400 mb-1">Longitude</p>
                              <p className="font-mono text-lg text-white">
                                {trackingData.current_position.longitude.toFixed(6)}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Speed & Status */}
                        <div className="grid grid-cols-3 gap-3">
                          <div className="bg-white rounded-lg p-3 border-2" style={{ borderColor: '#E8ECEC' }}>
                            <div className="flex items-center gap-2 mb-1">
                              <Gauge className="w-4 h-4 text-gray-400" />
                              <span className="text-xs text-gray-500">Vitesse</span>
                            </div>
                            <p className="font-bold text-lg" style={{ color: '#191919' }}>
                              {trackingData.current_position.speed} <span className="text-sm font-normal">km/h</span>
                            </p>
                          </div>

                          <div className="bg-white rounded-lg p-3 border-2" style={{ borderColor: '#E8ECEC' }}>
                            <div className="flex items-center gap-2 mb-1">
                              <Navigation className="w-4 h-4 text-gray-400" />
                              <span className="text-xs text-gray-500">Statut</span>
                            </div>
                            <p className="font-bold text-lg" style={{ color: trackingData.current_position.is_moving ? '#6A8A82' : '#B87333' }}>
                              {trackingData.current_position.is_moving ? 'En cours' : 'À l\'arrêt'}
                            </p>
                          </div>

                          {trackingData.current_position.battery_level !== null && (
                            <div className="bg-white rounded-lg p-3 border-2" style={{ borderColor: '#E8ECEC' }}>
                              <div className="flex items-center gap-2 mb-1">
                                <Battery className="w-4 h-4 text-gray-400" />
                                <span className="text-xs text-gray-500">Batterie</span>
                              </div>
                              <p className="font-bold text-lg" style={{ color: trackingData.current_position.battery_level < 20 ? '#DC2626' : '#191919' }}>
                                {trackingData.current_position.battery_level}%
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Cap / Heading */}
                        {trackingData.current_position.heading !== null && (
                          <div className="flex items-center justify-center gap-3 p-3 bg-white rounded-lg border-2" style={{ borderColor: '#E8ECEC' }}>
                            <Compass
                              className="w-8 h-8"
                              style={{
                                color: '#6A8A82',
                                transform: `rotate(${trackingData.current_position.heading}deg)`,
                              }}
                            />
                            <div>
                              <p className="text-xs text-gray-500">Direction</p>
                              <p className="font-bold" style={{ color: '#191919' }}>
                                {trackingData.current_position.heading.toFixed(0)}°
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-gray-500">Position GPS non disponible</p>
                        <p className="text-sm text-gray-400 mt-1">En attente de signal...</p>
                      </div>
                    )}
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div
                      className="rounded-xl p-4 flex items-center gap-3"
                      style={{ backgroundColor: '#E8EFED' }}
                    >
                      <Timer className="w-8 h-8" style={{ color: '#6A8A82' }} />
                      <div>
                        <p className="text-xs text-gray-600">Statut retard</p>
                        <p className="font-bold" style={{ color: '#6A8A82' }}>
                          {trackingData.delay_status.is_delayed
                            ? `+${trackingData.delay_status.delay_minutes} min`
                            : 'A l\'heure'}
                        </p>
                      </div>
                    </div>

                    <div
                      className="rounded-xl p-4 flex items-center gap-3"
                      style={{ backgroundColor: trackingData.alerts_count > 0 ? '#FEE2E2' : '#E8EFED' }}
                    >
                      <Bell className="w-8 h-8" style={{ color: trackingData.alerts_count > 0 ? '#DC2626' : '#6A8A82' }} />
                      <div>
                        <p className="text-xs text-gray-600">Alertes</p>
                        <p className="font-bold" style={{ color: trackingData.alerts_count > 0 ? '#DC2626' : '#6A8A82' }}>
                          {trackingData.alerts_count} active(s)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Alerts Section */}
              {trackingData.alerts.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <Bell className="w-5 h-5" style={{ color: '#DC2626' }} />
                    Alertes actives ({trackingData.alerts.length})
                  </h3>
                  <div className="space-y-3">
                    {trackingData.alerts.map((alert) => {
                      const alertSeverity = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.warning;
                      return (
                        <div
                          key={alert.id}
                          className="flex items-start gap-4 p-4 rounded-xl border-2"
                          style={{ backgroundColor: 'white', borderColor: alertSeverity.color }}
                        >
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: alertSeverity.bgColor }}
                          >
                            <AlertTriangle className="w-5 h-5" style={{ color: alertSeverity.color }} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold" style={{ color: alertSeverity.color }}>
                                {alert.title}
                              </h4>
                              <span
                                className="px-2 py-0.5 rounded-full text-xs font-medium"
                                style={{ backgroundColor: alertSeverity.bgColor, color: alertSeverity.color }}
                              >
                                {alertSeverity.label}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">{alert.message}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatDateTime(alert.created_at)}
                            </p>
                          </div>
                          <button
                            onClick={() => handleAcknowledgeAlert(alert.id)}
                            className="px-3 py-2 rounded-lg text-sm font-medium transition-all hover:shadow-md flex items-center gap-2"
                            style={{ backgroundColor: '#E8ECEC', color: '#6B7280' }}
                          >
                            <BellOff className="w-4 h-4" />
                            Acquitter
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Last refresh info */}
              {lastRefresh && (
                <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                  <RefreshCw className="w-4 h-4" />
                  Derniere actualisation: {lastRefresh.toLocaleTimeString('fr-FR')}
                  {isAutoRefresh && ' (actualisation auto activee)'}
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t-2 bg-gray-50" style={{ borderColor: '#E8ECEC' }}>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Radio className={`w-4 h-4 ${isAutoRefresh ? 'animate-pulse' : ''}`} style={{ color: isAutoRefresh ? '#6A8A82' : '#6B7280' }} />
            {isAutoRefresh ? 'Suivi en direct' : 'Suivi en pause'}
          </div>
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl font-semibold transition-all hover:shadow-md"
            style={{ backgroundColor: '#E8ECEC', color: '#6B7280' }}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
