import { useState } from 'react';
import { X, User, FileText, Phone, Calendar, Shield, ChevronRight, ChevronLeft, Check, Upload, CreditCard, AlertCircle, Loader2, Eye, EyeOff, KeyRound, Mail, UserCheck } from 'lucide-react';

interface AddDriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => Promise<void>;
}

interface FormErrors {
  [key: string]: string;
}

const STEPS = [
  { id: 1, title: 'Photo', icon: Upload },
  { id: 2, title: 'Informations', icon: User },
  { id: 3, title: 'Permis', icon: CreditCard },
  { id: 4, title: 'Contact Urgence', icon: Phone },
  { id: 5, title: 'Compte', icon: KeyRound },
];

export default function AddDriverModal({ isOpen, onClose, onSubmit }: AddDriverModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    // User info
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    username: '',
    password: '',
    password_confirm: '',

    // Driver specific
    driver_license_number: '',
    driver_license_expiry: '',
    driver_license_category: 'B',

    // Emergency contact
    emergency_contact_name: '',
    emergency_contact_phone: '',

    // Additional
    hire_date: '',
    notes: '',
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, photo: 'La photo ne doit pas dépasser 10MB' }));
        return;
      }
      // Validate file type
      if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
        setErrors(prev => ({ ...prev, photo: 'Format accepté: PNG, JPG ou JPEG' }));
        return;
      }
      setErrors(prev => {
        const { photo, ...rest } = prev;
        return rest;
      });
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const { [name]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  // Auto-generate username from email
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    setFormData(prev => ({
      ...prev,
      email,
      username: email.split('@')[0] || '',
    }));
    if (errors.email) {
      setErrors(prev => {
        const { email: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: FormErrors = {};

    switch (step) {
      case 1:
        // Photo is optional
        return true;

      case 2:
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
        break;

      case 3:
        if (!formData.driver_license_number.trim()) {
          newErrors.driver_license_number = 'Le numéro de permis est requis';
        }
        if (!formData.driver_license_expiry) {
          newErrors.driver_license_expiry = "La date d'expiration est requise";
        } else {
          const expiryDate = new Date(formData.driver_license_expiry);
          if (expiryDate < new Date()) {
            newErrors.driver_license_expiry = 'Le permis est expiré';
          }
        }
        if (!formData.driver_license_category) {
          newErrors.driver_license_category = 'La catégorie est requise';
        }
        break;

      case 4:
        if (!formData.emergency_contact_name.trim()) {
          newErrors.emergency_contact_name = 'Le nom du contact est requis';
        }
        if (!formData.emergency_contact_phone.trim()) {
          newErrors.emergency_contact_phone = 'Le téléphone du contact est requis';
        }
        if (!formData.hire_date) {
          newErrors.hire_date = "La date d'embauche est requise";
        }
        break;

      case 5:
        if (!formData.username.trim()) {
          newErrors.username = "Le nom d'utilisateur est requis";
        } else if (formData.username.length < 3) {
          newErrors.username = "Le nom d'utilisateur doit avoir au moins 3 caractères";
        }
        if (!formData.password) {
          newErrors.password = 'Le mot de passe est requis';
        } else if (formData.password.length < 8) {
          newErrors.password = 'Le mot de passe doit avoir au moins 8 caractères';
        }
        if (!formData.password_confirm) {
          newErrors.password_confirm = 'La confirmation est requise';
        } else if (formData.password !== formData.password_confirm) {
          newErrors.password_confirm = 'Les mots de passe ne correspondent pas';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep) && currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep(currentStep)) {
      return;
    }

    setIsSubmitting(true);
    setApiError(null);

    try {
      // Format data for API - flat structure
      const submitData = new FormData();

      // User data (flat)
      submitData.append('username', formData.username);
      submitData.append('email', formData.email);
      submitData.append('password', formData.password);
      submitData.append('password_confirm', formData.password_confirm);
      submitData.append('first_name', formData.first_name);
      submitData.append('last_name', formData.last_name);
      submitData.append('phone_number', formData.phone_number);

      // Driver data
      submitData.append('driver_license_number', formData.driver_license_number);
      submitData.append('driver_license_expiry', formData.driver_license_expiry);
      submitData.append('driver_license_category', formData.driver_license_category);
      submitData.append('emergency_contact_name', formData.emergency_contact_name);
      submitData.append('emergency_contact_phone', formData.emergency_contact_phone);
      submitData.append('hire_date', formData.hire_date);
      if (formData.notes) {
        submitData.append('notes', formData.notes);
      }

      if (imageFile) {
        submitData.append('photo', imageFile);
      }

      await onSubmit(submitData);
      handleClose();
    } catch (err: any) {
      console.error('Failed to create driver:', err);

      // Handle API validation errors
      if (err.response?.data) {
        const data = err.response.data;
        const newErrors: FormErrors = {};

        // Handle all field errors (flat structure now)
        Object.entries(data).forEach(([key, value]) => {
          if (key !== 'detail' && key !== 'non_field_errors') {
            newErrors[key] = Array.isArray(value) ? value[0] : String(value);
          }
        });

        if (Object.keys(newErrors).length > 0) {
          setErrors(newErrors);
          // Navigate to the step with the first error
          const errorFields = Object.keys(newErrors);
          if (errorFields.some(f => ['first_name', 'last_name', 'email', 'phone_number'].includes(f))) {
            setCurrentStep(2);
          } else if (errorFields.some(f => f.includes('license'))) {
            setCurrentStep(3);
          } else if (errorFields.some(f => f.includes('emergency') || f === 'hire_date')) {
            setCurrentStep(4);
          } else if (errorFields.some(f => ['username', 'password', 'password_confirm'].includes(f))) {
            setCurrentStep(5);
          }
        } else {
          setApiError(data.detail || data.non_field_errors?.[0] || 'Une erreur est survenue lors de la création du chauffeur');
        }
      } else {
        setApiError('Une erreur est survenue. Veuillez réessayer.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setCurrentStep(1);
    setImagePreview(null);
    setImageFile(null);
    setErrors({});
    setApiError(null);
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone_number: '',
      username: '',
      password: '',
      password_confirm: '',
      driver_license_number: '',
      driver_license_expiry: '',
      driver_license_category: 'B',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      hire_date: '',
      notes: '',
    });
    onClose();
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4 sm:space-y-6 p-3 sm:p-6">
            <div className="text-center mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-2xl font-bold mb-1 sm:mb-2" style={{ color: '#191919' }}>
                Photo du chauffeur
              </h3>
              <p className="text-sm sm:text-base text-gray-600">Ajoutez une photo pour identifier le chauffeur</p>
            </div>
            <div
              className="border-2 border-dashed rounded-xl sm:rounded-2xl p-6 sm:p-12 text-center transition-all hover:border-sage cursor-pointer"
              style={{ borderColor: errors.photo ? '#DC2626' : imagePreview ? '#6A8A82' : '#E8ECEC', backgroundColor: imagePreview ? '#F0F3F2' : 'transparent' }}
              onClick={() => document.getElementById('driver-photo-upload')?.click()}
            >
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="Preview" className="w-32 h-32 sm:w-48 sm:h-48 mx-auto object-cover rounded-full shadow-lg" />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImagePreview(null);
                      setImageFile(null);
                    }}
                    className="absolute top-0 right-1/4 sm:right-1/4 w-8 h-8 sm:w-10 sm:h-10 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-all shadow-lg"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              ) : (
                <div>
                  <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-3 sm:mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: '#E8EFED' }}>
                    <User className="w-8 h-8 sm:w-12 sm:h-12" style={{ color: '#6A8A82' }} />
                  </div>
                  <p className="text-sm sm:text-lg font-semibold mb-1 sm:mb-2" style={{ color: '#6A8A82' }}>
                    Cliquez pour télécharger une photo
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500">PNG, JPG ou JPEG jusqu'à 10MB</p>
                  <p className="text-[10px] sm:text-xs text-gray-400 mt-1 sm:mt-2">(Optionnel - vous pouvez passer cette étape)</p>
                </div>
              )}
              <input
                type="file"
                id="driver-photo-upload"
                accept="image/png,image/jpeg,image/jpg"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
            {errors.photo && (
              <p className="text-red-500 text-xs sm:text-sm text-center flex items-center justify-center gap-1">
                <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                {errors.photo}
              </p>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-4 sm:space-y-6 p-3 sm:p-6">
            <div className="text-center mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-2xl font-bold mb-1 sm:mb-2" style={{ color: '#191919' }}>
                Informations personnelles
              </h3>
              <p className="text-sm sm:text-base text-gray-600">Informations de base du chauffeur</p>
            </div>
            <div className="bg-gradient-to-br from-sage/5 to-transparent rounded-lg sm:rounded-xl p-4 sm:p-6 border-2" style={{ borderColor: '#E8EFED' }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2" style={{ color: '#191919' }}>
                    Prénom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    placeholder="Jean"
                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border-2 focus:ring-4 focus:ring-sage/10 outline-none transition-all text-sm sm:text-base text-gray-900 placeholder-gray-400 ${
                      errors.first_name ? 'border-red-500' : 'border-gray-200 focus:border-sage'
                    }`}
                  />
                  {errors.first_name && (
                    <p className="text-red-500 text-[10px] sm:text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.first_name}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2" style={{ color: '#191919' }}>
                    Nom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    placeholder="Dupont"
                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border-2 focus:ring-4 focus:ring-sage/10 outline-none transition-all text-sm sm:text-base text-gray-900 placeholder-gray-400 ${
                      errors.last_name ? 'border-red-500' : 'border-gray-200 focus:border-sage'
                    }`}
                  />
                  {errors.last_name && (
                    <p className="text-red-500 text-[10px] sm:text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.last_name}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2" style={{ color: '#191919' }}>
                    Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleEmailChange}
                      placeholder="jean.dupont@example.com"
                      className={`w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border-2 focus:ring-4 focus:ring-sage/10 outline-none transition-all text-sm sm:text-base text-gray-900 placeholder-gray-400 ${
                        errors.email ? 'border-red-500' : 'border-gray-200 focus:border-sage'
                      }`}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-500 text-[10px] sm:text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.email}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2" style={{ color: '#191919' }}>
                    Téléphone <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    <input
                      type="tel"
                      name="phone_number"
                      value={formData.phone_number}
                      onChange={handleInputChange}
                      placeholder="+243 123 456 789"
                      className={`w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border-2 focus:ring-4 focus:ring-sage/10 outline-none transition-all text-sm sm:text-base text-gray-900 placeholder-gray-400 ${
                        errors.phone_number ? 'border-red-500' : 'border-gray-200 focus:border-sage'
                      }`}
                    />
                  </div>
                  {errors.phone_number && (
                    <p className="text-red-500 text-[10px] sm:text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.phone_number}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4 sm:space-y-6 p-3 sm:p-6">
            <div className="text-center mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-2xl font-bold mb-1 sm:mb-2" style={{ color: '#191919' }}>
                Permis de conduire
              </h3>
              <p className="text-sm sm:text-base text-gray-600">Informations sur le permis de conduire</p>
            </div>
            <div className="bg-gradient-to-br from-copper/5 to-transparent rounded-lg sm:rounded-xl p-4 sm:p-6 border-2" style={{ borderColor: '#F5E8DD' }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                <div className="md:col-span-2">
                  <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2" style={{ color: '#191919' }}>
                    Numéro de permis <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="driver_license_number"
                    value={formData.driver_license_number}
                    onChange={handleInputChange}
                    placeholder="ABC123456789"
                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border-2 focus:ring-4 focus:ring-copper/10 outline-none transition-all font-mono text-sm sm:text-base text-gray-900 placeholder-gray-400 ${
                      errors.driver_license_number ? 'border-red-500' : 'border-gray-200 focus:border-copper'
                    }`}
                  />
                  {errors.driver_license_number && (
                    <p className="text-red-500 text-[10px] sm:text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.driver_license_number}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2" style={{ color: '#191919' }}>
                    Date d'expiration <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="driver_license_expiry"
                    value={formData.driver_license_expiry}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split('T')[0]}
                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border-2 focus:ring-4 focus:ring-copper/10 outline-none transition-all text-sm sm:text-base text-gray-900 placeholder-gray-400 ${
                      errors.driver_license_expiry ? 'border-red-500' : 'border-gray-200 focus:border-copper'
                    }`}
                  />
                  {errors.driver_license_expiry && (
                    <p className="text-red-500 text-[10px] sm:text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.driver_license_expiry}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2" style={{ color: '#191919' }}>
                    Catégorie de permis <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="driver_license_category"
                    value={formData.driver_license_category}
                    onChange={handleInputChange}
                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border-2 focus:ring-4 focus:ring-copper/10 outline-none transition-all text-sm sm:text-base text-gray-900 placeholder-gray-400 ${
                      errors.driver_license_category ? 'border-red-500' : 'border-gray-200 focus:border-copper'
                    }`}
                  >
                    <option value="A">A - Moto</option>
                    <option value="B">B - Voiture</option>
                    <option value="C">C - Poids lourd</option>
                    <option value="D">D - Transport en commun</option>
                    <option value="E">E - Remorque</option>
                  </select>
                  {errors.driver_license_category && (
                    <p className="text-red-500 text-[10px] sm:text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.driver_license_category}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-3 sm:mt-4 p-3 sm:p-4 rounded-lg flex items-start space-x-2 sm:space-x-3" style={{ backgroundColor: '#FEF3C7' }}>
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5" style={{ color: '#D97706' }} />
                <p className="text-xs sm:text-sm" style={{ color: '#92400E' }}>
                  Assurez-vous que le permis de conduire est valide et correspond au type de véhicule que le chauffeur conduira.
                </p>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4 sm:space-y-6 p-3 sm:p-6">
            <div className="text-center mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-2xl font-bold mb-1 sm:mb-2" style={{ color: '#191919' }}>
                Contact d'urgence
              </h3>
              <p className="text-sm sm:text-base text-gray-600">Personne à contacter en cas d'urgence</p>
            </div>
            <div className="bg-gradient-to-br from-sage/5 to-transparent rounded-lg sm:rounded-xl p-4 sm:p-6 border-2" style={{ borderColor: '#E8EFED' }}>
              <div className="grid grid-cols-1 gap-4 sm:gap-5">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2" style={{ color: '#191919' }}>
                    Nom du contact <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="emergency_contact_name"
                    value={formData.emergency_contact_name}
                    onChange={handleInputChange}
                    placeholder="Marie Dupont"
                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border-2 focus:ring-4 focus:ring-sage/10 outline-none transition-all text-sm sm:text-base text-gray-900 placeholder-gray-400 ${
                      errors.emergency_contact_name ? 'border-red-500' : 'border-gray-200 focus:border-sage'
                    }`}
                  />
                  {errors.emergency_contact_name && (
                    <p className="text-red-500 text-[10px] sm:text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.emergency_contact_name}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2" style={{ color: '#191919' }}>
                    Téléphone du contact <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    <input
                      type="tel"
                      name="emergency_contact_phone"
                      value={formData.emergency_contact_phone}
                      onChange={handleInputChange}
                      placeholder="+243 987 654 321"
                      className={`w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border-2 focus:ring-4 focus:ring-sage/10 outline-none transition-all text-sm sm:text-base text-gray-900 placeholder-gray-400 ${
                        errors.emergency_contact_phone ? 'border-red-500' : 'border-gray-200 focus:border-sage'
                      }`}
                    />
                  </div>
                  {errors.emergency_contact_phone && (
                    <p className="text-red-500 text-[10px] sm:text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.emergency_contact_phone}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2" style={{ color: '#191919' }}>
                    Date d'embauche <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="hire_date"
                    value={formData.hire_date}
                    onChange={handleInputChange}
                    max={new Date().toISOString().split('T')[0]}
                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border-2 focus:ring-4 focus:ring-sage/10 outline-none transition-all text-sm sm:text-base text-gray-900 placeholder-gray-400 ${
                      errors.hire_date ? 'border-red-500' : 'border-gray-200 focus:border-sage'
                    }`}
                  />
                  {errors.hire_date && (
                    <p className="text-red-500 text-[10px] sm:text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.hire_date}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2" style={{ color: '#191919' }}>
                    Notes (optionnel)
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Ajoutez des notes supplémentaires..."
                    rows={3}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border-2 border-gray-200 focus:border-sage focus:ring-4 focus:ring-sage/10 outline-none transition-all resize-none text-sm sm:text-base text-gray-900 placeholder-gray-400"
                  />
                </div>
              </div>
              <div className="mt-3 sm:mt-4 p-3 sm:p-4 rounded-lg flex items-start space-x-2 sm:space-x-3" style={{ backgroundColor: '#DBEAFE' }}>
                <Phone className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5" style={{ color: '#1E40AF' }} />
                <p className="text-xs sm:text-sm" style={{ color: '#1E3A8A' }}>
                  Ce contact sera utilisé en cas d'urgence ou d'accident impliquant le chauffeur.
                </p>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4 sm:space-y-6 p-3 sm:p-6">
            <div className="text-center mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-2xl font-bold mb-1 sm:mb-2" style={{ color: '#191919' }}>
                Création du compte
              </h3>
              <p className="text-sm sm:text-base text-gray-600">Identifiants de connexion pour le chauffeur</p>
            </div>

            {/* Summary Card */}
            <div className="bg-gradient-to-br from-sage/10 to-copper/5 rounded-lg sm:rounded-xl p-3 sm:p-5 border-2" style={{ borderColor: '#E8EFED' }}>
              <div className="flex items-center gap-3 sm:gap-4">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover shadow-lg" />
                ) : (
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-white text-base sm:text-xl font-bold" style={{ backgroundColor: '#6A8A82' }}>
                    {formData.first_name[0]}{formData.last_name[0]}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm sm:text-lg truncate" style={{ color: '#191919' }}>
                    {formData.first_name} {formData.last_name}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 truncate">{formData.email}</p>
                  <p className="text-[10px] sm:text-xs text-gray-400 italic">ID employé généré automatiquement</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-copper/5 to-transparent rounded-lg sm:rounded-xl p-4 sm:p-6 border-2" style={{ borderColor: '#F5E8DD' }}>
              <div className="space-y-4 sm:space-y-5">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2" style={{ color: '#191919' }}>
                    Nom d'utilisateur <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      placeholder="jean.dupont"
                      className={`w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border-2 focus:ring-4 focus:ring-copper/10 outline-none transition-all text-sm sm:text-base text-gray-900 placeholder-gray-400 ${
                        errors.username ? 'border-red-500' : 'border-gray-200 focus:border-copper'
                      }`}
                    />
                  </div>
                  {errors.username && (
                    <p className="text-red-500 text-[10px] sm:text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.username}
                    </p>
                  )}
                  <p className="text-[10px] sm:text-xs text-gray-500 mt-1">Généré automatiquement à partir de l'email</p>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2" style={{ color: '#191919' }}>
                    Mot de passe <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Minimum 8 caractères"
                      className={`w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border-2 focus:ring-4 focus:ring-copper/10 outline-none transition-all text-sm sm:text-base text-gray-900 placeholder-gray-400 ${
                        errors.password ? 'border-red-500' : 'border-gray-200 focus:border-copper'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-[10px] sm:text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.password}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2" style={{ color: '#191919' }}>
                    Confirmer le mot de passe <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    <input
                      type={showPasswordConfirm ? 'text' : 'password'}
                      name="password_confirm"
                      value={formData.password_confirm}
                      onChange={handleInputChange}
                      placeholder="Répétez le mot de passe"
                      className={`w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border-2 focus:ring-4 focus:ring-copper/10 outline-none transition-all text-sm sm:text-base text-gray-900 placeholder-gray-400 ${
                        errors.password_confirm ? 'border-red-500' : 'border-gray-200 focus:border-copper'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                      className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswordConfirm ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </button>
                  </div>
                  {errors.password_confirm && (
                    <p className="text-red-500 text-[10px] sm:text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.password_confirm}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-3 sm:p-4 rounded-lg flex items-start space-x-2 sm:space-x-3" style={{ backgroundColor: '#E8EFED' }}>
              <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5" style={{ color: '#6A8A82' }} />
              <p className="text-xs sm:text-sm" style={{ color: '#374151' }}>
                Le chauffeur pourra utiliser ces identifiants pour se connecter à l'application mobile.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden max-h-[95vh] sm:max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-6 border-b-2 flex-shrink-0" style={{ borderColor: '#E8ECEC' }}>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center" style={{ backgroundColor: '#E8EFED' }}>
              <User className="w-4 h-4 sm:w-6 sm:h-6" style={{ color: '#6A8A82' }} />
            </div>
            <div>
              <h2 className="text-lg sm:text-2xl font-bold" style={{ color: '#191919' }}>
                Nouveau Chauffeur
              </h2>
              <p className="text-xs sm:text-sm text-gray-600">Étape {currentStep} sur {STEPS.length}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center hover:bg-gray-100 transition-all disabled:opacity-50"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
          </button>
        </div>

        {/* Stepper */}
        <div className="px-3 sm:px-6 pt-3 sm:pt-6 pb-2 sm:pb-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center transition-all duration-300 ${
                        isActive ? 'shadow-lg scale-110' : isCompleted ? 'shadow-md' : ''
                      }`}
                      style={{
                        backgroundColor: isActive ? '#6A8A82' : isCompleted ? '#B87333' : '#E8ECEC',
                        color: isActive || isCompleted ? '#ffffff' : '#6B7280',
                      }}
                    >
                      {isCompleted ? (
                        <Check className="w-4 h-4 sm:w-6 sm:h-6" />
                      ) : (
                        <Icon className="w-4 h-4 sm:w-6 sm:h-6" />
                      )}
                    </div>
                    <p
                      className={`text-[10px] sm:text-xs mt-1 sm:mt-2 font-medium text-center hidden xs:block ${
                        isActive ? 'font-bold' : ''
                      }`}
                      style={{
                        color: isActive ? '#6A8A82' : isCompleted ? '#B87333' : '#6B7280',
                      }}
                    >
                      {step.title}
                    </p>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className="flex-1 h-0.5 sm:h-1 mx-1 sm:mx-2 rounded-full" style={{ backgroundColor: isCompleted ? '#B87333' : '#E8ECEC' }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* API Error */}
        {apiError && (
          <div className="mx-3 sm:mx-6 mb-2 sm:mb-4 p-3 sm:p-4 bg-red-50 border-2 border-red-200 rounded-lg sm:rounded-xl flex items-center gap-2 sm:gap-3">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700 text-xs sm:text-sm">{apiError}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto min-h-[300px] sm:min-h-[400px]">
            {renderStepContent()}
          </div>

          {/* Footer Navigation */}
          <div className="flex items-center justify-between p-3 sm:p-6 border-t-2 bg-gray-50 flex-shrink-0 gap-2" style={{ borderColor: '#E8ECEC' }}>
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-3 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold transition-all hover:bg-gray-200 disabled:opacity-50 text-xs sm:text-base"
              style={{ backgroundColor: '#E8ECEC', color: '#6B7280' }}
            >
              Annuler
            </button>

            <div className="flex items-center space-x-2 sm:space-x-3">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handlePrevious}
                  disabled={isSubmitting}
                  className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold transition-all hover:shadow-md disabled:opacity-50 text-xs sm:text-base"
                  style={{ backgroundColor: '#E8EFED', color: '#6A8A82' }}
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden xs:inline">Précédent</span>
                </button>
              )}

              {currentStep < STEPS.length ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 text-xs sm:text-base"
                  style={{ backgroundColor: '#6A8A82' }}
                >
                  <span>Suivant</span>
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 text-xs sm:text-base"
                  style={{ backgroundColor: '#B87333' }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                      <span className="hidden xs:inline">Création...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="hidden xs:inline">Créer le chauffeur</span>
                      <span className="xs:hidden">Créer</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
