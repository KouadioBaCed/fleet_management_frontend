import { useState, useEffect } from 'react';
import {
  X, Car, Calendar, Gauge, Droplet, Shield, Radio, FileText, User,
  MapPin, Clock, Wrench, Phone, Mail, Star, TrendingUp, AlertTriangle,
  CheckCircle, XCircle, Loader2, RefreshCw, ChevronRight, CreditCard,
  ImageIcon, UserPlus, UserMinus, Search, FolderOpen
} from 'lucide-react';
import type { Vehicle, Driver } from '@/types';
import { vehiclesApi, type TripHistory, type MaintenanceHistory, type CurrentDriver } from '@/api/vehicles';
import { driversApi } from '@/api/drivers';
import VehicleDocumentsTab from './VehicleDocumentsTab';

interface VehicleDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: Vehicle | null;
  statusColors?: Record<string, { bg: string; text: string; label: string; dot: string }>;
}

const DEFAULT_STATUS_COLORS: Record<string, { bg: string; text: string; label: string; dot: string }> = {
  available: { bg: '#E8EFED', text: '#6A8A82', label: 'Disponible', dot: '#6A8A82' },
  in_use: { bg: '#F5E8DD', text: '#B87333', label: 'En mission', dot: '#B87333' },
  maintenance: { bg: '#E8ECEC', text: '#6B7280', label: 'Maintenance', dot: '#6B7280' },
  out_of_service: { bg: '#FEE2E2', text: '#DC2626', label: 'Hors service', dot: '#DC2626' },
};

const FUEL_TYPE_LABELS: Record<string, string> = {
  gasoline: 'Essence',
  diesel: 'Diesel',
  electric: 'Electrique',
  hybrid: 'Hybride',
};

const VEHICLE_TYPE_LABELS: Record<string, string> = {
  sedan: 'Berline',
  suv: 'SUV',
  van: 'Camionnette',
  truck: 'Camion',
};

const MAINTENANCE_TYPE_LABELS: Record<string, string> = {
  oil_change: 'Vidange',
  tire_change: 'Changement pneus',
  brake_service: 'Freins',
  inspection: 'Controle technique',
  repair: 'Reparation',
  preventive: 'Maintenance preventive',
  other: 'Autre',
};

const MAINTENANCE_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  scheduled: { bg: '#DBEAFE', text: '#2563EB' },
  in_progress: { bg: '#FEF3C7', text: '#D97706' },
  completed: { bg: '#D1FAE5', text: '#059669' },
  cancelled: { bg: '#FEE2E2', text: '#DC2626' },
};

const TRIP_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  in_progress: { bg: '#DBEAFE', text: '#2563EB' },
  completed: { bg: '#D1FAE5', text: '#059669' },
  cancelled: { bg: '#FEE2E2', text: '#DC2626' },
};

const DRIVER_STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  available: { bg: '#D1FAE5', text: '#059669', label: 'Disponible' },
  on_mission: { bg: '#DBEAFE', text: '#2563EB', label: 'En mission' },
  on_break: { bg: '#FEF3C7', text: '#D97706', label: 'En pause' },
  off_duty: { bg: '#F3F4F6', text: '#6B7280', label: 'Hors service' },
};

const TABS = [
  { id: 'general', label: 'Informations', icon: FileText },
  { id: 'documents', label: 'Documents', icon: FolderOpen },
  { id: 'trips', label: 'Trajets', icon: MapPin },
  { id: 'maintenance', label: 'Maintenance', icon: Wrench },
  { id: 'driver', label: 'Conducteur', icon: User },
];

export default function VehicleDetailsModal({ isOpen, onClose, vehicle: vehicleProp, statusColors }: VehicleDetailsModalProps) {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [trips, setTrips] = useState<TripHistory[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceHistory[]>([]);
  const [currentDriver, setCurrentDriver] = useState<CurrentDriver | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [vehicleDetails, setVehicleDetails] = useState<Vehicle | null>(null);

  // Driver assignment state
  const [showDriverPicker, setShowDriverPicker] = useState(false);
  const [availableDrivers, setAvailableDrivers] = useState<Driver[]>([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [driverSearch, setDriverSearch] = useState('');
  const [assigningDriver, setAssigningDriver] = useState(false);

  const colors = statusColors || DEFAULT_STATUS_COLORS;

  // Merge vehicle details with prop, keeping photo from either source
  const vehicle = vehicleDetails
    ? { ...vehicleProp, ...vehicleDetails, photo: vehicleDetails.photo || vehicleProp?.photo }
    : vehicleProp;

  useEffect(() => {
    if (isOpen && vehicleProp) {
      setVehicleDetails(null); // Reset on open
      fetchDetails();
    }
  }, [isOpen, vehicleProp]);

  const fetchDetails = async () => {
    if (!vehicleProp) return;

    setLoading(true);
    setError(null);

    try {
      const data = await vehiclesApi.getDetails(vehicleProp.id);
      setVehicleDetails(data.vehicle); // Store the full vehicle data
      setTrips(data.trips || []);
      setMaintenance(data.maintenance || []);
      setCurrentDriver(data.current_driver);
    } catch (err) {
      console.error('Failed to fetch vehicle details:', err);
      setError('Erreur lors du chargement des details');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableDrivers = async () => {
    setLoadingDrivers(true);
    try {
      const drivers = await driversApi.getAvailable();
      setAvailableDrivers(drivers);
    } catch (err) {
      console.error('Failed to fetch available drivers:', err);
    } finally {
      setLoadingDrivers(false);
    }
  };

  const handleOpenDriverPicker = () => {
    setShowDriverPicker(true);
    setDriverSearch('');
    fetchAvailableDrivers();
  };

  const handleAssignDriver = async (driverId: number) => {
    if (!vehicleProp) return;
    setAssigningDriver(true);
    try {
      await vehiclesApi.assignDriver(vehicleProp.id, driverId);
      setShowDriverPicker(false);
      await fetchDetails();
    } catch (err) {
      console.error('Failed to assign driver:', err);
      setError('Erreur lors de l\'assignation du conducteur');
    } finally {
      setAssigningDriver(false);
    }
  };

  const handleUnassignDriver = async () => {
    if (!vehicleProp) return;
    setAssigningDriver(true);
    try {
      await vehiclesApi.unassignDriver(vehicleProp.id);
      await fetchDetails();
    } catch (err) {
      console.error('Failed to unassign driver:', err);
      setError('Erreur lors du retrait du conducteur');
    } finally {
      setAssigningDriver(false);
    }
  };

  const getDriverName = (driver: Driver) => {
    if (driver.user?.first_name || driver.user?.last_name) {
      return `${driver.user.first_name || ''} ${driver.user.last_name || ''}`.trim();
    }
    return driver.full_name || '';
  };

  const getDriverInitials = (driver: Driver) => {
    if (driver.user?.first_name && driver.user?.last_name) {
      return `${driver.user.first_name.charAt(0)}${driver.user.last_name.charAt(0)}`;
    }
    const parts = (driver.full_name || '').split(' ');
    return parts.map(p => p.charAt(0)).join('').slice(0, 2).toUpperCase();
  };

  const filteredDrivers = availableDrivers.filter((driver) => {
    if (!driverSearch) return true;
    const search = driverSearch.toLowerCase();
    const name = getDriverName(driver).toLowerCase();
    return name.includes(search) || driver.employee_id?.toLowerCase().includes(search);
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatMileage = (mileage: number) => {
    return new Intl.NumberFormat('fr-FR').format(Math.round(mileage)) + ' km';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (!isOpen || !vehicleProp) return null;

  const status = colors[vehicle.status] || colors.available;

  const renderGeneralTab = () => (
    <div className="space-y-6">
      {/* Photo du véhicule - Grande et visible */}
      <div className="bg-white rounded-2xl border-2 overflow-hidden" style={{ borderColor: '#E8ECEC' }}>
        <div className="p-4 border-b" style={{ borderColor: '#E8ECEC' }}>
          <h4 className="text-sm font-bold uppercase tracking-wide text-gray-500 flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            Photo du vehicule
          </h4>
        </div>
        <div className="p-4">
          {vehicle.photo ? (
            <div className="relative rounded-xl overflow-hidden bg-gray-100">
              <img
                src={vehicle.photo}
                alt={`${vehicle.brand} ${vehicle.model}`}
                className="w-full h-64 object-contain bg-gray-50"
              />
            </div>
          ) : (
            <div className="h-48 rounded-xl flex flex-col items-center justify-center" style={{ backgroundColor: '#F0F3F2' }}>
              <Car className="w-16 h-16 mb-2" style={{ color: '#6A8A82', opacity: 0.3 }} />
              <p className="text-gray-400 text-sm">Aucune photo disponible</p>
            </div>
          )}
        </div>
      </div>

      {/* Identification */}
      <div className="bg-white rounded-2xl border-2 p-5" style={{ borderColor: '#E8ECEC' }}>
        <h4 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Identification
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Plaque d'immatriculation</p>
            <p className="font-bold text-xl font-mono" style={{ color: '#191919' }}>{vehicle.license_plate}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Numero VIN</p>
            <p className="font-semibold font-mono text-sm" style={{ color: '#191919' }}>{vehicle.vin_number}</p>
          </div>
        </div>
      </div>

      {/* Caractéristiques */}
      <div className="bg-white rounded-2xl border-2 p-5" style={{ borderColor: '#E8ECEC' }}>
        <h4 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-4 flex items-center gap-2">
          <Car className="w-4 h-4" />
          Caracteristiques
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Marque / Modele</p>
            <p className="font-bold" style={{ color: '#191919' }}>{vehicle.brand} {vehicle.model}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Année</p>
            <p className="font-bold text-xl" style={{ color: '#191919' }}>{vehicle.year}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Type</p>
            <p className="font-bold" style={{ color: '#191919' }}>{VEHICLE_TYPE_LABELS[vehicle.vehicle_type] || vehicle.vehicle_type}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-4 h-4 rounded-full border-2" style={{ backgroundColor: vehicle.color?.toLowerCase() || '#888', borderColor: '#E8ECEC' }} />
              <p className="text-xs text-gray-500">Couleur</p>
            </div>
            <p className="font-bold" style={{ color: '#191919' }}>{vehicle.color}</p>
          </div>
        </div>
      </div>

      {/* Kilométrage */}
      <div className="bg-white rounded-2xl border-2 p-5" style={{ borderColor: '#E8ECEC' }}>
        <h4 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-4 flex items-center gap-2">
          <Gauge className="w-4 h-4" />
          Kilométrage
        </h4>
        <div className="bg-gradient-to-r from-sage/10 to-transparent rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Kilométrage actuel</p>
          <p className="font-bold text-3xl" style={{ color: '#6A8A82' }}>{formatMileage(vehicle.current_mileage)}</p>
        </div>
      </div>

      {/* Maintenance Schedule */}
      <div className="bg-white rounded-2xl border-2 p-5" style={{ borderColor: vehicle.maintenance_overdue ? '#DC2626' : '#E8ECEC' }}>
        <h4 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-4 flex items-center gap-2">
          <Wrench className="w-4 h-4" style={{ color: vehicle.maintenance_overdue ? '#DC2626' : '#6A8A82' }} />
          Maintenance
          {vehicle.maintenance_overdue && (
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full" style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}>
              En retard
            </span>
          )}
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Frequence (km)</p>
            <p className="font-bold" style={{ color: '#191919' }}>
              {vehicle.maintenance_frequency_km ? `${vehicle.maintenance_frequency_km.toLocaleString('fr-FR')} km` : 'Non defini'}
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Frequence (mois)</p>
            <p className="font-bold" style={{ color: '#191919' }}>
              {vehicle.maintenance_frequency_months ? `Tous les ${vehicle.maintenance_frequency_months} mois` : 'Non defini'}
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Derniere maintenance</p>
            <p className="font-bold" style={{ color: '#191919' }}>
              {vehicle.last_maintenance_date ? formatDate(vehicle.last_maintenance_date) : 'Aucune'}
            </p>
          </div>
          <div className={`rounded-xl p-4 ${vehicle.needs_maintenance ? 'bg-red-50' : 'bg-gray-50'}`}>
            <p className="text-xs text-gray-500 mb-1">Prochain entretien (km)</p>
            <p className="font-bold" style={{ color: vehicle.needs_maintenance ? '#DC2626' : '#191919' }}>
              {vehicle.next_maintenance_mileage ? `${parseFloat(vehicle.next_maintenance_mileage).toLocaleString('fr-FR')} km` : 'Non defini'}
            </p>
          </div>
        </div>
      </div>

      {/* Carburant */}
      <div className="bg-white rounded-2xl border-2 p-5" style={{ borderColor: '#E8ECEC' }}>
        <h4 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-4 flex items-center gap-2">
          <Droplet className="w-4 h-4" style={{ color: '#B87333' }} />
          Carburant
        </h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-copper/10 to-transparent rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Type de carburant</p>
            <p className="font-bold text-lg" style={{ color: '#B87333' }}>
              {FUEL_TYPE_LABELS[vehicle.fuel_type] || vehicle.fuel_type}
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Capacite reservoir</p>
            <p className="font-bold" style={{ color: '#191919' }}>{vehicle.fuel_capacity} L</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Consommation</p>
            <p className="font-bold" style={{ color: '#191919' }}>{vehicle.fuel_consumption} L/100km</p>
          </div>
        </div>
      </div>

      {/* Assurance */}
      <div className="bg-white rounded-2xl border-2 p-5" style={{ borderColor: '#E8ECEC' }}>
        <h4 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4" style={{ color: '#6A8A82' }} />
          Assurance
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-sage/10 to-transparent rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Numero d'assurance</p>
            <p className="font-bold font-mono" style={{ color: '#191919' }}>
              {vehicle.insurance_number || <span className="text-gray-400 font-normal">Non renseigne</span>}
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Date d'expiration</p>
            <p className="font-bold" style={{ color: '#191919' }}>
              {vehicle.insurance_expiry ? formatDate(vehicle.insurance_expiry) : <span className="text-gray-400 font-normal">Non renseigne</span>}
            </p>
          </div>
        </div>
      </div>

      {/* GPS */}
      <div className="bg-white rounded-2xl border-2 p-5" style={{ borderColor: '#E8ECEC' }}>
        <h4 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-4 flex items-center gap-2">
          <Radio className="w-4 h-4" style={{ color: '#B87333' }} />
          Dispositif GPS
        </h4>
        <div className="bg-gradient-to-br from-copper/10 to-transparent rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">ID Dispositif GPS</p>
          <p className="font-bold font-mono" style={{ color: '#191919' }}>
            {vehicle.gps_device_id || <span className="text-gray-400 font-normal">Non equipe</span>}
          </p>
        </div>
      </div>

      {/* Notes */}
      {vehicle.notes && (
        <div className="bg-white rounded-2xl border-2 p-5" style={{ borderColor: '#E8ECEC' }}>
          <h4 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-3">Notes</h4>
          <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-4">{vehicle.notes}</p>
        </div>
      )}
    </div>
  );

  const renderTripsTab = () => (
    <div className="space-y-4">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : trips.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#E8EFED' }}>
            <MapPin className="w-8 h-8" style={{ color: '#6A8A82' }} />
          </div>
          <p className="text-gray-500">Aucun trajet enregistre</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold uppercase tracking-wide text-gray-500">
              Derniers trajets ({trips.length})
            </h4>
            <button
              onClick={fetchDetails}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          {trips.map((trip) => {
            const tripStatus = TRIP_STATUS_COLORS[trip.status] || TRIP_STATUS_COLORS.completed;
            return (
              <div
                key={trip.id}
                className="bg-white rounded-xl p-4 border-2 hover:shadow-md transition-all"
                style={{ borderColor: '#E8ECEC' }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#E8EFED' }}>
                      <MapPin className="w-5 h-5" style={{ color: '#6A8A82' }} />
                    </div>
                    <div>
                      <p className="font-semibold" style={{ color: '#191919' }}>{trip.start_location}</p>
                      {trip.end_location && (
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <ChevronRight className="w-3 h-3" />
                          {trip.end_location}
                        </p>
                      )}
                    </div>
                  </div>
                  <span
                    className="px-2 py-1 rounded-full text-xs font-medium"
                    style={{ backgroundColor: tripStatus.bg, color: tripStatus.text }}
                  >
                    {trip.status === 'completed' ? 'Termine' : trip.status === 'in_progress' ? 'En cours' : 'Annule'}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDateTime(trip.start_time)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Gauge className="w-3 h-3" />
                    {trip.distance} km
                  </span>
                  {trip.driver_name && (
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {trip.driver_name}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );

  const renderMaintenanceTab = () => (
    <div className="space-y-4">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : maintenance.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#F5E8DD' }}>
            <Wrench className="w-8 h-8" style={{ color: '#B87333' }} />
          </div>
          <p className="text-gray-500">Aucune maintenance enregistree</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold uppercase tracking-wide text-gray-500">
              Historique maintenance ({maintenance.length})
            </h4>
            <button
              onClick={fetchDetails}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          {maintenance.map((record) => {
            const maintenanceStatus = MAINTENANCE_STATUS_COLORS[record.status] || MAINTENANCE_STATUS_COLORS.scheduled;
            return (
              <div
                key={record.id}
                className="bg-white rounded-xl p-4 border-2 hover:shadow-md transition-all"
                style={{ borderColor: '#E8ECEC' }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#F5E8DD' }}>
                      <Wrench className="w-5 h-5" style={{ color: '#B87333' }} />
                    </div>
                    <div>
                      <p className="font-semibold" style={{ color: '#191919' }}>
                        {MAINTENANCE_TYPE_LABELS[record.maintenance_type] || record.maintenance_type}
                      </p>
                      <p className="text-sm text-gray-500">{record.service_provider}</p>
                    </div>
                  </div>
                  <span
                    className="px-2 py-1 rounded-full text-xs font-medium"
                    style={{ backgroundColor: maintenanceStatus.bg, color: maintenanceStatus.text }}
                  >
                    {record.status === 'completed' ? 'Termine' : record.status === 'in_progress' ? 'En cours' : record.status === 'scheduled' ? 'Programme' : 'Annule'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{record.description}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(record.scheduled_date)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Gauge className="w-3 h-3" />
                    {formatMileage(record.mileage_at_service)}
                  </span>
                  <span className="flex items-center gap-1 font-semibold" style={{ color: '#B87333' }}>
                    <CreditCard className="w-3 h-3" />
                    {formatCurrency(record.total_cost)}
                  </span>
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );

  const renderDriverPicker = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-700">Choisir un conducteur</h4>
        <button
          onClick={() => setShowDriverPicker(false)}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Annuler
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher un conducteur..."
          value={driverSearch}
          onChange={(e) => setDriverSearch(e.target.value)}
          className="soft-input pl-10"
        />
      </div>

      {/* Driver list */}
      <div className="max-h-64 overflow-y-auto space-y-2">
        {loadingDrivers ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : filteredDrivers.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">Aucun conducteur disponible</p>
          </div>
        ) : (
          filteredDrivers.map((driver) => (
            <button
              key={driver.id}
              onClick={() => handleAssignDriver(driver.id)}
              disabled={assigningDriver}
              className="w-full flex items-center gap-3 p-3 rounded-xl border border-transparent hover:border-[rgba(106,138,130,0.2)] hover:bg-[rgba(106,138,130,0.04)] transition-all text-left disabled:opacity-50"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                style={{ backgroundColor: '#6A8A82' }}
              >
                {getDriverInitials(driver)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-800 truncate">
                  {getDriverName(driver)}
                </p>
                <p className="text-xs text-gray-500 font-mono">{driver.employee_id}</p>
              </div>
              {driver.rating !== undefined && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Star className="w-3 h-3" style={{ color: '#FFD700' }} />
                  {Number(driver.rating).toFixed(1)}
                </div>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );

  const renderDriverTab = () => (
    <div>
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : showDriverPicker ? (
        renderDriverPicker()
      ) : !currentDriver ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#E8EFED' }}>
            <User className="w-8 h-8" style={{ color: '#6A8A82' }} />
          </div>
          <p className="text-gray-500 mb-2">Aucun conducteur assigne</p>
          <p className="text-sm text-gray-400 mb-4">Ce vehicule n'a pas de conducteur actuellement</p>
          <button
            onClick={handleOpenDriverPicker}
            className="btn-primary inline-flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Assigner un conducteur
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Driver Header */}
          <div className="bg-gradient-to-br from-sage/10 to-transparent rounded-2xl p-6 border-2" style={{ borderColor: '#E8EFED' }}>
            <div className="flex items-start gap-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold"
                style={{ backgroundColor: '#6A8A82' }}
              >
                {currentDriver.user.first_name?.charAt(0)}{currentDriver.user.last_name?.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-xl font-bold" style={{ color: '#191919' }}>
                    {currentDriver.user.first_name} {currentDriver.user.last_name}
                  </h3>
                  <span
                    className="px-3 py-1 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: DRIVER_STATUS_COLORS[currentDriver.status]?.bg || '#F3F4F6',
                      color: DRIVER_STATUS_COLORS[currentDriver.status]?.text || '#6B7280',
                    }}
                  >
                    {DRIVER_STATUS_COLORS[currentDriver.status]?.label || currentDriver.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500 font-mono">{currentDriver.employee_id}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 mb-1">
                  <Star className="w-5 h-5" style={{ color: '#FFD700' }} />
                  <span className="text-xl font-bold" style={{ color: '#191919' }}>
                    {Number(currentDriver.rating).toFixed(1)}
                  </span>
                </div>
                <p className="text-xs text-gray-500">Note moyenne</p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenDriverPicker}
              disabled={assigningDriver}
              className="btn-secondary inline-flex items-center gap-2 text-sm disabled:opacity-50"
            >
              <RefreshCw className="w-4 h-4" />
              Changer de conducteur
            </button>
            <button
              onClick={handleUnassignDriver}
              disabled={assigningDriver}
              className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-all disabled:opacity-50"
            >
              {assigningDriver ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserMinus className="w-4 h-4" />}
              Retirer le conducteur
            </button>
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-4 border-2" style={{ borderColor: '#E8ECEC' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#E8EFED' }}>
                  <Mail className="w-5 h-5" style={{ color: '#6A8A82' }} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="font-semibold" style={{ color: '#191919' }}>{currentDriver.user.email}</p>
                </div>
              </div>
            </div>
            {currentDriver.user.phone_number && (
              <div className="bg-white rounded-xl p-4 border-2" style={{ borderColor: '#E8ECEC' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#F5E8DD' }}>
                    <Phone className="w-5 h-5" style={{ color: '#B87333' }} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Telephone</p>
                    <p className="font-semibold" style={{ color: '#191919' }}>{currentDriver.user.phone_number}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-sage/5 to-transparent rounded-xl p-4 border-2" style={{ borderColor: '#E8EFED' }}>
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4" style={{ color: '#6A8A82' }} />
                <span className="text-xs text-gray-500">Total trajets</span>
              </div>
              <p className="text-2xl font-bold" style={{ color: '#191919' }}>{currentDriver.total_trips}</p>
            </div>
            <div className="bg-gradient-to-br from-copper/5 to-transparent rounded-xl p-4 border-2" style={{ borderColor: '#F5E8DD' }}>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4" style={{ color: '#B87333' }} />
                <span className="text-xs text-gray-500">Distance totale</span>
              </div>
              <p className="text-2xl font-bold" style={{ color: '#191919' }}>{formatMileage(currentDriver.total_distance)}</p>
            </div>
          </div>

          {/* License Info */}
          <div className="bg-white rounded-xl p-5 border-2" style={{ borderColor: '#E8ECEC' }}>
            <h4 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-4 flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Permis de conduire
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500">Numero</p>
                <p className="font-semibold font-mono" style={{ color: '#191919' }}>{currentDriver.driver_license_number}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Categorie</p>
                <p className="font-semibold" style={{ color: '#191919' }}>{currentDriver.driver_license_category}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Expiration</p>
                <p className="font-semibold" style={{ color: '#191919' }}>{formatDate(currentDriver.driver_license_expiry)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderDocumentsTab = () => (
    <VehicleDocumentsTab vehicleId={vehicleProp!.id} />
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return renderGeneralTab();
      case 'documents':
        return renderDocumentsTab();
      case 'trips':
        return renderTripsTab();
      case 'maintenance':
        return renderMaintenanceTab();
      case 'driver':
        return renderDriverTab();
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2" style={{ borderColor: '#E8ECEC' }}>
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: status.bg }}
            >
              <Car className="w-7 h-7" style={{ color: status.dot }} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold" style={{ color: '#191919' }}>
                  {vehicle.license_plate}
                </h2>
                <span
                  className="px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5"
                  style={{ backgroundColor: status.bg, color: status.text }}
                >
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: status.dot }} />
                  {status.label}
                </span>
              </div>
              <p className="text-gray-500">{vehicle.brand} {vehicle.model} • {vehicle.year}</p>
            </div>
          </div>
          <button
            onClick={onClose}
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
              const hasData = tab.id === 'trips' ? trips.length > 0 :
                              tab.id === 'maintenance' ? maintenance.length > 0 :
                              tab.id === 'driver' ? !!currentDriver : true;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-t-xl font-medium text-sm transition-all ${
                    isActive ? 'shadow-sm' : 'hover:bg-gray-50'
                  }`}
                  style={{
                    backgroundColor: isActive ? '#E8EFED' : 'transparent',
                    color: isActive ? '#6A8A82' : '#6B7280',
                    borderBottom: isActive ? '2px solid #6A8A82' : '2px solid transparent',
                  }}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {tab.id !== 'general' && hasData && (
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: '#6A8A82' }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {error ? (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <span className="text-red-700">{error}</span>
              <button
                onClick={fetchDetails}
                className="ml-auto text-sm font-medium text-red-600 hover:underline"
              >
                Reessayer
              </button>
            </div>
          ) : (
            renderTabContent()
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t-2 bg-white" style={{ borderColor: '#E8ECEC' }}>
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl font-semibold transition-all hover:bg-gray-200"
            style={{ backgroundColor: '#E8ECEC', color: '#6B7280' }}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
