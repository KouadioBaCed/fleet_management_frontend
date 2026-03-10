import { useState, useMemo, useEffect, useCallback } from 'react';
import Layout from '@/components/Layout/Layout';
import AddMissionModal from '@/components/Missions/AddMissionModal';
import AssignMissionModal from '@/components/Missions/AssignMissionModal';
import MissionTrackingModal from '@/components/Missions/MissionTrackingModal';
import MissionDetailsModal from '@/components/Missions/MissionDetailsModal';
import EditMissionModal from '@/components/Missions/EditMissionModal';
import DeleteMissionModal from '@/components/Missions/DeleteMissionModal';
import CancelMissionModal from '@/components/Missions/CancelMissionModal';
import TripHistoryModal from '@/components/Missions/TripHistoryModal';
import StartMissionModal from '@/components/Missions/StartMissionModal';
import ActiveMissionModal from '@/components/Missions/ActiveMissionModal';
import Pagination from '@/components/common/Pagination';
import { missionsApi, type MissionStats } from '@/api/missions';
import type { Mission } from '@/types';
import {
  MapPin,
  Plus,
  Calendar,
  User,
  Car,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Loader2,
  RefreshCw,
  AlertCircle,
  Play,
  Pause,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  Flag,
  UserPlus,
  Radio,
  XCircle,
  Route,
} from 'lucide-react';

type StatusFilter = 'all' | 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
type PriorityFilter = 'all' | 'low' | 'medium' | 'high' | 'urgent';
type SortOrder = 'scheduled_start' | '-scheduled_start' | 'created_at' | '-created_at' | 'priority' | '-priority';

const ITEMS_PER_PAGE = 12;

export default function MissionsPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('-scheduled_start');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isPriorityFilterOpen, setIsPriorityFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isTripHistoryModalOpen, setIsTripHistoryModalOpen] = useState(false);
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [isActiveModalOpen, setIsActiveModalOpen] = useState(false);
  const [activeTripId, setActiveTripId] = useState<number | null>(null);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // API states
  const [missions, setMissions] = useState<Mission[]>([]);
  const [stats, setStats] = useState<MissionStats>({
    total: 0,
    by_status: { pending: 0, assigned: 0, in_progress: 0, completed: 0, cancelled: 0 },
    by_priority: { low: 0, medium: 0, high: 0, urgent: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch missions from API
  const fetchMissions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await missionsApi.getAll({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        priority: priorityFilter !== 'all' ? priorityFilter : undefined,
        search: debouncedSearch || undefined,
        ordering: sortOrder,
      });
      setMissions(response.results);
      setStats(response.stats);
    } catch (err: any) {
      console.error('Error fetching missions:', err);
      setError(err.response?.data?.detail || 'Erreur lors du chargement des missions');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter, debouncedSearch, sortOrder]);

  useEffect(() => {
    fetchMissions();
  }, [fetchMissions]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setIsFilterOpen(false);
      setIsPriorityFilterOpen(false);
      setIsSortOpen(false);
      setOpenMenuId(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const statusConfig: Record<string, { bg: string; text: string; label: string; dot: string }> = {
    pending: { bg: '#E8ECEC', text: '#6B7280', label: 'En attente', dot: '#6B7280' },
    assigned: { bg: '#E8EFED', text: '#6A8A82', label: 'Assignee', dot: '#6A8A82' },
    in_progress: { bg: '#F5E8DD', text: '#B87333', label: 'En cours', dot: '#B87333' },
    completed: { bg: '#DBEAFE', text: '#1E40AF', label: 'Terminee', dot: '#1E40AF' },
    cancelled: { bg: '#FEE2E2', text: '#DC2626', label: 'Annulee', dot: '#DC2626' },
  };

  const priorityConfig: Record<string, { bg: string; text: string; label: string }> = {
    low: { bg: '#E8ECEC', text: '#6B7280', label: 'Faible' },
    medium: { bg: '#E8EFED', text: '#6A8A82', label: 'Moyenne' },
    high: { bg: '#F5E8DD', text: '#B87333', label: 'Haute' },
    urgent: { bg: '#FEE2E2', text: '#DC2626', label: 'Urgente' },
  };

  const sortOptions = [
    { value: '-scheduled_start', label: 'Date debut (recent)', icon: ArrowDown },
    { value: 'scheduled_start', label: 'Date debut (ancien)', icon: ArrowUp },
    { value: '-created_at', label: 'Date creation (recent)', icon: ArrowDown },
    { value: 'created_at', label: 'Date creation (ancien)', icon: ArrowUp },
    { value: '-priority', label: 'Priorité (haute)', icon: ArrowDown },
    { value: 'priority', label: 'Priorité (basse)', icon: ArrowUp },
  ];

  const statsDisplay = [
    { label: 'Total Missions', value: stats.total, color: '#6A8A82' },
    { label: 'En Cours', value: stats.by_status.in_progress, color: '#B87333' },
    { label: 'Assignees', value: stats.by_status.assigned, color: '#6A8A82' },
    { label: 'En Attente', value: stats.by_status.pending, color: '#6B7280' },
  ];

  // Pagination calculations (client-side pagination of API results)
  const totalPages = Math.ceil(missions.length / ITEMS_PER_PAGE);
  const paginatedMissions = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return missions.slice(startIndex, endIndex);
  }, [missions, currentPage]);

  // Filter handlers
  const handleStatusFilterChange = (filter: StatusFilter) => {
    setStatusFilter(filter);
    setCurrentPage(1);
    setIsFilterOpen(false);
  };

  const handlePriorityFilterChange = (filter: PriorityFilter) => {
    setPriorityFilter(filter);
    setCurrentPage(1);
    setIsPriorityFilterOpen(false);
  };

  const handleSortChange = (sort: SortOrder) => {
    setSortOrder(sort);
    setCurrentPage(1);
    setIsSortOpen(false);
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setPriorityFilter('all');
    setSearchQuery('');
    setSortOrder('-scheduled_start');
    setCurrentPage(1);
  };

  const hasActiveFilters = statusFilter !== 'all' || priorityFilter !== 'all' || searchQuery.trim() !== '';

  const handleAddMission = async (data: any) => {
    try {
      await missionsApi.create(data);
      setIsAddModalOpen(false);
      fetchMissions();
    } catch (err: any) {
      console.error('Error creating mission:', err);
      throw err;
    }
  };

  const handleAssignMission = (mission?: Mission) => {
    if (mission) {
      setSelectedMission(mission);
    }
    setIsAssignModalOpen(true);
    setOpenMenuId(null);
  };

  const handleAssignSuccess = () => {
    setIsAssignModalOpen(false);
    setSelectedMission(null);
    fetchMissions();
  };

  const handleTrackMission = (mission: Mission) => {
    setSelectedMission(mission);
    setIsTrackingModalOpen(true);
    setOpenMenuId(null);
  };

  const handleViewDetails = async (mission: Mission) => {
    setOpenMenuId(null);
    try {
      // Fetch full mission data from API
      const fullMission = await missionsApi.getById(mission.id);
      setSelectedMission(fullMission);
      setIsDetailsModalOpen(true);
    } catch (err) {
      console.error('Error fetching mission details:', err);
      // Fallback to list data if API fails
      setSelectedMission(mission);
      setIsDetailsModalOpen(true);
    }
  };

  const handleEdit = async (mission: Mission) => {
    setOpenMenuId(null);
    try {
      // Fetch full mission data from API
      const fullMission = await missionsApi.getById(mission.id);
      setSelectedMission(fullMission);
      setIsEditModalOpen(true);
    } catch (err) {
      console.error('Error fetching mission for edit:', err);
      // Fallback to list data if API fails
      setSelectedMission(mission);
      setIsEditModalOpen(true);
    }
  };

  const handleDelete = (mission: Mission) => {
    setSelectedMission(mission);
    setIsDeleteModalOpen(true);
    setOpenMenuId(null);
  };

  const handleEditMission = async (data: any) => {
    if (!selectedMission) return;
    try {
      await missionsApi.update(selectedMission.id, data);
      setIsEditModalOpen(false);
      setSelectedMission(null);
      fetchMissions();
    } catch (err: any) {
      console.error('Error updating mission:', err);
      throw err;
    }
  };

  const handleDeleteMission = async () => {
    if (!selectedMission) return;
    try {
      await missionsApi.delete(selectedMission.id);
      setIsDeleteModalOpen(false);
      setSelectedMission(null);
      fetchMissions();
    } catch (err: any) {
      console.error('Error deleting mission:', err);
    }
  };

  const handleCancelMission = (mission: Mission) => {
    setSelectedMission(mission);
    setIsCancelModalOpen(true);
    setOpenMenuId(null);
  };

  const handleConfirmCancel = async (reason: string) => {
    if (!selectedMission) return;
    await missionsApi.cancel(selectedMission.id, reason);
    setIsCancelModalOpen(false);
    setSelectedMission(null);
    fetchMissions();
  };

  const handleViewTripHistory = (mission: Mission) => {
    setSelectedMission(mission);
    setIsTripHistoryModalOpen(true);
    setOpenMenuId(null);
  };

  const handleStartMission = (mission: Mission) => {
    setSelectedMission(mission);
    setIsStartModalOpen(true);
    setOpenMenuId(null);
  };

  const handleConfirmStart = async (data: { startMileage: number; startFuelLevel: number }) => {
    if (!selectedMission) return;
    try {
      await missionsApi.start(selectedMission.id);
      setIsStartModalOpen(false);
      setSelectedMission(null);
      fetchMissions();
    } catch (err: any) {
      throw new Error(err.response?.data?.error || 'Impossible de demarrer la mission');
    }
  };

  const handleManageActive = (mission: Mission) => {
    setSelectedMission(mission);
    setActiveTripId((mission as any).active_trip?.id || null);
    setIsActiveModalOpen(true);
    setOpenMenuId(null);
  };

  const handleActiveComplete = () => {
    fetchMissions();
  };

  const currentSort = sortOptions.find(s => s.value === sortOrder);

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: '#1f2937' }}>
              Missions
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Gérez et suivez vos missions</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => handleAssignMission()}
              className="flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-5 py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 text-xs sm:text-base"
              style={{ backgroundColor: '#E8EFED', color: '#6A8A82' }}
            >
              <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden xs:inline">Assigner</span>
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center space-x-1.5 sm:space-x-2 text-white transition-all duration-300 hover:-translate-y-0.5 btn-primary"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Nouvelle mission</span>
              <span className="sm:hidden">Nouveau</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {statsDisplay.map((stat, index) => (
            <div key={index} className="stat-card">
              <div className="stat-accent" style={{ backgroundColor: stat.color }} />
              <div>
                <p className="stat-label">{stat.label}</p>
                <p className="stat-value" style={{ color: stat.color }}>
                  {loading ? '-' : stat.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 sm:gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 min-w-0 sm:min-w-[200px]">
            <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="soft-input w-full pl-9 sm:pl-12 pr-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-sm"
            />
          </div>

          {/* Mobile Filters Row */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Refresh Button */}
            <button
              onClick={fetchMissions}
              disabled={loading}
              className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl border transition-all hover:shadow-sm disabled:opacity-50"
              style={{ borderColor: 'rgba(0,0,0,0.08)' }}
              title="Rafraichir"
            >
              <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* Status Filter */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => {
                  setIsFilterOpen(!isFilterOpen);
                  setIsPriorityFilterOpen(false);
                  setIsSortOpen(false);
                }}
                className={`flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border font-semibold transition-all hover:shadow-sm text-xs sm:text-sm ${
                  statusFilter !== 'all' ? 'shadow-sm' : ''
                }`}
                style={{
                  borderColor: statusFilter !== 'all' ? '#6A8A82' : 'rgba(0,0,0,0.08)',
                  backgroundColor: statusFilter !== 'all' ? '#E8EFED' : '#ffffff',
                  color: statusFilter !== 'all' ? '#6A8A82' : '#6B7280'
                }}
              >
                <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Statut</span>
                {statusFilter !== 'all' && (
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#B87333' }} />
                )}
              </button>

              {isFilterOpen && (
                <div className="soft-dropdown absolute left-0 sm:right-0 sm:left-auto mt-2 w-56 sm:w-64 z-20">
                  <div className="p-2 sm:p-3">
                    <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wide text-gray-500 mb-2 sm:mb-3 px-2">Statut de la mission</p>
                    {[
                      { value: 'all', label: 'Toutes les missions', count: stats.total },
                      { value: 'pending', label: 'En attente', count: stats.by_status.pending },
                      { value: 'assigned', label: 'Assignées', count: stats.by_status.assigned },
                      { value: 'in_progress', label: 'En cours', count: stats.by_status.in_progress },
                      { value: 'completed', label: 'Terminées', count: stats.by_status.completed },
                      { value: 'cancelled', label: 'Annulées', count: stats.by_status.cancelled },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleStatusFilterChange(option.value as StatusFilter)}
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

            {/* Priority Filter */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => {
                  setIsPriorityFilterOpen(!isPriorityFilterOpen);
                  setIsFilterOpen(false);
                  setIsSortOpen(false);
                }}
                className={`flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border font-semibold transition-all hover:shadow-sm text-xs sm:text-sm ${
                  priorityFilter !== 'all' ? 'shadow-sm' : ''
                }`}
                style={{
                  borderColor: priorityFilter !== 'all' ? '#B87333' : 'rgba(0,0,0,0.08)',
                  backgroundColor: priorityFilter !== 'all' ? '#F5E8DD' : '#ffffff',
                  color: priorityFilter !== 'all' ? '#B87333' : '#6B7280'
                }}
              >
                <Flag className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Priorité</span>
                {priorityFilter !== 'all' && (
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#B87333' }} />
                )}
              </button>

              {isPriorityFilterOpen && (
                <div className="soft-dropdown absolute left-0 sm:right-0 sm:left-auto mt-2 w-48 sm:w-56 z-20">
                  <div className="p-2 sm:p-3">
                    <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wide text-gray-500 mb-2 sm:mb-3 px-2">Priorité</p>
                    {[
                      { value: 'all', label: 'Toutes', count: stats.total },
                      { value: 'urgent', label: 'Urgente', count: stats.by_priority.urgent, color: '#DC2626' },
                      { value: 'high', label: 'Haute', count: stats.by_priority.high, color: '#B87333' },
                      { value: 'medium', label: 'Moyenne', count: stats.by_priority.medium, color: '#6A8A82' },
                      { value: 'low', label: 'Faible', count: stats.by_priority.low, color: '#6B7280' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handlePriorityFilterChange(option.value as PriorityFilter)}
                        className={`w-full flex items-center justify-between px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all mb-1 ${
                          priorityFilter === option.value ? 'shadow-sm' : 'hover:bg-gray-50'
                        }`}
                        style={{
                          backgroundColor: priorityFilter === option.value ? '#F5E8DD' : 'transparent',
                          color: priorityFilter === option.value ? '#B87333' : '#1f2937'
                        }}
                      >
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          {option.color && (
                            <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full" style={{ backgroundColor: option.color }} />
                          )}
                          <span>{option.label}</span>
                        </div>
                        <span
                          className="text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full"
                          style={{
                            backgroundColor: priorityFilter === option.value ? '#B87333' : '#E8ECEC',
                            color: priorityFilter === option.value ? '#ffffff' : '#6B7280'
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

            {/* Sort Dropdown */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => {
                  setIsSortOpen(!isSortOpen);
                  setIsFilterOpen(false);
                  setIsPriorityFilterOpen(false);
                }}
                className="flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border font-semibold transition-all hover:shadow-sm text-xs sm:text-sm"
                style={{ borderColor: 'rgba(0,0,0,0.08)', color: '#6B7280' }}
              >
                <ArrowUpDown className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Trier</span>
              </button>

              {isSortOpen && (
                <div className="soft-dropdown absolute right-0 mt-2 w-56 sm:w-64 z-20">
                  <div className="p-2 sm:p-3">
                    <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wide text-gray-500 mb-2 sm:mb-3 px-2">Trier par</p>
                    {sortOptions.map((option) => {
                      const Icon = option.icon;
                      return (
                        <button
                          key={option.value}
                          onClick={() => handleSortChange(option.value as SortOrder)}
                          className={`w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all mb-1 ${
                            sortOrder === option.value ? 'shadow-sm' : 'hover:bg-gray-50'
                          }`}
                          style={{
                            backgroundColor: sortOrder === option.value ? '#E8EFED' : 'transparent',
                            color: sortOrder === option.value ? '#6A8A82' : '#1f2937'
                          }}
                        >
                          <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          <span>{option.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Active Filters Bar */}
        {hasActiveFilters && (
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <span className="text-xs sm:text-sm text-gray-500">Filtres:</span>
            {statusFilter !== 'all' && (
              <span
                className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium"
                style={{ backgroundColor: statusConfig[statusFilter].bg, color: statusConfig[statusFilter].text }}
              >
                {statusConfig[statusFilter].label}
                <button onClick={() => setStatusFilter('all')} className="hover:opacity-70">
                  <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>
              </span>
            )}
            {priorityFilter !== 'all' && (
              <span
                className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium"
                style={{ backgroundColor: priorityConfig[priorityFilter].bg, color: priorityConfig[priorityFilter].text }}
              >
                <span className="hidden xs:inline">Priorité:</span> {priorityConfig[priorityFilter].label}
                <button onClick={() => setPriorityFilter('all')} className="hover:opacity-70">
                  <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>
              </span>
            )}
            {searchQuery && (
              <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium bg-gray-100 text-gray-700">
                <span className="hidden xs:inline">Recherche:</span> "{searchQuery}"
                <button onClick={() => setSearchQuery('')} className="hover:opacity-70">
                  <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>
              </span>
            )}
            <button
              onClick={clearFilters}
              className="text-xs sm:text-sm font-medium hover:underline"
              style={{ color: '#6A8A82' }}
            >
              Effacer
            </button>
          </div>
        )}

        {/* Current Sort Indicator */}
        {currentSort && (
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-500">
            <ArrowUpDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Trié par: <span className="font-medium text-gray-700">{currentSort.label}</span></span>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-10 sm:py-16">
            <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white shadow-md border border-gray-200">
              <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" style={{ color: '#6A8A82' }} />
              <span className="text-sm font-medium text-gray-600">Chargement...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-100 rounded-lg sm:rounded-xl p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-500 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-800 text-sm sm:text-base">Erreur de chargement</h3>
              <p className="text-red-600 text-xs sm:text-sm mt-1">{error}</p>
            </div>
            <button
              onClick={fetchMissions}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-medium text-xs sm:text-sm"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && stats.total === 0 && (
          <div className="data-table-container p-8 sm:p-12 text-center">
            <MapPin className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4" style={{ color: '#6A8A82' }} />
            <h3 className="text-lg sm:text-xl font-semibold mb-2" style={{ color: '#1f2937' }}>Aucune mission</h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">Commencez par créer votre première mission</p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="text-white transition-all btn-primary"
            >
              Créer une mission
            </button>
          </div>
        )}

        {/* No Results State */}
        {!loading && !error && stats.total > 0 && missions.length === 0 && (
          <div className="data-table-container p-8 sm:p-12 text-center">
            <Search className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-gray-400" />
            <h3 className="text-lg sm:text-xl font-semibold mb-2" style={{ color: '#1f2937' }}>Aucun résultat</h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4">Aucune mission ne correspond à vos critères</p>
            <button
              onClick={clearFilters}
              className="text-xs sm:text-sm font-medium hover:underline"
              style={{ color: '#6A8A82' }}
            >
              Réinitialiser les filtres
            </button>
          </div>
        )}

        {/* Missions Display */}
        {!loading && !error && missions.length > 0 && (
          <>
            {/* Mobile Cards (< md) */}
            <div className="md:hidden space-y-3">
              {paginatedMissions.map((mission) => {
                const status = statusConfig[mission.status] || statusConfig.pending;
                return (
                  <div
                    key={mission.id}
                    className="data-card p-3 cursor-pointer"
                    style={{ borderLeftColor: status.dot, borderLeftWidth: 4 }}
                    onClick={() => handleViewDetails(mission)}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold truncate" style={{ color: '#1f2937' }}>{mission.title}</h3>
                        <p className="text-[10px] font-medium" style={{ color: '#6A8A82' }}>{mission.mission_code}</p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                          style={{ backgroundColor: status.bg, color: status.text }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: status.dot }} />
                          {status.label}
                        </span>
                        <div className="relative" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setOpenMenuId(openMenuId === mission.id ? null : mission.id)}
                            className="p-1 rounded-lg"
                            style={{ backgroundColor: '#E8EFED', color: '#6A8A82' }}
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>
                          {openMenuId === mission.id && (
                            <div className="soft-dropdown absolute right-0 top-full mt-1 w-44 overflow-hidden z-20">
                              <button onClick={() => handleViewDetails(mission)} className="w-full flex items-center space-x-2 px-3 py-2 hover:bg-gray-50 text-left">
                                <Eye className="w-3.5 h-3.5" style={{ color: '#6A8A82' }} />
                                <span className="text-xs font-medium" style={{ color: '#1f2937' }}>Détails</span>
                              </button>
                              <button onClick={() => handleEdit(mission)} className="w-full flex items-center space-x-2 px-3 py-2 hover:bg-gray-50 text-left border-t" style={{ borderColor: '#E8ECEC' }}>
                                <Edit className="w-3.5 h-3.5" style={{ color: '#B87333' }} />
                                <span className="text-xs font-medium" style={{ color: '#1f2937' }}>Modifier</span>
                              </button>
                              {mission.status === 'pending' && (
                                <button onClick={() => handleAssignMission(mission)} className="w-full flex items-center space-x-2 px-3 py-2 hover:bg-blue-50 text-left border-t" style={{ borderColor: '#E8ECEC' }}>
                                  <UserPlus className="w-3.5 h-3.5 text-blue-600" />
                                  <span className="text-xs font-medium text-blue-600">Assigner</span>
                                </button>
                              )}
                              {mission.status === 'assigned' && (
                                <button onClick={() => handleStartMission(mission)} className="w-full flex items-center space-x-2 px-3 py-2 hover:bg-green-50 text-left border-t" style={{ borderColor: '#E8ECEC' }}>
                                  <Play className="w-3.5 h-3.5 text-green-600" />
                                  <span className="text-xs font-medium text-green-600">Démarrer</span>
                                </button>
                              )}
                              {mission.status === 'in_progress' && (
                                <>
                                  <button onClick={() => handleTrackMission(mission)} className="w-full flex items-center space-x-2 px-3 py-2 hover:bg-teal-50 text-left border-t" style={{ borderColor: '#E8ECEC' }}>
                                    <Radio className="w-3.5 h-3.5" style={{ color: '#6A8A82' }} />
                                    <span className="text-xs font-medium" style={{ color: '#6A8A82' }}>Suivi GPS</span>
                                  </button>
                                  <button onClick={() => handleManageActive(mission)} className="w-full flex items-center space-x-2 px-3 py-2 hover:bg-amber-50 text-left border-t" style={{ borderColor: '#E8ECEC' }}>
                                    <Pause className="w-3.5 h-3.5 text-amber-600" />
                                    <span className="text-xs font-medium text-amber-600">Pause</span>
                                  </button>
                                </>
                              )}
                              {(mission.status === 'pending' || mission.status === 'assigned' || mission.status === 'in_progress') && (
                                <button onClick={() => handleCancelMission(mission)} className="w-full flex items-center space-x-2 px-3 py-2 hover:bg-red-50 text-left border-t" style={{ borderColor: '#E8ECEC' }}>
                                  <XCircle className="w-3.5 h-3.5 text-red-500" />
                                  <span className="text-xs font-medium text-red-500">Annuler</span>
                                </button>
                              )}
                              {mission.status === 'completed' && (
                                <button onClick={() => handleViewTripHistory(mission)} className="w-full flex items-center space-x-2 px-3 py-2 hover:bg-blue-50 text-left border-t" style={{ borderColor: '#E8ECEC' }}>
                                  <Route className="w-3.5 h-3.5 text-blue-600" />
                                  <span className="text-xs font-medium text-blue-600">Historique</span>
                                </button>
                              )}
                              <button onClick={() => handleDelete(mission)} className="w-full flex items-center space-x-2 px-3 py-2 hover:bg-red-50 text-left border-t" style={{ borderColor: '#E8ECEC' }}>
                                <Trash2 className="w-3.5 h-3.5 text-red-600" />
                                <span className="text-xs font-medium text-red-600">Supprimer</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        <span className="text-gray-500">Début:</span>
                        <span className="font-medium truncate" style={{ color: '#1f2937' }}>
                          {new Date(mission.scheduled_start).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                          {' '}
                          {new Date(mission.scheduled_start).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        <span className="text-gray-500">Fin:</span>
                        <span className="font-medium truncate" style={{ color: '#1f2937' }}>
                          {new Date(mission.scheduled_end).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                          {' '}
                          {new Date(mission.scheduled_end).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <User className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        <span className="font-medium truncate" style={{ color: '#1f2937' }}>{mission.driver_name || '—'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Car className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        <span className="font-medium truncate" style={{ color: '#1f2937' }}>{mission.vehicle_plate || '—'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 col-span-2">
                        <MapPin className="w-3 h-3 flex-shrink-0" style={{ color: '#6A8A82' }} />
                        <span className="truncate" style={{ color: '#1f2937' }}>{mission.origin_address || '—'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 col-span-2">
                        <MapPin className="w-3 h-3 flex-shrink-0" style={{ color: '#B87333' }} />
                        <span className="truncate" style={{ color: '#1f2937' }}>{mission.destination_address || '—'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table (>= md) */}
            <div className="hidden md:block data-table-container overflow-hidden">
              <div className="overflow-x-auto">
                <table className="data-table w-full">
                  <thead>
                    <tr>
                      <th>Statut</th>
                      <th>Mission</th>
                      <th>Début</th>
                      <th>Fin</th>
                      <th>Chauffeur</th>
                      <th className="hidden lg:table-cell">Véhicule</th>
                      <th className="hidden xl:table-cell">Départ</th>
                      <th className="hidden xl:table-cell">Arrivée</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedMissions.map((mission) => {
                      const status = statusConfig[mission.status] || statusConfig.pending;
                      return (
                        <tr
                          key={mission.id}
                          className="cursor-pointer"
                          onClick={() => handleViewDetails(mission)}
                        >
                          <td>
                            <span
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
                              style={{ backgroundColor: status.bg, color: status.text }}
                            >
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: status.dot }} />
                              {status.label}
                            </span>
                          </td>
                          <td>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold truncate max-w-[200px]" style={{ color: '#1f2937' }}>{mission.title}</p>
                              <p className="text-xs truncate max-w-[200px]" style={{ color: '#6A8A82' }}>{mission.mission_code}</p>
                            </div>
                          </td>
                          <td className="whitespace-nowrap">
                            <p className="text-sm" style={{ color: '#1f2937' }}>
                              {new Date(mission.scheduled_start).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                            </p>
                            <p className="text-xs text-gray-400">
                              {new Date(mission.scheduled_start).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </td>
                          <td className="whitespace-nowrap">
                            <p className="text-sm" style={{ color: '#1f2937' }}>
                              {new Date(mission.scheduled_end).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                            </p>
                            <p className="text-xs text-gray-400">
                              {new Date(mission.scheduled_end).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </td>
                          <td>
                            <p className="text-sm truncate max-w-[120px]" style={{ color: '#1f2937' }}>{mission.driver_name || '—'}</p>
                          </td>
                          <td className="hidden lg:table-cell">
                            <p className="text-sm truncate max-w-[100px]" style={{ color: '#1f2937' }}>{mission.vehicle_plate || '—'}</p>
                          </td>
                          <td className="hidden xl:table-cell">
                            <p className="text-sm truncate max-w-[180px]" style={{ color: '#1f2937' }}>{mission.origin_address || '—'}</p>
                          </td>
                          <td className="hidden xl:table-cell">
                            <p className="text-sm truncate max-w-[180px]" style={{ color: '#1f2937' }}>{mission.destination_address || '—'}</p>
                          </td>
                          <td className="text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="relative inline-block">
                              <button
                                onClick={() => setOpenMenuId(openMenuId === mission.id ? null : mission.id)}
                                className="p-1.5 rounded-lg transition-all hover:shadow-sm"
                                style={{ backgroundColor: '#E8EFED', color: '#6A8A82' }}
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>

                              {openMenuId === mission.id && (
                                <div className="soft-dropdown absolute right-0 top-full mt-1 w-48 overflow-hidden z-20">
                                  <button
                                    onClick={() => handleViewDetails(mission)}
                                    className="w-full flex items-center space-x-2 px-4 py-2.5 hover:bg-gray-50 transition-all text-left"
                                  >
                                    <Eye className="w-4 h-4" style={{ color: '#6A8A82' }} />
                                    <span className="text-sm font-medium" style={{ color: '#1f2937' }}>Détails</span>
                                  </button>
                                  <button
                                    onClick={() => handleEdit(mission)}
                                    className="w-full flex items-center space-x-2 px-4 py-2.5 hover:bg-gray-50 transition-all text-left border-t"
                                    style={{ borderColor: '#E8ECEC' }}
                                  >
                                    <Edit className="w-4 h-4" style={{ color: '#B87333' }} />
                                    <span className="text-sm font-medium" style={{ color: '#1f2937' }}>Modifier</span>
                                  </button>
                                  {mission.status === 'pending' && (
                                    <button
                                      onClick={() => handleAssignMission(mission)}
                                      className="w-full flex items-center space-x-2 px-4 py-2.5 hover:bg-blue-50 transition-all text-left border-t"
                                      style={{ borderColor: '#E8ECEC' }}
                                    >
                                      <UserPlus className="w-4 h-4 text-blue-600" />
                                      <span className="text-sm font-medium text-blue-600">Assigner</span>
                                    </button>
                                  )}
                                  {mission.status === 'assigned' && (
                                    <button
                                      onClick={() => handleStartMission(mission)}
                                      className="w-full flex items-center space-x-2 px-4 py-2.5 hover:bg-green-50 transition-all text-left border-t"
                                      style={{ borderColor: '#E8ECEC' }}
                                    >
                                      <Play className="w-4 h-4 text-green-600" />
                                      <span className="text-sm font-medium text-green-600">Démarrer</span>
                                    </button>
                                  )}
                                  {mission.status === 'in_progress' && (
                                    <>
                                      <button
                                        onClick={() => handleTrackMission(mission)}
                                        className="w-full flex items-center space-x-2 px-4 py-2.5 hover:bg-teal-50 transition-all text-left border-t"
                                        style={{ borderColor: '#E8ECEC' }}
                                      >
                                        <Radio className="w-4 h-4" style={{ color: '#6A8A82' }} />
                                        <span className="text-sm font-medium" style={{ color: '#6A8A82' }}>Suivi GPS</span>
                                      </button>
                                      <button
                                        onClick={() => handleManageActive(mission)}
                                        className="w-full flex items-center space-x-2 px-4 py-2.5 hover:bg-amber-50 transition-all text-left border-t"
                                        style={{ borderColor: '#E8ECEC' }}
                                      >
                                        <Pause className="w-4 h-4 text-amber-600" />
                                        <span className="text-sm font-medium text-amber-600">Pause</span>
                                      </button>
                                    </>
                                  )}
                                  {(mission.status === 'pending' || mission.status === 'assigned' || mission.status === 'in_progress') && (
                                    <button
                                      onClick={() => handleCancelMission(mission)}
                                      className="w-full flex items-center space-x-2 px-4 py-2.5 hover:bg-red-50 transition-all text-left border-t"
                                      style={{ borderColor: '#E8ECEC' }}
                                    >
                                      <XCircle className="w-4 h-4 text-red-500" />
                                      <span className="text-sm font-medium text-red-500">Annuler</span>
                                    </button>
                                  )}
                                  {mission.status === 'completed' && (
                                    <button
                                      onClick={() => handleViewTripHistory(mission)}
                                      className="w-full flex items-center space-x-2 px-4 py-2.5 hover:bg-blue-50 transition-all text-left border-t"
                                      style={{ borderColor: '#E8ECEC' }}
                                    >
                                      <Route className="w-4 h-4 text-blue-600" />
                                      <span className="text-sm font-medium text-blue-600">Historique</span>
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleDelete(mission)}
                                    className="w-full flex items-center space-x-2 px-4 py-2.5 hover:bg-red-50 transition-all text-left border-t"
                                    style={{ borderColor: '#E8ECEC' }}
                                  >
                                    <Trash2 className="w-4 h-4 text-red-600" />
                                    <span className="text-sm font-medium text-red-600">Supprimer</span>
                                  </button>
                                </div>
                              )}
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
        )}

        {/* Pagination */}
        {!loading && !error && missions.length > 0 && totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={missions.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* Modals */}
      <AddMissionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddMission}
      />

      <AssignMissionModal
        isOpen={isAssignModalOpen}
        onClose={() => {
          setIsAssignModalOpen(false);
          setSelectedMission(null);
        }}
        onSuccess={handleAssignSuccess}
        preselectedMission={selectedMission}
      />

      <MissionTrackingModal
        isOpen={isTrackingModalOpen}
        onClose={() => {
          setIsTrackingModalOpen(false);
          setSelectedMission(null);
        }}
        mission={selectedMission}
      />

      <MissionDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedMission(null);
        }}
        mission={selectedMission}
        statusConfig={statusConfig}
        priorityConfig={priorityConfig}
      />

      <EditMissionModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedMission(null);
        }}
        onSubmit={handleEditMission}
        mission={selectedMission}
      />

      <DeleteMissionModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedMission(null);
        }}
        onConfirm={handleDeleteMission}
        mission={selectedMission}
      />

      <StartMissionModal
        isOpen={isStartModalOpen}
        onClose={() => {
          setIsStartModalOpen(false);
          setSelectedMission(null);
        }}
        onStart={handleConfirmStart}
        mission={selectedMission}
      />

      <ActiveMissionModal
        isOpen={isActiveModalOpen}
        onClose={() => {
          setIsActiveModalOpen(false);
          setSelectedMission(null);
          setActiveTripId(null);
        }}
        mission={selectedMission}
        tripId={activeTripId}
        onComplete={handleActiveComplete}
      />

      <CancelMissionModal
        isOpen={isCancelModalOpen}
        onClose={() => {
          setIsCancelModalOpen(false);
          setSelectedMission(null);
        }}
        onConfirm={handleConfirmCancel}
        mission={selectedMission}
      />

      <TripHistoryModal
        isOpen={isTripHistoryModalOpen}
        onClose={() => {
          setIsTripHistoryModalOpen(false);
          setSelectedMission(null);
        }}
        mission={selectedMission}
      />
    </Layout>
  );
}
