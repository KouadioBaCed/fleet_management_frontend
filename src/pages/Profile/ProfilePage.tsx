import Layout from '@/components/Layout/Layout';
import { useAuthStore } from '@/store/authStore';
import { apiClient } from '@/api/client';
import { authApi } from '@/api/auth';
import { useState, useEffect, useRef } from 'react';
import {
  User,
  Mail,
  Phone,
  Building2,
  Camera,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
  Shield,
  CreditCard,
  Calendar,
  Tag,
  Car,
  Fuel,
  Gauge,
  MapPin,
  Clock,
  TrendingUp,
  Star,
  Navigation,
  FileText,
  AlertTriangle,
  Play,
  Flag
} from 'lucide-react';

interface DriverLicense {
  driver_license_number: string;
  driver_license_expiry: string;
  driver_license_category: string;
  employee_id: string;
  status: string;
  status_display: string;
}

interface AssignedVehicle {
  id: number;
  license_plate: string;
  brand: string;
  model: string;
  year: number;
  vehicle_type: string;
  vehicle_type_display: string;
  color: string;
  fuel_type: string;
  fuel_type_display: string;
  status: string;
  status_display: string;
  current_mileage: number;
  photo: string | null;
}

interface ActiveMission {
  id: number;
  mission_code: string;
  title: string;
  status: string;
  status_display: string;
  priority: string;
  priority_display: string;
  origin_address: string;
  destination_address: string;
  scheduled_start: string;
  scheduled_end: string;
  estimated_distance: number;
}

interface Statistics {
  total_trips: number;
  total_distance: number;
  rating: number;
  total_missions: number;
  completed_missions: number;
  cancelled_missions: number;
  missions_this_month: number;
  distance_this_month: number;
  total_fuel_consumed: number;
  average_speed: number;
  max_speed_ever: number;
  trips_with_incidents: number;
  success_rate: number;
}

interface ProfileData {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: string;
  phone_number: string | null;
  profile_picture: string | null;
  is_active_duty: boolean;
  organization: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
  } | null;
  driver_license: DriverLicense | null;
  assigned_vehicle: AssignedVehicle | null;
  active_missions: ActiveMission[];
  statistics: Statistics | null;
}

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Ref pour l'input file cache
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State pour la photo de profil
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Formulaire d'édition
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: ''
  });

  // Chargement des données du profil depuis l'API
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.get('/auth/me/');
      const profileData: ProfileData = response.data;

      setProfile(profileData);
      setFormData({
        first_name: profileData.first_name || '',
        last_name: profileData.last_name || '',
        email: profileData.email || '',
        phone_number: profileData.phone_number || ''
      });

      // Mettre à jour le store
      if (setUser) {
        setUser({
          id: profileData.id,
          username: profileData.username,
          email: profileData.email,
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          role: profileData.role as 'admin' | 'supervisor' | 'driver',
          phone_number: profileData.phone_number || undefined,
          profile_picture: profileData.profile_picture || undefined,
          is_active_duty: profileData.is_active_duty,
          organization: profileData.organization || undefined
        });
      }
    } catch (err: any) {
      console.error('Erreur lors du chargement du profil:', err);
      setError(err.response?.data?.detail || 'Erreur lors du chargement du profil');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);

      const response = await apiClient.patch('/auth/me/', formData);
      const updatedProfile: ProfileData = response.data;

      setProfile(updatedProfile);
      setSuccess('Profil mis à jour avec succès');

      // Mettre à jour le store
      if (setUser) {
        setUser({
          id: updatedProfile.id,
          username: updatedProfile.username,
          email: updatedProfile.email,
          first_name: updatedProfile.first_name,
          last_name: updatedProfile.last_name,
          role: updatedProfile.role as 'admin' | 'supervisor' | 'driver',
          phone_number: updatedProfile.phone_number || undefined,
          profile_picture: updatedProfile.profile_picture || undefined,
          is_active_duty: updatedProfile.is_active_duty,
          organization: updatedProfile.organization || undefined
        });
      }

      // Masquer le message de succès après 3 secondes
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Erreur lors de la mise à jour du profil:', err);
      setError(err.response?.data?.detail || 'Erreur lors de la mise à jour du profil');
    } finally {
      setIsSaving(false);
    }
  };

  // Gestion du clic sur le bouton camera
  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  // Gestion de la selection d'image
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation du type de fichier
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Format d\'image non supporte. Utilisez JPEG, PNG ou WebP.');
      return;
    }

    // Validation de la taille (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError('La taille de l\'image ne doit pas depasser 5MB.');
      return;
    }

    // Creer un apercu de l'image
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload immédiat de la photo
    await uploadProfilePicture(file);
  };

  // Upload de la photo de profil
  const uploadProfilePicture = async (file: File) => {
    try {
      setIsUploadingPhoto(true);
      setError(null);

      const formDataToSend = new FormData();
      formDataToSend.append('profile_picture', file);

      const updatedProfile = await authApi.updateProfileWithPhoto(formDataToSend);

      // Mettre a jour le profil local
      setProfile(prev => prev ? {
        ...prev,
        profile_picture: updatedProfile.profile_picture
      } : null);

      // Mettre a jour le store
      if (setUser) {
        setUser({
          id: updatedProfile.id,
          username: updatedProfile.username,
          email: updatedProfile.email,
          first_name: updatedProfile.first_name,
          last_name: updatedProfile.last_name,
          role: updatedProfile.role as 'admin' | 'supervisor' | 'driver',
          phone_number: updatedProfile.phone_number || undefined,
          profile_picture: updatedProfile.profile_picture || undefined,
          is_active_duty: updatedProfile.is_active_duty,
          organization: updatedProfile.organization || undefined
        });
      }

      setSuccess('Photo de profil mise a jour avec succes');
      setImagePreview(null); // Effacer l'apercu car on utilise maintenant l'URL du serveur

      // Masquer le message de succes apres 3 secondes
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Erreur lors de l\'upload de la photo:', err);
      setError(err.response?.data?.profile_picture?.[0] || err.response?.data?.detail || 'Erreur lors de l\'upload de la photo');
      setImagePreview(null); // Effacer l'apercu en cas d'erreur
    } finally {
      setIsUploadingPhoto(false);
      // Reinitialiser l'input file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getRoleBadge = (role: string) => {
    const roleConfig: Record<string, { label: string; color: string; bgColor: string }> = {
      admin: { label: 'Administrateur', color: '#B87333', bgColor: '#FEF3E7' },
      supervisor: { label: 'Superviseur', color: '#6A8A82', bgColor: '#EFF5F3' },
      driver: { label: 'Chauffeur', color: '#4A90A4', bgColor: '#E8F4F8' }
    };
    return roleConfig[role] || { label: role, color: '#6B7280', bgColor: '#F3F4F6' };
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 animate-spin mx-auto mb-3 sm:mb-4" style={{ color: '#6A8A82' }} />
            <p className="text-sm sm:text-base text-gray-600">Chargement du profil...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-4xl font-bold" style={{ color: '#6A8A82' }}>
              Mon Profil
            </h1>
            <p className="text-xs sm:text-base text-gray-600 mt-1 sm:mt-2">Consultez et modifiez vos informations personnelles</p>
          </div>
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0" style={{ backgroundColor: '#6A8A82' }}>
            <User className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
        </div>

        {/* Messages d'erreur ou succès */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg sm:rounded-xl p-3 sm:p-4 flex items-center space-x-2 sm:space-x-3">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 flex-shrink-0" />
            <p className="text-xs sm:text-sm text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg sm:rounded-xl p-3 sm:p-4 flex items-center space-x-2 sm:space-x-3">
            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
            <p className="text-xs sm:text-sm text-green-700">{success}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Carte de profil */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 text-center">
              {/* Photo de profil */}
              <div className="relative inline-block mb-3 sm:mb-4">
                {/* Input file cache */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/jpeg,image/png,image/jpg,image/webp"
                  className="hidden"
                />

                {/* Affichage de la photo */}
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Apercu de la photo"
                    className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover shadow-lg"
                  />
                ) : profile?.profile_picture ? (
                  <img
                    src={profile.profile_picture}
                    alt="Photo de profil"
                    className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover shadow-lg"
                  />
                ) : (
                  <div
                    className="w-24 h-24 sm:w-32 sm:h-32 rounded-full flex items-center justify-center text-3xl sm:text-4xl font-bold text-white shadow-lg"
                    style={{ backgroundColor: '#6A8A82' }}
                  >
                    {profile?.first_name?.charAt(0) || profile?.username?.charAt(0) || 'U'}
                  </div>
                )}

                {/* Indicateur de chargement pendant l'upload */}
                {isUploadingPhoto && (
                  <div className="absolute inset-0 w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-black bg-opacity-50 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-white" />
                  </div>
                )}

                {/* Bouton pour changer la photo */}
                <button
                  onClick={handleCameraClick}
                  disabled={isUploadingPhoto}
                  className="absolute bottom-0 right-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white transition-all disabled:opacity-50 btn-primary"
                  title="Changer la photo"
                >
                  <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>

              {/* Nom et rôle */}
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-0.5 sm:mb-1">
                {profile?.full_name || profile?.username}
              </h2>
              <p className="text-sm sm:text-base text-gray-500 mb-2 sm:mb-3">@{profile?.username}</p>

              {/* Badge du rôle */}
              {profile?.role && (
                <span
                  className="inline-flex items-center px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-semibold"
                  style={{
                    backgroundColor: getRoleBadge(profile.role).bgColor,
                    color: getRoleBadge(profile.role).color
                  }}
                >
                  <Shield className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                  {getRoleBadge(profile.role).label}
                </span>
              )}

              {/* Organisation */}
              {profile?.organization && (
                <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-center space-x-2 sm:space-x-3">
                    {profile.organization.logo ? (
                      <img
                        src={profile.organization.logo}
                        alt="Logo organisation"
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: '#EFF5F3' }}
                      >
                        <Building2 className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#6A8A82' }} />
                      </div>
                    )}
                    <div className="text-left">
                      <p className="text-sm sm:text-base font-semibold text-gray-900">{profile.organization.name}</p>
                      <p className="text-xs sm:text-sm text-gray-500">Organisation</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Statut en service */}
              <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
                <div className="flex items-center justify-center space-x-2">
                  <div
                    className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${profile?.is_active_duty ? 'bg-green-500' : 'bg-gray-400'}`}
                  />
                  <span className={`text-xs sm:text-sm font-medium ${profile?.is_active_duty ? 'text-green-600' : 'text-gray-500'}`}>
                    {profile?.is_active_duty ? 'En service' : 'Hors service'}
                  </span>
                </div>
              </div>

              {/* Section Performance - Visible pour les chauffeurs */}
              {profile?.statistics && (
                <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
                  <h4 className="text-xs sm:text-sm font-semibold text-gray-500 text-center mb-3 sm:mb-4">Performance</h4>
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                    {/* Total trajets */}
                    <div className="text-center p-2 sm:p-3 rounded-lg sm:rounded-xl" style={{ backgroundColor: '#EFF5F3' }}>
                      <div className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 rounded-full flex items-center justify-center" style={{ backgroundColor: '#6A8A82' }}>
                        <Navigation className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                      </div>
                      <p className="text-base sm:text-lg font-bold text-gray-900">{profile.statistics.total_trips}</p>
                      <p className="text-[10px] sm:text-xs text-gray-500">Trajets</p>
                    </div>

                    {/* Distance totale */}
                    <div className="text-center p-2 sm:p-3 rounded-lg sm:rounded-xl" style={{ backgroundColor: '#DBEAFE' }}>
                      <div className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 rounded-full flex items-center justify-center bg-blue-500">
                        <Gauge className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                      </div>
                      <p className="text-base sm:text-lg font-bold text-gray-900">
                        {profile.statistics.total_distance >= 1000
                          ? `${(profile.statistics.total_distance / 1000).toFixed(1)}k`
                          : profile.statistics.total_distance}
                      </p>
                      <p className="text-[10px] sm:text-xs text-gray-500">Km</p>
                    </div>

                    {/* Note de performance */}
                    <div className="text-center p-2 sm:p-3 rounded-lg sm:rounded-xl" style={{ backgroundColor: '#FEF9C3' }}>
                      <div className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 rounded-full flex items-center justify-center bg-yellow-500">
                        <Star className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                      </div>
                      <p className="text-base sm:text-lg font-bold text-gray-900">{profile.statistics.rating.toFixed(1)}</p>
                      <p className="text-[10px] sm:text-xs text-gray-500">Note</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Formulaire d'édition */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-8">
              <h3 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6" style={{ color: '#6A8A82' }}>
                Informations personnelles
              </h3>

              <div className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  {/* Prénom */}
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2" style={{ color: '#6A8A82' }}>
                      <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1.5 sm:mr-2" />
                      Prénom
                    </label>
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 transition-all text-sm sm:text-base text-gray-900 placeholder-gray-400"
                      style={{ '--tw-ring-color': '#6A8A82' } as React.CSSProperties}
                      placeholder="Votre prénom"
                    />
                  </div>

                  {/* Nom */}
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2" style={{ color: '#6A8A82' }}>
                      <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1.5 sm:mr-2" />
                      Nom
                    </label>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 transition-all text-sm sm:text-base text-gray-900 placeholder-gray-400"
                      placeholder="Votre nom"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2" style={{ color: '#6A8A82' }}>
                    <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1.5 sm:mr-2" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 transition-all text-sm sm:text-base text-gray-900 placeholder-gray-400"
                    placeholder="votre.email@rewisecar.com"
                  />
                </div>

                {/* Téléphone */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2" style={{ color: '#6A8A82' }}>
                    <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1.5 sm:mr-2" />
                    Numéro de téléphone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 transition-all text-sm sm:text-base text-gray-900 placeholder-gray-400"
                    placeholder="+243 900 000 000"
                  />
                </div>

                {/* Champs en lecture seule */}
                <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4 space-y-2 sm:space-y-3">
                  <p className="text-xs sm:text-sm font-semibold text-gray-500 mb-1.5 sm:mb-2">Informations non modifiables</p>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <p className="text-[10px] sm:text-xs text-gray-500">Nom d'utilisateur</p>
                      <p className="text-sm sm:text-base font-medium text-gray-900">{profile?.username}</p>
                    </div>
                    <div>
                      <p className="text-[10px] sm:text-xs text-gray-500">Rôle</p>
                      <p className="text-sm sm:text-base font-medium text-gray-900">{getRoleBadge(profile?.role || '').label}</p>
                    </div>
                  </div>
                </div>

                {/* Bouton de sauvegarde */}
                <div className="flex justify-end pt-2 sm:pt-4">
                  <button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="flex items-center space-x-1.5 sm:space-x-2 text-white transition-all disabled:opacity-50 btn-primary"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                        <span>Enregistrement...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="hidden sm:inline">Enregistrer les modifications</span>
                        <span className="sm:hidden">Enregistrer</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Section Permis de conduire - Visible uniquement pour les chauffeurs */}
            {profile?.driver_license && (
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-8 mt-4 sm:mt-6">
                <h3 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6" style={{ color: '#6A8A82' }}>
                  <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 inline mr-1.5 sm:mr-2" />
                  Permis de conduire
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
                  {/* Numero de permis */}
                  <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                    <div className="flex items-center space-x-2 sm:space-x-3 mb-1.5 sm:mb-2">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#EFF5F3' }}>
                        <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#6A8A82' }} />
                      </div>
                      <p className="text-xs sm:text-sm text-gray-500">Numéro de permis</p>
                    </div>
                    <p className="text-sm sm:text-lg font-bold text-gray-900 ml-10 sm:ml-13">
                      {profile.driver_license.driver_license_number}
                    </p>
                  </div>

                  {/* Date d'expiration */}
                  <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                    <div className="flex items-center space-x-2 sm:space-x-3 mb-1.5 sm:mb-2">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#FEF3E7' }}>
                        <Calendar className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#B87333' }} />
                      </div>
                      <p className="text-xs sm:text-sm text-gray-500">Expiration</p>
                    </div>
                    <p className="text-sm sm:text-lg font-bold text-gray-900 ml-10 sm:ml-13">
                      {new Date(profile.driver_license.driver_license_expiry).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                    {/* Alerte si expiration proche */}
                    {(() => {
                      const expiryDate = new Date(profile.driver_license.driver_license_expiry);
                      const today = new Date();
                      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                      if (daysUntilExpiry < 0) {
                        return (
                          <p className="text-[10px] sm:text-xs text-red-600 font-semibold mt-1 ml-10 sm:ml-13">
                            Permis expiré
                          </p>
                        );
                      } else if (daysUntilExpiry <= 30) {
                        return (
                          <p className="text-[10px] sm:text-xs text-orange-600 font-semibold mt-1 ml-10 sm:ml-13">
                            Expire dans {daysUntilExpiry} jours
                          </p>
                        );
                      } else if (daysUntilExpiry <= 90) {
                        return (
                          <p className="text-[10px] sm:text-xs text-yellow-600 font-semibold mt-1 ml-10 sm:ml-13">
                            Expire dans {daysUntilExpiry} jours
                          </p>
                        );
                      }
                      return null;
                    })()}
                  </div>

                  {/* Categorie de permis */}
                  <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                    <div className="flex items-center space-x-2 sm:space-x-3 mb-1.5 sm:mb-2">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#E8F4F8' }}>
                        <Tag className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#4A90A4' }} />
                      </div>
                      <p className="text-xs sm:text-sm text-gray-500">Catégorie</p>
                    </div>
                    <p className="text-sm sm:text-lg font-bold text-gray-900 ml-10 sm:ml-13">
                      {profile.driver_license.driver_license_category}
                    </p>
                  </div>
                </div>

                {/* ID Employe et Statut */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6 mt-3 sm:mt-6">
                  <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl">
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500">ID Employé</p>
                      <p className="text-sm sm:text-base font-semibold text-gray-900">{profile.driver_license.employee_id}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl">
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500">Statut chauffeur</p>
                      <p className="text-sm sm:text-base font-semibold text-gray-900">{profile.driver_license.status_display}</p>
                    </div>
                    <span
                      className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold ${
                        profile.driver_license.status === 'available'
                          ? 'bg-green-100 text-green-700'
                          : profile.driver_license.status === 'on_mission'
                          ? 'bg-blue-100 text-blue-700'
                          : profile.driver_license.status === 'on_break'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {profile.driver_license.status_display}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Section Vehicule assigne - Visible uniquement pour les chauffeurs */}
            {profile?.assigned_vehicle && (
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-8 mt-4 sm:mt-6">
                <h3 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6" style={{ color: '#6A8A82' }}>
                  <Car className="w-4 h-4 sm:w-5 sm:h-5 inline mr-1.5 sm:mr-2" />
                  Véhicule assigné
                </h3>

                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                  {/* Photo du vehicule */}
                  <div className="sm:w-1/3">
                    {profile.assigned_vehicle.photo ? (
                      <img
                        src={profile.assigned_vehicle.photo}
                        alt={`${profile.assigned_vehicle.brand} ${profile.assigned_vehicle.model}`}
                        className="w-full h-36 sm:h-48 object-cover rounded-lg sm:rounded-xl shadow-md"
                      />
                    ) : (
                      <div
                        className="w-full h-36 sm:h-48 rounded-lg sm:rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: '#EFF5F3' }}
                      >
                        <Car className="w-12 h-12 sm:w-16 sm:h-16" style={{ color: '#6A8A82' }} />
                      </div>
                    )}
                  </div>

                  {/* Informations du vehicule */}
                  <div className="sm:w-2/3 space-y-3 sm:space-y-4">
                    {/* Marque et Modele */}
                    <div>
                      <h4 className="text-xl sm:text-2xl font-bold text-gray-900">
                        {profile.assigned_vehicle.brand} {profile.assigned_vehicle.model}
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-500">
                        {profile.assigned_vehicle.vehicle_type_display} - {profile.assigned_vehicle.year}
                      </p>
                    </div>

                    {/* Immatriculation */}
                    <div className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border-2 border-gray-300 bg-gray-50">
                      <span className="text-base sm:text-xl font-bold tracking-wider text-gray-900">
                        {profile.assigned_vehicle.license_plate}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-2 gap-2 sm:gap-4 mt-3 sm:mt-4">
                      <div className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#EFF5F3' }}>
                          <Fuel className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#6A8A82' }} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] sm:text-xs text-gray-500">Carburant</p>
                          <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">{profile.assigned_vehicle.fuel_type_display}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#FEF3E7' }}>
                          <Gauge className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#B87333' }} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] sm:text-xs text-gray-500">Kilométrage</p>
                          <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
                            {profile.assigned_vehicle.current_mileage.toLocaleString('fr-FR')} km
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#E8F4F8' }}>
                          <Tag className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#4A90A4' }} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] sm:text-xs text-gray-500">Couleur</p>
                          <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">{profile.assigned_vehicle.color}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 bg-gray-50 rounded-lg">
                        <div className="min-w-0">
                          <p className="text-[10px] sm:text-xs text-gray-500">Statut</p>
                          <span
                            className={`inline-flex px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold ${
                              profile.assigned_vehicle.status === 'available'
                                ? 'bg-green-100 text-green-700'
                                : profile.assigned_vehicle.status === 'in_use'
                                ? 'bg-blue-100 text-blue-700'
                                : profile.assigned_vehicle.status === 'maintenance'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {profile.assigned_vehicle.status_display}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Message si pas de vehicule assigne */}
            {profile?.role === 'driver' && !profile?.assigned_vehicle && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 mt-4 sm:mt-6">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <Car className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm sm:text-base font-semibold text-yellow-800">Aucun véhicule assigné</p>
                    <p className="text-xs sm:text-sm text-yellow-600">Contactez votre superviseur pour l'attribution d'un véhicule.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Section Statistiques personnelles */}
            {profile?.statistics && (
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-8 mt-4 sm:mt-6">
                <h3 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6" style={{ color: '#6A8A82' }}>
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 inline mr-1.5 sm:mr-2" />
                  Statistiques personnelles
                </h3>

                {/* Statistiques principales */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg sm:rounded-xl p-3 sm:p-4 text-center">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-1.5 sm:mb-2 rounded-full flex items-center justify-center" style={{ backgroundColor: '#6A8A82' }}>
                      <Flag className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{profile.statistics.total_missions}</p>
                    <p className="text-[10px] sm:text-sm text-gray-600">Missions</p>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg sm:rounded-xl p-3 sm:p-4 text-center">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-1.5 sm:mb-2 rounded-full flex items-center justify-center bg-blue-500">
                      <Navigation className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{profile.statistics.total_distance >= 1000 ? `${(profile.statistics.total_distance / 1000).toFixed(0)}k` : profile.statistics.total_distance}</p>
                    <p className="text-[10px] sm:text-sm text-gray-600">Km</p>
                  </div>

                  <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg sm:rounded-xl p-3 sm:p-4 text-center">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-1.5 sm:mb-2 rounded-full flex items-center justify-center bg-yellow-500">
                      <Star className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{profile.statistics.rating.toFixed(1)}</p>
                    <p className="text-[10px] sm:text-sm text-gray-600">Note</p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg sm:rounded-xl p-3 sm:p-4 text-center">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-1.5 sm:mb-2 rounded-full flex items-center justify-center bg-purple-500">
                      <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{profile.statistics.success_rate}%</p>
                    <p className="text-[10px] sm:text-sm text-gray-600">Réussite</p>
                  </div>
                </div>

                {/* Statistiques détaillées */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex justify-between items-center p-2.5 sm:p-3 bg-gray-50 rounded-lg">
                      <span className="text-xs sm:text-sm text-gray-600">Missions ce mois</span>
                      <span className="text-sm sm:text-base font-bold text-gray-900">{profile.statistics.missions_this_month}</span>
                    </div>
                    <div className="flex justify-between items-center p-2.5 sm:p-3 bg-gray-50 rounded-lg">
                      <span className="text-xs sm:text-sm text-gray-600">Missions terminées</span>
                      <span className="text-sm sm:text-base font-bold text-green-600">{profile.statistics.completed_missions}</span>
                    </div>
                    <div className="flex justify-between items-center p-2.5 sm:p-3 bg-gray-50 rounded-lg">
                      <span className="text-xs sm:text-sm text-gray-600">Missions annulées</span>
                      <span className="text-sm sm:text-base font-bold text-red-600">{profile.statistics.cancelled_missions}</span>
                    </div>
                  </div>

                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex justify-between items-center p-2.5 sm:p-3 bg-gray-50 rounded-lg">
                      <span className="text-xs sm:text-sm text-gray-600">Distance ce mois</span>
                      <span className="text-sm sm:text-base font-bold text-gray-900">{profile.statistics.distance_this_month.toLocaleString('fr-FR')} km</span>
                    </div>
                    <div className="flex justify-between items-center p-2.5 sm:p-3 bg-gray-50 rounded-lg">
                      <span className="text-xs sm:text-sm text-gray-600">Vitesse moyenne</span>
                      <span className="text-sm sm:text-base font-bold text-gray-900">{profile.statistics.average_speed.toFixed(1)} km/h</span>
                    </div>
                    <div className="flex justify-between items-center p-2.5 sm:p-3 bg-gray-50 rounded-lg">
                      <span className="text-xs sm:text-sm text-gray-600">Carburant consommé</span>
                      <span className="text-sm sm:text-base font-bold text-gray-900">{profile.statistics.total_fuel_consumed.toFixed(1)} L</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Section Missions actives */}
            {profile?.active_missions && profile.active_missions.length > 0 && (
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-8 mt-4 sm:mt-6">
                <h3 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6" style={{ color: '#6A8A82' }}>
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5 inline mr-1.5 sm:mr-2" />
                  Missions actives ({profile.active_missions.length})
                </h3>

                <div className="space-y-3 sm:space-y-4">
                  {profile.active_missions.map((mission) => (
                    <div
                      key={mission.id}
                      className="border border-gray-200 rounded-lg sm:rounded-xl p-3 sm:p-4 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between mb-2 sm:mb-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center flex-wrap gap-1.5 sm:gap-2">
                            <span className="text-sm sm:text-base font-bold text-gray-900">{mission.mission_code}</span>
                            <span
                              className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold ${
                                mission.status === 'in_progress'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}
                            >
                              {mission.status_display}
                            </span>
                            <span
                              className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold ${
                                mission.priority === 'urgent'
                                  ? 'bg-red-100 text-red-700'
                                  : mission.priority === 'high'
                                  ? 'bg-orange-100 text-orange-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {mission.priority_display}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1 truncate">{mission.title}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                        <div className="flex items-start space-x-2">
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500 mt-1.5 sm:mt-2 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-gray-500 text-[10px] sm:text-xs">Départ</p>
                            <p className="text-gray-900 truncate">{mission.origin_address}</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-2">
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-500 mt-1.5 sm:mt-2 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-gray-500 text-[10px] sm:text-xs">Destination</p>
                            <p className="text-gray-900 truncate">{mission.destination_address}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-100">
                        <div className="flex items-center space-x-2 sm:space-x-4 text-[10px] sm:text-sm text-gray-500">
                          <span className="flex items-center">
                            <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1" />
                            {new Date(mission.scheduled_start).toLocaleString('fr-FR', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          <span className="flex items-center">
                            <Navigation className="w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1" />
                            {mission.estimated_distance} km
                          </span>
                        </div>
                        {mission.status === 'assigned' && (
                          <button
                            className="flex items-center space-x-1 text-white btn-primary"
                          >
                            <Play className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span>Démarrer</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions rapides */}
            {profile?.role === 'driver' && (
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-8 mt-4 sm:mt-6">
                <h3 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6" style={{ color: '#6A8A82' }}>
                  Actions rapides
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                  <button
                    className="flex flex-col items-center p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 border-gray-200 hover:border-green-500 hover:bg-green-50 transition-all group"
                    onClick={() => window.location.href = '/missions'}
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mb-1.5 sm:mb-2 group-hover:scale-110 transition-transform" style={{ backgroundColor: '#EFF5F3' }}>
                      <MapPin className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: '#6A8A82' }} />
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-gray-700 text-center">Mes missions</span>
                  </button>

                  <button
                    className="flex flex-col items-center p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all group"
                    onClick={() => window.location.href = '/tracking'}
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mb-1.5 sm:mb-2 bg-blue-100 group-hover:scale-110 transition-transform">
                      <Navigation className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-gray-700 text-center">Suivi GPS</span>
                  </button>

                  <button
                    className="flex flex-col items-center p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 border-gray-200 hover:border-orange-500 hover:bg-orange-50 transition-all group"
                    onClick={() => window.location.href = '/incidents'}
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mb-1.5 sm:mb-2 bg-orange-100 group-hover:scale-110 transition-transform">
                      <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-gray-700 text-center">Incident</span>
                  </button>

                  <button
                    className="flex flex-col items-center p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 border-gray-200 hover:border-purple-500 hover:bg-purple-50 transition-all group"
                    onClick={() => window.location.href = '/reports'}
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mb-1.5 sm:mb-2 bg-purple-100 group-hover:scale-110 transition-transform">
                      <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-gray-700 text-center">Rapports</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
