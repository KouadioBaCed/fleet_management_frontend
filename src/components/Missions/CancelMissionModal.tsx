import { useState } from 'react';
import {
  X,
  AlertTriangle,
  XCircle,
  Loader2,
  MapPin,
  User,
  Car,
  Calendar,
  Bell,
} from 'lucide-react';
import type { Mission } from '@/types';

interface CancelMissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  mission: Mission | null;
}

const CANCELLATION_REASONS = [
  { value: 'client_request', label: 'Demande du client', description: 'Le client a demande l\'annulation' },
  { value: 'driver_unavailable', label: 'Conducteur indisponible', description: 'Le conducteur ne peut pas effectuer la mission' },
  { value: 'vehicle_issue', label: 'Probleme vehicule', description: 'Le vehicule est en panne ou indisponible' },
  { value: 'schedule_conflict', label: 'Conflit de planning', description: 'Incompatibilite avec d\'autres missions' },
  { value: 'weather', label: 'Conditions meteo', description: 'Conditions meteorologiques defavorables' },
  { value: 'other', label: 'Autre motif', description: 'Specifiez le motif ci-dessous' },
];

export default function CancelMissionModal({ isOpen, onClose, onConfirm, mission }: CancelMissionModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [customReason, setCustomReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    let reason = '';

    if (selectedReason === 'other') {
      if (!customReason.trim()) {
        setError('Veuillez specifier le motif d\'annulation');
        return;
      }
      reason = customReason.trim();
    } else {
      const selected = CANCELLATION_REASONS.find(r => r.value === selectedReason);
      if (!selected) {
        setError('Veuillez selectionner un motif d\'annulation');
        return;
      }
      reason = selected.label;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onConfirm(reason);
      handleClose();
    } catch (err: any) {
      console.error('Failed to cancel mission:', err);
      setError(err.response?.data?.error || 'Erreur lors de l\'annulation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedReason('');
    setCustomReason('');
    setError(null);
    setIsSubmitting(false);
    onClose();
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isOpen || !mission) return null;

  const isAssigned = mission.status === 'assigned' || mission.status === 'in_progress';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2" style={{ borderColor: '#E8ECEC' }}>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-red-100">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold" style={{ color: '#191919' }}>
                Annuler la mission
              </h2>
              <p className="text-sm text-gray-500 font-mono">{mission.mission_code}</p>
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Mission Summary */}
          <div className="bg-red-50 rounded-xl p-4 border-2 border-red-200">
            <h3 className="font-semibold text-red-900 mb-3">{mission.title}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-red-700">
                <MapPin className="w-4 h-4" />
                <span>{mission.origin_address} → {mission.destination_address}</span>
              </div>
              <div className="flex items-center gap-2 text-red-700">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(mission.scheduled_start)}</span>
              </div>
              {mission.driver_name && (
                <div className="flex items-center gap-2 text-red-700">
                  <User className="w-4 h-4" />
                  <span>{mission.driver_name}</span>
                </div>
              )}
              {mission.vehicle_plate && (
                <div className="flex items-center gap-2 text-red-700">
                  <Car className="w-4 h-4" />
                  <span>{mission.vehicle_plate}</span>
                </div>
              )}
            </div>
          </div>

          {/* Driver Notification Warning */}
          {isAssigned && (
            <div className="flex items-start gap-3 p-4 rounded-xl" style={{ backgroundColor: '#FEF3C7' }}>
              <Bell className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#D97706' }} />
              <div>
                <p className="font-semibold text-amber-800">Notification conducteur</p>
                <p className="text-sm text-amber-700 mt-1">
                  Le conducteur {mission.driver_name} sera automatiquement notifie de l'annulation de cette mission.
                </p>
              </div>
            </div>
          )}

          {/* Cancellation Reason Selection */}
          <div>
            <label className="block text-sm font-semibold mb-3" style={{ color: '#191919' }}>
              Motif d'annulation *
            </label>
            <div className="space-y-2">
              {CANCELLATION_REASONS.map((reason) => (
                <label
                  key={reason.value}
                  className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedReason === reason.value ? 'shadow-md' : 'hover:shadow-sm'
                  }`}
                  style={{
                    borderColor: selectedReason === reason.value ? '#DC2626' : '#E8ECEC',
                    backgroundColor: selectedReason === reason.value ? '#FEF2F2' : 'white',
                  }}
                >
                  <input
                    type="radio"
                    name="cancellation_reason"
                    value={reason.value}
                    checked={selectedReason === reason.value}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <p className="font-semibold" style={{ color: selectedReason === reason.value ? '#DC2626' : '#191919' }}>
                      {reason.label}
                    </p>
                    <p className="text-sm text-gray-500">{reason.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Custom Reason Input */}
          {selectedReason === 'other' && (
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>
                Preciser le motif *
              </label>
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Décrivez le motif d'annulation..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border-2 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition-all resize-none"
                style={{ borderColor: '#E8ECEC' }}
              />
            </div>
          )}

          {/* Warning */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-gray-600" />
            <div>
              <p className="text-sm text-gray-600">
                <strong>Attention:</strong> L'annulation liberera automatiquement le vehicule et le conducteur s'ils sont assignes a cette mission.
              </p>
            </div>
          </div>
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
            Retour
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting || !selectedReason}
            className="flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 bg-red-600 hover:bg-red-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Annulation...</span>
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5" />
                <span>Confirmer l'annulation</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
