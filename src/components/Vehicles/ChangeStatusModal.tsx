import { useState } from 'react';
import { X, Car, CheckCircle, AlertTriangle, Wrench, XCircle, Loader2, ArrowRight } from 'lucide-react';
import type { Vehicle } from '@/types';

interface ChangeStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (status: string) => Promise<void>;
  vehicle: Vehicle | null;
}

const STATUS_OPTIONS = [
  {
    value: 'available',
    label: 'Disponible',
    description: 'Le vehicule est pret a etre utilise',
    icon: CheckCircle,
    color: '#6A8A82',
    bgColor: '#E8EFED',
  },
  {
    value: 'in_use',
    label: 'En mission',
    description: 'Le vehicule est actuellement en cours d\'utilisation',
    icon: Car,
    color: '#B87333',
    bgColor: '#F5E8DD',
  },
  {
    value: 'maintenance',
    label: 'En maintenance',
    description: 'Le vehicule est en cours de reparation ou d\'entretien',
    icon: Wrench,
    color: '#6B7280',
    bgColor: '#F3F4F6',
  },
  {
    value: 'out_of_service',
    label: 'Hors service',
    description: 'Le vehicule n\'est pas disponible pour utilisation',
    icon: XCircle,
    color: '#DC2626',
    bgColor: '#FEE2E2',
  },
];

const getCurrentStatusInfo = (status: string) => {
  return STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];
};

export default function ChangeStatusModal({ isOpen, onClose, onConfirm, vehicle }: ChangeStatusModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!selectedStatus || selectedStatus === vehicle?.status) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await onConfirm(selectedStatus);
      handleClose();
    } catch (err: any) {
      console.error('Failed to change status:', err);
      setError(err.response?.data?.error || 'Erreur lors du changement de statut');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedStatus(null);
    setError(null);
    setIsSubmitting(false);
    onClose();
  };

  if (!isOpen || !vehicle) return null;

  const currentStatus = getCurrentStatusInfo(vehicle.status);
  const newStatus = selectedStatus ? getCurrentStatusInfo(selectedStatus) : null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2" style={{ borderColor: '#E8ECEC' }}>
          <div className="flex items-center space-x-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: currentStatus.bgColor }}
            >
              <Car className="w-6 h-6" style={{ color: currentStatus.color }} />
            </div>
            <div>
              <h2 className="text-xl font-bold" style={{ color: '#191919' }}>
                Changer le statut
              </h2>
              <p className="text-sm text-gray-500 font-mono">{vehicle.license_plate}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-all"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Vehicle Info */}
        <div className="px-6 pt-4">
          <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold" style={{ color: '#191919' }}>
                {vehicle.brand} {vehicle.model}
              </p>
              <p className="text-sm text-gray-500">{vehicle.year} • {vehicle.color}</p>
            </div>
            <div className="flex items-center gap-3">
              <div
                className="px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2"
                style={{ backgroundColor: currentStatus.bgColor, color: currentStatus.color }}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: currentStatus.color }} />
                {currentStatus.label}
              </div>
              {newStatus && selectedStatus !== vehicle.status && (
                <>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                  <div
                    className="px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2"
                    style={{ backgroundColor: newStatus.bgColor, color: newStatus.color }}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: newStatus.color }} />
                    {newStatus.label}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Status Options */}
        <div className="p-6 space-y-3">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Selectionner le nouveau statut
          </p>
          {STATUS_OPTIONS.map((status) => {
            const Icon = status.icon;
            const isSelected = selectedStatus === status.value;
            const isCurrent = vehicle.status === status.value;

            return (
              <button
                key={status.value}
                type="button"
                onClick={() => setSelectedStatus(status.value)}
                disabled={isSubmitting}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-4 ${
                  isSelected ? 'shadow-md' : 'hover:shadow-sm'
                } ${isCurrent ? 'opacity-60' : ''}`}
                style={{
                  borderColor: isSelected ? status.color : '#E8ECEC',
                  backgroundColor: isSelected ? status.bgColor : 'white',
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: isSelected ? 'white' : status.bgColor }}
                >
                  <Icon className="w-6 h-6" style={{ color: status.color }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold" style={{ color: isSelected ? status.color : '#191919' }}>
                      {status.label}
                    </p>
                    {isCurrent && (
                      <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                        Actuel
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{status.description}</p>
                </div>
                {isSelected && (
                  <CheckCircle className="w-6 h-6 flex-shrink-0" style={{ color: status.color }} />
                )}
              </button>
            );
          })}
        </div>

        {/* Error */}
        {error && (
          <div className="px-6 pb-4">
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t-2 bg-gray-50" style={{ borderColor: '#E8ECEC' }}>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-6 py-3 rounded-xl font-semibold transition-all hover:bg-gray-200 disabled:opacity-50"
            style={{ backgroundColor: '#E8ECEC', color: '#6B7280' }}
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting || !selectedStatus || selectedStatus === vehicle.status}
            className="flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            style={{ backgroundColor: newStatus?.color || '#6A8A82' }}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Mise a jour...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                <span>Confirmer</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
