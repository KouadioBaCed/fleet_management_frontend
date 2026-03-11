import { useState, useEffect } from 'react';
import Layout from '@/components/Layout/Layout';
import { Car, Users, MapPin, AlertTriangle, TrendingUp, TrendingDown, Activity, Shield, ShieldCheck, Loader2, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { dashboardApi, type DashboardStats } from '@/api/dashboard';
import { useTranslation } from '@/i18n';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import TopDriversCard from '@/components/dashboard/TopDriversCard';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, organization } = useAuthStore();
  const { t } = useTranslation();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dashboardApi.getStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
      setError('Impossible de charger les statistiques');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Rafraichir toutes les 30 secondes
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const getRoleLabel = (role: string | undefined) => {
    switch (role) {
      case 'admin':
        return 'Administrateur';
      case 'supervisor':
        return 'Superviseur';
      default:
        return 'Utilisateur';
    }
  };

  const getStatCards = () => {
    if (!stats) return [];

    return [
      {
        title: 'Véhicules',
        value: stats.vehicles.total.toString(),
        subtitle: `${stats.vehicles.available} disponibles`,
        icon: Car,
        bgColor: '#6A8A82',
        lightBg: '#E8EFED',
        textColor: '#6A8A82',
        change: `${stats.vehicles.in_use} en mission`,
        trend: stats.vehicles.in_use > 0 ? 'up' : 'neutral',
        details: [
          { label: 'En maintenance', value: stats.vehicles.maintenance },
          { label: 'Hors service', value: stats.vehicles.out_of_service },
        ],
      },
      {
        title: 'Chauffeurs',
        value: stats.drivers.total.toString(),
        subtitle: `${stats.drivers.active} actifs`,
        icon: Users,
        bgColor: '#B87333',
        lightBg: '#F5E8DD',
        textColor: '#B87333',
        change: `${stats.drivers.on_mission} en mission`,
        trend: stats.drivers.on_mission > 0 ? 'up' : 'neutral',
        details: [
          { label: 'En pause', value: stats.drivers.on_break },
          { label: 'Hors service', value: stats.drivers.off_duty },
        ],
      },
      {
        title: 'Missions',
        value: stats.missions.in_progress.toString(),
        subtitle: `${stats.missions.completed} terminees`,
        icon: MapPin,
        bgColor: '#6A8A82',
        lightBg: '#E8EFED',
        textColor: '#6A8A82',
        change: `${stats.missions.pending} en attente`,
        trend: stats.missions.in_progress > 0 ? 'up' : 'neutral',
        details: [
          { label: 'Aujourd\'hui', value: stats.missions.today },
          { label: 'Cette semaine', value: stats.missions.this_week },
        ],
      },
      {
        title: 'Alertes',
        value: stats.alerts.total_unresolved.toString(),
        subtitle: `${stats.alerts.critical} critiques`,
        icon: AlertTriangle,
        bgColor: stats.alerts.critical > 0 ? '#DC2626' : '#B87333',
        lightBg: stats.alerts.critical > 0 ? '#FEE2E2' : '#F5E8DD',
        textColor: stats.alerts.critical > 0 ? '#DC2626' : '#B87333',
        change: `${stats.alerts.major} majeures`,
        trend: stats.alerts.total_unresolved > 0 ? 'down' : 'neutral',
        details: [
          { label: 'Moderees', value: stats.alerts.moderate },
          { label: 'Mineures', value: stats.alerts.minor },
        ],
      },
    ];
  };

  const statCards = getStatCards();

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1">
              <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: '#1f2937' }}>
                Bonjour{user?.first_name ? `, ${user.first_name}` : ''} !
              </h1>
              {user?.role && (
                <div className={`flex items-center gap-1.5 px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${
                  user.role === 'admin'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {user.role === 'admin' ? (
                    <ShieldCheck className="w-3.5 h-3.5" />
                  ) : (
                    <Shield className="w-3.5 h-3.5" />
                  )}
                  <span className="hidden xs:inline">{getRoleLabel(user.role)}</span>
                </div>
              )}
            </div>
            <p className="text-sm sm:text-base text-gray-600">
              {t('dashboard.overview')}
              {organization?.name && (
                <span className="hidden sm:inline ml-2 text-gray-400">• {organization.name}</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => fetchStats()}
              disabled={loading}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
              title="Rafraichir"
            >
              <RefreshCw className={`w-5 h-5 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <div className="text-right">
              <div className="text-xs sm:text-sm font-medium" style={{ color: '#B87333' }}>
                {new Date().toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
              </div>
              {user?.email && (
                <div className="text-xs text-gray-500 mt-1 hidden md:block">{user.email}</div>
              )}
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-100 rounded-lg sm:rounded-xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 flex-shrink-0" />
            <span className="text-red-700 text-sm flex-1">{error}</span>
            <button
              onClick={fetchStats}
              className="text-xs sm:text-sm font-medium text-red-600 hover:underline flex-shrink-0"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className={`flex items-center justify-center ${stats ? 'py-4' : 'py-12'}`}>
            <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white shadow-sm border border-gray-100">
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#6A8A82' }} />
              <span className="text-sm font-medium text-gray-600">Chargement en cours...</span>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {statCards.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.title} className="stat-card">
                    <div className="stat-accent" style={{ backgroundColor: stat.bgColor }} />
                    <div className="flex items-center gap-3">
                      <div className="stat-icon" style={{ backgroundColor: `${stat.bgColor}12` }}>
                        <Icon className="w-4 h-4" style={{ color: stat.bgColor }} />
                      </div>
                      <div>
                        <p className="stat-label">{stat.title}</p>
                        <p className="stat-value" style={{ color: stat.bgColor }}>{stat.value}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Activity Feed */}
              <div className="lg:col-span-2 order-2 lg:order-1">
                <ActivityFeed
                  limit={5}
                  showFilters={false}
                  onViewAll={() => navigate('/incidents')}
                />
              </div>

              {/* Top Drivers */}
              <div className="order-1 lg:order-2">
                <TopDriversCard limit={5} />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4 md:gap-6">
              <button
                onClick={() => navigate('/vehicles')}
                className="group relative overflow-hidden text-left transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer btn-primary"
              >
                <div className="absolute top-0 right-0 w-20 sm:w-32 h-20 sm:h-32 rounded-full -mr-10 sm:-mr-16 -mt-10 sm:-mt-16 opacity-10" style={{ backgroundColor: '#ffffff' }}></div>
                <Car className="w-6 h-6 sm:w-10 sm:h-10 text-white mb-2 sm:mb-4 relative z-10" />
                <h3 className="text-sm sm:text-xl font-semibold text-white mb-0.5 sm:mb-2 relative z-10">Véhicules</h3>
                <p className="text-[10px] sm:text-sm text-white/80 relative z-10">
                  <span className="hidden sm:inline">{stats.vehicles.total} véhicules • </span>{stats.vehicles.available} dispo.
                </p>
              </button>

              <button
                onClick={() => navigate('/missions')}
                className="group relative overflow-hidden text-left transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer btn-primary"
              >
                <div className="absolute top-0 right-0 w-20 sm:w-32 h-20 sm:h-32 rounded-full -mr-10 sm:-mr-16 -mt-10 sm:-mt-16 opacity-10" style={{ backgroundColor: '#ffffff' }}></div>
                <MapPin className="w-6 h-6 sm:w-10 sm:h-10 text-white mb-2 sm:mb-4 relative z-10" />
                <h3 className="text-sm sm:text-xl font-semibold text-white mb-0.5 sm:mb-2 relative z-10">Missions</h3>
                <p className="text-[10px] sm:text-sm text-white/80 relative z-10">
                  {stats.missions.in_progress} en cours<span className="hidden sm:inline"> • {stats.missions.pending} attente</span>
                </p>
              </button>

              <button
                onClick={() => navigate('/reports')}
                className="group relative overflow-hidden text-left transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer col-span-2 sm:col-span-1 btn-primary"
              >
                <div className="absolute top-0 right-0 w-20 sm:w-32 h-20 sm:h-32 rounded-full -mr-10 sm:-mr-16 -mt-10 sm:-mt-16 opacity-10" style={{ backgroundColor: '#ffffff' }}></div>
                <Activity className="w-6 h-6 sm:w-10 sm:h-10 text-white mb-2 sm:mb-4 relative z-10" />
                <h3 className="text-sm sm:text-xl font-semibold text-white mb-0.5 sm:mb-2 relative z-10">Rapports</h3>
                <p className="text-[10px] sm:text-sm text-white/80 relative z-10">Consulter les statistiques</p>
              </button>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
