import { useState, useEffect } from 'react';
import { X, Wrench, Calendar, Car, DollarSign, FileText, Gauge, MapPin, ChevronDown, ChevronUp, Check, Loader2, Shield, AlertTriangle, Package, Clock } from 'lucide-react';
import { vehiclesApi } from '@/api/vehicles';
import { useCurrency } from '@/store/settingsStore';
import { getCurrencySymbol } from '@/api/settings';
import type { Vehicle } from '@/types';

interface AddMaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  preselectedVehicleId?: number | null;
}

type MaintenanceCategory = 'preventive' | 'corrective';

interface MaintenanceTypeOption {
  value: string;
  label: string;
  description: string;
  icon: typeof Wrench;
  category: MaintenanceCategory;
}

const MAINTENANCE_TYPES: MaintenanceTypeOption[] = [
  // Préventive
  { value: 'preventive', label: 'Maintenance préventive', description: 'Entretien régulier planifié', icon: Shield, category: 'preventive' },
  { value: 'oil_change', label: 'Vidange', description: 'Changement d\'huile et filtres', icon: Package, category: 'preventive' },
  { value: 'tire_change', label: 'Changement pneus', description: 'Remplacement des pneumatiques', icon: Car, category: 'preventive' },
  { value: 'inspection', label: 'Contrôle technique', description: 'Inspection réglementaire', icon: FileText, category: 'preventive' },
  // Corrective
  { value: 'brake_service', label: 'Freins', description: 'Réparation système de freinage', icon: AlertTriangle, category: 'corrective' },
  { value: 'repair', label: 'Réparation', description: 'Réparation suite à panne/incident', icon: Wrench, category: 'corrective' },
  { value: 'other', label: 'Autre', description: 'Autre type d\'intervention', icon: Wrench, category: 'corrective' },
];

const WORK_TEMPLATES = [
  { label: 'Vidange complète', text: 'Vidange huile moteur, remplacement filtre à huile, filtre à air et filtre habitacle. Contrôle des niveaux.' },
  { label: 'Révision générale', text: 'Révision complète : vidange, freins, pneus, éclairage, batterie, courroies, liquides de refroidissement et freins.' },
  { label: 'Changement freins', text: 'Remplacement plaquettes de frein avant/arrière. Contrôle disques et liquide de frein.' },
  { label: 'Contrôle technique', text: 'Passage contrôle technique réglementaire. Vérification tous points de sécurité.' },
];

export default function AddMaintenanceModal({ isOpen, onClose, onSubmit, preselectedVehicleId }: AddMaintenanceModalProps) {
  const currency = useCurrency();
  const currencySymbol = getCurrencySymbol(currency);

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCostBreakdown, setShowCostBreakdown] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [selectedCategory, setSelectedCategory] = useState<MaintenanceCategory>('preventive');
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
    notes: ''
  });

  // Fetch vehicles on mount
  useEffect(() => {
    if (isOpen) {
      fetchVehicles();
    }
  }, [isOpen]);

  // Set preselected vehicle
  useEffect(() => {
    if (preselectedVehicleId && vehicles.length > 0) {
      const vehicle = vehicles.find(v => v.id === preselectedVehicleId);
      if (vehicle) {
        setFormData(prev => ({
          ...prev,
          vehicle: String(vehicle.id),
          mileage_at_service: String(vehicle.current_mileage || '')
        }));
      }
    }
  }, [preselectedVehicleId, vehicles]);

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

  const handleVehicleSelect = (vehicleId: string) => {
    const vehicle = vehicles.find(v => String(v.id) === vehicleId);
    setFormData(prev => ({
      ...prev,
      vehicle: vehicleId,
      mileage_at_service: vehicle ? String(vehicle.current_mileage || '') : ''
    }));
    if (errors.vehicle) {
      setErrors(prev => ({ ...prev, vehicle: '' }));
    }
  };

  const handleTypeSelect = (type: string) => {
    setFormData(prev => ({ ...prev, maintenance_type: type }));
    if (errors.maintenance_type) {
      setErrors(prev => ({ ...prev, maintenance_type: '' }));
    }
  };

  const applyTemplate = (text: string) => {
    setFormData(prev => ({ ...prev, description: text }));
    setShowTemplates(false);
    if (errors.description) {
      setErrors(prev => ({ ...prev, description: '' }));
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
        notes: formData.notes
      });

      // Reset form
      setFormData({
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
        notes: ''
      });
      setSelectedCategory('preventive');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const filteredTypes = MAINTENANCE_TYPES.filter(t => t.category === selectedCategory);
  const selectedVehicle = vehicles.find(v => String(v.id) === formData.vehicle);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 border-b-2 px-6 py-4 flex items-center justify-between" style={{ borderColor: '#E8ECEC' }}>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#E8EFED' }}>
              <Wrench className="w-6 h-6" style={{ color: '#6A8A82' }} />
            </div>
            <div>
              <h2 className="text-xl font-bold" style={{ color: '#191919' }}>Nouvelle Maintenance</h2>
              <p className="text-sm text-gray-600">Planifier une intervention sur un véhicule</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Step 1: Vehicle Selection */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-semibold mb-3" style={{ color: '#191919' }}>
              <Car className="w-4 h-4" style={{ color: '#6A8A82' }} />
              <span>1. Sélectionner le véhicule</span>
              <span className="text-red-500">*</span>
            </label>

            {isLoadingVehicles ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#6A8A82' }} />
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {vehicles.map((vehicle) => (
                  <button
                    key={vehicle.id}
                    type="button"
                    onClick={() => handleVehicleSelect(String(vehicle.id))}
                    className={`p-4 rounded-xl border-2 text-left transition-all hover:shadow-md ${
                      formData.vehicle === String(vehicle.id) ? 'ring-2 ring-offset-2' : ''
                    }`}
                    style={{
                      borderColor: formData.vehicle === String(vehicle.id) ? '#6A8A82' : '#E8ECEC',
                      backgroundColor: formData.vehicle === String(vehicle.id) ? '#E8EFED' : 'white',
                      ringColor: '#6A8A82'
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold" style={{ color: '#191919' }}>{vehicle.license_plate}</span>
                      {formData.vehicle === String(vehicle.id) && (
                        <Check className="w-5 h-5" style={{ color: '#6A8A82' }} />
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{vehicle.brand} {vehicle.model}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {Number(vehicle.current_mileage).toLocaleString()} km
                    </p>
                  </button>
                ))}
              </div>
            )}
            {errors.vehicle && (
              <p className="text-red-500 text-sm mt-2 flex items-center space-x-1">
                <AlertTriangle className="w-4 h-4" />
                <span>{errors.vehicle}</span>
              </p>
            )}
          </div>

          {/* Step 2: Maintenance Type */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-semibold mb-3" style={{ color: '#191919' }}>
              <Wrench className="w-4 h-4" style={{ color: '#B87333' }} />
              <span>2. Type de maintenance</span>
              <span className="text-red-500">*</span>
            </label>

            {/* Category Tabs */}
            <div className="flex space-x-2 mb-4">
              <button
                type="button"
                onClick={() => setSelectedCategory('preventive')}
                className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center space-x-2 ${
                  selectedCategory === 'preventive' ? 'shadow-md' : 'hover:bg-gray-50'
                }`}
                style={{
                  backgroundColor: selectedCategory === 'preventive' ? '#E8EFED' : 'white',
                  color: selectedCategory === 'preventive' ? '#6A8A82' : '#6B7280',
                  border: `2px solid ${selectedCategory === 'preventive' ? '#6A8A82' : '#E8ECEC'}`
                }}
              >
                <Shield className="w-5 h-5" />
                <span>Préventive</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory('corrective')}
                className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center space-x-2 ${
                  selectedCategory === 'corrective' ? 'shadow-md' : 'hover:bg-gray-50'
                }`}
                style={{
                  backgroundColor: selectedCategory === 'corrective' ? '#F5E8DD' : 'white',
                  color: selectedCategory === 'corrective' ? '#B87333' : '#6B7280',
                  border: `2px solid ${selectedCategory === 'corrective' ? '#B87333' : '#E8ECEC'}`
                }}
              >
                <AlertTriangle className="w-5 h-5" />
                <span>Corrective</span>
              </button>
            </div>

            {/* Type Options */}
            <div className="grid grid-cols-2 gap-3">
              {filteredTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = formData.maintenance_type === type.value;
                const bgColor = selectedCategory === 'preventive' ? '#E8EFED' : '#F5E8DD';
                const textColor = selectedCategory === 'preventive' ? '#6A8A82' : '#B87333';

                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => handleTypeSelect(type.value)}
                    className={`p-4 rounded-xl border-2 text-left transition-all hover:shadow-md ${
                      isSelected ? 'ring-2 ring-offset-2' : ''
                    }`}
                    style={{
                      borderColor: isSelected ? textColor : '#E8ECEC',
                      backgroundColor: isSelected ? bgColor : 'white',
                      ringColor: textColor
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: isSelected ? 'white' : bgColor }}
                      >
                        <Icon className="w-5 h-5" style={{ color: textColor }} />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold" style={{ color: '#191919' }}>{type.label}</p>
                        <p className="text-xs text-gray-500">{type.description}</p>
                      </div>
                      {isSelected && <Check className="w-5 h-5" style={{ color: textColor }} />}
                    </div>
                  </button>
                );
              })}
            </div>
            {errors.maintenance_type && (
              <p className="text-red-500 text-sm mt-2 flex items-center space-x-1">
                <AlertTriangle className="w-4 h-4" />
                <span>{errors.maintenance_type}</span>
              </p>
            )}
          </div>

          {/* Step 3: Description */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="flex items-center space-x-2 text-sm font-semibold" style={{ color: '#191919' }}>
                <FileText className="w-4 h-4" style={{ color: '#6A8A82' }} />
                <span>3. Description des travaux</span>
                <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setShowTemplates(!showTemplates)}
                className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1"
                style={{ backgroundColor: '#E8EFED', color: '#6A8A82' }}
              >
                <span>Modèles</span>
                {showTemplates ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>

            {showTemplates && (
              <div className="mb-3 p-3 rounded-xl border-2 space-y-2" style={{ backgroundColor: '#F8FAF9', borderColor: '#E8ECEC' }}>
                {WORK_TEMPLATES.map((template, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => applyTemplate(template.text)}
                    className="w-full text-left p-3 rounded-lg border-2 hover:border-sage transition-all text-sm"
                    style={{ borderColor: '#E8ECEC' }}
                  >
                    <p className="font-semibold text-gray-900">{template.label}</p>
                    <p className="text-gray-500 text-xs mt-0.5 line-clamp-1">{template.text}</p>
                  </button>
                ))}
              </div>
            )}

            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              placeholder="Décrivez les travaux à effectuer en détail..."
              className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all resize-none text-gray-900 placeholder-gray-400 ${
                errors.description ? 'border-red-400' : ''
              }`}
              style={{ borderColor: errors.description ? '#f87171' : '#E8ECEC' }}
              onFocus={(e) => { if (!errors.description) e.target.style.borderColor = '#6A8A82'; }}
              onBlur={(e) => { if (!errors.description) e.target.style.borderColor = '#E8ECEC'; }}
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description}</p>
            )}
          </div>

          {/* Step 4: Costs */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-semibold mb-3" style={{ color: '#191919' }}>
              <DollarSign className="w-4 h-4" style={{ color: '#B87333' }} />
              <span>4. Coûts</span>
              <span className="text-red-500">*</span>
            </label>

            <button
              type="button"
              onClick={() => setShowCostBreakdown(!showCostBreakdown)}
              className="w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all hover:shadow-md mb-3"
              style={{
                borderColor: showCostBreakdown ? '#B87333' : '#E8ECEC',
                backgroundColor: showCostBreakdown ? '#FDF8F4' : 'white'
              }}
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#F5E8DD' }}>
                  <DollarSign className="w-5 h-5" style={{ color: '#B87333' }} />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">Détail des coûts</p>
                  <p className="text-xs text-gray-500">Main d'œuvre, pièces, total</p>
                </div>
              </div>
              {showCostBreakdown ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </button>

            {showCostBreakdown && (
              <div className="p-4 rounded-xl border-2 space-y-4 mb-3" style={{ borderColor: '#F5E8DD', backgroundColor: '#FFFCFA' }}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Main d'œuvre</label>
                    <div className="relative">
                      <input
                        type="number"
                        name="labor_cost"
                        value={formData.labor_cost}
                        onChange={handleChange}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        className="w-full pl-8 pr-4 py-2.5 rounded-lg border-2 outline-none transition-all text-sm text-gray-900 placeholder-gray-400"
                        style={{ borderColor: '#E8ECEC' }}
                        onFocus={(e) => e.target.style.borderColor = '#B87333'}
                        onBlur={(e) => e.target.style.borderColor = '#E8ECEC'}
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{currencySymbol}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pièces détachées</label>
                    <div className="relative">
                      <input
                        type="number"
                        name="parts_cost"
                        value={formData.parts_cost}
                        onChange={handleChange}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        className="w-full pl-8 pr-4 py-2.5 rounded-lg border-2 outline-none transition-all text-sm text-gray-900 placeholder-gray-400"
                        style={{ borderColor: '#E8ECEC' }}
                        onFocus={(e) => e.target.style.borderColor = '#B87333'}
                        onBlur={(e) => e.target.style.borderColor = '#E8ECEC'}
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{currencySymbol}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Coût total *</label>
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
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border-2 outline-none transition-all text-gray-900 placeholder-gray-400 ${
                    errors.total_cost ? 'border-red-400' : ''
                  }`}
                  style={{ borderColor: errors.total_cost ? '#f87171' : '#E8ECEC' }}
                  onFocus={(e) => { if (!errors.total_cost) e.target.style.borderColor = '#B87333'; }}
                  onBlur={(e) => { if (!errors.total_cost) e.target.style.borderColor = '#E8ECEC'; }}
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">{currencySymbol}</span>
              </div>
              {errors.total_cost && <p className="text-red-500 text-sm mt-1">{errors.total_cost}</p>}
            </div>
          </div>

          {/* Step 5: Date & Details */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-semibold mb-3" style={{ color: '#191919' }}>
              <Calendar className="w-4 h-4" style={{ color: '#6A8A82' }} />
              <span>5. Date et détails</span>
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Date d'intervention *
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
                {errors.scheduled_date && <p className="text-red-500 text-sm mt-1">{errors.scheduled_date}</p>}
              </div>

              {/* Service Provider */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Prestataire / Garage *
                </label>
                <input
                  type="text"
                  name="service_provider"
                  value={formData.service_provider}
                  onChange={handleChange}
                  placeholder="Nom du garage ou atelier"
                  required
                  className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all text-gray-900 placeholder-gray-400 ${
                    errors.service_provider ? 'border-red-400' : ''
                  }`}
                  style={{ borderColor: errors.service_provider ? '#f87171' : '#E8ECEC' }}
                  onFocus={(e) => { if (!errors.service_provider) e.target.style.borderColor = '#6A8A82'; }}
                  onBlur={(e) => { if (!errors.service_provider) e.target.style.borderColor = '#E8ECEC'; }}
                />
                {errors.service_provider && <p className="text-red-500 text-sm mt-1">{errors.service_provider}</p>}
              </div>

              {/* Current Mileage */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Gauge className="w-4 h-4 inline mr-1" />
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
                {errors.mileage_at_service && <p className="text-red-500 text-sm mt-1">{errors.mileage_at_service}</p>}
              </div>

              {/* Next Service Mileage */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Gauge className="w-4 h-4 inline mr-1" />
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

            {/* Notes */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes additionnelles</label>
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
          </div>

          {/* Summary */}
          {selectedVehicle && formData.maintenance_type && (
            <div
              className="p-4 rounded-xl border-2"
              style={{ backgroundColor: '#F8FAF9', borderColor: '#E8EFED' }}
            >
              <h4 className="font-semibold mb-3" style={{ color: '#191919' }}>Récapitulatif</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Véhicule</p>
                  <p className="font-semibold">{selectedVehicle.license_plate}</p>
                </div>
                <div>
                  <p className="text-gray-500">Type</p>
                  <p className="font-semibold">
                    {MAINTENANCE_TYPES.find(t => t.value === formData.maintenance_type)?.label}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Date</p>
                  <p className="font-semibold">
                    {formData.scheduled_date
                      ? new Date(formData.scheduled_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
                      : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Coût</p>
                  <p className="font-semibold" style={{ color: '#B87333' }}>
                    {formData.total_cost || '0'} FCFA
                  </p>
                </div>
              </div>
            </div>
          )}
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
                <span>Planification...</span>
              </>
            ) : (
              <>
                <Calendar className="w-5 h-5" />
                <span>Planifier la maintenance</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
