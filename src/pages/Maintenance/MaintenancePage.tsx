import { useState, useMemo, useEffect, useCallback } from 'react';
import Layout from '@/components/Layout/Layout';
import Pagination from '@/components/common/Pagination';
import AddMaintenanceModal from '@/components/Maintenance/AddMaintenanceModal';
import MaintenanceDetailsModal from '@/components/Maintenance/MaintenanceDetailsModal';
import EditMaintenanceModal from '@/components/Maintenance/EditMaintenanceModal';
import DeleteMaintenanceModal from '@/components/Maintenance/DeleteMaintenanceModal';
import MaintenanceCalendar from '@/components/Maintenance/MaintenanceCalendar';
import MileageAlerts from '@/components/Maintenance/MileageAlerts';
import MaintenanceHistory from '@/components/Maintenance/MaintenanceHistory';
import { Wrench, Plus, Calendar, Clock, Car, Coins, CheckCircle, AlertCircle, Search, Filter, LayoutGrid, List, MoreVertical, Eye, Edit, Trash2, CalendarDays, Gauge, Play, X, Loader2, History } from 'lucide-react';
import { maintenanceApi, type Maintenance, type MaintenanceStats, type CalendarEvent, type MileageAlert } from '@/api/maintenance';
import { useCurrency } from '@/store/settingsStore';
import { getCurrencySymbol } from '@/api/settings';

type ViewMode = 'list' | 'calendar' | 'history';
type StatusFilter = 'all' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
type TypeFilter = 'all' | 'oil_change' | 'tire_change' | 'brake_service' | 'inspection' | 'repair' | 'preventive' | 'other';

const ITEMS_PER_PAGE = 6;

export default function MaintenancePage() {
  const currency = useCurrency();
  const currencySymbol = getCurrencySymbol(currency);

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isTypeFilterOpen, setIsTypeFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedMaintenance, setSelectedMaintenance] = useState<Maintenance | null>(null);
  const [preselectedVehicle, setPreselectedVehicle] = useState<number | null>(null);

  // Data state
  const [maintenanceRecords, setMaintenanceRecords] = useState<Maintenance[]>([]);
  const [stats, setStats] = useState<MaintenanceStats | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [mileageAlerts, setMileageAlerts] = useState<MileageAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCalendarLoading, setIsCalendarLoading] = useState(false);
  const [isAlertsLoading, setIsAlertsLoading] = useState(true);

  const statusConfig: Record<string, { bg: string; text: string; label: string; dot: string }> = {
    scheduled: { bg: '#E8EFED', text: '#6A8A82', label: 'Planifiée', dot: '#6A8A82' },
    in_progress: { bg: '#F5E8DD', text: '#B87333', label: 'En cours', dot: '#B87333' },
    completed: { bg: '#DBEAFE', text: '#1E40AF', label: 'Terminée', dot: '#1E40AF' },
    cancelled: { bg: '#FEE2E2', text: '#DC2626', label: 'Annulée', dot: '#DC2626' },
  };

  const typeConfig: Record<string, { bg: string; text: string; label: string }> = {
    oil_change: { bg: '#E8EFED', text: '#6A8A82', label: 'Vidange' },
    tire_change: { bg: '#F5E8DD', text: '#B87333', label: 'Changement pneus' },
    brake_service: { bg: '#FEE2E2', text: '#DC2626', label: 'Freins' },
    inspection: { bg: '#F3E8FF', text: '#7C3AED', label: 'Contrôle technique' },
    repair: { bg: '#FFEDD5', text: '#EA580C', label: 'Réparation' },
    preventive: { bg: '#D1FAE5', text: '#059669', label: 'Préventive' },
    other: { bg: '#E8ECEC', text: '#6B7280', label: 'Autre' },
  };

  // Fetch maintenance records
  const fetchMaintenanceRecords = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await maintenanceApi.getAll({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        maintenance_type: typeFilter !== 'all' ? typeFilter : undefined,
        search: searchQuery || undefined,
      });
      setMaintenanceRecords(response.results);
      setStats(response.stats);
    } catch (error) {
      console.error('Error fetching maintenance:', error);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, typeFilter, searchQuery]);

  // Fetch mileage alerts
  const fetchMileageAlerts = useCallback(async () => {
    setIsAlertsLoading(true);
    try {
      const response = await maintenanceApi.getMileageAlerts();
      setMileageAlerts(response.alerts);
    } catch (error) {
      console.error('Error fetching mileage alerts:', error);
    } finally {
      setIsAlertsLoading(false);
    }
  }, []);

  // Fetch calendar events
  const fetchCalendarEvents = useCallback(async (startDate: string, endDate: string) => {
    setIsCalendarLoading(true);
    try {
      const response = await maintenanceApi.getCalendar(startDate, endDate);
      setCalendarEvents(response.events);
    } catch (error) {
      console.error('Error fetching calendar:', error);
    } finally {
      setIsCalendarLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMaintenanceRecords();
    fetchMileageAlerts();
  }, [fetchMaintenanceRecords, fetchMileageAlerts]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Stats for display
  const displayStats = [
    { label: 'Total', value: stats?.total || 0, color: '#6A8A82', icon: Wrench },
    { label: 'Planifiées', value: stats?.by_status.scheduled || 0, color: '#6A8A82', icon: Calendar },
    { label: 'En Cours', value: stats?.by_status.in_progress || 0, color: '#B87333', icon: Clock },
    { label: 'Ce mois', value: `${(stats?.this_month_cost || 0).toFixed(0)} ${currencySymbol}`, color: '#1E40AF', icon: Coins },
  ];

  // Pagination
  const totalPages = Math.ceil(maintenanceRecords.length / ITEMS_PER_PAGE);
  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return maintenanceRecords.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [maintenanceRecords, currentPage]);

  const handleFilterChange = (filter: StatusFilter) => {
    setStatusFilter(filter);
    setCurrentPage(1);
    setIsFilterOpen(false);
  };

  const handleTypeFilterChange = (filter: TypeFilter) => {
    setTypeFilter(filter);
    setCurrentPage(1);
    setIsTypeFilterOpen(false);
  };

  const handleAddMaintenance = async (data: any) => {
    try {
      await maintenanceApi.create(data);
      setIsAddModalOpen(false);
      setPreselectedVehicle(null);
      fetchMaintenanceRecords();
      fetchMileageAlerts();
    } catch (error) {
      console.error('Error creating maintenance:', error);
    }
  };

  const handleViewDetails = (maintenance: Maintenance) => {
    setSelectedMaintenance(maintenance);
    setIsDetailsModalOpen(true);
    setOpenMenuId(null);
  };

  const handleEdit = (maintenance: Maintenance) => {
    setSelectedMaintenance(maintenance);
    setIsEditModalOpen(true);
    setOpenMenuId(null);
  };

  const handleDelete = (maintenance: Maintenance) => {
    setSelectedMaintenance(maintenance);
    setIsDeleteModalOpen(true);
    setOpenMenuId(null);
  };

  const handleStartMaintenance = async (maintenance: Maintenance) => {
    try {
      await maintenanceApi.start(maintenance.id);
      fetchMaintenanceRecords();
      setOpenMenuId(null);
    } catch (error) {
      console.error('Error starting maintenance:', error);
    }
  };

  const handleCompleteMaintenance = async (maintenance: Maintenance) => {
    try {
      await maintenanceApi.complete(maintenance.id);
      fetchMaintenanceRecords();
      fetchMileageAlerts();
      setOpenMenuId(null);
    } catch (error) {
      console.error('Error completing maintenance:', error);
    }
  };

  const handleEditMaintenance = async (data: any) => {
    if (!selectedMaintenance) return;
    try {
      await maintenanceApi.update(selectedMaintenance.id, data);
      setIsEditModalOpen(false);
      setSelectedMaintenance(null);
      fetchMaintenanceRecords();
    } catch (error) {
      console.error('Error updating maintenance:', error);
    }
  };

  const handleDeleteMaintenance = async () => {
    if (!selectedMaintenance) return;
    try {
      await maintenanceApi.delete(selectedMaintenance.id);
      setIsDeleteModalOpen(false);
      setSelectedMaintenance(null);
      fetchMaintenanceRecords();
    } catch (error) {
      console.error('Error deleting maintenance:', error);
    }
  };

  const handleScheduleFromAlert = (vehicleId: number) => {
    setPreselectedVehicle(vehicleId);
    setIsAddModalOpen(true);
  };

  const handleCalendarEventClick = (event: CalendarEvent) => {
    // Find the full maintenance record
    const maintenance = maintenanceRecords.find(m => m.id === event.id);
    if (maintenance) {
      handleViewDetails(maintenance);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold" style={{ color: '#1f2937' }}>
              Maintenance
            </h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">Gérez l'entretien de votre flotte</p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center space-x-2 text-white transition-all duration-300 hover:-translate-y-0.5 w-full sm:w-auto btn-primary"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Planifier maintenance</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {displayStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="stat-card">
                <div className="stat-accent" style={{ backgroundColor: stat.color }} />
                <div className="flex items-center gap-3">
                  <div className="stat-icon" style={{ backgroundColor: `${stat.color}12` }}>
                    <Icon className="w-4 h-4" style={{ color: stat.color }} />
                  </div>
                  <div>
                    <p className="stat-label">{stat.label}</p>
                    <p className="stat-value" style={{ color: stat.color }}>{stat.value}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mileage Alerts */}
        {(mileageAlerts.length > 0 || isAlertsLoading) && (
          <MileageAlerts
            alerts={mileageAlerts}
            isLoading={isAlertsLoading}
            onScheduleMaintenance={handleScheduleFromAlert}
          />
        )}

        {/* View Mode Toggle & Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
          {/* View Mode Toggle */}
          <div className="soft-toggle-group flex items-center rounded-xl overflow-hidden w-full sm:w-auto">
            <button
              onClick={() => setViewMode('list')}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-center space-x-1.5 sm:space-x-2 transition-all ${viewMode === 'list' ? 'shadow-sm' : 'hover:bg-gray-50'}`}
              style={{
                backgroundColor: viewMode === 'list' ? '#E8EFED' : 'transparent',
                color: viewMode === 'list' ? '#6A8A82' : '#6B7280'
              }}
            >
              <List className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="font-medium text-xs sm:text-sm">Liste</span>
            </button>
            <div className="w-px h-6 sm:h-8" style={{ backgroundColor: 'rgba(0,0,0,0.06)' }} />
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-center space-x-1.5 sm:space-x-2 transition-all ${viewMode === 'calendar' ? 'shadow-sm' : 'hover:bg-gray-50'}`}
              style={{
                backgroundColor: viewMode === 'calendar' ? '#E8EFED' : 'transparent',
                color: viewMode === 'calendar' ? '#6A8A82' : '#6B7280'
              }}
            >
              <CalendarDays className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="font-medium text-xs sm:text-sm hidden xs:inline">Calendrier</span>
              <span className="font-medium text-xs sm:text-sm xs:hidden">Cal.</span>
            </button>
            <div className="w-px h-6 sm:h-8" style={{ backgroundColor: 'rgba(0,0,0,0.06)' }} />
            <button
              onClick={() => setViewMode('history')}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-center space-x-1.5 sm:space-x-2 transition-all ${viewMode === 'history' ? 'shadow-sm' : 'hover:bg-gray-50'}`}
              style={{
                backgroundColor: viewMode === 'history' ? '#F5E8DD' : 'transparent',
                color: viewMode === 'history' ? '#B87333' : '#6B7280'
              }}
            >
              <History className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="font-medium text-xs sm:text-sm hidden xs:inline">Historique</span>
              <span className="font-medium text-xs sm:text-sm xs:hidden">Hist.</span>
            </button>
          </div>

          {/* Search Bar - Only show in list view */}
          {viewMode === 'list' && (
            <>
              <div className="relative flex-1 w-full sm:w-auto">
                <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="soft-input w-full pl-9 sm:pl-12 pr-4 py-2 sm:py-3 rounded-xl text-xs sm:text-sm text-gray-900 placeholder-gray-400"
                />
              </div>

              {/* Filters Row */}
              <div className="flex items-center gap-2 sm:gap-4">
                {/* Status Filter */}
                <div className="relative flex-1 sm:flex-none">
                  <button
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className={`flex items-center justify-center space-x-1 sm:space-x-2 px-3 sm:px-5 py-2 sm:py-3 rounded-xl border font-semibold transition-all hover:shadow-sm w-full sm:w-auto text-xs sm:text-sm ${
                      statusFilter !== 'all' ? 'shadow-sm' : ''
                    }`}
                    style={{
                      borderColor: statusFilter !== 'all' ? '#6A8A82' : 'rgba(0,0,0,0.08)',
                      backgroundColor: statusFilter !== 'all' ? '#E8EFED' : '#ffffff',
                      color: statusFilter !== 'all' ? '#6A8A82' : '#6B7280'
                    }}
                  >
                    <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>Statut</span>
                  </button>

                {isFilterOpen && (
                  <div className="absolute right-0 mt-2 w-56 soft-dropdown z-10">
                    <div className="p-3">
                      {[
                        { value: 'all' as const, label: 'Toutes', count: stats?.total || 0 },
                        { value: 'scheduled' as const, label: 'Planifiées', count: stats?.by_status.scheduled || 0 },
                        { value: 'in_progress' as const, label: 'En cours', count: stats?.by_status.in_progress || 0 },
                        { value: 'completed' as const, label: 'Terminées', count: stats?.by_status.completed || 0 },
                        { value: 'cancelled' as const, label: 'Annulées', count: stats?.by_status.cancelled || 0 },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleFilterChange(option.value)}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all mb-1 ${
                            statusFilter === option.value ? 'shadow-sm' : 'hover:bg-gray-50'
                          }`}
                          style={{
                            backgroundColor: statusFilter === option.value ? '#E8EFED' : 'transparent',
                            color: statusFilter === option.value ? '#6A8A82' : '#1f2937'
                          }}
                        >
                          <span>{option.label}</span>
                          <span
                            className="text-xs font-semibold px-2 py-1 rounded-full"
                            style={{
                              backgroundColor: statusFilter === option.value ? '#6A8A82' : '#E8ECEC',
                              color: statusFilter === option.value ? '#ffffff' : '#6B7280'
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

                {/* Type Filter */}
                <div className="relative flex-1 sm:flex-none">
                  <button
                    onClick={() => setIsTypeFilterOpen(!isTypeFilterOpen)}
                    className={`flex items-center justify-center space-x-1 sm:space-x-2 px-3 sm:px-5 py-2 sm:py-3 rounded-xl border font-semibold transition-all hover:shadow-sm w-full sm:w-auto text-xs sm:text-sm ${
                      typeFilter !== 'all' ? 'shadow-sm' : ''
                    }`}
                    style={{
                      borderColor: typeFilter !== 'all' ? '#B87333' : 'rgba(0,0,0,0.08)',
                      backgroundColor: typeFilter !== 'all' ? '#F5E8DD' : '#ffffff',
                      color: typeFilter !== 'all' ? '#B87333' : '#6B7280'
                    }}
                  >
                    <Wrench className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>Type</span>
                  </button>

                {isTypeFilterOpen && (
                  <div className="absolute right-0 mt-2 w-64 soft-dropdown z-10">
                    <div className="p-3">
                      {[
                        { value: 'all' as const, label: 'Tous les types', count: stats?.total || 0 },
                        { value: 'preventive' as const, label: 'Préventive', count: stats?.by_type.preventive || 0 },
                        { value: 'oil_change' as const, label: 'Vidange', count: stats?.by_type.oil_change || 0 },
                        { value: 'tire_change' as const, label: 'Changement pneus', count: stats?.by_type.tire_change || 0 },
                        { value: 'brake_service' as const, label: 'Freins', count: stats?.by_type.brake_service || 0 },
                        { value: 'inspection' as const, label: 'Contrôle technique', count: stats?.by_type.inspection || 0 },
                        { value: 'repair' as const, label: 'Réparation', count: stats?.by_type.repair || 0 },
                        { value: 'other' as const, label: 'Autre', count: stats?.by_type.other || 0 },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleTypeFilterChange(option.value)}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all mb-1 ${
                            typeFilter === option.value ? 'shadow-sm' : 'hover:bg-gray-50'
                          }`}
                          style={{
                            backgroundColor: typeFilter === option.value ? '#F5E8DD' : 'transparent',
                            color: typeFilter === option.value ? '#B87333' : '#1f2937'
                          }}
                        >
                          <span>{option.label}</span>
                          <span
                            className="text-xs font-semibold px-2 py-1 rounded-full"
                            style={{
                              backgroundColor: typeFilter === option.value ? '#B87333' : '#E8ECEC',
                              color: typeFilter === option.value ? '#ffffff' : '#6B7280'
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
              </div>
            </>
          )}
        </div>

        {/* Loading State */}
        {isLoading && viewMode === 'list' && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#6A8A82' }} />
          </div>
        )}

        {/* Calendar View */}
        {viewMode === 'calendar' && (
          <MaintenanceCalendar
            events={calendarEvents}
            isLoading={isCalendarLoading}
            onMonthChange={fetchCalendarEvents}
            onEventClick={handleCalendarEventClick}
          />
        )}

        {/* History View */}
        {viewMode === 'history' && (
          <MaintenanceHistory />
        )}

        {/* List View */}
        {viewMode === 'list' && !isLoading && (
          <>
            {maintenanceRecords.length === 0 ? (
              <div className="data-table-container p-12 text-center">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: '#E8EFED' }}
                >
                  <Wrench className="w-8 h-8" style={{ color: '#6A8A82' }} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune maintenance</h3>
                <p className="text-gray-500 mb-6">
                  {searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
                    ? 'Aucune maintenance ne correspond à vos critères'
                    : 'Commencez par planifier une maintenance pour vos véhicules'}
                </p>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="text-white transition-all btn-primary"
                >
                  Planifier une maintenance
                </button>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {paginatedRecords.map((record) => {
                  const status = statusConfig[record.status];
                  const type = typeConfig[record.maintenance_type] || typeConfig.other;

                  return (
                    <div
                      key={record.id}
                      className="data-card hover:shadow-lg !p-0"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center p-3 sm:p-5 gap-3 sm:gap-5">
                        {/* Mobile Header Row */}
                        <div className="flex items-center gap-3 sm:contents">
                          {/* Icon */}
                          <div className="relative flex-shrink-0">
                            <div
                              className="w-10 h-10 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl flex items-center justify-center shadow-sm"
                              style={{ backgroundColor: status.bg }}
                            >
                              <Wrench className="w-5 h-5 sm:w-7 sm:h-7" style={{ color: status.dot }} />
                            </div>
                          </div>

                          {/* Title on mobile */}
                          <div className="flex-1 sm:hidden min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <h3 className="text-sm font-semibold truncate" style={{ color: '#1f2937' }}>
                                {record.maintenance_type_display}
                              </h3>
                            </div>
                            <p className="text-xs text-gray-500">{record.vehicle_plate}</p>
                          </div>

                          {/* Status Badge on mobile */}
                          <div
                            className="sm:hidden px-2 py-1 rounded-lg text-[10px] font-semibold flex items-center gap-1.5 shadow-sm flex-shrink-0"
                            style={{ backgroundColor: status.bg, color: status.text }}
                          >
                            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: status.dot }} />
                            <span>{status.label}</span>
                          </div>
                        </div>

                        {/* Info - Desktop */}
                        <div className="hidden sm:block flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-lg font-semibold" style={{ color: '#1f2937' }}>
                              {record.maintenance_type_display}
                            </h3>
                            <span
                              className="px-2 py-1 rounded-lg text-xs font-semibold"
                              style={{ backgroundColor: type.bg, color: type.text }}
                            >
                              {type.label}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-1">{record.description}</p>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1.5">
                              <Car className="w-4 h-4" style={{ color: '#6A8A82' }} />
                              <span className="font-medium" style={{ color: '#1f2937' }}>{record.vehicle_plate}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-4 h-4" style={{ color: '#B87333' }} />
                              <span className="text-gray-600">
                                {new Date(record.scheduled_date).toLocaleDateString('fr-FR', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Coins className="w-4 h-4" style={{ color: '#6A8A82' }} />
                              <span className="font-medium" style={{ color: '#1f2937' }}>
                                {Number(record.total_cost).toFixed(2)} {currencySymbol}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Gauge className="w-4 h-4" style={{ color: '#6B7280' }} />
                              <span className="text-gray-600">
                                {Number(record.mileage_at_service).toLocaleString()} km
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Mobile info grid */}
                        <div className="sm:hidden grid grid-cols-2 gap-2 text-[10px]">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" style={{ color: '#B87333' }} />
                            <span className="text-gray-600">
                              {new Date(record.scheduled_date).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: 'short'
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Coins className="w-3 h-3" style={{ color: '#6A8A82' }} />
                            <span className="font-medium" style={{ color: '#1f2937' }}>
                              {Number(record.total_cost).toFixed(0)} {currencySymbol}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Gauge className="w-3 h-3" style={{ color: '#6B7280' }} />
                            <span className="text-gray-600">
                              {Number(record.mileage_at_service).toLocaleString()} km
                            </span>
                          </div>
                          <span
                            className="px-1.5 py-0.5 rounded text-[10px] font-semibold text-center"
                            style={{ backgroundColor: type.bg, color: type.text }}
                          >
                            {type.label}
                          </span>
                        </div>

                        {/* Status Badge - Desktop */}
                        <div
                          className="hidden sm:flex px-4 py-2 rounded-lg text-sm font-semibold items-center gap-2 shadow-sm flex-shrink-0"
                          style={{ backgroundColor: status.bg, color: status.text }}
                        >
                          <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: status.dot }} />
                          <span>{status.label}</span>
                        </div>

                        {/* Action Button */}
                        <div className="relative flex-shrink-0 self-end sm:self-center">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === record.id ? null : record.id)}
                            className="p-2 sm:p-3 rounded-lg font-semibold transition-all hover:shadow-sm flex items-center justify-center"
                            style={{ backgroundColor: '#E8EFED', color: '#6A8A82' }}
                          >
                            <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>

                          {/* Actions Menu */}
                          {openMenuId === record.id && (
                            <div className="absolute right-0 top-full mt-2 w-52 soft-dropdown overflow-hidden z-10">
                              <button
                                onClick={() => handleViewDetails(record)}
                                className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-all text-left"
                              >
                                <Eye className="w-4 h-4" style={{ color: '#6A8A82' }} />
                                <span className="text-sm font-medium" style={{ color: '#1f2937' }}>Voir détails</span>
                              </button>

                              {record.status === 'scheduled' && (
                                <button
                                  onClick={() => handleStartMaintenance(record)}
                                  className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-all text-left border-t-2"
                                  style={{ borderColor: '#E8ECEC' }}
                                >
                                  <Play className="w-4 h-4" style={{ color: '#059669' }} />
                                  <span className="text-sm font-medium" style={{ color: '#059669' }}>Démarrer</span>
                                </button>
                              )}

                              {record.status === 'in_progress' && (
                                <button
                                  onClick={() => handleCompleteMaintenance(record)}
                                  className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-all text-left border-t-2"
                                  style={{ borderColor: '#E8ECEC' }}
                                >
                                  <CheckCircle className="w-4 h-4" style={{ color: '#1E40AF' }} />
                                  <span className="text-sm font-medium" style={{ color: '#1E40AF' }}>Terminer</span>
                                </button>
                              )}

                              <button
                                onClick={() => handleEdit(record)}
                                className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-all text-left border-t-2"
                                style={{ borderColor: '#E8ECEC' }}
                              >
                                <Edit className="w-4 h-4" style={{ color: '#B87333' }} />
                                <span className="text-sm font-medium" style={{ color: '#1f2937' }}>Modifier</span>
                              </button>

                              <button
                                onClick={() => handleDelete(record)}
                                className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-red-50 transition-all text-left border-t-2"
                                style={{ borderColor: '#E8ECEC' }}
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                                <span className="text-sm font-medium text-red-600">Supprimer</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={maintenanceRecords.length}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={setCurrentPage}
              />
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <AddMaintenanceModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setPreselectedVehicle(null);
        }}
        onSubmit={handleAddMaintenance}
        preselectedVehicleId={preselectedVehicle}
      />

      <MaintenanceDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedMaintenance(null);
        }}
        maintenance={selectedMaintenance}
        statusConfig={statusConfig}
        typeConfig={typeConfig}
      />

      <EditMaintenanceModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedMaintenance(null);
        }}
        onSubmit={handleEditMaintenance}
        maintenance={selectedMaintenance}
      />

      <DeleteMaintenanceModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedMaintenance(null);
        }}
        onConfirm={handleDeleteMaintenance}
        maintenance={selectedMaintenance}
      />
    </Layout>
  );
}
