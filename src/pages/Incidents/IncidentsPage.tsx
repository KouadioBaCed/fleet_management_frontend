import Layout from '@/components/Layout/Layout';
import { AlertTriangle, Plus, Filter, MapPin, Clock, User, Camera, Car, MoreVertical, Search, LayoutGrid, List, CheckCircle, RefreshCw, Loader2, PieChart } from 'lucide-react';
import { useState, useMemo, useEffect, useCallback } from 'react';
import AddIncidentModal from '@/components/Incidents/AddIncidentModal';
import IncidentDetailsModal from '@/components/Incidents/IncidentDetailsModal';
import EditIncidentModal from '@/components/Incidents/EditIncidentModal';
import DeleteIncidentModal from '@/components/Incidents/DeleteIncidentModal';
import ResolveIncidentModal from '@/components/Incidents/ResolveIncidentModal';
import IncidentAnalytics from '@/components/Incidents/IncidentAnalytics';
import Pagination from '@/components/common/Pagination';
import { incidentsApi, type Incident, type IncidentStats, type IncidentFilters } from '@/api/incidents';

type ViewMode = 'grid' | 'list';
type PageMode = 'list' | 'analytics';

const ITEMS_PER_PAGE = 6;

export default function IncidentsPage() {
  const [pageMode, setPageMode] = useState<PageMode>('list');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<IncidentFilters['incident_type']>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<IncidentFilters['severity']>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isTypeFilterOpen, setIsTypeFilterOpen] = useState(false);
  const [isSeverityFilterOpen, setIsSeverityFilterOpen] = useState(false);

  // Data state
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [stats, setStats] = useState<IncidentStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const severityConfig: Record<string, { bg: string; text: string; label: string; dot: string }> = {
    minor: { bg: '#E8EFED', text: '#6A8A82', label: 'Mineur', dot: '#6A8A82' },
    moderate: { bg: '#E8ECEC', text: '#6B7280', label: 'Modéré', dot: '#6B7280' },
    major: { bg: '#F5E8DD', text: '#B87333', label: 'Majeur', dot: '#B87333' },
    critical: { bg: '#E8ECEC', text: '#191919', label: 'Critique', dot: '#191919' },
  };

  const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    unresolved: { bg: '#FEF3C7', text: '#D97706', label: 'Non résolu' },
    resolved: { bg: '#E8EFED', text: '#6A8A82', label: 'Résolu' },
  };

  const typeConfig: Record<string, { icon: typeof AlertTriangle; label: string; color: string }> = {
    flat_tire: { icon: AlertTriangle, label: 'Pneu crevé', color: '#6A8A82' },
    breakdown: { icon: Car, label: 'Panne', color: '#B87333' },
    accident: { icon: AlertTriangle, label: 'Accident', color: '#191919' },
    fuel_issue: { icon: AlertTriangle, label: 'Problème carburant', color: '#6A8A82' },
    traffic_violation: { icon: AlertTriangle, label: 'Infraction', color: '#6B7280' },
    other: { icon: AlertTriangle, label: 'Autre', color: '#6B7280' },
  };

  // Fetch incidents
  const fetchIncidents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const filters: IncidentFilters = {};
      if (selectedType && selectedType !== 'all') filters.incident_type = selectedType;
      if (selectedSeverity && selectedSeverity !== 'all') filters.severity = selectedSeverity;
      if (searchQuery) filters.search = searchQuery;

      const response = await incidentsApi.getAll(filters);
      setIncidents(response.results);
      setStats(response.stats);
    } catch (err) {
      console.error('Error fetching incidents:', err);
      setError('Erreur lors du chargement des incidents');
    } finally {
      setIsLoading(false);
    }
  }, [selectedType, selectedSeverity, searchQuery]);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Stats for display
  const displayStats = [
    { severity: 'minor', value: stats?.by_severity.minor || 0, color: '#6A8A82' },
    { severity: 'moderate', value: stats?.by_severity.moderate || 0, color: '#6B7280' },
    { severity: 'major', value: stats?.by_severity.major || 0, color: '#B87333' },
    { severity: 'critical', value: stats?.by_severity.critical || 0, color: '#191919' },
  ];

  // Pagination
  const totalPages = Math.ceil(incidents.length / ITEMS_PER_PAGE);
  const paginatedIncidents = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return incidents.slice(startIndex, endIndex);
  }, [incidents, currentPage]);

  const handleAddIncident = async (data: any) => {
    try {
      await incidentsApi.create(data);
      setIsAddModalOpen(false);
      fetchIncidents();
    } catch (err) {
      console.error('Error creating incident:', err);
    }
  };

  const handleViewDetails = async (incident: Incident) => {
    setOpenMenuId(null);
    try {
      // Fetch full incident data from API
      const fullIncident = await incidentsApi.getById(incident.id);
      setSelectedIncident(fullIncident);
      setIsDetailsModalOpen(true);
    } catch (err) {
      console.error('Error fetching incident details:', err);
      // Fallback to list data if API fails
      setSelectedIncident(incident);
      setIsDetailsModalOpen(true);
    }
  };

  const handleEditIncident = async (incident: Incident) => {
    setOpenMenuId(null);
    try {
      // Fetch full incident data from API
      const fullIncident = await incidentsApi.getById(incident.id);
      setSelectedIncident(fullIncident);
      setIsEditModalOpen(true);
    } catch (err) {
      console.error('Error fetching incident for edit:', err);
      // Fallback to list data if API fails
      setSelectedIncident(incident);
      setIsEditModalOpen(true);
    }
  };

  const handleDeleteClick = (incident: Incident) => {
    setSelectedIncident(incident);
    setIsDeleteModalOpen(true);
    setOpenMenuId(null);
  };

  const handleResolveClick = (incident: Incident) => {
    setSelectedIncident(incident);
    setIsResolveModalOpen(true);
    setOpenMenuId(null);
  };

  const handleReopenClick = async (incident: Incident) => {
    try {
      await incidentsApi.reopen(incident.id);
      fetchIncidents();
      setOpenMenuId(null);
    } catch (err) {
      console.error('Error reopening incident:', err);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedIncident) return;
    try {
      await incidentsApi.delete(selectedIncident.id);
      setIsDeleteModalOpen(false);
      setSelectedIncident(null);
      fetchIncidents();
    } catch (err) {
      console.error('Error deleting incident:', err);
    }
  };

  const handleUpdateIncident = async (data: any) => {
    if (!selectedIncident) return;
    try {
      await incidentsApi.update(selectedIncident.id, data);
      setIsEditModalOpen(false);
      setSelectedIncident(null);
      fetchIncidents();
    } catch (err) {
      console.error('Error updating incident:', err);
    }
  };

  const handleResolveIncident = async (data: { resolution_notes: string; estimated_cost?: number }) => {
    if (!selectedIncident) return;
    try {
      await incidentsApi.resolve(selectedIncident.id, data);
      setIsResolveModalOpen(false);
      setSelectedIncident(null);
      fetchIncidents();
    } catch (err) {
      console.error('Error resolving incident:', err);
    }
  };

  // Get status for display
  const getIncidentStatus = (incident: Incident) => {
    return incident.is_resolved ? 'resolved' : 'unresolved';
  };

  // Format photos for display
  const hasPhotos = (incident: Incident) => {
    return incident.photo1 || incident.photo2 || incident.photo3;
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: '#1f2937' }}>
              Incidents
            </h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">Gérez et suivez les incidents de votre flotte</p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center space-x-2 text-white transition-all duration-300 hover:-translate-y-0.5 w-full sm:w-auto justify-center btn-primary"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Déclarer un incident</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {displayStats.map((stat, index) => {
            const config = severityConfig[stat.severity];
            return (
              <div key={index} className="stat-card">
                <div className="stat-accent" style={{ backgroundColor: stat.color }} />
                <div className="flex items-center gap-3">
                  <div className="stat-icon" style={{ backgroundColor: `${stat.color}12` }}>
                    <AlertTriangle className="w-4 h-4" style={{ color: stat.color }} />
                  </div>
                  <div>
                    <p className="stat-label">{config.label}</p>
                    <p className="stat-value" style={{ color: stat.color }}>{stat.value}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Page Mode Toggle */}
        <div className="flex items-center justify-center">
          <div className="flex items-center bg-white rounded-xl border p-1 w-full sm:w-auto" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
            <button
              onClick={() => setPageMode('list')}
              className={`flex-1 sm:flex-none flex items-center justify-center space-x-2 px-3 sm:px-6 py-2 sm:py-2.5 rounded-lg font-semibold transition-all text-xs sm:text-sm ${
                pageMode === 'list' ? 'shadow-md' : 'hover:bg-gray-50'
              }`}
              style={{
                backgroundColor: pageMode === 'list' ? '#6A8A82' : 'transparent',
                color: pageMode === 'list' ? '#ffffff' : '#6B7280'
              }}
            >
              <List className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden xs:inline">Liste des incidents</span>
              <span className="xs:hidden">Liste</span>
            </button>
            <button
              onClick={() => setPageMode('analytics')}
              className={`flex-1 sm:flex-none flex items-center justify-center space-x-2 px-3 sm:px-6 py-2 sm:py-2.5 rounded-lg font-semibold transition-all text-xs sm:text-sm ${
                pageMode === 'analytics' ? 'shadow-md' : 'hover:bg-gray-50'
              }`}
              style={{
                backgroundColor: pageMode === 'analytics' ? '#6A8A82' : 'transparent',
                color: pageMode === 'analytics' ? '#ffffff' : '#6B7280'
              }}
            >
              <PieChart className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Analyse</span>
            </button>
          </div>
        </div>

        {/* Analytics View */}
        {pageMode === 'analytics' && (
          <IncidentAnalytics />
        )}

        {/* List View Content */}
        {pageMode === 'list' && (
          <>
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un incident..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="soft-input w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 text-xs sm:text-sm"
              style={{ color: 'black' }}
            />
          </div>

          {/* Filters Row */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Type Filter Dropdown */}
            <div className="relative flex-1 sm:flex-none">
              <button
                onClick={() => setIsTypeFilterOpen(!isTypeFilterOpen)}
                className={`flex items-center justify-center space-x-1 sm:space-x-2 px-3 sm:px-5 py-2.5 sm:py-3 rounded-xl border font-semibold transition-all hover:shadow-md w-full sm:w-auto text-xs sm:text-sm ${
                  selectedType !== 'all' ? 'shadow-md' : ''
                }`}
                style={{
                  borderColor: selectedType !== 'all' ? '#6A8A82' : 'rgba(0,0,0,0.08)',
                  backgroundColor: selectedType !== 'all' ? '#E8EFED' : '#ffffff',
                  color: selectedType !== 'all' ? '#6A8A82' : '#6B7280'
                }}
              >
                <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Type</span>
                {selectedType !== 'all' && (
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#B87333' }} />
                )}
              </button>

            {isTypeFilterOpen && (
              <div className="absolute right-0 mt-2 w-64 soft-dropdown z-10">
                <div className="p-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-3 px-2">Type d'incident</p>
                  {[
                    { value: 'all' as const, label: 'Tous les types', count: stats?.total || 0 },
                    { value: 'flat_tire' as const, label: 'Pneu crevé', count: stats?.by_type.flat_tire || 0 },
                    { value: 'breakdown' as const, label: 'Panne', count: stats?.by_type.breakdown || 0 },
                    { value: 'accident' as const, label: 'Accident', count: stats?.by_type.accident || 0 },
                    { value: 'fuel_issue' as const, label: 'Problème carburant', count: stats?.by_type.fuel_issue || 0 },
                    { value: 'traffic_violation' as const, label: 'Infraction', count: stats?.by_type.traffic_violation || 0 },
                    { value: 'other' as const, label: 'Autre', count: stats?.by_type.other || 0 },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSelectedType(option.value);
                        setIsTypeFilterOpen(false);
                        setCurrentPage(1);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all mb-1 ${
                        selectedType === option.value ? 'shadow-sm' : 'hover:bg-gray-50'
                      }`}
                      style={{
                        backgroundColor: selectedType === option.value ? '#E8EFED' : 'transparent',
                        color: selectedType === option.value ? '#6A8A82' : '#1f2937'
                      }}
                    >
                      <span>{option.label}</span>
                      <span
                        className="text-xs font-bold px-2 py-1 rounded-full"
                        style={{
                          backgroundColor: selectedType === option.value ? '#6A8A82' : '#E8ECEC',
                          color: selectedType === option.value ? '#ffffff' : '#6B7280'
                        }}
                      >
                        {option.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

            {/* Severity Filter Dropdown */}
            <div className="relative flex-1 sm:flex-none">
              <button
                onClick={() => setIsSeverityFilterOpen(!isSeverityFilterOpen)}
                className={`flex items-center justify-center space-x-1 sm:space-x-2 px-3 sm:px-5 py-2.5 sm:py-3 rounded-xl border font-semibold transition-all hover:shadow-md w-full sm:w-auto text-xs sm:text-sm ${
                  selectedSeverity !== 'all' ? 'shadow-md' : ''
                }`}
                style={{
                  borderColor: selectedSeverity !== 'all' ? '#6A8A82' : 'rgba(0,0,0,0.08)',
                  backgroundColor: selectedSeverity !== 'all' ? '#E8EFED' : '#ffffff',
                  color: selectedSeverity !== 'all' ? '#6A8A82' : '#6B7280'
                }}
              >
                <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Gravité</span>
                {selectedSeverity !== 'all' && (
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#B87333' }} />
                )}
              </button>

            {isSeverityFilterOpen && (
              <div className="absolute right-0 mt-2 w-64 soft-dropdown z-10">
                <div className="p-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-3 px-2">Gravité</p>
                  {[
                    { value: 'all' as const, label: 'Toutes les gravités', count: stats?.total || 0 },
                    { value: 'minor' as const, label: 'Mineur', count: stats?.by_severity.minor || 0 },
                    { value: 'moderate' as const, label: 'Modéré', count: stats?.by_severity.moderate || 0 },
                    { value: 'major' as const, label: 'Majeur', count: stats?.by_severity.major || 0 },
                    { value: 'critical' as const, label: 'Critique', count: stats?.by_severity.critical || 0 },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSelectedSeverity(option.value);
                        setIsSeverityFilterOpen(false);
                        setCurrentPage(1);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all mb-1 ${
                        selectedSeverity === option.value ? 'shadow-sm' : 'hover:bg-gray-50'
                      }`}
                      style={{
                        backgroundColor: selectedSeverity === option.value ? '#E8EFED' : 'transparent',
                        color: selectedSeverity === option.value ? '#6A8A82' : '#1f2937'
                      }}
                    >
                      <span>{option.label}</span>
                      <span
                        className="text-xs font-bold px-2 py-1 rounded-full"
                        style={{
                          backgroundColor: selectedSeverity === option.value ? '#6A8A82' : '#E8ECEC',
                          color: selectedSeverity === option.value ? '#ffffff' : '#6B7280'
                        }}
                      >
                        {option.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              )}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center rounded-xl soft-toggle-group">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 sm:p-3 transition-all ${viewMode === 'grid' ? 'shadow-sm' : 'hover:bg-gray-50'}`}
                style={{
                  backgroundColor: viewMode === 'grid' ? '#E8EFED' : 'transparent',
                  color: viewMode === 'grid' ? '#6A8A82' : '#6B7280'
                }}
                title="Vue grille"
              >
                <LayoutGrid className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <div className="w-px h-6 sm:h-8" style={{ backgroundColor: '#E8ECEC' }} />
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 sm:p-3 transition-all ${viewMode === 'list' ? 'shadow-sm' : 'hover:bg-gray-50'}`}
                style={{
                  backgroundColor: viewMode === 'list' ? '#E8EFED' : 'transparent',
                  color: viewMode === 'list' ? '#6A8A82' : '#6B7280'
                }}
                title="Vue liste"
              >
                <List className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#6A8A82' }} />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
            <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-700 font-medium">{error}</p>
            <button
              onClick={fetchIncidents}
              className="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition-colors"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && incidents.length === 0 && (
          <div className="data-table-container p-12 text-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: '#E8EFED' }}
            >
              <AlertTriangle className="w-8 h-8" style={{ color: '#6A8A82' }} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Aucun incident</h3>
            <p className="text-gray-500 mb-6">
              {searchQuery || selectedType !== 'all' || selectedSeverity !== 'all'
                ? 'Aucun incident ne correspond à vos critères de recherche'
                : 'Vous n\'avez pas encore déclaré d\'incident'}
            </p>
            {(searchQuery || selectedType !== 'all' || selectedSeverity !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedType('all');
                  setSelectedSeverity('all');
                }}
                className="px-4 py-2 rounded-lg font-medium transition-colors"
                style={{ backgroundColor: '#E8EFED', color: '#6A8A82' }}
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        )}

        {/* Incidents Display - Grid or List View */}
        {!isLoading && !error && incidents.length > 0 && (
          viewMode === 'grid' ? (
            /* Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {paginatedIncidents.map((incident) => {
                const severity = severityConfig[incident.severity];
                const type = typeConfig[incident.incident_type] || typeConfig.other;
                const TypeIcon = type.icon;
                const incidentStatus = getIncidentStatus(incident);
                const status = statusConfig[incidentStatus];

                return (
                  <div
                    key={incident.id}
                    className="data-card overflow-hidden hover:shadow-lg transition-all duration-300 !p-0"
                  >
                    {/* Header with colored bar */}
                    <div className="h-1.5 sm:h-2" style={{ backgroundColor: severity.dot }} />

                    <div className="p-3 sm:p-5">
                      {/* Top Section */}
                      <div className="flex items-start justify-between mb-3 sm:mb-4">
                        <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: severity.bg }}>
                            <TypeIcon className="w-4 h-4 sm:w-6 sm:h-6" style={{ color: type.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm sm:text-lg font-semibold truncate" style={{ color: '#1f2937' }}>{incident.title}</h3>
                            <p className="text-[10px] sm:text-xs text-gray-600">INC-{incident.id} • {incident.incident_type_display}</p>
                          </div>
                        </div>

                        {/* Action Menu */}
                        <div className="relative ml-2">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === incident.id ? null : incident.id)}
                            className="p-2 rounded-lg font-semibold transition-all hover:shadow-sm flex items-center justify-center"
                            style={{ backgroundColor: '#E8EFED', color: '#6A8A82' }}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {openMenuId === incident.id && (
                            <div className="absolute right-0 top-full mt-2 w-48 soft-dropdown z-10 overflow-hidden">
                              <button
                                onClick={() => handleViewDetails(incident)}
                                className="w-full px-4 py-3 text-left text-sm font-medium hover:bg-gray-50 transition-all"
                                style={{ color: '#1f2937' }}
                              >
                                Détails
                              </button>
                              {!incident.is_resolved ? (
                                <button
                                  onClick={() => handleResolveClick(incident)}
                                  className="w-full px-4 py-3 text-left text-sm font-medium hover:bg-gray-50 transition-all flex items-center space-x-2"
                                  style={{ color: '#6A8A82' }}
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  <span>Résoudre</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleReopenClick(incident)}
                                  className="w-full px-4 py-3 text-left text-sm font-medium hover:bg-gray-50 transition-all flex items-center space-x-2"
                                  style={{ color: '#B87333' }}
                                >
                                  <RefreshCw className="w-4 h-4" />
                                  <span>Rouvrir</span>
                                </button>
                              )}
                              <button
                                onClick={() => handleEditIncident(incident)}
                                className="w-full px-4 py-3 text-left text-sm font-medium hover:bg-gray-50 transition-all"
                                style={{ color: '#6A8A82' }}
                              >
                                Modifier
                              </button>
                              <button
                                onClick={() => handleDeleteClick(incident)}
                                className="w-full px-4 py-3 text-left text-sm font-medium hover:bg-red-50 transition-all text-red-600"
                              >
                                Supprimer
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Badges */}
                      <div className="flex items-center flex-wrap gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                        <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold" style={{ backgroundColor: severity.bg, color: severity.text }}>
                          {severity.label}
                        </span>
                        <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold" style={{ backgroundColor: status.bg, color: status.text }}>
                          {status.label}
                        </span>
                        {hasPhotos(incident) && (
                          <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold flex items-center space-x-1" style={{ backgroundColor: '#F3E8FF', color: '#7C3AED' }}>
                            <Camera className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            <span className="hidden xs:inline">Photos</span>
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      <div className="mb-3 sm:mb-4 p-2 sm:p-3 rounded-lg sm:rounded-xl text-xs sm:text-sm line-clamp-2" style={{ backgroundColor: 'rgba(106,138,130,0.04)' }}>
                        <p className="text-gray-700">{incident.description}</p>
                      </div>

                      {/* Quick Info */}
                      <div className="grid grid-cols-2 gap-2 text-[10px] sm:text-xs">
                        <div className="flex items-center space-x-1.5 sm:space-x-2">
                          <User className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" style={{ color: '#6A8A82' }} />
                          <span className="text-gray-600 truncate">{incident.driver_name}</span>
                        </div>
                        <div className="flex items-center space-x-1.5 sm:space-x-2">
                          <Car className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" style={{ color: '#B87333' }} />
                          <span className="text-gray-600 truncate">{incident.vehicle_plate}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* List View */
            <div className="space-y-3 sm:space-y-4">
              {paginatedIncidents.map((incident) => {
                const severity = severityConfig[incident.severity];
                const type = typeConfig[incident.incident_type] || typeConfig.other;
                const TypeIcon = type.icon;
                const incidentStatus = getIncidentStatus(incident);
                const status = statusConfig[incidentStatus];

                return (
                  <div
                    key={incident.id}
                    className="data-card overflow-hidden hover:shadow-lg transition-all duration-300 !p-0"
                  >
                    {/* Header with colored bar */}
                    <div className="h-1.5 sm:h-2" style={{ backgroundColor: severity.dot }} />

                    <div className="p-3 sm:p-6">
                      {/* Top Section */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-3 sm:mb-4 gap-2 sm:gap-0">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
                            <div
                              className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: severity.bg }}
                            >
                              <TypeIcon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: type.color }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-base sm:text-xl font-semibold truncate" style={{ color: '#1f2937' }}>{incident.title}</h3>
                              <p className="text-xs sm:text-sm text-gray-600">INC-{incident.id} • {incident.incident_type_display}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center flex-wrap gap-1.5 sm:gap-2">
                          <span
                            className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold"
                            style={{ backgroundColor: severity.bg, color: severity.text }}
                          >
                            {severity.label}
                          </span>
                          <span
                            className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold"
                            style={{ backgroundColor: status.bg, color: status.text }}
                          >
                            {status.label}
                          </span>
                          {hasPhotos(incident) && (
                            <span
                              className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold flex items-center space-x-1"
                              style={{ backgroundColor: '#F3E8FF', color: '#7C3AED' }}
                            >
                              <Camera className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                              <span className="hidden xs:inline">Photos</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Description */}
                      <div className="mb-3 sm:mb-4 p-2 sm:p-4 rounded-lg sm:rounded-xl" style={{ backgroundColor: 'rgba(106,138,130,0.04)' }}>
                        <p className="text-gray-700 text-xs sm:text-base">{incident.description}</p>
                      </div>

                      {/* Info Grid */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-3 sm:mb-4">
                        <div className="bg-gradient-to-br from-sage/5 to-transparent rounded-lg sm:rounded-xl p-2 sm:p-4 border-2" style={{ borderColor: '#E8EFED' }}>
                          <div className="flex items-center space-x-2 sm:space-x-3">
                            <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#E8EFED' }}>
                              <User className="w-3.5 h-3.5 sm:w-5 sm:h-5" style={{ color: '#6A8A82' }} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] sm:text-xs font-medium text-gray-600">Chauffeur</p>
                              <p className="font-bold text-xs sm:text-base truncate" style={{ color: '#1f2937' }}>{incident.driver_name}</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-copper/5 to-transparent rounded-lg sm:rounded-xl p-2 sm:p-4 border-2" style={{ borderColor: '#F5E8DD' }}>
                          <div className="flex items-center space-x-2 sm:space-x-3">
                            <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#F5E8DD' }}>
                              <Car className="w-3.5 h-3.5 sm:w-5 sm:h-5" style={{ color: '#B87333' }} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] sm:text-xs font-medium text-gray-600">Véhicule</p>
                              <p className="font-bold text-xs sm:text-base truncate" style={{ color: '#1f2937' }}>{incident.vehicle_plate}</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-sage/5 to-transparent rounded-lg sm:rounded-xl p-2 sm:p-4 border-2" style={{ borderColor: '#E8EFED' }}>
                          <div className="flex items-center space-x-2 sm:space-x-3">
                            <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#E8EFED' }}>
                              <MapPin className="w-3.5 h-3.5 sm:w-5 sm:h-5" style={{ color: '#6A8A82' }} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] sm:text-xs font-medium text-gray-600">Localisation</p>
                              <p className="font-bold text-[10px] sm:text-sm truncate" style={{ color: '#1f2937' }}>{incident.address || 'Non spécifié'}</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-copper/5 to-transparent rounded-lg sm:rounded-xl p-2 sm:p-4 border-2" style={{ borderColor: '#F5E8DD' }}>
                          <div className="flex items-center space-x-2 sm:space-x-3">
                            <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#F5E8DD' }}>
                              <Clock className="w-3.5 h-3.5 sm:w-5 sm:h-5" style={{ color: '#B87333' }} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] sm:text-xs font-medium text-gray-600">Signalé le</p>
                              <p className="font-bold text-[10px] sm:text-sm truncate" style={{ color: '#1f2937' }}>
                                {new Date(incident.reported_at).toLocaleString('fr-FR', {
                                  day: '2-digit',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Resolution info if resolved */}
                      {incident.is_resolved && (
                        <div className="mb-3 sm:mb-4 p-2 sm:p-4 rounded-lg sm:rounded-xl border-2" style={{ backgroundColor: '#E8EFED', borderColor: '#6A8A82' }}>
                          <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#6A8A82' }} />
                            <span className="font-bold text-xs sm:text-base" style={{ color: '#6A8A82' }}>Résolu</span>
                            {incident.resolved_at && (
                              <span className="text-[10px] sm:text-sm text-gray-600">
                                le {new Date(incident.resolved_at).toLocaleString('fr-FR', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </span>
                            )}
                            {incident.resolved_by_name && (
                              <span className="text-[10px] sm:text-sm text-gray-600">
                                par {incident.resolved_by_name}
                              </span>
                            )}
                          </div>
                          {incident.resolution_notes && (
                            <p className="text-[10px] sm:text-sm text-gray-700">{incident.resolution_notes}</p>
                          )}
                          {incident.estimated_cost && (
                            <p className="text-[10px] sm:text-sm font-medium mt-1 sm:mt-2" style={{ color: '#B87333' }}>
                              Coût estimé: {incident.estimated_cost}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Action Button */}
                      <div className="flex justify-end">
                        <div className="relative">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === incident.id ? null : incident.id)}
                            className="p-2 sm:p-2.5 rounded-lg font-semibold transition-all hover:shadow-sm flex-shrink-0 flex items-center justify-center"
                            style={{ backgroundColor: '#E8EFED', color: '#6A8A82' }}
                            onMouseEnter={(e) => {
                              if (openMenuId !== incident.id) {
                                e.currentTarget.style.backgroundColor = '#6A8A82';
                                e.currentTarget.style.color = '#ffffff';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (openMenuId !== incident.id) {
                                e.currentTarget.style.backgroundColor = '#E8EFED';
                                e.currentTarget.style.color = '#6A8A82';
                              }
                            }}
                          >
                            <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>

                          {/* Dropdown Menu */}
                          {openMenuId === incident.id && (
                            <div className="absolute right-0 bottom-full mb-2 w-48 soft-dropdown z-10 overflow-hidden">
                              <button
                                onClick={() => handleViewDetails(incident)}
                                className="w-full px-4 py-3 text-left text-sm font-medium hover:bg-gray-50 transition-all"
                                style={{ color: '#1f2937' }}
                              >
                                Détails
                              </button>
                              {!incident.is_resolved ? (
                                <button
                                  onClick={() => handleResolveClick(incident)}
                                  className="w-full px-4 py-3 text-left text-sm font-medium hover:bg-gray-50 transition-all flex items-center space-x-2"
                                  style={{ color: '#6A8A82' }}
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  <span>Résoudre</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleReopenClick(incident)}
                                  className="w-full px-4 py-3 text-left text-sm font-medium hover:bg-gray-50 transition-all flex items-center space-x-2"
                                  style={{ color: '#B87333' }}
                                >
                                  <RefreshCw className="w-4 h-4" />
                                  <span>Rouvrir</span>
                                </button>
                              )}
                              <button
                                onClick={() => handleEditIncident(incident)}
                                className="w-full px-4 py-3 text-left text-sm font-medium hover:bg-gray-50 transition-all"
                                style={{ color: '#6A8A82' }}
                              >
                                Modifier
                              </button>
                              <button
                                onClick={() => handleDeleteClick(incident)}
                                className="w-full px-4 py-3 text-left text-sm font-medium hover:bg-red-50 transition-all text-red-600"
                              >
                                Supprimer
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={incidents.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        )}
        </>
        )}

        {/* Add Incident Modal */}
        <AddIncidentModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleAddIncident}
        />

        {/* Incident Details Modal */}
        <IncidentDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => {
            setIsDetailsModalOpen(false);
            setSelectedIncident(null);
          }}
          incident={selectedIncident}
          severityConfig={severityConfig}
          typeConfig={typeConfig}
          statusConfig={statusConfig}
        />

        {/* Edit Incident Modal */}
        <EditIncidentModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedIncident(null);
          }}
          onSubmit={handleUpdateIncident}
          incident={selectedIncident}
        />

        {/* Delete Incident Modal */}
        <DeleteIncidentModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setSelectedIncident(null);
          }}
          onConfirm={handleConfirmDelete}
          incident={selectedIncident}
        />

        {/* Resolve Incident Modal */}
        <ResolveIncidentModal
          isOpen={isResolveModalOpen}
          onClose={() => {
            setIsResolveModalOpen(false);
            setSelectedIncident(null);
          }}
          onConfirm={handleResolveIncident}
          incident={selectedIncident}
        />
      </div>
    </Layout>
  );
}
