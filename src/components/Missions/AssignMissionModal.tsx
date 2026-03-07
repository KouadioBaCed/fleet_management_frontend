import { useState, useEffect } from 'react';
import {
  X,
  ClipboardList,
  User,
  Car,
  CheckCircle,
  Loader2,
  AlertTriangle,
  MapPin,
  Calendar,
  ArrowRight,
  Clock,
  Star,
  Gauge,
  ChevronRight,
  Search,
  Flag,
} from 'lucide-react';
import type { Mission, Driver, Vehicle } from '@/types';
import { missionsApi } from '@/api/missions';
import { driversApi } from '@/api/drivers';
import { vehiclesApi } from '@/api/vehicles';

interface AssignMissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preselectedMission?: Mission | null;
}

const STEPS = [
  { id: 1, title: 'Mission', icon: ClipboardList },
  { id: 2, title: 'Conducteur', icon: User },
  { id: 3, title: 'Vehicule', icon: Car },
  { id: 4, title: 'Confirmation', icon: CheckCircle },
];

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  low: { label: 'Faible', color: '#6B7280', bgColor: '#E8ECEC' },
  medium: { label: 'Moyenne', color: '#6A8A82', bgColor: '#E8EFED' },
  high: { label: 'Haute', color: '#B87333', bgColor: '#F5E8DD' },
  urgent: { label: 'Urgente', color: '#DC2626', bgColor: '#FEE2E2' },
};

export default function AssignMissionModal({
  isOpen,
  onClose,
  onSuccess,
  preselectedMission,
}: AssignMissionModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data
  const [pendingMissions, setPendingMissions] = useState<Mission[]>([]);
  const [availableDrivers, setAvailableDrivers] = useState<Driver[]>([]);
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Selections
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  // Search
  const [missionSearch, setMissionSearch] = useState('');
  const [driverSearch, setDriverSearch] = useState('');
  const [vehicleSearch, setVehicleSearch] = useState('');

  // Load data on open
  useEffect(() => {
    if (isOpen) {
      loadData();
      if (preselectedMission) {
        setSelectedMission(preselectedMission);
        setCurrentStep(2);
      }
    }
  }, [isOpen, preselectedMission]);

  const loadData = async () => {
    setIsLoadingData(true);
    setError(null);
    try {
      const [missions, drivers, vehicles] = await Promise.all([
        missionsApi.getPending(),
        driversApi.getAvailable(),
        vehiclesApi.getAvailable(),
      ]);
      setPendingMissions(missions);
      setAvailableDrivers(drivers);
      setAvailableVehicles(vehicles);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Erreur lors du chargement des donnees');
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleClose = () => {
    setCurrentStep(1);
    setSelectedMission(null);
    setSelectedDriver(null);
    setSelectedVehicle(null);
    setMissionSearch('');
    setDriverSearch('');
    setVehicleSearch('');
    setError(null);
    setIsSubmitting(false);
    onClose();
  };

  const handleNext = () => {
    if (currentStep === 1 && !selectedMission) {
      setError('Veuillez selectionner une mission');
      return;
    }
    if (currentStep === 2 && !selectedDriver) {
      setError('Veuillez selectionner un conducteur');
      return;
    }
    if (currentStep === 3 && !selectedVehicle) {
      setError('Veuillez selectionner un vehicule');
      return;
    }
    setError(null);
    setCurrentStep((prev) => Math.min(prev + 1, 4));
  };

  const handleBack = () => {
    setError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!selectedMission || !selectedDriver || !selectedVehicle) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await missionsApi.assign(selectedMission.id, selectedDriver.id, selectedVehicle.id);
      onSuccess();
      handleClose();
    } catch (err: any) {
      console.error('Failed to assign mission:', err);
      setError(err.response?.data?.error || 'Erreur lors de l\'assignation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Filtered lists
  const filteredMissions = pendingMissions.filter(
    (m) =>
      m.title.toLowerCase().includes(missionSearch.toLowerCase()) ||
      m.mission_code.toLowerCase().includes(missionSearch.toLowerCase()) ||
      m.origin_address?.toLowerCase().includes(missionSearch.toLowerCase()) ||
      m.destination_address?.toLowerCase().includes(missionSearch.toLowerCase())
  );

  const filteredDrivers = availableDrivers.filter(
    (d) =>
      d.full_name?.toLowerCase().includes(driverSearch.toLowerCase()) ||
      d.employee_id?.toLowerCase().includes(driverSearch.toLowerCase())
  );

  const filteredVehicles = availableVehicles.filter(
    (v) =>
      v.license_plate?.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
      v.brand?.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
      v.model?.toLowerCase().includes(vehicleSearch.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2" style={{ borderColor: '#E8ECEC' }}>
          <div className="flex items-center space-x-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: '#E8EFED' }}
            >
              <ClipboardList className="w-6 h-6" style={{ color: '#6A8A82' }} />
            </div>
            <div>
              <h2 className="text-xl font-bold" style={{ color: '#191919' }}>
                Assigner une mission
              </h2>
              <p className="text-sm text-gray-500">Etape {currentStep} sur 4</p>
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

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b" style={{ borderColor: '#E8ECEC' }}>
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        isActive || isCompleted ? 'text-white' : 'text-gray-400'
                      }`}
                      style={{
                        backgroundColor: isActive ? '#6A8A82' : isCompleted ? '#6A8A82' : '#E8ECEC',
                      }}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>
                    <span
                      className={`ml-2 text-sm font-medium hidden sm:block ${
                        isActive ? 'text-gray-900' : 'text-gray-500'
                      }`}
                    >
                      {step.title}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <ChevronRight className="w-5 h-5 mx-3 text-gray-300" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoadingData ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-10 h-10 animate-spin text-gray-400 mb-4" />
              <p className="text-gray-500">Chargement des donnees...</p>
            </div>
          ) : (
            <>
              {/* Step 1: Mission Selection */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-700">
                      Selectionner une mission en attente
                    </h3>
                    <span className="text-sm text-gray-500">
                      {filteredMissions.length} mission(s) disponible(s)
                    </span>
                  </div>

                  {/* Search */}
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Rechercher une mission..."
                      value={missionSearch}
                      onChange={(e) => setMissionSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all"
                      style={{ borderColor: '#E8ECEC' }}
                    />
                  </div>

                  {/* Mission List */}
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {filteredMissions.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <ClipboardList className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>Aucune mission en attente</p>
                      </div>
                    ) : (
                      filteredMissions.map((mission) => {
                        const isSelected = selectedMission?.id === mission.id;
                        const priority = PRIORITY_CONFIG[mission.priority] || PRIORITY_CONFIG.medium;

                        return (
                          <button
                            key={mission.id}
                            type="button"
                            onClick={() => setSelectedMission(mission)}
                            className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                              isSelected ? 'shadow-md' : 'hover:shadow-sm'
                            }`}
                            style={{
                              borderColor: isSelected ? '#6A8A82' : '#E8ECEC',
                              backgroundColor: isSelected ? '#E8EFED' : 'white',
                            }}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-mono text-sm text-gray-500">
                                    {mission.mission_code}
                                  </span>
                                  <span
                                    className="px-2 py-0.5 rounded-full text-xs font-medium"
                                    style={{ backgroundColor: priority.bgColor, color: priority.color }}
                                  >
                                    {priority.label}
                                  </span>
                                </div>
                                <h4 className="font-semibold text-gray-900">{mission.title}</h4>
                                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4" />
                                    {mission.origin_address?.split(',')[0]}
                                  </span>
                                  <ArrowRight className="w-4 h-4" />
                                  <span>{mission.destination_address?.split(',')[0]}</span>
                                </div>
                                <div className="flex items-center gap-1 mt-2 text-sm text-gray-500">
                                  <Calendar className="w-4 h-4" />
                                  {formatDate(mission.scheduled_start)}
                                </div>
                              </div>
                              {isSelected && (
                                <CheckCircle className="w-6 h-6 flex-shrink-0" style={{ color: '#6A8A82' }} />
                              )}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: Driver Selection */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-700">
                      Choisir un conducteur disponible
                    </h3>
                    <span className="text-sm text-gray-500">
                      {filteredDrivers.length} conducteur(s) disponible(s)
                    </span>
                  </div>

                  {/* Search */}
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Rechercher un conducteur..."
                      value={driverSearch}
                      onChange={(e) => setDriverSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all"
                      style={{ borderColor: '#E8ECEC' }}
                    />
                  </div>

                  {/* Driver List */}
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {filteredDrivers.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>Aucun conducteur disponible</p>
                      </div>
                    ) : (
                      filteredDrivers.map((driver) => {
                        const isSelected = selectedDriver?.id === driver.id;
                        const initials = driver.full_name?.split(' ').map((n) => n[0]).join('') || '?';

                        return (
                          <button
                            key={driver.id}
                            type="button"
                            onClick={() => setSelectedDriver(driver)}
                            className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                              isSelected ? 'shadow-md' : 'hover:shadow-sm'
                            }`}
                            style={{
                              borderColor: isSelected ? '#6A8A82' : '#E8ECEC',
                              backgroundColor: isSelected ? '#E8EFED' : 'white',
                            }}
                          >
                            <div className="flex items-center gap-4">
                              {(driver.photo || driver.user?.profile_picture) ? (
                                <img
                                  src={driver.photo || driver.user?.profile_picture}
                                  alt={driver.full_name}
                                  className="w-12 h-12 rounded-full object-cover"
                                />
                              ) : (
                                <div
                                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                                  style={{ backgroundColor: '#6A8A82' }}
                                >
                                  {initials}
                                </div>
                              )}
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold text-gray-900">{driver.full_name}</h4>
                                  <span className="font-mono text-sm text-gray-500">
                                    {driver.employee_id}
                                  </span>
                                </div>
                                <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <Star className="w-4 h-4 text-yellow-500" />
                                    {driver.rating ? Number(driver.rating).toFixed(1) : 'N/A'}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {driver.total_trips || 0} trajets
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Flag className="w-4 h-4" />
                                    {driver.driver_license_category || 'B'}
                                  </span>
                                </div>
                              </div>
                              {isSelected && (
                                <CheckCircle className="w-6 h-6 flex-shrink-0" style={{ color: '#6A8A82' }} />
                              )}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Vehicle Selection */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-700">
                      Choisir un vehicule disponible
                    </h3>
                    <span className="text-sm text-gray-500">
                      {filteredVehicles.length} vehicule(s) disponible(s)
                    </span>
                  </div>

                  {/* Search */}
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Rechercher un vehicule..."
                      value={vehicleSearch}
                      onChange={(e) => setVehicleSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all"
                      style={{ borderColor: '#E8ECEC' }}
                    />
                  </div>

                  {/* Vehicle List */}
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {filteredVehicles.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Car className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>Aucun vehicule disponible</p>
                      </div>
                    ) : (
                      filteredVehicles.map((vehicle) => {
                        const isSelected = selectedVehicle?.id === vehicle.id;

                        return (
                          <button
                            key={vehicle.id}
                            type="button"
                            onClick={() => setSelectedVehicle(vehicle)}
                            className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                              isSelected ? 'shadow-md' : 'hover:shadow-sm'
                            }`}
                            style={{
                              borderColor: isSelected ? '#6A8A82' : '#E8ECEC',
                              backgroundColor: isSelected ? '#E8EFED' : 'white',
                            }}
                          >
                            <div className="flex items-center gap-4">
                              {vehicle.photo ? (
                                <img
                                  src={vehicle.photo}
                                  alt={vehicle.license_plate}
                                  className="w-16 h-12 rounded-lg object-cover"
                                />
                              ) : (
                                <div
                                  className="w-16 h-12 rounded-lg flex items-center justify-center"
                                  style={{ backgroundColor: '#E8ECEC' }}
                                >
                                  <Car className="w-6 h-6 text-gray-400" />
                                </div>
                              )}
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold text-gray-900">
                                    {vehicle.brand} {vehicle.model}
                                  </h4>
                                  <span
                                    className="px-2 py-0.5 rounded text-xs font-mono font-bold"
                                    style={{ backgroundColor: '#191919', color: 'white' }}
                                  >
                                    {vehicle.license_plate}
                                  </span>
                                </div>
                                <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                                  <span>{vehicle.year}</span>
                                  <span className="flex items-center gap-1">
                                    <Gauge className="w-4 h-4" />
                                    {vehicle.current_mileage?.toLocaleString() || 0} km
                                  </span>
                                  <span className="capitalize">{vehicle.fuel_type}</span>
                                </div>
                              </div>
                              {isSelected && (
                                <CheckCircle className="w-6 h-6 flex-shrink-0" style={{ color: '#6A8A82' }} />
                              )}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* Step 4: Confirmation */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <h3 className="font-semibold text-gray-700 mb-4">
                    Confirmer l'assignation
                  </h3>

                  {/* Mission Summary */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <ClipboardList className="w-5 h-5" style={{ color: '#6A8A82' }} />
                      <span className="font-semibold text-gray-700">Mission</span>
                    </div>
                    {selectedMission && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm text-gray-500">
                            {selectedMission.mission_code}
                          </span>
                          {selectedMission.priority && (
                            <span
                              className="px-2 py-0.5 rounded-full text-xs font-medium"
                              style={{
                                backgroundColor: PRIORITY_CONFIG[selectedMission.priority]?.bgColor,
                                color: PRIORITY_CONFIG[selectedMission.priority]?.color,
                              }}
                            >
                              {PRIORITY_CONFIG[selectedMission.priority]?.label}
                            </span>
                          )}
                        </div>
                        <h4 className="font-semibold text-gray-900">{selectedMission.title}</h4>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <MapPin className="w-4 h-4" />
                          <span>{selectedMission.origin_address?.split(',')[0]}</span>
                          <ArrowRight className="w-4 h-4" />
                          <span>{selectedMission.destination_address?.split(',')[0]}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(selectedMission.scheduled_start)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Driver Summary */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <User className="w-5 h-5" style={{ color: '#6A8A82' }} />
                      <span className="font-semibold text-gray-700">Conducteur</span>
                    </div>
                    {selectedDriver && (
                      <div className="flex items-center gap-4">
                        {(selectedDriver.photo || selectedDriver.user?.profile_picture) ? (
                          <img
                            src={selectedDriver.photo || selectedDriver.user?.profile_picture}
                            alt={selectedDriver.full_name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                            style={{ backgroundColor: '#6A8A82' }}
                          >
                            {selectedDriver.full_name?.split(' ').map((n) => n[0]).join('') || '?'}
                          </div>
                        )}
                        <div>
                          <h4 className="font-semibold text-gray-900">{selectedDriver.full_name}</h4>
                          <div className="flex items-center gap-3 text-sm text-gray-500">
                            <span className="font-mono">{selectedDriver.employee_id}</span>
                            <span className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-500" />
                              {selectedDriver.rating ? Number(selectedDriver.rating).toFixed(1) : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Vehicle Summary */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Car className="w-5 h-5" style={{ color: '#6A8A82' }} />
                      <span className="font-semibold text-gray-700">Vehicule</span>
                    </div>
                    {selectedVehicle && (
                      <div className="flex items-center gap-4">
                        {selectedVehicle.photo ? (
                          <img
                            src={selectedVehicle.photo}
                            alt={selectedVehicle.license_plate}
                            className="w-16 h-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div
                            className="w-16 h-12 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: '#E8ECEC' }}
                          >
                            <Car className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-gray-900">
                              {selectedVehicle.brand} {selectedVehicle.model}
                            </h4>
                            <span
                              className="px-2 py-0.5 rounded text-xs font-mono font-bold"
                              style={{ backgroundColor: '#191919', color: 'white' }}
                            >
                              {selectedVehicle.license_plate}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-500">
                            <span>{selectedVehicle.year}</span>
                            <span>{selectedVehicle.current_mileage?.toLocaleString()} km</span>
                            <span className="capitalize">{selectedVehicle.fuel_type}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Warning */}
                  <div
                    className="flex items-start gap-3 p-4 rounded-xl"
                    style={{ backgroundColor: '#F5E8DD' }}
                  >
                    <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#B87333' }} />
                    <div className="text-sm" style={{ color: '#B87333' }}>
                      <p className="font-semibold">Attention</p>
                      <p>
                        Une fois assignes, le conducteur et le vehicule seront marques comme "En mission" et ne
                        seront plus disponibles pour d'autres assignations.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="px-6 pb-4">
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div
          className="flex items-center justify-between p-6 border-t-2 bg-gray-50"
          style={{ borderColor: '#E8ECEC' }}
        >
          <button
            type="button"
            onClick={currentStep === 1 ? handleClose : handleBack}
            disabled={isSubmitting}
            className="px-6 py-3 rounded-xl font-semibold transition-all hover:bg-gray-200 disabled:opacity-50"
            style={{ backgroundColor: '#E8ECEC', color: '#6B7280' }}
          >
            {currentStep === 1 ? 'Annuler' : 'Retour'}
          </button>

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={isLoadingData}
              className="flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50"
              style={{ backgroundColor: '#6A8A82' }}
            >
              <span>Continuer</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50"
              style={{ backgroundColor: '#6A8A82' }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Assignation...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>Confirmer l'assignation</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
