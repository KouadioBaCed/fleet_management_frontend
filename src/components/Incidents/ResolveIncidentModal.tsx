import { useState, useEffect } from 'react';
import { X, CheckCircle, DollarSign, FileText, AlertTriangle, Loader2, Clock, Calendar, Wrench, Users, Package, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { useCurrency } from '@/store/settingsStore';
import { getCurrencySymbol } from '@/api/settings';
import type { Incident } from '@/api/incidents';

interface ResolveIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { resolution_notes: string; estimated_cost?: number }) => Promise<void>;
  incident: Incident | null;
}

interface CostBreakdown {
  parts: string;
  labor: string;
  other: string;
}

const NOTE_TEMPLATES = [
  { label: 'Réparation effectuée', text: 'Réparation effectuée sur place. Le véhicule est de nouveau opérationnel.' },
  { label: 'Pièce remplacée', text: 'La pièce défectueuse a été remplacée. Tests effectués avec succès.' },
  { label: 'Remorquage', text: 'Le véhicule a été remorqué vers le garage pour réparation.' },
  { label: 'Fausse alerte', text: 'Après vérification, il s\'agit d\'une fausse alerte. Aucune intervention nécessaire.' },
];

export default function ResolveIncidentModal({ isOpen, onClose, onConfirm, incident }: ResolveIncidentModalProps) {
  const currency = useCurrency();
  const currencySymbol = getCurrencySymbol(currency);

  const [resolutionNotes, setResolutionNotes] = useState('');
  const [showCostBreakdown, setShowCostBreakdown] = useState(false);
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdown>({ parts: '', labor: '', other: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showTemplates, setShowTemplates] = useState(false);
  const [errors, setErrors] = useState<{ notes?: string }>({});

  // Update current time every second
  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setResolutionNotes('');
      setCostBreakdown({ parts: '', labor: '', other: '' });
      setShowCostBreakdown(false);
      setErrors({});
    }
  }, [isOpen]);

  if (!isOpen || !incident) return null;

  // Calculate total cost
  const totalCost = (
    (parseFloat(costBreakdown.parts) || 0) +
    (parseFloat(costBreakdown.labor) || 0) +
    (parseFloat(costBreakdown.other) || 0)
  );

  const handleSubmit = async () => {
    // Validation
    if (!resolutionNotes.trim()) {
      setErrors({ notes: 'Les notes de résolution sont requises' });
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      await onConfirm({
        resolution_notes: resolutionNotes,
        estimated_cost: totalCost > 0 ? totalCost : undefined,
      });
      setResolutionNotes('');
      setCostBreakdown({ parts: '', labor: '', other: '' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const applyTemplate = (text: string) => {
    setResolutionNotes(text);
    setShowTemplates(false);
    setErrors({});
  };

  const severityConfig: Record<string, { bg: string; text: string; label: string; dot: string }> = {
    minor: { bg: '#E8EFED', text: '#6A8A82', label: 'Mineur', dot: '#6A8A82' },
    moderate: { bg: '#E8ECEC', text: '#6B7280', label: 'Modéré', dot: '#6B7280' },
    major: { bg: '#F5E8DD', text: '#B87333', label: 'Majeur', dot: '#B87333' },
    critical: { bg: '#E8ECEC', text: '#191919', label: 'Critique', dot: '#191919' },
  };

  const severity = severityConfig[incident.severity] || severityConfig.minor;

  // Calculate time since incident
  const incidentDate = new Date(incident.reported_at);
  const timeDiff = currentTime.getTime() - incidentDate.getTime();
  const hoursDiff = Math.floor(timeDiff / (1000 * 60 * 60));
  const daysDiff = Math.floor(hoursDiff / 24);

  const getTimeSinceIncident = () => {
    if (daysDiff > 0) {
      return `${daysDiff} jour${daysDiff > 1 ? 's' : ''} ${hoursDiff % 24}h`;
    }
    const minutes = Math.floor((timeDiff / (1000 * 60)) % 60);
    return `${hoursDiff}h ${minutes}min`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b-2 flex items-center justify-between flex-shrink-0" style={{ borderColor: '#E8ECEC' }}>
          <div className="flex items-center space-x-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: '#E8EFED' }}
            >
              <CheckCircle className="w-6 h-6" style={{ color: '#6A8A82' }} />
            </div>
            <div>
              <h2 className="text-xl font-bold" style={{ color: '#191919' }}>
                Résoudre l'incident
              </h2>
              <p className="text-sm text-gray-500">Complétez les informations de résolution</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Incident Summary */}
          <div
            className="p-4 rounded-xl border-2"
            style={{ backgroundColor: '#F8FAF9', borderColor: severity.dot }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: severity.bg }}
                >
                  <AlertTriangle className="w-6 h-6" style={{ color: severity.text }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900">{incident.title}</h3>
                  <p className="text-sm text-gray-600 mt-0.5">
                    INC-{incident.id} • {incident.incident_type_display}
                  </p>
                  <div className="flex items-center flex-wrap gap-2 mt-2">
                    <span
                      className="px-2.5 py-1 rounded-full text-xs font-semibold"
                      style={{ backgroundColor: severity.bg, color: severity.text }}
                    >
                      {severity.label}
                    </span>
                    <span className="text-xs text-gray-500">
                      {incident.vehicle_plate} • {incident.driver_name}
                    </span>
                  </div>
                </div>
              </div>

              {/* Time since incident */}
              <div
                className="px-3 py-2 rounded-lg text-center flex-shrink-0 ml-3"
                style={{ backgroundColor: '#FEF3C7' }}
              >
                <p className="text-xs font-medium text-amber-700">Ouvert depuis</p>
                <p className="text-lg font-bold text-amber-800">{getTimeSinceIncident()}</p>
              </div>
            </div>
          </div>

          {/* Resolution Timestamp Preview */}
          <div
            className="p-4 rounded-xl border-2 flex items-center justify-between"
            style={{ backgroundColor: '#E8EFED', borderColor: '#6A8A82' }}
          >
            <div className="flex items-center space-x-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: 'white' }}
              >
                <Clock className="w-5 h-5" style={{ color: '#6A8A82' }} />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide" style={{ color: '#6A8A82' }}>
                  Horodatage de résolution
                </p>
                <p className="font-bold text-gray-900">
                  {currentTime.toLocaleString('fr-FR', {
                    weekday: 'long',
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  })}
                </p>
              </div>
            </div>
            <div
              className="px-3 py-1.5 rounded-full text-xs font-semibold animate-pulse"
              style={{ backgroundColor: '#6A8A82', color: 'white' }}
            >
              En direct
            </div>
          </div>

          {/* Resolution Notes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                <FileText className="w-4 h-4" style={{ color: '#6A8A82' }} />
                <span>Notes de résolution</span>
                <span className="text-red-500">*</span>
              </label>
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1"
                style={{ backgroundColor: '#E8EFED', color: '#6A8A82' }}
              >
                <Info className="w-3 h-3" />
                <span>Modèles</span>
                {showTemplates ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>

            {/* Templates dropdown */}
            {showTemplates && (
              <div
                className="mb-3 p-3 rounded-xl border-2 space-y-2"
                style={{ backgroundColor: '#F8FAF9', borderColor: '#E8ECEC' }}
              >
                <p className="text-xs font-medium text-gray-500 mb-2">Cliquez pour appliquer un modèle :</p>
                {NOTE_TEMPLATES.map((template, index) => (
                  <button
                    key={index}
                    onClick={() => applyTemplate(template.text)}
                    className="w-full text-left p-3 rounded-lg border-2 hover:border-sage transition-all text-sm"
                    style={{ borderColor: '#E8ECEC' }}
                  >
                    <p className="font-semibold text-gray-900">{template.label}</p>
                    <p className="text-gray-500 text-xs mt-0.5 truncate">{template.text}</p>
                  </button>
                ))}
              </div>
            )}

            <textarea
              value={resolutionNotes}
              onChange={(e) => {
                setResolutionNotes(e.target.value);
                if (errors.notes) setErrors({});
              }}
              placeholder="Décrivez en détail comment l'incident a été résolu, les actions prises, et toute information pertinente pour le suivi..."
              rows={5}
              className={`w-full px-4 py-3 rounded-xl border-2 focus:ring-4 focus:ring-sage/10 outline-none transition-all resize-none text-sm text-gray-900 placeholder-gray-400 ${
                errors.notes ? 'border-red-400' : ''
              }`}
              style={{ borderColor: errors.notes ? '#f87171' : '#E8ECEC' }}
              onFocus={(e) => {
                if (!errors.notes) e.target.style.borderColor = '#6A8A82';
              }}
              onBlur={(e) => {
                if (!errors.notes) e.target.style.borderColor = '#E8ECEC';
              }}
            />
            {errors.notes && (
              <p className="text-red-500 text-xs mt-1 flex items-center space-x-1">
                <AlertTriangle className="w-3 h-3" />
                <span>{errors.notes}</span>
              </p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              {resolutionNotes.length} caractères
            </p>
          </div>

          {/* Cost Estimation */}
          <div>
            <button
              onClick={() => setShowCostBreakdown(!showCostBreakdown)}
              className="w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all hover:shadow-md"
              style={{
                borderColor: showCostBreakdown ? '#B87333' : '#E8ECEC',
                backgroundColor: showCostBreakdown ? '#FDF8F4' : 'white'
              }}
            >
              <div className="flex items-center space-x-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: '#F5E8DD' }}
                >
                  <DollarSign className="w-5 h-5" style={{ color: '#B87333' }} />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">Estimation des coûts</p>
                  <p className="text-xs text-gray-500">Optionnel - Détaillez les frais associés</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {totalCost > 0 && (
                  <span
                    className="px-3 py-1.5 rounded-full text-sm font-bold"
                    style={{ backgroundColor: '#F5E8DD', color: '#B87333' }}
                  >
                    ${totalCost.toFixed(2)}
                  </span>
                )}
                {showCostBreakdown ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </button>

            {/* Cost Breakdown */}
            {showCostBreakdown && (
              <div
                className="mt-3 p-4 rounded-xl border-2 space-y-4"
                style={{ borderColor: '#F5E8DD', backgroundColor: '#FFFCFA' }}
              >
                {/* Parts Cost */}
                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                    <Package className="w-4 h-4" style={{ color: '#B87333' }} />
                    <span>Pièces détachées</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={costBreakdown.parts}
                      onChange={(e) => setCostBreakdown({ ...costBreakdown, parts: e.target.value })}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border-2 focus:ring-4 focus:ring-copper/10 outline-none transition-all text-sm text-gray-900 placeholder-gray-400"
                      style={{ borderColor: '#E8ECEC' }}
                      onFocus={(e) => e.target.style.borderColor = '#B87333'}
                      onBlur={(e) => e.target.style.borderColor = '#E8ECEC'}
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{currencySymbol}</span>
                  </div>
                </div>

                {/* Labor Cost */}
                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                    <Wrench className="w-4 h-4" style={{ color: '#B87333' }} />
                    <span>Main d'œuvre</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={costBreakdown.labor}
                      onChange={(e) => setCostBreakdown({ ...costBreakdown, labor: e.target.value })}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border-2 focus:ring-4 focus:ring-copper/10 outline-none transition-all text-sm text-gray-900 placeholder-gray-400"
                      style={{ borderColor: '#E8ECEC' }}
                      onFocus={(e) => e.target.style.borderColor = '#B87333'}
                      onBlur={(e) => e.target.style.borderColor = '#E8ECEC'}
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{currencySymbol}</span>
                  </div>
                </div>

                {/* Other Costs */}
                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                    <Users className="w-4 h-4" style={{ color: '#B87333' }} />
                    <span>Autres frais (remorquage, etc.)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={costBreakdown.other}
                      onChange={(e) => setCostBreakdown({ ...costBreakdown, other: e.target.value })}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border-2 focus:ring-4 focus:ring-copper/10 outline-none transition-all text-sm text-gray-900 placeholder-gray-400"
                      style={{ borderColor: '#E8ECEC' }}
                      onFocus={(e) => e.target.style.borderColor = '#B87333'}
                      onBlur={(e) => e.target.style.borderColor = '#E8ECEC'}
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{currencySymbol}</span>
                  </div>
                </div>

                {/* Total */}
                <div
                  className="pt-4 border-t-2 flex items-center justify-between"
                  style={{ borderColor: '#F5E8DD' }}
                >
                  <span className="font-semibold text-gray-700">Coût total estimé</span>
                  <span
                    className="text-2xl font-bold"
                    style={{ color: '#B87333' }}
                  >
                    ${totalCost.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Confirmation Info */}
          <div
            className="p-4 rounded-xl border-2 border-dashed"
            style={{ borderColor: '#6A8A82', backgroundColor: '#F0F7F5' }}
          >
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#6A8A82' }} />
              <div className="text-sm">
                <p className="font-semibold" style={{ color: '#6A8A82' }}>
                  En marquant cet incident comme résolu :
                </p>
                <ul className="mt-2 space-y-1 text-gray-600">
                  <li>• L'incident sera fermé avec l'horodatage actuel</li>
                  <li>• Votre nom sera enregistré comme responsable de la résolution</li>
                  <li>• Les notes et coûts seront archivés dans l'historique</li>
                  <li>• L'incident pourra être rouvert ultérieurement si nécessaire</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4 border-t-2 flex items-center justify-between flex-shrink-0"
          style={{ borderColor: '#E8ECEC', backgroundColor: '#F8FAF9' }}
        >
          <div className="text-sm text-gray-500">
            <Calendar className="w-4 h-4 inline mr-1" />
            {currentTime.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
            {' '}
            <Clock className="w-4 h-4 inline mx-1" />
            {currentTime.toLocaleTimeString('fr-FR')}
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl font-semibold transition-all hover:bg-gray-200"
              style={{ backgroundColor: '#E8ECEC', color: '#6B7280' }}
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !resolutionNotes.trim()}
              className="px-6 py-2.5 rounded-xl font-semibold text-white transition-all hover:shadow-lg flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#6A8A82' }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Résolution en cours...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>Marquer comme résolu</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
