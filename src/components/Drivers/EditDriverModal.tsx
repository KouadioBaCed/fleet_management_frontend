import { useState, useEffect, useMemo } from 'react';
import { X, User, Phone, CreditCard, FileText, AlertCircle, Loader2, Check, Save, Mail, Calendar, Shield, Users } from 'lucide-react';
import type { Driver } from '@/types';
import { driversApi } from '@/api/drivers';

interface EditDriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  driver: Driver | null;
}

interface FormErrors {
  [key: string]: string;
}

type TabType = 'general' | 'license' | 'emergency' | 'notes';

const TABS = [
  { id: 'general' as TabType, label: 'Général', icon: User },
  { id: 'license' as TabType, label: 'Permis', icon: CreditCard },
  { id: 'emergency' as TabType, label: 'Contact Urgence', icon: Phone },
  { id: 'notes' as TabType, label: 'Notes', icon: FileText },
];

const STATUS_OPTIONS = [
  { value: 'available', label: 'Disponible', color: '#6A8A82', bg: '#E8EFED' },
  { value: 'on_mission', label: 'En mission', color: '#B87333', bg: '#F5E8DD' },
  { value: 'on_break', label: 'En pause', color: '#6B7280', bg: '#E8ECEC' },
  { value: 'off_duty', label: 'Hors service', color: '#DC2626', bg: '#FEE2E2' },
];

export default function EditDriverModal({ isOpen, onClose, onSubmit, driver }: EditDriverModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    // Personal info
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    employee_id: '',
    status: 'available',

    // License
    driver_license_number: '',
    driver_license_expiry: '',
    driver_license_category: 'A',

    // Emergency contact
    emergency_contact_name: '',
    emergency_contact_phone: '',

    // Additional
    hire_date: '',
    notes: '',
  });

  const [originalData, setOriginalData] = useState(formData);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Load driver data when modal opens
  useEffect(() => {
    if (driver && isOpen) {
      loadFullDriverData();
    }
  }, [driver, isOpen]);

  const loadFullDriverData = async () => {
    if (!driver) return;

    setIsLoadingData(true);
    setErrors({});
    setApiError(null);
    setActiveTab('general');

    try {
      // Fetch full driver data from API
      const fullDriver = await driversApi.getById(driver.id);

      const data = {
        first_name: fullDriver.user?.first_name || fullDriver.full_name?.split(' ')[0] || '',
        last_name: fullDriver.user?.last_name || fullDriver.full_name?.split(' ').slice(1).join(' ') || '',
        email: fullDriver.user?.email || '',
        phone_number: fullDriver.user?.phone_number || '',
        employee_id: fullDriver.employee_id || '',
        status: fullDriver.status || 'available',
        driver_license_number: fullDriver.driver_license_number || '',
        driver_license_expiry: fullDriver.driver_license_expiry || '',
        driver_license_category: fullDriver.driver_license_category || 'A',
        emergency_contact_name: fullDriver.emergency_contact_name || '',
        emergency_contact_phone: fullDriver.emergency_contact_phone || '',
        hire_date: fullDriver.hire_date || '',
        notes: fullDriver.notes || '',
      };

      setFormData(data);
      setOriginalData(data);
      setImagePreview(fullDriver.photo || fullDriver.user?.profile_picture || null);
      setImageFile(null);
    } catch (error) {
      console.error('Failed to load driver details:', error);
      // Fallback to data from props
      const data = {
        first_name: driver.user?.first_name || driver.full_name?.split(' ')[0] || '',
        last_name: driver.user?.last_name || driver.full_name?.split(' ').slice(1).join(' ') || '',
        email: driver.user?.email || '',
        phone_number: driver.user?.phone_number || '',
        employee_id: driver.employee_id || '',
        status: driver.status || 'available',
        driver_license_number: driver.driver_license_number || '',
        driver_license_expiry: driver.driver_license_expiry || '',
        driver_license_category: driver.driver_license_category || 'A',
        emergency_contact_name: driver.emergency_contact_name || '',
        emergency_contact_phone: driver.emergency_contact_phone || '',
        hire_date: driver.hire_date || '',
        notes: driver.notes || '',
      };
      setFormData(data);
      setOriginalData(data);
      setImagePreview(driver.photo || null);
      setImageFile(null);
    } finally {
      setIsLoadingData(false);
    }
  };

  // Check if form has changes
  const hasChanges = useMemo(() => {
    if (imageFile) return true;
    return JSON.stringify(formData) !== JSON.stringify(originalData);
  }, [formData, originalData, imageFile]);

  const compressImage = (file: File, maxWidth = 800, quality = 0.8): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(file); return; }
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) { resolve(file); return; }
            resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }));
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => reject(new Error('Erreur lors du chargement de l\'image'));
      img.src = URL.createObjectURL(file);
    });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, photo: 'La photo ne doit pas dépasser 10MB' }));
        return;
      }
      if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
        setErrors(prev => ({ ...prev, photo: 'Format accepté: PNG, JPG ou JPEG' }));
        return;
      }
      setErrors(prev => {
        const { photo, ...rest } = prev;
        return rest;
      });
      try {
        const compressed = await compressImage(file);
        setImageFile(compressed);
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(compressed);
      } catch {
        setErrors(prev => ({ ...prev, photo: 'Erreur lors du traitement de l\'image' }));
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const { [name]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleStatusChange = (status: string) => {
    setFormData(prev => ({ ...prev, status }));
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // General tab validation
    if (!formData.first_name.trim()) {
      newErrors.first_name = 'Le prénom est requis';
    }
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Le nom est requis';
    }
    if (!formData.email.trim()) {
      newErrors.email = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Format d'email invalide";
    }
    if (!formData.phone_number.trim()) {
      newErrors.phone_number = 'Le téléphone est requis';
    }
    if (!formData.employee_id.trim()) {
      newErrors.employee_id = "L'ID employé est requis";
    }

    // License tab validation
    if (!formData.driver_license_number.trim()) {
      newErrors.driver_license_number = 'Le numéro de permis est requis';
    }
    if (!formData.driver_license_expiry) {
      newErrors.driver_license_expiry = "La date d'expiration est requise";
    }

    // Emergency contact validation
    if (!formData.emergency_contact_name.trim()) {
      newErrors.emergency_contact_name = 'Le nom du contact est requis';
    }
    if (!formData.emergency_contact_phone.trim()) {
      newErrors.emergency_contact_phone = 'Le téléphone du contact est requis';
    }

    setErrors(newErrors);

    // Navigate to tab with first error
    if (Object.keys(newErrors).length > 0) {
      const errorFields = Object.keys(newErrors);
      if (errorFields.some(f => ['first_name', 'last_name', 'email', 'phone_number', 'employee_id'].includes(f))) {
        setActiveTab('general');
      } else if (errorFields.some(f => f.includes('license'))) {
        setActiveTab('license');
      } else if (errorFields.some(f => f.includes('emergency'))) {
        setActiveTab('emergency');
      }
    }

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setApiError(null);

    try {
      const submitData: any = {
        employee_id: formData.employee_id,
        status: formData.status,
        driver_license_number: formData.driver_license_number,
        driver_license_expiry: formData.driver_license_expiry,
        driver_license_category: formData.driver_license_category,
        emergency_contact_name: formData.emergency_contact_name,
        emergency_contact_phone: formData.emergency_contact_phone,
        hire_date: formData.hire_date || undefined,
        notes: formData.notes || undefined,
      };

      // If there's a new photo, use FormData
      if (imageFile) {
        const formDataObj = new FormData();
        Object.entries(submitData).forEach(([key, value]) => {
          if (value !== undefined) {
            formDataObj.append(key, String(value));
          }
        });
        formDataObj.append('photo', imageFile);
        await onSubmit(formDataObj);
      } else {
        await onSubmit(submitData);
      }

      handleClose();
    } catch (err: any) {
      console.error('Failed to update driver:', err);

      if (err.response?.data) {
        const data = err.response.data;
        const newErrors: FormErrors = {};

        Object.entries(data).forEach(([key, value]) => {
          if (key !== 'detail') {
            newErrors[key] = Array.isArray(value) ? value[0] : String(value);
          }
        });

        if (Object.keys(newErrors).length > 0) {
          setErrors(newErrors);
        } else {
          setApiError(data.detail || 'Une erreur est survenue lors de la modification');
        }
      } else {
        setApiError('Une erreur est survenue. Veuillez réessayer.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setActiveTab('general');
    setErrors({});
    setApiError(null);
    setImageFile(null);
    onClose();
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-6">
            {/* Photo Section */}
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0">
                <div
                  className="w-28 h-28 rounded-2xl overflow-hidden cursor-pointer relative group border-2"
                  style={{ borderColor: '#E8ECEC' }}
                  onClick={() => document.getElementById('edit-driver-photo')?.click()}
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="Photo" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-white" style={{ backgroundColor: '#6A8A82' }}>
                      {formData.first_name[0]}{formData.last_name[0]}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-xs font-medium">Modifier</span>
                  </div>
                </div>
                <input
                  type="file"
                  id="edit-driver-photo"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={handleImageChange}
                  className="hidden"
                />
                {errors.photo && (
                  <p className="text-red-500 text-xs mt-1">{errors.photo}</p>
                )}
              </div>

              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1.5" style={{ color: '#191919' }}>
                      Prénom <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2.5 rounded-xl border-2 focus:ring-4 focus:ring-sage/10 outline-none transition-all text-gray-900 placeholder-gray-400 ${
                        errors.first_name ? 'border-red-500' : 'border-gray-200 focus:border-sage'
                      }`}
                    />
                    {errors.first_name && (
                      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.first_name}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5" style={{ color: '#191919' }}>
                      Nom <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2.5 rounded-xl border-2 focus:ring-4 focus:ring-sage/10 outline-none transition-all text-gray-900 placeholder-gray-400 ${
                        errors.last_name ? 'border-red-500' : 'border-gray-200 focus:border-sage'
                      }`}
                    />
                    {errors.last_name && (
                      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.last_name}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: '#191919' }}>
                    ID Employé <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="employee_id"
                    value={formData.employee_id}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 rounded-xl border-2 focus:ring-4 focus:ring-sage/10 outline-none transition-all text-gray-900 placeholder-gray-400 font-mono ${
                      errors.employee_id ? 'border-red-500' : 'border-gray-200 focus:border-sage'
                    }`}
                  />
                  {errors.employee_id && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.employee_id}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: '#191919' }}>
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full pl-11 pr-4 py-2.5 rounded-xl border-2 focus:ring-4 focus:ring-sage/10 outline-none transition-all text-gray-900 placeholder-gray-400 ${
                      errors.email ? 'border-red-500' : 'border-gray-200 focus:border-sage'
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.email}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: '#191919' }}>
                  Téléphone <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleInputChange}
                    className={`w-full pl-11 pr-4 py-2.5 rounded-xl border-2 focus:ring-4 focus:ring-sage/10 outline-none transition-all text-gray-900 placeholder-gray-400 ${
                      errors.phone_number ? 'border-red-500' : 'border-gray-200 focus:border-sage'
                    }`}
                  />
                </div>
                {errors.phone_number && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.phone_number}
                  </p>
                )}
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-semibold mb-3" style={{ color: '#191919' }}>
                Statut
              </label>
              <div className="grid grid-cols-4 gap-3">
                {STATUS_OPTIONS.map((status) => (
                  <button
                    key={status.value}
                    type="button"
                    onClick={() => handleStatusChange(status.value)}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                      formData.status === status.value ? 'shadow-md' : 'hover:shadow-sm'
                    }`}
                    style={{
                      borderColor: formData.status === status.value ? status.color : '#E8ECEC',
                      backgroundColor: formData.status === status.value ? status.bg : 'white',
                    }}
                  >
                    <div
                      className="w-3 h-3 rounded-full mx-auto mb-2"
                      style={{ backgroundColor: status.color }}
                    />
                    <span
                      className="text-xs font-semibold"
                      style={{ color: formData.status === status.value ? status.color : '#6B7280' }}
                    >
                      {status.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 'license':
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-copper/5 to-transparent rounded-xl p-6 border-2" style={{ borderColor: '#F5E8DD' }}>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: '#191919' }}>
                    Numéro de permis <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="driver_license_number"
                    value={formData.driver_license_number}
                    onChange={handleInputChange}
                    placeholder="ABC123456789"
                    className={`w-full px-4 py-2.5 rounded-xl border-2 focus:ring-4 focus:ring-copper/10 outline-none transition-all font-mono text-gray-900 placeholder-gray-400 ${
                      errors.driver_license_number ? 'border-red-500' : 'border-gray-200 focus:border-copper'
                    }`}
                  />
                  {errors.driver_license_number && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.driver_license_number}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1.5" style={{ color: '#191919' }}>
                      Date d'expiration <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="driver_license_expiry"
                      value={formData.driver_license_expiry}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2.5 rounded-xl border-2 focus:ring-4 focus:ring-copper/10 outline-none transition-all text-gray-900 ${
                        errors.driver_license_expiry ? 'border-red-500' : 'border-gray-200 focus:border-copper'
                      }`}
                    />
                    {errors.driver_license_expiry && (
                      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.driver_license_expiry}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5" style={{ color: '#191919' }}>
                      Catégorie <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="driver_license_category"
                      value={formData.driver_license_category}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-copper focus:ring-4 focus:ring-copper/10 outline-none transition-all text-gray-900"
                    >
                      <option value="A">A - Motos et tricycles (dès 16 ans)</option>
                      <option value="B">B - Voitures et remorques ≤ 3 500 kg</option>
                      <option value="C">C - Camions et tracteurs routiers</option>
                      <option value="D">D - Autobus (transport de personnes)</option>
                      <option value="E">E - Ensembles routiers (remorques &gt; 750 kg)</option>
                      <option value="AB">AB - Motos + Voitures</option>
                      <option value="BCDE">BCDE - Camionnettes, engins lourds (dès 21 ans)</option>
                      <option value="ABCDE">ABCDE - Tous véhicules (dès 21 ans)</option>
                      <option value="F">F - Véhicules adaptés (personnes handicapées)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg flex items-start space-x-3" style={{ backgroundColor: '#FEF3C7' }}>
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#D97706' }} />
              <p className="text-sm" style={{ color: '#92400E' }}>
                Assurez-vous que le permis de conduire est valide et correspond au type de véhicule que le chauffeur conduira.
              </p>
            </div>
          </div>
        );

      case 'emergency':
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-sage/5 to-transparent rounded-xl p-6 border-2" style={{ borderColor: '#E8EFED' }}>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: '#191919' }}>
                    Nom du contact d'urgence <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="emergency_contact_name"
                    value={formData.emergency_contact_name}
                    onChange={handleInputChange}
                    placeholder="Marie Dupont"
                    className={`w-full px-4 py-2.5 rounded-xl border-2 focus:ring-4 focus:ring-sage/10 outline-none transition-all text-gray-900 placeholder-gray-400 ${
                      errors.emergency_contact_name ? 'border-red-500' : 'border-gray-200 focus:border-sage'
                    }`}
                  />
                  {errors.emergency_contact_name && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.emergency_contact_name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: '#191919' }}>
                    Téléphone du contact <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      name="emergency_contact_phone"
                      value={formData.emergency_contact_phone}
                      onChange={handleInputChange}
                      placeholder="+243 987 654 321"
                      className={`w-full pl-11 pr-4 py-2.5 rounded-xl border-2 focus:ring-4 focus:ring-sage/10 outline-none transition-all text-gray-900 placeholder-gray-400 ${
                        errors.emergency_contact_phone ? 'border-red-500' : 'border-gray-200 focus:border-sage'
                      }`}
                    />
                  </div>
                  {errors.emergency_contact_phone && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.emergency_contact_phone}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: '#191919' }}>
                    Date d'embauche
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      name="hire_date"
                      value={formData.hire_date}
                      onChange={handleInputChange}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full pl-11 pr-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-sage focus:ring-4 focus:ring-sage/10 outline-none transition-all text-gray-900"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg flex items-start space-x-3" style={{ backgroundColor: '#DBEAFE' }}>
              <Phone className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#1E40AF' }} />
              <p className="text-sm" style={{ color: '#1E3A8A' }}>
                Ce contact sera utilisé en cas d'urgence ou d'accident impliquant le chauffeur.
              </p>
            </div>
          </div>
        );

      case 'notes':
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-sage/5 to-transparent rounded-xl p-6 border-2" style={{ borderColor: '#E8EFED' }}>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: '#191919' }}>
                  Notes et observations
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Ajoutez des notes supplémentaires sur le chauffeur..."
                  rows={8}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-sage focus:ring-4 focus:ring-sage/10 outline-none transition-all resize-none text-gray-900 placeholder-gray-400"
                />
              </div>
            </div>

            {/* Driver Stats Summary */}
            {driver && (
              <div className="bg-gray-50 rounded-xl p-5 border-2" style={{ borderColor: '#E8ECEC' }}>
                <h4 className="text-sm font-semibold mb-4" style={{ color: '#191919' }}>
                  Statistiques du chauffeur
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-white rounded-lg">
                    <p className="text-2xl font-bold" style={{ color: '#6A8A82' }}>{driver.total_trips}</p>
                    <p className="text-xs text-gray-600">Trajets</p>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <p className="text-2xl font-bold" style={{ color: '#B87333' }}>{Number(driver.total_distance).toFixed(0)}</p>
                    <p className="text-xs text-gray-600">km parcourus</p>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <p className="text-2xl font-bold" style={{ color: '#191919' }}>{Number(driver.rating).toFixed(1)}</p>
                    <p className="text-xs text-gray-600">Note</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen || !driver) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2 flex-shrink-0" style={{ borderColor: '#E8ECEC' }}>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#E8EFED' }}>
              <User className="w-6 h-6" style={{ color: '#6A8A82' }} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold" style={{ color: '#191919' }}>
                  Modifier le chauffeur
                </h2>
                {hasChanges && (
                  <span className="px-2 py-0.5 text-xs font-medium rounded-full" style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>
                    Non enregistré
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 font-mono">{driver.employee_id}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-all disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b-2 px-6 flex-shrink-0" style={{ borderColor: '#E8ECEC' }}>
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            // Check if tab has errors
            const hasError = tab.id === 'general' && Object.keys(errors).some(k => ['first_name', 'last_name', 'email', 'phone_number', 'employee_id'].includes(k))
              || tab.id === 'license' && Object.keys(errors).some(k => k.includes('license'))
              || tab.id === 'emergency' && Object.keys(errors).some(k => k.includes('emergency'));

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 -mb-0.5 transition-all ${
                  isActive ? 'font-semibold' : 'hover:bg-gray-50'
                }`}
                style={{
                  borderColor: isActive ? '#6A8A82' : 'transparent',
                  color: hasError ? '#DC2626' : isActive ? '#6A8A82' : '#6B7280',
                }}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm">{tab.label}</span>
                {hasError && (
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                )}
              </button>
            );
          })}
        </div>

        {/* API Error */}
        {apiError && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700 text-sm">{apiError}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6">
            {isLoadingData ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                <span className="ml-3 text-gray-500">Chargement des données...</span>
              </div>
            ) : (
              renderTabContent()
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t-2 bg-gray-50 flex-shrink-0" style={{ borderColor: '#E8ECEC' }}>
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl font-semibold transition-all hover:bg-gray-200 disabled:opacity-50"
              style={{ backgroundColor: '#E8ECEC', color: '#6B7280' }}
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !hasChanges}
              className="flex items-center space-x-2 px-6 py-2.5 rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              style={{ backgroundColor: '#6A8A82' }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Enregistrement...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Enregistrer</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
