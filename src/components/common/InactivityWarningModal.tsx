import { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface InactivityWarningModalProps {
  isOpen: boolean;
  remainingMs: number;
  onStayConnected: () => void;
  onLogout: () => void;
}

export default function InactivityWarningModal({
  isOpen,
  remainingMs,
  onStayConnected,
  onLogout,
}: InactivityWarningModalProps) {
  const [countdown, setCountdown] = useState(Math.ceil(remainingMs / 1000));

  useEffect(() => {
    if (!isOpen) return;

    setCountdown(Math.ceil(remainingMs / 1000));

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, remainingMs]);

  useEffect(() => {
    if (countdown === 0 && isOpen) {
      onLogout();
    }
  }, [countdown, isOpen, onLogout]);

  if (!isOpen) return null;

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-amber-500 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Session inactive</h2>
              <p className="text-sm text-white/80">Etes-vous toujours la ?</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-100 mb-4">
              <Clock className="w-10 h-10 text-amber-600" />
            </div>
            <p className="text-gray-600 mb-2">
              Votre session va expirer dans
            </p>
            <div className="text-4xl font-bold text-amber-600">
              {minutes > 0 ? `${minutes}:${seconds.toString().padStart(2, '0')}` : `${seconds}s`}
            </div>
          </div>

          <p className="text-sm text-gray-500 text-center mb-6">
            Pour des raisons de securite, vous serez deconnecte automatiquement apres une periode d'inactivite.
          </p>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onLogout}
              className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
            >
              Se deconnecter
            </button>
            <button
              onClick={onStayConnected}
              className="flex-1 px-4 py-3 rounded-xl text-white font-semibold transition-colors"
              style={{ backgroundColor: '#6A8A82' }}
            >
              Rester connecte
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
