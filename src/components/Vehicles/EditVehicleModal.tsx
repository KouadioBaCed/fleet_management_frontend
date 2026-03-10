import { useState, useEffect } from 'react';
import { X, Upload, Car, FileText, Gauge, Droplet, Shield, Radio, Check, Loader2, AlertCircle, ImageIcon, Save } from 'lucide-react';
import type { Vehicle } from '@/types';
import { vehiclesApi } from '@/api/vehicles';

interface EditVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => Promise<void>;
  vehicle: Vehicle | null;
}

interface FormErrors {
  [key: string]: string;
}

interface VehicleFormData {
  license_plate: string;
  vin_number: string;
  brand: string;
  model: string;
  year: number;
  vehicle_type: string;
  color: string;
  fuel_type: string;
  fuel_capacity: string;
  fuel_consumption: string;
  current_mileage: string;
  insurance_number: string;
  insurance_expiry: string;
  gps_device_id: string;
  notes: string;
  status: string;
}

const TABS = [
  { id: 'general', title: 'Général', icon: Car },
  { id: 'technical', title: 'Technique', icon: Gauge },
  { id: 'insurance', title: 'Assurance', icon: Shield },
  { id: 'photo', title: 'Photo', icon: ImageIcon },
];

export default function EditVehicleModal({ isOpen, onClose, onSubmit, vehicle }: EditVehicleModalProps) {
  const [activeTab, setActiveTab] = useState('general');
  const [formData, setFormData] = useState<VehicleFormData>({
    license_plate: '',
    vin_number: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    vehicle_type: 'sedan',
    color: '',
    fuel_type: 'gasoline',
    fuel_capacity: '',
    fuel_consumption: '',
    current_mileage: '',
    insurance_number: '',
    insurance_expiry: '',
    gps_device_id: '',
    notes: '',
    status: 'available',
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Charger les données complètes du véhicule quand le modal s'ouvre
  useEffect(() => {
    if (vehicle && isOpen) {
      loadVehicleData();
    }
  }, [vehicle, isOpen]);

  const loadVehicleData = async () => {
    if (!vehicle) return;

    setIsLoading(true);
    setApiError(null);

    try {
      // Récupérer les données complètes du véhicule via l'API
      const fullVehicle = await vehiclesApi.getById(vehicle.id);

      setFormData({
        license_plate: fullVehicle.license_plate || '',
        vin_number: fullVehicle.vin_number || '',
        brand: fullVehicle.brand || '',
        model: fullVehicle.model || '',
        year: fullVehicle.year || new Date().getFullYear(),
        vehicle_type: fullVehicle.vehicle_type || 'sedan',
        color: fullVehicle.color || '',
        fuel_type: fullVehicle.fuel_type || 'gasoline',
        fuel_capacity: fullVehicle.fuel_capacity?.toString() || '',
        fuel_consumption: fullVehicle.fuel_consumption?.toString() || '',
        current_mileage: fullVehicle.current_mileage?.toString() || '',
        insurance_number: fullVehicle.insurance_number || '',
        insurance_expiry: fullVehicle.insurance_expiry || '',
        gps_device_id: fullVehicle.gps_device_id || '',
        notes: fullVehicle.notes || '',
        status: fullVehicle.status || 'available',
      });
      setImagePreview(fullVehicle.photo || null);
      setImageFile(null);
      setErrors({});
      setHasChanges(false);
      setActiveTab('general');
    } catch (err) {
      console.error('Failed to load vehicle data:', err);
      setApiError('Erreur lors du chargement des données du véhicule');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const maxSize = 10 * 1024 * 1024;
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

      if (!allowedTypes.includes(file.type)) {
        setErrors(prev => ({ ...prev, photo: 'Format non supporté. Utilisez PNG, JPG ou WEBP.' }));
        return;
      }

      if (file.size > maxSize) {
        setErrors(prev => ({ ...prev, photo: 'Le fichier est trop volumineux (max 10MB).' }));
        return;
      }

      setErrors(prev => {
        const { photo, ...rest } = prev;
        return rest;
      });
      setImageFile(file);
      setHasChanges(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setHasChanges(true);
    if (errors[name]) {
      setErrors(prev => {
        const { [name]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.license_plate.trim()) {
      newErrors.license_plate = 'La plaque d\'immatriculation est requise';
    }
    if (!formData.vin_number.trim()) {
      newErrors.vin_number = 'Le numéro VIN est requis';
    } else if (formData.vin_number.length !== 17) {
      newErrors.vin_number = 'Le VIN doit contenir exactement 17 caractères';
    }
    if (!formData.brand.trim()) {
      newErrors.brand = 'La marque est requise';
    }
    if (!formData.model.trim()) {
      newErrors.model = 'Le modèle est requis';
    }
    if (!formData.color.trim()) {
      newErrors.color = 'La couleur est requise';
    }
    if (!formData.fuel_capacity || parseFloat(formData.fuel_capacity) <= 0) {
      newErrors.fuel_capacity = 'Capacité invalide';
    }
    if (!formData.fuel_consumption || parseFloat(formData.fuel_consumption) <= 0) {
      newErrors.fuel_consumption = 'Consommation invalide';
    }
    if (!formData.current_mileage || parseFloat(formData.current_mileage) < 0) {
      newErrors.current_mileage = 'Kilométrage invalide';
    }
    if (!formData.insurance_number.trim()) {
      newErrors.insurance_number = 'Le numéro d\'assurance est requis';
    }
    if (!formData.insurance_expiry) {
      newErrors.insurance_expiry = 'La date d\'expiration est requise';
    }

    setErrors(newErrors);

    // Navigate to tab with error
    if (Object.keys(newErrors).length > 0) {
      if (newErrors.license_plate || newErrors.vin_number || newErrors.brand || newErrors.model || newErrors.color || newErrors.year || newErrors.vehicle_type) {
        setActiveTab('general');
      } else if (newErrors.fuel_capacity || newErrors.fuel_consumption || newErrors.current_mileage || newErrors.fuel_type) {
        setActiveTab('technical');
      } else if (newErrors.insurance_number || newErrors.insurance_expiry) {
        setActiveTab('insurance');
      }
    }

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setApiError(null);

    try {
      const submitData = new window.FormData();

      Object.entries(formData).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          submitData.append(key, value.toString());
        }
      });

      if (imageFile) {
        submitData.append('photo', imageFile);
      }

      await onSubmit(submitData);
      handleClose();
    } catch (error: any) {
      console.error('Failed to update vehicle:', error);

      if (error.response?.data) {
        const data = error.response.data;
        if (typeof data === 'object') {
          const apiErrors: FormErrors = {};
          Object.entries(data).forEach(([key, value]) => {
            if (Array.isArray(value)) {
              apiErrors[key] = value[0];
            } else if (typeof value === 'string') {
              apiErrors[key] = value;
            }
          });
          setErrors(apiErrors);
        } else {
          setApiError('Une erreur est survenue lors de la modification');
        }
      } else {
        setApiError('Erreur de connexion. Veuillez réessayer.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setActiveTab('general');
    setImagePreview(null);
    setImageFile(null);
    setFormData({
      license_plate: '',
      vin_number: '',
      brand: '',
      model: '',
      year: new Date().getFullYear(),
      vehicle_type: 'sedan',
      color: '',
      fuel_type: 'gasoline',
      fuel_capacity: '',
      fuel_consumption: '',
      current_mileage: '',
      insurance_number: '',
      insurance_expiry: '',
      gps_device_id: '',
      notes: '',
      status: 'available',
    });
    setErrors({});
    setApiError(null);
    setIsSubmitting(false);
    setHasChanges(false);
    onClose();
  };

  const renderFieldError = (fieldName: string) => {
    if (errors[fieldName]) {
      return (
        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {errors[fieldName]}
        </p>
      );
    }
    return null;
  };

  const getInputClassName = (fieldName: string) => {
    const hasError = !!errors[fieldName];
    return `w-full px-4 py-3 rounded-xl border-2 outline-none transition-all text-gray-900 placeholder-gray-400 ${
      hasError
        ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100'
        : 'focus:ring-4 focus:ring-sage/10'
    }`;
  };

  const renderTabContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4" style={{ color: '#6A8A82' }} />
            <p className="text-gray-500">Chargement des données...</p>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-5">
            {/* Status */}
            <div className="bg-gradient-to-br from-sage/5 to-transparent rounded-xl p-5 border-2" style={{ borderColor: '#E8EFED' }}>
              <h4 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-4">Statut</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { value: 'available', label: 'Disponible', color: '#6A8A82' },
                  { value: 'in_use', label: 'En mission', color: '#B87333' },
                  { value: 'maintenance', label: 'Maintenance', color: '#6B7280' },
                  { value: 'out_of_service', label: 'Hors service', color: '#DC2626' },
                ].map((status) => (
                  <button
                    key={status.value}
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, status: status.value }));
                      setHasChanges(true);
                    }}
                    className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                      formData.status === status.value ? 'shadow-md' : 'hover:shadow-sm'
                    }`}
                    style={{
                      borderColor: formData.status === status.value ? status.color : '#E8ECEC',
                      backgroundColor: formData.status === status.value ? `${status.color}15` : 'white',
                      color: formData.status === status.value ? status.color : '#6B7280',
                    }}
                  >
                    {status.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Identification */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>
                  Plaque d'immatriculation *
                </label>
                <input
                  type="text"
                  name="license_plate"
                  value={formData.license_plate}
                  onChange={handleInputChange}
                  className={`${getInputClassName('license_plate')} text-lg uppercase font-mono`}
                  style={{ borderColor: errors.license_plate ? undefined : '#E8ECEC' }}
                />
                {renderFieldError('license_plate')}
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>
                  Numéro VIN *
                </label>
                <input
                  type="text"
                  name="vin_number"
                  value={formData.vin_number}
                  onChange={handleInputChange}
                  maxLength={17}
                  className={`${getInputClassName('vin_number')} font-mono uppercase`}
                  style={{ borderColor: errors.vin_number ? undefined : '#E8ECEC' }}
                />
                <div className="flex justify-between items-center mt-1">
                  {renderFieldError('vin_number') || <span />}
                  <span className={`text-xs font-medium ${formData.vin_number.length === 17 ? 'text-green-600' : 'text-gray-400'}`}>
                    {formData.vin_number.length}/17
                  </span>
                </div>
              </div>
            </div>

            {/* Caractéristiques */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>
                  Marque *
                </label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleInputChange}
                  className={getInputClassName('brand')}
                  style={{ borderColor: errors.brand ? undefined : '#E8ECEC' }}
                />
                {renderFieldError('brand')}
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>
                  Modèle *
                </label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleInputChange}
                  className={getInputClassName('model')}
                  style={{ borderColor: errors.model ? undefined : '#E8ECEC' }}
                />
                {renderFieldError('model')}
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>
                  Année *
                </label>
                <input
                  type="number"
                  name="year"
                  value={formData.year}
                  onChange={handleInputChange}
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  className={getInputClassName('year')}
                  style={{ borderColor: errors.year ? undefined : '#E8ECEC' }}
                />
                {renderFieldError('year')}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>
                  Type de véhicule *
                </label>
                <select
                  name="vehicle_type"
                  value={formData.vehicle_type}
                  onChange={handleInputChange}
                  className={getInputClassName('vehicle_type')}
                  style={{ borderColor: errors.vehicle_type ? undefined : '#E8ECEC' }}
                >
                  <option value="sedan">Berline</option>
                  <option value="suv">SUV</option>
                  <option value="van">Camionnette</option>
                  <option value="truck">Camion</option>
                </select>
                {renderFieldError('vehicle_type')}
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>
                  Couleur *
                </label>
                <input
                  type="text"
                  name="color"
                  value={formData.color}
                  onChange={handleInputChange}
                  className={getInputClassName('color')}
                  style={{ borderColor: errors.color ? undefined : '#E8ECEC' }}
                />
                {renderFieldError('color')}
              </div>
            </div>
          </div>
        );

      case 'technical':
        return (
          <div className="space-y-5">
            {/* Carburant */}
            <div className="bg-gradient-to-br from-sage/5 to-transparent rounded-xl p-5 border-2" style={{ borderColor: '#E8EFED' }}>
              <div className="flex items-center space-x-2 mb-4">
                <Droplet className="w-5 h-5" style={{ color: '#6A8A82' }} />
                <h4 className="text-lg font-bold" style={{ color: '#191919' }}>Carburant</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>
                    Type *
                  </label>
                  <select
                    name="fuel_type"
                    value={formData.fuel_type}
                    onChange={handleInputChange}
                    className={getInputClassName('fuel_type')}
                    style={{ borderColor: errors.fuel_type ? undefined : '#E8ECEC' }}
                  >
                    <option value="gasoline">Essence</option>
                    <option value="diesel">Diesel</option>
                    <option value="electric">Électrique</option>
                    <option value="hybrid">Hybride</option>
                  </select>
                  {renderFieldError('fuel_type')}
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>
                    Capacité (L) *
                  </label>
                  <input
                    type="number"
                    name="fuel_capacity"
                    value={formData.fuel_capacity}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className={getInputClassName('fuel_capacity')}
                    style={{ borderColor: errors.fuel_capacity ? undefined : '#E8ECEC' }}
                  />
                  {renderFieldError('fuel_capacity')}
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>
                    Consommation (L/100km) *
                  </label>
                  <input
                    type="number"
                    name="fuel_consumption"
                    value={formData.fuel_consumption}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className={getInputClassName('fuel_consumption')}
                    style={{ borderColor: errors.fuel_consumption ? undefined : '#E8ECEC' }}
                  />
                  {renderFieldError('fuel_consumption')}
                </div>
              </div>
            </div>

            {/* Kilométrage */}
            <div className="bg-gradient-to-br from-copper/5 to-transparent rounded-xl p-5 border-2" style={{ borderColor: '#F5E8DD' }}>
              <div className="flex items-center space-x-2 mb-4">
                <Gauge className="w-5 h-5" style={{ color: '#B87333' }} />
                <h4 className="text-lg font-bold" style={{ color: '#191919' }}>Kilométrage</h4>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>
                  Kilométrage actuel (km) *
                </label>
                <input
                  type="number"
                  name="current_mileage"
                  value={formData.current_mileage}
                  onChange={handleInputChange}
                  step="1"
                  min="0"
                  className={getInputClassName('current_mileage')}
                  style={{ borderColor: errors.current_mileage ? undefined : '#E8ECEC' }}
                />
                {renderFieldError('current_mileage')}
              </div>
            </div>

            {/* GPS */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>
                <div className="flex items-center space-x-2">
                  <Radio className="w-4 h-4" style={{ color: '#6A8A82' }} />
                  <span>ID Dispositif GPS (optionnel)</span>
                </div>
              </label>
              <input
                type="text"
                name="gps_device_id"
                value={formData.gps_device_id}
                onChange={handleInputChange}
                placeholder="GPS-001"
                className={getInputClassName('gps_device_id')}
                style={{ borderColor: '#E8ECEC' }}
              />
            </div>
          </div>
        );

      case 'insurance':
        return (
          <div className="space-y-5">
            <div className="bg-gradient-to-br from-sage/5 to-transparent rounded-xl p-5 border-2" style={{ borderColor: '#E8EFED' }}>
              <div className="flex items-center space-x-2 mb-4">
                <Shield className="w-5 h-5" style={{ color: '#6A8A82' }} />
                <h4 className="text-lg font-bold" style={{ color: '#191919' }}>Assurance</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>
                    Numéro d'assurance *
                  </label>
                  <input
                    type="text"
                    name="insurance_number"
                    value={formData.insurance_number}
                    onChange={handleInputChange}
                    placeholder="ASS-2024-123456"
                    className={getInputClassName('insurance_number')}
                    style={{ borderColor: errors.insurance_number ? undefined : '#E8ECEC' }}
                  />
                  {renderFieldError('insurance_number')}
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>
                    Date d'expiration *
                  </label>
                  <input
                    type="date"
                    name="insurance_expiry"
                    value={formData.insurance_expiry}
                    onChange={handleInputChange}
                    className={getInputClassName('insurance_expiry')}
                    style={{ borderColor: errors.insurance_expiry ? undefined : '#E8ECEC' }}
                  />
                  {renderFieldError('insurance_expiry')}
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>
                Notes (optionnel)
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Ajoutez des notes supplémentaires..."
                rows={4}
                className={`${getInputClassName('notes')} resize-none`}
                style={{ borderColor: '#E8ECEC' }}
              />
            </div>
          </div>
        );

      case 'photo':
        return (
          <div className="space-y-5">
            <div
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all hover:border-sage cursor-pointer ${
                errors.photo ? 'border-red-300 bg-red-50' : ''
              }`}
              style={{
                borderColor: errors.photo ? undefined : (imagePreview ? '#6A8A82' : '#E8ECEC'),
                backgroundColor: errors.photo ? undefined : (imagePreview ? '#F0F3F2' : 'transparent')
              }}
              onClick={() => document.getElementById('photo-upload-edit')?.click()}
            >
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full max-w-lg mx-auto h-72 object-contain rounded-xl shadow-lg bg-white"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImagePreview(null);
                      setImageFile(null);
                      setHasChanges(true);
                    }}
                    className="absolute top-4 right-4 w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-all shadow-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  {imageFile && (
                    <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-600">
                      <ImageIcon className="w-4 h-4" />
                      <span>{imageFile.name}</span>
                      <span className="text-gray-400">({(imageFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#E8EFED' }}>
                    <Upload className="w-10 h-10" style={{ color: '#6A8A82' }} />
                  </div>
                  <p className="text-lg font-semibold mb-2" style={{ color: '#6A8A82' }}>
                    Cliquez pour télécharger une image
                  </p>
                  <p className="text-sm text-gray-500">PNG, JPG, JPEG ou WEBP jusqu'à 10MB</p>
                </div>
              )}
              <input
                type="file"
                id="photo-upload-edit"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
            {renderFieldError('photo')}
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen || !vehicle) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2" style={{ borderColor: '#E8ECEC' }}>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#F5E8DD' }}>
              <Car className="w-6 h-6" style={{ color: '#B87333' }} />
            </div>
            <div>
              <h2 className="text-2xl font-bold" style={{ color: '#191919' }}>
                Modifier le véhicule
              </h2>
              <p className="text-sm text-gray-500 font-mono">{vehicle.license_plate} - {vehicle.brand} {vehicle.model}</p>
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

        {/* Tabs */}
        <div className="px-6 pt-4 border-b" style={{ borderColor: '#E8ECEC' }}>
          <div className="flex space-x-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  disabled={isLoading}
                  className={`flex items-center gap-2 px-4 py-3 rounded-t-xl font-medium text-sm transition-all ${
                    isActive ? 'shadow-sm' : 'hover:bg-gray-50'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  style={{
                    backgroundColor: isActive ? '#E8EFED' : 'transparent',
                    color: isActive ? '#6A8A82' : '#6B7280',
                    borderBottom: isActive ? '2px solid #6A8A82' : '2px solid transparent',
                  }}
                >
                  <Icon className="w-4 h-4" />
                  {tab.title}
                </button>
              );
            })}
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-6">
            {renderTabContent()}

            {/* API Error */}
            {apiError && (
              <div className="mt-4 bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <span className="text-red-700 text-sm">{apiError}</span>
              </div>
            )}
          </div>

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

            <div className="flex items-center gap-3">
              {hasChanges && (
                <span className="text-sm text-amber-600 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  Modifications non enregistrées
                </span>
              )}
              <button
                type="submit"
                disabled={isSubmitting || !hasChanges || isLoading}
                className="flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                style={{ backgroundColor: '#B87333' }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Enregistrement...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Enregistrer</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
