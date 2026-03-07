import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  X,
  MapPin,
  Navigation,
  Clock,
  Gauge,
  Route,
  PauseCircle,
  PlayCircle,
  Flag,
  User,
  Car,
  Loader2,
  AlertCircle,
  Fuel,
  Timer,
  TrendingUp,
  CircleDot,
} from 'lucide-react';
import { missionsApi, type TripHistoryResponse, type StopPoint } from '@/api/missions';
import type { Mission } from '@/types';

interface TripHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  mission: Mission | null;
}

// Custom icons
const createStopIcon = (index: number, duration: number) => {
  const color = duration > 30 ? '#DC2626' : duration > 10 ? '#B87333' : '#6A8A82';

  return L.divIcon({
    className: 'custom-stop-marker',
    html: `
      <div class="stop-marker" style="background-color: ${color};">
        <span>${index + 1}</span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

const createLocationIcon = (type: 'origin' | 'destination') => {
  const color = type === 'origin' ? '#6A8A82' : '#B87333';
  const icon = type === 'origin' ? 'A' : 'B';

  return L.divIcon({
    className: 'custom-location-marker',
    html: `
      <div class="location-marker-trip" style="background-color: ${color};">
        <span>${icon}</span>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });
};

// Fit bounds component
function FitBoundsToRoute({ points }: { points: [number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (points.length > 0) {
      map.fitBounds(points, { padding: [50, 50] });
    }
  }, [points, map]);

  return null;
}

export default function TripHistoryModal({ isOpen, onClose, mission }: TripHistoryModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TripHistoryResponse | null>(null);
  const [selectedStop, setSelectedStop] = useState<StopPoint | null>(null);
  const [showStops, setShowStops] = useState(true);
  const [routeColorMode, setRouteColorMode] = useState<'solid' | 'speed'>('solid');

  useEffect(() => {
    if (isOpen && mission) {
      loadTripHistory();
    }
  }, [isOpen, mission?.id]);

  const loadTripHistory = async () => {
    if (!mission) return;

    try {
      setLoading(true);
      setError(null);
      const response = await missionsApi.getTripHistory(mission.id);
      setData(response);
    } catch (err: any) {
      console.error('Error loading trip history:', err);
      setError(err.response?.data?.error || 'Erreur lors du chargement de l\'historique');
    } finally {
      setLoading(false);
    }
  };

  // Build route coordinates
  const routeCoordinates = useMemo((): [number, number][] => {
    if (!data?.route.points) return [];
    return data.route.points.map((p) => [p.latitude, p.longitude]);
  }, [data]);

  // Build all bounds including origin and destination
  const allBounds = useMemo((): [number, number][] => {
    if (!data) return [];
    const bounds: [number, number][] = [
      [data.origin.latitude, data.origin.longitude],
      [data.destination.latitude, data.destination.longitude],
      ...routeCoordinates,
    ];
    return bounds;
  }, [data, routeCoordinates]);

  // Build speed-colored route segments
  const speedSegments = useMemo(() => {
    if (!data?.route.points || data.route.points.length < 2) return [];

    const segments: { positions: [number, number][]; color: string }[] = [];
    const points = data.route.points;

    for (let i = 0; i < points.length - 1; i++) {
      const speed = points[i].speed;
      let color = '#6A8A82'; // Green for normal speed

      if (speed > 90) {
        color = '#DC2626'; // Red for high speed
      } else if (speed > 60) {
        color = '#B87333'; // Orange for moderate speed
      } else if (speed < 5) {
        color = '#6B7280'; // Gray for very slow/stopped
      }

      segments.push({
        positions: [
          [points[i].latitude, points[i].longitude],
          [points[i + 1].latitude, points[i + 1].longitude],
        ],
        color,
      });
    }

    return segments;
  }, [data]);

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

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  };

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        .custom-stop-marker .stop-marker {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          border: 3px solid white;
        }
        .custom-location-marker .location-marker-trip {
          width: 36px;
          height: 36px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 14px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }
        .custom-location-marker .location-marker-trip span {
          transform: rotate(45deg);
        }
      `}</style>

      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b-2" style={{ borderColor: '#E8ECEC' }}>
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#E8EFED' }}>
                <Route className="w-7 h-7" style={{ color: '#6A8A82' }} />
              </div>
              <div>
                <h2 className="text-2xl font-bold" style={{ color: '#191919' }}>
                  Historique du trajet
                </h2>
                <p className="text-sm text-gray-500">
                  {mission?.mission_code} - {mission?.title}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-all"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden flex">
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin mb-4" style={{ color: '#6A8A82' }} />
                <p className="text-gray-600">Chargement de l'historique...</p>
              </div>
            ) : error ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <p className="text-red-600 font-medium mb-4">{error}</p>
                <button
                  onClick={loadTripHistory}
                  className="px-4 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700"
                >
                  Reessayer
                </button>
              </div>
            ) : data ? (
              <>
                {/* Map */}
                <div className="flex-1 relative">
                  <MapContainer
                    center={[data.origin.latitude, data.origin.longitude]}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom={true}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    <FitBoundsToRoute points={allBounds} />

                    {/* Route trace */}
                    {routeColorMode === 'solid' ? (
                      <Polyline
                        positions={routeCoordinates}
                        pathOptions={{
                          color: '#6A8A82',
                          weight: 4,
                          opacity: 0.8,
                        }}
                      />
                    ) : (
                      speedSegments.map((segment, index) => (
                        <Polyline
                          key={index}
                          positions={segment.positions}
                          pathOptions={{
                            color: segment.color,
                            weight: 4,
                            opacity: 0.9,
                          }}
                        />
                      ))
                    )}

                    {/* Origin marker */}
                    <Marker
                      position={[data.origin.latitude, data.origin.longitude]}
                      icon={createLocationIcon('origin')}
                    >
                      <Popup>
                        <div className="p-2">
                          <p className="font-bold text-green-700">Depart</p>
                          <p className="text-sm text-gray-600">{data.origin.address}</p>
                          <p className="text-xs text-gray-500 mt-1">{formatDateTime(data.trip.start_time)}</p>
                        </div>
                      </Popup>
                    </Marker>

                    {/* Destination marker */}
                    <Marker
                      position={[data.destination.latitude, data.destination.longitude]}
                      icon={createLocationIcon('destination')}
                    >
                      <Popup>
                        <div className="p-2">
                          <p className="font-bold" style={{ color: '#B87333' }}>Arrivee</p>
                          <p className="text-sm text-gray-600">{data.destination.address}</p>
                          <p className="text-xs text-gray-500 mt-1">{formatDateTime(data.trip.end_time)}</p>
                        </div>
                      </Popup>
                    </Marker>

                    {/* Stop markers */}
                    {showStops && data.stops.points.map((stop, index) => (
                      <Marker
                        key={index}
                        position={[stop.latitude, stop.longitude]}
                        icon={createStopIcon(index, stop.duration_minutes)}
                        eventHandlers={{
                          click: () => setSelectedStop(stop),
                        }}
                      >
                        <Popup>
                          <div className="p-2">
                            <p className="font-bold text-gray-700">Arret #{index + 1}</p>
                            <p className="text-sm text-gray-600">Duree: {formatDuration(stop.duration_minutes)}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatTime(stop.start_time)} - {formatTime(stop.end_time)}
                            </p>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>

                  {/* Map controls overlay */}
                  <div className="absolute top-4 right-4 z-[1000] space-y-2">
                    <button
                      onClick={() => setShowStops(!showStops)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium shadow-lg transition-all ${
                        showStops ? 'bg-amber-500 text-white' : 'bg-white text-gray-700'
                      }`}
                    >
                      <PauseCircle className="w-4 h-4" />
                      <span>Arrets ({data.stops.count})</span>
                    </button>
                    <button
                      onClick={() => setRouteColorMode(routeColorMode === 'solid' ? 'speed' : 'solid')}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium shadow-lg transition-all ${
                        routeColorMode === 'speed' ? 'text-white' : 'bg-white text-gray-700'
                      }`}
                      style={routeColorMode === 'speed' ? { backgroundColor: '#6A8A82' } : {}}
                    >
                      <TrendingUp className="w-4 h-4" />
                      <span>Vitesse</span>
                    </button>
                  </div>

                  {/* Speed legend */}
                  {routeColorMode === 'speed' && (
                    <div className="absolute bottom-4 left-4 z-[1000] bg-white rounded-lg shadow-lg p-3">
                      <p className="text-xs font-bold text-gray-500 mb-2">Legende vitesse</p>
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-1 rounded" style={{ backgroundColor: '#6B7280' }} />
                          <span>&lt; 5 km/h</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-1 rounded" style={{ backgroundColor: '#6A8A82' }} />
                          <span>5 - 60 km/h</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-1 rounded" style={{ backgroundColor: '#B87333' }} />
                          <span>60 - 90 km/h</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-1 rounded" style={{ backgroundColor: '#DC2626' }} />
                          <span>&gt; 90 km/h</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Sidebar with stats */}
                <div className="w-80 border-l-2 overflow-y-auto" style={{ borderColor: '#E8ECEC' }}>
                  {/* Trip stats */}
                  <div className="p-4 border-b-2" style={{ borderColor: '#E8ECEC' }}>
                    <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-3">
                      Statistiques du trajet
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl" style={{ backgroundColor: '#E8EFED' }}>
                        <div className="flex items-center gap-2 mb-1">
                          <Navigation className="w-4 h-4" style={{ color: '#6A8A82' }} />
                          <span className="text-xs text-gray-500">Distance</span>
                        </div>
                        <p className="text-lg font-bold" style={{ color: '#6A8A82' }}>
                          {data.trip.total_distance.toFixed(1)} km
                        </p>
                      </div>
                      <div className="p-3 rounded-xl" style={{ backgroundColor: '#F5E8DD' }}>
                        <div className="flex items-center gap-2 mb-1">
                          <Timer className="w-4 h-4" style={{ color: '#B87333' }} />
                          <span className="text-xs text-gray-500">Duree</span>
                        </div>
                        <p className="text-lg font-bold" style={{ color: '#B87333' }}>
                          {formatDuration(data.trip.total_duration_minutes)}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-gray-100">
                        <div className="flex items-center gap-2 mb-1">
                          <Gauge className="w-4 h-4 text-gray-600" />
                          <span className="text-xs text-gray-500">Vitesse moy.</span>
                        </div>
                        <p className="text-lg font-bold text-gray-700">
                          {data.trip.average_speed.toFixed(0)} km/h
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-red-50">
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingUp className="w-4 h-4 text-red-500" />
                          <span className="text-xs text-gray-500">Vitesse max</span>
                        </div>
                        <p className="text-lg font-bold text-red-600">
                          {data.trip.max_speed.toFixed(0)} km/h
                        </p>
                      </div>
                    </div>

                    {/* Additional stats */}
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                        <span className="text-sm text-gray-600">Points GPS</span>
                        <span className="font-semibold">{data.route.total_points}</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                        <span className="text-sm text-gray-600">Temps de pause</span>
                        <span className="font-semibold">{formatDuration(data.trip.pause_duration_minutes)}</span>
                      </div>
                      {data.trip.fuel_consumed && (
                        <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                          <span className="text-sm text-gray-600">Carburant</span>
                          <span className="font-semibold">{data.trip.fuel_consumed.toFixed(1)} L</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="p-4 border-b-2" style={{ borderColor: '#E8ECEC' }}>
                    <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-3">
                      Chronologie
                    </h3>
                    <div className="space-y-3">
                      {/* Start */}
                      <div className="flex items-start gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#6A8A82' }}>
                            <PlayCircle className="w-4 h-4 text-white" />
                          </div>
                          {data.stops.count > 0 && <div className="w-0.5 h-6 bg-gray-200" />}
                        </div>
                        <div className="flex-1 pt-1">
                          <p className="font-semibold text-sm" style={{ color: '#6A8A82' }}>Depart</p>
                          <p className="text-xs text-gray-500">{formatDateTime(data.trip.start_time)}</p>
                        </div>
                      </div>

                      {/* Stops */}
                      {data.stops.points.map((stop, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold cursor-pointer transition-all ${
                                selectedStop === stop ? 'ring-2 ring-offset-2' : ''
                              }`}
                              style={{
                                backgroundColor: stop.duration_minutes > 30 ? '#DC2626' : stop.duration_minutes > 10 ? '#B87333' : '#6A8A82',
                                ringColor: '#6A8A82',
                              }}
                              onClick={() => setSelectedStop(selectedStop === stop ? null : stop)}
                            >
                              {index + 1}
                            </div>
                            {index < data.stops.count - 1 && <div className="w-0.5 h-6 bg-gray-200" />}
                          </div>
                          <div className="flex-1 pt-1">
                            <p className="font-semibold text-sm text-gray-700">Arret #{index + 1}</p>
                            <p className="text-xs text-gray-500">
                              {formatDuration(stop.duration_minutes)} - {formatTime(stop.start_time)}
                            </p>
                          </div>
                        </div>
                      ))}

                      {/* End */}
                      <div className="flex items-start gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#B87333' }}>
                            <Flag className="w-4 h-4 text-white" />
                          </div>
                        </div>
                        <div className="flex-1 pt-1">
                          <p className="font-semibold text-sm" style={{ color: '#B87333' }}>Arrivee</p>
                          <p className="text-xs text-gray-500">{formatDateTime(data.trip.end_time)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Driver & Vehicle info */}
                  <div className="p-4">
                    <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-3">
                      Details mission
                    </h3>
                    <div className="space-y-3">
                      {data.mission.driver_name && (
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#6A8A82' }}>
                            <User className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Conducteur</p>
                            <p className="font-semibold text-sm">{data.mission.driver_name}</p>
                          </div>
                        </div>
                      )}
                      {data.mission.vehicle_plate && (
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#B87333' }}>
                            <Car className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Vehicule</p>
                            <p className="font-semibold text-sm">{data.mission.vehicle_plate}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end p-6 border-t-2 bg-gray-50" style={{ borderColor: '#E8ECEC' }}>
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-xl font-semibold transition-all hover:shadow-lg"
              style={{ backgroundColor: '#6A8A82', color: 'white' }}
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
