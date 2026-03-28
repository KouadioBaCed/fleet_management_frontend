import { useState, useEffect, useCallback, useRef } from 'react';
import Layout from '@/components/Layout/Layout';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Coins,
  Fuel,
  Gauge,
  Calendar,
  ChevronDown,
  Loader2,
  Wrench,
  MapPin,
  AlertTriangle,
  CheckCircle,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Star
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

export default function AnalyticsPage() {
  const currency = useCurrency();
  const currencySymbol = getCurrencySymbol(currency);
  const [data, setData] = useState<FleetAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<AnalyticsPeriod>('month');
  const [showPeriodMenu, setShowPeriodMenu] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [trendView, setTrendView] = useState<'year' | 'month' | 'week'>('year');

  const periodRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await analyticsApi.getFleetAnalytics({
        period: selectedPeriod !== 'custom' ? selectedPeriod : undefined,
        start_date: selectedPeriod === 'custom' ? customStartDate : undefined,
        end_date: selectedPeriod === 'custom' ? customEndDate : undefined,
      });
      setData(response);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Impossible de charger les données analytiques. Veuillez réessayer.');
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


  // Safe accessors for summary fields to prevent crashes on incomplete data
  const s = data?.summary;
  const safeField = (field: { value?: number; change?: number } | undefined) => ({
    value: field?.value ?? 0,
    change: field?.change ?? 0,
  });
  const totalCost = safeField(s?.total_cost);
  const fuelCost = safeField(s?.fuel_cost);
  const maintenanceCost = safeField(s?.maintenance_cost);
  const avgConsumption = safeField(s?.avg_consumption);
  const incidentCost = safeField(s?.incident_cost);
  const totalDistance = safeField(s?.total_distance);
  const totalQuantity = safeField(s?.total_quantity);
  const costPerKm = safeField(s?.cost_per_km);

  // Safe accessors for cost breakdown
  const defaultCategory = { amount: 0, percentage: 0, change: 0 };
  const cb = data?.cost_breakdown;
  const cbFuel = cb?.by_category?.fuel ?? defaultCategory;
  const cbMaintenance = cb?.by_category?.maintenance ?? defaultCategory;
  const cbIncidents = cb?.by_category?.incidents ?? defaultCategory;
  const cbParts = cb?.maintenance_detail?.parts ?? 0;
  const cbLabor = cb?.maintenance_detail?.labor ?? 0;

  // Filter trends based on trendView
  const filteredTrends = (() => {
    if (!data?.monthly_trends) return [];
    const trends = data.monthly_trends;
    if (trendView === 'year') return trends;
    const now = new Date();
    if (trendView === 'month') {
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      return trends.filter(t => t.month === currentMonth);
    }
    // week: last 4 weeks = current month trends
    const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
    const weekMonth = `${fourWeeksAgo.getFullYear()}-${String(fourWeeksAgo.getMonth() + 1).padStart(2, '0')}`;
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return trends.filter(t => t.month === currentMonth || t.month === weekMonth);
  })();

  // Max values for charts
  const maxTrendCost = Math.max(...(filteredTrends.map(t => t.total_cost) || [1]), 1);

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

        {/* Error */}
        {!isLoading && error && (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <AlertTriangle className="w-12 h-12 text-red-400" />
            <p className="text-gray-600 text-sm sm:text-base text-center">{error}</p>
            <button
              onClick={fetchData}
              className="btn-primary px-4 py-2 text-sm font-medium"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* Content */}
        {!isLoading && data && !error && (
          <>
            {/* Period Info */}
            <div className="text-xs sm:text-sm text-gray-500">
              Période: {new Date(data.period.start).toLocaleDateString('fr-FR')} - {new Date(data.period.end).toLocaleDateString('fr-FR')}
            </div>

            {/* Main Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-4">
              {/* Total Cost */}
              <div className="stat-card">
                <div className="stat-accent" style={{ backgroundColor: '#D97706' }} />
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className="stat-icon" style={{ backgroundColor: 'rgba(217,119,6,0.1)' }}>
                    <Coins className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#D97706' }} />
                  </div>
                  <div className={`flex items-center text-[10px] sm:text-sm font-medium ${totalCost.change <= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {totalCost.change <= 0 ? <ArrowDownRight className="w-3 h-3 sm:w-4 sm:h-4" /> : <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4" />}
                    {Math.abs(totalCost.change).toFixed(1)}%
                  </div>
                </div>
                <p className="stat-label">Coûts Totaux</p>
                <p className="stat-value" style={{ color: '#D97706' }}>{totalCost.value.toFixed(0)} {currencySymbol}</p>
              </div>

              {/* Fuel Cost */}
              <div className="stat-card">
                <div className="stat-accent" style={{ backgroundColor: '#059669' }} />
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className="stat-icon" style={{ backgroundColor: 'rgba(5,150,105,0.1)' }}>
                    <Fuel className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#059669' }} />
                  </div>
                  <div className={`flex items-center text-[10px] sm:text-sm font-medium ${fuelCost.change <= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {fuelCost.change <= 0 ? <ArrowDownRight className="w-3 h-3 sm:w-4 sm:h-4" /> : <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4" />}
                    {Math.abs(fuelCost.change).toFixed(1)}%
                  </div>
                </div>
                <p className="stat-label">Carburant</p>
                <p className="stat-value" style={{ color: '#059669' }}>{fuelCost.value.toFixed(0)} {currencySymbol}</p>
              </div>

              {/* Maintenance Cost */}
              <div className="stat-card">
                <div className="stat-accent" style={{ backgroundColor: '#2563EB' }} />
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className="stat-icon" style={{ backgroundColor: 'rgba(37,99,235,0.1)' }}>
                    <Wrench className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#2563EB' }} />
                  </div>
                  <div className={`flex items-center text-[10px] sm:text-sm font-medium ${maintenanceCost.change <= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {maintenanceCost.change <= 0 ? <ArrowDownRight className="w-3 h-3 sm:w-4 sm:h-4" /> : <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4" />}
                    {Math.abs(maintenanceCost.change).toFixed(1)}%
                  </div>
                </div>
                <p className="stat-label">Maintenance</p>
                <p className="stat-value" style={{ color: '#2563EB' }}>{maintenanceCost.value.toFixed(0)} {currencySymbol}</p>
              </div>

              {/* Avg Consumption */}
              <div className="stat-card">
                <div className="stat-accent" style={{ backgroundColor: '#7C3AED' }} />
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className="stat-icon" style={{ backgroundColor: 'rgba(124,58,237,0.1)' }}>
                    <Gauge className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#7C3AED' }} />
                  </div>
                  <div className={`flex items-center text-[10px] sm:text-sm font-medium ${avgConsumption.change <= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {avgConsumption.change <= 0 ? <ArrowDownRight className="w-3 h-3 sm:w-4 sm:h-4" /> : <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4" />}
                    {Math.abs(avgConsumption.change).toFixed(1)}%
                  </div>
                </div>
                <p className="stat-label">Conso. Moyenne</p>
                <p className="stat-value" style={{ color: '#7C3AED' }}>{avgConsumption.value.toFixed(1)} <span className="text-xs sm:text-lg">L/100</span></p>
              </div>

              {/* Incident Cost */}
              <div className="stat-card">
                <div className="stat-accent" style={{ backgroundColor: '#DC2626' }} />
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className="stat-icon" style={{ backgroundColor: 'rgba(220,38,38,0.1)' }}>
                    <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#DC2626' }} />
                  </div>
                  <div className={`flex items-center text-[10px] sm:text-sm font-medium ${incidentCost.change <= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {incidentCost.change <= 0 ? <ArrowDownRight className="w-3 h-3 sm:w-4 sm:h-4" /> : <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4" />}
                    {Math.abs(incidentCost.change).toFixed(1)}%
                  </div>
                </div>
                <p className="stat-label">Autres coûts</p>
                <p className="stat-value" style={{ color: '#DC2626' }}>{incidentCost.value.toFixed(0)} {currencySymbol}</p>
                <p className="text-[10px] sm:text-xs text-gray-500 mt-1">{s?.incident_count ?? 0} incident{(s?.incident_count ?? 0) !== 1 ? 's' : ''} / {s?.incident_resolved ?? 0} resolu{(s?.incident_resolved ?? 0) !== 1 ? 's' : ''}</p>
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
                        strokeDasharray={`${cbFuel.percentage * 2.51} 251`}
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#B87333"
                        strokeWidth="20"
                        strokeDasharray={`${cbMaintenance.percentage * 2.51} 251`}
                        strokeDashoffset={`-${cbFuel.percentage * 2.51}`}
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#DC2626"
                        strokeWidth="20"
                        strokeDasharray={`${cbIncidents.percentage * 2.51} 251`}
                        strokeDashoffset={`-${(cbFuel.percentage + cbMaintenance.percentage) * 2.51}`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-base sm:text-2xl font-semibold text-gray-800">
                          {totalCost.value.toFixed(0)}
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
                      <p className="font-bold text-xs sm:text-sm" style={{ color: '#6A8A82' }}>{cbFuel.amount.toFixed(0)} {currencySymbol}</p>
                      <p className="text-[10px] sm:text-xs text-gray-500">{cbFuel.percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2 sm:p-3 rounded-lg sm:rounded-xl" style={{ backgroundColor: '#F5E8DD' }}>
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full" style={{ backgroundColor: '#B87333' }} />
                      <span className="font-medium text-xs sm:text-sm">Maintenance</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-xs sm:text-sm" style={{ color: '#B87333' }}>{cbMaintenance.amount.toFixed(0)} {currencySymbol}</p>
                      <p className="text-[10px] sm:text-xs text-gray-500">{cbMaintenance.percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2 sm:p-3 rounded-lg sm:rounded-xl" style={{ backgroundColor: '#FEE2E2' }}>
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full" style={{ backgroundColor: '#DC2626' }} />
                      <span className="font-medium text-xs sm:text-sm">Autres</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-xs sm:text-sm" style={{ color: '#DC2626' }}>{cbIncidents.amount.toFixed(0)} {currencySymbol}</p>
                      <p className="text-[10px] sm:text-xs text-gray-500">{cbIncidents.percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>

                {/* Maintenance Detail */}
                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-[rgba(0,0,0,0.06)]">
                  <p className="text-[10px] sm:text-xs text-gray-500 font-medium mb-1.5 sm:mb-2">Détail Maintenance</p>
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-gray-600">Pièces</span>
                    <span className="font-medium">{cbParts.toFixed(0)} {currencySymbol}</span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm mt-1">
                    <span className="text-gray-600">Main d'œuvre</span>
                    <span className="font-medium">{cbLabor.toFixed(0)} {currencySymbol}</span>
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
                  <div className="flex items-center gap-1 sm:gap-2">
                    {[
                      { value: 'week' as const, label: 'Semaine' },
                      { value: 'month' as const, label: 'Mois' },
                      { value: 'year' as const, label: 'Année' },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setTrendView(opt.value)}
                        className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold transition-all ${
                          trendView === opt.value ? 'shadow-sm' : 'hover:bg-gray-50'
                        }`}
                        style={{
                          backgroundColor: trendView === opt.value ? '#6A8A82' : 'transparent',
                          color: trendView === opt.value ? '#fff' : '#6B7280',
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Legend */}
                <div className="flex items-center flex-wrap gap-3 sm:gap-4 text-[10px] sm:text-xs mb-3 sm:mb-4">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 rounded" style={{ backgroundColor: '#6A8A82' }} />
                    <span className="text-gray-500">Carburant</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 rounded" style={{ backgroundColor: '#B87333' }} />
                    <span className="text-gray-500">Maintenance</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 rounded" style={{ backgroundColor: '#DC2626' }} />
                    <span className="text-gray-500">Autres</span>
                  </div>
                </div>

                <div className="overflow-x-auto -mx-4 sm:-mx-6 px-4 sm:px-6">
                  <div className="flex items-end gap-1 sm:gap-3 h-40 sm:h-56" style={{ minWidth: `${Math.max(filteredTrends.length * 70, 100)}px` }}>
                    {filteredTrends.map((trend, index) => {
                      const fuelHeight = (trend.fuel_cost / maxTrendCost) * 100;
                      const maintenanceHeight = (trend.maintenance_cost / maxTrendCost) * 100;
                      const incidentHeight = ((trend.incident_cost || 0) / maxTrendCost) * 100;

                      return (
                        <div key={index} className="flex-1 flex flex-col items-center" style={{ minWidth: '55px' }}>
                          <div className="w-full flex flex-col items-center space-y-1" style={{ height: '120px' }}>
                            <div className="flex-1 w-full flex items-end justify-center gap-0.5 sm:gap-1">
                              <div
                                className="w-2.5 sm:w-4 rounded-t-lg transition-all"
                                style={{ height: `${Math.max(fuelHeight, 2)}%`, backgroundColor: '#6A8A82' }}
                                title={`Carburant: ${trend.fuel_cost.toFixed(0)} ${currencySymbol}`}
                              />
                              <div
                                className="w-2.5 sm:w-4 rounded-t-lg transition-all"
                                style={{ height: `${Math.max(maintenanceHeight, 2)}%`, backgroundColor: '#B87333' }}
                                title={`Maintenance: ${trend.maintenance_cost.toFixed(0)} ${currencySymbol}`}
                              />
                              <div
                                className="w-2.5 sm:w-4 rounded-t-lg transition-all"
                                style={{ height: `${Math.max(incidentHeight, 2)}%`, backgroundColor: '#DC2626' }}
                                title={`Autres: ${(trend.incident_cost || 0).toFixed(0)} ${currencySymbol}`}
                              />
                            </div>
                          </div>
                          <div className="mt-1 sm:mt-2 text-center">
                            <p className="text-[9px] sm:text-xs font-medium text-gray-500">{trend.label}</p>
                            <p className="text-[9px] sm:text-xs font-semibold text-gray-800">{trend.total_cost.toFixed(0)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {filteredTrends.length === 0 && (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    Aucune donnée pour cette période
                  </div>
                )}
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
                    const count = s?.efficiency_distribution?.[status] ?? 0;
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
                    <p className="text-lg sm:text-2xl font-bold" style={{ color: '#6A8A82' }}>{totalDistance.value.toFixed(0)}</p>
                    <p className="text-[10px] sm:text-xs text-gray-500">km</p>
                  </div>
                </div>
                <div className={`mt-2 sm:mt-3 text-[10px] sm:text-sm font-medium flex items-center ${totalDistance.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totalDistance.change >= 0 ? <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> : <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />}
                  {totalDistance.change >= 0 ? '+' : ''}{totalDistance.change.toFixed(1)}%
                </div>
              </div>

              <div className="data-table-container p-3 sm:p-5">
                <h4 className="font-semibold text-xs sm:text-sm mb-2 sm:mb-4 text-gray-800">Carburant Total</h4>
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center" style={{ backgroundColor: '#F5E8DD' }}>
                    <Fuel className="w-4 h-4 sm:w-6 sm:h-6" style={{ color: '#B87333' }} />
                  </div>
                  <div>
                    <p className="text-lg sm:text-2xl font-bold" style={{ color: '#B87333' }}>{totalQuantity.value.toFixed(0)}</p>
                    <p className="text-[10px] sm:text-xs text-gray-500">litres</p>
                  </div>
                </div>
                <div className={`mt-2 sm:mt-3 text-[10px] sm:text-sm font-medium flex items-center ${totalQuantity.change <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totalQuantity.change <= 0 ? <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> : <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />}
                  {totalQuantity.change >= 0 ? '+' : ''}{totalQuantity.change.toFixed(1)}%
                </div>
              </div>

              <div className="data-table-container p-3 sm:p-5">
                <h4 className="font-semibold text-xs sm:text-sm mb-2 sm:mb-4 text-gray-800">Coût / km</h4>
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center" style={{ backgroundColor: '#DBEAFE' }}>
                    <Coins className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-lg sm:text-2xl font-bold text-blue-600">{costPerKm.value.toFixed(3)}</p>
                    <p className="text-[10px] sm:text-xs text-gray-500">{currencySymbol}/km</p>
                  </div>
                </div>
                <div className={`mt-2 sm:mt-3 text-[10px] sm:text-sm font-medium flex items-center ${costPerKm.change <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {costPerKm.change <= 0 ? <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> : <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />}
                  {costPerKm.change >= 0 ? '+' : ''}{costPerKm.change.toFixed(1)}%
                </div>
              </div>
            </div>

            {/* ===== ANALYSE DES CHAUFFEURS ===== */}
            <div className="data-table-container p-4 sm:p-6">
              <div className="flex items-center space-x-2 mb-4 sm:mb-6">
                <Star className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#B87333' }} />
                <h3 className="font-semibold text-sm sm:text-lg text-gray-800">Analyse des Chauffeurs</h3>
              </div>

              {/* Driver Status Distribution */}
              {data.driver_status_distribution && (
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {[
                    { key: 'available', label: 'Disponible', color: '#059669', bg: '#D1FAE5' },
                    { key: 'on_mission', label: 'En mission', color: '#B87333', bg: '#F5E8DD' },
                    { key: 'on_break', label: 'En pause', color: '#D97706', bg: '#FEF3C7' },
                    { key: 'off_duty', label: 'Hors service', color: '#DC2626', bg: '#FEE2E2' },
                  ].map((s) => (
                    <div key={s.key} className="text-center p-2 sm:p-3 rounded-xl" style={{ backgroundColor: s.bg }}>
                      <p className="text-lg sm:text-2xl font-bold" style={{ color: s.color }}>
                        {(data.driver_status_distribution as any)[s.key] || 0}
                      </p>
                      <p className="text-[9px] sm:text-xs font-medium" style={{ color: s.color }}>{s.label}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Driver Table */}
              {data.driver_analytics && data.driver_analytics.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b-2" style={{ borderColor: '#E8ECEC' }}>
                        <th className="text-left py-2 px-1 sm:px-2 font-semibold text-gray-600">Chauffeur</th>
                        <th className="text-center py-2 px-1 font-semibold text-gray-600">Note</th>
                        <th className="text-center py-2 px-1 font-semibold text-gray-600">Missions</th>
                        <th className="text-center py-2 px-1 font-semibold text-gray-600 hidden sm:table-cell">Retards</th>
                        <th className="text-center py-2 px-1 font-semibold text-gray-600">Incidents</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.driver_analytics.map((drv) => {
                        const ratingColor = drv.rating >= 4 ? '#059669' : drv.rating >= 3 ? '#D97706' : '#DC2626';
                        return (
                          <tr key={drv.id} className="border-b" style={{ borderColor: '#F3F4F6' }}>
                            <td className="py-2 px-1 sm:px-2">
                              <p className="font-semibold text-gray-800 truncate max-w-[120px] sm:max-w-none">{drv.full_name}</p>
                              <p className="text-[10px] text-gray-500">{drv.employee_id}</p>
                            </td>
                            <td className="text-center py-2 px-1">
                              <div className="flex items-center justify-center gap-0.5">
                                <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-yellow-400 text-yellow-400" />
                                <span className="font-bold" style={{ color: ratingColor }}>{drv.rating.toFixed(1)}</span>
                              </div>
                            </td>
                            <td className="text-center py-2 px-1">
                              <span className="font-bold" style={{ color: '#6A8A82' }}>{drv.completed_missions}</span>
                              <span className="text-gray-400">/{drv.total_missions}</span>
                            </td>
                            <td className="text-center py-2 px-1 hidden sm:table-cell">
                              <span className={`font-bold ${drv.late_rate > 20 ? 'text-red-500' : drv.late_rate > 10 ? 'text-yellow-600' : 'text-green-600'}`}>
                                {drv.late_count}
                              </span>
                              <span className="text-[10px] text-gray-400 ml-0.5">({drv.late_rate}%)</span>
                            </td>
                            <td className="text-center py-2 px-1">
                              <span className={`font-bold ${drv.incident_count > 0 ? 'text-red-500' : 'text-green-600'}`}>
                                {drv.incident_count}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center py-6 text-gray-400 text-sm">Aucun chauffeur</p>
              )}
            </div>

            {/* ===== ANALYSE DES VÉHICULES ===== */}
            <div className="data-table-container p-4 sm:p-6">
              <div className="flex items-center space-x-2 mb-4 sm:mb-6">
                <Wrench className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#6A8A82' }} />
                <h3 className="font-semibold text-sm sm:text-lg text-gray-800">Analyse des Véhicules</h3>
              </div>

              {data.vehicle_analytics && data.vehicle_analytics.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b-2" style={{ borderColor: '#E8ECEC' }}>
                        <th className="text-left py-2 px-1 sm:px-2 font-semibold text-gray-600">Véhicule</th>
                        <th className="text-center py-2 px-1 font-semibold text-gray-600">km</th>
                        <th className="text-center py-2 px-1 font-semibold text-gray-600 hidden sm:table-cell">Conso.</th>
                        <th className="text-center py-2 px-1 font-semibold text-gray-600">Carburant</th>
                        <th className="text-center py-2 px-1 font-semibold text-gray-600">Maint.</th>
                        <th className="text-center py-2 px-1 font-semibold text-gray-600 hidden sm:table-cell">Pannes</th>
                        <th className="text-center py-2 px-1 font-semibold text-gray-600">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.vehicle_analytics.map((veh) => (
                        <tr key={veh.id} className="border-b" style={{ borderColor: '#F3F4F6' }}>
                          <td className="py-2 px-1 sm:px-2">
                            <p className="font-semibold text-gray-800">{veh.license_plate}</p>
                            <p className="text-[10px] text-gray-500">{veh.brand} {veh.model}</p>
                          </td>
                          <td className="text-center py-2 px-1 font-medium text-gray-700">
                            {(veh.current_mileage / 1000).toFixed(0)}k
                          </td>
                          <td className="text-center py-2 px-1 hidden sm:table-cell">
                            <span className="font-medium" style={{ color: veh.avg_consumption > 12 ? '#DC2626' : '#059669' }}>
                              {veh.avg_consumption.toFixed(1)}
                            </span>
                            <span className="text-[10px] text-gray-400 ml-0.5">L/100</span>
                          </td>
                          <td className="text-center py-2 px-1 font-medium" style={{ color: '#6A8A82' }}>
                            {veh.fuel_cost.toFixed(0)} {currencySymbol}
                          </td>
                          <td className="text-center py-2 px-1">
                            <span className="font-medium" style={{ color: '#B87333' }}>{veh.maintenance_cost.toFixed(0)}</span>
                            <span className="text-[10px] text-gray-400 block">
                              P:{veh.preventive_count} C:{veh.corrective_count}
                            </span>
                          </td>
                          <td className="text-center py-2 px-1 hidden sm:table-cell">
                            <span className={`font-bold ${veh.incident_count > 0 ? 'text-red-500' : 'text-green-600'}`}>
                              {veh.incident_count}
                            </span>
                          </td>
                          <td className="text-center py-2 px-1 font-bold text-gray-800">
                            {veh.total_cost.toFixed(0)} {currencySymbol}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center py-6 text-gray-400 text-sm">Aucun véhicule</p>
              )}
            </div>

            {/* ===== ANALYSE DES INCIDENTS ===== */}
            {data.incident_analytics && (
              <div className="data-table-container p-4 sm:p-6">
                <div className="flex items-center space-x-2 mb-4 sm:mb-6">
                  <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#DC2626' }} />
                  <h3 className="font-semibold text-sm sm:text-lg text-gray-800">Analyse des Incidents</h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                  <div className="p-3 rounded-xl text-center" style={{ backgroundColor: '#FEE2E2' }}>
                    <p className="text-xl sm:text-2xl font-bold text-red-600">{data.incident_analytics.total_count}</p>
                    <p className="text-[10px] sm:text-xs text-red-500">Total incidents</p>
                  </div>
                  <div className="p-3 rounded-xl text-center" style={{ backgroundColor: '#D1FAE5' }}>
                    <p className="text-xl sm:text-2xl font-bold text-green-600">{data.incident_analytics.resolved_count}</p>
                    <p className="text-[10px] sm:text-xs text-green-600">Résolus</p>
                  </div>
                  <div className="p-3 rounded-xl text-center col-span-2 sm:col-span-1" style={{ backgroundColor: '#F5E8DD' }}>
                    <p className="text-xl sm:text-2xl font-bold" style={{ color: '#B87333' }}>{data.incident_analytics.avg_cost.toFixed(0)} {currencySymbol}</p>
                    <p className="text-[10px] sm:text-xs" style={{ color: '#B87333' }}>Coût moyen</p>
                  </div>
                </div>

                {/* Type breakdown */}
                <h4 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">Par type</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                  {Object.entries(data.incident_analytics.by_type).map(([type, stats]) => {
                    const typeLabels: Record<string, string> = {
                      flat_tire: 'Pneu crevé', breakdown: 'Panne', accident: 'Accident',
                      fuel_issue: 'Carburant', traffic_violation: 'Infraction', other: 'Autre',
                    };
                    return stats.count > 0 ? (
                      <div key={type} className="p-2 sm:p-3 rounded-lg border" style={{ borderColor: '#E8ECEC' }}>
                        <p className="font-semibold text-xs sm:text-sm text-gray-800">{typeLabels[type] || type}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-sm sm:text-lg font-bold text-red-500">{stats.count}</span>
                          <span className="text-[10px] sm:text-xs text-gray-500">{stats.avg_cost.toFixed(0)} {currencySymbol}/moy</span>
                        </div>
                      </div>
                    ) : null;
                  })}
                </div>

                {/* Locations */}
                {data.incident_analytics.locations.length > 0 && (
                  <>
                    <h4 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">Localisations fréquentes</h4>
                    <div className="space-y-1.5">
                      {data.incident_analytics.locations.slice(0, 5).map((loc) => (
                        <div key={loc.id} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
                          <MapPin className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                          <p className="text-xs text-gray-700 truncate flex-1">{loc.address || `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`}</p>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-600 font-medium flex-shrink-0">{loc.severity}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ===== ANALYSE FINANCIÈRE ===== */}
            {data.financial && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Budget Summary */}
                <div className="data-table-container p-4 sm:p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Coins className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#6A8A82' }} />
                    <h3 className="font-semibold text-sm sm:text-lg text-gray-800">Résumé Financier</h3>
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: 'Carburant', value: data.financial.budget_summary.fuel, color: '#6A8A82' },
                      { label: 'Maintenance (pièces)', value: data.financial.budget_summary.maintenance_parts, color: '#B87333' },
                      { label: 'Maintenance (main d\'oeuvre)', value: data.financial.budget_summary.maintenance_labor, color: '#D97706' },
                      { label: 'Autres (incidents)', value: data.financial.budget_summary.incidents, color: '#DC2626' },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-xs sm:text-sm text-gray-700">{item.label}</span>
                        </div>
                        <span className="font-bold text-xs sm:text-sm" style={{ color: item.color }}>{item.value.toFixed(0)} {currencySymbol}</span>
                      </div>
                    ))}
                    <div className="border-t pt-2 mt-2 flex items-center justify-between" style={{ borderColor: '#E8ECEC' }}>
                      <span className="font-bold text-sm text-gray-800">Total</span>
                      <span className="font-bold text-base sm:text-lg text-gray-900">{data.financial.budget_summary.total.toFixed(0)} {currencySymbol}</span>
                    </div>
                  </div>
                </div>

                {/* Cost per Driver */}
                <div className="data-table-container p-4 sm:p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Star className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#B87333' }} />
                    <h3 className="font-semibold text-sm sm:text-lg text-gray-800">Coût par Chauffeur</h3>
                  </div>
                  {data.financial.cost_per_driver.length > 0 ? (
                    <div className="space-y-2">
                      {data.financial.cost_per_driver.map((drv, i) => {
                        const maxCost = data.financial.cost_per_driver[0]?.total_cost || 1;
                        const barWidth = (drv.total_cost / maxCost) * 100;
                        return (
                          <div key={drv.id}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs sm:text-sm font-medium text-gray-700 truncate">{drv.full_name}</span>
                              <span className="text-xs sm:text-sm font-bold text-gray-800 ml-2 flex-shrink-0">{drv.total_cost.toFixed(0)} {currencySymbol}</span>
                            </div>
                            <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#E8ECEC' }}>
                              <div className="h-full rounded-full" style={{ width: `${barWidth}%`, background: 'linear-gradient(to right, #6A8A82, #B87333)' }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-center py-6 text-gray-400 text-sm">Aucune donnée</p>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
