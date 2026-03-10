import { useState } from 'react';
import { X, AlertTriangle, Trash2, Loader2, Car } from 'lucide-react';
import type { Vehicle } from '@/types';

interface DeleteVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  vehicle: Vehicle | null;
}

export default function DeleteVehicleModal({ isOpen, onClose, onConfirm, vehicle }: DeleteVehicleModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !vehicle) return null;

  const handleConfirm = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      await onConfirm();
      onClose();
    } catch (err: any) {
      console.error('Failed to delete vehicle:', err);
      setError(err.response?.data?.detail || 'Erreur lors de la suppression du véhicule');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      setError(null);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2" style={{ borderColor: '#E8ECEC' }}>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-red-100">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold" style={{ color: '#191919' }}>
                Supprimer le véhicule
              </h2>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isDeleting}
            className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-all disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="bg-red-50 rounded-xl p-6 border-2 border-red-200 mb-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-red-900 mb-2">
                  Attention : Cette action est irréversible
                </h3>
                <p className="text-sm text-red-800">
                  Vous êtes sur le point de supprimer définitivement ce véhicule de votre flotte.
                  Toutes les données associées seront perdues.
                </p>
              </div>
            </div>
          </div>

          {/* Vehicle info card */}
          <div className="bg-gray-50 rounded-xl p-5 border-2 mb-6" style={{ borderColor: '#E8ECEC' }}>
            <div className="flex items-center gap-4 mb-4">
              {vehicle.photo ? (
                <img
                  src={vehicle.photo}
                  alt={vehicle.license_plate}
                  className="w-16 h-16 rounded-xl object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#E8EFED' }}>
                  <Car className="w-8 h-8" style={{ color: '#6A8A82' }} />
                </div>
              )}
              <div>
                <p className="font-bold text-lg font-mono" style={{ color: '#191919' }}>{vehicle.license_plate}</p>
                <p className="text-gray-600">{vehicle.brand} {vehicle.model}</p>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t" style={{ borderColor: '#E8ECEC' }}>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Année</span>
                <span className="font-semibold" style={{ color: '#191919' }}>{vehicle.year}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Type</span>
                <span className="font-semibold" style={{ color: '#191919' }}>
                  {vehicle.vehicle_type === 'sedan' ? 'Berline' :
                   vehicle.vehicle_type === 'suv' ? 'SUV' :
                   vehicle.vehicle_type === 'van' ? 'Camionnette' :
                   vehicle.vehicle_type === 'truck' ? 'Camion' : vehicle.vehicle_type}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Kilométrage</span>
                <span className="font-semibold" style={{ color: '#191919' }}>
                  {new Intl.NumberFormat('fr-FR').format(Math.round(vehicle.current_mileage))} km
                </span>
              </div>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleConfirm}
              disabled={isDeleting}
              className="w-full flex items-center justify-center space-x-2 px-6 py-3 rounded-xl font-semibold text-white bg-red-600 hover:bg-red-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Suppression en cours...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-5 h-5" />
                  <span>Oui, supprimer définitivement</span>
                </>
              )}
            </button>
            <button
              onClick={handleClose}
              disabled={isDeleting}
              className="w-full px-6 py-3 rounded-xl font-semibold transition-all hover:bg-gray-200 disabled:opacity-50"
              style={{ backgroundColor: '#E8ECEC', color: '#6B7280' }}
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
