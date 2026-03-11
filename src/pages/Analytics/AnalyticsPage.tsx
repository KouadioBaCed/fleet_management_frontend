import { useState, useEffect, useCallback, useRef } from 'react';
import Layout from '@/components/Layout/Layout';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Coins,
  Fuel,
  Gauge,
  Car,
  Calendar,
  ChevronDown,
  Loader2,
  Wrench,
  MapPin,
  AlertTriangle,
  CheckCircle,
  PieChart,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { analyticsApi, type FleetAnalytics, type AnalyticsPeriod, type VehicleConsumption } from '@/api/analytics';
import { useCurrency } from '@/store/settingsStore';
import { getCurrencySymbol } from '@/api/settings';

const PERIODS: { value: AnalyticsPeriod; label: string }[] = [
  { value: 'week', label: '7 derniers jours' },
  { value: 'month', label: 'Ce mois' },
  { value: 'last_month', label: 'Mois dernier' },
  { value: '3_months', label: '3 derniers mois' },
  { value: '6_months', label: '6 derniers mois' },
  { value: 'year', label: 'Cette année' },
  { value: 'custom', label: 'Personnalisé' },
];

const STATUS_CONFIG = {
  efficient: { label: 'Efficace', color: '#059669', bg: '#D1FAE5', icon: CheckCircle },
  warning: { label: 'Attention', color: '#D97706', bg: '#FEF3C7', icon: AlertTriangle },
  critical: { label: 'Critique', color: '#DC2626', bg: '#FEE2E2', icon: AlertTriangle },
};

const FUEL_TYPE_ICONS: Record<string, string> = {
  gasoline: '⛽',
  diesel: '🛢️',
  electric: '⚡',
  hybrid: '🔋',
};

export default function AnalyticsPage() {
  const currency = useCurrency();
  const currencySymbol = getCurrencySymbol(currency);

  const [data, setData] = useState<FleetAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<AnalyticsPeriod>('month');
  const [showPeriodMenu, setShowPeriodMenu] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [sortBy, setSortBy] = useState<'consumption' | 'cost' | 'efficiency'>('consumption');

  const periodRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await analyticsApi.getFleetAnalytics({
        period: selectedPeriod !== 'custom' ? selectedPeriod : undefined,
        start_date: selectedPeriod === 'custom' ? customStartDate : undefined,
        end_date: selectedPeriod === 'custom' ? customEndDate : undefined,
      });
      setData(response);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedPeriod, customStartDate, customEndDate]);

  useEffect(() => {
    if (selectedPeriod !== 'custom' || (customStartDate && customEndDate)) {
      fetchData();
    }
  }, [fetchData, selectedPeriod, customStartDate, customEndDate]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (periodRef.current && !periodRef.current.contains(event.target as Node)) {
        setShowPeriodMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sort vehicles
  const sortedVehicles = data?.vehicle_consumption ? [...data.vehicle_consumption].sort((a, b) => {
    if (sortBy === 'consumption') return (b.avg_consumption || 0) - (a.avg_consumption || 0);
    if (sortBy === 'cost') return b.total_cost - a.total_cost;
    return b.efficiency_ratio - a.efficiency_ratio;
  }) : [];

  // Max values for charts
  const maxTrendCost = Math.max(...(data?.monthly_trends?.map(t => t.total_cost) || [1]), 1);
  const maxVehicleCost = Math.max(...(sortedVehicles.map(v => v.total_cost) || [1]), 1);

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-3xl font-semibold text-gray-800">
              Analyse de Flotte
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Consommation par véhicule et coûts totaux</p>
          </div>

          {/* Period Selector */}
          <div className="relative w-full sm:w-auto" ref={periodRef}>
            <button
              onClick={() => setShowPeriodMenu(!showPeriodMenu)}
              className="flex items-center justify-between sm:justify-start space-x-2 w-full sm:w-auto soft-btn transition-all"
            >
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#6A8A82' }} />
              <span className="font-semibold text-sm sm:text-base" style={{ color: '#6A8A82' }}>
                {PERIODS.find(p => p.value === selectedPeriod)?.label}
              </span>
              <ChevronDown className="w-4 h-4" style={{ color: '#6A8A82' }} />
            </button>

            {showPeriodMenu && (
              <div className="absolute top-full mt-2 left-0 sm:left-auto sm:right-0 w-full sm:w-auto soft-dropdown py-2 z-20 sm:min-w-[220px]">
                {PERIODS.map((period) => (
                  <button
                    key={period.value}
                    onClick={() => {
                      setSelectedPeriod(period.value);
                      if (period.value !== 'custom') setShowPeriodMenu(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-all text-sm font-medium ${
                      selectedPeriod === period.value ? 'font-semibold' : ''
                    }`}
                    style={{
                      color: selectedPeriod === period.value ? '#6A8A82' : '#1f2937',
                      backgroundColor: selectedPeriod === period.value ? '#E8EFED' : 'transparent'
                    }}
                  >
                    {period.label}
                  </button>
                ))}

                {selectedPeriod === 'custom' && (
                  <div className="px-4 py-3 border-t border-[rgba(0,0,0,0.06)]">
                    <div className="space-y-2">
                      <div>
                        <label className="text-xs text-gray-500 font-medium">Du</label>
                        <input
                          type="date"
                          value={customStartDate}
                          onChange={(e) => setCustomStartDate(e.target.value)}
                          className="w-full soft-input text-sm text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 font-medium">Au</label>
                        <input
                          type="date"
                          value={customEndDate}
                          onChange={(e) => setCustomEndDate(e.target.value)}
                          className="w-full soft-input text-sm text-gray-900"
                        />
                      </div>
                      <button
                        onClick={() => setShowPeriodMenu(false)}
                        disabled={!customStartDate || !customEndDate}
                        className="w-full text-white disabled:opacity-50 btn-primary"
                      >
                        Appliquer
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#6A8A82' }} />
          </div>
        )}

        {/* Content */}
        {!isLoading && data && (
          <>
            {/* Period Info */}
            <div className="text-xs sm:text-sm text-gray-500">
              Période: {new Date(data.period.start).toLocaleDateString('fr-FR')} - {new Date(data.period.end).toLocaleDateString('fr-FR')}
            </div>

            {/* Main Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
              {/* Total Cost */}
              <div className="stat-card">
                <div className="stat-accent" style={{ backgroundColor: '#D97706' }} />
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className="stat-icon" style={{ backgroundColor: 'rgba(217,119,6,0.1)' }}>
                    <Coins className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#D97706' }} />
                  </div>
                  <div className={`flex items-center text-[10px] sm:text-sm font-medium ${data.summary.total_cost.change <= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {data.summary.total_cost.change <= 0 ? <ArrowDownRight className="w-3 h-3 sm:w-4 sm:h-4" /> : <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4" />}
                    {Math.abs(data.summary.total_cost.change).toFixed(1)}%
                  </div>
                </div>
                <p className="stat-label">Coûts Totaux</p>
                <p className="stat-value" style={{ color: '#D97706' }}>{data.summary.total_cost.value.toFixed(0)} {currencySymbol}</p>
              </div>

              {/* Fuel Cost */}
              <div className="stat-card">
                <div className="stat-accent" style={{ backgroundColor: '#059669' }} />
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className="stat-icon" style={{ backgroundColor: 'rgba(5,150,105,0.1)' }}>
                    <Fuel className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#059669' }} />
                  </div>
                  <div className={`flex items-center text-[10px] sm:text-sm font-medium ${data.summary.fuel_cost.change <= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {data.summary.fuel_cost.change <= 0 ? <ArrowDownRight className="w-3 h-3 sm:w-4 sm:h-4" /> : <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4" />}
                    {Math.abs(data.summary.fuel_cost.change).toFixed(1)}%
                  </div>
                </div>
                <p className="stat-label">Carburant</p>
                <p className="stat-value" style={{ color: '#059669' }}>{data.summary.fuel_cost.value.toFixed(0)} {currencySymbol}</p>
              </div>

              {/* Maintenance Cost */}
              <div className="stat-card">
                <div className="stat-accent" style={{ backgroundColor: '#2563EB' }} />
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className="stat-icon" style={{ backgroundColor: 'rgba(37,99,235,0.1)' }}>
                    <Wrench className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#2563EB' }} />
                  </div>
                  <div className={`flex items-center text-[10px] sm:text-sm font-medium ${data.summary.maintenance_cost.change <= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {data.summary.maintenance_cost.change <= 0 ? <ArrowDownRight className="w-3 h-3 sm:w-4 sm:h-4" /> : <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4" />}
                    {Math.abs(data.summary.maintenance_cost.change).toFixed(1)}%
                  </div>
                </div>
                <p className="stat-label">Maintenance</p>
                <p className="stat-value" style={{ color: '#2563EB' }}>{data.summary.maintenance_cost.value.toFixed(0)} {currencySymbol}</p>
              </div>

              {/* Avg Consumption */}
              <div className="stat-card">
                <div className="stat-accent" style={{ backgroundColor: '#7C3AED' }} />
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className="stat-icon" style={{ backgroundColor: 'rgba(124,58,237,0.1)' }}>
                    <Gauge className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#7C3AED' }} />
                  </div>
                  <div className={`flex items-center text-[10px] sm:text-sm font-medium ${data.summary.avg_consumption.change <= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {data.summary.avg_consumption.change <= 0 ? <ArrowDownRight className="w-3 h-3 sm:w-4 sm:h-4" /> : <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4" />}
                    {Math.abs(data.summary.avg_consumption.change).toFixed(1)}%
                  </div>
                </div>
                <p className="stat-label">Conso. Moyenne</p>
                <p className="stat-value" style={{ color: '#7C3AED' }}>{data.summary.avg_consumption.value.toFixed(1)} <span className="text-xs sm:text-lg">L/100</span></p>
              </div>
            </div>

            {/* Cost Breakdown & Trends */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Cost Breakdown Pie */}
              <div className="data-table-container p-4 sm:p-6">
                <div className="flex items-center space-x-2 mb-4 sm:mb-6">
                  <PieChart className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#6A8A82' }} />
                  <h3 className="font-semibold text-sm sm:text-lg text-gray-800">Répartition des Coûts</h3>
                </div>

                {/* Visual Breakdown */}
                <div className="relative h-36 sm:h-48 flex items-center justify-center mb-4 sm:mb-6">
                  <div className="relative w-28 h-28 sm:w-40 sm:h-40">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#E8EFED"
                        strokeWidth="20"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#6A8A82"
                        strokeWidth="20"
                        strokeDasharray={`${data.cost_breakdown.by_category.fuel.percentage * 2.51} 251`}
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#B87333"
                        strokeWidth="20"
                        strokeDasharray={`${data.cost_breakdown.by_category.maintenance.percentage * 2.51} 251`}
                        strokeDashoffset={`-${data.cost_breakdown.by_category.fuel.percentage * 2.51}`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-base sm:text-2xl font-semibold text-gray-800">
                          {data.summary.total_cost.value.toFixed(0)}
                        </p>
                        <p className="text-[10px] sm:text-xs text-gray-500">{currencySymbol}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Legend */}
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center justify-between p-2 sm:p-3 rounded-lg sm:rounded-xl" style={{ backgroundColor: '#E8EFED' }}>
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full" style={{ backgroundColor: '#6A8A82' }} />
                      <span className="font-medium text-xs sm:text-sm">Carburant</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-xs sm:text-sm" style={{ color: '#6A8A82' }}>{data.cost_breakdown.by_category.fuel.amount.toFixed(0)} {currencySymbol}</p>
                      <p className="text-[10px] sm:text-xs text-gray-500">{data.cost_breakdown.by_category.fuel.percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2 sm:p-3 rounded-lg sm:rounded-xl" style={{ backgroundColor: '#F5E8DD' }}>
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full" style={{ backgroundColor: '#B87333' }} />
                      <span className="font-medium text-xs sm:text-sm">Maintenance</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-xs sm:text-sm" style={{ color: '#B87333' }}>{data.cost_breakdown.by_category.maintenance.amount.toFixed(0)} {currencySymbol}</p>
                      <p className="text-[10px] sm:text-xs text-gray-500">{data.cost_breakdown.by_category.maintenance.percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>

                {/* Maintenance Detail */}
                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-[rgba(0,0,0,0.06)]">
                  <p className="text-[10px] sm:text-xs text-gray-500 font-medium mb-1.5 sm:mb-2">Détail Maintenance</p>
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-gray-600">Pièces</span>
                    <span className="font-medium">{data.cost_breakdown.maintenance_detail.parts.toFixed(0)} {currencySymbol}</span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm mt-1">
                    <span className="text-gray-600">Main d'œuvre</span>
                    <span className="font-medium">{data.cost_breakdown.maintenance_detail.labor.toFixed(0)} {currencySymbol}</span>
                  </div>
                </div>
              </div>

              {/* Monthly Trends */}
              <div className="lg:col-span-2 data-table-container p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-4 sm:mb-6">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#B87333' }} />
                    <h3 className="font-semibold text-sm sm:text-lg text-gray-800">Évolution des Coûts</h3>
                  </div>
                  <div className="flex items-center space-x-3 sm:space-x-4 text-[10px] sm:text-xs">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 sm:w-3 sm:h-3 rounded" style={{ backgroundColor: '#6A8A82' }} />
                      <span className="text-gray-500">Carburant</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 sm:w-3 sm:h-3 rounded" style={{ backgroundColor: '#B87333' }} />
                      <span className="text-gray-500">Maintenance</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-end space-x-1 sm:space-x-2 h-40 sm:h-56">
                  {data.monthly_trends.map((trend, index) => {
                    const fuelHeight = (trend.fuel_cost / maxTrendCost) * 100;
                    const maintenanceHeight = (trend.maintenance_cost / maxTrendCost) * 100;

                    return (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <div className="w-full flex flex-col items-center space-y-1" style={{ height: '120px' }}>
                          <div className="flex-1 w-full flex items-end justify-center space-x-0.5 sm:space-x-1">
                            <div
                              className="w-2 sm:w-5 rounded-t-lg transition-all"
                              style={{ height: `${Math.max(fuelHeight, 2)}%`, backgroundColor: '#6A8A82' }}
                              title={`Carburant: ${trend.fuel_cost.toFixed(0)} ${currencySymbol}`}
                            />
                            <div
                              className="w-2 sm:w-5 rounded-t-lg transition-all"
                              style={{ height: `${Math.max(maintenanceHeight, 2)}%`, backgroundColor: '#B87333' }}
                              title={`Maintenance: ${trend.maintenance_cost.toFixed(0)} ${currencySymbol}`}
                            />
                          </div>
                        </div>
                        <div className="mt-1 sm:mt-2 text-center">
                          <p className="text-[9px] sm:text-xs font-medium text-gray-500">{trend.label.split(' ')[0].slice(0, 3)}</p>
                          <p className="text-[9px] sm:text-xs font-semibold text-gray-800">{trend.total_cost.toFixed(0)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Efficiency Distribution & Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
              {/* Efficiency Distribution */}
              <div className="data-table-container p-3 sm:p-5">
                <h4 className="font-semibold text-xs sm:text-sm mb-2 sm:mb-4 text-gray-800">Efficacité Flotte</h4>
                <div className="space-y-2 sm:space-y-3">
                  {(['efficient', 'warning', 'critical'] as const).map((status) => {
                    const config = STATUS_CONFIG[status];
                    const count = data.summary.efficiency_distribution[status];
                    const Icon = config.icon;
                    return (
                      <div key={status} className="flex items-center justify-between">
                        <div className="flex items-center space-x-1.5 sm:space-x-2">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: config.bg }}>
                            <Icon className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: config.color }} />
                          </div>
                          <span className="text-[10px] sm:text-sm font-medium">{config.label}</span>
                        </div>
                        <span className="text-base sm:text-lg font-bold" style={{ color: config.color }}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="data-table-container p-3 sm:p-5">
                <h4 className="font-semibold text-xs sm:text-sm mb-2 sm:mb-4 text-gray-800">Distance Totale</h4>
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center" style={{ backgroundColor: '#E8EFED' }}>
                    <MapPin className="w-4 h-4 sm:w-6 sm:h-6" style={{ color: '#6A8A82' }} />
                  </div>
                  <div>
                    <p className="text-lg sm:text-2xl font-bold" style={{ color: '#6A8A82' }}>{data.summary.total_distance.value.toFixed(0)}</p>
                    <p className="text-[10px] sm:text-xs text-gray-500">km</p>
                  </div>
                </div>
                <div className={`mt-2 sm:mt-3 text-[10px] sm:text-sm font-medium flex items-center ${data.summary.total_distance.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {data.summary.total_distance.change >= 0 ? <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> : <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />}
                  {data.summary.total_distance.change >= 0 ? '+' : ''}{data.summary.total_distance.change.toFixed(1)}%
                </div>
              </div>

              <div className="data-table-container p-3 sm:p-5">
                <h4 className="font-semibold text-xs sm:text-sm mb-2 sm:mb-4 text-gray-800">Carburant Total</h4>
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center" style={{ backgroundColor: '#F5E8DD' }}>
                    <Fuel className="w-4 h-4 sm:w-6 sm:h-6" style={{ color: '#B87333' }} />
                  </div>
                  <div>
                    <p className="text-lg sm:text-2xl font-bold" style={{ color: '#B87333' }}>{data.summary.total_quantity.value.toFixed(0)}</p>
                    <p className="text-[10px] sm:text-xs text-gray-500">litres</p>
                  </div>
                </div>
                <div className={`mt-2 sm:mt-3 text-[10px] sm:text-sm font-medium flex items-center ${data.summary.total_quantity.change <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {data.summary.total_quantity.change <= 0 ? <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> : <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />}
                  {data.summary.total_quantity.change >= 0 ? '+' : ''}{data.summary.total_quantity.change.toFixed(1)}%
                </div>
              </div>

              <div className="data-table-container p-3 sm:p-5">
                <h4 className="font-semibold text-xs sm:text-sm mb-2 sm:mb-4 text-gray-800">Coût / km</h4>
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center" style={{ backgroundColor: '#DBEAFE' }}>
                    <Coins className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-lg sm:text-2xl font-bold text-blue-600">{data.summary.cost_per_km.value.toFixed(3)}</p>
                    <p className="text-[10px] sm:text-xs text-gray-500">{currencySymbol}/km</p>
                  </div>
                </div>
                <div className={`mt-2 sm:mt-3 text-[10px] sm:text-sm font-medium flex items-center ${data.summary.cost_per_km.change <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {data.summary.cost_per_km.change <= 0 ? <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> : <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />}
                  {data.summary.cost_per_km.change >= 0 ? '+' : ''}{data.summary.cost_per_km.change.toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Vehicle Consumption */}
            <div className="data-table-container p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
                <div className="flex items-center space-x-2">
                  <Car className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#6A8A82' }} />
                  <h3 className="font-semibold text-sm sm:text-lg text-gray-800">Consommation par Véhicule</h3>
                </div>
                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <span className="text-xs sm:text-sm text-gray-500">Trier:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="flex-1 sm:flex-none soft-input text-xs sm:text-sm font-medium text-gray-900"
                  >
                    <option value="consumption">Consommation</option>
                    <option value="cost">Coût total</option>
                    <option value="efficiency">Efficacité</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2 sm:space-y-3">
                {sortedVehicles.length > 0 ? (
                  sortedVehicles.map((vehicle, index) => {
                    const statusConfig = STATUS_CONFIG[vehicle.status];
                    const StatusIcon = statusConfig.icon;
                    const costBarWidth = (vehicle.total_cost / maxVehicleCost) * 100;

                    return (
                      <div
                        key={vehicle.vehicle_id}
                        className="data-card p-3 sm:p-4 transition-all"
                      >
                        {/* Mobile Layout */}
                        <div className="sm:hidden">
                          <div className="flex items-start gap-2 mb-2">
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                              style={{ backgroundColor: index < 3 ? '#B87333' : '#9CA3AF' }}
                            >
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-sm">{FUEL_TYPE_ICONS[vehicle.fuel_type] || '🚗'}</span>
                                <span className="font-semibold text-xs text-gray-800">{vehicle.plate}</span>
                                <div
                                  className="px-1.5 py-0.5 rounded-full text-[9px] font-medium flex items-center space-x-0.5"
                                  style={{ backgroundColor: statusConfig.bg, color: statusConfig.color }}
                                >
                                  <StatusIcon className="w-2.5 h-2.5" />
                                  <span>{statusConfig.label}</span>
                                </div>
                              </div>
                              <p className="text-[10px] text-gray-500 truncate">{vehicle.brand} {vehicle.model}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-gray-800">{vehicle.total_cost.toFixed(0)} {currencySymbol}</p>
                            </div>
                          </div>

                          {/* Mobile Stats Grid */}
                          <div className="grid grid-cols-4 gap-1.5 text-center">
                            <div className="p-1.5 rounded-lg" style={{ backgroundColor: vehicle.avg_consumption > vehicle.expected_consumption ? '#FEE2E2' : '#D1FAE5' }}>
                              <p className="text-[9px] text-gray-500">Conso.</p>
                              <p className="font-bold text-[10px]" style={{ color: vehicle.avg_consumption > vehicle.expected_consumption ? '#DC2626' : '#059669' }}>
                                {vehicle.avg_consumption.toFixed(1)}
                              </p>
                            </div>
                            <div className="p-1.5 rounded-lg bg-gray-100">
                              <p className="text-[9px] text-gray-500">Dist.</p>
                              <p className="font-bold text-[10px] text-gray-700">{(vehicle.distance/1000).toFixed(0)}k</p>
                            </div>
                            <div className="p-1.5 rounded-lg" style={{ backgroundColor: '#E8EFED' }}>
                              <p className="text-[9px] text-gray-500">Carb.</p>
                              <p className="font-bold text-[10px]" style={{ color: '#6A8A82' }}>{vehicle.fuel_cost.toFixed(0)}</p>
                            </div>
                            <div className="p-1.5 rounded-lg" style={{ backgroundColor: '#F5E8DD' }}>
                              <p className="text-[9px] text-gray-500">Maint.</p>
                              <p className="font-bold text-[10px]" style={{ color: '#B87333' }}>{vehicle.maintenance_cost.toFixed(0)}</p>
                            </div>
                          </div>

                          {/* Cost Bar */}
                          <div className="h-1.5 rounded-full overflow-hidden mt-2" style={{ backgroundColor: '#E8ECEC' }}>
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${costBarWidth}%`,
                                background: `linear-gradient(to right, #6A8A82, #B87333)`
                              }}
                            />
                          </div>
                        </div>

                        {/* Desktop Layout */}
                        <div className="hidden sm:flex items-center gap-4">
                          {/* Rank */}
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                            style={{ backgroundColor: index < 3 ? '#B87333' : '#9CA3AF' }}
                          >
                            {index + 1}
                          </div>

                          {/* Vehicle Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="text-lg">{FUEL_TYPE_ICONS[vehicle.fuel_type] || '🚗'}</span>
                              <span className="font-semibold text-gray-800">{vehicle.plate}</span>
                              <span className="text-sm text-gray-500">{vehicle.brand} {vehicle.model}</span>
                              <div
                                className="px-2 py-0.5 rounded-full text-xs font-medium flex items-center space-x-1"
                                style={{ backgroundColor: statusConfig.bg, color: statusConfig.color }}
                              >
                                <StatusIcon className="w-3 h-3" />
                                <span>{statusConfig.label}</span>
                              </div>
                            </div>

                            {/* Cost Bar */}
                            <div className="h-2 rounded-full overflow-hidden mt-2" style={{ backgroundColor: '#E8ECEC' }}>
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${costBarWidth}%`,
                                  background: `linear-gradient(to right, #6A8A82, #B87333)`
                                }}
                              />
                            </div>
                          </div>

                          {/* Stats */}
                          <div className="flex items-center gap-4 lg:gap-6 flex-shrink-0">
                            <div className="text-center">
                              <p className="text-xs text-gray-500">Conso.</p>
                              <p className="font-bold text-sm" style={{ color: vehicle.avg_consumption > vehicle.expected_consumption ? '#DC2626' : '#059669' }}>
                                {vehicle.avg_consumption.toFixed(1)} L/100
                              </p>
                            </div>
                            <div className="text-center hidden lg:block">
                              <p className="text-xs text-gray-500">Distance</p>
                              <p className="font-bold text-sm text-gray-700">{vehicle.distance.toFixed(0)} km</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-gray-500">Carburant</p>
                              <p className="font-bold text-sm" style={{ color: '#6A8A82' }}>{vehicle.fuel_cost.toFixed(0)} {currencySymbol}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-gray-500">Maint.</p>
                              <p className="font-bold text-sm" style={{ color: '#B87333' }}>{vehicle.maintenance_cost.toFixed(0)} {currencySymbol}</p>
                            </div>
                            <div className="text-center min-w-[70px]">
                              <p className="text-xs text-gray-500">Total</p>
                              <p className="text-lg font-semibold text-gray-800">{vehicle.total_cost.toFixed(0)} {currencySymbol}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 sm:py-12 text-gray-500 text-sm">
                    Aucune donnée de consommation disponible
                  </div>
                )}
              </div>
            </div>

            {/* Top Consumers & Most Costly */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {/* Top Consumers */}
              <div className="data-table-container p-4 sm:p-6">
                <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                  <Gauge className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#DC2626' }} />
                  <h3 className="font-semibold text-sm sm:text-base text-gray-800">Plus Gros Consommateurs</h3>
                </div>
                <div className="space-y-2 sm:space-y-3">
                  {data.top_consumers.map((vehicle, index) => (
                    <div key={vehicle.vehicle_id} className="flex items-center justify-between p-2 sm:p-3 rounded-lg sm:rounded-xl bg-red-50">
                      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                        <span className="text-sm sm:text-lg">{FUEL_TYPE_ICONS[vehicle.fuel_type] || '🚗'}</span>
                        <div className="min-w-0">
                          <p className="font-semibold text-xs sm:text-sm truncate">{vehicle.plate}</p>
                          <p className="text-[10px] sm:text-xs text-gray-500 truncate">{vehicle.brand} {vehicle.model}</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <p className="font-semibold text-xs sm:text-base text-red-500">{vehicle.avg_consumption.toFixed(1)} L/100</p>
                        <p className="text-[10px] sm:text-xs text-gray-500">{vehicle.total_quantity.toFixed(0)} L</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Most Costly */}
              <div className="data-table-container p-4 sm:p-6">
                <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                  <Coins className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#B87333' }} />
                  <h3 className="font-semibold text-sm sm:text-base text-gray-800">Véhicules les Plus Coûteux</h3>
                </div>
                <div className="space-y-2 sm:space-y-3">
                  {data.top_costly.map((vehicle, index) => (
                    <div key={vehicle.vehicle_id} className="flex items-center justify-between p-2 sm:p-3 rounded-lg sm:rounded-xl" style={{ backgroundColor: '#F5E8DD' }}>
                      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                        <span className="text-sm sm:text-lg">{FUEL_TYPE_ICONS[vehicle.fuel_type] || '🚗'}</span>
                        <div className="min-w-0">
                          <p className="font-semibold text-xs sm:text-sm truncate">{vehicle.plate}</p>
                          <p className="text-[10px] sm:text-xs text-gray-500 truncate">{vehicle.brand} {vehicle.model}</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <p className="font-semibold text-xs sm:text-base" style={{ color: '#B87333' }}>{vehicle.total_cost.toFixed(0)} {currencySymbol}</p>
                        <p className="text-[10px] sm:text-xs text-gray-500">
                          <span className="hidden sm:inline">Carb: {vehicle.fuel_cost.toFixed(0)} | Maint: {vehicle.maintenance_cost.toFixed(0)}</span>
                          <span className="sm:hidden">{vehicle.fuel_cost.toFixed(0)} + {vehicle.maintenance_cost.toFixed(0)}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
