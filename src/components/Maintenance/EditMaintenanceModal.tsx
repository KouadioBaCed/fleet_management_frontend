import { useState, useEffect } from 'react';
import { X, Wrench, Calendar, Car, Coins, FileText, Loader2, Gauge, MapPin, AlertTriangle } from 'lucide-react';
import { vehiclesApi } from '@/api/vehicles';
import { useCurrency } from '@/store/settingsStore';
import { getCurrencySymbol } from '@/api/settings';
import type { Vehicle } from '@/types';
import type { Maintenance } from '@/api/maintenance';

interface EditMaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  maintenance: Maintenance | null;
}

const MAINTENANCE_TYPES = [
  { value: 'preventive', label: 'Préventive' },
  { value: 'oil_change', label: 'Vidange' },
  { value: 'tire_change', label: 'Changement pneus' },
  { value: 'brake_service', label: 'Freins' },
  { value: 'inspection', label: 'Contrôle technique' },
  { value: 'repair', label: 'Réparation' },
  { value: 'other', label: 'Autre' },
];

const STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Planifiée' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'completed', label: 'Terminée' },
  { value: 'cancelled', label: 'Annulée' },
];

export default function EditMaintenanceModal({ isOpen, onClose, onSubmit, maintenance }: EditMaintenanceModalProps) {
  const currency = useCurrency();
  const currencySymbol = getCurrencySymbol(currency);

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    vehicle: '',
    maintenance_type: '',
    scheduled_date: '',
    description: '',
    service_provider: '',
    labor_cost: '',
    parts_cost: '',
    total_cost: '',
    mileage_at_service: '',
    next_service_mileage: '',
    notes: '',
    status: 'scheduled'
  });

  // Fetch vehicles on mount
  useEffect(() => {
    if (isOpen) {
      fetchVehicles();
    }
  }, [isOpen]);

  // Load maintenance data when modal opens
  useEffect(() => {
    if (maintenance && isOpen) {
      const scheduledDate = maintenance.scheduled_date
        ? new Date(maintenance.scheduled_date).toISOString().slice(0, 16)
        : '';

      setFormData({
        vehicle: String(maintenance.vehicle),
        maintenance_type: maintenance.maintenance_type,
        scheduled_date: scheduledDate,
        description: maintenance.description || '',
        service_provider: maintenance.service_provider || '',
        labor_cost: maintenance.labor_cost ? String(maintenance.labor_cost) : '',
        parts_cost: maintenance.parts_cost ? String(maintenance.parts_cost) : '',
        total_cost: maintenance.total_cost ? String(maintenance.total_cost) : '',
        mileage_at_service: maintenance.mileage_at_service ? String(maintenance.mileage_at_service) : '',
        next_service_mileage: maintenance.next_service_mileage ? String(maintenance.next_service_mileage) : '',
        notes: maintenance.notes || '',
        status: maintenance.status || 'scheduled'
      });
      setErrors({});
    }
  }, [maintenance, isOpen]);

  // Auto-calculate total cost
  useEffect(() => {
    const labor = parseFloat(formData.labor_cost) || 0;
    const parts = parseFloat(formData.parts_cost) || 0;
    if (labor > 0 || parts > 0) {
      setFormData(prev => ({ ...prev, total_cost: String(labor + parts) }));
    }
  }, [formData.labor_cost, formData.parts_cost]);

  const fetchVehicles = async () => {
    setIsLoadingVehicles(true);
    try {
      const response = await vehiclesApi.getAll();
      setVehicles(response.results);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setIsLoadingVehicles(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.vehicle) newErrors.vehicle = 'Sélectionnez un véhicule';
    if (!formData.maintenance_type) newErrors.maintenance_type = 'Sélectionnez un type de maintenance';
    if (!formData.scheduled_date) newErrors.scheduled_date = 'Sélectionnez une date';
    if (!formData.description.trim()) newErrors.description = 'Entrez une description';
    if (!formData.service_provider.trim()) newErrors.service_provider = 'Entrez le prestataire';
    if (!formData.total_cost) newErrors.total_cost = 'Entrez le coût total';
    if (!formData.mileage_at_service) newErrors.mileage_at_service = 'Entrez le kilométrage';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        vehicle: parseInt(formData.vehicle),
        maintenance_type: formData.maintenance_type,
        scheduled_date: formData.scheduled_date.split('T')[0],
        description: formData.description,
        service_provider: formData.service_provider,
        labor_cost: parseFloat(formData.labor_cost) || 0,
        parts_cost: parseFloat(formData.parts_cost) || 0,
        total_cost: parseFloat(formData.total_cost) || 0,
        mileage_at_service: parseFloat(formData.mileage_at_service),
        next_service_mileage: formData.next_service_mileage ? parseFloat(formData.next_service_mileage) : null,
        notes: formData.notes,
        status: formData.status
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !maintenance) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 border-b-2 px-6 py-4 flex items-center justify-between" style={{ borderColor: '#E8ECEC' }}>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#F5E8DD' }}>
              <Wrench className="w-5 h-5" style={{ color: '#B87333' }} />
            </div>
            <div>
              <h2 className="text-xl font-bold" style={{ color: '#191919' }}>Modifier la Maintenance</h2>
              <p className="text-sm text-gray-600">{maintenance.vehicle_plate}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Vehicle */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>
                <Car className="w-4 h-4 inline mr-2" style={{ color: '#6A8A82' }} />
                Véhicule *
              </label>
              {isLoadingVehicles ? (
                <div className="flex items-center justify-center py-3">
                  <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#6A8A82' }} />
                </div>
              ) : (
                <select
                  name="vehicle"
                  value={formData.vehicle}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all text-gray-900 ${
                    errors.vehicle ? 'border-red-400' : ''
                  }`}
                  style={{ borderColor: errors.vehicle ? '#f87171' : '#E8ECEC' }}
                  onFocus={(e) => { if (!errors.vehicle) e.target.style.borderColor = '#6A8A82'; }}
                  onBlur={(e) => { if (!errors.vehicle) e.target.style.borderColor = '#E8ECEC'; }}
                >
                  <option value="">Sélectionner un véhicule</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.license_plate} - {vehicle.brand} {vehicle.model}
                    </option>
                  ))}
                </select>
              )}
              {errors.vehicle && (
                <p className="text-red-500 text-sm mt-1 flex items-center space-x-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>{errors.vehicle}</span>
                </p>
              )}
            </div>

            {/* Maintenance Type */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>
                <Wrench className="w-4 h-4 inline mr-2" style={{ color: '#B87333' }} />
                Type de maintenance *
              </label>
              <select
                name="maintenance_type"
                value={formData.maintenance_type}
                onChange={handleChange}
                required
                className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all text-gray-900 ${
                  errors.maintenance_type ? 'border-red-400' : ''
                }`}
                style={{ borderColor: errors.maintenance_type ? '#f87171' : '#E8ECEC' }}
                onFocus={(e) => { if (!errors.maintenance_type) e.target.style.borderColor = '#6A8A82'; }}
                onBlur={(e) => { if (!errors.maintenance_type) e.target.style.borderColor = '#E8ECEC'; }}
              >
                <option value="">Sélectionner le type</option>
                {MAINTENANCE_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
              {errors.maintenance_type && (
                <p className="text-red-500 text-sm mt-1 flex items-center space-x-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>{errors.maintenance_type}</span>
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Scheduled Date */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>
                <Calendar className="w-4 h-4 inline mr-2" style={{ color: '#6A8A82' }} />
                Date programmée *
              </label>
              <input
                type="datetime-local"
                name="scheduled_date"
                value={formData.scheduled_date}
                onChange={handleChange}
                required
                className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all text-gray-900 ${
                  errors.scheduled_date ? 'border-red-400' : ''
                }`}
                style={{ borderColor: errors.scheduled_date ? '#f87171' : '#E8ECEC' }}
                onFocus={(e) => { if (!errors.scheduled_date) e.target.style.borderColor = '#6A8A82'; }}
                onBlur={(e) => { if (!errors.scheduled_date) e.target.style.borderColor = '#E8ECEC'; }}
              />
              {errors.scheduled_date && (
                <p className="text-red-500 text-sm mt-1 flex items-center space-x-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>{errors.scheduled_date}</span>
                </p>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>
                Statut
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border-2 outline-none transition-all text-gray-900"
                style={{ borderColor: '#E8ECEC' }}
                onFocus={(e) => e.target.style.borderColor = '#6A8A82'}
                onBlur={(e) => e.target.style.borderColor = '#E8ECEC'}
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Mileage */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>
                <Gauge className="w-4 h-4 inline mr-2" style={{ color: '#6A8A82' }} />
                Kilométrage actuel *
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="mileage_at_service"
                  value={formData.mileage_at_service}
                  onChange={handleChange}
                  placeholder="Ex: 45000"
                  required
                  className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all pr-12 text-gray-900 placeholder-gray-400 ${
                    errors.mileage_at_service ? 'border-red-400' : ''
                  }`}
                  style={{ borderColor: errors.mileage_at_service ? '#f87171' : '#E8ECEC' }}
                  onFocus={(e) => { if (!errors.mileage_at_service) e.target.style.borderColor = '#6A8A82'; }}
                  onBlur={(e) => { if (!errors.mileage_at_service) e.target.style.borderColor = '#E8ECEC'; }}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">km</span>
              </div>
              {errors.mileage_at_service && (
                <p className="text-red-500 text-sm mt-1 flex items-center space-x-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>{errors.mileage_at_service}</span>
                </p>
              )}
            </div>

            {/* Next Service Mileage */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>
                <Gauge className="w-4 h-4 inline mr-2" style={{ color: '#B87333' }} />
                Prochain service (km)
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="next_service_mileage"
                  value={formData.next_service_mileage}
                  onChange={handleChange}
                  placeholder="Ex: 55000"
                  className="w-full px-4 py-3 rounded-xl border-2 outline-none transition-all pr-12 text-gray-900 placeholder-gray-400"
                  style={{ borderColor: '#E8ECEC' }}
                  onFocus={(e) => e.target.style.borderColor = '#6A8A82'}
                  onBlur={(e) => e.target.style.borderColor = '#E8ECEC'}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">km</span>
              </div>
            </div>
          </div>

          {/* Service Provider */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>
              <MapPin className="w-4 h-4 inline mr-2" style={{ color: '#6A8A82' }} />
              Prestataire / Garage *
            </label>
            <input
              type="text"
              name="service_provider"
              value={formData.service_provider}
              onChange={handleChange}
              required
              placeholder="Nom du garage/atelier"
              className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all text-gray-900 placeholder-gray-400 ${
                errors.service_provider ? 'border-red-400' : ''
              }`}
              style={{ borderColor: errors.service_provider ? '#f87171' : '#E8ECEC' }}
              onFocus={(e) => { if (!errors.service_provider) e.target.style.borderColor = '#6A8A82'; }}
              onBlur={(e) => { if (!errors.service_provider) e.target.style.borderColor = '#E8ECEC'; }}
            />
            {errors.service_provider && (
              <p className="text-red-500 text-sm mt-1 flex items-center space-x-1">
                <AlertTriangle className="w-3 h-3" />
                <span>{errors.service_provider}</span>
              </p>
            )}
          </div>

          {/* Costs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>
                Main d'œuvre
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="labor_cost"
                  value={formData.labor_cost}
                  onChange={handleChange}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full pl-8 pr-4 py-3 rounded-xl border-2 outline-none transition-all text-gray-900 placeholder-gray-400"
                  style={{ borderColor: '#E8ECEC' }}
                  onFocus={(e) => e.target.style.borderColor = '#B87333'}
                  onBlur={(e) => e.target.style.borderColor = '#E8ECEC'}
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{currencySymbol}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>
                Pièces détachées
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="parts_cost"
                  value={formData.parts_cost}
                  onChange={handleChange}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full pl-8 pr-4 py-3 rounded-xl border-2 outline-none transition-all text-gray-900 placeholder-gray-400"
                  style={{ borderColor: '#E8ECEC' }}
                  onFocus={(e) => e.target.style.borderColor = '#B87333'}
                  onBlur={(e) => e.target.style.borderColor = '#E8ECEC'}
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{currencySymbol}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>
                <Coins className="w-4 h-4 inline mr-2" style={{ color: '#B87333' }} />
                Coût total *
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="total_cost"
                  value={formData.total_cost}
                  onChange={handleChange}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                  className={`w-full pl-8 pr-4 py-3 rounded-xl border-2 outline-none transition-all text-gray-900 placeholder-gray-400 ${
                    errors.total_cost ? 'border-red-400' : ''
                  }`}
                  style={{ borderColor: errors.total_cost ? '#f87171' : '#E8ECEC' }}
                  onFocus={(e) => { if (!errors.total_cost) e.target.style.borderColor = '#B87333'; }}
                  onBlur={(e) => { if (!errors.total_cost) e.target.style.borderColor = '#E8ECEC'; }}
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{currencySymbol}</span>
              </div>
              {errors.total_cost && (
                <p className="text-red-500 text-sm mt-1 flex items-center space-x-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>{errors.total_cost}</span>
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>
              <FileText className="w-4 h-4 inline mr-2" style={{ color: '#6A8A82' }} />
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={3}
              placeholder="Décrivez les travaux à effectuer..."
              className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all resize-none text-gray-900 placeholder-gray-400 ${
                errors.description ? 'border-red-400' : ''
              }`}
              style={{ borderColor: errors.description ? '#f87171' : '#E8ECEC' }}
              onFocus={(e) => { if (!errors.description) e.target.style.borderColor = '#6A8A82'; }}
              onBlur={(e) => { if (!errors.description) e.target.style.borderColor = '#E8ECEC'; }}
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1 flex items-center space-x-1">
                <AlertTriangle className="w-3 h-3" />
                <span>{errors.description}</span>
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>
              Notes additionnelles
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={2}
              placeholder="Informations supplémentaires (optionnel)..."
              className="w-full px-4 py-3 rounded-xl border-2 outline-none transition-all resize-none text-gray-900 placeholder-gray-400"
              style={{ borderColor: '#E8ECEC' }}
              onFocus={(e) => e.target.style.borderColor = '#6A8A82'}
              onBlur={(e) => e.target.style.borderColor = '#E8ECEC'}
            />
          </div>
        </form>

        {/* Footer */}
        <div className="flex-shrink-0 border-t-2 px-6 py-4 flex items-center justify-end space-x-3" style={{ borderColor: '#E8ECEC' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-6 py-3 rounded-xl font-semibold transition-all hover:bg-gray-100"
            style={{ color: '#6B7280' }}
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-3 rounded-xl text-white font-semibold shadow-lg hover:shadow-xl transition-all flex items-center space-x-2 disabled:opacity-50"
            style={{ backgroundColor: '#B87333' }}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
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
