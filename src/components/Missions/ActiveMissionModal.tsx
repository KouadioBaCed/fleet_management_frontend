import { useState, useEffect, useRef } from 'react';
import {
  X,
  Pause,
  Play,
  Square,
  Clock,
  Gauge,
  Fuel,
  MapPin,
  AlertTriangle,
  Loader2,
  Coffee,
  UtensilsCrossed,
  Car,
  FileText,
  CheckCircle,
} from 'lucide-react';
import type { Mission } from '@/types';
import { tripsApi, type Trip, type TripPause } from '@/api/trips';

interface ActiveMissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  mission: Mission | null;
  tripId: number | null;
  onComplete: () => void;
}

type PauseReason = 'break' | 'meal' | 'fuel' | 'traffic' | 'other';

const PAUSE_REASONS: { value: PauseReason; label: string; icon: React.ReactNode }[] = [
  { value: 'break', label: 'Pause', icon: <Coffee className="w-5 h-5" /> },
  { value: 'meal', label: 'Repas', icon: <UtensilsCrossed className="w-5 h-5" /> },
  { value: 'fuel', label: 'Ravitaillement', icon: <Fuel className="w-5 h-5" /> },
  { value: 'traffic', label: 'Trafic', icon: <Car className="w-5 h-5" /> },
  { value: 'other', label: 'Autre', icon: <FileText className="w-5 h-5" /> },
];

export default function ActiveMissionModal({
  isOpen,
  onClose,
  mission,
  tripId,
  onComplete,
}: ActiveMissionModalProps) {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pause Modal
  const [showPauseForm, setShowPauseForm] = useState(false);
  const [pauseReason, setPauseReason] = useState<PauseReason>('break');
  const [pauseNotes, setPauseNotes] = useState('');
  const [isPausing, setIsPausing] = useState(false);
  const [isResuming, setIsResuming] = useState(false);

  // End Modal
  const [showEndForm, setShowEndForm] = useState(false);
  const [endStep, setEndStep] = useState<'mileage' | 'fuel' | 'notes' | 'confirm'>('mileage');
  const [endMileage, setEndMileage] = useState('');
  const [endFuelLevel, setEndFuelLevel] = useState('');
  const [endNotes, setEndNotes] = useState('');
  const [isEnding, setIsEnding] = useState(false);

  // Pause Timer
  const [pauseStartTime, setPauseStartTime] = useState<Date | null>(null);
  const [pauseElapsedSeconds, setPauseElapsedSeconds] = useState(0);
  const [totalPauseMinutes, setTotalPauseMinutes] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Pause History
  const [pauseHistory, setPauseHistory] = useState<TripPause[]>([]);

  useEffect(() => {
    if (isOpen && tripId) {
      loadTrip();
      loadPauseHistory();
    }
  }, [isOpen, tripId]);

  // Pause timer effect
  useEffect(() => {
    if (isPaused && pauseStartTime) {
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - pauseStartTime.getTime()) / 1000);
        setPauseElapsedSeconds(elapsed);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPaused, pauseStartTime]);

  const loadTrip = async () => {
    if (!tripId) return;
    try {
      setIsLoading(true);
      const data = await tripsApi.getById(tripId);
      setTrip(data);
      setIsPaused(data.status === 'paused');
      setTotalPauseMinutes(data.pause_duration_minutes);

      if (data.status === 'paused') {
        // Find active pause to get start time
        const pausesData = await tripsApi.getPauses(tripId);
        const activePause = pausesData.pauses.find(p => p.is_active);
        if (activePause) {
          setPauseStartTime(new Date(activePause.started_at));
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors du chargement');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPauseHistory = async () => {
    if (!tripId) return;
    try {
      const data = await tripsApi.getPauses(tripId);
      setPauseHistory(data.pauses);
      setTotalPauseMinutes(data.total_pause_minutes);
    } catch (err) {
      console.error('Error loading pause history:', err);
    }
  };

  const handlePauseClick = () => {
    setPauseReason('break');
    setPauseNotes('');
    setShowPauseForm(true);
  };

  const confirmPause = async () => {
    if (!tripId) return;
    setIsPausing(true);
    setError(null);

    try {
      const response = await tripsApi.pause(tripId, {
        reason: pauseReason,
        notes: pauseNotes,
      });

      setIsPaused(true);
      setPauseStartTime(new Date());
      setPauseElapsedSeconds(0);
      setShowPauseForm(false);
      setTrip(response.trip);
      await loadPauseHistory();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Impossible de mettre en pause');
    } finally {
      setIsPausing(false);
    }
  };

  const handleResume = async () => {
    if (!tripId) return;
    setIsResuming(true);
    setError(null);

    try {
      const response = await tripsApi.resume(tripId);

      setIsPaused(false);
      setPauseStartTime(null);
      setPauseElapsedSeconds(0);
      setTotalPauseMinutes(response.total_pause_minutes);
      setTrip(response.trip);
      await loadPauseHistory();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Impossible de reprendre');
    } finally {
      setIsResuming(false);
    }
  };

  const handleEndClick = () => {
    setEndMileage(trip?.start_mileage?.toString() || '');
    setEndFuelLevel('');
    setEndNotes('');
    setEndStep('mileage');
    setShowEndForm(true);
    setError(null);
  };

  const nextEndStep = () => {
    setError(null);
    const startMileage = trip?.start_mileage || 0;

    switch (endStep) {
      case 'mileage':
        if (!endMileage || parseFloat(endMileage) < 0) {
          setError('Veuillez entrer un kilometrage valide');
          return;
        }
        if (parseFloat(endMileage) < startMileage) {
          setError('Le kilometrage final doit etre superieur au kilometrage initial');
          return;
        }
        setEndStep('fuel');
        break;
      case 'fuel':
        if (!endFuelLevel || parseFloat(endFuelLevel) < 0 || parseFloat(endFuelLevel) > 100) {
          setError('Veuillez entrer un niveau de carburant valide (0-100%)');
          return;
        }
        setEndStep('notes');
        break;
      case 'notes':
        setEndStep('confirm');
        break;
      case 'confirm':
        confirmEnd();
        break;
    }
  };

  const prevEndStep = () => {
    setError(null);
    switch (endStep) {
      case 'fuel':
        setEndStep('mileage');
        break;
      case 'notes':
        setEndStep('fuel');
        break;
      case 'confirm':
        setEndStep('notes');
        break;
    }
  };

  const getEndStepNumber = () => {
    const steps = ['mileage', 'fuel', 'notes', 'confirm'];
    return steps.indexOf(endStep) + 1;
  };

  const confirmEnd = async () => {
    if (!tripId) return;

    setIsEnding(true);
    setError(null);

    try {
      await tripsApi.complete(tripId, {
        end_mileage: parseFloat(endMileage),
        end_fuel_level: parseFloat(endFuelLevel),
        notes: endNotes,
      });

      setShowEndForm(false);
      onComplete();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Impossible de terminer la mission');
    } finally {
      setIsEnding(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTotalPause = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  };

  if (!isOpen || !mission) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div
          className="p-6 border-b border-gray-100"
          style={{ backgroundColor: isPaused ? '#FEF3C7' : '#E8EFED' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full ${
                  isPaused ? 'bg-amber-500' : 'bg-green-500 animate-pulse'
                }`}
              />
              <h2 className="text-xl font-bold" style={{ color: '#191919' }}>
                {isPaused ? 'Mission en pause' : 'Mission en cours'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-white/50 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Pause Timer */}
          {isPaused && (
            <div className="mt-4 flex items-center justify-center gap-4">
              <div className="bg-white rounded-xl px-6 py-3 shadow-sm">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Temps de pause</p>
                <p className="text-3xl font-bold text-amber-600 font-mono">
                  {formatTime(pauseElapsedSeconds)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : showPauseForm ? (
            /* Pause Form */
            <div className="space-y-6">
              <div className="text-center">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: '#FEF3C7' }}
                >
                  <Pause className="w-8 h-8 text-amber-600" />
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ color: '#191919' }}>
                  Mettre en pause
                </h3>
                <p className="text-gray-600">Le tracking GPS sera arrete temporairement</p>
              </div>

              {/* Reason Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Raison de la pause
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {PAUSE_REASONS.map((reason) => (
                    <button
                      key={reason.value}
                      onClick={() => setPauseReason(reason.value)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        pauseReason === reason.value
                          ? 'border-amber-500 bg-amber-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <span className={pauseReason === reason.value ? 'text-amber-600' : 'text-gray-500'}>
                        {reason.icon}
                      </span>
                      <span
                        className={`text-sm font-medium ${
                          pauseReason === reason.value ? 'text-amber-700' : 'text-gray-600'
                        }`}
                      >
                        {reason.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Notes (optionnel)
                </label>
                <textarea
                  value={pauseNotes}
                  onChange={(e) => setPauseNotes(e.target.value)}
                  placeholder="Ajouter des details..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all resize-none"
                />
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPauseForm(false)}
                  className="flex-1 px-6 py-3 rounded-xl font-semibold transition-all"
                  style={{ backgroundColor: '#F1F5F9', color: '#64748B' }}
                >
                  Annuler
                </button>
                <button
                  onClick={confirmPause}
                  disabled={isPausing}
                  className="flex-1 px-6 py-3 rounded-xl font-semibold text-white transition-all hover:shadow-lg disabled:opacity-70 flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#F59E0B' }}
                >
                  {isPausing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Pause className="w-5 h-5" />
                      Mettre en pause
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : showEndForm ? (
            /* End Form - Multi-step Wizard */
            <div className="space-y-6">
              {/* Step Indicator */}
              <div className="flex items-center justify-center mb-6">
                {[1, 2, 3, 4].map((num) => (
                  <div key={num} className="flex items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                        num < getEndStepNumber()
                          ? 'bg-green-500 text-white'
                          : num === getEndStepNumber()
                          ? 'bg-red-500 text-white shadow-lg'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {num < getEndStepNumber() ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        num
                      )}
                    </div>
                    {num < 4 && (
                      <div
                        className={`w-12 h-1 mx-1 rounded transition-all ${
                          num < getEndStepNumber() ? 'bg-green-500' : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Step 1: Mileage */}
              {endStep === 'mileage' && (
                <div className="text-center space-y-6">
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
                    style={{ backgroundColor: '#FEE2E2' }}
                  >
                    <Gauge className="w-10 h-10 text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-2" style={{ color: '#191919' }}>
                      Kilométrage final
                    </h3>
                    <p className="text-gray-600">
                      Notez le kilometrage actuel affiche sur le tableau de bord.
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-3">
                    <input
                      type="number"
                      value={endMileage}
                      onChange={(e) => setEndMileage(e.target.value)}
                      placeholder="0"
                      className="text-5xl font-bold text-center w-48 outline-none border-b-4 pb-2 transition-colors"
                      style={{
                        color: '#191919',
                        borderColor: endMileage ? '#EF4444' : '#E8ECEC'
                      }}
                    />
                    <span className="text-2xl font-semibold text-gray-500">km</span>
                  </div>

                  {trip?.start_mileage && (
                    <div className="bg-gray-50 rounded-xl p-4 inline-block">
                      <p className="text-sm text-gray-500">Kilométrage initial</p>
                      <p className="text-xl font-bold" style={{ color: '#191919' }}>{trip.start_mileage} km</p>
                      {endMileage && parseFloat(endMileage) >= trip.start_mileage && (
                        <p className="text-sm font-semibold text-green-600 mt-1">
                          Distance: {(parseFloat(endMileage) - trip.start_mileage).toFixed(1)} km
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Fuel */}
              {endStep === 'fuel' && (
                <div className="text-center space-y-6">
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
                    style={{ backgroundColor: '#FEF3C7' }}
                  >
                    <Fuel className="w-10 h-10" style={{ color: '#D97706' }} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-2" style={{ color: '#191919' }}>
                      Niveau de carburant
                    </h3>
                    <p className="text-gray-600">
                      Indiquez le niveau de carburant actuel du vehicule.
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-3">
                    <input
                      type="number"
                      value={endFuelLevel}
                      onChange={(e) => setEndFuelLevel(e.target.value)}
                      placeholder="0"
                      min="0"
                      max="100"
                      className="text-5xl font-bold text-center w-32 outline-none border-b-4 pb-2 transition-colors"
                      style={{
                        color: '#191919',
                        borderColor: endFuelLevel ? '#D97706' : '#E8ECEC'
                      }}
                    />
                    <span className="text-2xl font-semibold text-gray-500">%</span>
                  </div>

                  <div className="flex justify-center gap-2">
                    {[25, 50, 75, 100].map((level) => (
                      <button
                        key={level}
                        onClick={() => setEndFuelLevel(level.toString())}
                        className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all border-2 ${
                          endFuelLevel === level.toString()
                            ? 'shadow-md'
                            : 'hover:bg-gray-50'
                        }`}
                        style={{
                          borderColor: endFuelLevel === level.toString() ? '#D97706' : '#E8ECEC',
                          backgroundColor: endFuelLevel === level.toString() ? '#FEF3C7' : 'transparent',
                          color: endFuelLevel === level.toString() ? '#D97706' : '#6B7280',
                        }}
                      >
                        {level}%
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Notes */}
              {endStep === 'notes' && (
                <div className="text-center space-y-6">
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
                    style={{ backgroundColor: '#E0E7FF' }}
                  >
                    <FileText className="w-10 h-10 text-indigo-500" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-2" style={{ color: '#191919' }}>
                      Notes (optionnel)
                    </h3>
                    <p className="text-gray-600">
                      Ajoutez des observations ou commentaires sur le trajet.
                    </p>
                  </div>

                  <textarea
                    value={endNotes}
                    onChange={(e) => setEndNotes(e.target.value)}
                    placeholder="Ex: RAS, livraison effectuee sans probleme..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all resize-none text-left"
                  />
                </div>
              )}

              {/* Step 4: Confirm */}
              {endStep === 'confirm' && (
                <div className="text-center space-y-6">
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
                    style={{ backgroundColor: '#DCFCE7' }}
                  >
                    <CheckCircle className="w-10 h-10 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-2" style={{ color: '#191919' }}>
                      Confirmer la fin
                    </h3>
                    <p className="text-gray-600">
                      Verifiez les informations avant de terminer.
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-5 text-left space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-red-100">
                        <Gauge className="w-5 h-5 text-red-500" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Kilométrage final</p>
                        <p className="font-bold text-lg" style={{ color: '#191919' }}>{endMileage} km</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-green-100">
                        <MapPin className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Distance parcourue</p>
                        <p className="font-bold text-lg text-green-600">
                          {trip?.start_mileage ? (parseFloat(endMileage) - trip.start_mileage).toFixed(1) : '0'} km
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#FEF3C7' }}>
                        <Fuel className="w-5 h-5" style={{ color: '#D97706' }} />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Carburant final</p>
                        <p className="font-bold text-lg" style={{ color: '#191919' }}>{endFuelLevel}%</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-100">
                        <Clock className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Total pauses</p>
                        <p className="font-bold text-lg" style={{ color: '#191919' }}>{formatTotalPause(totalPauseMinutes)}</p>
                      </div>
                    </div>

                    {endNotes && (
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-indigo-100">
                          <FileText className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Notes</p>
                          <p className="font-medium text-sm" style={{ color: '#191919' }}>{endNotes}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-800 text-left">
                      Le tracking GPS sera arrete et la mission marquee comme terminee.
                    </p>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-3">
                {endStep !== 'mileage' && (
                  <button
                    onClick={prevEndStep}
                    className="flex-1 px-6 py-3 rounded-xl font-semibold transition-all"
                    style={{ backgroundColor: '#F1F5F9', color: '#64748B' }}
                  >
                    Retour
                  </button>
                )}
                <button
                  onClick={nextEndStep}
                  disabled={isEnding}
                  className={`px-6 py-3 rounded-xl font-semibold text-white transition-all hover:shadow-lg disabled:opacity-70 flex items-center justify-center gap-2 ${
                    endStep === 'mileage' ? 'flex-[2]' : 'flex-1'
                  }`}
                  style={{ backgroundColor: endStep === 'confirm' ? '#22C55E' : '#EF4444' }}
                >
                  {isEnding ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      {endStep === 'confirm' ? 'Terminer la mission' : 'Continuer'}
                      {endStep !== 'confirm' && <Square className="w-4 h-4" />}
                    </>
                  )}
                </button>
              </div>

              {/* Cancel Button */}
              <button
                onClick={() => setShowEndForm(false)}
                className="w-full text-center text-gray-500 hover:text-gray-700 text-sm font-medium"
              >
                Annuler
              </button>
            </div>
          ) : (
            /* Main View */
            <div className="space-y-6">
              {/* Mission Info */}
              <div className="bg-gray-50 rounded-xl p-5 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Mission</span>
                  <span className="font-semibold" style={{ color: '#191919' }}>
                    {mission.title}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Code</span>
                  <span className="font-semibold" style={{ color: '#6A8A82' }}>
                    {mission.mission_code}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Vehicule</span>
                  <span className="font-semibold" style={{ color: '#191919' }}>
                    {mission.vehicle_plate}
                  </span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-gray-600">Destination</span>
                  <span className="font-semibold text-right max-w-[200px]" style={{ color: '#191919' }}>
                    {mission.destination_address}
                  </span>
                </div>
              </div>

              {/* Trip Stats */}
              {trip && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <Gauge className="w-6 h-6 mx-auto mb-2" style={{ color: '#6A8A82' }} />
                    <p className="text-xs text-gray-500 uppercase">Km depart</p>
                    <p className="text-lg font-bold" style={{ color: '#191919' }}>
                      {trip.start_mileage}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <Fuel className="w-6 h-6 mx-auto mb-2" style={{ color: '#B87333' }} />
                    <p className="text-xs text-gray-500 uppercase">Carburant</p>
                    <p className="text-lg font-bold" style={{ color: '#191919' }}>
                      {trip.start_fuel_level}%
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <Clock className="w-6 h-6 mx-auto mb-2" style={{ color: '#6B7280' }} />
                    <p className="text-xs text-gray-500 uppercase">Total pauses</p>
                    <p className="text-lg font-bold" style={{ color: '#191919' }}>
                      {formatTotalPause(totalPauseMinutes)}
                    </p>
                  </div>
                </div>
              )}

              {/* Pause History */}
              {pauseHistory.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Historique des pauses</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {pauseHistory.map((pause) => (
                      <div
                        key={pause.id}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          pause.is_active ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">
                            {pause.reason === 'break' && '☕'}
                            {pause.reason === 'meal' && '🍽️'}
                            {pause.reason === 'fuel' && '⛽'}
                            {pause.reason === 'traffic' && '🚗'}
                            {pause.reason === 'other' && '📋'}
                          </span>
                          <div>
                            <p className="text-sm font-medium" style={{ color: '#191919' }}>
                              {pause.reason_display}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(pause.started_at).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`text-sm font-semibold ${
                            pause.is_active ? 'text-amber-600' : 'text-gray-600'
                          }`}
                        >
                          {pause.is_active ? 'En cours' : `${pause.duration_minutes} min`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer - Action Buttons */}
        {!showPauseForm && !showEndForm && (
          <div className="p-6 border-t border-gray-100 flex gap-3">
            {isPaused ? (
              <button
                onClick={handleResume}
                disabled={isResuming}
                className="flex-1 px-6 py-3 rounded-xl font-semibold text-white transition-all hover:shadow-lg disabled:opacity-70 flex items-center justify-center gap-2"
                style={{ backgroundColor: '#6A8A82' }}
              >
                {isResuming ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    Continuer
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handlePauseClick}
                className="flex-1 px-6 py-3 rounded-xl font-semibold text-white transition-all hover:shadow-lg flex items-center justify-center gap-2"
                style={{ backgroundColor: '#F59E0B' }}
              >
                <Pause className="w-5 h-5" />
                Pause
              </button>
            )}

            <button
              onClick={handleEndClick}
              className="flex-1 px-6 py-3 rounded-xl font-semibold text-white transition-all hover:shadow-lg flex items-center justify-center gap-2 bg-red-500"
            >
              <Square className="w-5 h-5" />
              Terminer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
