import { useState, useEffect, useRef } from 'react';
import { X, AlertTriangle, FileText, MapPin, Camera, ChevronRight, ChevronLeft, Check, Loader2, Search } from 'lucide-react';
import type { Incident } from '@/api/incidents';

interface AddressSuggestion {
  display_name: string;
  lat: string;
  lon: string;
}

interface EditIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  incident: Incident | null;
}

const STEPS = [
  { id: 1, title: 'Type & Gravité', icon: AlertTriangle },
  { id: 2, title: 'Description', icon: FileText },
  { id: 3, title: 'Localisation', icon: MapPin },
  { id: 4, title: 'Photos', icon: Camera },
  { id: 5, title: 'Finalisation', icon: Check },
];

export default function EditIncidentModal({ isOpen, onClose, onSubmit, incident }: EditIncidentModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    incident_type: 'flat_tire',
    severity: 'minor',
    title: '',
    description: '',
    latitude: '',
    longitude: '',
    address: '',
    estimated_cost: '',
    resolution_notes: '',
  });

  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);

  // Address search state
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search address using Nominatim API
  const searchAddress = async (query: string) => {
    if (query.length < 3) {
      setAddressSuggestions([]);
      return;
    }

    setIsSearchingAddress(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
        { headers: { 'Accept-Language': 'fr' } }
      );
      const data = await response.json();
      setAddressSuggestions(data);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error searching address:', error);
      setAddressSuggestions([]);
    } finally {
      setIsSearchingAddress(false);
    }
  };

  // Handle address input change with debounce
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFormData(prev => ({ ...prev, address: value }));

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchAddress(value);
    }, 500);
  };

  // Select address from suggestions
  const selectAddress = (suggestion: AddressSuggestion) => {
    setFormData(prev => ({
      ...prev,
      address: suggestion.display_name,
      latitude: suggestion.lat,
      longitude: suggestion.lon,
    }));
    setShowSuggestions(false);
    setAddressSuggestions([]);
  };

  // Load incident data when modal opens
  useEffect(() => {
    if (incident && isOpen) {
      setFormData({
        incident_type: incident.incident_type || 'flat_tire',
        severity: incident.severity || 'minor',
        title: incident.title || '',
        description: incident.description || '',
        latitude: incident.latitude?.toString() || '',
        longitude: incident.longitude?.toString() || '',
        address: incident.address || '',
        estimated_cost: incident.estimated_cost?.toString() || '',
        resolution_notes: incident.resolution_notes || '',
      });

      // Load existing photos
      const photos: string[] = [];
      if (incident.photo1) photos.push(incident.photo1);
      if (incident.photo2) photos.push(incident.photo2);
      if (incident.photo3) photos.push(incident.photo3);
      setExistingPhotos(photos);

      setCurrentStep(1);
    }
  }, [incident, isOpen]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalPhotos = existingPhotos.length + photos.length + files.length;
    if (totalPhotos > 3) {
      alert('Vous ne pouvez avoir que 3 photos maximum');
      return;
    }

    const newPhotos = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));

    setPhotos([...photos, ...newPhotos]);
  };

  const removePhoto = (index: number) => {
    const newPhotos = [...photos];
    URL.revokeObjectURL(newPhotos[index].preview);
    newPhotos.splice(index, 1);
    setPhotos(newPhotos);
  };

  const removeExistingPhoto = (index: number) => {
    const newExisting = [...existingPhotos];
    newExisting.splice(index, 1);
    setExistingPhotos(newExisting);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const submitData: any = {
        incident_type: formData.incident_type,
        severity: formData.severity,
        title: formData.title,
        description: formData.description,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        address: formData.address,
        estimated_cost: formData.estimated_cost ? parseFloat(formData.estimated_cost) : null,
        resolution_notes: formData.resolution_notes,
      };

      await onSubmit(submitData);
      handleClose();
    } catch (error) {
      console.error('Error updating incident:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setCurrentStep(1);
    photos.forEach(photo => URL.revokeObjectURL(photo.preview));
    setPhotos([]);
    setExistingPhotos([]);
    onClose();
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6 p-6">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2" style={{ color: '#191919' }}>
                Type et gravité de l'incident
              </h3>
              <p className="text-gray-600">Modifiez la classification de l'incident</p>
            </div>
            <div className="bg-gradient-to-br from-sage/5 to-transparent rounded-xl p-6 border-2" style={{ borderColor: '#E8EFED' }}>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>
                    Type d'incident *
                  </label>
                  <select
                    name="incident_type"
                    value={formData.incident_type}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 rounded-xl border-2 focus:border-sage focus:ring-4 focus:ring-sage/10 outline-none transition-all text-gray-900"
                    style={{ borderColor: '#E8ECEC' }}
                  >
                    <option value="flat_tire">Pneu crevé</option>
                    <option value="breakdown">Panne</option>
                    <option value="accident">Accident</option>
                    <option value="fuel_issue">Problème carburant</option>
                    <option value="traffic_violation">Infraction</option>
                    <option value="other">Autre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>
                    Gravité *
                  </label>
                  <select
                    name="severity"
                    value={formData.severity}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 rounded-xl border-2 focus:border-sage focus:ring-4 focus:ring-sage/10 outline-none transition-all text-gray-900"
                    style={{ borderColor: '#E8ECEC' }}
                  >
                    <option value="minor">Mineur</option>
                    <option value="moderate">Modéré</option>
                    <option value="major">Majeur</option>
                    <option value="critical">Critique</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>
                    Coût estimé (optionnel)
                  </label>
                  <input
                    type="number"
                    name="estimated_cost"
                    value={formData.estimated_cost}
                    onChange={handleInputChange}
                    placeholder="1500"
                    step="0.01"
                    className="w-full px-4 py-3 rounded-xl border-2 focus:border-sage focus:ring-4 focus:ring-sage/10 outline-none transition-all text-gray-900 placeholder-gray-400"
                    style={{ borderColor: '#E8ECEC' }}
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6 p-6">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2" style={{ color: '#191919' }}>
                Description de l'incident
              </h3>
              <p className="text-gray-600">Modifiez les détails de l'incident</p>
            </div>
            <div className="bg-gradient-to-br from-copper/5 to-transparent rounded-xl p-6 border-2" style={{ borderColor: '#F5E8DD' }}>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>
                    Titre de l'incident *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Ex: Collision avec un poteau"
                    required
                    className="w-full px-4 py-3 rounded-xl border-2 focus:border-copper focus:ring-4 focus:ring-copper/10 outline-none transition-all text-gray-900 placeholder-gray-400"
                    style={{ borderColor: '#E8ECEC' }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>
                    Description détaillée *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Décrivez en détail ce qui s'est passé..."
                    required
                    rows={6}
                    className="w-full px-4 py-3 rounded-xl border-2 focus:border-copper focus:ring-4 focus:ring-copper/10 outline-none transition-all resize-none text-gray-900 placeholder-gray-400"
                    style={{ borderColor: '#E8ECEC' }}
                  />
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
                Localisation
              </h3>
              <p className="text-gray-600">Modifiez le lieu de l'incident</p>
            </div>
            <div className="bg-gradient-to-br from-sage/5 to-transparent rounded-xl p-6 border-2" style={{ borderColor: '#E8EFED' }}>
              <div className="space-y-5">
                {/* Address Search */}
                <div className="relative" ref={suggestionsRef}>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>
                    Rechercher une adresse *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.address}
                      onChange={handleAddressChange}
                      onFocus={() => addressSuggestions.length > 0 && setShowSuggestions(true)}
                      placeholder="Tapez une adresse pour rechercher..."
                      className="w-full pl-12 pr-4 py-3 rounded-xl border-2 focus:border-sage focus:ring-4 focus:ring-sage/10 outline-none transition-all text-gray-900 placeholder-gray-400"
                      style={{ borderColor: '#E8ECEC' }}
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2">
                      {isSearchingAddress ? (
                        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                      ) : (
                        <Search className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Suggestions Dropdown */}
                  {showSuggestions && addressSuggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-xl border-2 max-h-60 overflow-y-auto" style={{ borderColor: '#E8ECEC' }}>
                      {addressSuggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => selectAddress(suggestion)}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-start gap-3 border-b last:border-b-0 transition-colors"
                          style={{ borderColor: '#E8ECEC' }}
                        >
                          <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: '#6A8A82' }} />
                          <div>
                            <p className="text-sm text-gray-900 line-clamp-2">{suggestion.display_name}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {parseFloat(suggestion.lat).toFixed(6)}, {parseFloat(suggestion.lon).toFixed(6)}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Coordinates Display */}
                {formData.latitude && formData.longitude && (
                  <div className="p-4 rounded-xl border-2 bg-green-50" style={{ borderColor: '#6A8A82' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <Check className="w-5 h-5" style={{ color: '#6A8A82' }} />
                      <span className="font-semibold text-sm" style={{ color: '#6A8A82' }}>Coordonnées détectées</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Latitude: <span className="font-mono font-semibold">{parseFloat(formData.latitude).toFixed(6)}</span>
                    </p>
                    <p className="text-sm text-gray-600">
                      Longitude: <span className="font-mono font-semibold">{parseFloat(formData.longitude).toFixed(6)}</span>
                    </p>
                  </div>
                )}

                {/* Manual Coordinates (optional) */}
                <div className="pt-4 border-t" style={{ borderColor: '#E8ECEC' }}>
                  <p className="text-sm text-gray-500 mb-3">Ou entrez les coordonnées manuellement :</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>
                        Latitude
                      </label>
                      <input
                        type="number"
                        name="latitude"
                        value={formData.latitude}
                        onChange={handleInputChange}
                        placeholder="-4.3276"
                        step="0.0000001"
                        className="w-full px-4 py-3 rounded-xl border-2 focus:border-sage focus:ring-4 focus:ring-sage/10 outline-none transition-all text-gray-900 placeholder-gray-400"
                        style={{ borderColor: '#E8ECEC' }}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>
                        Longitude
                      </label>
                      <input
                        type="number"
                        name="longitude"
                        value={formData.longitude}
                        onChange={handleInputChange}
                        placeholder="15.3136"
                        step="0.0000001"
                        className="w-full px-4 py-3 rounded-xl border-2 focus:border-sage focus:ring-4 focus:ring-sage/10 outline-none transition-all text-gray-900 placeholder-gray-400"
                        style={{ borderColor: '#E8ECEC' }}
                      />
                    </div>
                  </div>
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
                Photos de l'incident
              </h3>
              <p className="text-gray-600">Gérez les photos (max 3)</p>
            </div>

            {/* Existing Photos */}
            {existingPhotos.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-semibold mb-2 text-gray-600">Photos existantes</p>
                <div className="grid grid-cols-3 gap-4">
                  {existingPhotos.map((photo, index) => (
                    <div key={`existing-${index}`} className="relative">
                      <img
                        src={photo}
                        alt={`Photo existante ${index + 1}`}
                        className="w-full h-40 object-cover rounded-xl border-2"
                        style={{ borderColor: '#E8ECEC' }}
                      />
                      <button
                        type="button"
                        onClick={() => removeExistingPhoto(index)}
                        className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-all shadow-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload new photos */}
            {(existingPhotos.length + photos.length) < 3 && (
              <div
                className="border-2 border-dashed rounded-2xl p-12 text-center transition-all hover:border-sage cursor-pointer"
                style={{ borderColor: '#E8ECEC', backgroundColor: '#F0F3F2' }}
                onClick={() => document.getElementById('edit-incident-photos-upload')?.click()}
              >
                <div className="w-24 h-24 mx-auto mb-4 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#E8EFED' }}>
                  <Camera className="w-12 h-12" style={{ color: '#6A8A82' }} />
                </div>
                <p className="text-lg font-semibold mb-2" style={{ color: '#6A8A82' }}>
                  Cliquez pour ajouter des photos
                </p>
                <p className="text-sm text-gray-500">PNG, JPG ou JPEG jusqu'à 10MB chacune</p>
                <p className="text-xs text-gray-400 mt-2">({existingPhotos.length + photos.length}/3 photos)</p>
                <input
                  type="file"
                  id="edit-incident-photos-upload"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
            )}

            {/* New photos */}
            {photos.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-semibold mb-2 text-gray-600">Nouvelles photos</p>
                <div className="grid grid-cols-3 gap-4">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative">
                      <img
                        src={photo.preview}
                        alt={`Nouvelle photo ${index + 1}`}
                        className="w-full h-40 object-cover rounded-xl border-2"
                        style={{ borderColor: '#6A8A82' }}
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-all shadow-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-6 p-6">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2" style={{ color: '#191919' }}>
                Finalisation
              </h3>
              <p className="text-gray-600">Notes de résolution (optionnel)</p>
            </div>
            <div className="bg-gradient-to-br from-sage/5 to-transparent rounded-xl p-6 border-2" style={{ borderColor: '#E8EFED' }}>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>
                  Notes de résolution
                </label>
                <textarea
                  name="resolution_notes"
                  value={formData.resolution_notes}
                  onChange={handleInputChange}
                  placeholder="Ajoutez des notes sur la résolution de l'incident..."
                  rows={6}
                  className="w-full px-4 py-3 rounded-xl border-2 focus:border-sage focus:ring-4 focus:ring-sage/10 outline-none transition-all resize-none text-gray-900 placeholder-gray-400"
                  style={{ borderColor: '#E8ECEC' }}
                />
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gray-50 rounded-xl p-6 border-2" style={{ borderColor: '#E8ECEC' }}>
              <h4 className="font-semibold mb-4" style={{ color: '#191919' }}>Résumé des modifications</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Type</p>
                  <p className="font-medium">{formData.incident_type}</p>
                </div>
                <div>
                  <p className="text-gray-500">Gravité</p>
                  <p className="font-medium">{formData.severity}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-500">Titre</p>
                  <p className="font-medium">{formData.title}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-500">Adresse</p>
                  <p className="font-medium">{formData.address}</p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen || !incident) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2" style={{ borderColor: '#E8ECEC' }}>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#F5E8DD' }}>
              <AlertTriangle className="w-6 h-6" style={{ color: '#B87333' }} />
            </div>
            <div>
              <h2 className="text-2xl font-bold" style={{ color: '#191919' }}>
                Modifier l'Incident
              </h2>
              <p className="text-sm text-gray-600">INC-{incident.id} • Étape {currentStep} sur {STEPS.length}</p>
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

        {/* Stepper */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                        isActive ? 'shadow-lg scale-110' : isCompleted ? 'shadow-md' : ''
                      }`}
                      style={{
                        backgroundColor: isActive ? '#6A8A82' : isCompleted ? '#B87333' : '#E8ECEC',
                        color: isActive || isCompleted ? '#ffffff' : '#6B7280',
                      }}
                    >
                      {isCompleted ? (
                        <Check className="w-6 h-6" />
                      ) : (
                        <Icon className="w-6 h-6" />
                      )}
                    </div>
                    <p
                      className={`text-xs mt-2 font-medium text-center ${
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
                    <div className="flex-1 h-1 mx-2 rounded-full" style={{ backgroundColor: isCompleted ? '#B87333' : '#E8ECEC' }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="min-h-[450px] max-h-[50vh] overflow-y-auto">
            {renderStepContent()}
          </div>

          {/* Footer Navigation */}
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

            <div className="flex items-center space-x-3">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handlePrevious}
                  disabled={isSubmitting}
                  className="flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all hover:shadow-md disabled:opacity-50"
                  style={{ backgroundColor: '#E8EFED', color: '#6A8A82' }}
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span>Précédent</span>
                </button>
              )}

              {currentStep < STEPS.length ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
                  style={{ backgroundColor: '#6A8A82' }}
                >
                  <span>Suivant</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50"
                  style={{ backgroundColor: '#B87333' }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Enregistrement...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      <span>Enregistrer les modifications</span>
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
