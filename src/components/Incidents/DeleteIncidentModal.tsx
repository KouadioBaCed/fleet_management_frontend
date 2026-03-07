import { X, AlertTriangle, Trash2 } from 'lucide-react';

interface Incident {
  id: number;
  code: string;
  title: string;
  type: string;
  severity: string;
  driver: string;
  vehicle: string;
}

interface DeleteIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  incident: Incident | null;
}

export default function DeleteIncidentModal({ isOpen, onClose, onConfirm, incident }: DeleteIncidentModalProps) {
  if (!isOpen || !incident) return null;

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
                Supprimer l'incident
              </h2>
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
        <div className="p-6">
          <div className="bg-red-50 rounded-xl p-6 border-2 border-red-200 mb-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-red-900 mb-2">
                  Attention : Cette action est irréversible
                </h3>
                <p className="text-sm text-red-800">
                  Vous êtes sur le point de supprimer définitivement cet incident.
                  Toutes les données associées seront perdues.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-5 border-2 mb-6" style={{ borderColor: '#E8ECEC' }}>
            <p className="text-sm font-medium text-gray-600 mb-3">Incident à supprimer :</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Code</span>
                <span className="font-bold" style={{ color: '#191919' }}>{incident.code}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Titre</span>
                <span className="font-bold" style={{ color: '#191919' }}>{incident.title}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Chauffeur</span>
                <span className="font-bold" style={{ color: '#191919' }}>{incident.driver}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Véhicule</span>
                <span className="font-bold" style={{ color: '#191919' }}>{incident.vehicle}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={onConfirm}
              className="w-full flex items-center justify-center space-x-2 px-6 py-3 rounded-xl font-semibold text-white bg-red-600 hover:bg-red-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
            >
              <Trash2 className="w-5 h-5" />
              <span>Oui, supprimer définitivement</span>
            </button>
            <button
              onClick={onClose}
              className="w-full px-6 py-3 rounded-xl font-semibold transition-all hover:bg-gray-200"
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
