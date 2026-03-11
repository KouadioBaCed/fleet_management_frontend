import { useState, useEffect, useCallback, useMemo } from 'react';
import Layout from '@/components/Layout/Layout';
import Pagination from '@/components/common/Pagination';
import DeleteConfirmModal from '@/components/common/DeleteConfirmModal';
import AddFuelModal from '@/components/Fuel/AddFuelModal';
import EditFuelModal from '@/components/Fuel/EditFuelModal';
import FuelDetailsModal from '@/components/Fuel/FuelDetailsModal';
import FuelAnalytics from '@/components/Fuel/FuelAnalytics';
import {
  Fuel,
  Plus,
  Search,
  Filter,
  Car,
  Coins,
  Droplets,
  Gauge,
  MapPin,
  Calendar,
  TrendingUp,
  BarChart3,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Loader2,
  Zap,
  X,
  List,
  PieChart
} from 'lucide-react';
import { fuelApi, type FuelRecord, type FuelStats, type CreateFuelData, type UpdateFuelData } from '@/api/fuel';
import { vehiclesApi } from '@/api/vehicles';
import { useCurrency } from '@/store/settingsStore';
import { getCurrencySymbol } from '@/api/settings';
import { useTranslation } from '@/i18n';
import type { Vehicle } from '@/types';

type ViewMode = 'list' | 'analytics';
type FuelTypeFilter = 'all' | 'gasoline' | 'diesel' | 'electric';

const ITEMS_PER_PAGE = 8;

const FUEL_TYPE_CONFIG = {
  gasoline: { label: 'Essence', icon: '⛽', color: '#6A8A82', bg: '#E8EFED' },
  diesel: { label: 'Diesel', icon: '🛢️', color: '#B87333', bg: '#F5E8DD' },
  electric: { label: 'Électrique', icon: '⚡', color: '#3B82F6', bg: '#DBEAFE' },
};

export default function FuelPage() {
  const { t } = useTranslation();
  const currency = useCurrency();
  const currencySymbol = getCurrencySymbol(currency);

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [records, setRecords] = useState<FuelRecord[]>([]);
  const [stats, setStats] = useState<FuelStats | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [fuelTypeFilter, setFuelTypeFilter] = useState<FuelTypeFilter>('all');
  const [vehicleFilter, setVehicleFilter] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<FuelRecord | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isVehicleFilterOpen, setIsVehicleFilterOpen] = useState(false);

  // Fetch data
  const fetchRecords = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fuelApi.getAll({
        fuel_type: fuelTypeFilter !== 'all' ? fuelTypeFilter : undefined,
        vehicle: vehicleFilter || undefined,
        search: searchQuery || undefined,
      });
      setRecords(response.results);
      setStats(response.stats);
    } catch (error) {
      console.error('Error fetching fuel records:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fuelTypeFilter, vehicleFilter, searchQuery]);

  const fetchVehicles = async () => {
    try {
      const response = await vehiclesApi.getAll();
      setVehicles(response.results || response);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    }
  };

  useEffect(() => {
    fetchRecords();
    fetchVehicles();
  }, [fetchRecords]);

  // Pagination
  const totalPages = Math.ceil(records.length / ITEMS_PER_PAGE);
  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return records.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [records, currentPage]);

  // Handlers
  const handleAddFuel = async (data: CreateFuelData) => {
    await fuelApi.create(data);
    setIsAddModalOpen(false);
    fetchRecords();
  };

  const handleEditFuel = async (id: number, data: UpdateFuelData) => {
    await fuelApi.update(id, data);
    setIsEditModalOpen(false);
    setSelectedRecord(null);
    fetchRecords();
  };

  const handleOpenDetails = async (record: FuelRecord) => {
    try {
      const fullRecord = await fuelApi.getById(record.id);
      setSelectedRecord(fullRecord);
      setIsDetailsModalOpen(true);
    } catch (error) {
      console.error('Error fetching fuel record details:', error);
      setSelectedRecord(record);
      setIsDetailsModalOpen(true);
    }
    setOpenMenuId(null);
  };

  const handleOpenEdit = async (record: FuelRecord) => {
    try {
      const fullRecord = await fuelApi.getById(record.id);
      setSelectedRecord(fullRecord);
      setIsEditModalOpen(true);
    } catch (error) {
      console.error('Error fetching fuel record:', error);
      setSelectedRecord(record);
      setIsEditModalOpen(true);
    }
    setOpenMenuId(null);
  };

  const handleOpenDelete = (record: FuelRecord) => {
    setSelectedRecord(record);
    setIsDeleteModalOpen(true);
    setOpenMenuId(null);
  };

  const handleDeleteFuel = async () => {
    if (!selectedRecord) return;

    setIsDeleting(true);
    try {
      await fuelApi.delete(selectedRecord.id);
      setIsDeleteModalOpen(false);
      setSelectedRecord(null);
      fetchRecords();
    } catch (error) {
      console.error('Error deleting fuel record:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Stats cards
  const displayStats = [
    {
      label: t('fuel.totalFuel'),
      value: `${(stats?.total_quantity || 0).toFixed(0)}L`,
      color: '#3B82F6',
      icon: Droplets,
    },
    {
      label: t('fuel.totalCost'),
      value: `${(stats?.total_cost || 0).toFixed(2)} ${currencySymbol}`,
      color: '#B87333',
      icon: Coins,
    },
    {
      label: t('fuel.avgConsumption'),
      value: `${(stats?.average_consumption || 0).toFixed(1)}L/100km`,
      color: '#6A8A82',
      icon: Gauge,
    },
    {
      label: t('fuel.avgPrice'),
      value: `${(stats?.average_unit_price || 0).toFixed(3)} ${currencySymbol}/L`,
      color: '#7C3AED',
      icon: TrendingUp,
    },
  ];

  // Max monthly cost for chart scaling
  const maxMonthlyCost = Math.max(...(stats?.monthly_data?.map(m => m.cost) || [1]), 1);

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
          <div>
            <h1 className="text-xl sm:text-3xl font-semibold" style={{ color: '#1f2937' }}>
              {t('fuel.title')}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">{t('fuel.subtitle')}</p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center space-x-2 text-white transition-all duration-300 hover:-translate-y-0.5 w-full sm:w-auto justify-center btn-primary"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="sm:hidden">Nouveau</span>
            <span className="hidden sm:inline">Nouveau ravitaillement</span>
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

        {/* Charts Row */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* By Fuel Type */}
            <div className="data-table-container p-3 sm:p-5">
              <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                <Fuel className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#6A8A82' }} />
                <h4 className="font-semibold text-sm sm:text-base" style={{ color: '#1f2937' }}>Par Type de Carburant</h4>
              </div>
              <div className="space-y-2 sm:space-y-3">
                {Object.entries(stats.by_fuel_type).map(([type, data]) => {
                  const config = FUEL_TYPE_CONFIG[type as keyof typeof FUEL_TYPE_CONFIG];
                  const percentage = stats.total_cost > 0 ? (data.cost / stats.total_cost) * 100 : 0;

                  return (
                    <div key={type} className="flex items-center space-x-2 sm:space-x-3">
                      <div
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-sm sm:text-lg flex-shrink-0"
                        style={{ backgroundColor: config.bg }}
                      >
                        {config.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between text-xs sm:text-sm mb-0.5 sm:mb-1">
                          <span className="font-medium" style={{ color: '#1f2937' }}>{config.label}</span>
                          <span className="text-gray-500">{data.count} pleins</span>
                        </div>
                        <div className="h-1.5 sm:h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#E8ECEC' }}>
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${percentage}%`, backgroundColor: config.color }}
                          />
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 w-16 sm:w-20">
                        <p className="font-semibold text-xs sm:text-sm" style={{ color: config.color }}>
                          {data.cost.toFixed(0)} {currencySymbol}
                        </p>
                        <p className="text-[10px] sm:text-xs text-gray-400">{data.quantity.toFixed(0)}L</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Monthly Costs */}
            <div className="data-table-container p-3 sm:p-5">
              <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#B87333' }} />
                <h4 className="font-semibold text-sm sm:text-base" style={{ color: '#1f2937' }}>Coûts Mensuels</h4>
              </div>
              {stats.monthly_data && stats.monthly_data.length > 0 ? (
                <div className="flex items-end space-x-1 sm:space-x-2 h-32 sm:h-40">
                  {stats.monthly_data.map((month, index) => {
                    const height = (month.cost / maxMonthlyCost) * 100;

                    return (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <div
                          className="w-full rounded-t-lg transition-all hover:opacity-80"
                          style={{
                            height: `${Math.max(height, 5)}%`,
                            backgroundColor: '#B87333',
                          }}
                        />
                        <div className="mt-1 sm:mt-2 text-center">
                          <p className="text-[9px] sm:text-xs font-medium text-gray-600 truncate" style={{ maxWidth: '40px' }}>
                            {month.month.split(' ')[0].slice(0, 3)}
                          </p>
                          <p className="text-[9px] sm:text-xs font-semibold" style={{ color: '#B87333' }}>
                            {month.cost.toFixed(0)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-32 sm:h-40 flex items-center justify-center text-gray-500 text-xs sm:text-sm">
                  Pas de données disponibles
                </div>
              )}
            </div>
          </div>
        )}

        {/* View Mode Toggle & Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
          {/* View Mode Toggle */}
          <div className="soft-toggle-group flex items-center rounded-lg sm:rounded-xl overflow-hidden flex-shrink-0">
            <button
              onClick={() => setViewMode('list')}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-center space-x-2 transition-all ${viewMode === 'list' ? 'shadow-sm' : 'hover:bg-gray-50'}`}
              style={{
                backgroundColor: viewMode === 'list' ? '#E8EFED' : 'transparent',
                color: viewMode === 'list' ? '#6A8A82' : '#6B7280'
              }}
            >
              <List className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="font-medium text-xs sm:text-sm">Liste</span>
            </button>
            <div className="w-px h-8" style={{ backgroundColor: 'rgba(0,0,0,0.06)' }} />
            <button
              onClick={() => setViewMode('analytics')}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-center space-x-2 transition-all ${viewMode === 'analytics' ? 'shadow-sm' : 'hover:bg-gray-50'}`}
              style={{
                backgroundColor: viewMode === 'analytics' ? '#F5E8DD' : 'transparent',
                color: viewMode === 'analytics' ? '#B87333' : '#6B7280'
              }}
            >
              <PieChart className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="font-medium text-xs sm:text-sm">Analyse</span>
            </button>
          </div>

          {/* Search - Only show in list view */}
          {viewMode === 'list' && (
            <>
              <div className="relative flex-1 order-first sm:order-none">
                <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="soft-input w-full pl-9 sm:pl-12 pr-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm text-gray-900 placeholder-gray-400"
                />
              </div>

          {/* Filters Row */}
          <div className="flex items-center gap-2 sm:gap-4">
          {/* Fuel Type Filter */}
          <div className="relative flex-1 sm:flex-none">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`flex items-center justify-center space-x-1 sm:space-x-2 px-3 sm:px-5 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border font-semibold text-xs sm:text-sm transition-all hover:shadow-sm w-full sm:w-auto ${
                fuelTypeFilter !== 'all' ? 'shadow-sm' : ''
              }`}
              style={{
                borderColor: fuelTypeFilter !== 'all' ? '#6A8A82' : 'rgba(0,0,0,0.08)',
                backgroundColor: fuelTypeFilter !== 'all' ? '#E8EFED' : '#ffffff',
                color: fuelTypeFilter !== 'all' ? '#6A8A82' : '#6B7280'
              }}
            >
              <Fuel className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Type</span>
            </button>

            {isFilterOpen && (
              <div className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-48 soft-dropdown z-10">
                <div className="p-2">
                  {[
                    { value: 'all' as const, label: 'Tous les types', icon: '🔄' },
                    { value: 'gasoline' as const, label: 'Essence', icon: '⛽' },
                    { value: 'diesel' as const, label: 'Diesel', icon: '🛢️' },
                    { value: 'electric' as const, label: 'Électrique', icon: '⚡' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setFuelTypeFilter(option.value);
                        setCurrentPage(1);
                        setIsFilterOpen(false);
                      }}
                      className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        fuelTypeFilter === option.value ? 'bg-gray-100' : 'hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-lg">{option.icon}</span>
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Vehicle Filter */}
          <div className="relative flex-1 sm:flex-none">
            <button
              onClick={() => setIsVehicleFilterOpen(!isVehicleFilterOpen)}
              className={`flex items-center justify-center space-x-1 sm:space-x-2 px-3 sm:px-5 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border font-semibold text-xs sm:text-sm transition-all hover:shadow-sm w-full sm:w-auto ${
                vehicleFilter ? 'shadow-sm' : ''
              }`}
              style={{
                borderColor: vehicleFilter ? '#B87333' : 'rgba(0,0,0,0.08)',
                backgroundColor: vehicleFilter ? '#F5E8DD' : '#ffffff',
                color: vehicleFilter ? '#B87333' : '#6B7280'
              }}
            >
              <Car className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="truncate max-w-[60px] sm:max-w-none">
                {vehicleFilter
                  ? vehicles.find(v => v.id === vehicleFilter)?.license_plate || 'Véhicule'
                  : 'Véhicule'
                }
              </span>
              {vehicleFilter && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setVehicleFilter(null);
                    setCurrentPage(1);
                  }}
                  className="ml-1 p-0.5 rounded-full hover:bg-white/50"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </button>

            {isVehicleFilterOpen && (
              <div className="absolute right-0 mt-2 w-64 soft-dropdown z-10 max-h-64 overflow-y-auto">
                <div className="p-2">
                  <button
                    onClick={() => {
                      setVehicleFilter(null);
                      setCurrentPage(1);
                      setIsVehicleFilterOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                      !vehicleFilter ? 'bg-gray-100 font-semibold' : 'hover:bg-gray-50'
                    }`}
                  >
                    Tous les véhicules
                  </button>
                  {vehicles.map((vehicle) => (
                    <button
                      key={vehicle.id}
                      onClick={() => {
                        setVehicleFilter(vehicle.id);
                        setCurrentPage(1);
                        setIsVehicleFilterOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                        vehicleFilter === vehicle.id ? 'bg-gray-100 font-semibold' : 'hover:bg-gray-50'
                      }`}
                    >
                      <span className="font-medium">{vehicle.license_plate}</span>
                      <span className="text-gray-500 ml-2">{vehicle.brand} {vehicle.model}</span>
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

        {/* Analytics View */}
        {viewMode === 'analytics' && (
          <FuelAnalytics />
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <>
            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#6A8A82' }} />
              </div>
            )}

        {/* Records List */}
        {!isLoading && (
          <>
            {records.length === 0 ? (
              <div className="data-table-container p-8 sm:p-12 text-center">
                <div
                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4"
                  style={{ backgroundColor: '#E8EFED' }}
                >
                  <Fuel className="w-6 h-6 sm:w-8 sm:h-8" style={{ color: '#6A8A82' }} />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1 sm:mb-2">Aucun ravitaillement</h3>
                <p className="text-sm sm:text-base text-gray-500 mb-4 sm:mb-6">
                  {searchQuery || fuelTypeFilter !== 'all' || vehicleFilter
                    ? 'Aucun enregistrement ne correspond à vos critères'
                    : 'Commencez par enregistrer un ravitaillement'}
                </p>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="text-white transition-all btn-primary"
                >
                  Enregistrer un ravitaillement
                </button>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {paginatedRecords.map((record) => {
                  const fuelConfig = FUEL_TYPE_CONFIG[record.fuel_type as keyof typeof FUEL_TYPE_CONFIG] || FUEL_TYPE_CONFIG.gasoline;

                  return (
                    <div
                      key={record.id}
                      className="data-card hover:shadow-lg !p-0"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center p-3 sm:p-5 gap-3 sm:gap-5">
                        {/* Mobile: Header row with icon, title, and actions */}
                        <div className="flex items-start gap-3 sm:contents">
                          {/* Icon */}
                          <div
                            className="w-10 h-10 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl flex items-center justify-center text-lg sm:text-2xl flex-shrink-0"
                            style={{ backgroundColor: fuelConfig.bg }}
                          >
                            {fuelConfig.icon}
                          </div>

                          {/* Mobile: Title and plate */}
                          <div className="flex-1 min-w-0 sm:hidden">
                            <div className="flex items-center gap-2 mb-0.5">
                              <h3 className="text-sm font-semibold truncate" style={{ color: '#1f2937' }}>
                                {record.station_name}
                              </h3>
                            </div>
                            <span
                              className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold"
                              style={{ backgroundColor: fuelConfig.bg, color: fuelConfig.color }}
                            >
                              {record.vehicle_plate}
                            </span>
                          </div>

                          {/* Mobile: Actions */}
                          <div className="relative flex-shrink-0 sm:hidden">
                            <button
                              onClick={() => setOpenMenuId(openMenuId === record.id ? null : record.id)}
                              className="p-2 rounded-lg transition-all hover:shadow-sm"
                              style={{ backgroundColor: '#E8EFED', color: '#6A8A82' }}
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {openMenuId === record.id && (
                              <div className="absolute right-0 top-full mt-2 w-40 soft-dropdown overflow-hidden z-10">
                                <button
                                  onClick={() => handleOpenDetails(record)}
                                  className="w-full flex items-center space-x-3 px-3 py-2.5 hover:bg-gray-50 transition-all text-left"
                                >
                                  <Eye className="w-4 h-4" style={{ color: '#6A8A82' }} />
                                  <span className="text-xs font-medium" style={{ color: '#1f2937' }}>Voir détails</span>
                                </button>
                                <button
                                  onClick={() => handleOpenEdit(record)}
                                  className="w-full flex items-center space-x-3 px-3 py-2.5 hover:bg-gray-50 transition-all text-left border-t"
                                  style={{ borderColor: '#E8ECEC' }}
                                >
                                  <Edit className="w-4 h-4" style={{ color: '#B87333' }} />
                                  <span className="text-xs font-medium" style={{ color: '#1f2937' }}>Modifier</span>
                                </button>
                                <button
                                  onClick={() => handleOpenDelete(record)}
                                  className="w-full flex items-center space-x-3 px-3 py-2.5 hover:bg-red-50 transition-all text-left border-t"
                                  style={{ borderColor: '#E8ECEC' }}
                                >
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                  <span className="text-xs font-medium text-red-600">Supprimer</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Desktop: Info */}
                        <div className="hidden sm:block flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-lg font-semibold" style={{ color: '#1f2937' }}>
                              {record.station_name}
                            </h3>
                            <span
                              className="px-2 py-1 rounded-lg text-xs font-semibold"
                              style={{ backgroundColor: fuelConfig.bg, color: fuelConfig.color }}
                            >
                              {record.vehicle_plate}
                            </span>
                          </div>
                          {record.station_address && (
                            <p className="text-sm text-gray-500 mb-2 line-clamp-1">{record.station_address}</p>
                          )}
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1.5">
                              <Droplets className="w-4 h-4" style={{ color: '#3B82F6' }} />
                              <span className="font-medium" style={{ color: '#3B82F6' }}>
                                {Number(record.quantity).toFixed(2)}L
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Coins className="w-4 h-4" style={{ color: '#6A8A82' }} />
                              <span className="text-gray-600">
                                {Number(record.unit_price).toFixed(3)} {currencySymbol}/L
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Gauge className="w-4 h-4" style={{ color: '#6B7280' }} />
                              <span className="text-gray-600">
                                {Number(record.mileage_at_refuel).toLocaleString()} km
                              </span>
                            </div>
                            {record.calculated_consumption && (
                              <div className="flex items-center gap-1.5">
                                <TrendingUp className="w-4 h-4" style={{ color: '#059669' }} />
                                <span className="text-green-600 font-medium">
                                  {Number(record.calculated_consumption).toFixed(1)}L/100km
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Mobile: Stats grid */}
                        <div className="sm:hidden grid grid-cols-3 gap-2 text-[10px]">
                          <div className="flex flex-col items-center p-2 rounded-lg" style={{ backgroundColor: '#DBEAFE' }}>
                            <Droplets className="w-3 h-3 mb-0.5" style={{ color: '#3B82F6' }} />
                            <span className="font-semibold" style={{ color: '#3B82F6' }}>{Number(record.quantity).toFixed(1)}L</span>
                          </div>
                          <div className="flex flex-col items-center p-2 rounded-lg" style={{ backgroundColor: '#F5E8DD' }}>
                            <Coins className="w-3 h-3 mb-0.5" style={{ color: '#B87333' }} />
                            <span className="font-semibold" style={{ color: '#B87333' }}>{Number(record.total_cost).toFixed(0)}{currencySymbol}</span>
                          </div>
                          <div className="flex flex-col items-center p-2 rounded-lg" style={{ backgroundColor: '#E8EFED' }}>
                            <Gauge className="w-3 h-3 mb-0.5" style={{ color: '#6A8A82' }} />
                            <span className="font-semibold" style={{ color: '#6A8A82' }}>{(Number(record.mileage_at_refuel)/1000).toFixed(0)}k km</span>
                          </div>
                        </div>

                        {/* Mobile: Date row */}
                        <div className="sm:hidden flex items-center justify-between text-[10px] text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>
                              {new Date(record.refuel_date).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                          {record.is_full_tank && (
                            <span className="text-green-600 font-medium">Plein complet</span>
                          )}
                        </div>

                        {/* Desktop: Date */}
                        <div className="hidden sm:block text-right flex-shrink-0">
                          <div className="flex items-center space-x-1.5 text-gray-500 text-sm mb-1">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {new Date(record.refuel_date).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400">
                            {new Date(record.refuel_date).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>

                        {/* Desktop: Cost */}
                        <div className="hidden sm:block text-right flex-shrink-0 min-w-[100px]">
                          <p className="text-2xl font-semibold" style={{ color: '#B87333' }}>
                            {Number(record.total_cost).toFixed(2)} {currencySymbol}
                          </p>
                          {record.is_full_tank && (
                            <span className="text-xs text-green-600 font-medium">Plein complet</span>
                          )}
                        </div>

                        {/* Desktop: Actions */}
                        <div className="relative flex-shrink-0 hidden sm:block">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === record.id ? null : record.id)}
                            className="p-3 rounded-lg font-semibold transition-all hover:shadow-sm flex items-center justify-center"
                            style={{ backgroundColor: '#E8EFED', color: '#6A8A82' }}
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>

                          {openMenuId === record.id && (
                            <div className="absolute right-0 top-full mt-2 w-44 soft-dropdown overflow-hidden z-10">
                              <button
                                onClick={() => handleOpenDetails(record)}
                                className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-all text-left"
                              >
                                <Eye className="w-4 h-4" style={{ color: '#6A8A82' }} />
                                <span className="text-sm font-medium" style={{ color: '#1f2937' }}>Voir détails</span>
                              </button>
                              <button
                                onClick={() => handleOpenEdit(record)}
                                className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-all text-left border-t"
                                style={{ borderColor: '#E8ECEC' }}
                              >
                                <Edit className="w-4 h-4" style={{ color: '#B87333' }} />
                                <span className="text-sm font-medium" style={{ color: '#1f2937' }}>Modifier</span>
                              </button>
                              <button
                                onClick={() => handleOpenDelete(record)}
                                className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-red-50 transition-all text-left border-t"
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
                totalItems={records.length}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={setCurrentPage}
              />
            )}
          </>
        )}
          </>
        )}
      </div>

      {/* Add Modal */}
      <AddFuelModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddFuel}
      />

      {/* Edit Modal */}
      <EditFuelModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedRecord(null);
        }}
        onSubmit={handleEditFuel}
        record={selectedRecord}
      />

      {/* Details Modal */}
      <FuelDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedRecord(null);
        }}
        record={selectedRecord}
      />

      {/* Delete Confirm Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedRecord(null);
        }}
        onConfirm={handleDeleteFuel}
        isDeleting={isDeleting}
        title="Supprimer le ravitaillement"
        message="Êtes-vous sûr de vouloir supprimer cet enregistrement de ravitaillement ?"
        itemName={selectedRecord ? `${selectedRecord.station_name} - ${selectedRecord.vehicle_plate}` : undefined}
      />
    </Layout>
  );
}
