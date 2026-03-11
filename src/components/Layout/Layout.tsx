import { ReactNode, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import NotificationCenter from '../Notifications/NotificationCenter';
import { Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    const titles: Record<string, string> = {
      '/': 'Tableau de bord',
      '/vehicles': 'Véhicules',
      '/drivers': 'Conducteurs',
      '/missions': 'Missions',
      '/tracking': 'Suivi GPS',
      '/incidents': 'Incidents',
      '/maintenance': 'Maintenance',
      '/fuel': 'Carburant',
      '/analytics': 'Analyses',
      '/reports': 'Rapports',
      '/settings': 'Parametres',
      '/profile': 'Profil',
    };
    return titles[path] || 'YaswaCar';
  };

  return (
    <div className="flex min-h-screen bg-[#f8f9fa]">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div
        className={`flex-1 flex flex-col transition-[margin] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[208px]'
        }`}
      >
        {/* Top bar */}
        <div
          className="sticky top-0 z-30 h-16 flex items-center justify-between px-4 md:px-6 lg:px-8"
          style={{
            background: 'rgba(248,249,250,0.75)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(0,0,0,0.04)',
          }}
        >
          {/* Mobile: Hamburger + Title */}
          <div className="flex items-center gap-3 lg:hidden">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-1 rounded-xl hover:bg-black/[0.04] transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5 text-gray-500" />
            </button>
            <span className="font-semibold text-[15px] text-gray-700">{getPageTitle()}</span>
          </div>

          {/* Desktop: Toggle + Title */}
          <div className="hidden lg:flex items-center gap-3">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 -ml-1 rounded-xl hover:bg-black/[0.04] transition-colors"
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen className="w-[18px] h-[18px] text-gray-400" />
              ) : (
                <PanelLeftClose className="w-[18px] h-[18px] text-gray-400" />
              )}
            </button>
            <h1 className="text-[15px] font-semibold text-gray-700">{getPageTitle()}</h1>
          </div>

          {/* Notifications */}
          <NotificationCenter />
        </div>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
