import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, Clock, ChevronDown, ChevronUp, X } from 'lucide-react';
import { vehicleDocumentsApi } from '@/api/vehicles';
import type { DocumentAlert, VehicleDocumentType } from '@/types';

interface DocumentAlertsBannerProps {
  onViewVehicle?: (vehicleId: number) => void;
}

const DOCUMENT_TYPE_LABELS: Record<VehicleDocumentType, string> = {
  carte_grise: 'Carte grise',
  assurance: 'Assurance',
  visite_technique: 'Visite technique',
  vignette: 'Vignette',
};

export default function DocumentAlertsBanner({ onViewVehicle }: DocumentAlertsBannerProps) {
  const [alerts, setAlerts] = useState<DocumentAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const data = await vehicleDocumentsApi.getAlerts();
        setAlerts(data);
      } catch {
        // Silently fail - not critical for the page
      } finally {
        setLoading(false);
      }
    };
    fetchAlerts();
  }, []);

  if (loading || alerts.length === 0 || dismissed) return null;

  const expiredAlerts = alerts.filter(a => a.status === 'expired');
  const expiringAlerts = alerts.filter(a => a.status === 'expiring_soon');
  const hasExpired = expiredAlerts.length > 0;

  return (
    <div
      className="rounded-xl border-2 overflow-hidden transition-all"
      style={{
        borderColor: hasExpired ? '#FECACA' : '#FDE68A',
        backgroundColor: hasExpired ? '#FEF2F2' : '#FFFBEB',
      }}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: hasExpired ? '#FEE2E2' : '#FEF3C7' }}
          >
            <Shield className="w-4 h-4" style={{ color: hasExpired ? '#DC2626' : '#D97706' }} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: hasExpired ? '#991B1B' : '#92400E' }}>
              {alerts.length} alerte{alerts.length > 1 ? 's' : ''} document{alerts.length > 1 ? 's' : ''}
            </p>
            <p className="text-xs" style={{ color: hasExpired ? '#DC2626' : '#D97706' }}>
              {expiredAlerts.length > 0 && `${expiredAlerts.length} expire${expiredAlerts.length > 1 ? 's' : ''}`}
              {expiredAlerts.length > 0 && expiringAlerts.length > 0 && ' • '}
              {expiringAlerts.length > 0 && `${expiringAlerts.length} bientot`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg hover:bg-white/50 transition-colors"
          >
            {expanded ? (
              <ChevronUp className="w-4 h-4" style={{ color: hasExpired ? '#DC2626' : '#D97706' }} />
            ) : (
              <ChevronDown className="w-4 h-4" style={{ color: hasExpired ? '#DC2626' : '#D97706' }} />
            )}
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1.5 rounded-lg hover:bg-white/50 transition-colors"
          >
            <X className="w-4 h-4" style={{ color: hasExpired ? '#DC2626' : '#D97706' }} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t px-4 py-2 space-y-1" style={{ borderColor: hasExpired ? '#FECACA' : '#FDE68A' }}>
          {alerts.slice(0, 10).map((alert) => {
            const isExpired = alert.status === 'expired';
            return (
              <button
                key={alert.id}
                onClick={() => onViewVehicle?.(alert.vehicle_id)}
                className="w-full flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-white/50 transition-colors text-left"
              >
                {isExpired ? (
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: '#DC2626' }} />
                ) : (
                  <Clock className="w-4 h-4 flex-shrink-0" style={{ color: '#D97706' }} />
                )}
                <span className="text-xs font-semibold" style={{ color: '#191919' }}>
                  {alert.vehicle_plate}
                </span>
                <span className="text-xs text-gray-500">
                  {DOCUMENT_TYPE_LABELS[alert.document_type]}
                </span>
                <span
                  className="text-xs font-semibold ml-auto"
                  style={{ color: isExpired ? '#DC2626' : '#D97706' }}
                >
                  {isExpired
                    ? `Expire depuis ${Math.abs(alert.days_until_expiry)}j`
                    : `Dans ${alert.days_until_expiry}j`
                  }
                </span>
              </button>
            );
          })}
          {alerts.length > 10 && (
            <p className="text-xs text-center py-1" style={{ color: hasExpired ? '#DC2626' : '#D97706' }}>
              +{alerts.length - 10} autres alertes
            </p>
          )}
        </div>
      )}
    </div>
  );
}
