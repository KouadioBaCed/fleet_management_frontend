import { useState, useEffect, useRef } from 'react';
import { X, AlertTriangle, FileText, MapPin, Camera, ChevronRight, ChevronLeft, Check, Search, Loader2, User, Car } from 'lucide-react';
import { driversApi } from '@/api/drivers';
import { vehiclesApi } from '@/api/vehicles';
import type { Driver } from '@/types';

interface AddIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

interface AddressSuggestion {
  display_name: string;
  lat: string;
  lon: string;
}

interface Vehicle {
  id: number;
  license_plate: string;
  brand: string;
  model: string;
  status: string;
}

const STEPS = [
  { id: 1, title: 'Type & Gravité', icon: AlertTriangle },
  { id: 2, title: 'Description', icon: FileText },
  { id: 3, title: 'Assignation', icon: User },
  { id: 4, title: 'Localisation', icon: MapPin },
  { id: 5, title: 'Photos', icon: Camera },
  { id: 6, title: 'Finalisation', icon: Check },
];

export default function AddIncidentModal({ isOpen, onClose, onSubmit }: AddIncidentModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    incident_type: 'flat_tire' as string,
    severity: 'minor' as string,
    title: '',
    description: '',
    latitude: '',
    longitude: '',
    address: '',
    estimated_cost: '',
    resolution_notes: '',
    driver: '' as string,
    vehicle: '' as string,
  });

  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([]);

  // Drivers and vehicles state
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoadingDrivers, setIsLoadingDrivers] = useState(false);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(false);

  // Address search state
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Fetch drivers and vehicles when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchDrivers();
      fetchVehicles();
    }
  }, [isOpen]);

  const fetchDrivers = async () => {
    setIsLoadingDrivers(true);
    try {
      const response = await driversApi.getAll();
      setDrivers(response.results || []);
    } catch (error) {
      console.error('Error fetching drivers:', error);
    } finally {
      setIsLoadingDrivers(false);
    }
  };

  const fetchVehicles = async () => {
    setIsLoadingVehicles(true);
    try {
      const response = await vehiclesApi.getAll();
      setVehicles(response.results || []);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setIsLoadingVehicles(false);
    }
  };

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

    setIsSearching(true);
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
      setIsSearching(false);
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + photos.length > 3) {
      alert('Vous ne pouvez ajouter que 3 photos maximum');
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Always use FormData for consistency
    const formDataObj = new FormData();

    // Required fields
    formDataObj.append('incident_type', formData.incident_type);
    formDataObj.append('severity', formData.severity);
    formDataObj.append('title', formData.title);
    formDataObj.append('description', formData.description);

    // Coordinates
    if (formData.latitude) {
      formDataObj.append('latitude', formData.latitude);
    }
    if (formData.longitude) {
      formDataObj.append('longitude', formData.longitude);
    }

    // Driver and Vehicle
    if (formData.driver) {
      formDataObj.append('driver', formData.driver);
    }
    if (formData.vehicle) {
      formDataObj.append('vehicle', formData.vehicle);
    }

    // Optional fields
    if (formData.address) {
      formDataObj.append('address', formData.address);
    }
    if (formData.estimated_cost) {
      formDataObj.append('estimated_cost', formData.estimated_cost);
    }
    if (formData.resolution_notes) {
      formDataObj.append('resolution_notes', formData.resolution_notes);
    }

    // Add photos only if they exist
    photos.forEach((photo, index) => {
      if (photo.file instanceof File) {
        formDataObj.append(`photo${index + 1}`, photo.file);
      }
    });

    // Debug: Log form data
    console.log('=== INCIDENT FORM DATA ===');
    console.log('FormData contents:');
    for (const [key, value] of formDataObj.entries()) {
      if (value instanceof File) {
        console.log(`  ${key}: [File] ${value.name} (${value.size} bytes)`);
      } else {
        console.log(`  ${key}: ${value}`);
      }
    }

    onSubmit(formDataObj);
  };

  const handleClose = () => {
    setCurrentStep(1);
    photos.forEach(photo => URL.revokeObjectURL(photo.preview));
    setPhotos([]);
    setAddressSuggestions([]);
    setShowSuggestions(false);
    setFormData({
      incident_type: 'flat_tire',
      severity: 'minor',
      title: '',
      description: '',
      latitude: '',
      longitude: '',
      address: '',
      estimated_cost: '',
      resolution_notes: '',
      driver: '',
      vehicle: '',
    });
    onClose();
  };

  const getSelectedDriver = () => {
    return drivers.find(d => d.id.toString() === formData.driver);
  };

  const getSelectedVehicle = () => {
    return vehicles.find(v => v.id.toString() === formData.vehicle);
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
              <p className="text-gray-600">Classifiez l'incident survenu</p>
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
              <p className="text-gray-600">Détails de ce qui s'est passé</p>
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
                Assignation
              </h3>
              <p className="text-gray-600">Sélectionnez le chauffeur et le véhicule impliqués</p>
            </div>
            <div className="bg-gradient-to-br from-sage/5 to-transparent rounded-xl p-6 border-2" style={{ borderColor: '#E8EFED' }}>
              <div className="space-y-5">
                {/* Driver Selection */}
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>
                    Chauffeur impliqué (optionnel)
                  </label>
                  {isLoadingDrivers ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                    </div>
                  ) : (
                    <select
                      name="driver"
                      value={formData.driver}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border-2 focus:border-sage focus:ring-4 focus:ring-sage/10 outline-none transition-all text-gray-900"
                      style={{ borderColor: '#E8ECEC' }}
                    >
                      <option value="">-- Sélectionner un chauffeur --</option>
                      {drivers.map(driver => (
                        <option key={driver.id} value={driver.id}>
                          {driver.full_name} ({driver.employee_id})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Vehicle Selection */}
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>
                    Véhicule impliqué (optionnel)
                  </label>
                  {isLoadingVehicles ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                    </div>
                  ) : (
                    <select
                      name="vehicle"
                      value={formData.vehicle}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border-2 focus:border-sage focus:ring-4 focus:ring-sage/10 outline-none transition-all text-gray-900"
                      style={{ borderColor: '#E8ECEC' }}
                    >
                      <option value="">-- Sélectionner un véhicule --</option>
                      {vehicles.map(vehicle => (
                        <option key={vehicle.id} value={vehicle.id}>
                          {vehicle.license_plate} - {vehicle.brand} {vehicle.model}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Selected Info Display */}
                {(formData.driver || formData.vehicle) && (
                  <div className="mt-4 p-4 rounded-xl bg-gray-50 border-2" style={{ borderColor: '#E8ECEC' }}>
                    <p className="text-sm font-semibold mb-2" style={{ color: '#191919' }}>Sélection actuelle :</p>
                    {formData.driver && getSelectedDriver() && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <User className="w-4 h-4" style={{ color: '#6A8A82' }} />
                        <span>{getSelectedDriver()?.full_name}</span>
                      </div>
                    )}
                    {formData.vehicle && getSelectedVehicle() && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Car className="w-4 h-4" style={{ color: '#B87333' }} />
                        <span>{getSelectedVehicle()?.license_plate} - {getSelectedVehicle()?.brand} {getSelectedVehicle()?.model}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6 p-6">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2" style={{ color: '#191919' }}>
                Localisation
              </h3>
              <p className="text-gray-600">Où l'incident s'est-il produit?</p>
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
                      {isSearching ? (
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

      case 5:
        return (
          <div className="space-y-6 p-6">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2" style={{ color: '#191919' }}>
                Photos de l'incident
              </h3>
              <p className="text-gray-600">Ajoutez jusqu'à 3 photos (optionnel)</p>
            </div>

            {photos.length < 3 && (
              <div
                className="border-2 border-dashed rounded-2xl p-12 text-center transition-all hover:border-sage cursor-pointer"
                style={{ borderColor: '#E8ECEC', backgroundColor: '#F0F3F2' }}
                onClick={() => document.getElementById('incident-photos-upload')?.click()}
              >
                <div className="w-24 h-24 mx-auto mb-4 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#E8EFED' }}>
                  <Camera className="w-12 h-12" style={{ color: '#6A8A82' }} />
                </div>
                <p className="text-lg font-semibold mb-2" style={{ color: '#6A8A82' }}>
                  Cliquez pour ajouter des photos
                </p>
                <p className="text-sm text-gray-500">PNG, JPG ou JPEG jusqu'à 10MB chacune</p>
                <p className="text-xs text-gray-400 mt-2">({photos.length}/3 photos ajoutées)</p>
                <input
                  type="file"
                  id="incident-photos-upload"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
            )}

            {photos.length > 0 && (
              <div className="grid grid-cols-3 gap-4">
                {photos.map((photo, index) => (
                  <div key={index} className="relative">
                    <img
                      src={photo.preview}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-40 object-cover rounded-xl border-2"
                      style={{ borderColor: '#E8ECEC' }}
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
            )}
          </div>
        );

      case 6:
        return (
          <div className="space-y-6 p-6">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2" style={{ color: '#191919' }}>
                Finalisation
              </h3>
              <p className="text-gray-600">Vérifiez les informations et ajoutez des notes</p>
            </div>
            <div className="bg-gradient-to-br from-sage/5 to-transparent rounded-xl p-6 border-2" style={{ borderColor: '#E8EFED' }}>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>
                  Notes de résolution (optionnel)
                </label>
                <textarea
                  name="resolution_notes"
                  value={formData.resolution_notes}
                  onChange={handleInputChange}
                  placeholder="Ajoutez des notes sur la résolution de l'incident..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border-2 focus:border-sage focus:ring-4 focus:ring-sage/10 outline-none transition-all resize-none text-gray-900 placeholder-gray-400"
                  style={{ borderColor: '#E8ECEC' }}
                />
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gray-50 rounded-xl p-6 border-2" style={{ borderColor: '#E8ECEC' }}>
              <h4 className="font-semibold mb-4" style={{ color: '#191919' }}>Résumé de l'incident</h4>
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
                {formData.driver && getSelectedDriver() && (
                  <div>
                    <p className="text-gray-500">Chauffeur</p>
                    <p className="font-medium">{getSelectedDriver()?.full_name}</p>
                  </div>
                )}
                {formData.vehicle && getSelectedVehicle() && (
                  <div>
                    <p className="text-gray-500">Véhicule</p>
                    <p className="font-medium">{getSelectedVehicle()?.license_plate}</p>
                  </div>
                )}
                <div className="col-span-2">
                  <p className="text-gray-500">Adresse</p>
                  <p className="font-medium line-clamp-2">{formData.address || 'Non spécifiée'}</p>
                </div>
                {formData.latitude && formData.longitude && (
                  <div className="col-span-2">
                    <p className="text-gray-500">Coordonnées</p>
                    <p className="font-medium font-mono text-xs">
                      {parseFloat(formData.latitude).toFixed(6)}, {parseFloat(formData.longitude).toFixed(6)}
                    </p>
                  </div>
                )}
                {photos.length > 0 && (
                  <div className="col-span-2">
                    <p className="text-gray-500">Photos</p>
                    <p className="font-medium">{photos.length} photo(s) ajoutée(s)</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

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
                Déclarer un Incident
              </h2>
              <p className="text-sm text-gray-600">Étape {currentStep} sur {STEPS.length}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
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
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                        isActive ? 'shadow-lg scale-110' : isCompleted ? 'shadow-md' : ''
                      }`}
                      style={{
                        backgroundColor: isActive ? '#6A8A82' : isCompleted ? '#B87333' : '#E8ECEC',
                        color: isActive || isCompleted ? '#ffffff' : '#6B7280',
                      }}
                    >
                      {isCompleted ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <Icon className="w-5 h-5" />
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
                    <div className="flex-1 h-1 mx-1 rounded-full" style={{ backgroundColor: isCompleted ? '#B87333' : '#E8ECEC' }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="min-h-[400px] max-h-[50vh] overflow-y-auto">
            {renderStepContent()}
          </div>

          {/* Footer Navigation */}
          <div className="flex items-center justify-between p-6 border-t-2 bg-gray-50" style={{ borderColor: '#E8ECEC' }}>
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-3 rounded-xl font-semibold transition-all hover:bg-gray-200"
              style={{ backgroundColor: '#E8ECEC', color: '#6B7280' }}
            >
              Annuler
            </button>

            <div className="flex items-center space-x-3">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handlePrevious}
                  className="flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all hover:shadow-md"
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
                  className="flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
                  style={{ backgroundColor: '#B87333' }}
                >
                  <Check className="w-5 h-5" />
                  <span>Déclarer l'incident</span>
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
