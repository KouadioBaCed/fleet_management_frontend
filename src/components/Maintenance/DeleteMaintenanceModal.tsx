import { X, AlertTriangle, Wrench } from 'lucide-react';

interface DeleteMaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  maintenance: any;
}

export default function DeleteMaintenanceModal({
  isOpen,
  onClose,
  onConfirm,
  maintenance
}: DeleteMaintenanceModalProps) {
  if (!isOpen || !maintenance) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="p-6 border-b-2" style={{ borderColor: '#E8ECEC' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-red-100">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-red-600">Supprimer la Maintenance</h2>
                <p className="text-sm text-gray-600">Cette action est irréversible</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="p-4 rounded-xl bg-red-50 border-2 border-red-200">
            <div className="flex items-start gap-3">
              <Wrench className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-red-900">{maintenance.title}</h3>
                <p className="text-sm text-red-700 mt-1">{maintenance.code}</p>
                <p className="text-sm text-red-600 mt-2">
                  Véhicule: <span className="font-semibold">{maintenance.vehicle}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl" style={{ backgroundColor: '#FEF3E8' }}>
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Attention :</span> La suppression de cette maintenance
              est définitive. Toutes les informations associées seront perdues.
            </p>
          </div>

          <p className="text-sm text-gray-600">
            Êtes-vous sûr de vouloir supprimer cette opération de maintenance ?
          </p>
        </div>

        {/* Footer */}
        <div className="p-6 border-t-2 flex items-center justify-end space-x-3" style={{ borderColor: '#E8ECEC' }}>
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl font-semibold transition-all hover:bg-gray-100"
            style={{ color: '#6B7280' }}
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-3 rounded-xl text-white font-semibold shadow-lg hover:shadow-xl transition-all bg-red-600 hover:bg-red-700"
          >
            Oui, supprimer
          </button>
        </div>
      </div>
    </div>
  );
}
