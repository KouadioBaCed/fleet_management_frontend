import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import {
  GoogleMap,
  useJsApiLoader,
  MarkerF,
  PolylineF,
  OverlayViewF,
  OVERLAY_MOUSE_TARGET,
} from '@react-google-maps/api';
import { Loader2, AlertCircle, MapPin } from 'lucide-react';
import type { VehiclePosition } from './LeafletTrackingMap';
import { fetchRoadRoute, type LatLng } from '@/utils/directionsRoute';

export type { VehiclePosition } from './LeafletTrackingMap';

interface GoogleTrackingMapProps {
  vehicles: VehiclePosition[];
  selectedVehicleId?: number | null;
  onVehicleSelect?: (vehicle: VehiclePosition) => void;
  center?: { lat: number; lng: number };
  zoom?: number;
  // Trace GPS reelle du chauffeur selectionne (affichee en rouge), tuples [lat, lng]
  driverPath?: [number, number][];
}

const CASABLANCA = { lat: 33.5731, lng: -7.5898 };

const MAP_OPTIONS: google.maps.MapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: true,
  fullscreenControl: true,
  clickableIcons: false,
  // Style epure facon application de navigation : on masque les POIs/transports
  // pour laisser ressortir les vehicules et l'itineraire.
  styles: [
    { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
    { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  ],
};

// Pin teardrop facon Google Maps avec une lettre/numero au centre (origine, destination, checkpoint)
const locationPin = (color: string, label: string): string => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="34" height="44" viewBox="0 0 34 44">
      <path d="M17 0C8.2 0 1 7.2 1 16c0 11.5 16 28 16 28s16-16.5 16-28C33 7.2 25.8 0 17 0z"
            fill="${color}" stroke="#ffffff" stroke-width="2.5"/>
      <text x="17" y="22" font-size="15" font-weight="700" fill="#ffffff"
            text-anchor="middle" font-family="Arial, sans-serif">${label}</text>
    </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const formatLastUpdate = (dateStr: string | null) => {
  if (!dateStr) return 'Jamais';
  const diffSec = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diffSec < 60) return `Il y a ${diffSec}s`;
  if (diffSec < 3600) return `Il y a ${Math.floor(diffSec / 60)} min`;
  return new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};

const MAP_CLASSNAME = 'h-[450px] sm:h-[550px] lg:h-[680px] w-full';

function StateWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${MAP_CLASSNAME} flex flex-col items-center justify-center bg-gray-50 p-6`}>
      {children}
    </div>
  );
}

export default function GoogleTrackingMap({
  vehicles,
  selectedVehicleId,
  onVehicleSelect,
  center = CASABLANCA,
  zoom = 12,
  driverPath,
}: GoogleTrackingMapProps) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey || '',
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const [openVehicleId, setOpenVehicleId] = useState<number | null>(null);

  const selectedVehicle = useMemo(
    () => vehicles.find((v) => v.mission_id === selectedVehicleId) || null,
    [vehicles, selectedVehicleId]
  );

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);
  const onUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  // --- Itineraires routiers (style mobile) ---
  // Pour chaque vehicule, on calcule la voie qui suit les vraies routes
  // (origine -> checkpoints -> destination) via la cascade Google/OSRM/ligne
  // directe, puis on la met en cache. La cle ne depend QUE de la geometrie du
  // trajet (pas de la position live), donc un trajet n'est calcule qu'une fois.
  const routeCacheRef = useRef<Map<string, LatLng[]>>(new Map());
  const [, bumpRoutes] = useReducer((x: number) => x + 1, 0);

  const routeKeyOf = useCallback((v: VehiclePosition) => {
    const o = `${v.origin.latitude.toFixed(5)},${v.origin.longitude.toFixed(5)}`;
    const d = `${v.destination.latitude.toFixed(5)},${v.destination.longitude.toFixed(5)}`;
    const cps = [...(v.checkpoints || [])]
      .sort((a, b) => a.order - b.order)
      .map((cp) => `${cp.latitude.toFixed(5)},${cp.longitude.toFixed(5)}`)
      .join(';');
    return `${v.mission_id}|${o}|${d}|${cps}`;
  }, []);

  // Cle stable de l'ensemble des trajets : ne change pas quand seules les
  // positions GPS bougent, donc on ne recalcule pas les itineraires en boucle.
  const routesSignature = useMemo(
    () => vehicles.map(routeKeyOf).join('::'),
    [vehicles, routeKeyOf]
  );

  useEffect(() => {
    if (!isLoaded) return;
    let cancelled = false;

    (async () => {
      for (const vehicle of vehicles) {
        const key = routeKeyOf(vehicle);
        if (routeCacheRef.current.has(key)) continue;
        // Reservation immediate pour eviter les calculs en double (placeholder).
        routeCacheRef.current.set(key, []);

        const sortedCheckpoints = [...(vehicle.checkpoints || [])].sort((a, b) => a.order - b.order);
        const points = await fetchRoadRoute(
          { lat: vehicle.origin.latitude, lng: vehicle.origin.longitude },
          { lat: vehicle.destination.latitude, lng: vehicle.destination.longitude },
          sortedCheckpoints.map((cp) => ({ lat: cp.latitude, lng: cp.longitude }))
        );
        if (cancelled) return;
        routeCacheRef.current.set(key, points);
        bumpRoutes();
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routesSignature, isLoaded]);

  // Recadrage automatique pour englober tous les vehicules et leurs itineraires.
  // Ne se declenche qu'au premier chargement / changement du nombre de vehicules,
  // pour ne pas combattre le zoom manuel de l'utilisateur ensuite.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoaded || vehicles.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    let hasPoint = false;
    vehicles.forEach((v) => {
      if (v.position) {
        bounds.extend({ lat: v.position.latitude, lng: v.position.longitude });
        hasPoint = true;
      }
      bounds.extend({ lat: v.origin.latitude, lng: v.origin.longitude });
      bounds.extend({ lat: v.destination.latitude, lng: v.destination.longitude });
      (v.checkpoints || []).forEach((cp) => bounds.extend({ lat: cp.latitude, lng: cp.longitude }));
      hasPoint = true;
    });
    if (hasPoint) {
      map.fitBounds(bounds, 60);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, vehicles.length]);

  // Centrage sur le vehicule selectionne (sa position GPS live, sinon son itineraire).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoaded || !selectedVehicle) return;

    if (selectedVehicle.position) {
      map.panTo({ lat: selectedVehicle.position.latitude, lng: selectedVehicle.position.longitude });
      if ((map.getZoom() || 0) < 14) map.setZoom(15);
    } else {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend({ lat: selectedVehicle.origin.latitude, lng: selectedVehicle.origin.longitude });
      bounds.extend({ lat: selectedVehicle.destination.latitude, lng: selectedVehicle.destination.longitude });
      (selectedVehicle.checkpoints || []).forEach((cp) =>
        bounds.extend({ lat: cp.latitude, lng: cp.longitude })
      );
      map.fitBounds(bounds, 70);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVehicle?.mission_id, isLoaded]);

  // --- Etats de chargement / erreur / cle manquante ---
  if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
    return (
      <StateWrapper>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: '#B87333' }}>
          <MapPin className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-base font-semibold mb-2" style={{ color: '#6A8A82' }}>Clé Google Maps manquante</h3>
        <p className="text-sm text-gray-500 text-center max-w-sm">
          Renseignez <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono text-xs">VITE_GOOGLE_MAPS_API_KEY</code> dans le fichier <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono text-xs">.env</code>, puis rechargez la page.
        </p>
      </StateWrapper>
    );
  }

  if (loadError) {
    return (
      <StateWrapper>
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <p className="text-red-600 font-medium text-center">Impossible de charger Google Maps. Vérifiez la clé API.</p>
      </StateWrapper>
    );
  }

  if (!isLoaded) {
    return (
      <StateWrapper>
        <Loader2 className="w-12 h-12 animate-spin mb-4" style={{ color: '#6A8A82' }} />
        <p className="text-gray-500">Chargement de la carte Google...</p>
      </StateWrapper>
    );
  }

  const driverPathLatLng = (driverPath || []).map(([lat, lng]) => ({ lat, lng }));

  return (
    <GoogleMap
      mapContainerClassName={MAP_CLASSNAME}
      center={center}
      zoom={zoom}
      options={MAP_OPTIONS}
      onLoad={onLoad}
      onUnmount={onUnmount}
    >
      {/* Parcours reel du chauffeur selectionne : halo rouge fonce + voie rouge vif (style mobile) */}
      {driverPathLatLng.length > 1 && (
        <>
          <PolylineF
            path={driverPathLatLng}
            options={{ strokeColor: '#B71C1C', strokeWeight: 9, strokeOpacity: 0.95, zIndex: 4 }}
          />
          <PolylineF
            path={driverPathLatLng}
            options={{ strokeColor: '#E53935', strokeWeight: 6, strokeOpacity: 1, zIndex: 5 }}
          />
        </>
      )}

      {vehicles.map((vehicle) => {
        const hasPosition = vehicle.position !== null;
        const isMoving = vehicle.position?.is_moving || false;
        const isDelayed = vehicle.delay_status.is_delayed;
        const speed = vehicle.position?.speed || 0;

        const sortedCheckpoints = [...(vehicle.checkpoints || [])].sort((a, b) => a.order - b.order);
        // Itineraire routier (suit les vraies routes) calcule par le useEffect.
        // Tant qu'il n'est pas pret, on retombe sur la ligne directe pour ne
        // jamais laisser le trajet sans trace.
        const cachedRoute = routeCacheRef.current.get(routeKeyOf(vehicle));
        const roadRoute =
          cachedRoute && cachedRoute.length > 1
            ? cachedRoute
            : [
                { lat: vehicle.origin.latitude, lng: vehicle.origin.longitude },
                ...sortedCheckpoints.map((cp) => ({ lat: cp.latitude, lng: cp.longitude })),
                { lat: vehicle.destination.latitude, lng: vehicle.destination.longitude },
              ];

        const isSelected = selectedVehicleId === vehicle.mission_id;

        let markerColor = '#6A8A82';
        if (isDelayed || vehicle.priority === 'urgent') markerColor = '#DC2626';
        else if (vehicle.priority === 'high') markerColor = '#B87333';

        const isOpen = openVehicleId === vehicle.mission_id;

        return (
          <div key={vehicle.mission_id}>
            {/* Itineraire routier facon mobile : voie ROUGE qui suit les vraies
                routes (origine -> checkpoints -> destination). Le vehicule
                selectionne est mis en avant (trace epais et opaque, comme sur
                l'app du chauffeur) ; les autres restent visibles mais discrets
                pour garder une vue de flotte lisible. */}
            {roadRoute.length > 1 && (
              <>
                {/* Contour rouge fonce (bordure large facon navigation Google Maps) */}
                <PolylineF
                  path={roadRoute}
                  options={{
                    strokeColor: '#B71C1C',
                    strokeWeight: isSelected ? 9 : 5,
                    strokeOpacity: isSelected ? 0.95 : 0.45,
                    zIndex: isSelected ? 4 : 2,
                  }}
                />
                {/* Voie rouge vif */}
                <PolylineF
                  path={roadRoute}
                  options={{
                    strokeColor: '#E53935',
                    strokeWeight: isSelected ? 6 : 3,
                    strokeOpacity: isSelected ? 1 : 0.7,
                    zIndex: isSelected ? 5 : 3,
                  }}
                />
              </>
            )}

            {/* Marqueur origine (A) — vert, comme sur le mobile */}
            <MarkerF
              position={{ lat: vehicle.origin.latitude, lng: vehicle.origin.longitude }}
              title={`Départ : ${vehicle.origin.address}`}
              icon={{
                url: locationPin('#34A853', 'A'),
                scaledSize: new google.maps.Size(34, 44),
                anchor: new google.maps.Point(17, 44),
              }}
            />

            {/* Marqueur destination (B) — rouge, comme sur le mobile */}
            <MarkerF
              position={{ lat: vehicle.destination.latitude, lng: vehicle.destination.longitude }}
              title={`Arrivée : ${vehicle.destination.address}`}
              icon={{
                url: locationPin('#EA4335', 'B'),
                scaledSize: new google.maps.Size(34, 44),
                anchor: new google.maps.Point(17, 44),
              }}
            />

            {/* Marqueurs checkpoints */}
            {sortedCheckpoints.map((cp, index) => (
              <MarkerF
                key={`cp-${vehicle.mission_id}-${cp.id}`}
                position={{ lat: cp.latitude, lng: cp.longitude }}
                title={`Point ${index + 1} : ${cp.address}`}
                icon={{
                  url: locationPin('#D4956B', String(index + 1)),
                  scaledSize: new google.maps.Size(34, 44),
                  anchor: new google.maps.Point(17, 44),
                }}
              />
            ))}

            {/* Marqueur vehicule avec libelle (nom chauffeur + plaque + vitesse) */}
            {hasPosition && vehicle.position && (
              <OverlayViewF
                position={{ lat: vehicle.position.latitude, lng: vehicle.position.longitude }}
                mapPaneName={OVERLAY_MOUSE_TARGET}
                getPixelPositionOffset={(w, h) => ({ x: -(w / 2), y: -h })}
              >
                <div
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}
                  onClick={() => {
                    setOpenVehicleId((id) => (id === vehicle.mission_id ? null : vehicle.mission_id));
                    onVehicleSelect?.(vehicle);
                  }}
                >
                  <div
                    style={{
                      background: '#fff',
                      borderRadius: 8,
                      padding: '6px 10px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                      textAlign: 'center',
                      minWidth: 100,
                      marginBottom: 4,
                      border: '2px solid #E8ECEC',
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#191919', whiteSpace: 'nowrap' }}>
                      {vehicle.driver_name}
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: '#6A8A82', marginTop: 2 }}>
                      {vehicle.vehicle_plate}
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 600, marginTop: 2, color: isMoving ? '#6A8A82' : '#DC2626' }}>
                      {isMoving ? `${Math.round(speed)} km/h` : "À l'arrêt"}
                    </div>
                  </div>
                  <div
                    className={isMoving ? 'gmap-vehicle-pulse' : ''}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                      border: '3px solid #fff',
                      backgroundColor: markerColor,
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C1.4 11.3 1 12.1 1 13v3c0 .6.4 1 1 1h2" />
                      <circle cx="7" cy="17" r="2" />
                      <path d="M9 17h6" />
                      <circle cx="17" cy="17" r="2" />
                    </svg>
                  </div>
                  <div
                    style={{
                      width: 0,
                      height: 0,
                      borderLeft: '8px solid transparent',
                      borderRight: '8px solid transparent',
                      borderTop: `10px solid ${markerColor}`,
                      marginTop: -2,
                    }}
                  />

                  {/* Bulle d'infos au clic */}
                  {isOpen && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 'calc(100% + 6px)',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: '#fff',
                        borderRadius: 12,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                        padding: 14,
                        width: 250,
                        textAlign: 'left',
                        zIndex: 50,
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#191919' }}>{vehicle.driver_name}</div>
                      <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 8 }}>{vehicle.vehicle_plate}</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                        <div style={{ background: '#F0F3F2', borderRadius: 8, padding: 8 }}>
                          <div style={{ fontSize: 10, color: '#6B7280', textTransform: 'uppercase' }}>Vitesse</div>
                          <div style={{ fontSize: 14, fontWeight: 600 }}>{Math.round(vehicle.position.speed)} km/h</div>
                        </div>
                        <div style={{ background: '#F0F3F2', borderRadius: 8, padding: 8 }}>
                          <div style={{ fontSize: 10, color: '#6B7280', textTransform: 'uppercase' }}>Statut</div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: isMoving ? '#6A8A82' : '#DC2626' }}>
                            {isMoving ? 'En cours' : "À l'arrêt"}
                          </div>
                        </div>
                      </div>
                      <div style={{ fontSize: 11, color: '#9CA3AF' }}>MAJ : {formatLastUpdate(vehicle.last_update)}</div>
                      <div style={{ fontSize: 12, color: '#374151', marginTop: 6 }}>
                        <strong>Mission :</strong> {vehicle.title}
                      </div>
                      {isDelayed && (
                        <div style={{ marginTop: 8, padding: '6px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: '#FEE2E2', color: '#DC2626' }}>
                          Retard : {vehicle.delay_status.delay_minutes} min
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </OverlayViewF>
            )}
          </div>
        );
      })}

      <style>{`
        @keyframes gmapVehiclePulse {
          0%   { box-shadow: 0 0 0 0 rgba(106,138,130,0.7), 0 4px 12px rgba(0,0,0,0.3); }
          70%  { box-shadow: 0 0 0 18px rgba(106,138,130,0), 0 4px 12px rgba(0,0,0,0.3); }
          100% { box-shadow: 0 0 0 0 rgba(106,138,130,0), 0 4px 12px rgba(0,0,0,0.3); }
        }
        .gmap-vehicle-pulse { animation: gmapVehiclePulse 2s infinite; }
      `}</style>
    </GoogleMap>
  );
}
