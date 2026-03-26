import { useState, useEffect, useRef } from 'react';
import {
  FileText, Plus, Trash2, Edit, Calendar, Shield, Eye, Upload,
  Loader2, RefreshCw, AlertTriangle, CheckCircle, Clock, X, Download
} from 'lucide-react';
import type { VehicleDocument, VehicleDocumentType } from '@/types';
import { vehicleDocumentsApi } from '@/api/vehicles';

interface VehicleDocumentsTabProps {
  vehicleId: number;
}

const DOCUMENT_TYPE_LABELS: Record<VehicleDocumentType, string> = {
  carte_grise: 'Carte grise',
  assurance: 'Assurance',
  visite_technique: 'Visite technique',
  vignette: 'Vignette',
};

const DOCUMENT_TYPE_ICONS: Record<VehicleDocumentType, string> = {
  carte_grise: '#6A8A82',
  assurance: '#B87333',
  visite_technique: '#2563EB',
  vignette: '#7C3AED',
};

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string; icon: typeof CheckCircle }> = {
  valid: { bg: '#D1FAE5', text: '#059669', label: 'Valide', icon: CheckCircle },
  expiring_soon: { bg: '#FEF3C7', text: '#D97706', label: 'Expire bientot', icon: Clock },
  expired: { bg: '#FEE2E2', text: '#DC2626', label: 'Expire', icon: AlertTriangle },
};

function getDocumentStatus(expiryDate: string): { status: string; daysUntil: number } {
  const now = new Date();
  const expiry = new Date(expiryDate);
  const diffMs = expiry.getTime() - now.getTime();
  const daysUntil = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (daysUntil < 0) return { status: 'expired', daysUntil };
  if (daysUntil <= 30) return { status: 'expiring_soon', daysUntil };
  return { status: 'valid', daysUntil };
}

export default function VehicleDocumentsTab({ vehicleId }: VehicleDocumentsTabProps) {
  const [documents, setDocuments] = useState<VehicleDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingDoc, setEditingDoc] = useState<VehicleDocument | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  // Form state
  const [formType, setFormType] = useState<VehicleDocumentType>('carte_grise');
  const [formNumber, setFormNumber] = useState('');
  const [formIssueDate, setFormIssueDate] = useState('');
  const [formExpiryDate, setFormExpiryDate] = useState('');
  const [formFile, setFormFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await vehicleDocumentsApi.getByVehicle(vehicleId);
      setDocuments(data);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
      setError('Erreur lors du chargement des documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [vehicleId]);

  const resetForm = () => {
    setFormType('carte_grise');
    setFormNumber('');
    setFormIssueDate('');
    setFormExpiryDate('');
    setFormFile(null);
    setEditingDoc(null);
    setShowForm(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openEditForm = (doc: VehicleDocument) => {
    setEditingDoc(doc);
    setFormType(doc.document_type);
    setFormNumber(doc.document_number);
    setFormIssueDate(doc.issue_date);
    setFormExpiryDate(doc.expiry_date);
    setFormFile(null);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('document_type', formType);
      formData.append('document_number', formNumber);
      formData.append('issue_date', formIssueDate);
      formData.append('expiry_date', formExpiryDate);
      if (formFile) {
        formData.append('file', formFile);
      }

      if (editingDoc) {
        await vehicleDocumentsApi.update(vehicleId, editingDoc.id, formData);
      } else {
        await vehicleDocumentsApi.create(vehicleId, formData);
      }

      resetForm();
      fetchDocuments();
    } catch (err) {
      console.error('Failed to save document:', err);
      setError('Erreur lors de la sauvegarde du document');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (docId: number) => {
    setDeleting(docId);
    try {
      await vehicleDocumentsApi.delete(vehicleId, docId);
      fetchDocuments();
    } catch (err) {
      console.error('Failed to delete document:', err);
      setError('Erreur lors de la suppression');
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Check which document types are missing
  const allTypes: VehicleDocumentType[] = ['carte_grise', 'assurance', 'visite_technique', 'vignette'];
  const existingTypes = documents.map(d => d.document_type);
  const missingTypes = allTypes.filter(t => !existingTypes.includes(t));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold uppercase tracking-wide text-gray-500">
          Documents obligatoires ({documents.length}/4)
        </h4>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchDocuments}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
          {missingTypes.length > 0 && (
            <button
              onClick={() => {
                resetForm();
                setFormType(missingTypes[0]);
                setShowForm(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all hover:shadow-sm"
              style={{ backgroundColor: '#E8EFED', color: '#6A8A82' }}
            >
              <Plus className="w-4 h-4" />
              Ajouter
            </button>
          )}
        </div>
      </div>

      {/* Missing documents alert */}
      {missingTypes.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Documents manquants</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {missingTypes.map(type => (
                  <span
                    key={type}
                    className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700"
                  >
                    {DOCUMENT_TYPE_LABELS[type]}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <span className="text-red-700 text-sm">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="w-4 h-4 text-red-400" />
          </button>
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white rounded-xl border-2 p-5" style={{ borderColor: '#6A8A82' }}>
          <h4 className="text-sm font-bold text-gray-700 mb-4">
            {editingDoc ? 'Modifier le document' : 'Ajouter un document'}
          </h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Type de document</label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as VehicleDocumentType)}
                  className="soft-input"
                  disabled={!!editingDoc}
                >
                  {allTypes.map(type => (
                    <option key={type} value={type} disabled={!editingDoc && existingTypes.includes(type)}>
                      {DOCUMENT_TYPE_LABELS[type]} {!editingDoc && existingTypes.includes(type) ? '(deja ajoute)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Numero du document</label>
                <input
                  type="text"
                  value={formNumber}
                  onChange={(e) => setFormNumber(e.target.value)}
                  className="soft-input"
                  placeholder="Ex: CG-2024-12345"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Date de delivrance</label>
                <input
                  type="date"
                  value={formIssueDate}
                  onChange={(e) => setFormIssueDate(e.target.value)}
                  className="soft-input"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Date d'expiration</label>
                <input
                  type="date"
                  value={formExpiryDate}
                  onChange={(e) => setFormExpiryDate(e.target.value)}
                  className="soft-input"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Fichier (PDF ou image)
              </label>
              <div
                className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                style={{ borderColor: '#E8ECEC' }}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setFormFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                {formFile ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="w-5 h-5" style={{ color: '#6A8A82' }} />
                    <span className="text-sm font-medium text-gray-700">{formFile.name}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                    >
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm text-gray-500">Cliquez pour telecharger un fichier</p>
                    <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG</p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingDoc ? 'Mettre a jour' : 'Ajouter'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Documents list */}
      {documents.length === 0 && !showForm ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#E8EFED' }}>
            <FileText className="w-8 h-8" style={{ color: '#6A8A82' }} />
          </div>
          <p className="text-gray-500 mb-2">Aucun document enregistre</p>
          <p className="text-sm text-gray-400 mb-4">Ajoutez les documents obligatoires du vehicule</p>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Ajouter un document
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => {
            const { status: computedStatus, daysUntil } = getDocumentStatus(doc.expiry_date);
            const docStatus = STATUS_CONFIG[doc.status || computedStatus] || STATUS_CONFIG[computedStatus];
            const StatusIcon = docStatus.icon;
            const typeColor = DOCUMENT_TYPE_ICONS[doc.document_type];

            return (
              <div
                key={doc.id}
                className="bg-white rounded-xl p-4 border-2 hover:shadow-md transition-all"
                style={{ borderColor: '#E8ECEC' }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${typeColor}15` }}
                    >
                      <Shield className="w-5 h-5" style={{ color: typeColor }} />
                    </div>
                    <div>
                      <p className="font-semibold" style={{ color: '#191919' }}>
                        {DOCUMENT_TYPE_LABELS[doc.document_type]}
                      </p>
                      <p className="text-xs text-gray-500 font-mono">{doc.document_number}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                      style={{ backgroundColor: docStatus.bg, color: docStatus.text }}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {docStatus.label}
                    </span>
                  </div>
                </div>

                {/* Dates */}
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Delivre: {formatDate(doc.issue_date)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Expire: {formatDate(doc.expiry_date)}
                  </span>
                </div>

                {/* Expiry warning */}
                {(computedStatus === 'expiring_soon' || computedStatus === 'expired') && (
                  <div
                    className="rounded-lg px-3 py-2 text-xs font-medium mb-3"
                    style={{ backgroundColor: docStatus.bg, color: docStatus.text }}
                  >
                    {computedStatus === 'expired'
                      ? `Expire depuis ${Math.abs(daysUntil)} jour${Math.abs(daysUntil) > 1 ? 's' : ''}`
                      : `Expire dans ${daysUntil} jour${daysUntil > 1 ? 's' : ''}`
                    }
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div>
                    {doc.file && (
                      <a
                        href={doc.file}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-medium transition-colors hover:underline"
                        style={{ color: '#6A8A82' }}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Voir le document
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditForm(doc)}
                      className="p-2 rounded-lg transition-all hover:shadow-sm"
                      style={{ backgroundColor: '#F5E8DD', color: '#B87333' }}
                      title="Modifier"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      disabled={deleting === doc.id}
                      className="p-2 rounded-lg transition-all hover:shadow-sm bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50"
                      title="Supprimer"
                    >
                      {deleting === doc.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
