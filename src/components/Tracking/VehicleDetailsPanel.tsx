import { useState, useEffect } from 'react';
import {
  X,
  Car,
  User,
  MapPin,
  Navigation,
  Gauge,
  Clock,
  Phone,
  Mail,
  AlertTriangle,
  Battery,
  Compass,
  Target,
  Route,
  Calendar,
  Flag,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';
import type { VehiclePosition } from './LeafletTrackingMap';

interface VehicleDetailsPanelProps {
  vehicle: VehiclePosition | null;
  onClose: () => void;
}

export default function VehicleDetailsPanel({ vehicle, onClose }: VehicleDetailsPanelProps) {
  const [copiedCoords, setCopiedCoords] = useState(false);

  useEffect(() => {
    if (copiedCoords) {
      const timer = setTimeout(() => setCopiedCoords(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copiedCoords]);

  if (!vehicle) return null;

  const position = vehicle.position;
  const isMoving = position?.is_moving || false;
  const isDelayed = vehicle.delay_status.is_delayed;

  const formatCoordinate = (coord: number, type: 'lat' | 'lng') => {
    const direction = type === 'lat' ? (coord >= 0 ? 'N' : 'S') : (coord >= 0 ? 'E' : 'W');
    const absCoord = Math.abs(coord);
    const degrees = Math.floor(absCoord);
    const minutes = Math.floor((absCoord - degrees) * 60);
    const seconds = ((absCoord - degrees) * 60 - minutes) * 60;
    return `${degrees}° ${minutes}' ${seconds.toFixed(2)}" ${direction}`;
  };

  const copyCoordinates = () => {
    if (position) {
      const coords = `${position.latitude}, ${position.longitude}`;
      navigator.clipboard.writeText(coords);
      setCopiedCoords(true);
    }
  };

  const openInMaps = () => {
    if (position) {
      const url = `https://www.google.com/maps?q=${position.latitude},${position.longitude}`;
      window.open(url, '_blank');
    }
  };

  const formatTime = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateTime = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatLastUpdate = (dateStr: string | null) => {
    if (!dateStr) return 'Jamais';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);

    if (diffSec < 60) return `Il y a ${diffSec}s`;
    if (diffSec < 3600) return `Il y a ${Math.floor(diffSec / 60)}min`;
    return formatDateTime(dateStr);
  };

  const getHeadingDirection = (heading: number | null | undefined) => {
    if (heading === null || heading === undefined) return '-';
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
    const index = Math.round(heading / 45) % 8;
    return `${directions[index]} (${Math.round(heading)}°)`;
  };

  const getPriorityConfig = (priority: string) => {
    const configs: Record<string, { bg: string; text: string; label: string }> = {
      low: { bg: '#E8ECEC', text: '#6B7280', label: 'Faible' },
      medium: { bg: '#E8EFED', text: '#6A8A82', label: 'Moyenne' },
      high: { bg: '#F5E8DD', text: '#B87333', label: 'Haute' },
      urgent: { bg: '#FEE2E2', text: '#DC2626', label: 'Urgente' },
    };
    return configs[priority] || configs.medium;
  };

  const priority = getPriorityConfig(vehicle.priority);

  // Speed gauge calculation (max 120 km/h)
  const speed = position?.speed || 0;
  const speedPercentage = Math.min((speed / 120) * 100, 100);
  const speedColor = speed > 90 ? '#DC2626' : speed > 60 ? '#B87333' : '#6A8A82';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col mx-2 sm:mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b-2" style={{ borderColor: '#E8ECEC' }}>
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div
              className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0"
              style={{ backgroundColor: isDelayed ? '#FEE2E2' : '#E8EFED' }}
            >
              <Car className="w-5 h-5 sm:w-7 sm:h-7" style={{ color: isDelayed ? '#DC2626' : '#6A8A82' }} />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold truncate" style={{ color: '#191919' }}>
                {vehicle.vehicle_plate}
              </h2>
              <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1">
                <span
                  className="px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap"
                  style={{
                    backgroundColor: isMoving ? '#E8EFED' : '#FEE2E2',
                    color: isMoving ? '#6A8A82' : '#DC2626',
                  }}
                >
                  {isMoving ? 'En mouvement' : 'A l\'arret'}
                </span>
                <span
                  className="px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap"
                  style={{ backgroundColor: priority.bg, color: priority.text }}
                >
                  {priority.label}
                </span>
                {isDelayed && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-600 whitespace-nowrap">
                    Retard {vehicle.delay_status.delay_minutes}min
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-all flex-shrink-0"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Speed Gauge */}
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 sm:p-6 border-2" style={{ borderColor: '#E8ECEC' }}>
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wide text-gray-500 mb-3 sm:mb-4 flex items-center gap-2">
              <Gauge className="w-4 h-4" />
              Vitesse actuelle
            </h3>
            <div className="flex items-center justify-center">
              <div className="relative w-36 h-36 sm:w-48 sm:h-48">
                {/* Background circle */}
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 192 192">
                  <circle
                    cx="96"
                    cy="96"
                    r="80"
                    fill="none"
                    stroke="#E8ECEC"
                    strokeWidth="16"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="80"
                    fill="none"
                    stroke={speedColor}
                    strokeWidth="16"
                    strokeLinecap="round"
                    strokeDasharray={`${speedPercentage * 5.02} 502`}
                    className="transition-all duration-500"
                  />
                </svg>
                {/* Speed value */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl sm:text-5xl font-bold" style={{ color: speedColor }}>
                    {Math.round(speed)}
                  </span>
                  <span className="text-xs sm:text-sm text-gray-500 font-medium">km/h</span>
                </div>
              </div>
            </div>
            {position?.heading !== null && position?.heading !== undefined && (
              <div className="flex items-center justify-center gap-2 mt-4 text-sm text-gray-600">
                <Compass className="w-4 h-4" />
                <span>Direction: <strong>{getHeadingDirection(position.heading)}</strong></span>
              </div>
            )}
          </div>

          {/* Position exacte */}
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 sm:p-6 border-2" style={{ borderColor: '#E8ECEC' }}>
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wide text-gray-500 mb-3 sm:mb-4 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Position exacte
            </h3>
            {position ? (
              <div className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="bg-white rounded-lg p-3 sm:p-4 border" style={{ borderColor: '#E8ECEC' }}>
                    <p className="text-xs text-gray-500 mb-1">Latitude</p>
                    <p className="font-mono font-semibold text-sm sm:text-base" style={{ color: '#6A8A82' }}>
                      {formatCoordinate(position.latitude, 'lat')}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{position.latitude.toFixed(6)}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 sm:p-4 border" style={{ borderColor: '#E8ECEC' }}>
                    <p className="text-xs text-gray-500 mb-1">Longitude</p>
                    <p className="font-mono font-semibold text-sm sm:text-base" style={{ color: '#B87333' }}>
                      {formatCoordinate(position.longitude, 'lng')}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{position.longitude.toFixed(6)}</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <button
                    onClick={copyCoordinates}
                    className="flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all hover:shadow-md"
                    style={{ backgroundColor: '#E8EFED', color: '#6A8A82' }}
                  >
                    {copiedCoords ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedCoords ? 'Copie!' : 'Copier coordonnees'}</span>
                  </button>
                  <button
                    onClick={openInMaps}
                    className="flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all hover:shadow-md"
                    style={{ backgroundColor: '#F5E8DD', color: '#B87333' }}
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Ouvrir dans Maps</span>
                  </button>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t" style={{ borderColor: '#E8ECEC' }}>
                  <span>Derniere mise a jour: <strong>{formatLastUpdate(vehicle.last_update)}</strong></span>
                  {position.battery_level !== null && position.battery_level !== undefined && (
                    <span className="flex items-center gap-1">
                      <Battery className="w-3.5 h-3.5" />
                      <strong>{position.battery_level}%</strong>
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <MapPin className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>Position non disponible</p>
              </div>
            )}
          </div>

          {/* Conducteur */}
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 sm:p-6 border-2" style={{ borderColor: '#E8ECEC' }}>
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wide text-gray-500 mb-3 sm:mb-4 flex items-center gap-2">
              <User className="w-4 h-4" />
              Conducteur
            </h3>
            <div className="flex items-center gap-3 sm:gap-4">
              <div
                className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center text-lg sm:text-2xl font-bold text-white flex-shrink-0"
                style={{ backgroundColor: '#6A8A82' }}
              >
                {vehicle.driver_name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-base sm:text-lg truncate" style={{ color: '#191919' }}>{vehicle.driver_name}</p>
                {vehicle.driver_phone && (
                  <a
                    href={`tel:${vehicle.driver_phone}`}
                    className="flex items-center gap-2 text-xs sm:text-sm text-blue-600 hover:underline mt-1"
                  >
                    <Phone className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="truncate">{vehicle.driver_phone}</span>
                  </a>
                )}
              </div>
              {vehicle.driver_phone && (
                <a
                  href={`tel:${vehicle.driver_phone}`}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center bg-green-100 text-green-600 hover:bg-green-200 transition-all flex-shrink-0"
                >
                  <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
                </a>
              )}
            </div>
          </div>

          {/* Mission en cours */}
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 sm:p-6 border-2" style={{ borderColor: '#E8ECEC' }}>
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wide text-gray-500 mb-3 sm:mb-4 flex items-center gap-2">
              <Route className="w-4 h-4" />
              Mission en cours
            </h3>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <p className="font-bold text-base sm:text-lg" style={{ color: '#191919' }}>{vehicle.title}</p>
                <p className="text-xs sm:text-sm text-gray-500 font-mono">{vehicle.mission_code}</p>
              </div>

              {/* Itineraire */}
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#6A8A82' }}>
                      <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                    </div>
                    <div className="w-0.5 h-6 sm:h-8 my-1" style={{ backgroundColor: '#E8ECEC' }} />
                  </div>
                  <div className="flex-1 pt-0.5 sm:pt-1 min-w-0">
                    <p className="text-xs text-gray-500 uppercase">Depart</p>
                    <p className="font-medium text-xs sm:text-sm break-words" style={{ color: '#191919' }}>{vehicle.origin.address}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#B87333' }}>
                    <Flag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                  </div>
                  <div className="flex-1 pt-0.5 sm:pt-1 min-w-0">
                    <p className="text-xs text-gray-500 uppercase">Arrivee</p>
                    <p className="font-medium text-xs sm:text-sm break-words" style={{ color: '#191919' }}>{vehicle.destination.address}</p>
                  </div>
                </div>
              </div>

              {/* Horaires */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-3 sm:pt-4 border-t" style={{ borderColor: '#E8ECEC' }}>
                <div className="text-center p-2 sm:p-3 rounded-lg" style={{ backgroundColor: '#E8EFED' }}>
                  <p className="text-[10px] sm:text-xs text-gray-500 mb-1">Départ prévu</p>
                  <p className="font-semibold text-xs sm:text-sm" style={{ color: '#6A8A82' }}>{formatTime(vehicle.scheduled_start)}</p>
                </div>
                <div className="text-center p-2 sm:p-3 rounded-lg" style={{ backgroundColor: '#F5E8DD' }}>
                  <p className="text-[10px] sm:text-xs text-gray-500 mb-1">Arrivée prévue</p>
                  <p className="font-semibold text-xs sm:text-sm" style={{ color: '#B87333' }}>{formatTime(vehicle.scheduled_end)}</p>
                </div>
                <div className="text-center p-2 sm:p-3 rounded-lg bg-gray-100">
                  <p className="text-[10px] sm:text-xs text-gray-500 mb-1">Depart reel</p>
                  <p className="font-semibold text-xs sm:text-sm text-gray-700">{formatTime(vehicle.actual_start)}</p>
                </div>
              </div>

              {/* Alerte retard */}
              {isDelayed && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
                  <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-700">Mission en retard</p>
                    <p className="text-sm text-red-600 mt-1">
                      Retard de {vehicle.delay_status.delay_minutes} minutes
                      {vehicle.delay_status.delay_type === 'arrival' && ' sur l\'heure d\'arrivée prévue'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Vehicule */}
          {(vehicle.vehicle_brand || vehicle.vehicle_model) && (
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 sm:p-6 border-2" style={{ borderColor: '#E8ECEC' }}>
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wide text-gray-500 mb-3 sm:mb-4 flex items-center gap-2">
                <Car className="w-4 h-4" />
                Vehicule
              </h3>
              <div className="flex items-center gap-3 sm:gap-4">
                <div
                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: '#E8EFED' }}
                >
                  <Car className="w-6 h-6 sm:w-8 sm:h-8" style={{ color: '#6A8A82' }} />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-base sm:text-lg truncate" style={{ color: '#191919' }}>
                    {vehicle.vehicle_brand} {vehicle.vehicle_model}
                  </p>
                  <p className="text-xs sm:text-sm font-mono" style={{ color: '#6A8A82' }}>{vehicle.vehicle_plate}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-4 sm:p-6 border-t-2 bg-gray-50" style={{ borderColor: '#E8ECEC' }}>
          <button
            onClick={onClose}
            className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold transition-all hover:shadow-lg text-sm sm:text-base"
            style={{ backgroundColor: '#6A8A82', color: 'white' }}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
