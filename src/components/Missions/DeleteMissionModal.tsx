import { X, AlertTriangle } from 'lucide-react';

interface Mission {
  id: number;
  code: string;
  title: string;
  driver: string;
  vehicle: string;
  status: string;
  priority: string;
  origin: string;
  destination: string;
  scheduledStart: string;
  scheduledEnd: string;
  distance: string;
}

interface DeleteMissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  mission: Mission | null;
}

export default function DeleteMissionModal({ isOpen, onClose, onConfirm, mission }: DeleteMissionModalProps) {
  if (!isOpen || !mission) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b-2" style={{ borderColor: '#E8ECEC' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-red-100">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Supprimer la mission</h2>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-all"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <p className="text-gray-700 mb-4">
              Êtes-vous sûr de vouloir supprimer cette mission ? Cette action est irréversible.
            </p>
            <div className="bg-red-50 rounded-xl p-4 border-2 border-red-200">
              <p className="text-sm font-semibold text-red-900 mb-2">Mission à supprimer:</p>
              <p className="text-base font-bold text-red-800">{mission.code}</p>
              <p className="text-sm text-red-700 mt-1">{mission.title}</p>
              <div className="mt-3 pt-3 border-t border-red-200">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-red-600">Chauffeur:</span>
                    <p className="font-semibold text-red-800">{mission.driver}</p>
                  </div>
                  <div>
                    <span className="text-red-600">Véhicule:</span>
                    <p className="font-semibold text-red-800">{mission.vehicle}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-amber-50 border-2 border-amber-200">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                <strong>Attention:</strong> Si la mission est en cours ou assignée, le véhicule et le chauffeur seront automatiquement libérés.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t-2 bg-gray-50" style={{ borderColor: '#E8ECEC' }}>
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl font-semibold transition-all hover:bg-gray-200"
            style={{ backgroundColor: '#E8ECEC', color: '#6B7280' }}
          >
            Annuler
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-6 py-3 rounded-xl font-semibold text-white bg-red-600 hover:bg-red-700 transition-all shadow-lg hover:shadow-xl"
          >
            Supprimer la mission
          </button>
        </div>
      </div>
    </div>
  );
}
