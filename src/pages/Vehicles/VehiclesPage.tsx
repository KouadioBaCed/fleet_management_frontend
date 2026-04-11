import { useState, useEffect, useCallback } from 'react';
import Layout from '@/components/Layout/Layout';
import AddVehicleModal from '@/components/Vehicles/AddVehicleModal';
import VehicleDetailsModal from '@/components/Vehicles/VehicleDetailsModal';
import EditVehicleModal from '@/components/Vehicles/EditVehicleModal';
import DeleteVehicleModal from '@/components/Vehicles/DeleteVehicleModal';
import ChangeStatusModal from '@/components/Vehicles/ChangeStatusModal';
import DocumentAlertsBanner from '@/components/Vehicles/DocumentAlertsBanner';
import Pagination from '@/components/common/Pagination';
import DropdownMenu from '@/components/common/DropdownMenu';
import { vehiclesApi, type VehicleFilters, type VehicleStats } from '@/api/vehicles';
import type { Vehicle } from '@/types';
import {
  Car, Plus, Search, Filter, Fuel, Gauge, LayoutGrid, List,
  Eye, Edit, Trash2, RefreshCw, Loader2, X, AlertTriangle, RotateCw, MoreVertical
} from 'lucide-react';

type ViewMode = 'grid' | 'list';
type StatusFilter = 'all' | 'available' | 'in_use' | 'maintenance' | 'out_of_service';

const ITEMS_PER_PAGE = 9;

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string; dot: string }> = {
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

export default function VehiclesPage() {
  // State
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [stats, setStats] = useState<VehicleStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // View
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [currentPage, setCurrentPage] = useState(1);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isChangeStatusModalOpen, setIsChangeStatusModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch vehicles
  const fetchVehicles = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);

      const filters: VehicleFilters = {};
      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }
      if (debouncedSearch) {
        filters.search = debouncedSearch;
      }

      const response = await vehiclesApi.getAll(filters);
      setVehicles(response.results);
      setStats(response.stats);
    } catch (err: any) {
      console.error('Failed to fetch véhicles:', err);
      // Afficher le code HTTP et le detail backend si disponible, pour aider au diagnostic
      const status = err?.response?.status;
      const backendDetail = err?.response?.data?.detail || err?.response?.data?.error;
      if (status === 500) {
        setError(
          backendDetail
            ? `Erreur serveur (500) — ${backendDetail}`
            : 'Erreur serveur (500). Verifiez les logs du backend ou contactez l\'administrateur.'
        );
      } else if (status === 401) {
        setError('Session expiree. Reconnectez-vous.');
      } else if (status === 403) {
        setError('Acces refuse a cette ressource.');
      } else if (err?.code === 'ERR_NETWORK') {
        setError('Impossible de joindre le serveur. Verifiez votre connexion.');
      } else {
        setError(
          status
            ? `Impossible de charger les vehicules (HTTP ${status})`
            : 'Impossible de charger les vehicules'
        );
      }
    } finally {
      setLoading(false);
    }
  }, [statusFilter, debouncedSearch]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  // Pagination
  const totalPages = Math.ceil(vehicles.length / ITEMS_PER_PAGE);
  const paginatedVehicles = vehicles.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Handlers
  const handleAddVehicle = async (data: FormData) => {
    // L'erreur sera gérée dans le modal
    await vehiclesApi.create(data);
    setIsAddModalOpen(false);
    fetchVehicles();
  };

  const handleEditVehicle = async (data: FormData) => {
    if (!selectedVehicle) return;
    // L'erreur sera gérée dans le modal
    await vehiclesApi.update(selectedVehicle.id, data);
    setIsEditModalOpen(false);
    setSelectedVehicle(null);
    fetchVehicles();
  };

  const handleDeleteVehicle = async () => {
    if (!selectedVehicle) return;
    try {
      await vehiclesApi.delete(selectedVehicle.id);
      setIsDeleteModalOpen(false);
      setSelectedVehicle(null);
      fetchVehicles();
    } catch (err) {
      console.error('Failed to delete vehicle:', err);
    }
  };

  const handleViewDetails = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setIsDetailsModalOpen(true);
    setOpenMenuId(null);
  };

  const handleEdit = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setIsEditModalOpen(true);
    setOpenMenuId(null);
  };

  const handleDelete = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setIsDeleteModalOpen(true);
    setOpenMenuId(null);
  };

  const handleChangeStatus = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setIsChangeStatusModalOpen(true);
    setOpenMenuId(null);
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedVehicle) return;
    await vehiclesApi.changeStatus(selectedVehicle.id, newStatus);
    setIsChangeStatusModalOpen(false);
    setSelectedVehicle(null);
    fetchVehicles();
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
  };

  const formatMileage = (mileage: number) => {
    return new Intl.NumberFormat('fr-FR').format(Math.round(mileage)) + ' km';
  };

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: '#1f2937' }}>
              Véhicules
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Gérez votre flotte de véhicules</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={fetchVehicles}
              disabled={loading}
              className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl border-2 hover:shadow-sm transition-all"
              style={{ borderColor: '#E8ECEC' }}
              title="Rafraichir"
            >
              <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center space-x-1.5 sm:space-x-2 text-white transition-all duration-300 hover:-translate-y-0.5 btn-primary"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden xs:inline">Nouveau</span>
              <span className="hidden sm:inline">vehicule</span>
            </button>
          </div>
        </div>

        {/* Document Alerts Banner */}
        <DocumentAlertsBanner
          onViewVehicle={(vehicleId) => {
            const v = vehicles.find(v => v.id === vehicleId);
            if (v) handleViewDetails(v);
          }}
        />

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Total', value: stats.total, color: '#6A8A82' },
              { label: 'Disponibles', value: stats.available, color: '#6A8A82' },
              { label: 'En Mission', value: stats.in_use, color: '#B87333' },
              { label: 'Maintenance', value: stats.maintenance, color: '#6B7280' },
            ].map((stat, index) => (
              <div
                key={index}
                className="stat-card cursor-pointer"
                onClick={() => {
                  if (index === 0) setStatusFilter('all');
                  else if (index === 1) setStatusFilter('available');
                  else if (index === 2) setStatusFilter('in_use');
                  else if (index === 3) setStatusFilter('maintenance');
                }}
              >
                <div className="stat-accent" style={{ backgroundColor: stat.color }} />
                <div>
                  <p className="stat-label">{stat.label}</p>
                  <p className="stat-value" style={{ color: stat.color }}>{stat.value}</p>
                </div>
              </div>
            ))}
          </div>
        )}

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
              className="soft-input pl-9 sm:pl-12 pr-9 sm:pr-10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Dropdown */}
          <div className="relative flex gap-2">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-5 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border font-semibold transition-all hover:shadow-sm text-sm sm:text-base ${
                statusFilter !== 'all' ? 'shadow-md' : ''
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
              <div className="soft-dropdown z-20">
                <div className="p-2 sm:p-3">
                  <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wide text-gray-500 mb-2 sm:mb-3 px-2">Statut du véhicule</p>
                  {[
                    { value: 'all', label: 'Tous', count: stats?.total || 0 },
                    { value: 'available', label: 'Disponibles', count: stats?.available || 0 },
                    { value: 'in_use', label: 'En mission', count: stats?.in_use || 0 },
                    { value: 'maintenance', label: 'Maintenance', count: stats?.maintenance || 0 },
                    { value: 'out_of_service', label: 'Hors service', count: stats?.out_of_service || 0 },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setStatusFilter(option.value as StatusFilter);
                        setIsFilterOpen(false);
                      }}
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
          <div className="soft-toggle-group">
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

        {/* Active filters */}
        {(searchQuery || statusFilter !== 'all') && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs sm:text-sm text-gray-500">Filtres:</span>
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-blue-50 text-blue-600">
                <span className="truncate max-w-[100px] sm:max-w-none">"{searchQuery}"</span>
                <button onClick={() => setSearchQuery('')} className="hover:text-blue-900 flex-shrink-0">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {statusFilter !== 'all' && (
              <span
                className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium"
                style={{ backgroundColor: STATUS_COLORS[statusFilter].bg, color: STATUS_COLORS[statusFilter].text }}
              >
                {STATUS_COLORS[statusFilter].label}
                <button onClick={() => setStatusFilter('all')} className="hover:opacity-70 flex-shrink-0">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              onClick={clearFilters}
              className="text-xs sm:text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Effacer
            </button>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-100 rounded-lg sm:rounded-xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 flex-shrink-0" />
            <span className="text-red-700 text-sm flex-1">{error}</span>
            <button
              onClick={fetchVehicles}
              className="text-xs sm:text-sm font-medium text-red-600 hover:underline flex-shrink-0"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* Loading state */}
        {loading && vehicles.length === 0 && (
          <div className="flex items-center justify-center py-8 sm:py-12">
            <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white shadow-md border border-gray-200">
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#6A8A82' }} />
              <span className="text-sm font-medium text-gray-600">Chargement...</span>
            </div>
          </div>
        )}

        {/* Vehicles Display */}
        {!loading && vehicles.length > 0 ? (
          viewMode === 'grid' ? (
            /* Grid View */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              {paginatedVehicles.map((vehicle) => {
                const status = STATUS_COLORS[vehicle.status] || STATUS_COLORS.available;
                return (
                  <div
                    key={vehicle.id}
                    className="data-card hover:shadow-xl hover:-translate-y-1 relative"
                  >
                    {/* Menu ⋮ */}
                    <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10">
                      <DropdownMenu
                        isOpen={openMenuId === vehicle.id}
                        onToggle={() => setOpenMenuId(openMenuId === vehicle.id ? null : vehicle.id)}
                        button={
                          <button
                            className="p-1.5 sm:p-2 rounded-lg bg-white/80 backdrop-blur-sm hover:bg-white shadow-sm transition-all"
                          >
                            <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                          </button>
                        }
                        width={176}
                      >
                        <button onClick={() => handleViewDetails(vehicle)} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-gray-50 text-gray-700">
                          <Eye className="w-4 h-4" style={{ color: '#6A8A82' }} /> Détails
                        </button>
                        <button onClick={() => handleEdit(vehicle)} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-gray-50 text-gray-700">
                          <Edit className="w-4 h-4" style={{ color: '#B87333' }} /> Modifier
                        </button>
                        <button onClick={() => handleChangeStatus(vehicle)} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-gray-50 text-gray-700">
                          <RotateCw className="w-4 h-4" style={{ color: '#6A8A82' }} /> Changer statut
                        </button>
                        <div className="border-t border-gray-100 my-1" />
                        <button onClick={() => handleDelete(vehicle)} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-red-50 text-red-600">
                          <Trash2 className="w-4 h-4" /> Supprimer
                        </button>
                      </DropdownMenu>
                    </div>

                    {/* Vehicle Header */}
                    <div className="h-24 sm:h-32 relative overflow-hidden rounded-t-xl sm:rounded-t-2xl" style={{ backgroundColor: status.bg }}>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Car className="w-16 h-16 sm:w-20 sm:h-20 opacity-20" style={{ color: status.dot }} />
                      </div>
                      <button
                        onClick={() => handleChangeStatus(vehicle)}
                        className="absolute top-2 left-2 sm:top-4 sm:left-4 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold flex items-center space-x-1.5 sm:space-x-2 shadow-sm backdrop-blur-sm transition-all hover:shadow-sm hover:scale-105"
                        style={{ backgroundColor: status.bg, color: status.text }}
                        title="Cliquez pour changer le statut"
                      >
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full animate-pulse" style={{ backgroundColor: status.dot }} />
                        <span>{status.label}</span>
                      </button>
                    </div>

                    {/* Vehicle Info */}
                    <div className="p-3 sm:p-6">
                      <div className="flex items-start justify-between mb-3 sm:mb-4">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base sm:text-xl font-semibold truncate" style={{ color: '#1f2937' }}>{vehicle.license_plate}</h3>
                          <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1 truncate">{vehicle.brand} {vehicle.model}</p>
                        </div>
                        <div
                          className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-semibold flex-shrink-0 ml-2"
                          style={{ backgroundColor: '#E8EFED', color: '#6A8A82' }}
                        >
                          {vehicle.year}
                        </div>
                      </div>

                      <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-5">
                        <div className="flex items-center justify-between p-2 sm:p-3 rounded-lg" style={{ backgroundColor: 'rgba(106,138,130,0.04)' }}>
                          <div className="flex items-center space-x-1.5 sm:space-x-2">
                            <Gauge className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: '#6A8A82' }} />
                            <span className="text-xs sm:text-sm text-gray-600">Km</span>
                          </div>
                          <span className="font-semibold text-xs sm:text-sm" style={{ color: '#1f2937' }}>
                            {formatMileage(vehicle.current_mileage)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-2 sm:p-3 rounded-lg" style={{ backgroundColor: 'rgba(106,138,130,0.04)' }}>
                          <div className="flex items-center space-x-1.5 sm:space-x-2">
                            <Fuel className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: '#B87333' }} />
                            <span className="text-xs sm:text-sm text-gray-600">Carburant</span>
                          </div>
                          <span className="font-semibold text-xs sm:text-sm" style={{ color: '#1f2937' }}>
                            {FUEL_TYPE_LABELS[vehicle.fuel_type] || vehicle.fuel_type}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleViewDetails(vehicle)}
                        className="w-full py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold transition-all hover:shadow-sm flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm"
                        style={{ backgroundColor: '#E8EFED', color: '#6A8A82' }}
                      >
                        <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span>Voir détails</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* List View - Cards on mobile, Table on desktop */
            <>
              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {paginatedVehicles.map((vehicle) => {
                  const status = STATUS_COLORS[vehicle.status] || STATUS_COLORS.available;
                  return (
                    <div
                      key={vehicle.id}
                      className="data-card"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: status.bg }}
                        >
                          <Car className="w-6 h-6" style={{ color: status.dot }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm truncate" style={{ color: '#1f2937' }}>{vehicle.license_plate}</p>
                            <span
                              className="px-1.5 py-0.5 rounded text-[10px] font-semibold flex-shrink-0"
                              style={{ backgroundColor: '#E8EFED', color: '#6A8A82' }}
                            >
                              {vehicle.year}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 truncate">{vehicle.brand} {vehicle.model}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <button
                              onClick={() => handleChangeStatus(vehicle)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                              style={{ backgroundColor: status.bg, color: status.text }}
                            >
                              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: status.dot }} />
                              {status.label}
                            </button>
                            <span className="text-[10px] text-gray-500">{formatMileage(vehicle.current_mileage)}</span>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <DropdownMenu
                            isOpen={openMenuId === vehicle.id}
                            onToggle={() => setOpenMenuId(openMenuId === vehicle.id ? null : vehicle.id)}
                            button={
                              <button
                                className="p-1.5 rounded-lg hover:bg-gray-100 transition-all"
                              >
                                <MoreVertical className="w-5 h-5 text-gray-400" />
                              </button>
                            }
                            width={176}
                          >
                            <button onClick={() => handleViewDetails(vehicle)} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-gray-50 text-gray-700">
                              <Eye className="w-4 h-4" style={{ color: '#6A8A82' }} /> Détails
                            </button>
                            <button onClick={() => handleEdit(vehicle)} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-gray-50 text-gray-700">
                              <Edit className="w-4 h-4" style={{ color: '#B87333' }} /> Modifier
                            </button>
                            <button onClick={() => handleChangeStatus(vehicle)} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-gray-50 text-gray-700">
                              <RotateCw className="w-4 h-4" style={{ color: '#6A8A82' }} /> Changer statut
                            </button>
                            <div className="border-t border-gray-100 my-1" />
                            <button onClick={() => handleDelete(vehicle)} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-red-50 text-red-600">
                              <Trash2 className="w-4 h-4" /> Supprimer
                            </button>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block data-table-container">
                <div className="overflow-x-auto">
                  <table className="data-table" style={{ tableLayout: 'fixed', width: '100%' }}>
                    <thead>
                      <tr>
                        <th style={{ width: '25%' }}>Véhicule</th>
                        <th style={{ width: '18%' }}>Immatriculation</th>
                        <th style={{ width: '15%' }}>Statut</th>
                        <th className="hidden lg:table-cell" style={{ width: '15%' }}>Kilométrage</th>
                        <th className="hidden lg:table-cell" style={{ width: '12%' }}>Carburant</th>
                        <th className="hidden xl:table-cell" style={{ width: '10%' }}>Année</th>
                        <th className="text-center !px-2" style={{ width: '64px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedVehicles.map((vehicle) => {
                        const status = STATUS_COLORS[vehicle.status] || STATUS_COLORS.available;
                        return (
                          <tr key={vehicle.id}>
                            <td className="overflow-hidden">
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                                  style={{ backgroundColor: status.bg }}
                                >
                                  <Car className="w-5 h-5" style={{ color: status.dot }} />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-sm truncate" style={{ color: '#1f2937' }}>{vehicle.brand} {vehicle.model}</p>
                                  <p className="text-xs text-gray-500 truncate">{vehicle.color}</p>
                                </div>
                              </div>
                            </td>
                            <td className="overflow-hidden">
                              <span className="font-mono font-semibold text-sm truncate block" style={{ color: '#1f2937' }}>
                                {vehicle.license_plate}
                              </span>
                            </td>
                            <td>
                              <button
                                onClick={() => handleChangeStatus(vehicle)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all hover:shadow-sm hover:scale-105 cursor-pointer"
                                style={{ backgroundColor: status.bg, color: status.text }}
                                title="Cliquez pour changer le statut"
                              >
                                <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: status.dot }} />
                                {status.label}
                              </button>
                            </td>
                            <td className="hidden lg:table-cell">
                              <span className="text-sm text-gray-700">{formatMileage(vehicle.current_mileage)}</span>
                            </td>
                            <td className="hidden lg:table-cell">
                              <span className="text-sm text-gray-700">
                                {FUEL_TYPE_LABELS[vehicle.fuel_type] || vehicle.fuel_type}
                              </span>
                            </td>
                            <td className="hidden xl:table-cell">
                              <span
                                className="px-2 py-1 rounded text-xs font-semibold"
                                style={{ backgroundColor: '#E8EFED', color: '#6A8A82' }}
                              >
                                {vehicle.year}
                              </span>
                            </td>
                            <td className="!px-2 text-center">
                              <div className="flex items-center justify-center">
                                <DropdownMenu
                                  isOpen={openMenuId === vehicle.id}
                                  onToggle={() => setOpenMenuId(openMenuId === vehicle.id ? null : vehicle.id)}
                                  button={
                                    <button
                                      className="p-2 rounded-lg transition-all hover:bg-gray-100"
                                    >
                                      <MoreVertical className="w-5 h-5 text-gray-500" />
                                    </button>
                                  }
                                >
                                  <button onClick={() => handleViewDetails(vehicle)} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-gray-50 text-gray-700 font-medium">
                                    <Eye className="w-4 h-4" style={{ color: '#6A8A82' }} /> Voir détails
                                  </button>
                                  <button onClick={() => handleEdit(vehicle)} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-gray-50 text-gray-700 font-medium">
                                    <Edit className="w-4 h-4" style={{ color: '#B87333' }} /> Modifier
                                  </button>
                                  <button onClick={() => handleChangeStatus(vehicle)} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-gray-50 text-gray-700 font-medium">
                                    <RotateCw className="w-4 h-4" style={{ color: '#6A8A82' }} /> Changer statut
                                  </button>
                                  <div className="border-t border-gray-100 my-1" />
                                  <button onClick={() => handleDelete(vehicle)} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-red-50 text-red-600 font-medium">
                                    <Trash2 className="w-4 h-4" /> Supprimer
                                  </button>
                                </DropdownMenu>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )
        ) : !loading && (
          <div className="data-table-container p-6 sm:p-12 text-center">
            <div className="w-14 h-14 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4 rounded-xl sm:rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#E8EFED' }}>
              <Search className="w-7 h-7 sm:w-10 sm:h-10" style={{ color: '#6A8A82' }} />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2" style={{ color: '#1f2937' }}>
              Aucun véhicule trouvé
            </h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4">
              {searchQuery
                ? `Aucun véhicule ne correspond à "${searchQuery}"`
                : statusFilter !== 'all'
                ? 'Aucun véhicule avec ce statut'
                : 'Aucun véhicule dans votre flotte'}
            </p>
            {(searchQuery || statusFilter !== 'all') && (
              <button
                onClick={clearFilters}
                className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold transition-all hover:shadow-sm text-sm sm:text-base"
                style={{ backgroundColor: '#E8EFED', color: '#6A8A82' }}
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={vehicles.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* Modals */}
      <AddVehicleModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddVehicle}
      />

      <VehicleDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedVehicle(null);
        }}
        vehicle={selectedVehicle}
        statusColors={STATUS_COLORS}
      />

      <EditVehicleModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedVehicle(null);
        }}
        onSubmit={handleEditVehicle}
        vehicle={selectedVehicle}
      />

      <DeleteVehicleModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedVehicle(null);
        }}
        onConfirm={handleDeleteVehicle}
        vehicle={selectedVehicle}
      />

      <ChangeStatusModal
        isOpen={isChangeStatusModalOpen}
        onClose={() => {
          setIsChangeStatusModalOpen(false);
          setSelectedVehicle(null);
        }}
        onConfirm={handleStatusChange}
        vehicle={selectedVehicle}
      />

      {/* Click outside to close menus */}
      {(isFilterOpen || openMenuId !== null) && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => {
            setIsFilterOpen(false);
            setOpenMenuId(null);
          }}
        />
      )}
    </Layout>
  );
}
