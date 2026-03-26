import { useState, useEffect, useMemo } from 'react';
import {
  X,
  Fuel,
  Car,
  Coins,
  MapPin,
  Gauge,
  Droplets,
  Calendar,
  Calculator,
  CheckCircle,
  Loader2,
  Search,
  Info,
  AlertTriangle
} from 'lucide-react';
import { vehiclesApi } from '@/api/vehicles';
import { useCurrency } from '@/store/settingsStore';
import { getCurrencySymbol } from '@/api/settings';
import type { Vehicle } from '@/types';
import type { FuelRecord, UpdateFuelData } from '@/api/fuel';

interface EditFuelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: number, data: UpdateFuelData) => Promise<void>;
  record: FuelRecord | null;
}

const FUEL_TYPE_CONFIG = {
  gasoline: { label: 'Essence', icon: '⛽', color: '#6A8A82', bg: '#E8EFED' },
  diesel: { label: 'Diesel', icon: '🛢️', color: '#B87333', bg: '#F5E8DD' },
  electric: { label: 'Électrique', icon: '⚡', color: '#3B82F6', bg: '#DBEAFE' },
};

const POPULAR_STATIONS = [
  'Total', 'Shell', 'BP', 'Esso', 'Carrefour', 'Leclerc', 'Intermarché', 'Auchan',
];

export default function EditFuelModal({ isOpen, onClose, onSubmit, record }: EditFuelModalProps) {
  const currency = useCurrency();
  const currencySymbol = getCurrencySymbol(currency);

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchVehicle, setSearchVehicle] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form state
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [quantity, setQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [totalCost, setTotalCost] = useState('');
  const [stationName, setStationName] = useState('');
  const [stationAddress, setStationAddress] = useState('');
  const [mileage, setMileage] = useState('');
  const [refuelDate, setRefuelDate] = useState('');
  const [isFullTank, setIsFullTank] = useState(true);
  const [notes, setNotes] = useState('');
  const [manualTotal, setManualTotal] = useState(false);

  // Fetch vehicles
  useEffect(() => {
    if (isOpen) {
      fetchVehicles();
    }
  }, [isOpen]);

  // Load record data
  useEffect(() => {
    if (record && isOpen && vehicles.length > 0) {
      const vehicle = vehicles.find(v => v.id === record.vehicle);
      setSelectedVehicle(vehicle || null);
      setQuantity(String(record.quantity));
      setUnitPrice(String(record.unit_price));
      setTotalCost(String(record.total_cost));
      setStationName(record.station_name);
      setStationAddress(record.station_address || '');
      setMileage(String(record.mileage_at_refuel));
      setRefuelDate(new Date(record.refuel_date).toISOString().slice(0, 16));
      setIsFullTank(record.is_full_tank);
      setNotes(record.notes || '');
      setManualTotal(true);
      setErrors({});
    }
  }, [record, isOpen, vehicles]);

  // Auto-calculate total
  useEffect(() => {
    if (!manualTotal && quantity && unitPrice) {
      const calculatedTotal = parseFloat(quantity) * parseFloat(unitPrice);
      setTotalCost(calculatedTotal.toFixed(2));
    }
  }, [quantity, unitPrice, manualTotal]);

  const fetchVehicles = async () => {
    setIsLoadingVehicles(true);
    try {
      const response = await vehiclesApi.getAll();
      setVehicles(response.results || response);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setIsLoadingVehicles(false);
    }
  };

  const filteredVehicles = useMemo(() => {
    if (!searchVehicle) return vehicles;
    const search = searchVehicle.toLowerCase();
    return vehicles.filter(v =>
      v.license_plate.toLowerCase().includes(search) ||
      v.brand.toLowerCase().includes(search) ||
      v.model.toLowerCase().includes(search)
    );
  }, [vehicles, searchVehicle]);

  const handleSelectVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setErrors(prev => ({ ...prev, vehicle: '' }));
  };

  const handleTotalChange = (value: string) => {
    setTotalCost(value);
    setManualTotal(true);
  };

  const handleQuantityChange = (value: string) => {
    setQuantity(value);
    setManualTotal(false);
  };

  const handleUnitPriceChange = (value: string) => {
    setUnitPrice(value);
    setManualTotal(false);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!selectedVehicle) newErrors.vehicle = 'Veuillez sélectionner un véhicule';
    if (!quantity || parseFloat(quantity) <= 0) newErrors.quantity = 'La quantité doit être supérieure à 0';
    if (!unitPrice || parseFloat(unitPrice) <= 0) newErrors.unitPrice = 'Le prix unitaire doit être supérieur à 0';
    if (!totalCost || parseFloat(totalCost) <= 0) newErrors.totalCost = 'Le coût total doit être supérieur à 0';
    if (!stationName.trim()) newErrors.stationName = 'Veuillez indiquer le nom de la station';
    if (!mileage || parseFloat(mileage) <= 0) newErrors.mileage = 'Le kilométrage doit être supérieur à 0';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || !selectedVehicle || !record) return;

    setIsSubmitting(true);
    try {
      await onSubmit(record.id, {
        vehicle: selectedVehicle.id,
        refuel_date: new Date(refuelDate).toISOString(),
        station_name: stationName,
        station_address: stationAddress,
        fuel_type: selectedVehicle.fuel_type === 'hybrid' ? 'gasoline' : selectedVehicle.fuel_type,
        quantity: parseFloat(quantity),
        unit_price: parseFloat(unitPrice),
        total_cost: parseFloat(totalCost),
        mileage_at_refuel: parseFloat(mileage),
        is_full_tank: isFullTank,
        notes: notes,
      });
      onClose();
    } catch (error) {
      console.error('Error updating fuel record:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !record) return null;

  const fuelConfig = selectedVehicle
    ? FUEL_TYPE_CONFIG[selectedVehicle.fuel_type === 'hybrid' ? 'gasoline' : selectedVehicle.fuel_type as keyof typeof FUEL_TYPE_CONFIG]
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b-2 flex items-center justify-between flex-shrink-0" style={{ borderColor: '#E8ECEC' }}>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#F5E8DD' }}>
              <Fuel className="w-5 h-5" style={{ color: '#B87333' }} />
            </div>
            <div>
              <h2 className="text-xl font-bold" style={{ color: '#191919' }}>Modifier le Ravitaillement</h2>
              <p className="text-sm text-gray-500">{record.station_name} - {record.vehicle_plate}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Left Column - Vehicle Selection */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>
                  <Car className="w-4 h-4 inline mr-2" style={{ color: '#6A8A82' }} />
                  Véhicule *
                </label>

                {/* Search */}
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher un véhicule..."
                    value={searchVehicle}
                    onChange={(e) => setSearchVehicle(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 text-sm focus:ring-2 focus:ring-sage/20 outline-none transition-all text-gray-900 placeholder-gray-400"
                    style={{ borderColor: '#E8ECEC' }}
                  />
                </div>

                {/* Vehicle Grid */}
                {isLoadingVehicles ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#6A8A82' }} />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-2">
                    {filteredVehicles.map((vehicle) => {
                      const isSelected = selectedVehicle?.id === vehicle.id;
                      const vFuelConfig = FUEL_TYPE_CONFIG[vehicle.fuel_type === 'hybrid' ? 'gasoline' : vehicle.fuel_type as keyof typeof FUEL_TYPE_CONFIG];

                      return (
                        <button
                          key={vehicle.id}
                          onClick={() => handleSelectVehicle(vehicle)}
                          className={`p-3 rounded-xl border-2 text-left transition-all ${isSelected ? 'shadow-md' : 'hover:border-gray-300'}`}
                          style={{
                            borderColor: isSelected ? '#6A8A82' : '#E8ECEC',
                            backgroundColor: isSelected ? '#E8EFED' : '#ffffff',
                          }}
                        >
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-lg">{vFuelConfig?.icon || '🚗'}</span>
                            <span className="font-bold text-sm" style={{ color: '#191919' }}>{vehicle.license_plate}</span>
                          </div>
                          <p className="text-xs text-gray-500">{vehicle.brand} {vehicle.model}</p>
                        </button>
                      );
                    })}
                  </div>
                )}
                {errors.vehicle && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {errors.vehicle}
                  </p>
                )}
              </div>

              {/* Selected Vehicle Info */}
              {selectedVehicle && (
                <div className="p-4 rounded-xl border-2" style={{ borderColor: fuelConfig?.color, backgroundColor: fuelConfig?.bg }}>
                  <div className="flex items-center space-x-3 mb-3">
                    <span className="text-2xl">{fuelConfig?.icon}</span>
                    <div>
                      <p className="font-bold" style={{ color: fuelConfig?.color }}>{selectedVehicle.license_plate}</p>
                      <p className="text-sm text-gray-600">{selectedVehicle.brand} {selectedVehicle.model}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Station Selection */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>
                  <MapPin className="w-4 h-4 inline mr-2" style={{ color: '#B87333' }} />
                  Station / Lieu *
                </label>

                <div className="flex flex-wrap gap-2 mb-3">
                  {POPULAR_STATIONS.map((station) => (
                    <button
                      key={station}
                      type="button"
                      onClick={() => setStationName(station)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${stationName === station ? 'shadow-sm' : 'hover:bg-gray-100'}`}
                      style={{
                        backgroundColor: stationName === station ? '#F5E8DD' : '#F8FAF9',
                        color: stationName === station ? '#B87333' : '#6B7280',
                      }}
                    >
                      {station}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  value={stationName}
                  onChange={(e) => setStationName(e.target.value)}
                  placeholder="Nom de la station"
                  className={`w-full px-4 py-2.5 rounded-xl border-2 text-sm focus:ring-2 focus:ring-sage/20 outline-none transition-all text-gray-900 placeholder-gray-400 ${errors.stationName ? 'border-red-400' : ''}`}
                  style={{ borderColor: errors.stationName ? '#f87171' : '#E8ECEC' }}
                />
                {errors.stationName && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {errors.stationName}
                  </p>
                )}

                <input
                  type="text"
                  value={stationAddress}
                  onChange={(e) => setStationAddress(e.target.value)}
                  placeholder="Adresse (optionnel)"
                  className="w-full px-4 py-2.5 rounded-xl border-2 text-sm focus:ring-2 focus:ring-sage/20 outline-none transition-all mt-2 text-gray-900 placeholder-gray-400"
                  style={{ borderColor: '#E8ECEC' }}
                />
              </div>
            </div>

            {/* Right Column - Fuel Details */}
            <div className="space-y-4">
              {/* Quantity */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>
                  <Droplets className="w-4 h-4 inline mr-2" style={{ color: '#3B82F6' }} />
                  Quantité (Litres) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={quantity}
                    onChange={(e) => handleQuantityChange(e.target.value)}
                    placeholder="0.00"
                    className={`w-full px-4 py-3 rounded-xl border-2 text-lg font-bold focus:ring-2 focus:ring-sage/20 outline-none transition-all text-gray-900 placeholder-gray-400 ${errors.quantity ? 'border-red-400' : ''}`}
                    style={{ borderColor: errors.quantity ? '#f87171' : '#E8ECEC' }}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">L</span>
                </div>
                {errors.quantity && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {errors.quantity}
                  </p>
                )}
              </div>

              {/* Unit Price */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>
                  <Coins className="w-4 h-4 inline mr-2" style={{ color: '#6A8A82' }} />
                  Prix unitaire ({currencySymbol}/L) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={unitPrice}
                    onChange={(e) => handleUnitPriceChange(e.target.value)}
                    placeholder="0.000"
                    className={`w-full px-4 py-3 rounded-xl border-2 text-lg font-bold focus:ring-2 focus:ring-sage/20 outline-none transition-all text-gray-900 placeholder-gray-400 ${errors.unitPrice ? 'border-red-400' : ''}`}
                    style={{ borderColor: errors.unitPrice ? '#f87171' : '#E8ECEC' }}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">{currencySymbol}/L</span>
                </div>
                {errors.unitPrice && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {errors.unitPrice}
                  </p>
                )}
              </div>

              {/* Total Cost */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>
                  <Calculator className="w-4 h-4 inline mr-2" style={{ color: '#B87333' }} />
                  Coût total *
                  {!manualTotal && quantity && unitPrice && (
                    <span className="text-xs text-gray-400 ml-2">(calculé)</span>
                  )}
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">{currencySymbol}</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={totalCost}
                    onChange={(e) => handleTotalChange(e.target.value)}
                    placeholder="0.00"
                    className={`w-full pl-8 pr-4 py-3 rounded-xl border-2 text-lg font-bold focus:ring-2 focus:ring-sage/20 outline-none transition-all ${errors.totalCost ? 'border-red-400' : ''}`}
                    style={{
                      borderColor: errors.totalCost ? '#f87171' : '#B87333',
                      backgroundColor: '#FEF3C7',
                      color: '#B87333'
                    }}
                  />
                </div>
                {errors.totalCost && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {errors.totalCost}
                  </p>
                )}
              </div>

              {/* Mileage */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>
                  <Gauge className="w-4 h-4 inline mr-2" style={{ color: '#6A8A82' }} />
                  Kilométrage au compteur *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    value={mileage}
                    onChange={(e) => setMileage(e.target.value)}
                    placeholder="0"
                    className={`w-full px-4 py-3 rounded-xl border-2 text-lg font-bold focus:ring-2 focus:ring-sage/20 outline-none transition-all text-gray-900 placeholder-gray-400 ${errors.mileage ? 'border-red-400' : ''}`}
                    style={{ borderColor: errors.mileage ? '#f87171' : '#E8ECEC' }}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">km</span>
                </div>
                {errors.mileage && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {errors.mileage}
                  </p>
                )}
              </div>

              {/* Date & Time */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>
                  <Calendar className="w-4 h-4 inline mr-2" style={{ color: '#6A8A82' }} />
                  Date et heure
                </label>
                <input
                  type="datetime-local"
                  value={refuelDate}
                  onChange={(e) => setRefuelDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border-2 text-sm focus:ring-2 focus:ring-sage/20 outline-none transition-all text-gray-900"
                  style={{ borderColor: '#E8ECEC' }}
                />
              </div>

              {/* Full Tank Toggle */}
              <div className="p-4 rounded-xl border-2 flex items-center justify-between" style={{ borderColor: '#E8ECEC' }}>
                <div className="flex items-center space-x-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: isFullTank ? '#D1FAE5' : '#FEE2E2' }}
                  >
                    {isFullTank ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <Info className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: '#191919' }}>Plein complet</p>
                    <p className="text-xs text-gray-500">
                      {isFullTank ? 'Réservoir rempli' : 'Ravitaillement partiel'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFullTank(!isFullTank)}
                  className={`w-14 h-7 rounded-full transition-all relative ${isFullTank ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-md absolute top-1 transition-all ${isFullTank ? 'right-1' : 'left-1'}`}
                  />
                </button>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Commentaires..."
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl border-2 text-sm focus:ring-2 focus:ring-sage/20 outline-none transition-all resize-none text-gray-900 placeholder-gray-400"
                  style={{ borderColor: '#E8ECEC' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t-2 flex items-center justify-end space-x-3 flex-shrink-0" style={{ borderColor: '#E8ECEC' }}>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-semibold transition-all"
            style={{ backgroundColor: '#E8ECEC', color: '#6B7280' }}
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl font-semibold text-white transition-all hover:shadow-lg disabled:opacity-50 flex items-center space-x-2"
            style={{ backgroundColor: '#B87333' }}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Enregistrement...</span>
              </>
            ) : (
              <span>Enregistrer les modifications</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
