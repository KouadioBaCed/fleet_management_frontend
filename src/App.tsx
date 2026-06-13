import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import type { JSX } from 'react';
import { useAuthStore } from './store/authStore';
import { authApi } from './api/auth';
import { sessionManager } from './services/sessionManager';
import GlobalLoader from './components/common/GlobalLoader';
import InactivityWarningModal from './components/common/InactivityWarningModal';
import { ThemeProvider } from './components/Theme';
import { MODULES } from './config/modules';
import type { ModuleCode } from './types';
import {
  ProtectedRoute,
  PublicRoute,
  ModuleProtectedRoute,
  DefaultRedirect,
} from './components/routing/guards';

// Pages
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import Dashboard from './pages/Dashboard';
import VehiclesPage from './pages/Vehicles/VehiclesPage';
import DriversPage from './pages/Drivers/DriversPage';
import MissionsPage from './pages/Missions/MissionsPage';
import LiveTrackingPage from './pages/LiveTrackingPage';
import IncidentsPage from './pages/Incidents/IncidentsPage';
import MaintenancePage from './pages/Maintenance/MaintenancePage';
import FuelPage from './pages/Fuel/FuelPage';
import ReportsPage from './pages/Reports/ReportsPage';
import AnalyticsPage from './pages/Analytics/AnalyticsPage';
import SettingsPage from './pages/Settings/SettingsPage';
import ProfilePage from './pages/Profile/ProfilePage';

// Association code de module -> page rendue.
// Les routes sont générées dynamiquement à partir du registre `MODULES`,
// puis protégées individuellement par `ModuleProtectedRoute`.
const MODULE_PAGES: Record<ModuleCode, JSX.Element> = {
  dashboard: <Dashboard />,
  vehicles: <VehiclesPage />,
  drivers: <DriversPage />,
  missions: <MissionsPage />,
  tracking: <LiveTrackingPage />,
  incidents: <IncidentsPage />,
  maintenance: <MaintenancePage />,
  fuel: <FuelPage />,
  analytics: <AnalyticsPage />,
  reports: <ReportsPage />,
};

// Composant principal avec gestion de session
function AppContent() {
  const [isLoading, setIsLoading] = useState(true);
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  const [warningRemainingMs, setWarningRemainingMs] = useState(0);
  const { isAuthenticated, token, setUser, setOrganization, logoutSilent } = useAuthStore();
  const navigate = useNavigate();

  // Callback de logout pour inactivite
  const handleInactivityLogout = useCallback(() => {
    setShowInactivityWarning(false);
    logoutSilent();
    navigate('/login', {
      replace: true,
      state: { reason: 'inactivity' }
    });
  }, [logoutSilent, navigate]);

  // Callback d'avertissement
  const handleInactivityWarning = useCallback((remainingMs: number) => {
    setWarningRemainingMs(remainingMs);
    setShowInactivityWarning(true);
  }, []);

  // Rester connecte
  const handleStayConnected = useCallback(() => {
    setShowInactivityWarning(false);
    sessionManager.extendSession();
  }, []);

  // Initialisation de l'auth
  useEffect(() => {
    const initializeAuth = async () => {
      // Si un token existe, essayer de recuperer le profil utilisateur
      if (token && isAuthenticated) {
        try {
          const { user, organization } = await authApi.getProfile();

          // Verifier que le role est autorise (admin ou supervisor)
          if (user.role === 'driver') {
            // Deconnecter si c'est un chauffeur
            logoutSilent();
          } else {
            setUser(user);
            if (organization) {
              setOrganization(organization);
            }
          }
        } catch (error) {
          // Token invalide ou expire, deconnecter
          console.error('Failed to fetch profile:', error);
          logoutSilent();
        }
      }

      // Fin du chargement
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  // Gestion de la session (demarrage/arret)
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      // Demarrer le gestionnaire de session
      sessionManager.start({
        onLogout: handleInactivityLogout,
        onWarning: handleInactivityWarning,
        onSessionExtended: () => {
          console.log('[App] Session extended');
        },
      });
    } else {
      // Arreter le gestionnaire de session
      sessionManager.stop();
      setShowInactivityWarning(false);
    }

    return () => {
      sessionManager.stop();
    };
  }, [isAuthenticated, isLoading, handleInactivityLogout, handleInactivityWarning]);

  // Afficher le loader global pendant le chargement initial
  if (isLoading) {
    return <GlobalLoader />;
  }

  return (
    <>
      <Routes>
        {/* Routes publiques - redirigent vers dashboard si connecte */}
        <Route path="/login" element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        } />
        <Route path="/signup" element={
          <PublicRoute>
            <SignUpPage />
          </PublicRoute>
        } />
        <Route path="/forgot-password" element={
          <PublicRoute>
            <ForgotPasswordPage />
          </PublicRoute>
        } />
        <Route path="/verify-email" element={
          <PublicRoute>
            <VerifyEmailPage />
          </PublicRoute>
        } />

        {/* Routes de modules — générées dynamiquement et protégées
            individuellement selon les modules autorisés de l'organisation. */}
        {MODULES.map((module) => (
          <Route
            key={module.code}
            path={module.path}
            element={
              <ModuleProtectedRoute module={module.code}>
                {MODULE_PAGES[module.code]}
              </ModuleProtectedRoute>
            }
          />
        ))}

        {/* Routes toujours disponibles (authentification uniquement) */}
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        {/* Attrape-tout : renvoie vers la page d'atterrissage par défaut
            (ex: /incidents pour une organisation "incidents uniquement"). */}
        <Route path="*" element={<DefaultRedirect />} />
      </Routes>

      {/* Modal d'avertissement d'inactivite */}
      <InactivityWarningModal
        isOpen={showInactivityWarning}
        remainingMs={warningRemainingMs}
        onStayConnected={handleStayConnected}
        onLogout={handleInactivityLogout}
      />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
