import { X, Wrench, Calendar, Car, Coins, Clock, MapPin, Gauge, FileText, CheckCircle } from 'lucide-react';
import type { Maintenance } from '@/api/maintenance';
import { useCurrency } from '@/store/settingsStore';
import { getCurrencySymbol } from '@/api/settings';

interface MaintenanceDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  maintenance: Maintenance | null;
  statusConfig: Record<string, { bg: string; text: string; label: string; dot: string }>;
  typeConfig: Record<string, { bg: string; text: string; label: string }>;
}

export default function MaintenanceDetailsModal({
  isOpen,
  onClose,
  maintenance,
  statusConfig,
  typeConfig
}: MaintenanceDetailsModalProps) {
  const currency = useCurrency();
  const currencySymbol = getCurrencySymbol(currency);

  if (!isOpen || !maintenance) return null;

  const status = statusConfig[maintenance.status] || statusConfig.scheduled;
  const type = typeConfig[maintenance.maintenance_type] || typeConfig.other;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 border-b-2 px-6 py-4" style={{ borderColor: '#E8ECEC' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: status.bg }}>
                <Wrench className="w-6 h-6" style={{ color: status.dot }} />
              </div>
              <div>
                <h2 className="text-xl font-bold" style={{ color: '#191919' }}>
                  {maintenance.maintenance_type_display}
                </h2>
                <p className="text-sm font-medium text-gray-500">
                  {maintenance.vehicle_plate}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Status & Type Badges */}
          <div className="flex items-center gap-2 mt-4">
            <span
              className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2"
              style={{ backgroundColor: status.bg, color: status.text }}
            >
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: status.dot }} />
              {status.label}
            </span>
            <span
              className="px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ backgroundColor: type.bg, color: type.text }}
            >
              {type.label}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Description */}
          <div className="p-4 rounded-xl" style={{ backgroundColor: '#F0F3F2' }}>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4" style={{ color: '#6A8A82' }} />
              <h3 className="text-sm font-bold" style={{ color: '#191919' }}>Description</h3>
            </div>
            <p className="text-sm text-gray-700">{maintenance.description || 'Aucune description'}</p>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Vehicle */}
            <div className="p-4 rounded-xl border-2" style={{ borderColor: '#E8ECEC' }}>
              <div className="flex items-center gap-2 mb-2">
                <Car className="w-4 h-4" style={{ color: '#6A8A82' }} />
                <span className="text-xs font-semibold text-gray-600">VÉHICULE</span>
              </div>
              <p className="text-lg font-bold" style={{ color: '#191919' }}>{maintenance.vehicle_plate}</p>
            </div>

            {/* Scheduled Date */}
            <div className="p-4 rounded-xl border-2" style={{ borderColor: '#E8ECEC' }}>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4" style={{ color: '#B87333' }} />
                <span className="text-xs font-semibold text-gray-600">DATE PROGRAMMÉE</span>
              </div>
              <p className="text-lg font-bold" style={{ color: '#191919' }}>
                {new Date(maintenance.scheduled_date).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>

            {/* Mileage at Service */}
            <div className="p-4 rounded-xl border-2" style={{ borderColor: '#E8ECEC' }}>
              <div className="flex items-center gap-2 mb-2">
                <Gauge className="w-4 h-4" style={{ color: '#6A8A82' }} />
                <span className="text-xs font-semibold text-gray-600">KILOMÉTRAGE</span>
              </div>
              <p className="text-lg font-bold" style={{ color: '#191919' }}>
                {Number(maintenance.mileage_at_service).toLocaleString()} km
              </p>
            </div>

            {/* Total Cost */}
            <div className="p-4 rounded-xl border-2" style={{ borderColor: '#E8ECEC' }}>
              <div className="flex items-center gap-2 mb-2">
                <Coins className="w-4 h-4" style={{ color: '#B87333' }} />
                <span className="text-xs font-semibold text-gray-600">COÛT TOTAL</span>
              </div>
              <p className="text-lg font-bold" style={{ color: '#B87333' }}>
                {Number(maintenance.total_cost).toFixed(2)} {currencySymbol}
              </p>
            </div>
          </div>

          {/* Cost Breakdown */}
          {(maintenance.labor_cost > 0 || maintenance.parts_cost > 0) && (
            <div className="p-4 rounded-xl border-2" style={{ borderColor: '#F5E8DD', backgroundColor: '#FFFCFA' }}>
              <h3 className="text-sm font-bold mb-3" style={{ color: '#B87333' }}>Détail des coûts</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Main d'œuvre</p>
                  <p className="text-base font-semibold" style={{ color: '#191919' }}>
                    {Number(maintenance.labor_cost).toFixed(2)} {currencySymbol}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Pièces détachées</p>
                  <p className="text-base font-semibold" style={{ color: '#191919' }}>
                    {Number(maintenance.parts_cost).toFixed(2)} {currencySymbol}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Service Provider */}
          <div className="p-4 rounded-xl" style={{ backgroundColor: '#E8EFED' }}>
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4" style={{ color: '#6A8A82' }} />
              <span className="text-xs font-semibold" style={{ color: '#6A8A82' }}>PRESTATAIRE / GARAGE</span>
            </div>
            <p className="text-lg font-bold" style={{ color: '#191919' }}>
              {maintenance.service_provider || 'Non spécifié'}
            </p>
          </div>

          {/* Next Service Mileage */}
          {maintenance.next_service_mileage && (
            <div className="p-4 rounded-xl border-2 border-dashed" style={{ borderColor: '#6A8A82' }}>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4" style={{ color: '#6A8A82' }} />
                <span className="text-xs font-semibold" style={{ color: '#6A8A82' }}>PROCHAIN SERVICE</span>
              </div>
              <p className="text-lg font-bold" style={{ color: '#191919' }}>
                À {Number(maintenance.next_service_mileage).toLocaleString()} km
              </p>
            </div>
          )}

          {/* Completed Info */}
          {maintenance.status === 'completed' && maintenance.completed_date && (
            <div className="p-4 rounded-xl" style={{ backgroundColor: '#DBEAFE' }}>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4" style={{ color: '#1E40AF' }} />
                <span className="text-xs font-semibold" style={{ color: '#1E40AF' }}>COMPLÉTÉ LE</span>
              </div>
              <p className="text-lg font-bold" style={{ color: '#1E40AF' }}>
                {new Date(maintenance.completed_date).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          )}

          {/* Work Performed (if completed) */}
          {maintenance.work_performed && (
            <div className="p-4 rounded-xl border-2" style={{ borderColor: '#E8ECEC' }}>
              <h3 className="text-sm font-bold mb-2" style={{ color: '#191919' }}>Travaux effectués</h3>
              <p className="text-sm text-gray-700">{maintenance.work_performed}</p>
            </div>
          )}

          {/* Parts Replaced (if any) */}
          {maintenance.parts_replaced && (
            <div className="p-4 rounded-xl border-2" style={{ borderColor: '#E8ECEC' }}>
              <h3 className="text-sm font-bold mb-2" style={{ color: '#191919' }}>Pièces remplacées</h3>
              <p className="text-sm text-gray-700">{maintenance.parts_replaced}</p>
            </div>
          )}

          {/* Notes */}
          {maintenance.notes && (
            <div className="p-4 rounded-xl border-2" style={{ borderColor: '#E8ECEC' }}>
              <h3 className="text-sm font-bold mb-2" style={{ color: '#191919' }}>Notes</h3>
              <p className="text-sm text-gray-700">{maintenance.notes}</p>
            </div>
          )}

          {/* Created Info */}
          <div className="text-xs text-gray-400 text-center pt-2">
            Créé le {new Date(maintenance.created_at).toLocaleDateString('fr-FR')}
            {maintenance.created_by_name && ` par ${maintenance.created_by_name}`}
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t-2 px-6 py-4 flex justify-end" style={{ borderColor: '#E8ECEC' }}>
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl font-semibold transition-all hover:shadow-md"
            style={{ backgroundColor: '#E8EFED', color: '#6A8A82' }}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
