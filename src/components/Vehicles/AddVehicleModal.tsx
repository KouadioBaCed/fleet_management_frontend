import { useState } from 'react';
import { X, Upload, Car, FileText, Gauge, Droplet, Shield, Radio, ChevronRight, ChevronLeft, Check, Loader2, AlertCircle, ImageIcon } from 'lucide-react';
import type { ApiValidationError } from '@/api/vehicles';

interface AddVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => Promise<void>;
}

const STEPS = [
  { id: 1, title: 'Photo', icon: Upload },
  { id: 2, title: 'Identification', icon: FileText },
  { id: 3, title: 'Caractéristiques', icon: Car },
  { id: 4, title: 'Carburant & État', icon: Droplet },
  { id: 5, title: 'Assurance & Finalisation', icon: Shield },
];

interface FormErrors {
  [key: string]: string;
}

export default function AddVehicleModal({ isOpen, onClose, onSubmit }: AddVehicleModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
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
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validation du fichier
      const maxSize = 10 * 1024 * 1024; // 10MB
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
    // Effacer l'erreur du champ modifié
    if (errors[name]) {
      setErrors(prev => {
        const { [name]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: FormErrors = {};

    switch (step) {
      case 2: // Identification
        if (!formData.license_plate.trim()) {
          newErrors.license_plate = 'La plaque d\'immatriculation est requise';
        } else if (!/^[A-Z0-9-]+$/i.test(formData.license_plate)) {
          newErrors.license_plate = 'Format de plaque invalide';
        }
        if (!formData.vin_number.trim()) {
          newErrors.vin_number = 'Le numéro VIN est requis';
        } else if (formData.vin_number.length !== 17) {
          newErrors.vin_number = 'Le VIN doit contenir exactement 17 caractères';
        }
        break;

      case 3: // Caractéristiques
        if (!formData.brand.trim()) {
          newErrors.brand = 'La marque est requise';
        }
        if (!formData.model.trim()) {
          newErrors.model = 'Le modèle est requis';
        }
        if (!formData.year || formData.year < 1900 || formData.year > new Date().getFullYear() + 1) {
          newErrors.year = 'Année invalide';
        }
        if (!formData.color.trim()) {
          newErrors.color = 'La couleur est requise';
        }
        break;

      case 4: // Carburant & État
        if (!formData.fuel_capacity || parseFloat(formData.fuel_capacity) <= 0) {
          newErrors.fuel_capacity = 'Capacité invalide';
        }
        if (!formData.fuel_consumption || parseFloat(formData.fuel_consumption) <= 0) {
          newErrors.fuel_consumption = 'Consommation invalide';
        }
        if (!formData.current_mileage || parseFloat(formData.current_mileage) < 0) {
          newErrors.current_mileage = 'Kilométrage invalide';
        }
        break;

      case 5: // Assurance
        if (!formData.insurance_number.trim()) {
          newErrors.insurance_number = 'Le numéro d\'assurance est requis';
        }
        if (!formData.insurance_expiry) {
          newErrors.insurance_expiry = 'La date d\'expiration est requise';
        } else {
          const expiryDate = new Date(formData.insurance_expiry);
          if (expiryDate < new Date()) {
            newErrors.insurance_expiry = 'L\'assurance est expirée';
          }
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    // Step 1 (photo) n'a pas de validation obligatoire
    if (currentStep === 1 || validateStep(currentStep)) {
      if (currentStep < STEPS.length) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Valider la dernière étape
    if (!validateStep(currentStep)) {
      return;
    }

    setIsSubmitting(true);
    setApiError(null);

    try {
      const submitData = new FormData();

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
      console.error('Failed to create vehicle:', error);

      // Gestion des erreurs de validation du backend
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

          // Naviguer vers l'étape avec l'erreur
          if (apiErrors.license_plate || apiErrors.vin_number) {
            setCurrentStep(2);
          } else if (apiErrors.brand || apiErrors.model || apiErrors.year || apiErrors.color) {
            setCurrentStep(3);
          } else if (apiErrors.fuel_capacity || apiErrors.fuel_consumption || apiErrors.current_mileage) {
            setCurrentStep(4);
          } else if (apiErrors.insurance_number || apiErrors.insurance_expiry) {
            setCurrentStep(5);
          }
        } else {
          setApiError('Une erreur est survenue lors de la création du véhicule');
        }
      } else {
        setApiError('Erreur de connexion. Veuillez réessayer.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setCurrentStep(1);
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
    });
    setErrors({});
    setApiError(null);
    setIsSubmitting(false);
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

  const getInputClassName = (fieldName: string, baseColor: string = '#E8ECEC') => {
    const hasError = !!errors[fieldName];
    return `w-full px-4 py-3 rounded-xl border-2 outline-none transition-all text-gray-900 placeholder-gray-400 ${
      hasError
        ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100'
        : `focus:ring-4 focus:ring-sage/10`
    }`;
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
            <div className="text-center mb-4 sm:mb-6">
              <h3 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2" style={{ color: '#191919' }}>
                Photo du vehicule
              </h3>
              <p className="text-sm sm:text-base text-gray-600">Ajoutez une photo pour identifier facilement votre vehicule</p>
            </div>
            <div
              className={`border-2 border-dashed rounded-xl sm:rounded-2xl p-6 sm:p-12 text-center transition-all hover:border-sage cursor-pointer ${
                errors.photo ? 'border-red-300 bg-red-50' : ''
              }`}
              style={{
                borderColor: errors.photo ? undefined : (imagePreview ? '#6A8A82' : '#E8ECEC'),
                backgroundColor: errors.photo ? undefined : (imagePreview ? '#F0F3F2' : 'transparent')
              }}
              onClick={() => document.getElementById('photo-upload')?.click()}
            >
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="Preview" className="w-full max-w-md mx-auto h-64 object-cover rounded-xl shadow-lg" />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImagePreview(null);
                      setImageFile(null);
                    }}
                    className="absolute top-4 right-4 w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-all shadow-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-600">
                    <ImageIcon className="w-4 h-4" />
                    <span>{imageFile?.name}</span>
                    <span className="text-gray-400">({(imageFile?.size ? imageFile.size / 1024 / 1024 : 0).toFixed(2)} MB)</span>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ backgroundColor: errors.photo ? '#FEE2E2' : '#E8EFED' }}>
                    <Upload className="w-10 h-10" style={{ color: errors.photo ? '#DC2626' : '#6A8A82' }} />
                  </div>
                  <p className="text-lg font-semibold mb-2" style={{ color: errors.photo ? '#DC2626' : '#6A8A82' }}>
                    Cliquez pour telecharger une image
                  </p>
                  <p className="text-sm text-gray-500">PNG, JPG, JPEG ou WEBP jusqu'a 10MB</p>
                  <p className="text-xs text-gray-400 mt-2">(Optionnel - vous pouvez passer cette etape)</p>
                </div>
              )}
              <input
                type="file"
                id="photo-upload"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
            {renderFieldError('photo')}
          </div>
        );

      case 2:
        return (
          <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
            <div className="text-center mb-4 sm:mb-6">
              <h3 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2" style={{ color: '#191919' }}>
                Identification du vehicule
              </h3>
              <p className="text-sm sm:text-base text-gray-600">Informations essentielles pour l'identification</p>
            </div>
            <div className="bg-gradient-to-br from-sage/5 to-transparent rounded-xl p-4 sm:p-6 border-2" style={{ borderColor: '#E8EFED' }}>
              <div className="grid grid-cols-1 gap-5">
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>
                    Plaque d'immatriculation *
                  </label>
                  <input
                    type="text"
                    name="license_plate"
                    value={formData.license_plate}
                    onChange={handleInputChange}
                    placeholder="AB-123-CD"
                    required
                    className={`${getInputClassName('license_plate')} text-lg uppercase`}
                    style={{ borderColor: errors.license_plate ? undefined : '#E8ECEC' }}
                  />
                  {renderFieldError('license_plate')}
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>
                    Numero VIN (17 caracteres) *
                  </label>
                  <input
                    type="text"
                    name="vin_number"
                    value={formData.vin_number}
                    onChange={handleInputChange}
                    placeholder="1HGBH41JXMN109186"
                    required
                    maxLength={17}
                    className={`${getInputClassName('vin_number')} text-lg font-mono uppercase`}
                    style={{ borderColor: errors.vin_number ? undefined : '#E8ECEC' }}
                  />
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-gray-500">Le VIN est un numero unique de 17 caracteres</p>
                    <span className={`text-xs font-medium ${formData.vin_number.length === 17 ? 'text-green-600' : 'text-gray-400'}`}>
                      {formData.vin_number.length}/17
                    </span>
                  </div>
                  {renderFieldError('vin_number')}
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6 p-6">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2" style={{ color: '#191919' }}>
                Caracteristiques
              </h3>
              <p className="text-gray-600">Details techniques du vehicule</p>
            </div>
            <div className="bg-gradient-to-br from-copper/5 to-transparent rounded-xl p-6 border-2" style={{ borderColor: '#F5E8DD' }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>
                    Marque *
                  </label>
                  <input
                    type="text"
                    name="brand"
                    value={formData.brand}
                    onChange={handleInputChange}
                    placeholder="Toyota"
                    required
                    className={getInputClassName('brand')}
                    style={{ borderColor: errors.brand ? undefined : '#E8ECEC' }}
                  />
                  {renderFieldError('brand')}
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>
                    Modele *
                  </label>
                  <input
                    type="text"
                    name="model"
                    value={formData.model}
                    onChange={handleInputChange}
                    placeholder="Corolla"
                    required
                    className={getInputClassName('model')}
                    style={{ borderColor: errors.model ? undefined : '#E8ECEC' }}
                  />
                  {renderFieldError('model')}
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>
                    Annee *
                  </label>
                  <input
                    type="number"
                    name="year"
                    value={formData.year}
                    onChange={handleInputChange}
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    required
                    className={getInputClassName('year')}
                    style={{ borderColor: errors.year ? undefined : '#E8ECEC' }}
                  />
                  {renderFieldError('year')}
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>
                    Type de vehicule *
                  </label>
                  <select
                    name="vehicle_type"
                    value={formData.vehicle_type}
                    onChange={handleInputChange}
                    required
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
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>
                    Couleur *
                  </label>
                  <input
                    type="text"
                    name="color"
                    value={formData.color}
                    onChange={handleInputChange}
                    placeholder="Blanc"
                    required
                    className={getInputClassName('color')}
                    style={{ borderColor: errors.color ? undefined : '#E8ECEC' }}
                  />
                  {renderFieldError('color')}
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6 p-6">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2" style={{ color: '#191919' }}>
                Carburant & Etat
              </h3>
              <p className="text-gray-600">Informations sur le carburant et le kilometrage</p>
            </div>
            <div className="space-y-5">
              <div className="bg-gradient-to-br from-sage/5 to-transparent rounded-xl p-6 border-2" style={{ borderColor: '#E8EFED' }}>
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
                      required
                      className={getInputClassName('fuel_type')}
                      style={{ borderColor: errors.fuel_type ? undefined : '#E8ECEC' }}
                    >
                      <option value="gasoline">Essence</option>
                      <option value="diesel">Diesel</option>
                      <option value="electric">Electrique</option>
                      <option value="hybrid">Hybride</option>
                    </select>
                    {renderFieldError('fuel_type')}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>
                      Capacite (L) *
                    </label>
                    <input
                      type="number"
                      name="fuel_capacity"
                      value={formData.fuel_capacity}
                      onChange={handleInputChange}
                      placeholder="50"
                      step="0.01"
                      min="0"
                      required
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
                      placeholder="6.5"
                      step="0.01"
                      min="0"
                      required
                      className={getInputClassName('fuel_consumption')}
                      style={{ borderColor: errors.fuel_consumption ? undefined : '#E8ECEC' }}
                    />
                    {renderFieldError('fuel_consumption')}
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-copper/5 to-transparent rounded-xl p-6 border-2" style={{ borderColor: '#F5E8DD' }}>
                <div className="flex items-center space-x-2 mb-4">
                  <Gauge className="w-5 h-5" style={{ color: '#B87333' }} />
                  <h4 className="text-lg font-bold" style={{ color: '#191919' }}>Kilometrage</h4>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>
                    Kilometrage actuel (km) *
                  </label>
                  <input
                    type="number"
                    name="current_mileage"
                    value={formData.current_mileage}
                    onChange={handleInputChange}
                    placeholder="15234"
                    step="1"
                    min="0"
                    required
                    className={getInputClassName('current_mileage')}
                    style={{ borderColor: errors.current_mileage ? undefined : '#E8ECEC' }}
                  />
                  {renderFieldError('current_mileage')}
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6 p-6">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2" style={{ color: '#191919' }}>
                Assurance & Finalisation
              </h3>
              <p className="text-gray-600">Dernieres informations et notes complementaires</p>
            </div>
            <div className="space-y-5">
              <div className="bg-gradient-to-br from-sage/5 to-transparent rounded-xl p-6 border-2" style={{ borderColor: '#E8EFED' }}>
                <div className="flex items-center space-x-2 mb-4">
                  <Shield className="w-5 h-5" style={{ color: '#6A8A82' }} />
                  <h4 className="text-lg font-bold" style={{ color: '#191919' }}>Assurance</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>
                      Numero d'assurance *
                    </label>
                    <input
                      type="text"
                      name="insurance_number"
                      value={formData.insurance_number}
                      onChange={handleInputChange}
                      placeholder="ASS-2024-123456"
                      required
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
                      required
                      min={new Date().toISOString().split('T')[0]}
                      className={getInputClassName('insurance_expiry')}
                      style={{ borderColor: errors.insurance_expiry ? undefined : '#E8ECEC' }}
                    />
                    {renderFieldError('insurance_expiry')}
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-copper/5 to-transparent rounded-xl p-6 border-2" style={{ borderColor: '#F5E8DD' }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>
                      <div className="flex items-center space-x-2">
                        <Radio className="w-4 h-4" style={{ color: '#B87333' }} />
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
                      style={{ borderColor: errors.gps_device_id ? undefined : '#E8ECEC' }}
                    />
                    {renderFieldError('gps_device_id')}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>
                      Notes (optionnel)
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      placeholder="Ajoutez des notes supplementaires..."
                      rows={4}
                      className={`${getInputClassName('notes')} resize-none`}
                      style={{ borderColor: errors.notes ? undefined : '#E8ECEC' }}
                    />
                    {renderFieldError('notes')}
                  </div>
                </div>
              </div>

              {/* API Error Display */}
              {apiError && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <span className="text-red-700 text-sm">{apiError}</span>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b-2 flex-shrink-0" style={{ borderColor: '#E8ECEC' }}>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center" style={{ backgroundColor: '#E8EFED' }}>
              <Car className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: '#6A8A82' }} />
            </div>
            <div>
              <h2 className="text-lg sm:text-2xl font-bold" style={{ color: '#191919' }}>
                Nouveau Véhicule
              </h2>
              <p className="text-xs sm:text-sm text-gray-600">Étape {currentStep} sur {STEPS.length}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center hover:bg-gray-100 transition-all"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
          </button>
        </div>

        {/* Stepper - Simplified on mobile */}
        <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2 sm:pb-4 flex-shrink-0">
          {/* Mobile: Simple progress bar */}
          <div className="sm:hidden">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-semibold" style={{ color: '#6A8A82' }}>{STEPS[currentStep - 1].title}</span>
              <span className="text-xs text-gray-500">{currentStep}/{STEPS.length}</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ backgroundColor: '#6A8A82', width: `${(currentStep / STEPS.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Desktop: Full stepper */}
          <div className="hidden sm:flex items-center justify-between">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl flex items-center justify-center transition-all duration-300 ${
                        isActive ? 'shadow-lg scale-110' : isCompleted ? 'shadow-md' : ''
                      }`}
                      style={{
                        backgroundColor: isActive ? '#6A8A82' : isCompleted ? '#B87333' : '#E8ECEC',
                        color: isActive || isCompleted ? '#ffffff' : '#6B7280',
                      }}
                    >
                      {isCompleted ? (
                        <Check className="w-5 h-5 md:w-6 md:h-6" />
                      ) : (
                        <Icon className="w-5 h-5 md:w-6 md:h-6" />
                      )}
                    </div>
                    <p
                      className={`text-xs mt-2 font-medium text-center hidden md:block ${
                        isActive ? 'font-bold' : ''
                      }`}
                      style={{
                        color: isActive ? '#6A8A82' : isCompleted ? '#B87333' : '#6B7280',
                      }}
                    >
                      {step.title}
                    </p>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className="flex-1 h-1 mx-1 md:mx-2 rounded-full" style={{ backgroundColor: isCompleted ? '#B87333' : '#E8ECEC' }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto min-h-0">
            {renderStepContent()}
          </div>

          {/* Footer Navigation */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-between p-4 sm:p-6 border-t-2 bg-gray-50 gap-3 flex-shrink-0" style={{ borderColor: '#E8ECEC' }}>
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold transition-all hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              style={{ backgroundColor: '#E8ECEC', color: '#6B7280' }}
            >
              Annuler
            </button>

            <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handlePrevious}
                  disabled={isSubmitting}
                  className="flex-1 sm:flex-none flex items-center justify-center space-x-1 sm:space-x-2 px-3 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                  style={{ backgroundColor: '#E8EFED', color: '#6A8A82' }}
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden xs:inline">Precedent</span>
                </button>
              )}

              {currentStep < STEPS.length ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={isSubmitting}
                  className="flex-1 sm:flex-none flex items-center justify-center space-x-1 sm:space-x-2 px-3 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                  style={{ backgroundColor: '#6A8A82' }}
                >
                  <span>Suivant</span>
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 sm:flex-none flex items-center justify-center space-x-1 sm:space-x-2 px-3 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                  style={{ backgroundColor: '#B87333' }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                      <span className="hidden sm:inline">Creation...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="hidden sm:inline">Ajouter</span>
                      <span className="sm:hidden">Créer</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
