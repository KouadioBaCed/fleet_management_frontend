import { useState, useEffect } from 'react';
import {
  Gauge,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Car,
  Fuel,
  Award,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  PieChart,
  Loader2,
  ChevronDown,
  ChevronUp,
  Zap,
  MapPin
} from 'lucide-react';
import { fuelApi, type AnalyticsResponse, type VehicleAnalytics } from '@/api/fuel';
import { useCurrency } from '@/store/settingsStore';
import { getCurrencySymbol } from '@/api/settings';

const FUEL_TYPE_CONFIG: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  gasoline: { label: 'Essence', icon: '⛽', color: '#6A8A82', bg: '#E8EFED' },
  diesel: { label: 'Diesel', icon: '🛢️', color: '#B87333', bg: '#F5E8DD' },
  electric: { label: 'Électrique', icon: '⚡', color: '#3B82F6', bg: '#DBEAFE' },
  hybrid: { label: 'Hybride', icon: '🔋', color: '#059669', bg: '#D1FAE5' },
};

const VEHICLE_TYPE_CONFIG: Record<string, { label: string; icon: string }> = {
  sedan: { label: 'Berline', icon: '🚗' },
  suv: { label: 'SUV', icon: '🚙' },
  van: { label: 'Utilitaire', icon: '🚐' },
  truck: { label: 'Camion', icon: '🚛' },
};

const STATUS_CONFIG = {
  efficient: { label: 'Efficace', color: '#059669', bg: '#D1FAE5', icon: CheckCircle },
  warning: { label: 'Attention', color: '#D97706', bg: '#FEF3C7', icon: AlertTriangle },
  critical: { label: 'Critique', color: '#DC2626', bg: '#FEE2E2', icon: AlertTriangle },
};

export default function FuelAnalytics() {
  const currency = useCurrency();
  const currencySymbol = getCurrencySymbol(currency);

  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedVehicle, setExpandedVehicle] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'consumption' | 'cost_per_km' | 'efficiency'>('efficiency');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const data = await fuelApi.getAnalytics();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#6A8A82' }} />
      </div>
    );
  }

  if (!analytics || analytics.vehicles.length === 0) {
    return (
      <div className="bg-white rounded-xl sm:rounded-2xl border-2 p-8 sm:p-12 text-center" style={{ borderColor: '#E8ECEC' }}>
        <div
          className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4"
          style={{ backgroundColor: '#E8EFED' }}
        >
          <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8" style={{ color: '#6A8A82' }} />
        </div>
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2">Pas de données d'analyse</h3>
        <p className="text-sm sm:text-base text-gray-500">
          Enregistrez des ravitaillements pour voir les analyses de consommation
        </p>
      </div>
    );
  }

  const { vehicles, fleet_summary, comparison } = analytics;

  // Sort vehicles based on selection
  const sortedVehicles = [...vehicles].sort((a, b) => {
    if (sortBy === 'consumption') {
      return a.avg_consumption - b.avg_consumption;
    } else if (sortBy === 'cost_per_km') {
      return a.cost_per_km - b.cost_per_km;
    } else {
      return b.efficiency_ratio - a.efficiency_ratio;
    }
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Fleet Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        <div className="bg-white rounded-lg sm:rounded-xl border-2 p-3 sm:p-5" style={{ borderColor: '#6A8A82' }}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center sm:space-x-3 mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center mb-1 sm:mb-0" style={{ backgroundColor: '#E8EFED' }}>
              <Gauge className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#6A8A82' }} />
            </div>
            <span className="text-[10px] sm:text-sm font-medium text-gray-600">Conso. Moyenne</span>
          </div>
          <p className="text-xl sm:text-3xl font-bold" style={{ color: '#6A8A82' }}>
            {fleet_summary.avg_consumption.toFixed(1)}
          </p>
          <p className="text-xs sm:text-sm text-gray-500">L/100km</p>
        </div>

        <div className="bg-white rounded-lg sm:rounded-xl border-2 p-3 sm:p-5" style={{ borderColor: '#B87333' }}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center sm:space-x-3 mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center mb-1 sm:mb-0" style={{ backgroundColor: '#F5E8DD' }}>
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#B87333' }} />
            </div>
            <span className="text-[10px] sm:text-sm font-medium text-gray-600">Coût/km</span>
          </div>
          <p className="text-xl sm:text-3xl font-bold" style={{ color: '#B87333' }}>
            {fleet_summary.cost_per_km.toFixed(3)}
          </p>
          <p className="text-xs sm:text-sm text-gray-500">{currencySymbol}/km</p>
        </div>

        <div className="bg-white rounded-lg sm:rounded-xl border-2 p-3 sm:p-5" style={{ borderColor: '#3B82F6' }}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center sm:space-x-3 mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center mb-1 sm:mb-0" style={{ backgroundColor: '#DBEAFE' }}>
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#3B82F6' }} />
            </div>
            <span className="text-[10px] sm:text-sm font-medium text-gray-600">Distance</span>
          </div>
          <p className="text-xl sm:text-3xl font-bold" style={{ color: '#3B82F6' }}>
            {(fleet_summary.total_distance / 1000).toFixed(1)}k
          </p>
          <p className="text-xs sm:text-sm text-gray-500">km</p>
        </div>

        <div className="bg-white rounded-lg sm:rounded-xl border-2 p-3 sm:p-5" style={{ borderColor: '#7C3AED' }}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center sm:space-x-3 mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center mb-1 sm:mb-0" style={{ backgroundColor: '#F3E8FF' }}>
              <Car className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#7C3AED' }} />
            </div>
            <span className="text-[10px] sm:text-sm font-medium text-gray-600">Véhicules</span>
          </div>
          <p className="text-xl sm:text-3xl font-bold" style={{ color: '#7C3AED' }}>
            {fleet_summary.total_vehicles}
          </p>
          <p className="text-xs sm:text-sm text-gray-500">analysés</p>
        </div>
      </div>

      {/* Efficiency Distribution & Top/Bottom Performers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Efficiency Distribution */}
        <div className="bg-white rounded-xl sm:rounded-2xl border-2 p-3 sm:p-5" style={{ borderColor: '#E8ECEC' }}>
          <div className="flex items-center space-x-2 mb-3 sm:mb-4">
            <PieChart className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#6A8A82' }} />
            <h4 className="font-bold text-sm sm:text-base" style={{ color: '#191919' }}>Répartition Efficacité</h4>
          </div>

          <div className="space-y-2 sm:space-y-3">
            {Object.entries(fleet_summary.efficiency_distribution).map(([status, count]) => {
              const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
              const percentage = (count / fleet_summary.total_vehicles) * 100;
              const Icon = config.icon;

              return (
                <div key={status} className="flex items-center space-x-2 sm:space-x-3">
                  <div
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: config.bg }}
                  >
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: config.color }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-xs sm:text-sm mb-0.5 sm:mb-1">
                      <span className="font-medium">{config.label}</span>
                      <span className="font-bold" style={{ color: config.color }}>{count}</span>
                    </div>
                    <div className="h-1.5 sm:h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#E8ECEC' }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${percentage}%`, backgroundColor: config.color }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Performers */}
        <div className="bg-white rounded-xl sm:rounded-2xl border-2 p-3 sm:p-5" style={{ borderColor: '#E8ECEC' }}>
          <div className="flex items-center space-x-2 mb-3 sm:mb-4">
            <Award className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            <h4 className="font-bold text-sm sm:text-base" style={{ color: '#191919' }}>Meilleurs Véhicules</h4>
          </div>

          <div className="space-y-2 sm:space-y-3">
            {comparison.top_performers.map((vehicle, index) => {
              const fuelConfig = FUEL_TYPE_CONFIG[vehicle.fuel_type] || FUEL_TYPE_CONFIG.gasoline;

              return (
                <div
                  key={vehicle.vehicle_id}
                  className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 rounded-lg sm:rounded-xl"
                  style={{ backgroundColor: '#D1FAE5' }}
                >
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-xs sm:text-sm flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-xs sm:text-sm truncate" style={{ color: '#191919' }}>
                      {vehicle.vehicle_plate}
                    </p>
                    <p className="text-[10px] sm:text-xs text-gray-600 truncate">{vehicle.vehicle_brand} {vehicle.vehicle_model}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-xs sm:text-sm text-green-600">
                      {vehicle.avg_consumption.toFixed(1)} L/100
                    </p>
                    <p className="text-[10px] sm:text-xs text-gray-500">
                      {vehicle.cost_per_km.toFixed(3)} {currencySymbol}/km
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Performers */}
        <div className="bg-white rounded-xl sm:rounded-2xl border-2 p-3 sm:p-5 sm:col-span-2 lg:col-span-1" style={{ borderColor: '#E8ECEC' }}>
          <div className="flex items-center space-x-2 mb-3 sm:mb-4">
            <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
            <h4 className="font-bold text-sm sm:text-base" style={{ color: '#191919' }}>À Améliorer</h4>
          </div>

          <div className="space-y-2 sm:space-y-3">
            {comparison.bottom_performers.map((vehicle, index) => {
              const fuelConfig = FUEL_TYPE_CONFIG[vehicle.fuel_type] || FUEL_TYPE_CONFIG.gasoline;

              return (
                <div
                  key={vehicle.vehicle_id}
                  className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 rounded-lg sm:rounded-xl"
                  style={{ backgroundColor: '#FEE2E2' }}
                >
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-xs sm:text-sm flex-shrink-0">
                    !
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-xs sm:text-sm truncate" style={{ color: '#191919' }}>
                      {vehicle.vehicle_plate}
                    </p>
                    <p className="text-[10px] sm:text-xs text-gray-600 truncate">{vehicle.vehicle_brand} {vehicle.vehicle_model}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-xs sm:text-sm text-red-600">
                      {vehicle.avg_consumption.toFixed(1)} L/100
                    </p>
                    <p className="text-[10px] sm:text-xs text-gray-500">
                      +{vehicle.consumption_diff.toFixed(1)} vs attendu
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Comparison by Type */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* By Vehicle Type */}
        <div className="bg-white rounded-xl sm:rounded-2xl border-2 p-3 sm:p-5" style={{ borderColor: '#E8ECEC' }}>
          <div className="flex items-center space-x-2 mb-3 sm:mb-4">
            <Car className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#6A8A82' }} />
            <h4 className="font-bold text-sm sm:text-base" style={{ color: '#191919' }}>Par Type de Véhicule</h4>
          </div>

          <div className="space-y-2 sm:space-y-3">
            {Object.entries(comparison.by_vehicle_type).map(([type, data]) => {
              const config = VEHICLE_TYPE_CONFIG[type] || { label: type, icon: '🚗' };

              return (
                <div key={type} className="p-2 sm:p-3 rounded-lg sm:rounded-xl" style={{ backgroundColor: '#F8FAF9' }}>
                  <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                    <div className="flex items-center space-x-1.5 sm:space-x-2">
                      <span className="text-base sm:text-xl">{config.icon}</span>
                      <span className="font-semibold text-xs sm:text-base">{config.label}</span>
                      <span className="text-[10px] sm:text-xs text-gray-500">({data.count})</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 sm:gap-4 text-[10px] sm:text-sm">
                    <div>
                      <p className="text-gray-500">Conso.</p>
                      <p className="font-bold" style={{ color: '#6A8A82' }}>
                        {data.avg_consumption.toFixed(1)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Coût/km</p>
                      <p className="font-bold" style={{ color: '#B87333' }}>
                        {data.cost_per_km.toFixed(3)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Total</p>
                      <p className="font-bold" style={{ color: '#1E40AF' }}>
                        {data.total_cost.toFixed(0)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* By Fuel Type */}
        <div className="bg-white rounded-xl sm:rounded-2xl border-2 p-3 sm:p-5" style={{ borderColor: '#E8ECEC' }}>
          <div className="flex items-center space-x-2 mb-3 sm:mb-4">
            <Fuel className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#B87333' }} />
            <h4 className="font-bold text-sm sm:text-base" style={{ color: '#191919' }}>Par Carburant</h4>
          </div>

          <div className="space-y-2 sm:space-y-3">
            {Object.entries(comparison.by_fuel_type).map(([type, data]) => {
              const config = FUEL_TYPE_CONFIG[type] || FUEL_TYPE_CONFIG.gasoline;

              return (
                <div
                  key={type}
                  className="p-2 sm:p-3 rounded-lg sm:rounded-xl"
                  style={{ backgroundColor: config.bg }}
                >
                  <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                    <div className="flex items-center space-x-1.5 sm:space-x-2">
                      <span className="text-base sm:text-xl">{config.icon}</span>
                      <span className="font-semibold text-xs sm:text-base" style={{ color: config.color }}>{data.label}</span>
                      <span className="text-[10px] sm:text-xs text-gray-500">({data.count})</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 sm:gap-4 text-[10px] sm:text-sm">
                    <div>
                      <p className="text-gray-500">Conso.</p>
                      <p className="font-bold" style={{ color: config.color }}>
                        {data.avg_consumption.toFixed(1)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Coût/km</p>
                      <p className="font-bold" style={{ color: '#B87333' }}>
                        {data.cost_per_km.toFixed(3)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Quantité</p>
                      <p className="font-bold" style={{ color: '#3B82F6' }}>
                        {data.total_quantity.toFixed(0)} L
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Detailed Vehicle List */}
      <div className="bg-white rounded-xl sm:rounded-2xl border-2 overflow-hidden" style={{ borderColor: '#E8ECEC' }}>
        <div className="px-3 sm:px-6 py-3 sm:py-4 border-b-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0" style={{ borderColor: '#E8ECEC' }}>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#E8EFED' }}>
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#6A8A82' }} />
            </div>
            <div>
              <h3 className="text-sm sm:text-lg font-bold" style={{ color: '#191919' }}>
                Consommation par Véhicule
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">
                Détails et tendances de chaque véhicule
              </p>
            </div>
          </div>

          {/* Sort Options */}
          <div className="flex items-center space-x-1 sm:space-x-2 w-full sm:w-auto overflow-x-auto">
            <span className="text-xs sm:text-sm text-gray-500 hidden sm:inline flex-shrink-0">Trier par:</span>
            {[
              { value: 'efficiency', label: 'Efficacité' },
              { value: 'consumption', label: 'Conso.' },
              { value: 'cost_per_km', label: 'Coût/km' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setSortBy(option.value as typeof sortBy)}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all flex-shrink-0 ${
                  sortBy === option.value ? 'shadow-sm' : 'hover:bg-gray-100'
                }`}
                style={{
                  backgroundColor: sortBy === option.value ? '#E8EFED' : 'transparent',
                  color: sortBy === option.value ? '#6A8A82' : '#6B7280',
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y-2" style={{ borderColor: '#E8ECEC' }}>
          {sortedVehicles.map((vehicle) => {
            const fuelConfig = FUEL_TYPE_CONFIG[vehicle.fuel_type] || FUEL_TYPE_CONFIG.gasoline;
            const statusConfig = STATUS_CONFIG[vehicle.status];
            const isExpanded = expandedVehicle === vehicle.vehicle_id;
            const StatusIcon = statusConfig.icon;

            return (
              <div key={vehicle.vehicle_id}>
                {/* Main Row */}
                <div
                  className="p-3 sm:p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setExpandedVehicle(isExpanded ? null : vehicle.vehicle_id)}
                >
                  <div className="flex items-start sm:items-center space-x-2 sm:space-x-4">
                    {/* Expand Arrow */}
                    <button className="p-0.5 sm:p-1 mt-1 sm:mt-0">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                      )}
                    </button>

                    {/* Status Icon */}
                    <div
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: statusConfig.bg }}
                    >
                      <StatusIcon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: statusConfig.color }} />
                    </div>

                    {/* Vehicle Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-0.5 sm:mb-1">
                        <span className="text-sm sm:text-lg">{fuelConfig.icon}</span>
                        <h4 className="font-bold text-sm sm:text-base" style={{ color: '#191919' }}>
                          {vehicle.vehicle_plate}
                        </h4>
                        <span
                          className="px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium"
                          style={{ backgroundColor: statusConfig.bg, color: statusConfig.color }}
                        >
                          {statusConfig.label}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 truncate">
                        {vehicle.vehicle_brand} {vehicle.vehicle_model} • {fuelConfig.label}
                      </p>

                      {/* Mobile Stats */}
                      <div className="sm:hidden grid grid-cols-3 gap-2 mt-2">
                        <div className="text-center p-1.5 rounded-lg" style={{ backgroundColor: '#E8EFED' }}>
                          <p className="text-[10px] text-gray-500">Conso.</p>
                          <p className="text-xs font-bold" style={{ color: '#6A8A82' }}>
                            {vehicle.avg_consumption.toFixed(1)}
                          </p>
                        </div>
                        <div className="text-center p-1.5 rounded-lg" style={{ backgroundColor: '#F5E8DD' }}>
                          <p className="text-[10px] text-gray-500">Coût/km</p>
                          <p className="text-xs font-bold" style={{ color: '#B87333' }}>
                            {vehicle.cost_per_km.toFixed(3)}
                          </p>
                        </div>
                        <div className="text-center p-1.5 rounded-lg" style={{ backgroundColor: statusConfig.bg }}>
                          <p className="text-[10px] text-gray-500">Efficacité</p>
                          <p className="text-xs font-bold" style={{ color: statusConfig.color }}>
                            {vehicle.efficiency_ratio.toFixed(0)}%
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Desktop Stats */}
                    <div className="hidden sm:flex items-center space-x-6 lg:space-x-8">
                      {/* Consumption */}
                      <div className="text-center">
                        <p className="text-xs text-gray-500 mb-1">Consommation</p>
                        <p className="text-lg font-bold" style={{ color: '#6A8A82' }}>
                          {vehicle.avg_consumption.toFixed(1)}
                        </p>
                        <p className="text-xs text-gray-400">L/100km</p>
                      </div>

                      {/* Difference */}
                      <div className="text-center hidden lg:block">
                        <p className="text-xs text-gray-500 mb-1">vs Attendu</p>
                        <p
                          className="text-lg font-bold flex items-center justify-center"
                          style={{ color: vehicle.consumption_diff <= 0 ? '#059669' : '#DC2626' }}
                        >
                          {vehicle.consumption_diff <= 0 ? (
                            <TrendingDown className="w-4 h-4 mr-1" />
                          ) : (
                            <TrendingUp className="w-4 h-4 mr-1" />
                          )}
                          {vehicle.consumption_diff > 0 ? '+' : ''}{vehicle.consumption_diff.toFixed(1)}
                        </p>
                        <p className="text-xs text-gray-400">L/100km</p>
                      </div>

                      {/* Cost per km */}
                      <div className="text-center">
                        <p className="text-xs text-gray-500 mb-1">Coût/km</p>
                        <p className="text-lg font-bold" style={{ color: '#B87333' }}>
                          {vehicle.cost_per_km.toFixed(3)}
                        </p>
                        <p className="text-xs text-gray-400">{currencySymbol}/km</p>
                      </div>

                      {/* Efficiency */}
                      <div className="text-center min-w-[70px] lg:min-w-[80px]">
                        <p className="text-xs text-gray-500 mb-1">Efficacité</p>
                        <p
                          className="text-lg font-bold"
                          style={{ color: statusConfig.color }}
                        >
                          {vehicle.efficiency_ratio.toFixed(0)}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-0">
                    <div className="ml-6 sm:ml-16 p-3 sm:p-4 rounded-lg sm:rounded-xl" style={{ backgroundColor: '#F8FAF9' }}>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 mb-3 sm:mb-4">
                        <div>
                          <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1">Distance parcourue</p>
                          <p className="font-bold text-xs sm:text-base" style={{ color: '#3B82F6' }}>
                            {vehicle.total_distance.toLocaleString()} km
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1">Carburant consommé</p>
                          <p className="font-bold text-xs sm:text-base" style={{ color: '#6A8A82' }}>
                            {vehicle.total_quantity.toFixed(1)} L
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1">Coût total</p>
                          <p className="font-bold text-xs sm:text-base" style={{ color: '#B87333' }}>
                            {vehicle.total_cost.toFixed(2)} {currencySymbol}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1">Nombre de pleins</p>
                          <p className="font-bold text-xs sm:text-base" style={{ color: '#7C3AED' }}>
                            {vehicle.refuel_count}
                          </p>
                        </div>
                      </div>

                      {/* Monthly Trend */}
                      <div>
                        <p className="text-[10px] sm:text-xs text-gray-500 mb-1.5 sm:mb-2">Tendance mensuelle (L/100km)</p>
                        <div className="flex items-end space-x-1 sm:space-x-2 h-12 sm:h-16">
                          {vehicle.monthly_trend.map((month, idx) => {
                            const maxConsumption = Math.max(
                              ...vehicle.monthly_trend.filter(m => m.consumption).map(m => m.consumption || 0),
                              1
                            );
                            const height = month.consumption ? (month.consumption / maxConsumption) * 100 : 0;

                            return (
                              <div key={idx} className="flex-1 flex flex-col items-center">
                                {month.consumption ? (
                                  <>
                                    <div
                                      className="w-full rounded-t transition-all"
                                      style={{
                                        height: `${Math.max(height, 10)}%`,
                                        backgroundColor: month.consumption <= vehicle.expected_consumption ? '#059669' : '#DC2626',
                                      }}
                                    />
                                    <p className="text-[9px] sm:text-xs font-medium mt-0.5 sm:mt-1">
                                      {month.consumption.toFixed(1)}
                                    </p>
                                  </>
                                ) : (
                                  <p className="text-[9px] sm:text-xs text-gray-400">-</p>
                                )}
                                <p className="text-[9px] sm:text-xs text-gray-400">{month.month}</p>
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 mt-2 text-[10px] sm:text-xs text-gray-500">
                          <span>Attendu: {vehicle.expected_consumption.toFixed(1)} L/100</span>
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 sm:w-3 sm:h-3 rounded" style={{ backgroundColor: '#059669' }} />
                            <span>≤ Attendu</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 sm:w-3 sm:h-3 rounded" style={{ backgroundColor: '#DC2626' }} />
                            <span>&gt; Attendu</span>
                          </div>
                        </div>
                      </div>
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
