import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from '@/i18n';
import { useColors } from '@/store/settingsStore';
import {
  LayoutDashboard,
  Car,
  Users,
  MapPin,
  Radio,
  AlertTriangle,
  Wrench,
  Fuel,
  BarChart3,
  PieChart,
  Settings,
  LogOut,
  X,
  Loader2
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export default function Sidebar({ isOpen, onClose, collapsed }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const { t } = useTranslation();
  const { primary, secondary } = useColors();
  const [mounted, setMounted] = useState(false);

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  const menuItems = [
    { path: '/', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
    { path: '/vehicles', icon: Car, labelKey: 'nav.vehicles' },
    { path: '/drivers', icon: Users, labelKey: 'nav.drivers' },
    { path: '/missions', icon: MapPin, labelKey: 'nav.missions' },
    { path: '/tracking', icon: Radio, labelKey: 'nav.tracking' },
    { path: '/incidents', icon: AlertTriangle, labelKey: 'nav.incidents' },
    { path: '/maintenance', icon: Wrench, labelKey: 'nav.maintenance' },
    { path: '/fuel', icon: Fuel, labelKey: 'nav.fuel' },
    { path: '/analytics', icon: PieChart, labelKey: 'nav.analytics' },
    { path: '/reports', icon: BarChart3, labelKey: 'nav.reports' },
  ];

  const handleLogoutClick = () => setIsLogoutModalOpen(true);
  const handleLogoutConfirm = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/login');
    } finally {
      setIsLoggingOut(false);
      setIsLogoutModalOpen(false);
    }
  };
  const handleLogoutCancel = () => setIsLogoutModalOpen(false);
  const handleNavClick = () => {
    if (window.innerWidth < 1024) onClose();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed left-0 top-0 z-50 h-full
          bg-white/75 backdrop-blur-xl
          transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
          lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        style={{
          width: collapsed ? 72 : 208,
          borderRight: '1px solid rgba(0,0,0,0.04)',
        }}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-center relative overflow-hidden" style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
          <div className="relative flex items-center justify-center">
            {/* MapPin icon — always present, visible when collapsed */}
            <div
              className="absolute transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
              style={{
                opacity: collapsed ? 1 : 0,
                transform: collapsed ? 'scale(1) rotate(0deg)' : 'scale(0.5) rotate(-90deg)',
              }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm"
                style={{ background: 'linear-gradient(135deg, #6A8A82, #B87333)' }}
              >
                <MapPin className="w-5 h-5 text-white" />
              </div>
            </div>
            {/* Banner logo — visible when expanded */}
            <img
              src="/logo_banner.png"
              alt="YaswaCar"
              className="h-10 w-auto object-contain transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
              style={{
                mixBlendMode: 'multiply',
                opacity: collapsed ? 0 : 1,
                transform: collapsed ? 'scale(0.8) translateX(-10px)' : 'scale(1) translateX(0)',
              }}
            />
          </div>
          <button
            onClick={onClose}
            className="lg:hidden absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-black/[0.03] transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="px-2 py-3 space-y-0.5 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 240px)' }}>
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={handleNavClick}
                className="sidebar-nav-item flex items-center rounded-xl transition-all duration-200 group relative"
                style={{
                  padding: collapsed ? '10px 0' : '10px 12px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  gap: collapsed ? 0 : 12,
                  background: isActive ? 'linear-gradient(135deg, #6A8A82 0%, #B87333 100%)' : 'transparent',
                  color: isActive ? '#ffffff' : '#6b7280',
                  boxShadow: isActive ? '0 2px 10px rgba(106,138,130,0.35)' : 'none',
                  fontWeight: isActive ? 600 : 500,
                  // Staggered entrance
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? 'translateX(0)' : 'translateX(-12px)',
                  transitionDelay: `${index * 30}ms`,
                }}
              >
                <Icon
                  className="w-[18px] h-[18px] flex-shrink-0 transition-colors"
                  style={{ color: isActive ? '#ffffff' : '#9ca3af' }}
                />
                {/* Label — fades and slides */}
                <span
                  className="text-[13px] font-medium truncate transition-all duration-300 whitespace-nowrap"
                  style={{
                    opacity: collapsed ? 0 : 1,
                    width: collapsed ? 0 : 'auto',
                    overflow: 'hidden',
                  }}
                >
                  {t(item.labelKey)}
                </span>
                {/* Active indicator */}
                {isActive && !collapsed && (
                  <div
                    className="ml-auto w-1.5 h-4 rounded-full flex-shrink-0 transition-all duration-300"
                    style={{ backgroundColor: secondary, opacity: 0.8 }}
                  />
                )}
                {/* Tooltip when collapsed */}
                {collapsed && (
                  <div className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg bg-gray-700 text-white text-xs font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 group-hover:translate-x-0 translate-x-[-4px] z-50 shadow-md">
                    {t(item.labelKey)}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="absolute bottom-0 left-0 right-0 px-2 py-3 transition-all duration-300" style={{ borderTop: '1px solid rgba(0,0,0,0.04)', background: 'rgba(255,255,255,0.4)' }}>
          {/* Profile */}
          <Link
            to="/profile"
            onClick={handleNavClick}
            className="sidebar-nav-item flex items-center rounded-xl transition-all duration-200 group relative"
            style={{
              padding: collapsed ? '10px 0' : '10px 12px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: collapsed ? 0 : 12,
              background: location.pathname === '/profile' ? 'linear-gradient(135deg, #6A8A82 0%, #B87333 100%)' : 'transparent',
              color: location.pathname === '/profile' ? '#ffffff' : '#6b7280',
              boxShadow: location.pathname === '/profile' ? '0 2px 10px rgba(106,138,130,0.35)' : 'none',
            }}
          >
            <Users className="w-[18px] h-[18px] flex-shrink-0" style={{ color: location.pathname === '/profile' ? '#ffffff' : '#9ca3af' }} />
            <span className="text-[13px] font-medium truncate transition-all duration-300" style={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : 'auto', overflow: 'hidden' }}>
              {t('nav.profile')}
            </span>
            {collapsed && (
              <div className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg bg-gray-700 text-white text-xs font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 group-hover:translate-x-0 translate-x-[-4px] z-50 shadow-md">
                {t('nav.profile')}
              </div>
            )}
          </Link>

          {/* Settings */}
          <Link
            to="/settings"
            onClick={handleNavClick}
            className="sidebar-nav-item flex items-center rounded-xl transition-all duration-200 mt-0.5 group relative"
            style={{
              padding: collapsed ? '10px 0' : '10px 12px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: collapsed ? 0 : 12,
              background: location.pathname === '/settings' ? 'linear-gradient(135deg, #6A8A82 0%, #B87333 100%)' : 'transparent',
              color: location.pathname === '/settings' ? '#ffffff' : '#6b7280',
              boxShadow: location.pathname === '/settings' ? '0 2px 10px rgba(106,138,130,0.35)' : 'none',
            }}
          >
            <Settings className="w-[18px] h-[18px] flex-shrink-0" style={{ color: location.pathname === '/settings' ? '#ffffff' : '#9ca3af' }} />
            <span className="text-[13px] font-medium truncate transition-all duration-300" style={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : 'auto', overflow: 'hidden' }}>
              {t('nav.settings')}
            </span>
            {collapsed && (
              <div className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg bg-gray-700 text-white text-xs font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 group-hover:translate-x-0 translate-x-[-4px] z-50 shadow-md">
                {t('nav.settings')}
              </div>
            )}
          </Link>

          {/* Logout */}
          <button
            onClick={handleLogoutClick}
            className="sidebar-nav-item flex items-center rounded-xl transition-all duration-200 mt-0.5 w-full group relative"
            style={{
              padding: collapsed ? '10px 0' : '10px 12px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: collapsed ? 0 : 12,
              color: '#f87171',
            }}
          >
            <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
            <span className="text-[13px] font-medium truncate transition-all duration-300" style={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : 'auto', overflow: 'hidden' }}>
              {t('nav.logout')}
            </span>
            {collapsed && (
              <div className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg bg-gray-700 text-white text-xs font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 group-hover:translate-x-0 translate-x-[-4px] z-50 shadow-md">
                {t('nav.logout')}
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {isLogoutModalOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={handleLogoutCancel}
        >
          <div
            className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sm:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>
            <button
              onClick={handleLogoutCancel}
              className="sm:hidden absolute top-3 right-3 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
            <div className="px-5 sm:px-6 py-5 sm:py-6 text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center bg-red-50">
                <LogOut className="w-6 h-6 text-red-500" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Deconnexion</h2>
              <p className="text-sm text-gray-500 mt-1.5">Êtes-vous sur de vouloir vous déconnecter ?</p>
            </div>
            <div className="px-5 sm:px-6 py-4 flex flex-col-reverse sm:flex-row gap-2.5" style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
              <button
                onClick={handleLogoutCancel}
                disabled={isLoggingOut}
                className="flex-1 px-4 py-2.5 rounded-xl font-medium text-sm transition-all hover:bg-gray-100 disabled:opacity-50 text-gray-600 bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleLogoutConfirm}
                disabled={isLoggingOut}
                className="flex-1 px-4 py-2.5 rounded-xl font-medium text-sm text-white transition-all hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2 bg-red-500"
              >
                {isLoggingOut ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Deconnexion...</span>
                  </>
                ) : (
                  <>
                    <LogOut className="w-4 h-4" />
                    <span>Se deconnecter</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .sidebar-nav-item:not([style*="background-color: rgb"]):hover {
          background-color: rgba(0,0,0,0.03);
        }
        .sidebar-nav-item[style*="color: rgb(248"] :hover {
          background-color: rgba(248,113,113,0.08);
        }
      `}</style>
    </>
  );
}
