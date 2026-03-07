import { useState, useEffect } from 'react';
import {
  Users,
  TrendingUp,
  TrendingDown,
  MapPin,
  AlertTriangle,
  Award,
  Calendar,
  Loader2,
  Star,
  Trophy,
  Zap,
  Car,
  ChevronRight,
} from 'lucide-react';
import {
  driversApi,
  type DriverAnalytics as DriverAnalyticsType,
  type DriverAnalyticsPeriod,
  type DriverMetric,
} from '@/api/drivers';

const periodOptions: { value: DriverAnalyticsPeriod; label: string }[] = [
  { value: 'week', label: '7 derniers jours' },
  { value: 'month', label: 'Ce mois' },
  { value: 'last_month', label: 'Mois dernier' },
  { value: '3_months', label: '3 derniers mois' },
  { value: '6_months', label: '6 derniers mois' },
  { value: 'year', label: 'Cette année' },
  { value: 'custom', label: 'Personnalisé' },
];

export default function DriverAnalytics() {
  const [analytics, setAnalytics] = useState<DriverAnalyticsType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<DriverAnalyticsPeriod>('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedComparison, setSelectedComparison] = useState<'trips' | 'distance' | 'efficiency' | 'rating'>('trips');

  const fetchAnalytics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const filters: { period?: DriverAnalyticsPeriod; start_date?: string; end_date?: string } = {};
      if (period === 'custom' && startDate && endDate) {
        filters.period = 'custom';
        filters.start_date = startDate;
        filters.end_date = endDate;
      } else if (period !== 'custom') {
        filters.period = period;
      }
      const data = await driversApi.getAnalytics(filters);
      setAnalytics(data);
    } catch (err) {
      console.error('Error fetching driver analytics:', err);
      setError('Erreur lors du chargement des analyses');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (period !== 'custom' || (startDate && endDate)) {
      fetchAnalytics();
    }
  }, [period, startDate, endDate]);

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return null;
  };

  const getChangeColor = (change: number, inverse = false) => {
    if (inverse) {
      if (change > 0) return 'text-red-500';
      if (change < 0) return 'text-green-500';
    } else {
      if (change > 0) return 'text-green-500';
      if (change < 0) return 'text-red-500';
    }
    return 'text-gray-500';
  };

  const getComparisonData = (): DriverMetric[] => {
    if (!analytics) return [];
    switch (selectedComparison) {
      case 'trips':
        return analytics.comparison.top_by_trips;
      case 'distance':
        return analytics.comparison.top_by_distance;
      case 'efficiency':
        return analytics.comparison.top_by_efficiency;
      case 'rating':
        return analytics.comparison.top_by_rating;
      default:
        return analytics.comparison.top_by_trips;
    }
  };

  const getComparisonValue = (driver: DriverMetric): string => {
    switch (selectedComparison) {
      case 'trips':
        return `${driver.trips_count} trajets`;
      case 'distance':
        return `${driver.distance.toLocaleString('fr-FR')} km`;
      case 'efficiency':
        return `${driver.efficiency} km/L`;
      case 'rating':
        return `${driver.rating.toFixed(1)}/5`;
      default:
        return '';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#6A8A82';
    if (score >= 60) return '#B87333';
    if (score >= 40) return '#6B7280';
    return '#DC2626';
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return { bg: '#FEF3C7', color: '#D97706', icon: Trophy };
    if (rank === 2) return { bg: '#E8ECEC', color: '#6B7280', icon: Award };
    if (rank === 3) return { bg: '#F5E8DD', color: '#B87333', icon: Award };
    return { bg: '#F3F4F6', color: '#9CA3AF', icon: null };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 sm:py-20">
        <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white shadow-md border border-gray-200">
          <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" style={{ color: '#6A8A82' }} />
          <span className="text-sm font-medium text-gray-600">Chargement...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-lg sm:rounded-xl p-4 sm:p-6 text-center mx-2 sm:mx-0">
        <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-red-500 mx-auto mb-2" />
        <p className="text-red-700 font-medium text-sm sm:text-base">{error}</p>
        <button
          onClick={fetchAnalytics}
          className="mt-3 px-3 sm:px-4 py-1.5 sm:py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition-colors text-sm"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (!analytics) return null;

  const maxTrend = Math.max(...analytics.monthly_trends.map(t => t.trips), 1);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Period Selector */}
      <div className="bg-white rounded-xl sm:rounded-2xl border-2 p-3 sm:p-6" style={{ borderColor: '#E8ECEC' }}>
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-3 sm:gap-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#6A8A82' }} />
            <span className="font-semibold text-gray-700 text-sm sm:text-base">Période :</span>
          </div>
          <div className="flex flex-wrap gap-1.5 sm:gap-2 w-full sm:w-auto">
            {periodOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setPeriod(option.value)}
                className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  period === option.value ? 'shadow-md' : 'hover:bg-gray-100'
                }`}
                style={{
                  backgroundColor: period === option.value ? '#6A8A82' : 'transparent',
                  color: period === option.value ? '#ffffff' : '#6B7280',
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
          {period === 'custom' && (
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto sm:ml-auto">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="flex-1 sm:flex-none px-2 sm:px-3 py-1.5 sm:py-2 border-2 rounded-lg text-xs sm:text-sm"
                style={{ borderColor: '#E8ECEC' }}
              />
              <span className="text-gray-500 text-sm">à</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="flex-1 sm:flex-none px-2 sm:px-3 py-1.5 sm:py-2 border-2 rounded-lg text-xs sm:text-sm"
                style={{ borderColor: '#E8ECEC' }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <div className="bg-white rounded-xl sm:rounded-2xl border-2 p-3 sm:p-5" style={{ borderColor: '#6A8A82' }}>
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center" style={{ backgroundColor: '#E8EFED' }}>
              <Users className="w-4 h-4 sm:w-6 sm:h-6" style={{ color: '#6A8A82' }} />
            </div>
            <div className="text-right">
              <span className="text-[10px] sm:text-xs font-medium px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full" style={{ backgroundColor: '#E8EFED', color: '#6A8A82' }}>
                {analytics.summary.active_drivers} actifs
              </span>
            </div>
          </div>
          <p className="text-xs sm:text-sm font-medium text-gray-600">Total conducteurs</p>
          <p className="text-xl sm:text-3xl font-bold" style={{ color: '#6A8A82' }}>
            {analytics.summary.total_drivers}
          </p>
        </div>

        <div className="bg-white rounded-xl sm:rounded-2xl border-2 p-3 sm:p-5" style={{ borderColor: '#B87333' }}>
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center" style={{ backgroundColor: '#F5E8DD' }}>
              <Car className="w-4 h-4 sm:w-6 sm:h-6" style={{ color: '#B87333' }} />
            </div>
            <div className="flex items-center space-x-0.5 sm:space-x-1">
              {getChangeIcon(analytics.summary.trips_change)}
              <span className={`text-[10px] sm:text-sm font-medium ${getChangeColor(analytics.summary.trips_change)}`}>
                {analytics.summary.trips_change > 0 ? '+' : ''}{analytics.summary.trips_change.toFixed(1)}%
              </span>
            </div>
          </div>
          <p className="text-xs sm:text-sm font-medium text-gray-600">Trajets</p>
          <p className="text-xl sm:text-3xl font-bold" style={{ color: '#B87333' }}>
            {analytics.summary.period_trips}
          </p>
        </div>

        <div className="bg-white rounded-xl sm:rounded-2xl border-2 p-3 sm:p-5" style={{ borderColor: '#6A8A82' }}>
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center" style={{ backgroundColor: '#E8EFED' }}>
              <MapPin className="w-4 h-4 sm:w-6 sm:h-6" style={{ color: '#6A8A82' }} />
            </div>
            <div className="flex items-center space-x-0.5 sm:space-x-1">
              {getChangeIcon(analytics.summary.distance_change)}
              <span className={`text-[10px] sm:text-sm font-medium ${getChangeColor(analytics.summary.distance_change)}`}>
                {analytics.summary.distance_change > 0 ? '+' : ''}{analytics.summary.distance_change.toFixed(1)}%
              </span>
            </div>
          </div>
          <p className="text-xs sm:text-sm font-medium text-gray-600">Distance</p>
          <p className="text-xl sm:text-3xl font-bold" style={{ color: '#6A8A82' }}>
            {analytics.summary.period_distance.toLocaleString('fr-FR')} <span className="text-xs sm:text-lg">km</span>
          </p>
        </div>

        <div className="bg-white rounded-xl sm:rounded-2xl border-2 p-3 sm:p-5" style={{ borderColor: analytics.summary.incidents_change > 0 ? '#DC2626' : '#6A8A82' }}>
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center" style={{ backgroundColor: '#FEF3C7' }}>
              <AlertTriangle className="w-4 h-4 sm:w-6 sm:h-6" style={{ color: '#D97706' }} />
            </div>
            <div className="flex items-center space-x-0.5 sm:space-x-1">
              {getChangeIcon(analytics.summary.incidents_change)}
              <span className={`text-[10px] sm:text-sm font-medium ${getChangeColor(analytics.summary.incidents_change, true)}`}>
                {analytics.summary.incidents_change > 0 ? '+' : ''}{analytics.summary.incidents_change.toFixed(1)}%
              </span>
            </div>
          </div>
          <p className="text-xs sm:text-sm font-medium text-gray-600">Incidents</p>
          <p className="text-xl sm:text-3xl font-bold" style={{ color: '#D97706' }}>
            {analytics.summary.period_incidents}
          </p>
        </div>
      </div>

      {/* Status Distribution + Rating */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Status Distribution */}
        <div className="bg-white rounded-xl sm:rounded-2xl border-2 p-4 sm:p-6" style={{ borderColor: '#E8ECEC' }}>
          <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4" style={{ color: '#191919' }}>Répartition par statut</h3>
          <div className="space-y-2 sm:space-y-3">
            {analytics.status_distribution.map((status) => (
              <div key={status.status} className="flex items-center">
                <div className="w-20 sm:w-32 text-xs sm:text-sm font-medium text-gray-700 truncate">{status.label}</div>
                <div className="flex-1 mx-2 sm:mx-3">
                  <div className="h-4 sm:h-6 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${status.percentage}%`,
                        backgroundColor: status.color,
                      }}
                    />
                  </div>
                </div>
                <div className="w-16 sm:w-20 text-right">
                  <span className="font-bold text-sm sm:text-base" style={{ color: status.color }}>{status.count}</span>
                  <span className="text-[10px] sm:text-xs text-gray-500 ml-0.5 sm:ml-1">({status.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Average Rating */}
        <div className="bg-white rounded-xl sm:rounded-2xl border-2 p-4 sm:p-6" style={{ borderColor: '#E8ECEC' }}>
          <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4" style={{ color: '#191919' }}>Note moyenne</h3>
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 sm:space-x-2 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className="w-6 h-6 sm:w-8 sm:h-8"
                    style={{
                      color: star <= Math.round(analytics.summary.avg_rating) ? '#F59E0B' : '#E5E7EB',
                      fill: star <= Math.round(analytics.summary.avg_rating) ? '#F59E0B' : 'none',
                    }}
                  />
                ))}
              </div>
              <p className="text-2xl sm:text-4xl font-bold" style={{ color: '#F59E0B' }}>
                {analytics.summary.avg_rating.toFixed(2)}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">sur 5</p>
            </div>
          </div>
          <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-3 sm:gap-4 text-center">
              <div>
                <p className="text-lg sm:text-2xl font-bold" style={{ color: '#6A8A82' }}>
                  {analytics.summary.total_trips.toLocaleString('fr-FR')}
                </p>
                <p className="text-[10px] sm:text-xs text-gray-500">Trajets totaux</p>
              </div>
              <div>
                <p className="text-lg sm:text-2xl font-bold" style={{ color: '#B87333' }}>
                  {analytics.summary.total_distance.toLocaleString('fr-FR')} km
                </p>
                <p className="text-[10px] sm:text-xs text-gray-500">Distance totale</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Section */}
      <div className="bg-white rounded-xl sm:rounded-2xl border-2 p-4 sm:p-6" style={{ borderColor: '#E8ECEC' }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
          <h3 className="text-base sm:text-lg font-bold" style={{ color: '#191919' }}>Comparatif - Top 5</h3>
          <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 sm:pb-0">
            {[
              { key: 'trips', label: 'Trajets', icon: Car },
              { key: 'distance', label: 'Distance', icon: MapPin },
              { key: 'efficiency', label: 'Efficacité', icon: Zap },
              { key: 'rating', label: 'Note', icon: Star },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setSelectedComparison(key as typeof selectedComparison)}
                className={`flex items-center space-x-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                  selectedComparison === key ? 'shadow-md' : 'hover:bg-gray-100'
                }`}
                style={{
                  backgroundColor: selectedComparison === key ? '#6A8A82' : 'transparent',
                  color: selectedComparison === key ? '#ffffff' : '#6B7280',
                }}
              >
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2 sm:space-y-3">
          {getComparisonData().map((driver, index) => {
            const badge = getRankBadge(index + 1);
            const maxValue = Math.max(...getComparisonData().map(d => {
              switch (selectedComparison) {
                case 'trips': return d.trips_count;
                case 'distance': return d.distance;
                case 'efficiency': return d.efficiency;
                case 'rating': return d.rating;
                default: return 0;
              }
            }));
            const currentValue = (() => {
              switch (selectedComparison) {
                case 'trips': return driver.trips_count;
                case 'distance': return driver.distance;
                case 'efficiency': return driver.efficiency;
                case 'rating': return driver.rating;
                default: return 0;
              }
            })();
            const percentage = (currentValue / maxValue) * 100;

            return (
              <div
                key={driver.id}
                className="flex items-center p-2 sm:p-3 rounded-lg sm:rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mr-2 sm:mr-4 flex-shrink-0"
                  style={{ backgroundColor: badge.bg }}
                >
                  {badge.icon ? (
                    <badge.icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: badge.color }} />
                  ) : (
                    <span className="font-bold text-sm sm:text-base" style={{ color: badge.color }}>{index + 1}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1 gap-2">
                    <span className="font-semibold text-xs sm:text-base truncate" style={{ color: '#191919' }}>{driver.name}</span>
                    <span className="font-bold text-xs sm:text-base flex-shrink-0" style={{ color: '#6A8A82' }}>{getComparisonValue(driver)}</span>
                  </div>
                  <div className="h-1.5 sm:h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: index === 0 ? '#6A8A82' : index === 1 ? '#B87333' : '#6B7280',
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
          {getComparisonData().length === 0 && (
            <p className="text-center text-gray-500 py-4 text-sm">Aucune donnée disponible</p>
          )}
        </div>
      </div>

      {/* Monthly Trends */}
      <div className="bg-white rounded-xl sm:rounded-2xl border-2 p-4 sm:p-6" style={{ borderColor: '#E8ECEC' }}>
        <h3 className="text-base sm:text-lg font-bold mb-4 sm:mb-6" style={{ color: '#191919' }}>Évolution temporelle</h3>

        {analytics.monthly_trends.length > 0 ? (
          <>
            <div className="flex items-end space-x-1 sm:space-x-2 h-40 sm:h-64 mb-3 sm:mb-4 overflow-x-auto">
              {analytics.monthly_trends.map((trend) => (
                <div key={trend.month} className="flex-1 min-w-[40px] sm:min-w-0 flex flex-col items-center">
                  <div className="w-full flex flex-col items-center justify-end h-28 sm:h-48">
                    {/* Trips bar */}
                    <div
                      className="w-full max-w-8 sm:max-w-16 rounded-t-lg transition-all duration-500 relative group"
                      style={{
                        height: `${(trend.trips / maxTrend) * 100}%`,
                        backgroundColor: '#6A8A82',
                        minHeight: trend.trips > 0 ? '4px' : '0',
                      }}
                    >
                      <div className="absolute -top-6 sm:-top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        {trend.trips} trajets
                      </div>
                    </div>
                  </div>
                  <div className="mt-1 sm:mt-2 text-center">
                    <p className="text-[10px] sm:text-xs font-medium text-gray-600">{trend.label}</p>
                    <p className="text-[10px] sm:text-xs text-gray-400 hidden sm:block">{trend.active_drivers} actifs</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Legend and Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 pt-3 sm:pt-4 border-t border-gray-200">
              {analytics.monthly_trends.map((trend) => (
                <div key={trend.month} className="text-center p-2 sm:p-3 rounded-lg" style={{ backgroundColor: '#F0F3F2' }}>
                  <p className="text-[10px] sm:text-xs font-medium text-gray-600 mb-1">{trend.label}</p>
                  <div className="space-y-0.5 sm:space-y-1">
                    <p className="text-xs sm:text-sm">
                      <span className="font-bold" style={{ color: '#6A8A82' }}>{trend.trips}</span>
                      <span className="text-gray-500 ml-0.5 sm:ml-1 text-[10px] sm:text-xs">trajets</span>
                    </p>
                    <p className="text-xs sm:text-sm hidden sm:block">
                      <span className="font-bold" style={{ color: '#B87333' }}>{trend.distance.toLocaleString('fr-FR')}</span>
                      <span className="text-gray-500 ml-1">km</span>
                    </p>
                    <p className="text-xs sm:text-sm">
                      <span className="font-bold" style={{ color: '#D97706' }}>{trend.incidents}</span>
                      <span className="text-gray-500 ml-0.5 sm:ml-1 text-[10px] sm:text-xs">incidents</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-center text-gray-500 py-6 sm:py-8 text-sm">Aucune donnée disponible pour cette période</p>
        )}
      </div>

      {/* Driver Metrics Table */}
      <div className="bg-white rounded-xl sm:rounded-2xl border-2 p-4 sm:p-6" style={{ borderColor: '#E8ECEC' }}>
        <h3 className="text-base sm:text-lg font-bold mb-4 sm:mb-6" style={{ color: '#191919' }}>Métriques par conducteur</h3>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-3">
          {analytics.driver_metrics.slice(0, 10).map((driver) => {
            const badge = getRankBadge(driver.rank);
            return (
              <div
                key={driver.id}
                className="p-3 rounded-xl border-2"
                style={{ borderColor: '#E8ECEC' }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: badge.bg }}
                  >
                    {badge.icon ? (
                      <badge.icon className="w-3.5 h-3.5" style={{ color: badge.color }} />
                    ) : (
                      <span className="text-xs font-bold" style={{ color: badge.color }}>{driver.rank}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: '#191919' }}>{driver.name}</p>
                    <p className="text-[10px] text-gray-500">{driver.employee_id}</p>
                  </div>
                  <div
                    className="px-2 py-1 rounded-full text-white font-bold text-xs flex-shrink-0"
                    style={{ backgroundColor: getScoreColor(driver.score) }}
                  >
                    {driver.score.toFixed(0)}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: '#F0F3F2' }}>
                    <p className="text-[10px] text-gray-500">Trajets</p>
                    <p className="text-sm font-bold" style={{ color: '#6A8A82' }}>{driver.trips_count}</p>
                  </div>
                  <div className="p-2 rounded-lg" style={{ backgroundColor: '#F0F3F2' }}>
                    <p className="text-[10px] text-gray-500">Note</p>
                    <div className="flex items-center justify-center gap-0.5">
                      <Star className="w-3 h-3" style={{ color: '#F59E0B', fill: '#F59E0B' }} />
                      <span className="text-sm font-bold">{driver.rating.toFixed(1)}</span>
                    </div>
                  </div>
                  <div className="p-2 rounded-lg" style={{ backgroundColor: '#F0F3F2' }}>
                    <p className="text-[10px] text-gray-500">Incidents</p>
                    <span
                      className={`text-sm font-bold ${
                        driver.incidents_count === 0
                          ? 'text-green-600'
                          : driver.incidents_count <= 2
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      }`}
                    >
                      {driver.incidents_count}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2" style={{ borderColor: '#E8ECEC' }}>
                <th className="text-left py-3 px-4 text-xs font-bold uppercase text-gray-500">Rang</th>
                <th className="text-left py-3 px-4 text-xs font-bold uppercase text-gray-500">Conducteur</th>
                <th className="text-center py-3 px-4 text-xs font-bold uppercase text-gray-500">Trajets</th>
                <th className="text-center py-3 px-4 text-xs font-bold uppercase text-gray-500">Distance</th>
                <th className="text-center py-3 px-4 text-xs font-bold uppercase text-gray-500">Incidents</th>
                <th className="text-center py-3 px-4 text-xs font-bold uppercase text-gray-500">Carburant</th>
                <th className="text-center py-3 px-4 text-xs font-bold uppercase text-gray-500">Efficacité</th>
                <th className="text-center py-3 px-4 text-xs font-bold uppercase text-gray-500">Note</th>
                <th className="text-center py-3 px-4 text-xs font-bold uppercase text-gray-500">Score</th>
              </tr>
            </thead>
            <tbody>
              {analytics.driver_metrics.slice(0, 10).map((driver) => {
                const badge = getRankBadge(driver.rank);
                return (
                  <tr
                    key={driver.id}
                    className="border-b hover:bg-gray-50 transition-colors"
                    style={{ borderColor: '#E8ECEC' }}
                  >
                    <td className="py-3 px-4">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: badge.bg }}
                      >
                        {badge.icon ? (
                          <badge.icon className="w-4 h-4" style={{ color: badge.color }} />
                        ) : (
                          <span className="text-sm font-bold" style={{ color: badge.color }}>{driver.rank}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#E8EFED' }}>
                          <Users className="w-5 h-5" style={{ color: '#6A8A82' }} />
                        </div>
                        <div>
                          <p className="font-semibold" style={{ color: '#191919' }}>{driver.name}</p>
                          <p className="text-xs text-gray-500">{driver.employee_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-bold" style={{ color: '#6A8A82' }}>{driver.trips_count}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-medium">{driver.distance.toLocaleString('fr-FR')} km</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-bold ${
                          driver.incidents_count === 0
                            ? 'bg-green-100 text-green-700'
                            : driver.incidents_count <= 2
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {driver.incidents_count}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-medium">{driver.fuel_cost.toLocaleString('fr-FR')} €</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`font-bold ${
                          driver.efficiency >= 10 ? 'text-green-600' : driver.efficiency >= 7 ? 'text-yellow-600' : 'text-red-600'
                        }`}
                      >
                        {driver.efficiency > 0 ? `${driver.efficiency} km/L` : '-'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <Star className="w-4 h-4" style={{ color: '#F59E0B', fill: '#F59E0B' }} />
                        <span className="font-bold">{driver.rating.toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center">
                        <div
                          className="px-3 py-1 rounded-full text-white font-bold text-sm"
                          style={{ backgroundColor: getScoreColor(driver.score) }}
                        >
                          {driver.score.toFixed(0)}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {analytics.driver_metrics.length > 10 && (
          <div className="mt-3 sm:mt-4 text-center">
            <button className="text-xs sm:text-sm font-medium flex items-center justify-center mx-auto" style={{ color: '#6A8A82' }}>
              Voir tous les conducteurs ({analytics.driver_metrics.length})
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1" />
            </button>
          </div>
        )}
      </div>

      {/* Incidents by Driver */}
      {analytics.incidents_by_driver.length > 0 && (
        <div className="bg-white rounded-xl sm:rounded-2xl border-2 p-4 sm:p-6" style={{ borderColor: '#E8ECEC' }}>
          <h3 className="text-base sm:text-lg font-bold mb-4 sm:mb-6" style={{ color: '#191919' }}>Incidents par conducteur</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {analytics.incidents_by_driver.map((item) => (
              <div
                key={item.driver_id}
                className="p-3 sm:p-4 rounded-lg sm:rounded-xl border-2"
                style={{ borderColor: '#E8ECEC' }}
              >
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <span className="font-semibold text-sm sm:text-base truncate mr-2" style={{ color: '#191919' }}>{item.name}</span>
                  <span className="text-base sm:text-lg font-bold flex-shrink-0" style={{ color: '#D97706' }}>{item.total}</span>
                </div>
                <div className="flex items-center flex-wrap gap-1.5 sm:gap-2 mb-2">
                  <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-green-100 text-green-700">
                    {item.resolved} résolus
                  </span>
                  <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-yellow-100 text-yellow-700">
                    {item.unresolved} en attente
                  </span>
                </div>
                <div className="flex space-x-0.5 sm:space-x-1">
                  {item.by_severity.minor > 0 && (
                    <div className="flex-1 h-1.5 sm:h-2 rounded-full" style={{ backgroundColor: '#6A8A82' }} title={`Mineurs: ${item.by_severity.minor}`} />
                  )}
                  {item.by_severity.moderate > 0 && (
                    <div className="flex-1 h-1.5 sm:h-2 rounded-full" style={{ backgroundColor: '#6B7280' }} title={`Modérés: ${item.by_severity.moderate}`} />
                  )}
                  {item.by_severity.major > 0 && (
                    <div className="flex-1 h-1.5 sm:h-2 rounded-full" style={{ backgroundColor: '#B87333' }} title={`Majeurs: ${item.by_severity.major}`} />
                  )}
                  {item.by_severity.critical > 0 && (
                    <div className="flex-1 h-1.5 sm:h-2 rounded-full" style={{ backgroundColor: '#DC2626' }} title={`Critiques: ${item.by_severity.critical}`} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
