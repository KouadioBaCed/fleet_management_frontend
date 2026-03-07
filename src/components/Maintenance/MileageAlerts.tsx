import { AlertTriangle, Car, Gauge, Calendar, Wrench, ChevronRight, AlertCircle, Info } from 'lucide-react';
import type { MileageAlert } from '@/api/maintenance';

interface MileageAlertsProps {
  alerts: MileageAlert[];
  isLoading: boolean;
  onScheduleMaintenance: (vehicleId: number) => void;
}

export default function MileageAlerts({ alerts, isLoading, onScheduleMaintenance }: MileageAlertsProps) {
  const severityConfig: Record<string, { bg: string; border: string; text: string; icon: typeof AlertTriangle; label: string }> = {
    critical: {
      bg: '#FEF2F2',
      border: '#DC2626',
      text: '#DC2626',
      icon: AlertTriangle,
      label: 'Critique'
    },
    warning: {
      bg: '#FEF3C7',
      border: '#D97706',
      text: '#D97706',
      icon: AlertCircle,
      label: 'Attention'
    },
    info: {
      bg: '#EFF6FF',
      border: '#3B82F6',
      text: '#3B82F6',
      icon: Info,
      label: 'Info'
    },
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border-2 p-8" style={{ borderColor: '#E8ECEC' }}>
        <div className="flex items-center justify-center">
          <div
            className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: '#6A8A82', borderTopColor: 'transparent' }}
          />
        </div>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="bg-white rounded-2xl border-2 p-8 text-center" style={{ borderColor: '#E8ECEC' }}>
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: '#E8EFED' }}
        >
          <Gauge className="w-8 h-8" style={{ color: '#6A8A82' }} />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Aucune alerte</h3>
        <p className="text-gray-500">
          Tous vos véhicules sont en règle avec leur kilométrage de maintenance
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border-2 overflow-hidden" style={{ borderColor: '#E8ECEC' }}>
      {/* Header */}
      <div className="px-6 py-4 border-b-2 flex items-center justify-between" style={{ borderColor: '#E8ECEC' }}>
        <div className="flex items-center space-x-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: '#FEF3C7' }}
          >
            <Gauge className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold" style={{ color: '#191919' }}>
              Alertes Kilométrage
            </h3>
            <p className="text-sm text-gray-500">
              {alerts.length} véhicule{alerts.length > 1 ? 's' : ''} nécessite{alerts.length > 1 ? 'nt' : ''} une maintenance
            </p>
          </div>
        </div>

        {/* Summary badges */}
        <div className="flex items-center space-x-2">
          {alerts.filter(a => a.severity === 'critical').length > 0 && (
            <span
              className="px-3 py-1.5 rounded-full text-xs font-bold flex items-center space-x-1"
              style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>{alerts.filter(a => a.severity === 'critical').length} critique{alerts.filter(a => a.severity === 'critical').length > 1 ? 's' : ''}</span>
            </span>
          )}
          {alerts.filter(a => a.severity === 'warning').length > 0 && (
            <span
              className="px-3 py-1.5 rounded-full text-xs font-bold flex items-center space-x-1"
              style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}
            >
              <AlertCircle className="w-3 h-3" />
              <span>{alerts.filter(a => a.severity === 'warning').length} attention</span>
            </span>
          )}
        </div>
      </div>

      {/* Alerts List */}
      <div className="divide-y-2" style={{ borderColor: '#E8ECEC' }}>
        {alerts.map((alert) => {
          const severity = severityConfig[alert.severity];
          const SeverityIcon = severity.icon;

          return (
            <div
              key={alert.id}
              className="p-5 hover:bg-gray-50 transition-colors"
              style={{ borderLeftWidth: '4px', borderLeftColor: severity.border }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  {/* Severity Icon */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: severity.bg }}
                  >
                    <SeverityIcon className="w-6 h-6" style={{ color: severity.text }} />
                  </div>

                  {/* Vehicle Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-bold text-lg" style={{ color: '#191919' }}>
                        {alert.vehicle_plate}
                      </h4>
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{ backgroundColor: severity.bg, color: severity.text }}
                      >
                        {severity.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      {alert.vehicle_brand} {alert.vehicle_model}
                    </p>

                    {/* Mileage Progress Bar */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-sm mb-1.5">
                        <span className="text-gray-600">Kilométrage actuel</span>
                        <span className="font-bold" style={{ color: severity.text }}>
                          {alert.message}
                        </span>
                      </div>
                      <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: '#E8ECEC' }}>
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(alert.percentage, 100)}%`,
                            backgroundColor: severity.border,
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs mt-1.5">
                        <span className="text-gray-500">
                          {alert.current_mileage.toLocaleString()} km
                        </span>
                        <span className="text-gray-500">
                          Prochain: {alert.next_maintenance_mileage.toLocaleString()} km
                        </span>
                      </div>
                    </div>

                    {/* Last Maintenance Info */}
                    {alert.last_maintenance_date && (
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center space-x-1.5 text-gray-500">
                          <Calendar className="w-4 h-4" />
                          <span>Dernière maintenance: {new Date(alert.last_maintenance_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        </div>
                        {alert.last_maintenance_type && (
                          <div className="flex items-center space-x-1.5 text-gray-500">
                            <Wrench className="w-4 h-4" />
                            <span>{alert.last_maintenance_type}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => onScheduleMaintenance(alert.vehicle_id)}
                  className="ml-4 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all hover:shadow-md flex items-center space-x-2 flex-shrink-0"
                  style={{ backgroundColor: '#E8EFED', color: '#6A8A82' }}
                >
                  <span>Planifier</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
