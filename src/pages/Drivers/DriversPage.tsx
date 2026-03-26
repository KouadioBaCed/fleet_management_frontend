import Layout from '@/components/Layout/Layout';
import { Plus, Search, Star, Phone, Mail, Users, Filter, LayoutGrid, List, MoreVertical, Loader2, AlertTriangle, RefreshCw, PieChart, ChevronRight } from 'lucide-react';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import AddDriverModal from '@/components/Drivers/AddDriverModal';
import DriverDetailsModal from '@/components/Drivers/DriverDetailsModal';
import EditDriverModal from '@/components/Drivers/EditDriverModal';
import DeleteDriverModal from '@/components/Drivers/DeleteDriverModal';
import ChangeDriverStatusModal from '@/components/Drivers/ChangeDriverStatusModal';
import DriverAnalytics from '@/components/Drivers/DriverAnalytics';
import Pagination from '@/components/common/Pagination';
import DropdownMenu from '@/components/common/DropdownMenu';
import { driversApi, type DriverStats } from '@/api/drivers';
import type { Driver } from '@/types';

type ViewMode = 'grid' | 'list';
type PageMode = 'list' | 'analytics';
type StatusFilter = 'all' | 'available' | 'on_mission' | 'unavailable';

const ITEMS_PER_PAGE = 9;

export default function DriversPage() {
  const location = useLocation();
  const [pageMode, setPageMode] = useState<PageMode>('list');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  // API state
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [stats, setStats] = useState<DriverStats>({
    total: 0,
    available: 0,
    on_mission: 0,
    on_break: 0,
    off_duty: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch drivers from API
  const fetchDrivers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await driversApi.getAll({
        status: statusFilter === 'unavailable' ? 'on_break,off_duty' : statusFilter !== 'all' ? statusFilter : undefined,
        search: debouncedSearch || undefined,
        ordering: '-created_at',
      });
      setDrivers(response.results);
      setStats(response.stats);
    } catch (err: any) {
      console.error('Failed to fetch drivers:', err);
      setError(err.response?.data?.detail || 'Erreur lors du chargement des chauffeurs');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, debouncedSearch]);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  // Handle navigation state to open driver details modal
  useEffect(() => {
    const state = location.state as { openDriverId?: number } | null;
    if (state?.openDriverId && drivers.length > 0) {
      const driver = drivers.find(d => d.id === state.openDriverId);
      if (driver) {
        setSelectedDriver(driver);
        setIsDetailsModalOpen(true);
        // Clear the state to prevent reopening on subsequent renders
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state, drivers]);

  const statusConfig: any = {
    available: { bg: '#E8EFED', text: '#6A8A82', label: 'Disponible', dot: '#6A8A82' },
    on_mission: { bg: '#F5E8DD', text: '#B87333', label: 'En mission', dot: '#B87333' },
    on_break: { bg: '#FEE2E2', text: '#DC2626', label: 'Indisponible', dot: '#DC2626' },
    off_duty: { bg: '#FEE2E2', text: '#DC2626', label: 'Indisponible', dot: '#DC2626' },
    unavailable: { bg: '#FEE2E2', text: '#DC2626', label: 'Indisponible', dot: '#DC2626' },
  };

  const statsDisplay = [
    { label: 'Total Chauffeurs', value: stats.total.toString(), color: '#6A8A82' },
    { label: 'Disponibles', value: stats.available.toString(), color: '#6A8A82' },
    { label: 'En Mission', value: stats.on_mission.toString(), color: '#B87333' },
    { label: 'Indisponibles', value: (stats.on_break + stats.off_duty).toString(), color: '#DC2626' },
  ];

  // Pagination calculations (client-side pagination of API results)
  const totalPages = Math.ceil(drivers.length / ITEMS_PER_PAGE);
  const paginatedDrivers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return drivers.slice(startIndex, endIndex);
  }, [drivers, currentPage]);

  // Reset to page 1 when filter changes
  const handleFilterChange = (filter: StatusFilter) => {
    setStatusFilter(filter);
    setCurrentPage(1);
    setIsFilterOpen(false);
  };

  const handleAddDriver = async (data: any) => {
    try {
      await driversApi.create(data);
      setIsAddModalOpen(false);
      fetchDrivers();
    } catch (err: any) {
      console.error('Failed to create driver:', err);
      throw err;
    }
  };

  const handleViewDetails = (driver: Driver) => {
    setSelectedDriver(driver);
    setIsDetailsModalOpen(true);
    setOpenMenuId(null);
  };

  const handleEditDriver = (driver: Driver) => {
    setSelectedDriver(driver);
    setIsEditModalOpen(true);
    setOpenMenuId(null);
  };

  const handleDeleteClick = (driver: Driver) => {
    setSelectedDriver(driver);
    setIsDeleteModalOpen(true);
    setOpenMenuId(null);
  };

  const handleConfirmDelete = async () => {
    if (!selectedDriver) return;
    await driversApi.delete(selectedDriver.id);
    setIsDeleteModalOpen(false);
    setSelectedDriver(null);
    fetchDrivers();
  };

  const handleUpdateDriver = async (data: any) => {
    if (!selectedDriver) return;
    try {
      await driversApi.update(selectedDriver.id, data);
      setIsEditModalOpen(false);
      setSelectedDriver(null);
      fetchDrivers();
    } catch (err: any) {
      console.error('Failed to update driver:', err);
      throw err;
    }
  };

  const handleStatusClick = (driver: Driver) => {
    setSelectedDriver(driver);
    setIsStatusModalOpen(true);
    setOpenMenuId(null);
  };

  const handleStatusChange = async (status: string) => {
    if (!selectedDriver) return;
    try {
      await driversApi.changeStatus(selectedDriver.id, status);
      setIsStatusModalOpen(false);
      setSelectedDriver(null);
      fetchDrivers();
    } catch (err: any) {
      console.error('Failed to change status:', err);
      throw err;
    }
  };

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: '#1f2937' }}>
              Conducteur
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Gérez votre équipe de conducteur</p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center space-x-1.5 sm:space-x-2 text-white transition-all duration-300 hover:-translate-y-0.5 btn-primary"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden xs:inline">Nouveau</span>
            <span className="xs:hidden">+</span>
            <span className="hidden sm:inline">chauffeur</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {statsDisplay.map((stat, index) => (
            <div key={index} className="stat-card">
              <div className="stat-accent" style={{ backgroundColor: stat.color }} />
              <div>
                <p className="stat-label">{stat.label}</p>
                <p className="stat-value" style={{ color: stat.color }}>
                  {isLoading ? '-' : stat.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Page Mode Toggle */}
        <div className="flex items-center justify-center">
          <div className="flex items-center bg-white rounded-lg sm:rounded-xl border p-1" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
            <button
              onClick={() => setPageMode('list')}
              className={`flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-6 py-2 sm:py-2.5 rounded-lg font-semibold transition-all text-xs sm:text-base ${
                pageMode === 'list' ? 'shadow-sm' : 'hover:bg-gray-50'
              }`}
              style={{
                backgroundColor: pageMode === 'list' ? '#6A8A82' : 'transparent',
                color: pageMode === 'list' ? '#ffffff' : '#6B7280'
              }}
            >
              <List className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Liste des chauffeurs</span>
              <span className="sm:hidden">Liste</span>
            </button>
            <button
              onClick={() => setPageMode('analytics')}
              className={`flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-6 py-2 sm:py-2.5 rounded-lg font-semibold transition-all text-xs sm:text-base ${
                pageMode === 'analytics' ? 'shadow-sm' : 'hover:bg-gray-50'
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
          <DriverAnalytics />
        )}

        {/* List View Content */}
        {pageMode === 'list' && (
          <>
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="soft-input pl-9 sm:pl-12 pr-4"
            />
          </div>

          <div className="flex gap-2">
            {/* Filter Dropdown */}
            <div className="relative flex-1 sm:flex-none">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`flex items-center justify-center space-x-1.5 sm:space-x-2 px-3 sm:px-5 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border font-semibold transition-all hover:shadow-sm text-sm sm:text-base w-full sm:w-auto ${
                  statusFilter !== 'all' ? 'shadow-sm' : ''
                }`}
                style={{
                  borderColor: statusFilter !== 'all' ? '#6A8A82' : 'rgba(0,0,0,0.08)',
                  backgroundColor: statusFilter !== 'all' ? '#E8EFED' : '#ffffff',
                  color: statusFilter !== 'all' ? '#6A8A82' : '#6B7280'
                }}
              >
                <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Filtrer</span>
                {statusFilter !== 'all' && (
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#B87333' }} />
                )}
              </button>

              {/* Filter Dropdown Menu */}
              {isFilterOpen && (
                <div className="soft-dropdown absolute right-0 top-full mt-2 w-56 sm:w-64 z-20">
                  <div className="p-2 sm:p-3">
                    <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wide text-gray-500 mb-2 sm:mb-3 px-2">Statut</p>
                    {[
                      { value: 'all', label: 'Tous', count: stats.total },
                      { value: 'available', label: 'Disponibles', count: stats.available },
                      { value: 'on_mission', label: 'En mission', count: stats.on_mission },
                      { value: 'unavailable', label: 'Indisponibles', count: stats.on_break + stats.off_duty },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleFilterChange(option.value as StatusFilter)}
                        className={`w-full flex items-center justify-between px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all mb-1 ${
                          statusFilter === option.value ? 'shadow-sm' : 'hover:bg-gray-50'
                        }`}
                        style={{
                          backgroundColor: statusFilter === option.value ? '#E8EFED' : 'transparent',
                          color: statusFilter === option.value ? '#6A8A82' : '#1f2937'
                        }}
                      >
                        <span>{option.label}</span>
                        <span
                          className="text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full"
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

            {/* View Mode Toggle */}
            <div className="soft-toggle-group flex items-center rounded-lg sm:rounded-xl overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2.5 sm:p-3 transition-all ${viewMode === 'grid' ? 'shadow-sm' : 'hover:bg-gray-50'}`}
                style={{
                  backgroundColor: viewMode === 'grid' ? '#E8EFED' : 'transparent',
                  color: viewMode === 'grid' ? '#6A8A82' : '#6B7280'
                }}
                title="Vue grille"
              >
                <LayoutGrid className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <div className="w-px h-7 sm:h-8" style={{ backgroundColor: 'rgba(0,0,0,0.06)' }} />
              <button
                onClick={() => setViewMode('list')}
                className={`p-2.5 sm:p-3 transition-all ${viewMode === 'list' ? 'shadow-sm' : 'hover:bg-gray-50'}`}
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
          <div className="flex items-center justify-center py-10 sm:py-20">
            <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white shadow-sm border border-gray-200">
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#6A8A82' }} />
              <span className="text-sm font-medium text-gray-600">Chargement...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="flex items-center justify-center py-10 sm:py-20 px-4">
            <div className="bg-red-50 border-2 border-red-200 rounded-xl sm:rounded-2xl p-4 sm:p-8 max-w-md text-center w-full">
              <AlertTriangle className="w-8 h-8 sm:w-12 sm:h-12 text-red-500 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-red-800 mb-2">Erreur de chargement</h3>
              <p className="text-sm text-red-600 mb-4">{error}</p>
              <button
                onClick={fetchDrivers}
                className="flex items-center space-x-2 text-white mx-auto btn-primary"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Réessayer</span>
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && drivers.length === 0 && (
          <div className="flex items-center justify-center py-10 sm:py-20 px-4">
            <div className="text-center">
              <Users className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-2">Aucun chauffeur trouvé</h3>
              <p className="text-sm text-gray-500 mb-4">
                {searchQuery || statusFilter !== 'all'
                  ? 'Essayez de modifier vos critères de recherche'
                  : 'Commencez par ajouter un nouveau chauffeur'}
              </p>
              {(searchQuery || statusFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                  }}
                  className="text-sm font-medium hover:underline"
                  style={{ color: '#6A8A82' }}
                >
                  Réinitialiser les filtres
                </button>
              )}
            </div>
          </div>
        )}

        {/* Drivers Display - Grid or List View */}
        {!isLoading && !error && drivers.length > 0 && viewMode === 'grid' && (
          /* Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {paginatedDrivers.map((driver) => {
              const status = statusConfig[driver.status] || statusConfig.available;
              const initials = driver.full_name?.split(' ').map(n => n[0]).join('') || '?';
              return (
                <div
                  key={driver.id}
                  className="data-card overflow-hidden hover:shadow-md hover:-translate-y-1 !p-0"
                >
                  {/* Driver Header with Avatar */}
                  <div className="relative">
                    <div className="h-20 sm:h-32 relative overflow-hidden" style={{ backgroundColor: status.bg }}>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Users className="w-12 h-12 sm:w-20 sm:h-20 opacity-20" style={{ color: status.dot }} />
                      </div>
                      <button
                        onClick={() => handleStatusClick(driver)}
                        className="absolute top-2 right-2 sm:top-3 sm:right-3 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold flex items-center space-x-1.5 sm:space-x-2 shadow-sm hover:shadow-md transition-all cursor-pointer"
                        style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', color: status.text }}
                        title="Cliquez pour changer le statut"
                      >
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full animate-pulse" style={{ backgroundColor: status.dot }} />
                        <span>{status.label}</span>
                      </button>
                    </div>

                    {/* Avatar Circle - overlapping the header */}
                    <div className="flex justify-center -mt-10 sm:-mt-16 mb-2 sm:mb-4">
                      <div className="relative">
                        {driver.photo ? (
                          <img
                            src={driver.photo}
                            alt={driver.full_name}
                            className="w-20 h-20 sm:w-32 sm:h-32 rounded-full object-cover shadow-lg ring-2 sm:ring-4 ring-white"
                          />
                        ) : (
                          <div
                            className="w-20 h-20 sm:w-32 sm:h-32 rounded-full flex items-center justify-center text-white text-2xl sm:text-4xl font-bold shadow-lg ring-2 sm:ring-4 ring-white"
                            style={{
                              backgroundColor: status.dot,
                              backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0.1) 100%)'
                            }}
                          >
                            {initials}
                          </div>
                        )}
                        {/* Online indicator */}
                        {driver.status === 'available' && (
                          <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 w-4 h-4 sm:w-6 sm:h-6 bg-green-500 rounded-full border-2 sm:border-4 border-white shadow-md" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Driver Info */}
                  <div className="px-3 sm:px-6 pb-3 sm:pb-6">
                    <h3 className="text-base sm:text-xl font-semibold truncate" style={{ color: '#1f2937' }}>{driver.full_name}</h3>
                    <p className="text-xs sm:text-sm font-medium mb-2 sm:mb-4" style={{ color: '#6A8A82' }}>{driver.employee_id}</p>

                    <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-5">
                      <div className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 rounded-lg" style={{ backgroundColor: 'rgba(106,138,130,0.04)' }}>
                        <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" style={{ color: '#6A8A82' }} />
                        <span className="text-xs sm:text-sm text-gray-700 truncate">{driver.phone_number || '-'}</span>
                      </div>
                      <div className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 rounded-lg" style={{ backgroundColor: 'rgba(106,138,130,0.04)' }}>
                        <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" style={{ color: '#B87333' }} />
                        <span className="text-xs sm:text-sm text-gray-700 truncate">{driver.email || '-'}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-2.5 sm:p-4 rounded-lg sm:rounded-xl mb-3 sm:mb-5" style={{ backgroundColor: '#E8EFED' }}>
                      <div>
                        <p className="text-[10px] sm:text-xs font-medium text-gray-600 uppercase tracking-wide">Missions</p>
                        <p className="text-lg sm:text-2xl font-bold mt-0.5 sm:mt-1" style={{ color: '#6A8A82' }}>{driver.total_trips}</p>
                      </div>
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <Star className="w-4 h-4 sm:w-6 sm:h-6" style={{ color: '#B87333', fill: '#B87333' }} />
                        <span className="text-lg sm:text-2xl font-bold" style={{ color: '#1f2937' }}>{Number(driver.rating).toFixed(1)}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleViewDetails(driver)}
                      className="w-full flex items-center justify-center gap-2 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all hover:shadow-sm mb-3 sm:mb-5"
                      style={{ backgroundColor: '#F5E8DD', color: '#B87333' }}
                    >
                      Voir plus
                      <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>

                    <div className="flex justify-end">
                    <DropdownMenu
                      isOpen={openMenuId === driver.id}
                      onToggle={() => setOpenMenuId(openMenuId === driver.id ? null : driver.id)}
                      button={
                        <button className="p-2 rounded-lg transition-all hover:bg-gray-100">
                          <MoreVertical className="w-5 h-5 text-gray-500" />
                        </button>
                      }
                    >
                      <button
                        onClick={() => handleViewDetails(driver)}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium hover:bg-gray-50 transition-all"
                        style={{ color: '#1f2937' }}
                      >
                        Détails
                      </button>
                      <button
                        onClick={() => handleStatusClick(driver)}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium hover:bg-gray-50 transition-all"
                        style={{ color: '#B87333' }}
                      >
                        Changer statut
                      </button>
                      <button
                        onClick={() => handleEditDriver(driver)}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium hover:bg-gray-50 transition-all"
                        style={{ color: '#6A8A82' }}
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => handleDeleteClick(driver)}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium hover:bg-red-50 transition-all text-red-600"
                      >
                        Supprimer
                      </button>
                    </DropdownMenu>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* List View */}
        {!isLoading && !error && drivers.length > 0 && viewMode === 'list' && (
          <>
            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {paginatedDrivers.map((driver) => {
                const status = statusConfig[driver.status] || statusConfig.available;
                const initials = driver.full_name?.split(' ').map(n => n[0]).join('') || '?';
                return (
                  <div
                    key={driver.id}
                    className="data-card"
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        {driver.photo ? (
                          <img
                            src={driver.photo}
                            alt={driver.full_name}
                            className="w-12 h-12 rounded-full object-cover shadow-sm"
                          />
                        ) : (
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm"
                            style={{
                              backgroundColor: status.dot,
                              backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0.1) 100%)'
                            }}
                          >
                            {initials}
                          </div>
                        )}
                        {driver.status === 'available' && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                        )}
                      </div>

                      {/* Driver Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold truncate" style={{ color: '#1f2937' }}>{driver.full_name}</h3>
                          <span className="text-[10px] font-medium flex-shrink-0" style={{ color: '#6A8A82' }}>{driver.employee_id}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <button
                            onClick={() => handleStatusClick(driver)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                            style={{ backgroundColor: status.bg, color: status.text }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: status.dot }} />
                            {status.label}
                          </button>
                          <span className="text-[10px] text-gray-500 flex items-center gap-1">
                            <Star className="w-3 h-3" style={{ color: '#B87333', fill: '#B87333' }} />
                            {Number(driver.rating).toFixed(1)}
                          </span>
                          <span className="text-[10px] text-gray-500">{driver.total_trips} missions</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => handleViewDetails(driver)}
                          className="p-1.5 rounded-lg text-xs"
                          style={{ backgroundColor: '#E8EFED', color: '#6A8A82' }}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop List View */}
            <div className="hidden md:block space-y-3">
              {paginatedDrivers.map((driver) => {
                const status = statusConfig[driver.status] || statusConfig.available;
                const initials = driver.full_name?.split(' ').map(n => n[0]).join('') || '?';
                return (
                  <div
                    key={driver.id}
                    className="data-card hover:shadow-md !p-0"
                  >
                    <div className="flex items-center p-4 lg:p-5 gap-4 lg:gap-5">
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        {driver.photo ? (
                          <img
                            src={driver.photo}
                            alt={driver.full_name}
                            className="w-12 h-12 lg:w-16 lg:h-16 rounded-full object-cover shadow-md"
                          />
                        ) : (
                          <div
                            className="w-12 h-12 lg:w-16 lg:h-16 rounded-full flex items-center justify-center text-white text-sm lg:text-lg font-bold shadow-md"
                            style={{
                              backgroundColor: status.dot,
                              backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0.1) 100%)'
                            }}
                          >
                            {initials}
                          </div>
                        )}
                        {driver.status === 'available' && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 lg:w-4 lg:h-4 bg-green-500 rounded-full border-2 border-white" />
                        )}
                      </div>

                      {/* Driver Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 lg:gap-3 mb-1">
                          <h3 className="text-sm lg:text-lg font-semibold truncate" style={{ color: '#1f2937' }}>{driver.full_name}</h3>
                          <span className="text-xs lg:text-sm font-medium" style={{ color: '#6A8A82' }}>{driver.employee_id}</span>
                        </div>
                        <div className="flex items-center gap-3 lg:gap-4 text-xs lg:text-sm text-gray-600">
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 lg:w-4 lg:h-4" style={{ color: '#6A8A82' }} />
                            <span className="truncate">{driver.phone_number || '-'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 hidden lg:flex">
                            <Mail className="w-4 h-4" style={{ color: '#B87333' }} />
                            <span className="truncate">{driver.email || '-'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Status Badge - Clickable */}
                      <button
                        onClick={() => handleStatusClick(driver)}
                        className="px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg text-xs lg:text-sm font-semibold flex items-center gap-1.5 lg:gap-2 shadow-sm hover:shadow-sm transition-all cursor-pointer"
                        style={{ backgroundColor: status.bg, color: status.text }}
                        title="Cliquez pour changer le statut"
                      >
                        <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: status.dot }} />
                        <span>{status.label}</span>
                      </button>

                      {/* Stats */}
                      <div className="hidden lg:flex items-center gap-6 px-5">
                        <div className="text-center">
                          <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Missions</p>
                          <p className="text-xl font-bold mt-0.5" style={{ color: '#6A8A82' }}>{driver.total_trips}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Star className="w-5 h-5" style={{ color: '#B87333', fill: '#B87333' }} />
                          <span className="text-xl font-bold" style={{ color: '#1f2937' }}>{Number(driver.rating).toFixed(1)}</span>
                        </div>
                      </div>

                      {/* Compact Stats for tablet */}
                      <div className="flex lg:hidden items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4" style={{ color: '#B87333', fill: '#B87333' }} />
                          <span className="text-sm font-bold" style={{ color: '#1f2937' }}>{Number(driver.rating).toFixed(1)}</span>
                        </div>
                        <span className="text-xs text-gray-500">{driver.total_trips} missions</span>
                      </div>

                      {/* Action Button */}
                      <DropdownMenu
                        isOpen={openMenuId === driver.id}
                        onToggle={() => setOpenMenuId(openMenuId === driver.id ? null : driver.id)}
                        button={
                          <button className="p-2 rounded-lg transition-all hover:bg-gray-100 flex-shrink-0">
                            <MoreVertical className="w-5 h-5 text-gray-500" />
                          </button>
                        }
                      >
                        <button
                          onClick={() => handleViewDetails(driver)}
                          className="w-full px-3 lg:px-4 py-2.5 lg:py-3 text-left text-xs lg:text-sm font-medium hover:bg-gray-50 transition-all"
                          style={{ color: '#1f2937' }}
                        >
                          Détails
                        </button>
                        <button
                          onClick={() => handleStatusClick(driver)}
                          className="w-full px-3 lg:px-4 py-2.5 lg:py-3 text-left text-xs lg:text-sm font-medium hover:bg-gray-50 transition-all"
                          style={{ color: '#B87333' }}
                        >
                          Changer statut
                        </button>
                        <button
                          onClick={() => handleEditDriver(driver)}
                          className="w-full px-3 lg:px-4 py-2.5 lg:py-3 text-left text-xs lg:text-sm font-medium hover:bg-gray-50 transition-all"
                          style={{ color: '#6A8A82' }}
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => handleDeleteClick(driver)}
                          className="w-full px-3 lg:px-4 py-2.5 lg:py-3 text-left text-xs lg:text-sm font-medium hover:bg-red-50 transition-all text-red-600"
                        >
                          Supprimer
                        </button>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Pagination */}
        {!isLoading && !error && drivers.length > 0 && totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={drivers.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        )}
        </>
        )}

        {/* Add Driver Modal */}
        <AddDriverModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleAddDriver}
        />

        {/* Driver Details Modal */}
        <DriverDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => {
            setIsDetailsModalOpen(false);
            setSelectedDriver(null);
          }}
          driver={selectedDriver}
        />

        {/* Edit Driver Modal */}
        <EditDriverModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedDriver(null);
          }}
          onSubmit={handleUpdateDriver}
          driver={selectedDriver}
        />

        {/* Delete Driver Modal */}
        <DeleteDriverModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setSelectedDriver(null);
          }}
          onConfirm={handleConfirmDelete}
          driver={selectedDriver}
        />

        {/* Change Status Modal */}
        <ChangeDriverStatusModal
          isOpen={isStatusModalOpen}
          onClose={() => {
            setIsStatusModalOpen(false);
            setSelectedDriver(null);
          }}
          onConfirm={handleStatusChange}
          driver={selectedDriver}
        />
      </div>
    </Layout>
  );
}
