import { X, Fuel, Car, DollarSign, MapPin, Gauge, Droplets, Calendar, CheckCircle, FileText } from 'lucide-react';
import type { FuelRecord } from '@/api/fuel';
import { useCurrency } from '@/store/settingsStore';
import { getCurrencySymbol } from '@/api/settings';

interface FuelDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: FuelRecord | null;
}

const FUEL_TYPE_CONFIG = {
  gasoline: { label: 'Essence', icon: '⛽', color: '#6A8A82', bg: '#E8EFED' },
  diesel: { label: 'Diesel', icon: '🛢️', color: '#B87333', bg: '#F5E8DD' },
  electric: { label: 'Électrique', icon: '⚡', color: '#3B82F6', bg: '#DBEAFE' },
};

export default function FuelDetailsModal({ isOpen, onClose, record }: FuelDetailsModalProps) {
  const currency = useCurrency();
  const currencySymbol = getCurrencySymbol(currency);

  if (!isOpen || !record) return null;

  const fuelConfig = FUEL_TYPE_CONFIG[record.fuel_type as keyof typeof FUEL_TYPE_CONFIG] || FUEL_TYPE_CONFIG.gasoline;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl max-h-[90vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 border-b-2 px-4 sm:px-6 py-3 sm:py-4" style={{ borderColor: '#E8ECEC' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
              <div
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center text-xl sm:text-2xl flex-shrink-0"
                style={{ backgroundColor: fuelConfig.bg }}
              >
                {fuelConfig.icon}
              </div>
              <div className="min-w-0">
                <h2 className="text-base sm:text-xl font-bold truncate" style={{ color: '#191919' }}>
                  {record.station_name}
                </h2>
                <p className="text-xs sm:text-sm text-gray-500">{record.vehicle_plate}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0">
              <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
            </button>
          </div>

          {/* Type badge */}
          <div className="flex flex-wrap items-center gap-2 mt-3 sm:mt-4">
            <span
              className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold"
              style={{ backgroundColor: fuelConfig.bg, color: fuelConfig.color }}
            >
              {fuelConfig.label}
            </span>
            {record.is_full_tank && (
              <span className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold bg-green-100 text-green-700 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Plein complet
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Cost Summary */}
          <div
            className="p-4 sm:p-5 rounded-lg sm:rounded-xl text-center"
            style={{ backgroundColor: '#FEF3C7', border: '2px solid #B87333' }}
          >
            <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Coût Total</p>
            <p className="text-2xl sm:text-4xl font-bold" style={{ color: '#B87333' }}>
              {Number(record.total_cost).toFixed(2)} {currencySymbol}
            </p>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-2 sm:gap-4">
            {/* Quantity */}
            <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl border-2" style={{ borderColor: '#E8ECEC' }}>
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                <Droplets className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: '#3B82F6' }} />
                <span className="text-[10px] sm:text-xs font-semibold text-gray-600">QUANTITÉ</span>
              </div>
              <p className="text-lg sm:text-2xl font-bold" style={{ color: '#3B82F6' }}>
                {Number(record.quantity).toFixed(2)} L
              </p>
            </div>

            {/* Unit Price */}
            <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl border-2" style={{ borderColor: '#E8ECEC' }}>
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: '#6A8A82' }} />
                <span className="text-[10px] sm:text-xs font-semibold text-gray-600">PRIX/L</span>
              </div>
              <p className="text-lg sm:text-2xl font-bold" style={{ color: '#6A8A82' }}>
                {Number(record.unit_price).toFixed(3)}
              </p>
            </div>

            {/* Mileage */}
            <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl border-2" style={{ borderColor: '#E8ECEC' }}>
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                <Gauge className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: '#6B7280' }} />
                <span className="text-[10px] sm:text-xs font-semibold text-gray-600">KILOMÉTRAGE</span>
              </div>
              <p className="text-lg sm:text-2xl font-bold" style={{ color: '#191919' }}>
                {Number(record.mileage_at_refuel).toLocaleString()} km
              </p>
            </div>

            {/* Consumption */}
            {record.calculated_consumption && (
              <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl border-2" style={{ borderColor: '#059669', backgroundColor: '#D1FAE5' }}>
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                  <Fuel className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: '#059669' }} />
                  <span className="text-[10px] sm:text-xs font-semibold" style={{ color: '#059669' }}>CONSO.</span>
                </div>
                <p className="text-lg sm:text-2xl font-bold" style={{ color: '#059669' }}>
                  {Number(record.calculated_consumption).toFixed(1)} L/100
                </p>
              </div>
            )}
          </div>

          {/* Vehicle Info */}
          <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl" style={{ backgroundColor: '#E8EFED' }}>
            <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
              <Car className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: '#6A8A82' }} />
              <span className="text-xs sm:text-sm font-semibold" style={{ color: '#6A8A82' }}>VÉHICULE</span>
            </div>
            <p className="text-base sm:text-lg font-bold" style={{ color: '#191919' }}>
              {record.vehicle_plate}
            </p>
            {record.vehicle_brand && (
              <p className="text-xs sm:text-sm text-gray-600">
                {record.vehicle_brand} {record.vehicle_model}
              </p>
            )}
          </div>

          {/* Station Info */}
          <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl border-2" style={{ borderColor: '#E8ECEC' }}>
            <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
              <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: '#B87333' }} />
              <span className="text-xs sm:text-sm font-semibold text-gray-600">STATION</span>
            </div>
            <p className="text-base sm:text-lg font-bold" style={{ color: '#191919' }}>
              {record.station_name}
            </p>
            {record.station_address && (
              <p className="text-xs sm:text-sm text-gray-600 mt-1">{record.station_address}</p>
            )}
          </div>

          {/* Date */}
          <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl border-2" style={{ borderColor: '#E8ECEC' }}>
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: '#6A8A82' }} />
              <span className="text-xs sm:text-sm font-semibold text-gray-600">DATE</span>
            </div>
            <p className="text-base sm:text-lg font-bold" style={{ color: '#191919' }}>
              {new Date(record.refuel_date).toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
            <p className="text-xs sm:text-sm text-gray-500">
              à {new Date(record.refuel_date).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>

          {/* Notes */}
          {record.notes && (
            <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl border-2" style={{ borderColor: '#E8ECEC' }}>
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: '#6B7280' }} />
                <span className="text-xs sm:text-sm font-semibold text-gray-600">NOTES</span>
              </div>
              <p className="text-xs sm:text-sm text-gray-700">{record.notes}</p>
            </div>
          )}

          {/* Created Info */}
          <div className="text-[10px] sm:text-xs text-gray-400 text-center pt-2">
            Enregistré le {new Date(record.created_at).toLocaleDateString('fr-FR')}
            {record.created_by_name && ` par ${record.created_by_name}`}
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t-2 px-4 sm:px-6 py-3 sm:py-4 flex justify-end" style={{ borderColor: '#E8ECEC' }}>
          <button
            onClick={onClose}
            className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base transition-all hover:shadow-md"
            style={{ backgroundColor: '#E8EFED', color: '#6A8A82' }}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
