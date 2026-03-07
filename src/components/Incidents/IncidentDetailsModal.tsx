import { useState } from 'react';
import { X, AlertTriangle, MapPin, Clock, User, Car, FileText, Camera, Phone, Mail, ChevronLeft, ChevronRight, ExternalLink, Navigation, CheckCircle, DollarSign, Calendar } from 'lucide-react';
import type { Incident } from '@/api/incidents';

interface IncidentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  incident: Incident | null;
  severityConfig: Record<string, { bg: string; text: string; label: string; dot: string }>;
  typeConfig: Record<string, { icon: typeof AlertTriangle; label: string; color: string }>;
  statusConfig: Record<string, { bg: string; text: string; label: string }>;
}

export default function IncidentDetailsModal({
  isOpen,
  onClose,
  incident,
  severityConfig,
  typeConfig,
  statusConfig
}: IncidentDetailsModalProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isPhotoFullscreen, setIsPhotoFullscreen] = useState(false);

  if (!isOpen || !incident) return null;

  const severity = severityConfig[incident.severity] || severityConfig.minor;
  const type = typeConfig[incident.incident_type] || typeConfig.other;
  const TypeIcon = type?.icon || AlertTriangle;
  const incidentStatus = incident.is_resolved ? 'resolved' : 'unresolved';
  const status = statusConfig[incidentStatus];

  // Collect photos
  const photos: string[] = [];
  if (incident.photo1) photos.push(incident.photo1);
  if (incident.photo2) photos.push(incident.photo2);
  if (incident.photo3) photos.push(incident.photo3);

  const hasPhotos = photos.length > 0;

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const openInMaps = () => {
    const url = `https://www.google.com/maps?q=${incident.latitude},${incident.longitude}`;
    window.open(url, '_blank');
  };

  // Format coordinates to DMS
  const formatDMS = (decimal: number, isLat: boolean) => {
    const absolute = Math.abs(decimal);
    const degrees = Math.floor(absolute);
    const minutesNotTruncated = (absolute - degrees) * 60;
    const minutes = Math.floor(minutesNotTruncated);
    const seconds = ((minutesNotTruncated - minutes) * 60).toFixed(1);
    const direction = isLat
      ? (decimal >= 0 ? 'N' : 'S')
      : (decimal >= 0 ? 'E' : 'O');
    return `${degrees}° ${minutes}' ${seconds}" ${direction}`;
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header with colored bar */}
          <div className="h-2 flex-shrink-0" style={{ backgroundColor: severity.dot }} />

          <div className="overflow-y-auto flex-1">
            <div className="p-6 lg:p-8">
              {/* Top Section */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div
                    className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: severity.bg }}
                  >
                    <TypeIcon className="w-8 h-8" style={{ color: type.color }} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold mb-1" style={{ color: '#191919' }}>{incident.title}</h2>
                    <p className="text-sm text-gray-600">INC-{incident.id} • {incident.incident_type_display}</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-all flex-shrink-0"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Type & Severity Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Type Card */}
                <div
                  className="p-5 rounded-xl border-2"
                  style={{ borderColor: type.color, backgroundColor: `${type.color}10` }}
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: 'white' }}
                    >
                      <TypeIcon className="w-6 h-6" style={{ color: type.color }} />
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide" style={{ color: type.color }}>
                        Type d'incident
                      </p>
                      <p className="text-xl font-bold" style={{ color: '#191919' }}>
                        {incident.incident_type_display}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Severity Card */}
                <div
                  className="p-5 rounded-xl border-2"
                  style={{ borderColor: severity.dot, backgroundColor: severity.bg }}
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: 'white' }}
                    >
                      <AlertTriangle className="w-6 h-6" style={{ color: severity.dot }} />
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide" style={{ color: severity.text }}>
                        Gravité
                      </p>
                      <p className="text-xl font-bold" style={{ color: '#191919' }}>
                        {severity.label}
                      </p>
                    </div>
                  </div>
                  {/* Severity indicator bar */}
                  <div className="flex space-x-1 mt-2">
                    {['minor', 'moderate', 'major', 'critical'].map((level, index) => (
                      <div
                        key={level}
                        className="h-2 flex-1 rounded-full transition-all"
                        style={{
                          backgroundColor: index <= ['minor', 'moderate', 'major', 'critical'].indexOf(incident.severity)
                            ? severity.dot
                            : '#E8ECEC'
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center space-x-2 mb-6">
                <span
                  className="px-4 py-2 rounded-full text-sm font-semibold"
                  style={{ backgroundColor: status.bg, color: status.text }}
                >
                  {status.label}
                </span>
                <span className="text-sm text-gray-500">
                  Signalé le {new Date(incident.reported_at).toLocaleString('fr-FR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>

              {/* Description Section */}
              <div className="mb-6">
                <div className="flex items-center space-x-2 mb-3">
                  <FileText className="w-5 h-5" style={{ color: '#6A8A82' }} />
                  <h3 className="text-lg font-bold" style={{ color: '#191919' }}>Description</h3>
                </div>
                <div
                  className="p-5 rounded-xl border-2"
                  style={{ backgroundColor: '#F8FAF9', borderColor: '#E8EFED' }}
                >
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {incident.description}
                  </p>
                </div>
              </div>

              {/* Photos Section */}
              <div className="mb-6">
                <div className="flex items-center space-x-2 mb-3">
                  <Camera className="w-5 h-5" style={{ color: '#7C3AED' }} />
                  <h3 className="text-lg font-bold" style={{ color: '#191919' }}>
                    Photos attachées
                    {hasPhotos && (
                      <span className="ml-2 text-sm font-normal text-gray-500">
                        ({photos.length} photo{photos.length > 1 ? 's' : ''})
                      </span>
                    )}
                  </h3>
                </div>

                {hasPhotos ? (
                  <div className="space-y-4">
                    {/* Main Photo Display */}
                    <div
                      className="relative rounded-xl overflow-hidden border-2 cursor-pointer group"
                      style={{ borderColor: '#E8ECEC' }}
                      onClick={() => setIsPhotoFullscreen(true)}
                    >
                      <img
                        src={photos[currentPhotoIndex]}
                        alt={`Photo ${currentPhotoIndex + 1}`}
                        className="w-full h-80 object-cover transition-transform group-hover:scale-105"
                      />

                      {/* Overlay on hover */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                        <span className="opacity-0 group-hover:opacity-100 text-white font-semibold bg-black/50 px-4 py-2 rounded-lg transition-all">
                          Cliquer pour agrandir
                        </span>
                      </div>

                      {/* Navigation Arrows */}
                      {photos.length > 1 && (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); prevPhoto(); }}
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-lg transition-all"
                          >
                            <ChevronLeft className="w-6 h-6 text-gray-700" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); nextPhoto(); }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-lg transition-all"
                          >
                            <ChevronRight className="w-6 h-6 text-gray-700" />
                          </button>
                        </>
                      )}

                      {/* Photo Counter */}
                      <div className="absolute bottom-3 right-3 px-3 py-1.5 bg-black/60 text-white text-sm font-medium rounded-full">
                        {currentPhotoIndex + 1} / {photos.length}
                      </div>
                    </div>

                    {/* Thumbnail Strip */}
                    {photos.length > 1 && (
                      <div className="flex space-x-3">
                        {photos.map((photo, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentPhotoIndex(index)}
                            className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                              index === currentPhotoIndex ? 'ring-2 ring-offset-2' : 'opacity-70 hover:opacity-100'
                            }`}
                            style={{
                              borderColor: index === currentPhotoIndex ? '#7C3AED' : '#E8ECEC',
                              ringColor: '#7C3AED'
                            }}
                          >
                            <img
                              src={photo}
                              alt={`Thumbnail ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    className="p-8 rounded-xl border-2 border-dashed text-center"
                    style={{ borderColor: '#E8ECEC', backgroundColor: '#F8FAF9' }}
                  >
                    <Camera className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500 font-medium">Aucune photo attachée</p>
                    <p className="text-sm text-gray-400 mt-1">Cet incident n'a pas de photos associées</p>
                  </div>
                )}
              </div>

              {/* Location Section */}
              <div className="mb-6">
                <div className="flex items-center space-x-2 mb-3">
                  <MapPin className="w-5 h-5" style={{ color: '#6A8A82' }} />
                  <h3 className="text-lg font-bold" style={{ color: '#191919' }}>Localisation</h3>
                </div>

                <div
                  className="rounded-xl border-2 overflow-hidden"
                  style={{ borderColor: '#E8EFED' }}
                >
                  {/* Map Preview */}
                  <div className="relative h-48 bg-gray-100">
                    <iframe
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(incident.longitude) - 0.01},${parseFloat(incident.latitude) - 0.01},${parseFloat(incident.longitude) + 0.01},${parseFloat(incident.latitude) + 0.01}&layer=mapnik&marker=${incident.latitude},${incident.longitude}`}
                      className="w-full h-full border-0"
                      title="Localisation de l'incident"
                    />

                    {/* Open in Maps button */}
                    <button
                      onClick={openInMaps}
                      className="absolute top-3 right-3 px-3 py-2 bg-white rounded-lg shadow-lg flex items-center space-x-2 hover:bg-gray-50 transition-all text-sm font-medium"
                      style={{ color: '#6A8A82' }}
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Ouvrir dans Maps</span>
                    </button>
                  </div>

                  {/* Location Details */}
                  <div className="p-4 bg-white">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Address */}
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Adresse</p>
                        <p className="font-semibold text-gray-900">
                          {incident.address || 'Adresse non spécifiée'}
                        </p>
                      </div>

                      {/* Coordinates */}
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Coordonnées GPS</p>
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-1">
                            <Navigation className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-mono text-gray-700">
                              {formatDMS(parseFloat(incident.latitude), true)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Navigation className="w-4 h-4 text-gray-400 rotate-90" />
                            <span className="text-sm font-mono text-gray-700">
                              {formatDMS(parseFloat(incident.longitude), false)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Driver Section */}
              <div className="mb-6">
                <div className="flex items-center space-x-2 mb-3">
                  <User className="w-5 h-5" style={{ color: '#6A8A82' }} />
                  <h3 className="text-lg font-bold" style={{ color: '#191919' }}>Conducteur concerné</h3>
                </div>

                <div
                  className="p-5 rounded-xl border-2"
                  style={{ borderColor: '#E8EFED', backgroundColor: '#F8FAF9' }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Driver Avatar */}
                      <div
                        className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold text-white"
                        style={{ backgroundColor: '#6A8A82' }}
                      >
                        {incident.driver_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'N/A'}
                      </div>

                      <div>
                        <p className="text-xl font-bold" style={{ color: '#191919' }}>
                          {incident.driver_name || 'Non assigné'}
                        </p>
                        <p className="text-sm text-gray-600">Chauffeur</p>
                      </div>
                    </div>

                    {/* Vehicle Info */}
                    <div
                      className="flex items-center space-x-3 px-4 py-3 rounded-xl"
                      style={{ backgroundColor: '#F5E8DD' }}
                    >
                      <Car className="w-6 h-6" style={{ color: '#B87333' }} />
                      <div>
                        <p className="text-xs font-medium text-gray-600">Véhicule</p>
                        <p className="font-bold" style={{ color: '#B87333' }}>
                          {incident.vehicle_plate || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Resolution Section (if resolved) */}
              {incident.is_resolved && (
                <div className="mb-6">
                  <div className="flex items-center space-x-2 mb-3">
                    <CheckCircle className="w-5 h-5" style={{ color: '#6A8A82' }} />
                    <h3 className="text-lg font-bold" style={{ color: '#191919' }}>Résolution</h3>
                  </div>

                  <div
                    className="p-5 rounded-xl border-2"
                    style={{ borderColor: '#6A8A82', backgroundColor: '#E8EFED' }}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      {/* Resolved Date */}
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: 'white' }}
                        >
                          <Calendar className="w-5 h-5" style={{ color: '#6A8A82' }} />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-600">Résolu le</p>
                          <p className="font-bold text-sm" style={{ color: '#191919' }}>
                            {incident.resolved_at
                              ? new Date(incident.resolved_at).toLocaleString('fr-FR', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric'
                                })
                              : 'N/A'
                            }
                          </p>
                        </div>
                      </div>

                      {/* Resolved By */}
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: 'white' }}
                        >
                          <User className="w-5 h-5" style={{ color: '#6A8A82' }} />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-600">Résolu par</p>
                          <p className="font-bold text-sm" style={{ color: '#191919' }}>
                            {incident.resolved_by_name || 'N/A'}
                          </p>
                        </div>
                      </div>

                      {/* Cost */}
                      {incident.estimated_cost && (
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: 'white' }}
                          >
                            <DollarSign className="w-5 h-5" style={{ color: '#B87333' }} />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-600">Coût estimé</p>
                            <p className="font-bold text-sm" style={{ color: '#B87333' }}>
                              ${incident.estimated_cost}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Resolution Notes */}
                    {incident.resolution_notes && (
                      <div
                        className="p-4 rounded-lg"
                        style={{ backgroundColor: 'white' }}
                      >
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                          Notes de résolution
                        </p>
                        <p className="text-gray-700">{incident.resolution_notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t-2" style={{ borderColor: '#E8ECEC' }}>
                <button
                  onClick={onClose}
                  className="px-6 py-3 rounded-xl font-semibold transition-all hover:shadow-md"
                  style={{ backgroundColor: '#6A8A82', color: 'white' }}
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Photo Modal */}
      {isPhotoFullscreen && hasPhotos && (
        <div
          className="fixed inset-0 bg-black/95 z-[60] flex items-center justify-center"
          onClick={() => setIsPhotoFullscreen(false)}
        >
          <button
            onClick={() => setIsPhotoFullscreen(false)}
            className="absolute top-4 right-4 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          <img
            src={photos[currentPhotoIndex]}
            alt={`Photo ${currentPhotoIndex + 1}`}
            className="max-w-[90vw] max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {photos.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prevPhoto(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
              >
                <ChevronLeft className="w-8 h-8 text-white" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); nextPhoto(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
              >
                <ChevronRight className="w-8 h-8 text-white" />
              </button>
            </>
          )}

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/60 text-white font-medium rounded-full">
            {currentPhotoIndex + 1} / {photos.length}
          </div>
        </div>
      )}
    </>
  );
}
