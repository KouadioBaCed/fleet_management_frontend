import { useState, useEffect } from 'react';
import {
  X,
  User,
  Phone,
  Mail,
  CreditCard,
  Calendar,
  Star,
  MapPin,
  Car,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Route,
  Shield,
  Loader2,
  ChevronRight,
  XCircle,
  Wrench,
  Fuel,
  FileWarning,
  HelpCircle,
  FileText,
} from 'lucide-react';
import type { Driver, Incident, IncidentStats } from '@/types';
import { driversApi } from '@/api/drivers';

interface DriverDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  driver: Driver | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  available: { label: 'Disponible', color: '#6A8A82', bgColor: '#E8EFED' },
  on_mission: { label: 'En mission', color: '#B87333', bgColor: '#F5E8DD' },
  on_break: { label: 'En pause', color: '#6B7280', bgColor: '#F3F4F6' },
  off_duty: { label: 'Hors service', color: '#DC2626', bgColor: '#FEE2E2' },
};

const SEVERITY_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  minor: { label: 'Mineur', color: '#6B7280', bgColor: '#F3F4F6' },
  moderate: { label: 'Modere', color: '#D97706', bgColor: '#FEF3C7' },
  major: { label: 'Majeur', color: '#EA580C', bgColor: '#FFEDD5' },
  critical: { label: 'Critique', color: '#DC2626', bgColor: '#FEE2E2' },
};

const INCIDENT_TYPE_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  flat_tire: { label: 'Pneu creve', icon: XCircle, color: '#6B7280' },
  breakdown: { label: 'Panne', icon: Wrench, color: '#D97706' },
  accident: { label: 'Accident', icon: AlertTriangle, color: '#DC2626' },
  fuel_issue: { label: 'Probleme carburant', icon: Fuel, color: '#EA580C' },
  traffic_violation: { label: 'Infraction', icon: FileWarning, color: '#7C3AED' },
  other: { label: 'Autre', icon: HelpCircle, color: '#6B7280' },
};

type TabType = 'general' | 'stats' | 'incidents';

export default function DriverDetailsModal({ isOpen, onClose, driver }: DriverDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [incidentStats, setIncidentStats] = useState<IncidentStats | null>(null);
  const [isLoadingIncidents, setIsLoadingIncidents] = useState(false);
  const [incidentFilter, setIncidentFilter] = useState<'all' | 'pending' | 'resolved'>('all');
  const [fullDriver, setFullDriver] = useState<Driver | null>(null);
  const [isLoadingDriver, setIsLoadingDriver] = useState(false);

  useEffect(() => {
    if (isOpen && driver) {
      setActiveTab('general');
      loadFullDriver();
      loadIncidents();
    }
  }, [isOpen, driver]);

  const loadFullDriver = async () => {
    if (!driver) return;

    setIsLoadingDriver(true);
    try {
      const data = await driversApi.getById(driver.id);
      setFullDriver(data);
    } catch (error) {
      console.error('Failed to load driver details:', error);
      setFullDriver(driver); // Fallback to list data
    } finally {
      setIsLoadingDriver(false);
    }
  };

  const loadIncidents = async () => {
    if (!driver) return;

    setIsLoadingIncidents(true);
    try {
      const response = await driversApi.getIncidents(driver.id, { limit: 50 });
      setIncidents(response.incidents);
      setIncidentStats(response.stats);
    } catch (error) {
      console.error('Failed to load incidents:', error);
      setIncidents([]);
      setIncidentStats(null);
    } finally {
      setIsLoadingIncidents(false);
    }
  };

  if (!isOpen || !driver) return null;

  // Use fullDriver if loaded, otherwise fall back to driver from props
  const displayDriver = fullDriver || driver;
  const status = STATUS_CONFIG[displayDriver.status] || STATUS_CONFIG.available;
  const initials = displayDriver.full_name?.split(' ').map(n => n[0]).join('') || '?';

  const filteredIncidents = incidents.filter(incident => {
    if (incidentFilter === 'pending') return !incident.is_resolved;
    if (incidentFilter === 'resolved') return incident.is_resolved;
    return true;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <Star key={i} className="w-5 h-5 fill-yellow-400/50 text-yellow-400" />
        );
      } else {
        stars.push(
          <Star key={i} className="w-5 h-5 text-gray-300" />
        );
      }
    }
    return stars;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header avec infos du chauffeur */}
        <div className="relative flex-shrink-0" style={{ backgroundColor: status.bgColor }}>
          <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
            <User className="w-64 h-64 absolute -right-16 -top-16" style={{ color: status.color }} />
          </div>
          <div className="relative p-6 z-10">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-10 h-10 rounded-xl flex items-center justify-center bg-white/90 hover:bg-white transition-all shadow-lg z-20"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>

            <div className="flex items-center gap-4">
              {displayDriver.photo || displayDriver.user?.profile_picture ? (
                <img
                  src={displayDriver.photo || displayDriver.user?.profile_picture}
                  alt={displayDriver.full_name}
                  className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold border-4 border-white shadow-lg"
                  style={{ backgroundColor: status.color }}
                >
                  {initials}
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-2xl font-bold" style={{ color: '#191919' }}>
                  {displayDriver.full_name}
                </h2>
                <p className="text-gray-600 font-mono">{displayDriver.employee_id}</p>
                <div
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mt-2"
                  style={{ backgroundColor: 'white', color: status.color }}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: status.color }} />
                  {status.label}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs - Section séparée et fixe */}
        <div className="flex bg-white border-b-2 flex-shrink-0" style={{ borderColor: '#E8ECEC' }}>
          {[
            { id: 'general', label: 'Général', icon: User },
            { id: 'stats', label: 'Statistiques', icon: TrendingUp },
            { id: 'incidents', label: 'Incidents', icon: AlertTriangle },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 font-semibold transition-all border-b-2 -mb-0.5 ${
                  isActive ? '' : 'hover:bg-gray-50'
                }`}
                style={{
                  color: isActive ? status.color : '#6B7280',
                  borderColor: isActive ? status.color : 'transparent',
                  backgroundColor: isActive ? `${status.color}10` : 'transparent'
                }}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.id === 'incidents' && incidentStats && incidentStats.pending > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {incidentStats.pending}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* Loading Indicator */}
              {isLoadingDriver && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              )}

              {!isLoadingDriver && (
                <>
                  {/* Contact Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-sage/5 to-transparent rounded-xl p-4 border-2" style={{ borderColor: '#E8EFED' }}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#E8EFED' }}>
                          <Phone className="w-5 h-5" style={{ color: '#6A8A82' }} />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500">Téléphone</p>
                          <p className="font-semibold" style={{ color: '#191919' }}>
                            {displayDriver.user?.phone_number || 'Non renseigné'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-copper/5 to-transparent rounded-xl p-4 border-2" style={{ borderColor: '#F5E8DD' }}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#F5E8DD' }}>
                          <Mail className="w-5 h-5" style={{ color: '#B87333' }} />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500">Email</p>
                          <p className="font-semibold truncate" style={{ color: '#191919' }}>
                            {displayDriver.user?.email || 'Non renseigné'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* License Info */}
                  <div className="bg-gray-50 rounded-xl p-5 border-2" style={{ borderColor: '#E8ECEC' }}>
                    <div className="flex items-center gap-2 mb-4">
                      <CreditCard className="w-5 h-5" style={{ color: '#6A8A82' }} />
                      <h3 className="font-bold" style={{ color: '#191919' }}>Informations du permis</h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Numéro de permis</p>
                        <p className="font-semibold font-mono" style={{ color: '#191919' }}>
                          {displayDriver.driver_license_number || 'Non renseigné'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Date d'expiration</p>
                        <p className="font-semibold" style={{ color: '#191919' }}>
                          {displayDriver.driver_license_expiry ? formatDate(displayDriver.driver_license_expiry) : 'Non renseigné'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Catégorie</p>
                        <p className="font-semibold" style={{ color: '#191919' }}>
                          {displayDriver.driver_license_category || 'Non renseigné'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Date d'embauche</p>
                        <p className="font-semibold" style={{ color: '#191919' }}>
                          {displayDriver.hire_date ? formatDate(displayDriver.hire_date) : 'Non renseigné'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div className="bg-gray-50 rounded-xl p-5 border-2" style={{ borderColor: '#E8ECEC' }}>
                    <div className="flex items-center gap-2 mb-4">
                      <Phone className="w-5 h-5" style={{ color: '#B87333' }} />
                      <h3 className="font-bold" style={{ color: '#191919' }}>Contact d'urgence</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Nom</p>
                        <p className="font-semibold" style={{ color: '#191919' }}>
                          {displayDriver.emergency_contact_name || 'Non renseigné'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Téléphone</p>
                        <p className="font-semibold" style={{ color: '#191919' }}>
                          {displayDriver.emergency_contact_phone || 'Non renseigné'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Current Vehicle */}
                  {displayDriver.current_vehicle && (
                    <div className="bg-gradient-to-r from-sage/10 to-copper/10 rounded-xl p-5 border-2" style={{ borderColor: '#E8EFED' }}>
                      <div className="flex items-center gap-2 mb-4">
                        <Car className="w-5 h-5" style={{ color: '#6A8A82' }} />
                        <h3 className="font-bold" style={{ color: '#191919' }}>Véhicule actuel</h3>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#E8EFED' }}>
                          <Car className="w-8 h-8" style={{ color: '#6A8A82' }} />
                        </div>
                        <div>
                          <p className="font-bold text-lg" style={{ color: '#191919' }}>
                            {displayDriver.current_vehicle.brand} {displayDriver.current_vehicle.model}
                          </p>
                          <p className="text-gray-600 font-mono">{displayDriver.current_vehicle.license_plate}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {displayDriver.notes && (
                    <div className="bg-gray-50 rounded-xl p-5 border-2" style={{ borderColor: '#E8ECEC' }}>
                      <div className="flex items-center gap-2 mb-3">
                        <FileText className="w-5 h-5" style={{ color: '#6A8A82' }} />
                        <h3 className="font-bold" style={{ color: '#191919' }}>Notes</h3>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap">{displayDriver.notes}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Stats Tab */}
          {activeTab === 'stats' && (
            <div className="space-y-6">
              {/* Rating Card */}
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 border-2 border-yellow-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Note globale</p>
                    <div className="flex items-center gap-2">
                      <span className="text-5xl font-bold" style={{ color: '#191919' }}>
                        {Number(displayDriver.rating).toFixed(1)}
                      </span>
                      <span className="text-2xl text-gray-400">/5</span>
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                      {renderStars(displayDriver.rating)}
                    </div>
                  </div>
                  <div className="w-24 h-24 rounded-full flex items-center justify-center bg-gradient-to-br from-yellow-400 to-orange-400 shadow-lg">
                    <Star className="w-12 h-12 text-white fill-white" />
                  </div>
                </div>
              </div>

              {/* Main Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Total Trips */}
                <div className="bg-gradient-to-br from-sage/10 to-transparent rounded-xl p-5 border-2" style={{ borderColor: '#E8EFED' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Nombre de missions</p>
                      <p className="text-4xl font-bold" style={{ color: '#6A8A82' }}>
                        {displayDriver.total_trips}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">trajets effectués</p>
                    </div>
                    <div className="w-16 h-16 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#E8EFED' }}>
                      <Route className="w-8 h-8" style={{ color: '#6A8A82' }} />
                    </div>
                  </div>
                </div>

                {/* Total Distance */}
                <div className="bg-gradient-to-br from-copper/10 to-transparent rounded-xl p-5 border-2" style={{ borderColor: '#F5E8DD' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Distance totale</p>
                      <p className="text-4xl font-bold" style={{ color: '#B87333' }}>
                        {Number(displayDriver.total_distance).toLocaleString('fr-FR')}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">kilomètres parcourus</p>
                    </div>
                    <div className="w-16 h-16 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#F5E8DD' }}>
                      <MapPin className="w-8 h-8" style={{ color: '#B87333' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Incident Summary */}
              {incidentStats && (
                <div className="bg-gray-50 rounded-xl p-5 border-2" style={{ borderColor: '#E8ECEC' }}>
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-5 h-5 text-gray-600" />
                    <h3 className="font-bold" style={{ color: '#191919' }}>Resume des incidents</h3>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-white rounded-lg">
                      <p className="text-2xl font-bold" style={{ color: '#191919' }}>
                        {incidentStats.total}
                      </p>
                      <p className="text-xs text-gray-500">Total</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">
                        {incidentStats.resolved}
                      </p>
                      <p className="text-xs text-gray-500">Resolus</p>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <p className="text-2xl font-bold text-orange-600">
                        {incidentStats.pending}
                      </p>
                      <p className="text-xs text-gray-500">En attente</p>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <p className="text-2xl font-bold text-red-600">
                        {incidentStats.by_severity.critical + incidentStats.by_severity.major}
                      </p>
                      <p className="text-xs text-gray-500">Graves</p>
                    </div>
                  </div>

                  {/* Severity Breakdown */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm font-medium text-gray-600 mb-3">Par gravite</p>
                    <div className="flex gap-2">
                      {Object.entries(SEVERITY_CONFIG).map(([key, config]) => (
                        <div
                          key={key}
                          className="flex-1 text-center p-2 rounded-lg"
                          style={{ backgroundColor: config.bgColor }}
                        >
                          <p className="text-lg font-bold" style={{ color: config.color }}>
                            {incidentStats.by_severity[key as keyof typeof incidentStats.by_severity]}
                          </p>
                          <p className="text-xs" style={{ color: config.color }}>{config.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Performance Indicator */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-5 border-2 border-emerald-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Performance globale</p>
                    <p className="text-lg font-semibold text-emerald-700">
                      {displayDriver.rating >= 4.5 ? 'Excellent' :
                       displayDriver.rating >= 4 ? 'Très bien' :
                       displayDriver.rating >= 3 ? 'Bien' :
                       displayDriver.rating >= 2 ? 'Moyen' : 'À améliorer'}
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    displayDriver.rating >= 4 ? 'bg-emerald-100' :
                    displayDriver.rating >= 3 ? 'bg-yellow-100' : 'bg-red-100'
                  }`}>
                    {displayDriver.rating >= 4 ? (
                      <CheckCircle className="w-6 h-6 text-emerald-600" />
                    ) : displayDriver.rating >= 3 ? (
                      <Clock className="w-6 h-6 text-yellow-600" />
                    ) : (
                      <AlertTriangle className="w-6 h-6 text-red-600" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Incidents Tab */}
          {activeTab === 'incidents' && (
            <div className="space-y-4">
              {/* Filter */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600">Filtrer:</span>
                {[
                  { id: 'all', label: 'Tous' },
                  { id: 'pending', label: 'En attente' },
                  { id: 'resolved', label: 'Resolus' },
                ].map(filter => (
                  <button
                    key={filter.id}
                    onClick={() => setIncidentFilter(filter.id as typeof incidentFilter)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      incidentFilter === filter.id
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {filter.label}
                    {filter.id === 'pending' && incidentStats && incidentStats.pending > 0 && (
                      <span className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                        {incidentStats.pending}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Loading */}
              {isLoadingIncidents && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              )}

              {/* Incidents List */}
              {!isLoadingIncidents && filteredIncidents.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 font-medium">Aucun incident</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {incidentFilter === 'pending'
                      ? 'Tous les incidents ont ete resolus'
                      : incidentFilter === 'resolved'
                      ? 'Aucun incident resolu'
                      : 'Ce conducteur n\'a aucun incident enregistre'}
                  </p>
                </div>
              )}

              {!isLoadingIncidents && filteredIncidents.length > 0 && (
                <div className="space-y-3">
                  {filteredIncidents.map(incident => {
                    const typeConfig = INCIDENT_TYPE_CONFIG[incident.incident_type] || INCIDENT_TYPE_CONFIG.other;
                    const severityConfig = SEVERITY_CONFIG[incident.severity] || SEVERITY_CONFIG.minor;
                    const TypeIcon = typeConfig.icon;

                    return (
                      <div
                        key={incident.id}
                        className="bg-white rounded-xl border-2 p-4 hover:shadow-md transition-all"
                        style={{ borderColor: '#E8ECEC' }}
                      >
                        <div className="flex items-start gap-4">
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: `${typeConfig.color}15` }}
                          >
                            <TypeIcon className="w-6 h-6" style={{ color: typeConfig.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="font-semibold" style={{ color: '#191919' }}>
                                  {incident.title}
                                </h4>
                                <p className="text-sm text-gray-500">
                                  {typeConfig.label} - {formatDateTime(incident.reported_at)}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span
                                  className="px-2 py-1 rounded-full text-xs font-medium"
                                  style={{ backgroundColor: severityConfig.bgColor, color: severityConfig.color }}
                                >
                                  {severityConfig.label}
                                </span>
                                {incident.is_resolved ? (
                                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                    Resolu
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                                    En attente
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                              {incident.description}
                            </p>
                            {incident.address && (
                              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {incident.address}
                              </p>
                            )}
                            {incident.vehicle_plate && (
                              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                <Car className="w-3 h-3" />
                                Vehicule: {incident.vehicle_plate}
                              </p>
                            )}
                            {incident.is_resolved && incident.resolved_at && (
                              <p className="text-xs text-green-600 mt-2">
                                Resolu le {formatDateTime(incident.resolved_at)}
                                {incident.resolved_by_name && ` par ${incident.resolved_by_name}`}
                              </p>
                            )}
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-4 border-t-2 bg-gray-50" style={{ borderColor: '#E8ECEC' }}>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl font-semibold transition-all hover:bg-gray-200"
            style={{ backgroundColor: '#E8ECEC', color: '#6B7280' }}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
