import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Types
export interface VehiclePosition {
  mission_id: number;
  mission_code: string;
  title: string;
  status: string;
  priority: string;
  driver_name: string;
  driver_phone?: string;
  vehicle_id: number;
  vehicle_plate: string;
  vehicle_brand?: string;
  vehicle_model?: string;
  position: {
    latitude: number;
    longitude: number;
    speed: number;
    heading?: number | null;
    is_moving: boolean;
    battery_level?: number | null;
  } | null;
  last_update: string | null;
  origin: {
    latitude: number;
    longitude: number;
    address: string;
  };
  destination: {
    latitude: number;
    longitude: number;
    address: string;
  };
  scheduled_start?: string | null;
  scheduled_end?: string | null;
  actual_start?: string | null;
  delay_status: {
    is_delayed: boolean;
    delay_type: string | null;
    delay_minutes: number;
    severity: string;
  };
}

interface LeafletTrackingMapProps {
  vehicles: VehiclePosition[];
  selectedVehicleId?: number | null;
  onVehicleSelect?: (vehicle: VehiclePosition) => void;
  center?: [number, number];
  zoom?: number;
}

// Custom icon with driver name label
const createVehicleIcon = (
  driverName: string,
  vehiclePlate: string,
  isMoving: boolean,
  isDelayed: boolean,
  priority: string,
  speed: number
) => {
  let markerColor = '#6A8A82'; // Default sage color

  if (isDelayed) {
    markerColor = '#DC2626'; // Red for delayed
  } else if (priority === 'urgent') {
    markerColor = '#DC2626';
  } else if (priority === 'high') {
    markerColor = '#B87333'; // Copper
  }

  const pulseClass = isMoving ? 'pulse-animation' : '';
  const statusText = isMoving ? `${Math.round(speed)} km/h` : 'Arrêté';
  const statusColor = isMoving ? '#6A8A82' : '#DC2626';

  return L.divIcon({
    className: 'custom-vehicle-marker-with-label',
    html: `
      <div class="vehicle-marker-container">
        <div class="vehicle-marker-label">
          <div class="driver-name">${driverName}</div>
          <div class="vehicle-plate">${vehiclePlate}</div>
          <div class="vehicle-speed" style="color: ${statusColor}">${statusText}</div>
        </div>
        <div class="vehicle-marker ${pulseClass}" style="background-color: ${markerColor};">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C1.4 11.3 1 12.1 1 13v3c0 .6.4 1 1 1h2"/>
            <circle cx="7" cy="17" r="2"/>
            <path d="M9 17h6"/>
            <circle cx="17" cy="17" r="2"/>
          </svg>
        </div>
        <div class="vehicle-marker-pointer" style="border-top-color: ${markerColor};"></div>
      </div>
    `,
    iconSize: [120, 90],
    iconAnchor: [60, 90],
    popupAnchor: [0, -90],
  });
};

const createLocationIcon = (type: 'origin' | 'destination') => {
  const color = type === 'origin' ? '#6A8A82' : '#B87333';
  const label = type === 'origin' ? 'D' : 'A';

  return L.divIcon({
    className: 'custom-location-marker',
    html: `
      <div class="location-marker" style="background-color: ${color};">
        <span class="location-label">${label}</span>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });
};

// Component to fit bounds
function FitBoundsToVehicles({ vehicles }: { vehicles: VehiclePosition[] }) {
  const map = useMap();

  useEffect(() => {
    if (vehicles.length === 0) return;

    const bounds: [number, number][] = [];

    vehicles.forEach((v) => {
      if (v.position) {
        bounds.push([v.position.latitude, v.position.longitude]);
      }
      bounds.push([v.origin.latitude, v.origin.longitude]);
      bounds.push([v.destination.latitude, v.destination.longitude]);
    });

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [vehicles.length]);

  return null;
}

// Component to center on selected vehicle
function CenterOnVehicle({ vehicle }: { vehicle: VehiclePosition | null }) {
  const map = useMap();

  useEffect(() => {
    if (!vehicle) return;

    if (vehicle.position) {
      // Center on live GPS position
      map.setView([vehicle.position.latitude, vehicle.position.longitude], 15, {
        animate: true,
      });
    } else {
      // No GPS yet: fit bounds to origin + destination so the full route is visible
      const bounds: [number, number][] = [
        [vehicle.origin.latitude, vehicle.origin.longitude],
        [vehicle.destination.latitude, vehicle.destination.longitude],
      ];
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15, animate: true });
    }
  }, [vehicle?.mission_id]);

  return null;
}

export default function LeafletTrackingMap({
  vehicles,
  selectedVehicleId,
  onVehicleSelect,
  center = [33.5731, -7.5898], // Casablanca default
  zoom = 12,
}: LeafletTrackingMapProps) {
  const selectedVehicle = useMemo(
    () => vehicles.find((v) => v.mission_id === selectedVehicleId) || null,
    [vehicles, selectedVehicleId]
  );

  const formatTime = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleTimeString('fr-FR', {
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
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      <style>{`
        /* Vehicle marker with label */
        .custom-vehicle-marker-with-label {
          background: transparent !important;
          border: none !important;
        }
        .vehicle-marker-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
        }
        .vehicle-marker-label {
          background: white;
          border-radius: 8px;
          padding: 6px 10px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          text-align: center;
          min-width: 100px;
          margin-bottom: 4px;
          border: 2px solid #E8ECEC;
        }
        .vehicle-marker-label .driver-name {
          font-size: 12px;
          font-weight: 700;
          color: #191919;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100px;
        }
        .vehicle-marker-label .vehicle-plate {
          font-size: 10px;
          font-weight: 600;
          color: #6A8A82;
          margin-top: 2px;
        }
        .vehicle-marker-label .vehicle-speed {
          font-size: 10px;
          font-weight: 600;
          margin-top: 2px;
        }
        .vehicle-marker {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          border: 3px solid white;
          transition: transform 0.3s ease;
          cursor: pointer;
        }
        .vehicle-marker:hover {
          transform: scale(1.15);
        }
        .vehicle-marker-pointer {
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-top: 10px solid;
          margin-top: -2px;
        }
        .pulse-animation {
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(106, 138, 130, 0.7); }
          70% { box-shadow: 0 0 0 20px rgba(106, 138, 130, 0); }
          100% { box-shadow: 0 0 0 0 rgba(106, 138, 130, 0); }
        }

        /* Location markers */
        .custom-location-marker .location-marker {
          width: 28px;
          height: 28px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
          border: 2px solid white;
        }
        .custom-location-marker .location-label {
          transform: rotate(45deg);
          color: white;
          font-size: 12px;
          font-weight: 700;
        }

        /* Popup styles */
        .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        }
        .leaflet-popup-content {
          margin: 0;
          min-width: 280px;
        }
        .vehicle-popup {
          padding: 16px;
        }
        .vehicle-popup-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
          padding-bottom: 12px;
          border-bottom: 2px solid #E8ECEC;
        }
        .vehicle-popup-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #6A8A82;
        }
        .vehicle-popup-title {
          font-size: 16px;
          font-weight: 700;
          color: #191919;
        }
        .vehicle-popup-subtitle {
          font-size: 12px;
          color: #6B7280;
        }
        .vehicle-popup-stats {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          margin-bottom: 12px;
        }
        .vehicle-popup-stat {
          padding: 8px;
          background-color: #F0F3F2;
          border-radius: 8px;
        }
        .vehicle-popup-stat-label {
          font-size: 10px;
          color: #6B7280;
          text-transform: uppercase;
        }
        .vehicle-popup-stat-value {
          font-size: 14px;
          font-weight: 600;
          color: #191919;
        }
        .vehicle-popup-route {
          background-color: #F9FAFB;
          border-radius: 8px;
          padding: 12px;
        }
        .vehicle-popup-route-item {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          margin-bottom: 8px;
        }
        .vehicle-popup-route-item:last-child {
          margin-bottom: 0;
        }
        .vehicle-popup-route-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          margin-top: 4px;
          flex-shrink: 0;
        }
        .vehicle-popup-route-text {
          font-size: 12px;
          color: #374151;
          line-height: 1.4;
        }
        .vehicle-popup-delay {
          margin-top: 12px;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
        }
        .delay-critical { background-color: #FEE2E2; color: #DC2626; }
        .delay-warning { background-color: #FEF3C7; color: #D97706; }
        .delay-info { background-color: #DBEAFE; color: #1E40AF; }
      `}</style>

      <MapContainer
        center={center}
        zoom={zoom}
        className="h-[300px] sm:h-[400px] lg:h-[500px] w-full"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitBoundsToVehicles vehicles={vehicles} />
        <CenterOnVehicle vehicle={selectedVehicle} />

        {vehicles.map((vehicle) => {
          const hasPosition = vehicle.position !== null;
          const isMoving = vehicle.position?.is_moving || false;
          const isDelayed = vehicle.delay_status.is_delayed;
          const speed = vehicle.position?.speed || 0;

          // Route line from origin to destination
          const routeLine: [number, number][] = [
            [vehicle.origin.latitude, vehicle.origin.longitude],
            [vehicle.destination.latitude, vehicle.destination.longitude],
          ];

          // If vehicle has position, add intermediate point
          if (hasPosition && vehicle.position) {
            routeLine.splice(1, 0, [vehicle.position.latitude, vehicle.position.longitude]);
          }

          return (
            <div key={vehicle.mission_id}>
              {/* Route line */}
              <Polyline
                positions={routeLine}
                pathOptions={{
                  color: isDelayed ? '#DC2626' : '#6A8A82',
                  weight: 4,
                  opacity: 0.7,
                  dashArray: hasPosition ? undefined : '10, 10',
                }}
              />

              {/* Origin marker */}
              <Marker
                position={[vehicle.origin.latitude, vehicle.origin.longitude]}
                icon={createLocationIcon('origin')}
              >
                <Popup>
                  <div className="vehicle-popup">
                    <div className="vehicle-popup-stat">
                      <div className="vehicle-popup-stat-label">Point de départ</div>
                      <div className="vehicle-popup-stat-value">{vehicle.origin.address}</div>
                    </div>
                  </div>
                </Popup>
              </Marker>

              {/* Destination marker */}
              <Marker
                position={[vehicle.destination.latitude, vehicle.destination.longitude]}
                icon={createLocationIcon('destination')}
              >
                <Popup>
                  <div className="vehicle-popup">
                    <div className="vehicle-popup-stat">
                      <div className="vehicle-popup-stat-label">Destination</div>
                      <div className="vehicle-popup-stat-value">{vehicle.destination.address}</div>
                    </div>
                  </div>
                </Popup>
              </Marker>

              {/* Vehicle marker with driver name (if has position) */}
              {hasPosition && vehicle.position && (
                <Marker
                  position={[vehicle.position.latitude, vehicle.position.longitude]}
                  icon={createVehicleIcon(
                    vehicle.driver_name,
                    vehicle.vehicle_plate,
                    isMoving,
                    isDelayed,
                    vehicle.priority,
                    speed
                  )}
                  eventHandlers={{
                    click: () => onVehicleSelect?.(vehicle),
                  }}
                >
                  <Popup>
                    <div className="vehicle-popup">
                      <div className="vehicle-popup-header">
                        <div className="vehicle-popup-icon">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C1.4 11.3 1 12.1 1 13v3c0 .6.4 1 1 1h2"/>
                            <circle cx="7" cy="17" r="2"/>
                            <path d="M9 17h6"/>
                            <circle cx="17" cy="17" r="2"/>
                          </svg>
                        </div>
                        <div>
                          <div className="vehicle-popup-title">{vehicle.driver_name}</div>
                          <div className="vehicle-popup-subtitle">{vehicle.vehicle_plate}</div>
                        </div>
                      </div>

                      <div className="vehicle-popup-stats">
                        <div className="vehicle-popup-stat">
                          <div className="vehicle-popup-stat-label">Vitesse</div>
                          <div className="vehicle-popup-stat-value">{Math.round(vehicle.position.speed)} km/h</div>
                        </div>
                        <div className="vehicle-popup-stat">
                          <div className="vehicle-popup-stat-label">Statut</div>
                          <div className="vehicle-popup-stat-value" style={{ color: isMoving ? '#6A8A82' : '#DC2626' }}>
                            {isMoving ? 'En mouvement' : 'À l\'arrêt'}
                          </div>
                        </div>
                        <div className="vehicle-popup-stat">
                          <div className="vehicle-popup-stat-label">Dernière MAJ</div>
                          <div className="vehicle-popup-stat-value">{formatLastUpdate(vehicle.last_update)}</div>
                        </div>
                        {vehicle.position.battery_level !== null && (
                          <div className="vehicle-popup-stat">
                            <div className="vehicle-popup-stat-label">Batterie</div>
                            <div className="vehicle-popup-stat-value">{vehicle.position.battery_level}%</div>
                          </div>
                        )}
                      </div>

                      <div className="vehicle-popup-route">
                        <div className="vehicle-popup-route-item">
                          <div className="vehicle-popup-route-dot" style={{ backgroundColor: '#6A8A82' }} />
                          <div className="vehicle-popup-route-text">{vehicle.origin.address}</div>
                        </div>
                        <div className="vehicle-popup-route-item">
                          <div className="vehicle-popup-route-dot" style={{ backgroundColor: '#B87333' }} />
                          <div className="vehicle-popup-route-text">{vehicle.destination.address}</div>
                        </div>
                      </div>

                      <div style={{ marginTop: '12px', fontSize: '12px', color: '#6B7280' }}>
                        <strong>Mission:</strong> {vehicle.title}
                      </div>
                      <div style={{ fontSize: '11px', color: '#9CA3AF' }}>
                        {vehicle.mission_code}
                      </div>

                      {isDelayed && (
                        <div className={`vehicle-popup-delay delay-${vehicle.delay_status.severity}`}>
                          Retard: {vehicle.delay_status.delay_minutes} min
                        </div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              )}
            </div>
          );
        })}
      </MapContainer>
    </>
  );
}
