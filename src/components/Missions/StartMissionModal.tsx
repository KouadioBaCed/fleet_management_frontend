import { useState } from 'react';
import { X, Car, Gauge, Fuel, MapPin, CheckCircle, AlertTriangle, Loader2, ChevronRight, ChevronLeft } from 'lucide-react';
import type { Mission } from '@/types';

interface StartMissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: (data: { startMileage: number; startFuelLevel: number }) => Promise<void>;
  mission: Mission | null;
}

type Step = 'info' | 'mileage' | 'fuel' | 'confirm';

export default function StartMissionModal({ isOpen, onClose, onStart, mission }: StartMissionModalProps) {
  const [step, setStep] = useState<Step>('info');
  const [startMileage, setStartMileage] = useState('');
  const [startFuelLevel, setStartFuelLevel] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !mission) return null;

  const resetModal = () => {
    setStep('info');
    setStartMileage('');
    setStartFuelLevel('');
    setError(null);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const nextStep = () => {
    setError(null);
    switch (step) {
      case 'info':
        setStep('mileage');
        break;
      case 'mileage':
        if (!startMileage || parseFloat(startMileage) < 0) {
          setError('Veuillez entrer un kilométrage valide');
          return;
        }
        setStep('fuel');
        break;
      case 'fuel':
        if (!startFuelLevel || parseFloat(startFuelLevel) < 0 || parseFloat(startFuelLevel) > 100) {
          setError('Veuillez entrer un niveau de carburant valide (0-100%)');
          return;
        }
        setStep('confirm');
        break;
      case 'confirm':
        handleStart();
        break;
    }
  };

  const prevStep = () => {
    setError(null);
    switch (step) {
      case 'mileage':
        setStep('info');
        break;
      case 'fuel':
        setStep('mileage');
        break;
      case 'confirm':
        setStep('fuel');
        break;
    }
  };

  const handleStart = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await onStart({
        startMileage: parseFloat(startMileage),
        startFuelLevel: parseFloat(startFuelLevel),
      });
      resetModal();
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  const getStepNumber = () => {
    const steps: Step[] = ['info', 'mileage', 'fuel', 'confirm'];
    return steps.indexOf(step) + 1;
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3, 4].map((num) => (
        <div key={num} className="flex items-center">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
              num < getStepNumber()
                ? 'bg-green-500 text-white'
                : num === getStepNumber()
                ? 'text-white shadow-lg'
                : 'bg-gray-200 text-gray-500'
            }`}
            style={num === getStepNumber() ? { backgroundColor: '#6A8A82' } : {}}
          >
            {num < getStepNumber() ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              num
            )}
          </div>
          {num < 4 && (
            <div
              className={`w-12 h-1 mx-1 rounded transition-all ${
                num < getStepNumber() ? 'bg-green-500' : 'bg-gray-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  const renderStepContent = () => {
    switch (step) {
      case 'info':
        return (
          <div className="text-center">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ backgroundColor: '#E8EFED' }}
            >
              <Car className="w-10 h-10" style={{ color: '#6A8A82' }} />
            </div>
            <h3 className="text-2xl font-bold mb-3" style={{ color: '#191919' }}>
              Prêt à démarrer ?
            </h3>
            <p className="text-gray-600 mb-8">
              Vous allez démarrer la mission. Assurez-vous d'avoir vérifié le véhicule avant de partir.
            </p>

            <div className="bg-gray-50 rounded-xl p-5 text-left space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Mission</span>
                <span className="font-semibold" style={{ color: '#191919' }}>{mission.title}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Code</span>
                <span className="font-semibold" style={{ color: '#6A8A82' }}>{mission.mission_code}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Véhicule</span>
                <span className="font-semibold" style={{ color: '#191919' }}>{mission.vehicle_plate}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Chauffeur</span>
                <span className="font-semibold" style={{ color: '#191919' }}>{mission.driver_name}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-gray-600">Destination</span>
                <span className="font-semibold text-right max-w-[200px]" style={{ color: '#191919' }}>
                  {mission.destination_address}
                </span>
              </div>
            </div>
          </div>
        );

      case 'mileage':
        return (
          <div className="text-center">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ backgroundColor: '#E8EFED' }}
            >
              <Gauge className="w-10 h-10" style={{ color: '#6A8A82' }} />
            </div>
            <h3 className="text-2xl font-bold mb-3" style={{ color: '#191919' }}>
              Kilométrage initial
            </h3>
            <p className="text-gray-600 mb-8">
              Notez le kilométrage actuel affiché sur le tableau de bord du véhicule.
            </p>

            <div className="flex items-center justify-center gap-3 mb-4">
              <input
                type="number"
                value={startMileage}
                onChange={(e) => setStartMileage(e.target.value)}
                placeholder="0"
                className="text-5xl font-bold text-center w-48 outline-none border-b-4 pb-2 transition-colors"
                style={{
                  color: '#191919',
                  borderColor: startMileage ? '#6A8A82' : '#E8ECEC'
                }}
              />
              <span className="text-2xl font-semibold text-gray-500">km</span>
            </div>

            <p className="text-sm text-gray-400">Ex: 45230 km</p>
          </div>
        );

      case 'fuel':
        return (
          <div className="text-center">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ backgroundColor: '#F5E8DD' }}
            >
              <Fuel className="w-10 h-10" style={{ color: '#B87333' }} />
            </div>
            <h3 className="text-2xl font-bold mb-3" style={{ color: '#191919' }}>
              Niveau de carburant
            </h3>
            <p className="text-gray-600 mb-8">
              Estimez le niveau de carburant actuel du véhicule.
            </p>

            <div className="flex items-center justify-center gap-3 mb-6">
              <input
                type="number"
                value={startFuelLevel}
                onChange={(e) => setStartFuelLevel(e.target.value)}
                placeholder="0"
                min="0"
                max="100"
                className="text-5xl font-bold text-center w-32 outline-none border-b-4 pb-2 transition-colors"
                style={{
                  color: '#191919',
                  borderColor: startFuelLevel ? '#B87333' : '#E8ECEC'
                }}
              />
              <span className="text-2xl font-semibold text-gray-500">%</span>
            </div>

            <div className="flex justify-center gap-2">
              {[25, 50, 75, 100].map((level) => (
                <button
                  key={level}
                  onClick={() => setStartFuelLevel(level.toString())}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all border-2 ${
                    startFuelLevel === level.toString()
                      ? 'shadow-md'
                      : 'hover:bg-gray-50'
                  }`}
                  style={{
                    borderColor: startFuelLevel === level.toString() ? '#B87333' : '#E8ECEC',
                    backgroundColor: startFuelLevel === level.toString() ? '#F5E8DD' : 'transparent',
                    color: startFuelLevel === level.toString() ? '#B87333' : '#6B7280',
                  }}
                >
                  {level}%
                </button>
              ))}
            </div>
          </div>
        );

      case 'confirm':
        return (
          <div className="text-center">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ backgroundColor: '#DBEAFE' }}
            >
              <MapPin className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold mb-3" style={{ color: '#191919' }}>
              Confirmer le démarrage
            </h3>
            <p className="text-gray-600 mb-8">
              Vérifiez les informations avant de démarrer la mission.
            </p>

            <div className="bg-gray-50 rounded-xl p-5 text-left space-y-4 mb-6">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: '#E8EFED' }}
                >
                  <Gauge className="w-5 h-5" style={{ color: '#6A8A82' }} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Kilométrage initial</p>
                  <p className="font-bold text-lg" style={{ color: '#191919' }}>{startMileage} km</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: '#F5E8DD' }}
                >
                  <Fuel className="w-5 h-5" style={{ color: '#B87333' }} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Niveau de carburant</p>
                  <p className="font-bold text-lg" style={{ color: '#191919' }}>{startFuelLevel}%</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: '#DCFCE7' }}
                >
                  <MapPin className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Tracking GPS</p>
                  <p className="font-bold text-lg text-green-600">Sera activé</p>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800 text-left">
                Une fois démarrée, le tracking GPS sera actif jusqu'à la fin de la mission.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold" style={{ color: '#191919' }}>
              Démarrer la mission
            </h2>
            <button
              onClick={handleClose}
              className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {renderStepIndicator()}
          {renderStepContent()}

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex gap-3">
          {step !== 'info' && (
            <button
              onClick={prevStep}
              className="flex-1 px-6 py-3 rounded-xl font-semibold transition-all hover:bg-gray-100 flex items-center justify-center gap-2"
              style={{ backgroundColor: '#F1F5F9', color: '#64748B' }}
            >
              <ChevronLeft className="w-5 h-5" />
              Retour
            </button>
          )}

          <button
            onClick={nextStep}
            disabled={isLoading}
            className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all text-white flex items-center justify-center gap-2 hover:shadow-lg disabled:opacity-70 ${
              step === 'info' ? 'flex-[2]' : ''
            }`}
            style={{ backgroundColor: step === 'confirm' ? '#22C55E' : '#6A8A82' }}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                {step === 'confirm' ? 'Démarrer la mission' : 'Continuer'}
                {step !== 'confirm' && <ChevronRight className="w-5 h-5" />}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
