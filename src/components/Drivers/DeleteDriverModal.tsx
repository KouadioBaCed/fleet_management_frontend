import { useState } from 'react';
import { X, AlertTriangle, Trash2, Loader2 } from 'lucide-react';
import type { Driver } from '@/types';

interface DeleteDriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  driver: Driver | null;
}

export default function DeleteDriverModal({ isOpen, onClose, onConfirm, driver }: DeleteDriverModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !driver) return null;

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      // Parent handles closing the modal on success
    } catch (error) {
      console.error('Failed to delete driver:', error);
      // Keep modal open on error so user can retry
    } finally {
      setIsDeleting(false);
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
                Supprimer le chauffeur
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
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
                  Vous êtes sur le point de supprimer définitivement ce chauffeur et son compte utilisateur.
                  Toutes les données associées seront perdues.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-5 border-2 mb-6" style={{ borderColor: '#E8ECEC' }}>
            <p className="text-sm font-medium text-gray-600 mb-3">Chauffeur à supprimer :</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Nom</span>
                <span className="font-bold" style={{ color: '#191919' }}>{driver.full_name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">ID Employé</span>
                <span className="font-bold font-mono" style={{ color: '#191919' }}>{driver.employee_id}</span>
              </div>
              {driver.user?.email && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Email</span>
                  <span className="font-bold text-sm" style={{ color: '#191919' }}>{driver.user.email}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Trajets effectués</span>
                <span className="font-bold" style={{ color: '#191919' }}>{driver.total_trips}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Distance parcourue</span>
                <span className="font-bold" style={{ color: '#191919' }}>{Number(driver.total_distance).toLocaleString('fr-FR')} km</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleConfirm}
              disabled={isDeleting}
              className="w-full flex items-center justify-center space-x-2 px-6 py-3 rounded-xl font-semibold text-white bg-red-600 hover:bg-red-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Suppression...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-5 h-5" />
                  <span>Oui, supprimer définitivement</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
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
