import { useState, useEffect, useCallback } from 'react';
import {
  History,
  ChevronDown,
  ChevronRight,
  Wrench,
  Car,
  Calendar,
  DollarSign,
  Package,
  User,
  MapPin,
  Gauge,
  TrendingUp,
  PieChart,
  BarChart3,
  Loader2,
  Filter,
  X
} from 'lucide-react';
import { maintenanceApi, type HistoryResponse, type HistoryIntervention, type TypeStats, type MonthlyCosts } from '@/api/maintenance';
import { vehicleApi, type Vehicle } from '@/api/vehicles';

interface MaintenanceHistoryProps {
  onInterventionClick?: (intervention: HistoryIntervention) => void;
}

export default function MaintenanceHistory({ onInterventionClick }: MaintenanceHistoryProps) {
  const [historyData, setHistoryData] = useState<HistoryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<number | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [showVehicleFilter, setShowVehicleFilter] = useState(false);

  const typeConfig: Record<string, { bg: string; text: string; icon: string }> = {
    oil_change: { bg: '#E8EFED', text: '#6A8A82', icon: '🛢️' },
    tire_change: { bg: '#F5E8DD', text: '#B87333', icon: '🔧' },
    brake_service: { bg: '#FEE2E2', text: '#DC2626', icon: '🛑' },
    inspection: { bg: '#F3E8FF', text: '#7C3AED', icon: '🔍' },
    repair: { bg: '#FFEDD5', text: '#EA580C', icon: '🔨' },
    preventive: { bg: '#D1FAE5', text: '#059669', icon: '✅' },
    other: { bg: '#E8ECEC', text: '#6B7280', icon: '📋' },
  };

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await maintenanceApi.getHistory(selectedVehicle || undefined);
      setHistoryData(response);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedVehicle]);

  const fetchVehicles = async () => {
    try {
      const response = await vehicleApi.getAll();
      setVehicles(response.results || response);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    }
  };

  useEffect(() => {
    fetchHistory();
    fetchVehicles();
  }, [fetchHistory]);

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl sm:rounded-2xl border-2 p-6 sm:p-8" style={{ borderColor: '#E8ECEC' }}>
        <div className="flex items-center justify-center">
          <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin" style={{ color: '#6A8A82' }} />
        </div>
      </div>
    );
  }

  if (!historyData || historyData.count === 0) {
    return (
      <div className="bg-white rounded-xl sm:rounded-2xl border-2 p-6 sm:p-8 text-center" style={{ borderColor: '#E8ECEC' }}>
        <div
          className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4"
          style={{ backgroundColor: '#E8EFED' }}
        >
          <History className="w-6 h-6 sm:w-8 sm:h-8" style={{ color: '#6A8A82' }} />
        </div>
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2">Aucun historique</h3>
        <p className="text-sm sm:text-base text-gray-500">
          Les interventions terminées apparaîtront ici
        </p>
      </div>
    );
  }

  const { interventions, cumulative_costs, by_type, monthly_costs } = historyData;

  // Calculate max cost for bar chart scaling
  const maxMonthlyCost = Math.max(...monthly_costs.map(m => m.total_cost), 1);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with Cumulative Costs */}
      <div className="bg-white rounded-xl sm:rounded-2xl border-2 overflow-hidden" style={{ borderColor: '#E8ECEC' }}>
        <div className="px-3 sm:px-6 py-3 sm:py-4 border-b-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0" style={{ borderColor: '#E8ECEC' }}>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: '#E8EFED' }}
            >
              <History className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#6A8A82' }} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold" style={{ color: '#191919' }}>
                Historique des Interventions
              </h3>
              <p className="text-xs sm:text-sm text-gray-500">
                {historyData.count} intervention{historyData.count > 1 ? 's' : ''} terminée{historyData.count > 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Vehicle Filter */}
          <div className="relative w-full sm:w-auto">
            <button
              onClick={() => setShowVehicleFilter(!showVehicleFilter)}
              className={`flex items-center justify-between sm:justify-start space-x-2 w-full sm:w-auto px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm transition-all ${
                selectedVehicle ? 'shadow-md' : 'hover:shadow-md'
              }`}
              style={{
                backgroundColor: selectedVehicle ? '#E8EFED' : '#F8FAF9',
                color: selectedVehicle ? '#6A8A82' : '#6B7280',
                borderWidth: '2px',
                borderColor: selectedVehicle ? '#6A8A82' : '#E8ECEC'
              }}
            >
              <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="truncate">
                {selectedVehicle
                  ? vehicles.find(v => v.id === selectedVehicle)?.license_plate || 'Véhicule'
                  : 'Tous les véhicules'
                }
              </span>
              {selectedVehicle && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedVehicle(null);
                  }}
                  className="ml-1 p-0.5 rounded-full hover:bg-gray-200"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </button>

            {showVehicleFilter && (
              <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 w-full sm:w-64 bg-white rounded-xl border-2 shadow-xl z-10 max-h-64 overflow-y-auto" style={{ borderColor: '#E8ECEC' }}>
                <div className="p-2">
                  <button
                    onClick={() => {
                      setSelectedVehicle(null);
                      setShowVehicleFilter(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                      !selectedVehicle ? 'bg-gray-100 font-semibold' : 'hover:bg-gray-50'
                    }`}
                  >
                    Tous les véhicules
                  </button>
                  {vehicles.map((vehicle) => (
                    <button
                      key={vehicle.id}
                      onClick={() => {
                        setSelectedVehicle(vehicle.id);
                        setShowVehicleFilter(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                        selectedVehicle === vehicle.id ? 'bg-gray-100 font-semibold' : 'hover:bg-gray-50'
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

        {/* Cumulative Costs Cards */}
        <div className="grid grid-cols-3 sm:divide-x-2" style={{ borderColor: '#E8ECEC' }}>
          <div className="p-2 sm:p-5 text-center border-r sm:border-r-0" style={{ borderColor: '#E8ECEC' }}>
            <div className="flex flex-col sm:flex-row items-center justify-center sm:space-x-2 mb-1 sm:mb-2">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center mb-1 sm:mb-0" style={{ backgroundColor: '#E8EFED' }}>
                <User className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: '#6A8A82' }} />
              </div>
              <span className="text-[10px] sm:text-sm font-medium text-gray-600">Main d'oeuvre</span>
            </div>
            <p className="text-sm sm:text-2xl font-bold" style={{ color: '#6A8A82' }}>
              ${cumulative_costs.labor_cost.toFixed(2)}
            </p>
          </div>
          <div className="p-2 sm:p-5 text-center border-r sm:border-r-0" style={{ borderColor: '#E8ECEC' }}>
            <div className="flex flex-col sm:flex-row items-center justify-center sm:space-x-2 mb-1 sm:mb-2">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center mb-1 sm:mb-0" style={{ backgroundColor: '#F5E8DD' }}>
                <Package className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: '#B87333' }} />
              </div>
              <span className="text-[10px] sm:text-sm font-medium text-gray-600">Pièces</span>
            </div>
            <p className="text-sm sm:text-2xl font-bold" style={{ color: '#B87333' }}>
              ${cumulative_costs.parts_cost.toFixed(2)}
            </p>
          </div>
          <div className="p-2 sm:p-5 text-center" style={{ backgroundColor: '#F8FAF9' }}>
            <div className="flex flex-col sm:flex-row items-center justify-center sm:space-x-2 mb-1 sm:mb-2">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center mb-1 sm:mb-0" style={{ backgroundColor: '#DBEAFE' }}>
                <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: '#1E40AF' }} />
              </div>
              <span className="text-[10px] sm:text-sm font-medium text-gray-600 whitespace-nowrap">Total Cumulé</span>
            </div>
            <p className="text-base sm:text-3xl font-bold" style={{ color: '#1E40AF' }}>
              ${cumulative_costs.total_cost.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Statistics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* By Type Chart */}
        <div className="bg-white rounded-xl sm:rounded-2xl border-2 p-3 sm:p-5" style={{ borderColor: '#E8ECEC' }}>
          <div className="flex items-center space-x-2 mb-3 sm:mb-4">
            <PieChart className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#6A8A82' }} />
            <h4 className="font-bold text-sm sm:text-base" style={{ color: '#191919' }}>Répartition par Type</h4>
          </div>
          <div className="space-y-2 sm:space-y-3">
            {by_type.map((type, index) => {
              const config = typeConfig[Object.keys(typeConfig).find(k =>
                type.label.toLowerCase().includes(k.replace('_', ' ')) ||
                k === 'other'
              ) || 'other'];
              const percentage = (type.total_cost / cumulative_costs.total_cost) * 100 || 0;

              return (
                <div key={index} className="flex items-center space-x-2 sm:space-x-3">
                  <div
                    className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-xs sm:text-sm flex-shrink-0"
                    style={{ backgroundColor: config.bg }}
                  >
                    {config.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-xs sm:text-sm mb-0.5 sm:mb-1">
                      <span className="font-medium truncate" style={{ color: '#191919' }}>{type.label}</span>
                      <span className="text-gray-500 ml-2">{type.count}x</span>
                    </div>
                    <div className="h-1.5 sm:h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#E8ECEC' }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${percentage}%`, backgroundColor: config.text }}
                      />
                    </div>
                  </div>
                  <span className="text-xs sm:text-sm font-bold flex-shrink-0" style={{ color: config.text }}>
                    ${type.total_cost.toFixed(0)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Monthly Costs Chart */}
        <div className="bg-white rounded-xl sm:rounded-2xl border-2 p-3 sm:p-5" style={{ borderColor: '#E8ECEC' }}>
          <div className="flex items-center space-x-2 mb-3 sm:mb-4">
            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#B87333' }} />
            <h4 className="font-bold text-sm sm:text-base" style={{ color: '#191919' }}>Coûts Mensuels</h4>
          </div>
          {monthly_costs.length > 0 ? (
            <div className="flex items-end space-x-1 sm:space-x-2 h-32 sm:h-40">
              {monthly_costs.map((month, index) => {
                const height = (month.total_cost / maxMonthlyCost) * 100;
                const laborHeight = month.labor_cost / month.total_cost * height || 0;
                const partsHeight = month.parts_cost / month.total_cost * height || 0;

                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div className="w-full flex flex-col-reverse rounded-t-lg overflow-hidden" style={{ height: `${Math.max(height, 5)}%` }}>
                      <div style={{ height: `${laborHeight}%`, backgroundColor: '#6A8A82' }} />
                      <div style={{ height: `${partsHeight}%`, backgroundColor: '#B87333' }} />
                    </div>
                    <div className="mt-1 sm:mt-2 text-center">
                      <p className="text-[9px] sm:text-xs font-medium text-gray-600 truncate" style={{ maxWidth: '40px' }}>
                        {month.month.split(' ')[0].slice(0, 3)}
                      </p>
                      <p className="text-[9px] sm:text-xs font-bold" style={{ color: '#1E40AF' }}>
                        ${month.total_cost.toFixed(0)}
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
          {monthly_costs.length > 0 && (
            <div className="flex items-center justify-center space-x-3 sm:space-x-4 mt-3 sm:mt-4 pt-2 sm:pt-3 border-t" style={{ borderColor: '#E8ECEC' }}>
              <div className="flex items-center space-x-1 sm:space-x-1.5">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded" style={{ backgroundColor: '#6A8A82' }} />
                <span className="text-[10px] sm:text-xs text-gray-600">Main d'oeuvre</span>
              </div>
              <div className="flex items-center space-x-1 sm:space-x-1.5">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded" style={{ backgroundColor: '#B87333' }} />
                <span className="text-[10px] sm:text-xs text-gray-600">Pièces</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Interventions List */}
      <div className="bg-white rounded-xl sm:rounded-2xl border-2 overflow-hidden" style={{ borderColor: '#E8ECEC' }}>
        <div className="px-3 sm:px-6 py-3 sm:py-4 border-b-2" style={{ borderColor: '#E8ECEC' }}>
          <h4 className="font-bold text-sm sm:text-base" style={{ color: '#191919' }}>Liste des Interventions</h4>
        </div>

        <div className="divide-y-2" style={{ borderColor: '#E8ECEC' }}>
          {interventions.map((intervention) => {
            const isExpanded = expandedId === intervention.id;
            const config = typeConfig[intervention.maintenance_type] || typeConfig.other;

            return (
              <div key={intervention.id} className="hover:bg-gray-50 transition-colors">
                {/* Main Row */}
                <div
                  className="p-3 sm:p-4 cursor-pointer"
                  onClick={() => toggleExpand(intervention.id)}
                >
                  <div className="flex items-start sm:items-center space-x-2 sm:space-x-4">
                    {/* Expand Arrow */}
                    <button className="p-0.5 sm:p-1 rounded hover:bg-gray-100 transition-colors mt-1 sm:mt-0">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                      )}
                    </button>

                    {/* Type Icon */}
                    <div
                      className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center text-base sm:text-xl flex-shrink-0"
                      style={{ backgroundColor: config.bg }}
                    >
                      {config.icon}
                    </div>

                    {/* Info - Mobile layout */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-0.5 sm:mb-1">
                        <h5 className="font-bold text-sm sm:text-base" style={{ color: '#191919' }}>
                          {intervention.maintenance_type_display}
                        </h5>
                        <span
                          className="px-1.5 sm:px-2 py-0.5 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-semibold"
                          style={{ backgroundColor: config.bg, color: config.text }}
                        >
                          {intervention.vehicle_plate}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 line-clamp-1 hidden sm:block">{intervention.description}</p>

                      {/* Mobile: Date & Cost inline */}
                      <div className="flex items-center justify-between mt-1 sm:hidden">
                        <div className="flex items-center space-x-1 text-gray-500 text-[10px]">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {intervention.completed_date
                              ? new Date(intervention.completed_date).toLocaleDateString('fr-FR', {
                                  day: '2-digit',
                                  month: 'short'
                                })
                              : 'N/A'
                            }
                          </span>
                        </div>
                        <p className="text-sm font-bold" style={{ color: '#1E40AF' }}>
                          ${intervention.total_cost.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Date & Cost - Desktop */}
                    <div className="hidden sm:flex items-center space-x-6 flex-shrink-0">
                      <div className="text-right">
                        <div className="flex items-center space-x-1.5 text-gray-500 text-sm">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {intervention.completed_date
                              ? new Date(intervention.completed_date).toLocaleDateString('fr-FR', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric'
                                })
                              : 'N/A'
                            }
                          </span>
                        </div>
                      </div>
                      <div className="text-right min-w-[100px]">
                        <p className="text-lg font-bold" style={{ color: '#1E40AF' }}>
                          ${intervention.total_cost.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-0">
                    <div className="ml-6 sm:ml-14 pl-3 sm:pl-4 border-l-2 space-y-3 sm:space-y-4" style={{ borderColor: '#E8ECEC' }}>
                      {/* Vehicle Info */}
                      <div className="flex flex-wrap items-center gap-3 sm:gap-6">
                        <div className="flex items-center space-x-1.5 sm:space-x-2">
                          <Car className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: '#6A8A82' }} />
                          <span className="text-xs sm:text-sm text-gray-600">
                            {intervention.vehicle_brand} {intervention.vehicle_model}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1.5 sm:space-x-2">
                          <Gauge className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: '#B87333' }} />
                          <span className="text-xs sm:text-sm text-gray-600">
                            {intervention.mileage_at_service.toLocaleString()} km
                          </span>
                        </div>
                        {intervention.service_provider && (
                          <div className="flex items-center space-x-1.5 sm:space-x-2">
                            <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: '#6A8A82' }} />
                            <span className="text-xs sm:text-sm text-gray-600">
                              {intervention.service_provider}
                            </span>
                          </div>
                        )}
                        {intervention.technician_name && (
                          <div className="flex items-center space-x-1.5 sm:space-x-2">
                            <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: '#6B7280' }} />
                            <span className="text-xs sm:text-sm text-gray-600">
                              {intervention.technician_name}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Work Performed */}
                      {intervention.work_performed && (
                        <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl" style={{ backgroundColor: '#F8FAF9' }}>
                          <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                            Travaux effectués
                          </p>
                          <p className="text-xs sm:text-sm text-gray-700">{intervention.work_performed}</p>
                        </div>
                      )}

                      {/* Parts Replaced */}
                      {intervention.parts_replaced.length > 0 && (
                        <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl" style={{ backgroundColor: '#F5E8DD20' }}>
                          <div className="flex items-center space-x-1.5 sm:space-x-2 mb-2">
                            <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: '#B87333' }} />
                            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide" style={{ color: '#B87333' }}>
                              Pièces remplacées ({intervention.parts_replaced.length})
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-1.5 sm:gap-2">
                            {intervention.parts_replaced.map((part, idx) => (
                              <span
                                key={idx}
                                className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-xs sm:text-sm font-medium"
                                style={{ backgroundColor: '#F5E8DD', color: '#B87333' }}
                              >
                                {part}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Cost Breakdown */}
                      <div className="grid grid-cols-3 gap-2 sm:gap-3">
                        <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl text-center" style={{ backgroundColor: '#E8EFED' }}>
                          <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1">Main d'oeuvre</p>
                          <p className="font-bold text-xs sm:text-base" style={{ color: '#6A8A82' }}>
                            ${intervention.labor_cost.toFixed(2)}
                          </p>
                        </div>
                        <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl text-center" style={{ backgroundColor: '#F5E8DD' }}>
                          <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1">Pièces</p>
                          <p className="font-bold text-xs sm:text-base" style={{ color: '#B87333' }}>
                            ${intervention.parts_cost.toFixed(2)}
                          </p>
                        </div>
                        <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl text-center" style={{ backgroundColor: '#DBEAFE' }}>
                          <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1">Total</p>
                          <p className="font-bold text-xs sm:text-base" style={{ color: '#1E40AF' }}>
                            ${intervention.total_cost.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {/* Next Service Mileage */}
                      {intervention.next_service_mileage && (
                        <div className="flex items-center space-x-1.5 sm:space-x-2 text-xs sm:text-sm">
                          <Wrench className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
                          <span className="text-gray-500">
                            Prochaine maintenance à {intervention.next_service_mileage.toLocaleString()} km
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
