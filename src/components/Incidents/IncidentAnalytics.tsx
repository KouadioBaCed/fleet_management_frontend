import { useState, useEffect, useCallback, useRef } from 'react';
import {
  AlertTriangle,
  Calendar,
  ChevronDown,
  Loader2,
  Coins,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Car,
  User,
  BarChart3,
  PieChart,
  Clock,
  RefreshCw
} from 'lucide-react';
import {
  incidentsApi,
  type IncidentAnalytics as IncidentAnalyticsType,
  type IncidentAnalyticsPeriod
} from '@/api/incidents';
import { useCurrency } from '@/store/settingsStore';
import { getCurrencySymbol } from '@/api/settings';

const PERIODS: { value: IncidentAnalyticsPeriod; label: string }[] = [
  { value: 'week', label: '7 derniers jours' },
  { value: 'month', label: 'Ce mois' },
  { value: 'last_month', label: 'Mois dernier' },
  { value: '3_months', label: '3 derniers mois' },
  { value: '6_months', label: '6 derniers mois' },
  { value: 'year', label: 'Cette année' },
  { value: 'custom', label: 'Personnalisé' },
];

const TYPE_ICONS: Record<string, string> = {
  flat_tire: '🛞',
  breakdown: '🔧',
  accident: '💥',
  fuel_issue: '⛽',
  traffic_violation: '🚨',
  other: '❓',
};

const SEVERITY_CONFIG = {
  minor: { label: 'Mineur', color: '#6A8A82', bg: '#E8EFED' },
  moderate: { label: 'Modéré', color: '#6B7280', bg: '#F3F4F6' },
  major: { label: 'Majeur', color: '#B87333', bg: '#F5E8DD' },
  critical: { label: 'Critique', color: '#DC2626', bg: '#FEE2E2' },
};

export default function IncidentAnalytics() {
  const currency = useCurrency();
  const currencySymbol = getCurrencySymbol(currency);

  const [data, setData] = useState<IncidentAnalyticsType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<IncidentAnalyticsPeriod>('month');
  const [showPeriodMenu, setShowPeriodMenu] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const periodRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await incidentsApi.getAnalytics({
        period: selectedPeriod !== 'custom' ? selectedPeriod : undefined,
        start_date: selectedPeriod === 'custom' ? customStartDate : undefined,
        end_date: selectedPeriod === 'custom' ? customEndDate : undefined,
      });
      setData(response);
    } catch (err: any) {
      console.error('Error fetching incident analytics:', err);
      setError(err?.response?.data?.detail || err?.message || 'Erreur lors du chargement des analyses');
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#6A8A82' }} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white rounded-2xl border-2 p-12 text-center" style={{ borderColor: '#E8ECEC' }}>
        <AlertTriangle className="w-12 h-12 mx-auto mb-4" style={{ color: '#B87333' }} />
        <h3 className="text-xl font-bold text-gray-900">Erreur de chargement</h3>
        <p className="text-gray-500 mt-2">{error || 'Impossible de charger les analyses'}</p>
        <button
          onClick={fetchData}
          className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:-translate-y-0.5"
          style={{ backgroundColor: '#6A8A82' }}
        >
          <RefreshCw className="w-4 h-4" />
          Réessayer
        </button>
      </div>
    );
  }

  const maxMonthlyCount = Math.max(...data.monthly_trends.map(t => t.count), 1);
  const maxTypeCost = Math.max(...data.costs_by_type.map(c => c.cost), 1);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with Period Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <div>
          <h2 className="text-lg sm:text-xl font-bold" style={{ color: '#191919' }}>Analyse des Incidents</h2>
          <p className="text-xs sm:text-sm text-gray-500">
            {new Date(data.period.start).toLocaleDateString('fr-FR')} - {new Date(data.period.end).toLocaleDateString('fr-FR')}
          </p>
        </div>

        {/* Period Selector */}
        <div className="relative w-full sm:w-auto" ref={periodRef}>
          <button
            onClick={() => setShowPeriodMenu(!showPeriodMenu)}
            className="flex items-center justify-center sm:justify-start space-x-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-white border-2 rounded-xl hover:shadow-md transition-all w-full sm:w-auto"
            style={{ borderColor: '#E8ECEC' }}
          >
            <Calendar className="w-4 h-4" style={{ color: '#6A8A82' }} />
            <span className="font-medium text-xs sm:text-sm" style={{ color: '#6A8A82' }}>
              {PERIODS.find(p => p.value === selectedPeriod)?.label}
            </span>
            <ChevronDown className="w-4 h-4" style={{ color: '#6A8A82' }} />
          </button>

          {showPeriodMenu && (
            <div className="absolute top-full mt-2 right-0 bg-white border-2 rounded-xl shadow-xl py-2 z-20 min-w-[200px]" style={{ borderColor: '#E8ECEC' }}>
              {PERIODS.map((period) => (
                <button
                  key={period.value}
                  onClick={() => {
                    setSelectedPeriod(period.value);
                    if (period.value !== 'custom') setShowPeriodMenu(false);
                  }}
                  className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition-all text-sm ${
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
                <div className="px-4 py-3 border-t" style={{ borderColor: '#E8ECEC' }}>
                  <div className="space-y-2">
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-full px-3 py-2 border-2 rounded-lg text-sm"
                      style={{ borderColor: '#E8ECEC' }}
                    />
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-full px-3 py-2 border-2 rounded-lg text-sm"
                      style={{ borderColor: '#E8ECEC' }}
                    />
                    <button
                      onClick={() => setShowPeriodMenu(false)}
                      disabled={!customStartDate || !customEndDate}
                      className="w-full py-2 rounded-lg text-white font-medium text-sm disabled:opacity-50"
                      style={{ backgroundColor: '#6A8A82' }}
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

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        {/* Total Incidents */}
        <div className="bg-white rounded-lg sm:rounded-xl border-2 p-3 sm:p-4" style={{ borderColor: '#E8ECEC' }}>
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#B87333' }} />
            <span className={`text-[10px] sm:text-xs font-medium flex items-center ${data.summary.count_change <= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data.summary.count_change <= 0 ? <TrendingDown className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" /> : <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />}
              {Math.abs(data.summary.count_change)}%
            </span>
          </div>
          <p className="text-lg sm:text-2xl font-bold" style={{ color: '#191919' }}>{data.summary.total_count}</p>
          <p className="text-[10px] sm:text-xs text-gray-500">Incidents total</p>
        </div>

        {/* Resolved */}
        <div className="bg-white rounded-lg sm:rounded-xl border-2 p-3 sm:p-4" style={{ borderColor: '#E8ECEC' }}>
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#059669' }} />
            <span className="text-[10px] sm:text-xs font-medium text-green-600">{data.summary.resolution_rate.toFixed(0)}%</span>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-green-600">{data.summary.resolved_count}</p>
          <p className="text-[10px] sm:text-xs text-gray-500">Résolus</p>
        </div>

        {/* Unresolved */}
        <div className="bg-white rounded-lg sm:rounded-xl border-2 p-3 sm:p-4" style={{ borderColor: '#E8ECEC' }}>
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <XCircle className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#DC2626' }} />
          </div>
          <p className="text-lg sm:text-2xl font-bold text-red-600">{data.summary.unresolved_count}</p>
          <p className="text-[10px] sm:text-xs text-gray-500">Non résolus</p>
        </div>

        {/* Total Cost */}
        <div className="bg-white rounded-lg sm:rounded-xl border-2 p-3 sm:p-4" style={{ borderColor: '#E8ECEC' }}>
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <Coins className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#B87333' }} />
            <span className={`text-[10px] sm:text-xs font-medium flex items-center ${data.summary.cost_change <= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data.summary.cost_change <= 0 ? <TrendingDown className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" /> : <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />}
              {Math.abs(data.summary.cost_change)}%
            </span>
          </div>
          <p className="text-lg sm:text-2xl font-bold" style={{ color: '#B87333' }}>{currencySymbol}{data.summary.total_cost.toFixed(0)}</p>
          <p className="text-[10px] sm:text-xs text-gray-500">Coût total</p>
        </div>
      </div>

      {/* Distribution Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* By Severity */}
        <div className="bg-white rounded-xl sm:rounded-2xl border-2 p-3 sm:p-5" style={{ borderColor: '#E8ECEC' }}>
          <div className="flex items-center space-x-2 mb-3 sm:mb-4">
            <PieChart className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#6A8A82' }} />
            <h3 className="font-bold text-sm sm:text-base" style={{ color: '#191919' }}>Par Gravité</h3>
          </div>

          <div className="space-y-2 sm:space-y-3">
            {Object.entries(data.by_severity).map(([key, value]) => {
              const config = SEVERITY_CONFIG[key as keyof typeof SEVERITY_CONFIG];
              return (
                <div key={key} className="flex items-center gap-2 sm:gap-3">
                  <div
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-xs sm:text-sm font-bold flex-shrink-0"
                    style={{ backgroundColor: config.bg, color: config.color }}
                  >
                    {value.count}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-xs sm:text-sm mb-1">
                      <span className="font-medium truncate">{config.label}</span>
                      <span className="text-gray-500 ml-2">{value.percentage.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 sm:h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#E8ECEC' }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${value.percentage}%`, backgroundColor: config.color }}
                      />
                    </div>
                  </div>
                  <div className="text-right w-14 sm:w-20 flex-shrink-0">
                    <p className="font-bold text-xs sm:text-sm" style={{ color: config.color }}>{currencySymbol}{value.cost.toFixed(0)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* By Type */}
        <div className="bg-white rounded-xl sm:rounded-2xl border-2 p-3 sm:p-5" style={{ borderColor: '#E8ECEC' }}>
          <div className="flex items-center space-x-2 mb-3 sm:mb-4">
            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#B87333' }} />
            <h3 className="font-bold text-sm sm:text-base" style={{ color: '#191919' }}>Par Type</h3>
          </div>

          <div className="space-y-2 sm:space-y-3">
            {Object.entries(data.by_type).map(([key, value]) => {
              const icon = TYPE_ICONS[key] || '❓';
              return (
                <div key={key} className="flex items-center gap-2 sm:gap-3">
                  <div className="text-base sm:text-xl w-6 sm:w-8 flex-shrink-0">{icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-xs sm:text-sm mb-1">
                      <span className="font-medium truncate">{value.label}</span>
                      <span className="text-gray-500 ml-2">{value.count} ({value.percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="h-1.5 sm:h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#E8ECEC' }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${value.percentage}%`, backgroundColor: '#6A8A82' }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Costs by Type */}
      {data.costs_by_type.length > 0 && (
        <div className="bg-white rounded-xl sm:rounded-2xl border-2 p-3 sm:p-5" style={{ borderColor: '#E8ECEC' }}>
          <div className="flex items-center space-x-2 mb-3 sm:mb-4">
            <Coins className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#B87333' }} />
            <h3 className="font-bold text-sm sm:text-base" style={{ color: '#191919' }}>Coûts par Type d'Incident</h3>
          </div>

          <div className="flex items-end space-x-1 sm:space-x-3 h-32 sm:h-40 overflow-x-auto">
            {data.costs_by_type.map((item) => {
              const height = (item.cost / maxTypeCost) * 100;
              return (
                <div key={item.type} className="flex-1 min-w-[40px] sm:min-w-[60px] flex flex-col items-center">
                  <div
                    className="w-full max-w-10 sm:max-w-16 rounded-t-lg transition-all hover:opacity-80"
                    style={{
                      height: `${Math.max(height, 5)}%`,
                      background: 'linear-gradient(to top, #B87333, #D4956A)'
                    }}
                  />
                  <div className="mt-1 sm:mt-2 text-center">
                    <p className="text-sm sm:text-lg">{TYPE_ICONS[item.type]}</p>
                    <p className="text-[10px] sm:text-xs font-bold" style={{ color: '#B87333' }}>{currencySymbol}{item.cost.toFixed(0)}</p>
                    <p className="text-[10px] sm:text-xs text-gray-500">{item.count} inc.</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Monthly Trends */}
      <div className="bg-white rounded-xl sm:rounded-2xl border-2 p-3 sm:p-5" style={{ borderColor: '#E8ECEC' }}>
        <div className="flex items-center space-x-2 mb-3 sm:mb-4">
          <Clock className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#6A8A82' }} />
          <h3 className="font-bold text-sm sm:text-base" style={{ color: '#191919' }}>Évolution Mensuelle</h3>
        </div>

        <div className="flex items-end space-x-1 sm:space-x-2 h-36 sm:h-48 overflow-x-auto">
          {data.monthly_trends.map((month) => {
            const totalHeight = (month.count / maxMonthlyCount) * 100;
            const { minor, moderate, major, critical } = month.by_severity;
            const total = month.count || 1;

            return (
              <div key={month.month} className="flex-1 min-w-[28px] sm:min-w-[40px] flex flex-col items-center">
                <div className="w-full flex flex-col items-center" style={{ height: '120px' }}>
                  <div
                    className="w-full max-w-8 sm:max-w-12 rounded-t-lg overflow-hidden flex flex-col-reverse"
                    style={{ height: `${Math.max(totalHeight, 5)}%` }}
                  >
                    {minor > 0 && (
                      <div style={{ height: `${(minor / total) * 100}%`, backgroundColor: SEVERITY_CONFIG.minor.color }} />
                    )}
                    {moderate > 0 && (
                      <div style={{ height: `${(moderate / total) * 100}%`, backgroundColor: SEVERITY_CONFIG.moderate.color }} />
                    )}
                    {major > 0 && (
                      <div style={{ height: `${(major / total) * 100}%`, backgroundColor: SEVERITY_CONFIG.major.color }} />
                    )}
                    {critical > 0 && (
                      <div style={{ height: `${(critical / total) * 100}%`, backgroundColor: SEVERITY_CONFIG.critical.color }} />
                    )}
                  </div>
                </div>
                <div className="mt-1 sm:mt-2 text-center">
                  <p className="text-[10px] sm:text-xs font-medium text-gray-500">{month.label.split(' ')[0].slice(0, 3)}</p>
                  <p className="text-[10px] sm:text-xs font-bold" style={{ color: '#191919' }}>{month.count}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t flex items-center justify-center gap-2 sm:gap-4 flex-wrap" style={{ borderColor: '#E8ECEC' }}>
          {Object.entries(SEVERITY_CONFIG).map(([key, config]) => (
            <div key={key} className="flex items-center space-x-1">
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded" style={{ backgroundColor: config.color }} />
              <span className="text-[10px] sm:text-xs text-gray-500">{config.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Vehicles & Drivers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Top Vehicles */}
        <div className="bg-white rounded-xl sm:rounded-2xl border-2 p-3 sm:p-5" style={{ borderColor: '#E8ECEC' }}>
          <div className="flex items-center space-x-2 mb-3 sm:mb-4">
            <Car className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#DC2626' }} />
            <h3 className="font-bold text-sm sm:text-base" style={{ color: '#191919' }}>Véhicules les Plus Impactés</h3>
          </div>

          {data.top_vehicles.length > 0 ? (
            <div className="space-y-2 sm:space-y-3">
              {data.top_vehicles.map((vehicle, index) => (
                <div
                  key={vehicle.vehicle_id}
                  className="flex items-center justify-between p-2 sm:p-3 rounded-lg sm:rounded-xl"
                  style={{ backgroundColor: index === 0 ? '#FEE2E2' : '#F9FAFB' }}
                >
                  <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                    <div
                      className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold flex-shrink-0"
                      style={{ backgroundColor: index === 0 ? '#DC2626' : '#9CA3AF' }}
                    >
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-xs sm:text-sm truncate">{vehicle.plate}</p>
                      <p className="text-[10px] sm:text-xs text-gray-500 truncate">{vehicle.brand} {vehicle.model}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="font-bold text-xs sm:text-sm text-red-600">{vehicle.count} inc.</p>
                    <p className="text-[10px] sm:text-xs text-gray-500">{currencySymbol}{vehicle.cost.toFixed(0)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs sm:text-sm text-gray-500 text-center py-4">Aucune donnée</p>
          )}
        </div>

        {/* Top Drivers */}
        <div className="bg-white rounded-xl sm:rounded-2xl border-2 p-3 sm:p-5" style={{ borderColor: '#E8ECEC' }}>
          <div className="flex items-center space-x-2 mb-3 sm:mb-4">
            <User className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#B87333' }} />
            <h3 className="font-bold text-sm sm:text-base" style={{ color: '#191919' }}>Conducteurs les Plus Impactés</h3>
          </div>

          {data.top_drivers.length > 0 ? (
            <div className="space-y-2 sm:space-y-3">
              {data.top_drivers.map((driver, index) => (
                <div
                  key={driver.driver_id}
                  className="flex items-center justify-between p-2 sm:p-3 rounded-lg sm:rounded-xl"
                  style={{ backgroundColor: index === 0 ? '#F5E8DD' : '#F9FAFB' }}
                >
                  <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                    <div
                      className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold flex-shrink-0"
                      style={{ backgroundColor: index === 0 ? '#B87333' : '#9CA3AF' }}
                    >
                      {driver.name.charAt(0)}
                    </div>
                    <p className="font-semibold text-xs sm:text-sm truncate">{driver.name}</p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="font-bold text-xs sm:text-sm" style={{ color: '#B87333' }}>{driver.count} inc.</p>
                    <p className="text-[10px] sm:text-xs text-gray-500">{currencySymbol}{driver.cost.toFixed(0)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs sm:text-sm text-gray-500 text-center py-4">Aucune donnée</p>
          )}
        </div>
      </div>

      {/* Recent Incidents */}
      {data.recent_incidents.length > 0 && (
        <div className="bg-white rounded-xl sm:rounded-2xl border-2 p-3 sm:p-5" style={{ borderColor: '#E8ECEC' }}>
          <div className="flex items-center space-x-2 mb-3 sm:mb-4">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#B87333' }} />
            <h3 className="font-bold text-sm sm:text-base" style={{ color: '#191919' }}>Incidents Récents</h3>
          </div>

          {/* Mobile card view */}
          <div className="sm:hidden space-y-2">
            {data.recent_incidents.slice(0, 5).map((incident) => {
              const sevConfig = SEVERITY_CONFIG[incident.severity as keyof typeof SEVERITY_CONFIG];
              return (
                <div key={incident.id} className="p-3 rounded-lg bg-gray-50 border" style={{ borderColor: '#E8ECEC' }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{TYPE_ICONS[incident.type]}</span>
                      <span className="font-medium text-xs truncate max-w-[120px]" style={{ color: '#191919' }}>{incident.title}</span>
                    </div>
                    {incident.is_resolved ? (
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-gray-500">{new Date(incident.reported_at).toLocaleDateString('fr-FR')}</span>
                    <span className="text-gray-500">{incident.vehicle_plate}</span>
                    <span className="px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: sevConfig.bg, color: sevConfig.color }}>
                      {sevConfig.label}
                    </span>
                    <span className="font-medium" style={{ color: '#B87333' }}>
                      {incident.cost ? `${incident.cost.toFixed(0)}${currencySymbol}` : '-'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop table view */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ borderColor: '#E8ECEC' }}>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500">DATE</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500">TYPE</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500">TITRE</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500">VÉHICULE</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500">GRAVITÉ</th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500">COÛT</th>
                  <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500">STATUT</th>
                </tr>
              </thead>
              <tbody>
                {data.recent_incidents.slice(0, 5).map((incident) => {
                  const sevConfig = SEVERITY_CONFIG[incident.severity as keyof typeof SEVERITY_CONFIG];
                  return (
                    <tr key={incident.id} className="border-b hover:bg-gray-50" style={{ borderColor: '#E8ECEC' }}>
                      <td className="py-3 px-3 text-sm text-gray-600">
                        {new Date(incident.reported_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-lg">{TYPE_ICONS[incident.type]}</span>
                      </td>
                      <td className="py-3 px-3 text-sm font-medium" style={{ color: '#191919' }}>
                        {incident.title}
                      </td>
                      <td className="py-3 px-3 text-sm text-gray-600">{incident.vehicle_plate}</td>
                      <td className="py-3 px-3">
                        <span
                          className="px-2 py-1 rounded-full text-xs font-medium"
                          style={{ backgroundColor: sevConfig.bg, color: sevConfig.color }}
                        >
                          {sevConfig.label}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right text-sm font-medium" style={{ color: '#B87333' }}>
                        {incident.cost ? `${incident.cost.toFixed(0)} ${currencySymbol}` : '-'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {incident.is_resolved ? (
                          <CheckCircle className="w-5 h-5 mx-auto text-green-500" />
                        ) : (
                          <XCircle className="w-5 h-5 mx-auto text-red-500" />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cost Summary */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white">
        <h3 className="font-bold text-base sm:text-lg mb-3 sm:mb-4">Résumé des Coûts</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white/20 rounded-lg sm:rounded-xl p-3 sm:p-4 backdrop-blur-sm">
            <p className="text-xs sm:text-sm opacity-90">Coût Total</p>
            <p className="text-xl sm:text-3xl font-bold">{currencySymbol}{data.summary.total_cost.toFixed(0)}</p>
          </div>
          <div className="bg-white/20 rounded-lg sm:rounded-xl p-3 sm:p-4 backdrop-blur-sm">
            <p className="text-xs sm:text-sm opacity-90">Coût Moyen / Incident</p>
            <p className="text-xl sm:text-3xl font-bold">{currencySymbol}{data.summary.avg_cost.toFixed(0)}</p>
          </div>
          <div className="bg-white/20 rounded-lg sm:rounded-xl p-3 sm:p-4 backdrop-blur-sm">
            <p className="text-xs sm:text-sm opacity-90">Variation</p>
            <p className="text-xl sm:text-3xl font-bold flex items-center">
              {data.summary.cost_change <= 0 ? (
                <TrendingDown className="w-4 h-4 sm:w-6 sm:h-6 mr-1 sm:mr-2" />
              ) : (
                <TrendingUp className="w-4 h-4 sm:w-6 sm:h-6 mr-1 sm:mr-2" />
              )}
              {data.summary.cost_change >= 0 ? '+' : ''}{data.summary.cost_change.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
