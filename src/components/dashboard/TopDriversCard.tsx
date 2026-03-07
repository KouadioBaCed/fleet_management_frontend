import { useState, useEffect } from 'react';
import { Users, Trophy, TrendingUp, Clock, MapPin, RefreshCw, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { dashboardApi, type TopPerformer } from '@/api/dashboard';

interface TopDriversCardProps {
  limit?: number;
}

export default function TopDriversCard({ limit = 5 }: TopDriversCardProps) {
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState<TopPerformer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTopPerformers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dashboardApi.getTopPerformers(limit);
      setDrivers(data.top_performers);
    } catch (err) {
      console.error('Failed to fetch top performers:', err);
      setError('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopPerformers();
    const interval = setInterval(fetchTopPerformers, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [limit]);

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return { bg: '#FFD700', text: '#92400E', border: '#F59E0B' }; // Gold
      case 2:
        return { bg: '#E5E7EB', text: '#374151', border: '#9CA3AF' }; // Silver
      case 3:
        return { bg: '#FED7AA', text: '#9A3412', border: '#EA580C' }; // Bronze
      default:
        return { bg: '#F3F4F6', text: '#6B7280', border: '#D1D5DB' };
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#059669'; // Green
    if (score >= 75) return '#6A8A82'; // Teal
    if (score >= 60) return '#D97706'; // Orange
    return '#DC2626'; // Red
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; label: string }> = {
      available: { bg: '#D1FAE5', text: '#059669', label: 'Disponible' },
      on_mission: { bg: '#DBEAFE', text: '#2563EB', label: 'En mission' },
      on_break: { bg: '#FEF3C7', text: '#D97706', label: 'En pause' },
      off_duty: { bg: '#F3F4F6', text: '#6B7280', label: 'Hors service' },
    };
    return styles[status] || styles.off_duty;
  };

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border-2 p-4 sm:p-6" style={{ borderColor: '#E8ECEC' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-5">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center" style={{ backgroundColor: '#F5E8DD' }}>
            <Trophy className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#B87333' }} />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold" style={{ color: '#191919' }}>Top Chauffeurs</h2>
            <p className="text-[10px] sm:text-xs text-gray-500">Performance sur 30 jours</p>
          </div>
        </div>
      </div>

      {/* Content */}
      {error ? (
        <div className="text-center py-4 sm:py-6 text-gray-500">
          <p className="text-sm">{error}</p>
          <button
            onClick={fetchTopPerformers}
            className="text-sm font-medium mt-2 hover:underline"
            style={{ color: '#6A8A82' }}
          >
            Réessayer
          </button>
        </div>
      ) : loading && drivers.length === 0 ? (
        <div className="flex items-center justify-center py-6 sm:py-8">
          <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6 animate-spin text-gray-400" />
        </div>
      ) : drivers.length === 0 ? (
        <div className="text-center py-6 sm:py-8 text-gray-500">
          <Users className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 text-gray-300" />
          <p className="text-sm">Aucun chauffeur</p>
        </div>
      ) : (
        <div className="space-y-2 sm:space-y-3">
          {drivers.map((driver) => {
            const rankStyle = getRankStyle(driver.rank);
            const statusBadge = getStatusBadge(driver.status);

            return (
              <div
                key={driver.driver_id}
                className="p-2.5 sm:p-4 rounded-lg sm:rounded-xl transition-all hover:shadow-md cursor-pointer"
                style={{ backgroundColor: driver.rank === 1 ? '#FFFBEB' : '#F0F3F2' }}
                onClick={() => navigate('/drivers', { state: { openDriverId: driver.driver_id } })}
              >
                <div className="flex items-center gap-2 sm:gap-4">
                  {/* Rank Badge */}
                  <div
                    className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm flex-shrink-0"
                    style={{
                      backgroundColor: rankStyle.bg,
                      color: rankStyle.text,
                      border: `2px solid ${rankStyle.border}`,
                    }}
                  >
                    {driver.rank}
                  </div>

                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div
                      className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center text-white text-xs sm:text-base font-bold shadow-md"
                      style={{ backgroundColor: driver.rank === 1 ? '#B87333' : '#6A8A82' }}
                    >
                      {driver.initials}
                    </div>
                    {driver.rank === 1 && (
                      <div
                        className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center shadow-sm"
                        style={{ backgroundColor: '#FFD700' }}
                      >
                        <span className="text-[10px] sm:text-xs">👑</span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                      <p className="font-semibold text-xs sm:text-sm truncate" style={{ color: '#191919' }}>
                        {driver.name}
                      </p>
                      <span
                        className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full flex-shrink-0 hidden xs:inline-block"
                        style={{ backgroundColor: statusBadge.bg, color: statusBadge.text }}
                      >
                        {statusBadge.label}
                      </span>
                    </div>

                    {/* Metrics - hidden on very small screens */}
                    <div className="hidden sm:flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {driver.total_trips} trajets
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {driver.completion_rate}%
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {driver.punctuality_rate}%
                      </span>
                    </div>
                    {/* Simplified metrics on mobile */}
                    <div className="flex sm:hidden items-center gap-2 mt-1 text-[10px] text-gray-500">
                      <span>{driver.total_trips} trajets</span>
                      <span>•</span>
                      <span>{driver.completion_rate}%</span>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-0.5 sm:gap-1 mb-0.5 sm:mb-1">
                      <span className="text-xs sm:text-sm" style={{ color: '#B87333' }}>⭐</span>
                      <span className="font-bold text-xs sm:text-sm" style={{ color: '#191919' }}>
                        {driver.rating.toFixed(1)}
                      </span>
                    </div>
                    <div
                      className="text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: `${getScoreColor(driver.performance_score)}20`,
                        color: getScoreColor(driver.performance_score),
                      }}
                    >
                      {driver.performance_score}pts
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <button
        onClick={() => navigate('/drivers')}
        className="w-full mt-3 sm:mt-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium flex items-center justify-center gap-2 transition-all hover:shadow-md"
        style={{ backgroundColor: '#E8EFED', color: '#6A8A82' }}
      >
        Voir tous les chauffeurs
        <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </button>
    </div>
  );
}
