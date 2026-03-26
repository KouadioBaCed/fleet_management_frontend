import { useState, useEffect, useCallback } from 'react';
import Layout from '@/components/Layout/Layout';
import LeafletTrackingMap, { VehiclePosition } from '@/components/Tracking/LeafletTrackingMap';
import VehicleDetailsPanel from '@/components/Tracking/VehicleDetailsPanel';
import { useWebSocket } from '@/hooks/useWebSocket';
import { missionsApi } from '@/api/missions';
import {
  MapPin,
  Navigation,
  Gauge,
  Activity,
  Radio,
  RefreshCw,
  AlertTriangle,
  User,
  Car,
  Clock,
  Wifi,
  WifiOff,
  ChevronRight,
  Phone,
  Loader2,
  AlertCircle,
  Eye,
} from 'lucide-react';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/live-map/';

export default function LiveTrackingPage() {
  const [vehicles, setVehicles] = useState<VehiclePosition[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [detailsVehicle, setDetailsVehicle] = useState<VehiclePosition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // WebSocket connection
  const { isConnected, lastMessage, sendMessage } = useWebSocket(WS_URL, {
    onMessage: (data) => {
      setError(null);
      if (data.type === 'initial_data' || data.type === 'refresh_data') {
        setVehicles(data.vehicles || []);
        setLoading(false);
        setLastRefresh(new Date());
      } else if (data.type === 'position_update') {
        // Update single vehicle position
        setVehicles((prev) =>
          prev.map((v) =>
            v.mission_id === data.mission_id
              ? {
                  ...v,
                  position: data.position,
                  last_update: data.timestamp,
                }
              : v
          )
        );
      } else if (data.type === 'connection_established') {
        console.log('WebSocket connected:', data.message);
      }
    },
    onConnect: () => {
      setError(null);
    },
    onError: () => {
      setError('Erreur de connexion WebSocket');
    },
  });

  // Fallback: Load data via API if WebSocket not connected
  const loadDataFromApi = useCallback(async () => {
    try {
      setLoading(true);
      const response = await missionsApi.getActiveTracking();
      const mappedVehicles: VehiclePosition[] = response.missions.map((m) => ({
        mission_id: m.id,
        mission_code: m.mission_code,
        title: m.title,
        status: m.status,
        priority: m.priority,
        driver_name: m.driver_name,
        vehicle_id: 0,
        vehicle_plate: m.vehicle_plate,
        position: m.current_position
          ? {
              latitude: m.current_position.latitude,
              longitude: m.current_position.longitude,
              speed: m.current_position.speed,
              heading: null,
              is_moving: m.current_position.is_moving,
              battery_level: null,
            }
          : null,
        last_update: m.last_update,
        origin: m.origin,
        destination: m.destination,
        checkpoints: m.checkpoints || [],
        scheduled_start: m.scheduled_start,
        scheduled_end: m.scheduled_end,
        actual_start: m.actual_start,
        delay_status: m.delay_status,
      }));
      setVehicles(mappedVehicles);
      setLastRefresh(new Date());
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement des donnees');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load if WebSocket takes too long
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading && vehicles.length === 0) {
        loadDataFromApi();
      }
    }, 3000);

    return () => clearTimeout(timeout);
  }, [loading, vehicles.length, loadDataFromApi]);

  // Request refresh
  const handleRefresh = () => {
    setLoading(true);
    if (isConnected) {
      sendMessage({ type: 'request_refresh' });
      // Reset loading after a timeout if no response
      setTimeout(() => setLoading(false), 5000);
    } else {
      loadDataFromApi();
    }
  };

  const selectedVehicle = vehicles.find((v) => v.mission_id === selectedVehicleId);

  // Open vehicle details panel
  const handleOpenDetails = (vehicle: VehiclePosition) => {
    setDetailsVehicle(vehicle);
  };

  // Update details vehicle when data changes
  useEffect(() => {
    if (detailsVehicle) {
      const updated = vehicles.find((v) => v.mission_id === detailsVehicle.mission_id);
      if (updated) {
        setDetailsVehicle(updated);
      }
    }
  }, [vehicles]);

  const formatTime = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatLastUpdate = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
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

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800">
              Suivi GPS en temps réel
            </h1>
            <p className="text-gray-500 mt-1 text-sm sm:text-base">Suivez vos véhicules en direct sur la carte</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Connection status */}
            <div
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium ${
                isConnected
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-600 border border-red-200'
              }`}
            >
              {isConnected ? (
                <>
                  <Wifi className="w-4 h-4" />
                  <span className="hidden xs:inline">Connecte</span>
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4" />
                  <span className="hidden xs:inline">Deconnecte</span>
                </>
              )}
            </div>

            {/* Refresh button */}
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="soft-btn disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Actualiser</span>
            </button>

            {/* Live indicator */}
            <div
              className="flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-xl"
              style={{ backgroundColor: '#6A8A82' }}
            >
              <Radio className="w-4 h-4 text-white" />
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#B87333' }} />
              <span className="text-xs sm:text-sm font-medium text-white">Live</span>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="stat-card">
            <div className="stat-accent" style={{ backgroundColor: '#6A8A82' }} />
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="stat-icon" style={{ backgroundColor: 'rgba(106,138,130,0.1)' }}>
                <Car className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#6A8A82' }} />
              </div>
              <div className="min-w-0">
                <p className="stat-value" style={{ color: '#6A8A82' }}>{vehicles.length}</p>
                <p className="stat-label">Véhicules actifs</p>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-accent" style={{ backgroundColor: '#B87333' }} />
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="stat-icon" style={{ backgroundColor: 'rgba(184,115,51,0.1)' }}>
                <Navigation className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#B87333' }} />
              </div>
              <div className="min-w-0">
                <p className="stat-value" style={{ color: '#B87333' }}>
                  {vehicles.filter((v) => v.position?.is_moving).length}
                </p>
                <p className="stat-label">En cours</p>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-accent" style={{ backgroundColor: '#9ca3af' }} />
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="stat-icon" style={{ backgroundColor: 'rgba(156,163,175,0.1)' }}>
                <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
              </div>
              <div className="min-w-0">
                <p className="stat-value text-gray-600">
                  {vehicles.filter((v) => v.position && !v.position.is_moving).length}
                </p>
                <p className="stat-label">À l'arrêt</p>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-accent" style={{ backgroundColor: '#DC2626' }} />
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="stat-icon" style={{ backgroundColor: 'rgba(220,38,38,0.08)' }}>
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
              </div>
              <div className="min-w-0">
                <p className="stat-value text-red-600">
                  {vehicles.filter((v) => v.delay_status.is_delayed).length}
                </p>
                <p className="stat-label">Arrivé</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Map */}
          <div className="lg:col-span-2 data-table-container">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b flex items-center justify-between" style={{ borderColor: 'rgba(0,0,0,0.05)', background: 'linear-gradient(135deg, rgba(106,138,130,0.06) 0%, rgba(184,115,51,0.04) 100%)' }}>
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(106,138,130,0.1)' }}>
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#6A8A82' }} />
                </div>
                <div>
                  <span className="font-semibold text-sm sm:text-base text-gray-800">Carte en temps réel</span>
                  <p className="text-[10px] sm:text-xs text-gray-400">Derniere MAJ: {formatLastUpdate(lastRefresh)}</p>
                </div>
              </div>
            </div>

            {loading && vehicles.length === 0 ? (
              <div className="h-[300px] sm:h-[400px] lg:h-[500px] flex flex-col items-center justify-center">
                <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 animate-spin mb-4" style={{ color: '#6A8A82' }} />
                <p className="text-gray-500 text-sm sm:text-base">Chargement de la carte...</p>
              </div>
            ) : error ? (
              <div className="h-[300px] sm:h-[400px] lg:h-[500px] flex flex-col items-center justify-center p-4 sm:p-6">
                <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-red-400 mb-4" />
                <p className="text-red-600 font-medium mb-4 text-sm sm:text-base text-center">{error}</p>
                <button
                  onClick={loadDataFromApi}
                  className="btn-primary"
                >
                  Reessayer
                </button>
              </div>
            ) : vehicles.length === 0 ? (
              <div className="h-[300px] sm:h-[400px] lg:h-[500px] flex flex-col items-center justify-center p-4 sm:p-6">
                <div className="data-empty-icon mb-4">
                  <Car className="w-6 h-6" style={{ color: '#6A8A82' }} />
                </div>
                <p className="text-lg sm:text-xl font-semibold mb-2 text-center text-gray-800">Aucun véhicule actif</p>
                <p className="text-gray-400 text-center text-sm sm:text-base">
                  Les véhicules apparaitront ici lorsqu'ils auront des missions en cours.
                </p>
              </div>
            ) : (
              <LeafletTrackingMap
                vehicles={vehicles}
                selectedVehicleId={selectedVehicleId}
                onVehicleSelect={(v) => handleOpenDetails(v)}
              />
            )}
          </div>

          {/* Vehicle list */}
          <div className="space-y-4">
            <div className="data-table-container p-4 sm:p-5">
              <h3 className="font-semibold mb-3 sm:mb-4 flex items-center space-x-2 text-sm sm:text-base text-gray-800">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(106,138,130,0.1)' }}>
                  <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: '#6A8A82' }} />
                </div>
                <span>Véhicules actifs ({vehicles.length})</span>
              </h3>

              {vehicles.length === 0 ? (
                <p className="text-gray-400 text-xs sm:text-sm text-center py-6 sm:py-8">Aucun véhicule en mission</p>
              ) : (
                <div className="space-y-3 max-h-[400px] lg:max-h-[600px] overflow-y-auto pr-1 sm:pr-2">
                  {vehicles.map((vehicle) => {
                    const isSelected = selectedVehicleId === vehicle.mission_id;
                    const hasPosition = vehicle.position !== null;
                    const isMoving = vehicle.position?.is_moving || false;
                    const isDelayed = vehicle.delay_status.is_delayed;
                    const priority = getPriorityConfig(vehicle.priority);

                    return (
                      <div
                        key={vehicle.mission_id}
                        onClick={() => setSelectedVehicleId(isSelected ? null : vehicle.mission_id)}
                        className={`data-card cursor-pointer ${isSelected ? 'shadow-md' : ''}`}
                        style={{
                          borderLeft: isSelected ? '3px solid #6A8A82' : '3px solid transparent',
                        }}
                      >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-2 sm:mb-3">
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                            <div
                              className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: isDelayed ? 'rgba(220,38,38,0.08)' : 'rgba(106,138,130,0.1)' }}
                            >
                              <Car className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: isDelayed ? '#DC2626' : '#6A8A82' }} />
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-semibold text-xs sm:text-sm truncate text-gray-800">
                                {vehicle.vehicle_plate}
                              </h4>
                              <p className="text-[10px] sm:text-xs text-gray-400 truncate">{vehicle.driver_name}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                            <span
                              className="status-badge"
                              style={{ backgroundColor: priority.bg, color: priority.text }}
                            >
                              {priority.label}
                            </span>
                            <ChevronRight
                              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-300 transition-transform ${isSelected ? 'rotate-90' : ''}`}
                            />
                          </div>
                        </div>

                        {/* Mission info */}
                        <p className="text-[10px] sm:text-xs text-gray-500 mb-2 sm:mb-3 line-clamp-1">{vehicle.title}</p>

                        {/* Status badges */}
                        <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-2 sm:mb-3">
                          <span
                            className="status-badge"
                            style={{
                              backgroundColor: !hasPosition ? '#FEF3C7' : isMoving ? '#E8EFED' : 'rgba(220,38,38,0.08)',
                              color: !hasPosition ? '#D97706' : isMoving ? '#6A8A82' : '#DC2626',
                            }}
                          >
                            {!hasPosition ? 'En attente GPS' : isMoving ? 'En route' : 'Arrete'}
                          </span>
                          {isDelayed && (
                            <span className="status-badge" style={{ backgroundColor: 'rgba(220,38,38,0.08)', color: '#DC2626' }}>
                              Retard {vehicle.delay_status.delay_minutes}min
                            </span>
                          )}
                        </div>

                        {/* Speed and time */}
                        <div className="flex items-center justify-between text-[10px] sm:text-xs pt-2 sm:pt-3 border-t" style={{ borderColor: 'rgba(0,0,0,0.04)' }}>
                          <div className="flex items-center space-x-1">
                            <Gauge className="w-3 h-3 sm:w-3.5 sm:h-3.5" style={{ color: '#6A8A82' }} />
                            <span className="font-medium" style={{ color: '#6A8A82' }}>
                              {vehicle.position ? Math.round(vehicle.position.speed) : 0} km/h
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-300" />
                            <span className="text-gray-400">
                              <span className="hidden xs:inline">Fin prévue :</span><span style={{ color: '#B87333' }}>{formatTime(vehicle.scheduled_end)}</span>
                            </span>
                          </div>
                        </div>

                        {/* Expanded details */}
                        {isSelected && (
                          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t space-y-2 sm:space-y-3" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                            {/* Route */}
                            <div className="space-y-1.5 sm:space-y-2">
                              <div className="flex items-start gap-2">
                                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: '#6A8A82' }} />
                                <div className="flex-1 min-w-0">
                                  <p className="text-[10px] sm:text-xs text-gray-400">Depart</p>
                                  <p className="text-[10px] sm:text-xs font-medium text-gray-600 line-clamp-2">{vehicle.origin.address}</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-2">
                                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: '#B87333' }} />
                                <div className="flex-1 min-w-0">
                                  <p className="text-[10px] sm:text-xs text-gray-400">Arrivee</p>
                                  <p className="text-[10px] sm:text-xs font-medium text-gray-600 line-clamp-2">{vehicle.destination.address}</p>
                                </div>
                              </div>
                            </div>

                            {/* Action buttons */}
                            <div className="flex flex-col xs:flex-row gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenDetails(vehicle);
                                }}
                                className="flex-1 btn-primary flex items-center justify-center gap-1.5 sm:gap-2"
                              >
                                <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                <span>Voir details</span>
                              </button>
                              {vehicle.driver_phone && (
                                <a
                                  href={`tel:${vehicle.driver_phone}`}
                                  className="btn-secondary flex items-center justify-center gap-1.5 sm:gap-2"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Phone className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                  <span>Appeler</span>
                                </a>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle Details Panel */}
      <VehicleDetailsPanel
        vehicle={detailsVehicle}
        onClose={() => setDetailsVehicle(null)}
      />
    </Layout>
  );
}
