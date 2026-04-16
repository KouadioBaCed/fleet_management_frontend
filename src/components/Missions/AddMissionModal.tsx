import { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  MapPin,
  Calendar,
  User,
  Car,
  ChevronRight,
  ChevronLeft,
  Check,
  AlertCircle,
  Navigation,
  Loader2,
  FileText,
  Flag,
  Clock,
  Phone,
  AlertTriangle,
  Search,
  Plus,
  Trash2,
} from 'lucide-react';
import { vehiclesApi } from '@/api/vehicles';
import { driversApi } from '@/api/drivers';
import type { Vehicle, Driver } from '@/types';

// Helper pour construire les URLs des images
const getMediaUrl = (path: string | null | undefined): string | null => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000';
  return `${baseUrl}${path}`;
};

// Interface pour les suggestions d'adresse
interface AddressSuggestion {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

interface AddMissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

interface FormErrors {
  [key: string]: string;
}

const STEPS = [
  { id: 1, title: 'Assignation', icon: User },
  { id: 2, title: 'Informations', icon: FileText },
  { id: 3, title: 'Itinéraire', icon: MapPin },
  { id: 4, title: 'Planning', icon: Calendar },
  { id: 5, title: 'Finalisation', icon: Check },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Faible', color: '#6B7280', bgColor: '#E8ECEC', description: 'Pas de délai spécifique' },
  { value: 'medium', label: 'Moyenne', color: '#6A8A82', bgColor: '#E8EFED', description: 'À réaliser dans la journée' },
  { value: 'high', label: 'Haute', color: '#B87333', bgColor: '#F5E8DD', description: 'À traiter en priorité' },
  { value: 'urgent', label: 'Urgente', color: '#DC2626', bgColor: '#FEE2E2', description: 'Traitement immédiat requis' },
];

export default function AddMissionModal({ isOpen, onClose, onSubmit }: AddMissionModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Available resources from API
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([]);
  const [availableDrivers, setAvailableDrivers] = useState<Driver[]>([]);
  const [loadingResources, setLoadingResources] = useState(false);

  // Inline vehicle-to-driver assignment
  const [vehicleToAssign, setVehicleToAssign] = useState('');
  const [assigningVehicle, setAssigningVehicle] = useState(false);
  const [assignVehicleError, setAssignVehicleError] = useState<string | null>(null);

  // Address autocomplete state
  const [originSuggestions, setOriginSuggestions] = useState<AddressSuggestion[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<AddressSuggestion[]>([]);
  const [isSearchingOrigin, setIsSearchingOrigin] = useState(false);
  const [isSearchingDestination, setIsSearchingDestination] = useState(false);
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);
  const originSearchTimeout = useRef<NodeJS.Timeout | null>(null);
  const destinationSearchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Checkpoint autocomplete state
  const [checkpointSuggestions, setCheckpointSuggestions] = useState<Record<number, AddressSuggestion[]>>({});
  const [isSearchingCheckpoint, setIsSearchingCheckpoint] = useState<Record<number, boolean>>({});
  const [showCheckpointSuggestions, setShowCheckpointSuggestions] = useState<Record<number, boolean>>({});
  const checkpointSearchTimeouts = useRef<Record<number, NodeJS.Timeout>>({});

  const [formData, setFormData] = useState({
    mission_code: '',
    title: '',
    description: '',

    // Itineraire
    origin_address: '',
    origin_latitude: '',
    origin_longitude: '',
    destination_address: '',
    destination_latitude: '',
    destination_longitude: '',
    estimated_distance: '',
    checkpoints: [] as Array<{ address: string; latitude: string; longitude: string; notes: string }>,

    // Planning
    scheduled_start: '',
    scheduled_end: '',

    // Assignation
    vehicle: '',
    driver: '',

    // Finalisation
    priority: 'medium',
    responsible_person_name: '',
    responsible_person_phone: '',
    notes: '',
  });

  // Generate mission code
  const generateMissionCode = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `MISS-${year}${month}${day}-${random}`;
  };

  // Load available vehicles and drivers
  const loadResources = async () => {
    setLoadingResources(true);
    try {
      const [vehicles, drivers] = await Promise.all([
        vehiclesApi.getAvailable(),
        driversApi.getAvailable(),
      ]);
      setAvailableVehicles(vehicles);
      // Ne garder que les chauffeurs qui ont un véhicule assigné
      setAvailableDrivers(drivers);
    } catch (error) {
      console.error('Error loading resources:', error);
    } finally {
      setLoadingResources(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadResources();
      setFormData(prev => ({
        ...prev,
        mission_code: generateMissionCode(),
      }));
    }
  }, [isOpen]);

  // Fermer les suggestions quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = () => {
      setShowOriginSuggestions(false);
      setShowDestinationSuggestions(false);
      setShowCheckpointSuggestions({});
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Fonction de recherche d'adresse via OpenStreetMap Nominatim — biaisée Côte d'Ivoire
  // countrycodes=ci : filtre strictement les résultats au pays
  // viewbox + bounded=1 : priorise la zone géographique ivoirienne pour plus de précision
  const searchAddress = async (query: string): Promise<AddressSuggestion[]> => {
    if (query.length < 3) return [];

    try {
      // Bounding box Côte d'Ivoire : ~(-8.6, 10.7) Nord-Ouest → (-2.5, 4.3) Sud-Est
      const params = new URLSearchParams({
        format: 'json',
        q: query,
        limit: '8',
        addressdetails: '1',
        countrycodes: 'ci',
        'accept-language': 'fr',
        viewbox: '-8.6,10.7,-2.5,4.3',
        bounded: '1',
      });
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?${params.toString()}`,
        { headers: { 'Accept-Language': 'fr' } }
      );
      const data = await response.json();
      return data.map((item: any) => ({
        place_id: item.place_id,
        display_name: item.display_name,
        lat: item.lat,
        lon: item.lon,
      }));
    } catch (error) {
      console.error('Error searching address:', error);
      return [];
    }
  };

  // Reverse geocoding : coordonnées → adresse lisible
  const reverseGeocode = async (lat: number, lon: number): Promise<string> => {
    try {
      const params = new URLSearchParams({
        format: 'json',
        lat: String(lat),
        lon: String(lon),
        'accept-language': 'fr',
        zoom: '18',
        addressdetails: '1',
      });
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
        headers: { 'Accept-Language': 'fr' },
      });
      const data = await res.json();
      return data.display_name || `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
    } catch {
      return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
    }
  };

  // Géolocalisation du navigateur
  const [isGeolocating, setIsGeolocating] = useState<'origin' | 'destination' | `cp_${number}` | null>(null);
  const [geolocationError, setGeolocationError] = useState<string | null>(null);

  const getCurrentPosition = (): Promise<GeolocationPosition> =>
    new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        reject(new Error("La géolocalisation n'est pas supportée par ce navigateur"));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      });
    });

  const useMyLocationFor = async (target: 'origin' | 'destination' | { checkpoint: number }) => {
    const key = typeof target === 'string' ? target : (`cp_${target.checkpoint}` as const);
    setIsGeolocating(key);
    setGeolocationError(null);
    try {
      const pos = await getCurrentPosition();
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      const address = await reverseGeocode(lat, lon);

      if (target === 'origin') {
        setFormData(prev => {
          const updated = { ...prev, origin_address: address, origin_latitude: String(lat), origin_longitude: String(lon) };
          setTimeout(() => recalculateDistance(updated), 0);
          return updated;
        });
        setShowOriginSuggestions(false);
      } else if (target === 'destination') {
        setFormData(prev => {
          const updated = { ...prev, destination_address: address, destination_latitude: String(lat), destination_longitude: String(lon) };
          setTimeout(() => recalculateDistance(updated), 0);
          return updated;
        });
        setShowDestinationSuggestions(false);
      } else {
        const idx = target.checkpoint;
        setFormData(prev => {
          const cps = [...prev.checkpoints];
          cps[idx] = { ...cps[idx], address, latitude: String(lat), longitude: String(lon) };
          const updated = { ...prev, checkpoints: cps };
          setTimeout(() => recalculateDistance(updated), 0);
          return updated;
        });
        setShowCheckpointSuggestions(prev => ({ ...prev, [idx]: false }));
      }
    } catch (err: any) {
      const msg = err?.code === 1
        ? "Permission de géolocalisation refusée. Autorisez l'accès dans votre navigateur."
        : err?.code === 2
        ? 'Position indisponible. Vérifiez votre connexion / GPS.'
        : err?.code === 3
        ? "Délai de géolocalisation dépassé."
        : err?.message || 'Impossible de récupérer votre position.';
      setGeolocationError(msg);
    } finally {
      setIsGeolocating(null);
    }
  };

  // Recherche d'adresse avec debounce pour l'origine
  const handleOriginSearch = (value: string) => {
    setFormData(prev => ({ ...prev, origin_address: value }));

    if (originSearchTimeout.current) {
      clearTimeout(originSearchTimeout.current);
    }

    if (value.length < 3) {
      setOriginSuggestions([]);
      setShowOriginSuggestions(false);
      return;
    }

    setIsSearchingOrigin(true);
    originSearchTimeout.current = setTimeout(async () => {
      const suggestions = await searchAddress(value);
      setOriginSuggestions(suggestions);
      setShowOriginSuggestions(suggestions.length > 0);
      setIsSearchingOrigin(false);
    }, 500);
  };

  // Recherche d'adresse avec debounce pour la destination
  const handleDestinationSearch = (value: string) => {
    setFormData(prev => ({ ...prev, destination_address: value }));

    if (destinationSearchTimeout.current) {
      clearTimeout(destinationSearchTimeout.current);
    }

    if (value.length < 3) {
      setDestinationSuggestions([]);
      setShowDestinationSuggestions(false);
      return;
    }

    setIsSearchingDestination(true);
    destinationSearchTimeout.current = setTimeout(async () => {
      const suggestions = await searchAddress(value);
      setDestinationSuggestions(suggestions);
      setShowDestinationSuggestions(suggestions.length > 0);
      setIsSearchingDestination(false);
    }, 500);
  };

  // Sélection d'une adresse d'origine
  const selectOriginAddress = (suggestion: AddressSuggestion) => {
    setFormData(prev => {
      const updated = {
        ...prev,
        origin_address: suggestion.display_name,
        origin_latitude: suggestion.lat,
        origin_longitude: suggestion.lon,
      };
      setTimeout(() => recalculateDistance(updated), 0);
      return updated;
    });
    setShowOriginSuggestions(false);
    setOriginSuggestions([]);
  };

  // Sélection d'une adresse de destination
  const selectDestinationAddress = (suggestion: AddressSuggestion) => {
    setFormData(prev => {
      const updated = {
        ...prev,
        destination_address: suggestion.display_name,
        destination_latitude: suggestion.lat,
        destination_longitude: suggestion.lon,
      };
      setTimeout(() => recalculateDistance(updated), 0);
      return updated;
    });
    setShowDestinationSuggestions(false);
    setDestinationSuggestions([]);
  };

  // Calcul Haversine entre deux points
  const haversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Recalcul distance multi-segments (origin -> checkpoints -> destination)
  const recalculateDistance = (data: typeof formData) => {
    const points: Array<{ lat: number; lng: number }> = [];

    if (data.origin_latitude && data.origin_longitude) {
      points.push({ lat: parseFloat(data.origin_latitude), lng: parseFloat(data.origin_longitude) });
    }
    for (const cp of data.checkpoints) {
      if (cp.latitude && cp.longitude) {
        points.push({ lat: parseFloat(cp.latitude), lng: parseFloat(cp.longitude) });
      }
    }
    if (data.destination_latitude && data.destination_longitude) {
      points.push({ lat: parseFloat(data.destination_latitude), lng: parseFloat(data.destination_longitude) });
    }

    if (points.length < 2) return;

    let totalDistance = 0;
    for (let i = 0; i < points.length - 1; i++) {
      totalDistance += haversine(points[i].lat, points[i].lng, points[i + 1].lat, points[i + 1].lng);
    }

    const routeDistance = (totalDistance * 1.2).toFixed(1);
    setFormData(prev => ({ ...prev, estimated_distance: routeDistance }));
  };

  // Legacy wrapper pour origin/destination
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    recalculateDistance(formData);
  };

  // --- Checkpoint handlers ---
  const addCheckpoint = () => {
    setFormData(prev => ({
      ...prev,
      checkpoints: [...prev.checkpoints, { address: '', latitude: '', longitude: '', notes: '' }],
    }));
  };

  const removeCheckpoint = (index: number) => {
    setFormData(prev => {
      const updated = { ...prev, checkpoints: prev.checkpoints.filter((_, i) => i !== index) };
      setTimeout(() => recalculateDistance(updated), 0);
      return updated;
    });
    // Cleanup suggestion state
    setCheckpointSuggestions(prev => { const n = { ...prev }; delete n[index]; return n; });
    setShowCheckpointSuggestions(prev => { const n = { ...prev }; delete n[index]; return n; });
    setIsSearchingCheckpoint(prev => { const n = { ...prev }; delete n[index]; return n; });
  };

  const handleCheckpointSearch = (index: number, value: string) => {
    setFormData(prev => {
      const cps = [...prev.checkpoints];
      cps[index] = { ...cps[index], address: value, latitude: '', longitude: '' };
      return { ...prev, checkpoints: cps };
    });

    if (checkpointSearchTimeouts.current[index]) {
      clearTimeout(checkpointSearchTimeouts.current[index]);
    }

    if (value.length < 3) {
      setCheckpointSuggestions(prev => ({ ...prev, [index]: [] }));
      setShowCheckpointSuggestions(prev => ({ ...prev, [index]: false }));
      return;
    }

    setIsSearchingCheckpoint(prev => ({ ...prev, [index]: true }));
    checkpointSearchTimeouts.current[index] = setTimeout(async () => {
      const suggestions = await searchAddress(value);
      setCheckpointSuggestions(prev => ({ ...prev, [index]: suggestions }));
      setShowCheckpointSuggestions(prev => ({ ...prev, [index]: suggestions.length > 0 }));
      setIsSearchingCheckpoint(prev => ({ ...prev, [index]: false }));
    }, 500);
  };

  const selectCheckpointAddress = (index: number, suggestion: AddressSuggestion) => {
    setFormData(prev => {
      const cps = [...prev.checkpoints];
      cps[index] = { ...cps[index], address: suggestion.display_name, latitude: suggestion.lat, longitude: suggestion.lon };
      const updated = { ...prev, checkpoints: cps };
      setTimeout(() => recalculateDistance(updated), 0);
      return updated;
    });
    setShowCheckpointSuggestions(prev => ({ ...prev, [index]: false }));
    setCheckpointSuggestions(prev => ({ ...prev, [index]: [] }));
  };

  const updateCheckpointNotes = (index: number, notes: string) => {
    setFormData(prev => {
      const cps = [...prev.checkpoints];
      cps[index] = { ...cps[index], notes };
      return { ...prev, checkpoints: cps };
    });
  };

  const handleAssignVehicleToDriver = async () => {
    const driverId = parseInt(formData.driver);
    const vehicleId = parseInt(vehicleToAssign);
    if (!driverId || !vehicleId) return;
    setAssigningVehicle(true);
    setAssignVehicleError(null);
    try {
      await vehiclesApi.assignDriver(vehicleId, driverId);
      await loadResources();
      setFormData(prev => ({ ...prev, vehicle: String(vehicleId) }));
      setVehicleToAssign('');
    } catch (err: any) {
      setAssignVehicleError(err.response?.data?.error || err.response?.data?.detail || "Erreur lors de l'assignation du véhicule");
    } finally {
      setAssigningVehicle(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Auto-fill vehicle when driver is selected
    if (name === 'driver') {
      const selectedDriver = availableDrivers.find(d => String(d.id) === value);
      if (selectedDriver?.current_vehicle) {
        setFormData(prev => ({ ...prev, [name]: value, vehicle: String(selectedDriver.current_vehicle!.id) }));
      } else {
        setFormData(prev => ({ ...prev, [name]: value, vehicle: '' }));
      }
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: FormErrors = {};

    switch (step) {
      case 1:
        if (!formData.driver) newErrors.driver = 'Un chauffeur doit etre selectionne';
        if (formData.driver && !formData.vehicle) newErrors.driver = 'Ce chauffeur n\'a pas de véhicule assigné';
        break;

      case 2:
        if (!formData.mission_code.trim()) newErrors.mission_code = 'Le code mission est requis';
        if (!formData.title.trim()) newErrors.title = 'Le titre est requis';
        if (formData.title.trim().length < 3) newErrors.title = 'Le titre doit contenir au moins 3 caractères';
        if (!formData.description.trim()) newErrors.description = 'La description est requise';
        if (formData.description.trim().length < 10) newErrors.description = 'La description doit contenir au moins 10 caractères';
        break;

      case 3:
        if (!formData.origin_address.trim()) {
          newErrors.origin_address = 'Recherchez et sélectionnez une adresse d\'origine';
        } else if (!formData.origin_latitude || !formData.origin_longitude) {
          newErrors.origin_address = 'Veuillez sélectionner une adresse dans la liste des suggestions';
        }
        if (!formData.destination_address.trim()) {
          newErrors.destination_address = 'Recherchez et sélectionnez une adresse de destination';
        } else if (!formData.destination_latitude || !formData.destination_longitude) {
          newErrors.destination_address = 'Veuillez sélectionner une adresse dans la liste des suggestions';
        }
        if (!formData.estimated_distance) {
          newErrors.estimated_distance = 'Sélectionnez les deux adresses pour calculer la distance';
        }
        formData.checkpoints.forEach((cp, index) => {
          if (!cp.address.trim()) {
            newErrors[`checkpoint_${index}_address`] = 'Adresse requise';
          } else if (!cp.latitude || !cp.longitude) {
            newErrors[`checkpoint_${index}_address`] = 'Sélectionnez une adresse dans les suggestions';
          }
        });
        break;

      case 4:
        if (!formData.scheduled_start) newErrors.scheduled_start = 'La date de debut est requise';
        if (!formData.scheduled_end) newErrors.scheduled_end = 'La date de fin est requise';
        if (formData.scheduled_start && formData.scheduled_end) {
          const start = new Date(formData.scheduled_start);
          const end = new Date(formData.scheduled_end);
          if (end <= start) {
            newErrors.scheduled_end = 'La date de fin doit etre posterieure a la date de debut';
          }
          if (start < new Date()) {
            newErrors.scheduled_start = 'La date de debut ne peut pas etre dans le passe';
          }
        }
        break;

      case 5:
        // Priority has a default value, so no validation needed
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep) && currentStep < STEPS.length) {
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

    if (!validateStep(currentStep)) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const submitData = {
        ...formData,
        origin_latitude: parseFloat(formData.origin_latitude),
        origin_longitude: parseFloat(formData.origin_longitude),
        destination_latitude: parseFloat(formData.destination_latitude),
        destination_longitude: parseFloat(formData.destination_longitude),
        estimated_distance: parseFloat(formData.estimated_distance),
        vehicle: parseInt(formData.vehicle),
        driver: parseInt(formData.driver),
        checkpoints: formData.checkpoints.map((cp, index) => ({
          order: index + 1,
          address: cp.address,
          latitude: parseFloat(cp.latitude),
          longitude: parseFloat(cp.longitude),
          notes: cp.notes,
        })),
      };
      await onSubmit(submitData);
      handleClose();
    } catch (err: any) {
      console.error('Error creating mission:', err);
      const errorMessage = err.response?.data?.error ||
        err.response?.data?.detail ||
        Object.values(err.response?.data || {}).flat().join(', ') ||
        'Erreur lors de la creation de la mission';
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setCurrentStep(1);
    setErrors({});
    setSubmitError(null);
    // Reset address suggestions
    setOriginSuggestions([]);
    setDestinationSuggestions([]);
    setShowOriginSuggestions(false);
    setShowDestinationSuggestions(false);
    setCheckpointSuggestions({});
    setShowCheckpointSuggestions({});
    setIsSearchingCheckpoint({});
    setFormData({
      mission_code: '',
      title: '',
      description: '',
      origin_address: '',
      origin_latitude: '',
      origin_longitude: '',
      destination_address: '',
      destination_latitude: '',
      destination_longitude: '',
      estimated_distance: '',
      checkpoints: [],
      scheduled_start: '',
      scheduled_end: '',
      vehicle: '',
      driver: '',
      priority: 'medium',
      responsible_person_name: '',
      responsible_person_phone: '',
      notes: '',
    });
    setVehicleToAssign('');
    setAssignVehicleError(null);
    setAssigningVehicle(false);
    onClose();
  };

  const renderError = (field: string) => {
    if (!errors[field]) return null;
    return (
      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
        <AlertCircle className="w-3 h-3" />
        {errors[field]}
      </p>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1: {
        const selectedDriver = availableDrivers.find(d => String(d.id) === formData.driver);
        return (
          <div className="space-y-6 p-6">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2" style={{ color: '#191919' }}>
                Assignation
              </h3>
              <p className="text-gray-600">Selectionnez un chauffeur, son véhicule sera assigné automatiquement</p>
            </div>

            {loadingResources ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-10 h-10 animate-spin mb-4" style={{ color: '#6A8A82' }} />
                <p className="text-gray-600">Chargement des ressources disponibles...</p>
              </div>
            ) : (
              <>
                {/* Chauffeur */}
                <div className="bg-gradient-to-br from-copper/5 to-transparent rounded-xl p-6 border-2" style={{ borderColor: '#F5E8DD' }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm" style={{ backgroundColor: '#B87333' }}>
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold" style={{ color: '#191919' }}>Chauffeur</h4>
                      <p className="text-xs text-gray-500">{availableDrivers.length} chauffeur(s) disponible(s)</p>
                    </div>
                  </div>

                  {availableDrivers.length === 0 ? (
                    <div className="p-4 rounded-lg flex items-center gap-3" style={{ backgroundColor: '#FEF3C7' }}>
                      <AlertTriangle className="w-5 h-5" style={{ color: '#D97706' }} />
                      <p className="text-sm" style={{ color: '#92400E' }}>
                        Aucun chauffeur disponible pour le moment
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {availableDrivers.map((driver) => (
                        <label
                          key={driver.id}
                          className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            formData.driver === String(driver.id) ? 'shadow-md' : 'hover:shadow-sm'
                          }`}
                          style={{
                            borderColor: formData.driver === String(driver.id) ? '#B87333' : '#E8ECEC',
                            backgroundColor: formData.driver === String(driver.id) ? '#F5E8DD' : 'white',
                          }}
                        >
                          <input
                            type="radio"
                            name="driver"
                            value={driver.id}
                            checked={formData.driver === String(driver.id)}
                            onChange={handleInputChange}
                            className="hidden"
                          />
                          {getMediaUrl(driver.photo || driver.user?.profile_picture) ? (
                            <img
                              src={getMediaUrl(driver.photo || driver.user?.profile_picture) || ''}
                              alt={driver.full_name}
                              className="w-12 h-12 rounded-lg object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getMediaUrl(driver.photo || driver.user?.profile_picture) ? 'hidden' : ''}`} style={{ backgroundColor: '#F5E8DD' }}>
                            <User className="w-6 h-6" style={{ color: '#B87333' }} />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold" style={{ color: '#191919' }}>
                              {driver.full_name}
                            </p>
                            <p className="text-sm text-gray-500 font-mono">{driver.employee_id}</p>
                            {driver.current_vehicle && (
                              <p className="text-xs mt-1" style={{ color: '#6A8A82' }}>
                                <Car className="w-3 h-3 inline mr-1" />
                                {driver.current_vehicle.brand} {driver.current_vehicle.model} — {driver.current_vehicle.license_plate}
                              </p>
                            )}
                            {!driver.current_vehicle && (
                              <p className="text-xs mt-1 text-red-400">Aucun véhicule assigné</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium" style={{ color: '#B87333' }}>
                              {Number(driver.rating || 0).toFixed(1)} ★
                            </p>
                            <p className="text-xs text-gray-500">{driver.total_trips || 0} missions</p>
                          </div>
                          {formData.driver === String(driver.id) && (
                            <Check className="w-5 h-5" style={{ color: '#B87333' }} />
                          )}
                        </label>
                      ))}
                    </div>
                  )}
                  {renderError('driver')}
                </div>

                {/* Aucun véhicule — permettre assignation inline */}
                {selectedDriver && !selectedDriver.current_vehicle && (
                  <div className="bg-gradient-to-br from-red-50 to-transparent rounded-xl p-6 border-2" style={{ borderColor: '#FEE2E2' }}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm" style={{ backgroundColor: '#DC2626' }}>
                        <AlertTriangle className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold" style={{ color: '#191919' }}>Aucun véhicule assigné</h4>
                        <p className="text-xs text-gray-500">Attribuez un véhicule à ce chauffeur pour continuer</p>
                      </div>
                    </div>
                    {availableVehicles.length === 0 ? (
                      <div className="p-4 rounded-lg flex items-center gap-3" style={{ backgroundColor: '#FEF3C7' }}>
                        <AlertTriangle className="w-5 h-5" style={{ color: '#D97706' }} />
                        <p className="text-sm" style={{ color: '#92400E' }}>Aucun véhicule disponible pour le moment</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <select
                          value={vehicleToAssign}
                          onChange={(e) => setVehicleToAssign(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none bg-white"
                          style={{ borderColor: '#E8ECEC' }}
                          disabled={assigningVehicle}
                        >
                          <option value="">-- Sélectionner un véhicule --</option>
                          {availableVehicles.map(v => (
                            <option key={v.id} value={v.id}>
                              {v.brand} {v.model} — {v.license_plate}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={handleAssignVehicleToDriver}
                          disabled={!vehicleToAssign || assigningVehicle}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                          style={{ backgroundColor: '#6A8A82' }}
                        >
                          {assigningVehicle ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              <span>Assignation en cours...</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-5 h-5" />
                              <span>Assigner ce véhicule au chauffeur</span>
                            </>
                          )}
                        </button>
                        {assignVehicleError && (
                          <div className="p-3 rounded-lg flex items-center gap-2" style={{ backgroundColor: '#FEE2E2' }}>
                            <AlertCircle className="w-4 h-4" style={{ color: '#DC2626' }} />
                            <p className="text-sm" style={{ color: '#991B1B' }}>{assignVehicleError}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Véhicule assigné automatiquement */}
                {selectedDriver?.current_vehicle && (
                  <div className="bg-gradient-to-br from-sage/5 to-transparent rounded-xl p-6 border-2" style={{ borderColor: '#E8EFED' }}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm" style={{ backgroundColor: '#6A8A82' }}>
                        <Car className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold" style={{ color: '#191919' }}>Véhicule assigné</h4>
                        <p className="text-xs text-gray-500">Automatiquement lié au chauffeur sélectionné</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 rounded-xl border-2" style={{ borderColor: '#6A8A82', backgroundColor: '#E8EFED' }}>
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#F0F3F2' }}>
                        <Car className="w-6 h-6" style={{ color: '#6A8A82' }} />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold" style={{ color: '#191919' }}>
                          {selectedDriver.current_vehicle.brand} {selectedDriver.current_vehicle.model}
                        </p>
                        <p className="text-sm text-gray-500 font-mono">{selectedDriver.current_vehicle.license_plate}</p>
                      </div>
                      <Check className="w-5 h-5" style={{ color: '#6A8A82' }} />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        );
      }

      case 2:
        return (
          <div className="space-y-6 p-6">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2" style={{ color: '#191919' }}>
                Informations generales
              </h3>
              <p className="text-gray-600">Titre et description de la mission</p>
            </div>
            <div className="bg-gradient-to-br from-sage/5 to-transparent rounded-xl p-6 border-2" style={{ borderColor: '#E8EFED' }}>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>
                    Code Mission *
                  </label>
                  <input
                    type="text"
                    name="mission_code"
                    value={formData.mission_code}
                    onChange={handleInputChange}
                    placeholder="MISS-2024-001"
                    className={`w-full px-4 py-3 rounded-xl border-2 focus:ring-4 focus:ring-sage/10 outline-none transition-all font-mono text-gray-900 placeholder-gray-400 ${
                      errors.mission_code ? 'border-red-300 focus:border-red-500' : 'focus:border-sage'
                    }`}
                    style={{ borderColor: errors.mission_code ? undefined : '#E8ECEC' }}
                  />
                  {renderError('mission_code')}
                  <p className="text-xs text-gray-500 mt-1">Code généré automatiquement, modifiable si besoin</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>
                    Titre de la mission *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Livraison Centre Commercial"
                    className={`w-full px-4 py-3 rounded-xl border-2 focus:ring-4 focus:ring-sage/10 outline-none transition-all text-gray-900 placeholder-gray-400 ${
                      errors.title ? 'border-red-300 focus:border-red-500' : 'focus:border-sage'
                    }`}
                    style={{ borderColor: errors.title ? undefined : '#E8ECEC' }}
                  />
                  {renderError('title')}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Décrivez la mission en détail : objectif, instructions particulières, marchandises..."
                    rows={4}
                    className={`w-full px-4 py-3 rounded-xl border-2 focus:ring-4 focus:ring-sage/10 outline-none transition-all resize-none text-gray-900 placeholder-gray-400 ${
                      errors.description ? 'border-red-300 focus:border-red-500' : 'focus:border-sage'
                    }`}
                    style={{ borderColor: errors.description ? undefined : '#E8ECEC' }}
                  />
                  {renderError('description')}
                  <p className="text-xs text-gray-500 mt-1">{formData.description.length}/500 caractères</p>
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
                Itinéraire
              </h3>
              <p className="text-gray-600">Recherchez les adresses (résultats en Côte d'Ivoire) ou utilisez votre position actuelle</p>
            </div>

            {geolocationError && (
              <div className="flex items-start gap-3 p-4 rounded-xl" style={{ backgroundColor: '#FEE2E2' }}>
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#DC2626' }} />
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: '#991B1B' }}>Géolocalisation impossible</p>
                  <p className="text-xs mt-0.5" style={{ color: '#991B1B' }}>{geolocationError}</p>
                </div>
                <button type="button" onClick={() => setGeolocationError(null)} className="flex-shrink-0">
                  <X className="w-4 h-4" style={{ color: '#991B1B' }} />
                </button>
              </div>
            )}

            {/* Origine */}
            <div className="bg-gradient-to-br from-sage/5 to-transparent rounded-xl p-6 border-2" style={{ borderColor: '#E8EFED' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm" style={{ backgroundColor: '#6A8A82' }}>
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-lg font-bold" style={{ color: '#191919' }}>Point de départ</h4>
              </div>
              <div className="space-y-4">
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                    <label className="block text-sm font-semibold" style={{ color: '#191919' }}>
                      <Search className="w-4 h-4 inline mr-2" style={{ color: '#6A8A82' }} />
                      Rechercher l'adresse d'origine *
                    </label>
                    <button
                      type="button"
                      onClick={() => useMyLocationFor('origin')}
                      disabled={isGeolocating !== null}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:shadow-sm disabled:opacity-50"
                      style={{ backgroundColor: '#E8EFED', color: '#6A8A82' }}
                      title="Utiliser ma position actuelle"
                    >
                      {isGeolocating === 'origin' ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Navigation className="w-3.5 h-3.5" />
                      )}
                      <span>Ma position</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.origin_address}
                      onChange={(e) => handleOriginSearch(e.target.value)}
                      onFocus={() => originSuggestions.length > 0 && setShowOriginSuggestions(true)}
                      placeholder="Tapez une adresse (ex: Cocody, Abidjan)"
                      className={`w-full px-4 py-3 pr-10 rounded-xl border-2 focus:ring-4 focus:ring-sage/10 outline-none transition-all text-gray-900 placeholder-gray-400 ${
                        errors.origin_address ? 'border-red-300 focus:border-red-500' : 'focus:border-sage'
                      }`}
                      style={{ borderColor: errors.origin_address ? undefined : '#E8ECEC' }}
                    />
                    {isSearchingOrigin && (
                      <Loader2 className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400" />
                    )}
                  </div>
                  {/* Suggestions dropdown */}
                  {showOriginSuggestions && originSuggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border-2 rounded-xl shadow-lg max-h-60 overflow-y-auto" style={{ borderColor: '#E8ECEC' }}>
                      {originSuggestions.map((suggestion) => (
                        <button
                          key={suggestion.place_id}
                          type="button"
                          onClick={() => selectOriginAddress(suggestion)}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-start gap-3 border-b last:border-b-0 transition-colors"
                          style={{ borderColor: '#E8ECEC' }}
                        >
                          <MapPin className="w-4 h-4 mt-1 flex-shrink-0" style={{ color: '#6A8A82' }} />
                          <span className="text-sm text-gray-700 line-clamp-2">{suggestion.display_name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {renderError('origin_address')}
                </div>

                {/* Coordonnées (lecture seule, remplies automatiquement) */}
                {formData.origin_latitude && formData.origin_longitude && (
                  <div className="grid grid-cols-2 gap-4 p-3 rounded-lg" style={{ backgroundColor: '#E8EFED' }}>
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Latitude</p>
                      <p className="font-mono text-sm font-semibold" style={{ color: '#6A8A82' }}>{formData.origin_latitude}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Longitude</p>
                      <p className="font-mono text-sm font-semibold" style={{ color: '#6A8A82' }}>{formData.origin_longitude}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Ligne de connexion */}
            <div className="flex items-center justify-center">
              <div className="h-8 border-l-2 border-dashed" style={{ borderColor: '#6A8A82' }} />
            </div>

            {/* Checkpoints intermédiaires */}
            {formData.checkpoints.map((cp, index) => (
              <div key={index}>
                <div className="bg-gradient-to-br from-amber-50 to-transparent rounded-xl p-6 border-2" style={{ borderColor: '#E8DCCC' }}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm" style={{ backgroundColor: '#D4956B' }}>
                        <span className="text-white font-bold text-sm">{index + 1}</span>
                      </div>
                      <h4 className="text-lg font-bold" style={{ color: '#191919' }}>Point de livraison {index + 1}</h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCheckpoint(index)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                        <label className="block text-sm font-semibold" style={{ color: '#191919' }}>
                          <Search className="w-4 h-4 inline mr-2" style={{ color: '#D4956B' }} />
                          Rechercher l'adresse *
                        </label>
                        <button
                          type="button"
                          onClick={() => useMyLocationFor({ checkpoint: index })}
                          disabled={isGeolocating !== null}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:shadow-sm disabled:opacity-50"
                          style={{ backgroundColor: '#FEF3C7', color: '#D4956B' }}
                          title="Utiliser ma position actuelle"
                        >
                          {isGeolocating === `cp_${index}` ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Navigation className="w-3.5 h-3.5" />
                          )}
                          <span>Ma position</span>
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          value={cp.address}
                          onChange={(e) => handleCheckpointSearch(index, e.target.value)}
                          onFocus={() => (checkpointSuggestions[index]?.length ?? 0) > 0 && setShowCheckpointSuggestions(prev => ({ ...prev, [index]: true }))}
                          placeholder="Tapez une adresse (ex: Yopougon, Abidjan)"
                          className={`w-full px-4 py-3 pr-10 rounded-xl border-2 focus:ring-4 focus:ring-amber-100 outline-none transition-all text-gray-900 placeholder-gray-400 ${
                            errors[`checkpoint_${index}_address`] ? 'border-red-300 focus:border-red-500' : 'focus:border-amber-400'
                          }`}
                          style={{ borderColor: errors[`checkpoint_${index}_address`] ? undefined : '#E8ECEC' }}
                        />
                        {isSearchingCheckpoint[index] && (
                          <Loader2 className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400" />
                        )}
                      </div>
                      {showCheckpointSuggestions[index] && (checkpointSuggestions[index]?.length ?? 0) > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white border-2 rounded-xl shadow-lg max-h-60 overflow-y-auto" style={{ borderColor: '#E8ECEC' }}>
                          {checkpointSuggestions[index].map((suggestion) => (
                            <button
                              key={suggestion.place_id}
                              type="button"
                              onClick={() => selectCheckpointAddress(index, suggestion)}
                              className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-start gap-3 border-b last:border-b-0 transition-colors"
                              style={{ borderColor: '#E8ECEC' }}
                            >
                              <MapPin className="w-4 h-4 mt-1 flex-shrink-0" style={{ color: '#D4956B' }} />
                              <span className="text-sm text-gray-700 line-clamp-2">{suggestion.display_name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      {errors[`checkpoint_${index}_address`] && (
                        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors[`checkpoint_${index}_address`]}
                        </p>
                      )}
                    </div>

                    {cp.latitude && cp.longitude && (
                      <div className="grid grid-cols-2 gap-4 p-3 rounded-lg" style={{ backgroundColor: '#F5EDE3' }}>
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">Latitude</p>
                          <p className="font-mono text-sm font-semibold" style={{ color: '#D4956B' }}>{cp.latitude}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">Longitude</p>
                          <p className="font-mono text-sm font-semibold" style={{ color: '#D4956B' }}>{cp.longitude}</p>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Notes (optionnel)</label>
                      <input
                        type="text"
                        value={cp.notes}
                        onChange={(e) => updateCheckpointNotes(index, e.target.value)}
                        placeholder="Instructions pour ce point..."
                        className="w-full px-3 py-2 rounded-lg border-2 text-sm focus:ring-2 focus:ring-amber-100 outline-none text-gray-900 placeholder-gray-400"
                        style={{ borderColor: '#E8ECEC' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Ligne de connexion après checkpoint */}
                <div className="flex items-center justify-center">
                  <div className="h-8 border-l-2 border-dashed" style={{ borderColor: '#D4956B' }} />
                </div>
              </div>
            ))}

            {/* Bouton ajouter un point de livraison */}
            <div className="flex items-center justify-center">
              <button
                type="button"
                onClick={addCheckpoint}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-dashed transition-all hover:shadow-md hover:border-solid text-sm font-semibold"
                style={{ borderColor: '#D4956B', color: '#D4956B' }}
              >
                <Plus className="w-4 h-4" />
                Ajouter un point de livraison
              </button>
            </div>

            {/* Ligne de connexion vers destination */}
            <div className="flex items-center justify-center">
              <div className="h-8 border-l-2 border-dashed" style={{ borderColor: '#B87333' }} />
            </div>

            {/* Destination */}
            <div className="bg-gradient-to-br from-copper/5 to-transparent rounded-xl p-6 border-2" style={{ borderColor: '#F5E8DD' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm" style={{ backgroundColor: '#B87333' }}>
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-lg font-bold" style={{ color: '#191919' }}>Point d'arrivée</h4>
              </div>
              <div className="space-y-4">
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                    <label className="block text-sm font-semibold" style={{ color: '#191919' }}>
                      <Search className="w-4 h-4 inline mr-2" style={{ color: '#B87333' }} />
                      Rechercher l'adresse de destination *
                    </label>
                    <button
                      type="button"
                      onClick={() => useMyLocationFor('destination')}
                      disabled={isGeolocating !== null}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:shadow-sm disabled:opacity-50"
                      style={{ backgroundColor: '#F5E8DD', color: '#B87333' }}
                      title="Utiliser ma position actuelle"
                    >
                      {isGeolocating === 'destination' ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Navigation className="w-3.5 h-3.5" />
                      )}
                      <span>Ma position</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.destination_address}
                      onChange={(e) => handleDestinationSearch(e.target.value)}
                      onFocus={() => destinationSuggestions.length > 0 && setShowDestinationSuggestions(true)}
                      placeholder="Tapez une adresse (ex: Plateau, Abidjan)"
                      className={`w-full px-4 py-3 pr-10 rounded-xl border-2 focus:ring-4 focus:ring-copper/10 outline-none transition-all text-gray-900 placeholder-gray-400 ${
                        errors.destination_address ? 'border-red-300 focus:border-red-500' : 'focus:border-copper'
                      }`}
                      style={{ borderColor: errors.destination_address ? undefined : '#E8ECEC' }}
                    />
                    {isSearchingDestination && (
                      <Loader2 className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400" />
                    )}
                  </div>
                  {/* Suggestions dropdown */}
                  {showDestinationSuggestions && destinationSuggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border-2 rounded-xl shadow-lg max-h-60 overflow-y-auto" style={{ borderColor: '#E8ECEC' }}>
                      {destinationSuggestions.map((suggestion) => (
                        <button
                          key={suggestion.place_id}
                          type="button"
                          onClick={() => selectDestinationAddress(suggestion)}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-start gap-3 border-b last:border-b-0 transition-colors"
                          style={{ borderColor: '#E8ECEC' }}
                        >
                          <MapPin className="w-4 h-4 mt-1 flex-shrink-0" style={{ color: '#B87333' }} />
                          <span className="text-sm text-gray-700 line-clamp-2">{suggestion.display_name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {renderError('destination_address')}
                </div>

                {/* Coordonnées (lecture seule, remplies automatiquement) */}
                {formData.destination_latitude && formData.destination_longitude && (
                  <div className="grid grid-cols-2 gap-4 p-3 rounded-lg" style={{ backgroundColor: '#F5E8DD' }}>
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Latitude</p>
                      <p className="font-mono text-sm font-semibold" style={{ color: '#B87333' }}>{formData.destination_latitude}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Longitude</p>
                      <p className="font-mono text-sm font-semibold" style={{ color: '#B87333' }}>{formData.destination_longitude}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Distance estimée (calculée automatiquement) */}
            {formData.estimated_distance && (
              <div className="bg-gradient-to-r from-sage/10 to-copper/10 rounded-xl p-5 border-2" style={{ borderColor: '#E8EFED' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#E8EFED' }}>
                      <Navigation className="w-5 h-5" style={{ color: '#6A8A82' }} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Distance estimée</p>
                      <p className="text-2xl font-bold" style={{ color: '#191919' }}>{formData.estimated_distance} km</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 max-w-[150px] text-right">
                    Calculée automatiquement (+ 20% pour les routes)
                  </p>
                </div>
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6 p-6">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2" style={{ color: '#191919' }}>
                Horaires prévus
              </h3>
              <p className="text-gray-600">Planifiez le debut et la fin de la mission</p>
            </div>
            <div className="bg-gradient-to-br from-sage/5 to-transparent rounded-xl p-6 border-2" style={{ borderColor: '#E8EFED' }}>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>
                    <Clock className="w-4 h-4 inline mr-2" style={{ color: '#6A8A82' }} />
                    Début prévu *
                  </label>
                  <input
                    type="datetime-local"
                    name="scheduled_start"
                    value={formData.scheduled_start}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 rounded-xl border-2 focus:ring-4 focus:ring-sage/10 outline-none transition-all text-gray-900 placeholder-gray-400 ${
                      errors.scheduled_start ? 'border-red-300 focus:border-red-500' : 'focus:border-sage'
                    }`}
                    style={{ borderColor: errors.scheduled_start ? undefined : '#E8ECEC' }}
                  />
                  {renderError('scheduled_start')}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>
                    <Clock className="w-4 h-4 inline mr-2" style={{ color: '#B87333' }} />
                    Fin prévue *
                  </label>
                  <input
                    type="datetime-local"
                    name="scheduled_end"
                    value={formData.scheduled_end}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 rounded-xl border-2 focus:ring-4 focus:ring-sage/10 outline-none transition-all text-gray-900 placeholder-gray-400 ${
                      errors.scheduled_end ? 'border-red-300 focus:border-red-500' : 'focus:border-sage'
                    }`}
                    style={{ borderColor: errors.scheduled_end ? undefined : '#E8ECEC' }}
                  />
                  {renderError('scheduled_end')}
                </div>

                {formData.scheduled_start && formData.scheduled_end && (
                  <div className="p-4 rounded-lg" style={{ backgroundColor: '#E8EFED' }}>
                    <p className="text-sm font-medium" style={{ color: '#6A8A82' }}>
                      Duree estimee:{' '}
                      <span className="font-bold">
                        {(() => {
                          const start = new Date(formData.scheduled_start);
                          const end = new Date(formData.scheduled_end);
                          const diff = end.getTime() - start.getTime();
                          if (diff <= 0) return 'Invalide';
                          const hours = Math.floor(diff / (1000 * 60 * 60));
                          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                          return `${hours}h ${minutes}min`;
                        })()}
                      </span>
                    </p>
                  </div>
                )}
              </div>
              <div className="mt-4 p-4 rounded-lg flex items-start space-x-3" style={{ backgroundColor: '#DBEAFE' }}>
                <Calendar className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#1E40AF' }} />
                <p className="text-sm" style={{ color: '#1E3A8A' }}>
                  Les dates seront utilisées pour planifier la mission et vérifier la disponibilité des ressources.
                </p>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6 p-6">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2" style={{ color: '#191919' }}>
                Finalisation
              </h3>
              <p className="text-gray-600">Priorité et informations complémentaires</p>
            </div>

            <div className="space-y-5">
              {/* Priorité */}
              <div className="bg-gradient-to-br from-copper/5 to-transparent rounded-xl p-6 border-2" style={{ borderColor: '#F5E8DD' }}>
                <div className="flex items-center gap-2 mb-4">
                  <Flag className="w-5 h-5" style={{ color: '#B87333' }} />
                  <label className="text-sm font-bold" style={{ color: '#191919' }}>
                    Priorité de la mission *
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {PRIORITY_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      className={`flex flex-col p-4 rounded-xl cursor-pointer transition-all border-2 ${
                        formData.priority === option.value ? 'shadow-lg' : 'hover:shadow-sm'
                      }`}
                      style={{
                        backgroundColor: formData.priority === option.value ? option.bgColor : 'white',
                        borderColor: formData.priority === option.value ? option.color : '#E8ECEC',
                      }}
                    >
                      <input
                        type="radio"
                        name="priority"
                        value={option.value}
                        checked={formData.priority === option.value}
                        onChange={handleInputChange}
                        className="hidden"
                      />
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className="font-bold"
                          style={{ color: formData.priority === option.value ? option.color : '#191919' }}
                        >
                          {option.label}
                        </span>
                        {formData.priority === option.value && (
                          <Check className="w-4 h-4" style={{ color: option.color }} />
                        )}
                      </div>
                      <span className="text-xs text-gray-500">{option.description}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Contact responsable */}
              <div className="bg-gradient-to-br from-sage/5 to-transparent rounded-xl p-6 border-2" style={{ borderColor: '#E8EFED' }}>
                <div className="flex items-center gap-2 mb-4">
                  <Phone className="w-5 h-5" style={{ color: '#6A8A82' }} />
                  <h4 className="text-sm font-bold" style={{ color: '#191919' }}>
                    Contact du responsable (optionnel)
                  </h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>
                      Nom du responsable
                    </label>
                    <input
                      type="text"
                      name="responsible_person_name"
                      value={formData.responsible_person_name}
                      onChange={handleInputChange}
                      placeholder="Jean Dupont"
                      className="w-full px-4 py-3 rounded-xl border-2 focus:border-sage focus:ring-4 focus:ring-sage/10 outline-none transition-all text-gray-900 placeholder-gray-400"
                      style={{ borderColor: '#E8ECEC' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>
                      Telephone
                    </label>
                    <input
                      type="tel"
                      name="responsible_person_phone"
                      value={formData.responsible_person_phone}
                      onChange={handleInputChange}
                      placeholder="+243 123 456 789"
                      className="w-full px-4 py-3 rounded-xl border-2 focus:border-sage focus:ring-4 focus:ring-sage/10 outline-none transition-all text-gray-900 placeholder-gray-400"
                      style={{ borderColor: '#E8ECEC' }}
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="bg-gradient-to-br from-sage/5 to-transparent rounded-xl p-6 border-2" style={{ borderColor: '#E8EFED' }}>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>
                    Notes additionnelles (optionnel)
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Instructions speciales, remarques importantes..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border-2 focus:border-sage focus:ring-4 focus:ring-sage/10 outline-none transition-all resize-none text-gray-900 placeholder-gray-400"
                    style={{ borderColor: '#E8ECEC' }}
                  />
                </div>
              </div>

              {/* Resume */}
              <div className="bg-gray-50 rounded-xl p-5 border-2" style={{ borderColor: '#E8ECEC' }}>
                <h4 className="font-bold mb-4" style={{ color: '#191919' }}>Resume de la mission</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Code</p>
                    <p className="font-semibold font-mono">{formData.mission_code}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Titre</p>
                    <p className="font-semibold truncate">{formData.title || '-'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Origine</p>
                    <p className="font-semibold truncate">{formData.origin_address || '-'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Destination</p>
                    <p className="font-semibold truncate">{formData.destination_address || '-'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Distance</p>
                    <p className="font-semibold">{formData.estimated_distance ? `${formData.estimated_distance} km` : '-'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Priorité</p>
                    <p className="font-semibold" style={{ color: PRIORITY_OPTIONS.find(p => p.value === formData.priority)?.color }}>
                      {PRIORITY_OPTIONS.find(p => p.value === formData.priority)?.label}
                    </p>
                  </div>
                </div>
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
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2" style={{ borderColor: '#E8ECEC' }}>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#E8EFED' }}>
              <Navigation className="w-6 h-6" style={{ color: '#6A8A82' }} />
            </div>
            <div>
              <h2 className="text-2xl font-bold" style={{ color: '#191919' }}>
                Nouvelle Mission
              </h2>
              <p className="text-sm text-gray-600">Etape {currentStep} sur {STEPS.length}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-all disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Stepper */}
        <div className="px-6 pt-6 pb-4 border-b-2" style={{ borderColor: '#E8ECEC' }}>
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
                      {isCompleted ? <Check className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                    </div>
                    <p
                      className={`text-xs mt-2 font-medium text-center ${isActive ? 'font-bold' : ''}`}
                      style={{ color: isActive ? '#6A8A82' : isCompleted ? '#B87333' : '#6B7280' }}
                    >
                      {step.title}
                    </p>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className="flex-1 h-1 mx-2 rounded-full"
                      style={{ backgroundColor: isCompleted ? '#B87333' : '#E8ECEC' }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            {renderStepContent()}
          </div>

          {/* Error Message */}
          {submitError && (
            <div className="mx-6 mb-4 p-4 rounded-xl bg-red-50 border-2 border-red-200 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{submitError}</p>
            </div>
          )}

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
                  <span>Precedent</span>
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
                  className="flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: '#B87333' }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Creation...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      <span>Creer la mission</span>
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
