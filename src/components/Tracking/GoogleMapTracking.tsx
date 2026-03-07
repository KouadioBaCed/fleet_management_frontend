import { GoogleMap, useLoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { useState } from 'react';
import { Car, Gauge, MapPin, Radio } from 'lucide-react';

interface Vehicle {
  id: number;
  plate: string;
  driver: string;
  mission: string;
  speed: number;
  status: 'moving' | 'stopped';
  progress: number;
  eta: string;
  position: {
    lat: number;
    lng: number;
  };
}

interface GoogleMapTrackingProps {
  vehicles: Vehicle[];
}

const mapContainerStyle = {
  width: '100%',
  height: '600px'
};

const defaultCenter = {
  lat: 33.5731,
  lng: -7.5898 // Casablanca, Maroc
};

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: true,
  fullscreenControl: true,
};

export default function GoogleMapTracking({ vehicles }: GoogleMapTrackingProps) {
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // Vérifier si la clé API est configurée
  if (!apiKey || apiKey === 'your_google_maps_api_key_here' || apiKey === '') {
    return (
      <div className="h-[600px] bg-gradient-to-br from-gray-50 to-gray-100 relative flex items-center justify-center border-2 border-dashed" style={{ borderColor: '#B87333' }}>
        <div className="text-center max-w-lg px-6">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg" style={{ backgroundColor: '#B87333' }}>
            <MapPin className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-lg font-semibold mb-3" style={{ color: '#6A8A82' }}>Configuration Google Maps requise</h3>
          <div className="bg-white rounded-lg p-4 mb-4 text-left shadow-sm">
            <p className="text-sm text-gray-700 mb-3">
              Pour afficher la carte en temps réel, vous devez configurer une clé API Google Maps :
            </p>
            <ol className="text-xs text-gray-600 space-y-2 list-decimal list-inside">
              <li>Allez sur <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="font-semibold" style={{ color: '#6A8A82' }}>Google Cloud Console</a></li>
              <li>Créez un projet ou sélectionnez un projet existant</li>
              <li>Activez l'API <strong>"Maps JavaScript API"</strong></li>
              <li>Créez une clé API dans "Identifiants"</li>
              <li>Ajoutez la clé dans le fichier <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">.env</code> :</li>
            </ol>
            <div className="mt-3 bg-gray-900 text-gray-100 p-3 rounded font-mono text-xs">
              VITE_GOOGLE_MAPS_API_KEY=votre_clé_api_ici
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Après configuration, rechargez la page pour voir la carte.
          </p>
        </div>
      </div>
    );
  }

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: apiKey,
  });

  if (loadError) {
    return (
      <div className="h-[600px] bg-gradient-to-br from-gray-50 to-gray-100 relative flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-red-100">
            <Radio className="w-10 h-10 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2 text-red-600">Erreur de chargement</h3>
          <p className="text-gray-500 max-w-md text-sm mb-2">
            Impossible de charger Google Maps. Vérifiez votre clé API.
          </p>
          <p className="text-xs text-gray-400">
            Erreur: {loadError.message}
          </p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="h-[600px] bg-gradient-to-br from-gray-50 to-gray-100 relative flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg" style={{ backgroundColor: '#6A8A82' }}>
            <Radio className="w-10 h-10 text-white animate-pulse" />
          </div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: '#6A8A82' }}>Chargement de la carte...</h3>
          <p className="text-gray-500 max-w-md text-sm">
            Initialisation de Google Maps
          </p>
        </div>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={defaultCenter}
      zoom={12}
      options={mapOptions}
    >
      {vehicles.map((vehicle) => (
        <Marker
          key={vehicle.id}
          position={vehicle.position}
          onClick={() => setSelectedVehicle(vehicle)}
          icon={{
            url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" fill="${vehicle.status === 'moving' ? '#6A8A82' : '#dc2626'}" stroke="#ffffff" stroke-width="2"/>
              </svg>
            `)}`,
            scaledSize: new window.google.maps.Size(24, 24),
            anchor: new window.google.maps.Point(12, 12),
          }}
        />
      ))}

      {selectedVehicle && (
        <InfoWindow
          position={selectedVehicle.position}
          onCloseClick={() => setSelectedVehicle(null)}
        >
          <div className="p-3 min-w-[250px]">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#6A8A82' }}>
                <Car className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-sm" style={{ color: '#6A8A82' }}>{selectedVehicle.plate}</h3>
                <p className="text-xs text-gray-500">{selectedVehicle.driver}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 mt-0.5" style={{ color: '#B87333' }} />
                <p className="text-xs text-gray-700 font-medium">{selectedVehicle.mission}</p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                <div className="flex items-center space-x-1.5">
                  <Gauge className="w-4 h-4" style={{ color: '#6A8A82' }} />
                  <span className="text-xs font-semibold" style={{ color: '#6A8A82' }}>{selectedVehicle.speed} km/h</span>
                </div>
                <div
                  className="px-2 py-0.5 rounded text-xs font-medium"
                  style={selectedVehicle.status === 'moving'
                    ? { backgroundColor: '#6A8A82', color: '#ffffff' }
                    : { backgroundColor: '#fee2e2', color: '#dc2626' }
                  }
                >
                  {selectedVehicle.status === 'moving' ? 'En route' : 'Arrêté'}
                </div>
              </div>

              <div className="pt-2">
                <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                  <span>Progression</span>
                  <span className="font-semibold" style={{ color: '#B87333' }}>{selectedVehicle.progress}%</span>
                </div>
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all rounded-full"
                    style={{ width: `${selectedVehicle.progress}%`, backgroundColor: '#B87333' }}
                  />
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  ETA: <span className="font-semibold" style={{ color: '#B87333' }}>{selectedVehicle.eta}</span>
                </p>
              </div>
            </div>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
}
