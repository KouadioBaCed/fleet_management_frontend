import { X, Navigation, MapPin, Calendar, User, Car, Clock, Package, FileText, Phone, Mail, Building } from 'lucide-react';
import type { Mission } from '@/types';

interface MissionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  mission: Mission | null;
  statusConfig: any;
  priorityConfig: any;
}

export default function MissionDetailsModal({ isOpen, onClose, mission, statusConfig, priorityConfig }: MissionDetailsModalProps) {
  if (!isOpen || !mission) return null;

  const status = statusConfig[mission.status];
  const priority = priorityConfig[mission.priority];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header with gradient background */}
        <div className="h-48 relative overflow-hidden" style={{ backgroundColor: status?.bg || '#E8ECEC' }}>
          <div className="absolute inset-0 flex items-center justify-center">
            <Navigation className="w-32 h-32 opacity-20" style={{ color: status?.dot || '#6B7280' }} />
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 rounded-xl flex items-center justify-center bg-white/90 hover:bg-white transition-all shadow-lg"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
          <div className="absolute bottom-6 left-6">
            <h2 className="text-3xl font-bold text-white mb-2" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
              {mission.title}
            </h2>
            <p className="text-white/90 text-lg font-medium" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
              {mission.mission_code}
            </p>
          </div>
          <div className="absolute top-4 left-4 flex gap-2">
            <div
              className="px-4 py-2 rounded-full text-sm font-semibold flex items-center space-x-2 shadow-lg"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', color: status?.text || '#6B7280' }}
            >
              <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: status?.dot || '#6B7280' }} />
              <span>{status?.label || mission.status}</span>
            </div>
            <div
              className="px-4 py-2 rounded-full text-sm font-semibold shadow-lg"
              style={{ backgroundColor: priority?.bg || '#E8ECEC', color: priority?.text || '#6B7280' }}
            >
              {priority?.label || mission.priority}
            </div>
          </div>
        </div>

        {/* Details Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-8">
          {/* Itinéraire */}
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: '#191919' }}>
              <MapPin className="w-6 h-6" style={{ color: '#6A8A82' }} />
              Itinéraire
            </h3>
            <div className="bg-gradient-to-br from-sage/5 to-transparent rounded-xl p-6 border-2" style={{ borderColor: '#E8EFED' }}>
              <div className="flex items-start space-x-4 mb-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm" style={{ backgroundColor: '#6A8A82' }}>
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">Point de départ (Origine)</p>
                  <p className="text-lg font-bold" style={{ color: '#191919' }}>{mission.origin_address}</p>
                  {mission.origin_latitude && mission.origin_longitude && (
                    <p className="text-xs text-gray-500 mt-1">
                      GPS: {Number(mission.origin_latitude).toFixed(6)}, {Number(mission.origin_longitude).toFixed(6)}
                    </p>
                  )}
                </div>
              </div>
              <div className="h-8 border-l-2 border-dashed ml-5" style={{ borderColor: '#6A8A82' }} />
              <div className="flex items-start space-x-4 mb-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm" style={{ backgroundColor: '#B87333' }}>
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">Point d'arrivée (Destination)</p>
                  <p className="text-lg font-bold" style={{ color: '#191919' }}>{mission.destination_address}</p>
                  {mission.destination_latitude && mission.destination_longitude && (
                    <p className="text-xs text-gray-500 mt-1">
                      GPS: {Number(mission.destination_latitude).toFixed(6)}, {Number(mission.destination_longitude).toFixed(6)}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg mt-4" style={{ backgroundColor: '#F0F3F2' }}>
                <Navigation className="w-5 h-5" style={{ color: '#B87333' }} />
                <span className="text-sm font-medium text-gray-600">Distance estimée:</span>
                <span className="text-sm font-bold" style={{ color: '#191919' }}>{mission.estimated_distance} km</span>
              </div>
            </div>
          </div>

          {/* Horaires Prévus */}
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: '#191919' }}>
              <Clock className="w-6 h-6" style={{ color: '#6A8A82' }} />
              Horaires Prévus
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Début prévu */}
              <div className="bg-gradient-to-br from-sage/5 to-transparent rounded-xl p-5 border-2" style={{ borderColor: '#E8EFED' }}>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center shadow-sm" style={{ backgroundColor: '#6A8A82' }}>
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Début prévu</p>
                    <p className="text-base font-bold" style={{ color: '#191919' }}>
                      {new Date(mission.scheduled_start).toLocaleString('fr-FR', {
                        weekday: 'long',
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                    <p className="text-lg font-bold" style={{ color: '#6A8A82' }}>
                      {new Date(mission.scheduled_start).toLocaleString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Fin prévue */}
              <div className="bg-gradient-to-br from-copper/5 to-transparent rounded-xl p-5 border-2" style={{ borderColor: '#F5E8DD' }}>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center shadow-sm" style={{ backgroundColor: '#B87333' }}>
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Fin prévue</p>
                    <p className="text-base font-bold" style={{ color: '#191919' }}>
                      {new Date(mission.scheduled_end).toLocaleString('fr-FR', {
                        weekday: 'long',
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                    <p className="text-lg font-bold" style={{ color: '#B87333' }}>
                      {new Date(mission.scheduled_end).toLocaleString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Assignation */}
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: '#191919' }}>
              <User className="w-6 h-6" style={{ color: '#6A8A82' }} />
              Assignation
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Chauffeur */}
              <div className="bg-gradient-to-br from-sage/5 to-transparent rounded-xl p-5 border-2" style={{ borderColor: '#E8EFED' }}>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center shadow-sm" style={{ backgroundColor: '#6A8A82' }}>
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Chauffeur assigné</p>
                    <p className="text-lg font-bold" style={{ color: '#191919' }}>{mission.driver_name}</p>
                  </div>
                </div>
              </div>

              {/* Véhicule */}
              <div className="bg-gradient-to-br from-copper/5 to-transparent rounded-xl p-5 border-2" style={{ borderColor: '#F5E8DD' }}>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center shadow-sm" style={{ backgroundColor: '#B87333' }}>
                    <Car className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Véhicule assigné</p>
                    <p className="text-lg font-bold" style={{ color: '#191919' }}>{mission.vehicle_plate}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Informations Livraison */}
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: '#191919' }}>
              <Package className="w-6 h-6" style={{ color: '#6A8A82' }} />
              Informations de Livraison
            </h3>
            <div className="bg-gradient-to-br from-sage/5 to-transparent rounded-xl p-6 border-2" style={{ borderColor: '#E8EFED' }}>
              {/* Description de la mission */}
              {mission.description && (
                <div className="mb-6">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#6A8A82' }}>
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Description</p>
                      <p className="text-sm" style={{ color: '#191919' }}>{mission.description}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Infos complémentaires en grille */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Type de mission */}
                <div className="flex items-center space-x-3 p-3 rounded-lg" style={{ backgroundColor: '#F0F3F2' }}>
                  <Package className="w-5 h-5" style={{ color: '#6A8A82' }} />
                  <div>
                    <p className="text-xs text-gray-600">Type de mission</p>
                    <p className="text-sm font-semibold" style={{ color: '#191919' }}>
                      {mission.status === 'in_progress' ? 'En cours de livraison' :
                       mission.status === 'completed' ? 'Livrée' :
                       mission.status === 'pending' ? 'En attente' :
                       mission.status === 'assigned' ? 'Assignée' : 'Livraison standard'}
                    </p>
                  </div>
                </div>

                {/* Priorité détaillée */}
                <div className="flex items-center space-x-3 p-3 rounded-lg" style={{ backgroundColor: '#F0F3F2' }}>
                  <div
                    className="w-5 h-5 rounded-full"
                    style={{ backgroundColor: priority?.dot || '#6B7280' }}
                  />
                  <div>
                    <p className="text-xs text-gray-600">Niveau de priorité</p>
                    <p className="text-sm font-semibold" style={{ color: priority?.text || '#191919' }}>
                      {priority?.label || mission.priority}
                    </p>
                  </div>
                </div>
              </div>

              {/* Notes additionnelles */}
              {mission.notes && (
                <div className="mt-4 p-4 rounded-lg border-2 border-dashed" style={{ borderColor: '#E8ECEC' }}>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Notes additionnelles</p>
                  <p className="text-sm text-gray-600">{mission.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Contact Responsable */}
          {(mission.responsible_person_name || mission.responsible_person_phone) && (
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: '#191919' }}>
                <Phone className="w-6 h-6" style={{ color: '#6A8A82' }} />
                Contact Responsable
              </h3>
              <div className="bg-gradient-to-br from-sage/5 to-transparent rounded-xl p-6 border-2" style={{ borderColor: '#E8EFED' }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mission.responsible_person_name && (
                    <div className="flex items-center space-x-3 p-3 rounded-lg" style={{ backgroundColor: '#F0F3F2' }}>
                      <User className="w-5 h-5" style={{ color: '#6A8A82' }} />
                      <div>
                        <p className="text-xs text-gray-600">Nom du responsable</p>
                        <p className="text-sm font-semibold" style={{ color: '#191919' }}>{mission.responsible_person_name}</p>
                      </div>
                    </div>
                  )}
                  {mission.responsible_person_phone && (
                    <div className="flex items-center space-x-3 p-3 rounded-lg" style={{ backgroundColor: '#F0F3F2' }}>
                      <Phone className="w-5 h-5" style={{ color: '#B87333' }} />
                      <div>
                        <p className="text-xs text-gray-600">Téléphone</p>
                        <p className="text-sm font-semibold" style={{ color: '#191919' }}>{mission.responsible_person_phone}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Résumé rapide */}
          <div className="bg-gradient-to-r from-sage/10 to-copper/10 rounded-xl p-6 border-2" style={{ borderColor: '#E8EFED' }}>
            <h4 className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-4">Résumé de la mission</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold" style={{ color: '#6A8A82' }}>{mission.estimated_distance}</p>
                <p className="text-xs text-gray-600">km à parcourir</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold" style={{ color: '#B87333' }}>
                  {Math.round((new Date(mission.scheduled_end).getTime() - new Date(mission.scheduled_start).getTime()) / (1000 * 60))}
                </p>
                <p className="text-xs text-gray-600">minutes prévues</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold" style={{ color: '#6A8A82' }}>1</p>
                <p className="text-xs text-gray-600">point de livraison</p>
              </div>
              <div className="text-center">
                <div
                  className="w-8 h-8 rounded-full mx-auto mb-1 flex items-center justify-center"
                  style={{ backgroundColor: status?.bg || '#E8ECEC' }}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: status?.dot || '#6B7280' }}
                  />
                </div>
                <p className="text-xs text-gray-600">{status?.label || mission.status}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t-2 bg-gray-50 flex justify-between items-center" style={{ borderColor: '#E8ECEC' }}>
          <div className="text-sm text-gray-500">
            <p>Code: <span className="font-semibold">{mission.mission_code}</span></p>
            {mission.created_at && (
              <p className="text-xs mt-1">
                Créée le {new Date(mission.created_at).toLocaleString('fr-FR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl font-semibold transition-all hover:shadow-md"
            style={{ backgroundColor: '#6A8A82', color: '#ffffff' }}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
