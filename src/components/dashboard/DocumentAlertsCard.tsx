import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, Clock, CheckCircle, Loader2, ChevronRight, Car } from 'lucide-react';
import { vehicleDocumentsApi } from '@/api/vehicles';
import type { DocumentAlert, VehicleDocumentType } from '@/types';

interface DocumentAlertsCardProps {
  onViewVehicle?: (vehicleId: number) => void;
}

const DOCUMENT_TYPE_LABELS: Record<VehicleDocumentType, string> = {
  carte_grise: 'Carte grise',
  assurance: 'Assurance',
  visite_technique: 'Visite technique',
  vignette: 'Vignette',
};

export default function DocumentAlertsCard({ onViewVehicle }: DocumentAlertsCardProps) {
  const [alerts, setAlerts] = useState<DocumentAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const data = await vehicleDocumentsApi.getAlerts();
        setAlerts(data);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000);
    return () => clearInterval(interval);
  }, []);

  const expiredCount = alerts.filter(a => a.status === 'expired').length;
  const expiringCount = alerts.filter(a => a.status === 'expiring_soon').length;

  if (loading) {
    return (
      <div className="data-card">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (error || alerts.length === 0) {
    return (
      <div className="data-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#D1FAE5' }}>
            <CheckCircle className="w-5 h-5" style={{ color: '#059669' }} />
          </div>
          <div>
            <h3 className="font-semibold text-sm" style={{ color: '#191919' }}>Documents vehicules</h3>
            <p className="text-xs text-gray-500">Tous les documents sont a jour</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="data-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: expiredCount > 0 ? '#FEE2E2' : '#FEF3C7' }}
          >
            <Shield
              className="w-5 h-5"
              style={{ color: expiredCount > 0 ? '#DC2626' : '#D97706' }}
            />
          </div>
          <div>
            <h3 className="font-semibold text-sm" style={{ color: '#191919' }}>Alertes documents</h3>
            <p className="text-xs text-gray-500">{alerts.length} alerte{alerts.length > 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {expiredCount > 0 && (
            <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-600">
              {expiredCount} expire{expiredCount > 1 ? 's' : ''}
            </span>
          )}
          {expiringCount > 0 && (
            <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-600">
              {expiringCount} bientot
            </span>
          )}
        </div>
      </div>

      {/* Alert list */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {alerts.slice(0, 8).map((alert) => {
          const isExpired = alert.status === 'expired';
          return (
            <button
              key={alert.id}
              onClick={() => onViewVehicle?.(alert.vehicle_id)}
              className="w-full flex items-center gap-3 p-2.5 rounded-xl transition-all hover:bg-gray-50 text-left"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: isExpired ? '#FEE2E2' : '#FEF3C7' }}
              >
                {isExpired ? (
                  <AlertTriangle className="w-4 h-4" style={{ color: '#DC2626' }} />
                ) : (
                  <Clock className="w-4 h-4" style={{ color: '#D97706' }} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold truncate" style={{ color: '#191919' }}>
                    {alert.vehicle_plate}
                  </p>
                  <span className="text-[10px] text-gray-400">
                    {alert.vehicle_brand} {alert.vehicle_model}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500">
                  {DOCUMENT_TYPE_LABELS[alert.document_type]} —{' '}
                  <span style={{ color: isExpired ? '#DC2626' : '#D97706', fontWeight: 600 }}>
                    {isExpired
                      ? `expire depuis ${Math.abs(alert.days_until_expiry)}j`
                      : `expire dans ${alert.days_until_expiry}j`
                    }
                  </span>
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
            </button>
          );
        })}
      </div>

      {alerts.length > 8 && (
        <p className="text-xs text-center text-gray-400 mt-3">
          +{alerts.length - 8} autres alertes
        </p>
      )}
    </div>
  );
}
