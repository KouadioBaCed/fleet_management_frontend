import { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  Calendar,
  User,
  Car,
  Check,
  AlertCircle,
  Navigation,
  Loader2,
  FileText,
  Flag,
  Phone,
  Bell,
} from 'lucide-react';
import type { Mission } from '@/types';
import { missionsApi } from '@/api/missions';

interface EditMissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Mission>) => Promise<void>;
  mission: Mission | null;
}

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Faible', color: '#6B7280', bgColor: '#E8ECEC', description: 'Pas de délai spécifique' },
  { value: 'medium', label: 'Moyenne', color: '#6A8A82', bgColor: '#E8EFED', description: 'À réaliser dans la journée' },
  { value: 'high', label: 'Haute', color: '#B87333', bgColor: '#F5E8DD', description: 'À traiter en priorité' },
  { value: 'urgent', label: 'Urgente', color: '#DC2626', bgColor: '#FEE2E2', description: 'Traitement immédiat requis' },
];

type TabType = 'info' | 'route' | 'schedule' | 'priority' | 'contact';

const TABS = [
  { id: 'info' as TabType, label: 'Informations', icon: FileText },
  { id: 'route' as TabType, label: 'Itinéraire', icon: MapPin },
  { id: 'schedule' as TabType, label: 'Planning', icon: Calendar },
  { id: 'priority' as TabType, label: 'Priorité', icon: Flag },
  { id: 'contact' as TabType, label: 'Contact', icon: Phone },
];

export default function EditMissionModal({ isOpen, onClose, onSubmit, mission }: EditMissionModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    origin_address: '',
    origin_latitude: '',
    origin_longitude: '',
    destination_address: '',
    destination_latitude: '',
    destination_longitude: '',
    estimated_distance: '',
    scheduled_start: '',
    scheduled_end: '',
    priority: 'medium',
    responsible_person_name: '',
    responsible_person_phone: '',
    notes: '',
  });

  // Précharger les données de la mission
  useEffect(() => {
    if (mission && isOpen) {
      // Format datetime for input
      const formatDateTimeLocal = (dateStr: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toISOString().slice(0, 16);
      };

      setFormData({
        title: mission.title || '',
        description: mission.description || '',
        origin_address: mission.origin_address || '',
        origin_latitude: mission.origin_latitude?.toString() || '',
        origin_longitude: mission.origin_longitude?.toString() || '',
        destination_address: mission.destination_address || '',
        destination_latitude: mission.destination_latitude?.toString() || '',
        destination_longitude: mission.destination_longitude?.toString() || '',
        estimated_distance: mission.estimated_distance?.toString() || '',
        scheduled_start: formatDateTimeLocal(mission.scheduled_start),
        scheduled_end: formatDateTimeLocal(mission.scheduled_end),
        priority: mission.priority || 'medium',
        responsible_person_name: mission.responsible_person_name || '',
        responsible_person_phone: mission.responsible_person_phone || '',
        notes: mission.notes || '',
      });
      setActiveTab('info');
      setError(null);
    }
  }, [mission, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!mission) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Build update data
      const updateData: Partial<Mission> = {
        title: formData.title,
        description: formData.description,
        origin_address: formData.origin_address,
        origin_latitude: parseFloat(formData.origin_latitude) || undefined,
        origin_longitude: parseFloat(formData.origin_longitude) || undefined,
        destination_address: formData.destination_address,
        destination_latitude: parseFloat(formData.destination_latitude) || undefined,
        destination_longitude: parseFloat(formData.destination_longitude) || undefined,
        estimated_distance: parseFloat(formData.estimated_distance) || undefined,
        scheduled_start: formData.scheduled_start,
        scheduled_end: formData.scheduled_end,
        priority: formData.priority as Mission['priority'],
        responsible_person_name: formData.responsible_person_name,
        responsible_person_phone: formData.responsible_person_phone,
        notes: formData.notes,
      };

      await onSubmit(updateData);
      handleClose();
    } catch (err: any) {
      console.error('Failed to update mission:', err);
      setError(err.response?.data?.error || 'Erreur lors de la mise à jour');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setActiveTab('info');
    setError(null);
    setIsSubmitting(false);
    onClose();
  };

  if (!isOpen || !mission) return null;

  const isAssigned = mission.status === 'assigned' || mission.status === 'in_progress';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2" style={{ borderColor: '#E8ECEC' }}>
          <div className="flex items-center space-x-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: '#E8EFED' }}
            >
              <Navigation className="w-6 h-6" style={{ color: '#6A8A82' }} />
            </div>
            <div>
              <h2 className="text-xl font-bold" style={{ color: '#191919' }}>
                Modifier la mission
              </h2>
              <p className="text-sm text-gray-500 font-mono">{mission.mission_code}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-all"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4 border-b" style={{ borderColor: '#E8ECEC' }}>
          <div className="flex space-x-1 overflow-x-auto">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-t-xl font-medium text-sm whitespace-nowrap transition-all ${
                    isActive ? 'shadow-sm' : 'hover:bg-gray-50'
                  }`}
                  style={{
                    backgroundColor: isActive ? '#E8EFED' : 'transparent',
                    color: isActive ? '#6A8A82' : '#6B7280',
                  }}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Driver Notification Info */}
          {isAssigned && (
            <div className="mb-6 flex items-start gap-3 p-4 rounded-xl" style={{ backgroundColor: '#DBEAFE' }}>
              <Bell className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#1E40AF' }} />
              <div>
                <p className="text-sm" style={{ color: '#1E3A8A' }}>
                  <strong>Information:</strong> Le conducteur {mission.driver_name} sera automatiquement notifié des modifications apportées à cette mission.
                </p>
              </div>
            </div>
          )}

          {/* Tab Content */}
          {activeTab === 'info' && (
            <div className="space-y-5">
              <div className="bg-gray-50 rounded-xl p-5 border-2" style={{ borderColor: '#E8ECEC' }}>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>
                      Titre de la mission *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="Livraison Centre Commercial"
                      required
                      className="w-full px-4 py-3 rounded-xl border-2 focus:ring-4 focus:ring-opacity-20 outline-none transition-all text-gray-900 placeholder-gray-400"
                      style={{ borderColor: '#E8ECEC' }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Décrivez la mission en détail..."
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl border-2 focus:ring-4 focus:ring-opacity-20 outline-none transition-all resize-none text-gray-900 placeholder-gray-400"
                      style={{ borderColor: '#E8ECEC' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'route' && (
            <div className="space-y-5">
              {/* Origine */}
              <div className="bg-gray-50 rounded-xl p-5 border-2" style={{ borderColor: '#E8EFED' }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#6A8A82' }}>
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="text-lg font-bold" style={{ color: '#191919' }}>Point de départ</h4>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>
                      Adresse origine *
                    </label>
                    <input
                      type="text"
                      name="origin_address"
                      value={formData.origin_address}
                      onChange={handleInputChange}
                      placeholder="Kinshasa, Gombe"
                      required
                      className="w-full px-4 py-3 rounded-xl border-2 focus:ring-4 focus:ring-opacity-20 outline-none transition-all text-gray-900 placeholder-gray-400"
                      style={{ borderColor: '#E8ECEC' }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>Latitude</label>
                      <input
                        type="number"
                        step="0.0000001"
                        name="origin_latitude"
                        value={formData.origin_latitude}
                        onChange={handleInputChange}
                        placeholder="-4.3297"
                        className="w-full px-4 py-3 rounded-xl border-2 focus:ring-4 focus:ring-opacity-20 outline-none transition-all text-gray-900 placeholder-gray-400"
                        style={{ borderColor: '#E8ECEC' }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>Longitude</label>
                      <input
                        type="number"
                        step="0.0000001"
                        name="origin_longitude"
                        value={formData.origin_longitude}
                        onChange={handleInputChange}
                        placeholder="15.3139"
                        className="w-full px-4 py-3 rounded-xl border-2 focus:ring-4 focus:ring-opacity-20 outline-none transition-all text-gray-900 placeholder-gray-400"
                        style={{ borderColor: '#E8ECEC' }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Destination */}
              <div className="bg-gray-50 rounded-xl p-5 border-2" style={{ borderColor: '#F5E8DD' }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#B87333' }}>
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="text-lg font-bold" style={{ color: '#191919' }}>Point d'arrivée</h4>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>
                      Adresse destination *
                    </label>
                    <input
                      type="text"
                      name="destination_address"
                      value={formData.destination_address}
                      onChange={handleInputChange}
                      placeholder="Kinshasa, Limete"
                      required
                      className="w-full px-4 py-3 rounded-xl border-2 focus:ring-4 focus:ring-opacity-20 outline-none transition-all text-gray-900 placeholder-gray-400"
                      style={{ borderColor: '#E8ECEC' }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>Latitude</label>
                      <input
                        type="number"
                        step="0.0000001"
                        name="destination_latitude"
                        value={formData.destination_latitude}
                        onChange={handleInputChange}
                        placeholder="-4.3894"
                        className="w-full px-4 py-3 rounded-xl border-2 focus:ring-4 focus:ring-opacity-20 outline-none transition-all text-gray-900 placeholder-gray-400"
                        style={{ borderColor: '#E8ECEC' }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>Longitude</label>
                      <input
                        type="number"
                        step="0.0000001"
                        name="destination_longitude"
                        value={formData.destination_longitude}
                        onChange={handleInputChange}
                        placeholder="15.2882"
                        className="w-full px-4 py-3 rounded-xl border-2 focus:ring-4 focus:ring-opacity-20 outline-none transition-all text-gray-900 placeholder-gray-400"
                        style={{ borderColor: '#E8ECEC' }}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>
                      Distance estimée (km)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="estimated_distance"
                      value={formData.estimated_distance}
                      onChange={handleInputChange}
                      placeholder="12.5"
                      className="w-full px-4 py-3 rounded-xl border-2 focus:ring-4 focus:ring-opacity-20 outline-none transition-all text-gray-900 placeholder-gray-400"
                      style={{ borderColor: '#E8ECEC' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'schedule' && (
            <div className="space-y-5">
              <div className="bg-gray-50 rounded-xl p-5 border-2" style={{ borderColor: '#E8EFED' }}>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>
                      Début prévu *
                    </label>
                    <input
                      type="datetime-local"
                      name="scheduled_start"
                      value={formData.scheduled_start}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 rounded-xl border-2 focus:ring-4 focus:ring-opacity-20 outline-none transition-all text-gray-900 placeholder-gray-400"
                      style={{ borderColor: '#E8ECEC' }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>
                      Fin prévue *
                    </label>
                    <input
                      type="datetime-local"
                      name="scheduled_end"
                      value={formData.scheduled_end}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 rounded-xl border-2 focus:ring-4 focus:ring-opacity-20 outline-none transition-all text-gray-900 placeholder-gray-400"
                      style={{ borderColor: '#E8ECEC' }}
                    />
                  </div>
                </div>

                <div className="mt-4 p-4 rounded-lg flex items-start space-x-3" style={{ backgroundColor: '#DBEAFE' }}>
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#1E40AF' }} />
                  <p className="text-sm" style={{ color: '#1E3A8A' }}>
                    Assurez-vous que la date de fin est postérieure à la date de début.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'priority' && (
            <div className="space-y-5">
              <div className="bg-gray-50 rounded-xl p-5 border-2" style={{ borderColor: '#E8ECEC' }}>
                <label className="block text-sm font-semibold mb-4" style={{ color: '#191919' }}>
                  Priorité de la mission
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {PRIORITY_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl cursor-pointer transition-all border-2 ${
                        formData.priority === option.value ? 'shadow-md' : 'hover:shadow-sm'
                      }`}
                      style={{
                        backgroundColor: formData.priority === option.value ? option.bgColor : 'white',
                        borderColor: formData.priority === option.value ? option.color : '#E8ECEC',
                      }}
                    >
                      <input
                        type="radio"
                        name="priority"
                        value={option.value}
                        checked={formData.priority === option.value}
                        onChange={handleInputChange}
                        className="hidden"
                      />
                      <span
                        className="font-bold text-lg"
                        style={{ color: formData.priority === option.value ? option.color : '#191919' }}
                      >
                        {option.label}
                      </span>
                      <span className="text-xs text-gray-500 text-center mt-1">{option.description}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="space-y-5">
              <div className="bg-gray-50 rounded-xl p-5 border-2" style={{ borderColor: '#E8ECEC' }}>
                <h4 className="text-sm font-bold mb-4" style={{ color: '#191919' }}>
                  Contact du responsable (optionnel)
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>
                      Nom du responsable
                    </label>
                    <input
                      type="text"
                      name="responsible_person_name"
                      value={formData.responsible_person_name}
                      onChange={handleInputChange}
                      placeholder="Jean Dupont"
                      className="w-full px-4 py-3 rounded-xl border-2 focus:ring-4 focus:ring-opacity-20 outline-none transition-all text-gray-900 placeholder-gray-400"
                      style={{ borderColor: '#E8ECEC' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      name="responsible_person_phone"
                      value={formData.responsible_person_phone}
                      onChange={handleInputChange}
                      placeholder="+243 123 456 789"
                      className="w-full px-4 py-3 rounded-xl border-2 focus:ring-4 focus:ring-opacity-20 outline-none transition-all text-gray-900 placeholder-gray-400"
                      style={{ borderColor: '#E8ECEC' }}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-5 border-2" style={{ borderColor: '#E8ECEC' }}>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>
                    Notes additionnelles
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Ajoutez des informations supplémentaires..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border-2 focus:ring-4 focus:ring-opacity-20 outline-none transition-all resize-none text-gray-900 placeholder-gray-400"
                    style={{ borderColor: '#E8ECEC' }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="px-6 pb-4">
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t-2 bg-gray-50" style={{ borderColor: '#E8ECEC' }}>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-6 py-3 rounded-xl font-semibold transition-all hover:bg-gray-200 disabled:opacity-50"
            style={{ backgroundColor: '#E8ECEC', color: '#6B7280' }}
          >
            Annuler
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50"
            style={{ backgroundColor: '#6A8A82' }}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Enregistrement...</span>
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                <span>Enregistrer les modifications</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
