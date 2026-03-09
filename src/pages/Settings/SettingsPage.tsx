import Layout from '@/components/Layout/Layout';
import {
  Bell,
  Shield,
  Palette,
  Globe,
  Database,
  Mail,
  Lock,
  Phone,
  MapPin,
  Save,
  Settings as SettingsIcon,
  Ruler,
  Loader2,
  Check,
  AlertTriangle,
  RefreshCw,
  X,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSettingsStore } from '@/store/settingsStore';
import { useAuthStore } from '@/store/authStore';
import { apiClient } from '@/api/client';
import { authApi } from '@/api/auth';
import { useTranslation } from '@/i18n';
import { useNavigate } from 'react-router-dom';
import type { DistanceUnit, FuelUnit, Currency, Language, Theme, DateFormat } from '@/api/settings';

export default function SettingsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('units');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Password change modal state
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Delete account modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const { preferences, isLoading, fetchPreferences, updatePreferences } = useSettingsStore();
  const { logoutSilent } = useAuthStore();
  const navigate = useNavigate();

  // Local state for form
  const [units, setUnits] = useState({
    distance_unit: 'km' as DistanceUnit,
    fuel_unit: 'liters' as FuelUnit,
    currency: 'USD' as Currency,
  });

  const [language, setLanguage] = useState({
    language: 'fr' as Language,
    timezone: 'Africa/Kinshasa',
    date_format: 'DD/MM/YYYY' as DateFormat,
  });

  const [notifications, setNotifications] = useState({
    email_notifications: true,
    sms_notifications: false,
    push_notifications: true,
    maintenance_alerts: true,
    incident_alerts: true,
    fuel_alerts: true,
    report_reminders: true,
    daily_summary: false,
    weekly_summary: true,
  });

  const [appearance, setAppearance] = useState({
    theme: 'light' as Theme,
    primary_color: '#6A8A82',
    secondary_color: '#B87333',
  });

  // Fetch preferences on mount
  useEffect(() => {
    fetchPreferences();
  }, []);

  // Update local state when preferences are loaded
  useEffect(() => {
    if (preferences) {
      setUnits({
        distance_unit: preferences.distance_unit,
        fuel_unit: preferences.fuel_unit,
        currency: preferences.currency,
      });
      setLanguage({
        language: preferences.language,
        timezone: preferences.timezone,
        date_format: preferences.date_format,
      });
      setNotifications({
        email_notifications: preferences.email_notifications,
        sms_notifications: preferences.sms_notifications,
        push_notifications: preferences.push_notifications,
        maintenance_alerts: preferences.maintenance_alerts,
        incident_alerts: preferences.incident_alerts,
        fuel_alerts: preferences.fuel_alerts,
        report_reminders: preferences.report_reminders,
        daily_summary: preferences.daily_summary,
        weekly_summary: preferences.weekly_summary,
      });
      setAppearance({
        theme: preferences.theme,
        primary_color: preferences.primary_color || '#6A8A82',
        secondary_color: preferences.secondary_color || '#B87333',
      });
    }
  }, [preferences]);

  const handleSave = async (data: any) => {
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError(null);
    try {
      await updatePreferences(data);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err.response?.data?.detail || 'Erreur lors de la sauvegarde');
      setTimeout(() => setSaveError(null), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveUnits = () => handleSave(units);
  const handleSaveLanguage = () => handleSave(language);
  const handleSaveNotifications = () => handleSave(notifications);
  const handleSaveAppearance = () => handleSave(appearance);

  const handleChangePassword = async () => {
    // Validation
    if (!passwordForm.old_password || !passwordForm.new_password || !passwordForm.confirm_password) {
      setPasswordError('Veuillez remplir tous les champs');
      return;
    }

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError('Les mots de passe ne correspondent pas');
      return;
    }

    if (passwordForm.new_password.length < 8) {
      setPasswordError('Le nouveau mot de passe doit contenir au moins 8 caractères');
      return;
    }

    setIsChangingPassword(true);
    setPasswordError(null);
    setPasswordSuccess(false);

    try {
      await apiClient.post('/auth/change-password/', {
        old_password: passwordForm.old_password,
        new_password: passwordForm.new_password,
      });
      setPasswordSuccess(true);
      setPasswordForm({ old_password: '', new_password: '', confirm_password: '' });
      setTimeout(() => {
        setIsPasswordModalOpen(false);
        setPasswordSuccess(false);
      }, 2000);
    } catch (err: any) {
      setPasswordError(err.response?.data?.old_password?.[0] || err.response?.data?.detail || 'Erreur lors du changement de mot de passe');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const closePasswordModal = () => {
    setIsPasswordModalOpen(false);
    setPasswordForm({ old_password: '', new_password: '', confirm_password: '' });
    setPasswordError(null);
    setPasswordSuccess(false);
  };

  const handleDeleteAccount = async () => {
    // Validation
    if (deleteConfirmText !== 'SUPPRIMER') {
      setDeleteError('Veuillez taper "SUPPRIMER" pour confirmer');
      return;
    }

    if (!deletePassword) {
      setDeleteError('Veuillez entrer votre mot de passe');
      return;
    }

    setIsDeletingAccount(true);
    setDeleteError(null);

    try {
      await authApi.deleteAccount(deletePassword);
      // Logout and redirect to login
      logoutSilent();
      navigate('/login', {
        replace: true,
        state: { reason: 'account_deleted' }
      });
    } catch (err: any) {
      setDeleteError(err.response?.data?.error || 'Erreur lors de la suppression du compte');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeletePassword('');
    setDeleteConfirmText('');
    setDeleteError(null);
    setShowDeletePassword(false);
  };

  const tabs = [
    { id: 'units', labelKey: 'settings.units', icon: Ruler },
    { id: 'language', labelKey: 'settings.language', icon: Globe },
    { id: 'notifications', labelKey: 'settings.notifications', icon: Bell },
    { id: 'appearance', labelKey: 'settings.appearance', icon: Palette },
    { id: 'security', labelKey: 'settings.security', icon: Shield },
  ];

  if (isLoading && !preferences) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12 sm:py-20">
          <div className="flex flex-col items-center space-y-3 sm:space-y-4">
            <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 animate-spin" style={{ color: '#6A8A82' }} />
            <p className="text-sm sm:text-base text-gray-600 font-medium">{t('common.loading')}</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold" style={{ color: '#6A8A82' }}>
              {t('settings.title')}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">{t('settings.subtitle')}</p>
          </div>
          <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg" style={{ backgroundColor: '#6A8A82' }}>
            <SettingsIcon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
          </div>
        </div>

        {/* Success/Error Messages */}
        {saveSuccess && (
          <div className="bg-green-50 border-2 border-green-200 rounded-lg sm:rounded-xl p-3 sm:p-4 flex items-center space-x-2 sm:space-x-3">
            <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
            <span className="text-xs sm:text-sm text-green-700 font-medium">{t('settings.savedSuccess')}</span>
          </div>
        )}
        {saveError && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg sm:rounded-xl p-3 sm:p-4 flex items-center space-x-2 sm:space-x-3">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 flex-shrink-0" />
            <span className="text-xs sm:text-sm text-red-700 font-medium">{saveError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Sidebar Tabs - Horizontal scroll on mobile */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-2 sm:p-4">
              {/* Mobile: Horizontal scrollable tabs */}
              <div className="flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 lg:space-y-2 scrollbar-hide">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl transition-all whitespace-nowrap flex-shrink-0 lg:flex-shrink lg:w-full ${
                        isActive ? 'shadow-md' : 'hover:bg-gray-50'
                      }`}
                      style={isActive ? { backgroundColor: '#6A8A82', color: '#ffffff' } : { color: '#1f2937' }}
                    >
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="text-sm sm:text-base font-medium">{t(tab.labelKey)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 md:p-8">

              {/* Units Tab */}
              {activeTab === 'units' && (
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2" style={{ color: '#6A8A82' }}>
                      {t('settings.units')}
                    </h2>
                    <p className="text-sm sm:text-base text-gray-600">{t('settings.unitsSubtitle')}</p>
                  </div>

                  <div className="space-y-4 sm:space-y-6">
                    {/* Distance Unit */}
                    <div className="p-4 sm:p-6 bg-gray-50 rounded-xl">
                      <h3 className="font-bold text-base sm:text-lg mb-3 sm:mb-4" style={{ color: '#6A8A82' }}>
                        <Ruler className="w-4 h-4 sm:w-5 sm:h-5 inline mr-2" />
                        {t('settings.distanceUnit')}
                      </h3>
                      <div className="grid grid-cols-2 gap-2 sm:gap-4">
                        <button
                          onClick={() => setUnits({ ...units, distance_unit: 'km' })}
                          className={`p-3 sm:p-6 bg-white rounded-lg sm:rounded-xl cursor-pointer hover:shadow-lg transition-all ${
                            units.distance_unit === 'km' ? 'border-2 sm:border-4 shadow-md' : 'border-2 border-gray-200'
                          }`}
                          style={units.distance_unit === 'km' ? { borderColor: '#6A8A82' } : {}}
                        >
                          <div className="text-center">
                            <span className="text-2xl sm:text-4xl font-bold" style={{ color: '#6A8A82' }}>km</span>
                            <p className="text-xs sm:text-base text-gray-600 mt-1 sm:mt-2">{t('settings.kilometers')}</p>
                            {units.distance_unit === 'km' && (
                              <div className="mt-2 sm:mt-3 flex items-center justify-center text-xs sm:text-sm font-semibold" style={{ color: '#6A8A82' }}>
                                <Check className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> {t('common.active')}
                              </div>
                            )}
                          </div>
                        </button>
                        <button
                          onClick={() => setUnits({ ...units, distance_unit: 'miles' })}
                          className={`p-3 sm:p-6 bg-white rounded-lg sm:rounded-xl cursor-pointer hover:shadow-lg transition-all ${
                            units.distance_unit === 'miles' ? 'border-2 sm:border-4 shadow-md' : 'border-2 border-gray-200'
                          }`}
                          style={units.distance_unit === 'miles' ? { borderColor: '#6A8A82' } : {}}
                        >
                          <div className="text-center">
                            <span className="text-2xl sm:text-4xl font-bold" style={{ color: '#B87333' }}>mi</span>
                            <p className="text-xs sm:text-base text-gray-600 mt-1 sm:mt-2">{t('settings.miles')}</p>
                            {units.distance_unit === 'miles' && (
                              <div className="mt-2 sm:mt-3 flex items-center justify-center text-xs sm:text-sm font-semibold" style={{ color: '#6A8A82' }}>
                                <Check className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> {t('common.active')}
                              </div>
                            )}
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Fuel Unit */}
                    <div className="p-4 sm:p-6 bg-gray-50 rounded-xl">
                      <h3 className="font-bold text-base sm:text-lg mb-3 sm:mb-4" style={{ color: '#6A8A82' }}>
                        <Database className="w-4 h-4 sm:w-5 sm:h-5 inline mr-2" />
                        Unité de carburant
                      </h3>
                      <div className="grid grid-cols-2 gap-2 sm:gap-4">
                        <button
                          onClick={() => setUnits({ ...units, fuel_unit: 'liters' })}
                          className={`p-3 sm:p-6 bg-white rounded-lg sm:rounded-xl cursor-pointer hover:shadow-lg transition-all ${
                            units.fuel_unit === 'liters' ? 'border-2 sm:border-4 shadow-md' : 'border-2 border-gray-200'
                          }`}
                          style={units.fuel_unit === 'liters' ? { borderColor: '#6A8A82' } : {}}
                        >
                          <div className="text-center">
                            <span className="text-2xl sm:text-4xl font-bold" style={{ color: '#6A8A82' }}>L</span>
                            <p className="text-xs sm:text-base text-gray-600 mt-1 sm:mt-2">Litres</p>
                            {units.fuel_unit === 'liters' && (
                              <div className="mt-2 sm:mt-3 flex items-center justify-center text-xs sm:text-sm font-semibold" style={{ color: '#6A8A82' }}>
                                <Check className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> Actif
                              </div>
                            )}
                          </div>
                        </button>
                        <button
                          onClick={() => setUnits({ ...units, fuel_unit: 'gallons' })}
                          className={`p-3 sm:p-6 bg-white rounded-lg sm:rounded-xl cursor-pointer hover:shadow-lg transition-all ${
                            units.fuel_unit === 'gallons' ? 'border-2 sm:border-4 shadow-md' : 'border-2 border-gray-200'
                          }`}
                          style={units.fuel_unit === 'gallons' ? { borderColor: '#6A8A82' } : {}}
                        >
                          <div className="text-center">
                            <span className="text-2xl sm:text-4xl font-bold" style={{ color: '#B87333' }}>gal</span>
                            <p className="text-xs sm:text-base text-gray-600 mt-1 sm:mt-2">Gallons</p>
                            {units.fuel_unit === 'gallons' && (
                              <div className="mt-2 sm:mt-3 flex items-center justify-center text-xs sm:text-sm font-semibold" style={{ color: '#6A8A82' }}>
                                <Check className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> Actif
                              </div>
                            )}
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Currency */}
                    <div className="p-4 sm:p-6 bg-gray-50 rounded-xl">
                      <h3 className="font-bold text-base sm:text-lg mb-3 sm:mb-4" style={{ color: '#6A8A82' }}>
                        💰 Devise
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4">
                        {[
                          { value: 'USD', label: 'Dollar US', symbol: '$' },
                          { value: 'EUR', label: 'Euro', symbol: '€' },
                          { value: 'CDF', label: 'Franc congolais', symbol: 'FC' },
                          { value: 'XAF', label: 'Franc CFA', symbol: 'FCFA' },
                          { value: 'GBP', label: 'Livre sterling', symbol: '£' },
                        ].map((currency) => (
                          <button
                            key={currency.value}
                            onClick={() => setUnits({ ...units, currency: currency.value as Currency })}
                            className={`p-2 sm:p-4 bg-white rounded-lg sm:rounded-xl cursor-pointer hover:shadow-lg transition-all ${
                              units.currency === currency.value ? 'border-2 sm:border-4 shadow-md' : 'border-2 border-gray-200'
                            }`}
                            style={units.currency === currency.value ? { borderColor: '#6A8A82' } : {}}
                          >
                            <div className="text-center">
                              <span className="text-lg sm:text-2xl font-bold" style={{ color: units.currency === currency.value ? '#6A8A82' : '#B87333' }}>
                                {currency.symbol}
                              </span>
                              <p className="text-gray-600 mt-1 text-xs sm:text-sm truncate">{currency.label}</p>
                              {units.currency === currency.value && (
                                <div className="mt-1 sm:mt-2 flex items-center justify-center text-xs font-semibold" style={{ color: '#6A8A82' }}>
                                  <Check className="w-3 h-3 mr-1" /> Actif
                                </div>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleSaveUnits}
                      disabled={isSaving}
                      className="flex items-center space-x-2 text-white transition-all disabled:opacity-50 btn-primary"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                          <span>Enregistrement...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5" />
                          <span>Enregistrer les modifications</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Language Tab */}
              {activeTab === 'language' && (
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2" style={{ color: '#6A8A82' }}>
                      {t('settings.language')}
                    </h2>
                    <p className="text-sm sm:text-base text-gray-600">{t('settings.languageSubtitle')}</p>
                  </div>

                  <div className="space-y-4 sm:space-y-6">
                    {/* Language Selection */}
                    <div className="p-4 sm:p-6 bg-gray-50 rounded-xl">
                      <h3 className="font-bold text-base sm:text-lg mb-3 sm:mb-4" style={{ color: '#6A8A82' }}>
                        <Globe className="w-4 h-4 sm:w-5 sm:h-5 inline mr-2" />
                        {t('settings.interfaceLanguage')}
                      </h3>
                      <div className="grid grid-cols-2 gap-2 sm:gap-4">
                        {[
                          { value: 'fr', label: 'Français', flag: '🇫🇷' },
                          { value: 'en', label: 'English', flag: '🇬🇧' },
                        ].map((lang) => (
                          <button
                            key={lang.value}
                            onClick={() => setLanguage({ ...language, language: lang.value as Language })}
                            className={`p-3 sm:p-4 bg-white rounded-lg sm:rounded-xl cursor-pointer hover:shadow-lg transition-all ${
                              language.language === lang.value ? 'border-2 sm:border-4 shadow-md' : 'border-2 border-gray-200'
                            }`}
                            style={language.language === lang.value ? { borderColor: '#6A8A82' } : {}}
                          >
                            <div className="text-center">
                              <span className="text-2xl sm:text-3xl">{lang.flag}</span>
                              <p className="font-semibold text-sm sm:text-base mt-1 sm:mt-2" style={{ color: '#6A8A82' }}>{lang.label}</p>
                              {language.language === lang.value && (
                                <div className="mt-1 sm:mt-2 flex items-center justify-center text-xs sm:text-sm font-semibold" style={{ color: '#6A8A82' }}>
                                  <Check className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> {t('common.active')}
                                </div>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Timezone */}
                    <div className="p-4 sm:p-6 bg-gray-50 rounded-xl">
                      <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2" style={{ color: '#6A8A82' }}>
                        <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1.5 sm:mr-2" />
                        {t('settings.timezone')}
                      </label>
                      <select
                        value={language.timezone}
                        onChange={(e) => setLanguage({ ...language, timezone: e.target.value })}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 transition-all bg-white text-sm sm:text-base text-gray-900 font-medium cursor-pointer"
                        style={{ borderColor: '#6A8A82' }}
                      >
                        <option value="Africa/Kinshasa">Kinshasa (WAT - UTC+1)</option>
                        <option value="Africa/Lubumbashi">Lubumbashi (CAT - UTC+2)</option>
                        <option value="Europe/Paris">Paris (CET - UTC+1)</option>
                        <option value="UTC">UTC</option>
                      </select>
                    </div>

                    {/* Date Format */}
                    <div className="p-4 sm:p-6 bg-gray-50 rounded-xl">
                      <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2" style={{ color: '#6A8A82' }}>
                        Format de date
                      </label>
                      <select
                        value={language.date_format}
                        onChange={(e) => setLanguage({ ...language, date_format: e.target.value as DateFormat })}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 transition-all bg-white text-sm sm:text-base text-gray-900 font-medium cursor-pointer"
                        style={{ borderColor: '#6A8A82' }}
                      >
                        <option value="DD/MM/YYYY">DD/MM/YYYY (21/01/2026)</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY (01/21/2026)</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD (2026-01-21)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleSaveLanguage}
                      disabled={isSaving}
                      className="flex items-center space-x-2 text-white transition-all disabled:opacity-50 btn-primary"
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
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2" style={{ color: '#6A8A82' }}>
                      Préférences de notification
                    </h2>
                    <p className="text-sm sm:text-base text-gray-600">Choisissez comment vous souhaitez être notifié</p>
                  </div>

                  <div className="space-y-4 sm:space-y-6">
                    {/* Channels */}
                    <div className="p-4 sm:p-6 bg-gray-50 rounded-xl">
                      <h3 className="font-bold text-base sm:text-lg mb-3 sm:mb-4" style={{ color: '#6A8A82' }}>Canaux de notification</h3>
                      <div className="space-y-3 sm:space-y-4">
                        {[
                          { key: 'email_notifications', label: 'Notifications par email', description: 'Recevoir des notifications par email', icon: Mail },
                          { key: 'sms_notifications', label: 'Notifications par SMS', description: 'Recevoir des alertes par SMS', icon: Phone },
                          { key: 'push_notifications', label: 'Notifications push', description: 'Notifications dans le navigateur', icon: Bell },
                        ].map((item) => {
                          const Icon = item.icon;
                          return (
                            <div key={item.key} className="flex items-center justify-between p-3 sm:p-4 bg-white rounded-lg sm:rounded-xl hover:shadow-md transition-all gap-3">
                              <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#E8EFED' }}>
                                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#6A8A82' }} />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-sm sm:text-base truncate" style={{ color: '#191919' }}>{item.label}</p>
                                  <p className="text-[10px] sm:text-sm text-gray-600 truncate">{item.description}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key as keyof typeof notifications] })}
                                className={`relative w-11 sm:w-14 h-6 sm:h-7 rounded-full transition-all flex-shrink-0 ${
                                  notifications[item.key as keyof typeof notifications] ? 'shadow-md' : 'bg-gray-300'
                                }`}
                                style={notifications[item.key as keyof typeof notifications] ? { backgroundColor: '#6A8A82' } : {}}
                              >
                                <div
                                  className={`absolute top-0.5 sm:top-1 left-0.5 sm:left-1 w-5 h-5 bg-white rounded-full transition-transform shadow ${
                                    notifications[item.key as keyof typeof notifications] ? 'translate-x-5 sm:translate-x-7' : ''
                                  }`}
                                />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Alert Types */}
                    <div className="p-4 sm:p-6 bg-gray-50 rounded-xl">
                      <h3 className="font-bold text-base sm:text-lg mb-3 sm:mb-4" style={{ color: '#6A8A82' }}>Types d'alertes</h3>
                      <div className="space-y-3 sm:space-y-4">
                        {[
                          { key: 'maintenance_alerts', label: 'Alertes maintenance', description: 'Maintenances à venir' },
                          { key: 'incident_alerts', label: 'Alertes incidents', description: 'Notifications immédiates' },
                          { key: 'fuel_alerts', label: 'Alertes carburant', description: 'Niveaux de carburant bas' },
                          { key: 'report_reminders', label: 'Rappels rapports', description: 'Consulter vos rapports' },
                        ].map((item) => (
                          <div key={item.key} className="flex items-center justify-between p-3 sm:p-4 bg-white rounded-lg sm:rounded-xl hover:shadow-md transition-all gap-3">
                            <div className="min-w-0">
                              <p className="font-semibold text-sm sm:text-base truncate" style={{ color: '#191919' }}>{item.label}</p>
                              <p className="text-[10px] sm:text-sm text-gray-600 truncate">{item.description}</p>
                            </div>
                            <button
                              onClick={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key as keyof typeof notifications] })}
                              className={`relative w-11 sm:w-14 h-6 sm:h-7 rounded-full transition-all flex-shrink-0 ${
                                notifications[item.key as keyof typeof notifications] ? 'shadow-md' : 'bg-gray-300'
                              }`}
                              style={notifications[item.key as keyof typeof notifications] ? { backgroundColor: '#6A8A82' } : {}}
                            >
                              <div
                                className={`absolute top-0.5 sm:top-1 left-0.5 sm:left-1 w-5 h-5 bg-white rounded-full transition-transform shadow ${
                                  notifications[item.key as keyof typeof notifications] ? 'translate-x-5 sm:translate-x-7' : ''
                                }`}
                              />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Summaries */}
                    <div className="p-4 sm:p-6 bg-gray-50 rounded-xl">
                      <h3 className="font-bold text-base sm:text-lg mb-3 sm:mb-4" style={{ color: '#6A8A82' }}>Résumés périodiques</h3>
                      <div className="space-y-3 sm:space-y-4">
                        {[
                          { key: 'daily_summary', label: 'Résumé quotidien', description: 'Recevoir un résumé chaque jour' },
                          { key: 'weekly_summary', label: 'Résumé hebdomadaire', description: 'Recevoir un résumé chaque semaine' },
                        ].map((item) => (
                          <div key={item.key} className="flex items-center justify-between p-3 sm:p-4 bg-white rounded-lg sm:rounded-xl hover:shadow-md transition-all gap-3">
                            <div className="min-w-0">
                              <p className="font-semibold text-sm sm:text-base truncate" style={{ color: '#191919' }}>{item.label}</p>
                              <p className="text-[10px] sm:text-sm text-gray-600 truncate">{item.description}</p>
                            </div>
                            <button
                              onClick={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key as keyof typeof notifications] })}
                              className={`relative w-11 sm:w-14 h-6 sm:h-7 rounded-full transition-all flex-shrink-0 ${
                                notifications[item.key as keyof typeof notifications] ? 'shadow-md' : 'bg-gray-300'
                              }`}
                              style={notifications[item.key as keyof typeof notifications] ? { backgroundColor: '#6A8A82' } : {}}
                            >
                              <div
                                className={`absolute top-0.5 sm:top-1 left-0.5 sm:left-1 w-5 h-5 bg-white rounded-full transition-transform shadow ${
                                  notifications[item.key as keyof typeof notifications] ? 'translate-x-5 sm:translate-x-7' : ''
                                }`}
                              />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleSaveNotifications}
                      disabled={isSaving}
                      className="flex items-center space-x-2 text-white transition-all disabled:opacity-50 btn-primary"
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
              )}

              {/* Appearance Tab */}
              {activeTab === 'appearance' && (
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2" style={{ color: appearance.primary_color }}>
                      Apparence
                    </h2>
                    <p className="text-sm sm:text-base text-gray-600">Personnalisez l'apparence de votre interface</p>
                  </div>

                  {/* Theme Selection */}
                  <div className="p-4 sm:p-6 bg-gray-50 rounded-xl">
                    <h3 className="font-bold text-base sm:text-lg mb-3 sm:mb-4" style={{ color: appearance.primary_color }}>Thème</h3>
                    <div className="grid grid-cols-3 gap-2 sm:gap-4">
                      <button
                        onClick={() => setAppearance({ ...appearance, theme: 'light' })}
                        className={`p-3 sm:p-6 bg-white rounded-lg sm:rounded-xl cursor-pointer hover:shadow-lg transition-all ${
                          appearance.theme === 'light' ? 'border-2 sm:border-4 shadow-md' : 'border-2 border-gray-200'
                        }`}
                        style={appearance.theme === 'light' ? { borderColor: appearance.primary_color } : {}}
                      >
                        <div className="text-center">
                          <div className="w-10 h-10 sm:w-16 sm:h-16 mx-auto rounded-lg sm:rounded-xl bg-white border-2 border-gray-200 flex items-center justify-center">
                            <div className="w-5 h-5 sm:w-8 sm:h-8 rounded-md sm:rounded-lg" style={{ backgroundColor: appearance.primary_color }} />
                          </div>
                          <p className="font-semibold text-xs sm:text-base mt-2 sm:mt-3">Clair</p>
                          {appearance.theme === 'light' && (
                            <div className="mt-1 sm:mt-2 flex items-center justify-center text-[10px] sm:text-sm font-semibold" style={{ color: appearance.primary_color }}>
                              <Check className="w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1" /> Actif
                            </div>
                          )}
                        </div>
                      </button>

                      <button
                        onClick={() => setAppearance({ ...appearance, theme: 'dark' })}
                        className={`p-3 sm:p-6 bg-white rounded-lg sm:rounded-xl cursor-pointer hover:shadow-lg transition-all ${
                          appearance.theme === 'dark' ? 'border-2 sm:border-4 shadow-md' : 'border-2 border-gray-200'
                        }`}
                        style={appearance.theme === 'dark' ? { borderColor: appearance.primary_color } : {}}
                      >
                        <div className="text-center">
                          <div className="w-10 h-10 sm:w-16 sm:h-16 mx-auto rounded-lg sm:rounded-xl bg-gray-800 flex items-center justify-center">
                            <div className="w-5 h-5 sm:w-8 sm:h-8 rounded-md sm:rounded-lg" style={{ backgroundColor: appearance.primary_color }} />
                          </div>
                          <p className="font-semibold text-xs sm:text-base mt-2 sm:mt-3">Sombre</p>
                          {appearance.theme === 'dark' && (
                            <div className="mt-1 sm:mt-2 flex items-center justify-center text-[10px] sm:text-sm font-semibold" style={{ color: appearance.primary_color }}>
                              <Check className="w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1" /> Actif
                            </div>
                          )}
                        </div>
                      </button>

                      <button
                        onClick={() => setAppearance({ ...appearance, theme: 'auto' })}
                        className={`p-3 sm:p-6 bg-white rounded-lg sm:rounded-xl cursor-pointer hover:shadow-lg transition-all ${
                          appearance.theme === 'auto' ? 'border-2 sm:border-4 shadow-md' : 'border-2 border-gray-200'
                        }`}
                        style={appearance.theme === 'auto' ? { borderColor: appearance.primary_color } : {}}
                      >
                        <div className="text-center">
                          <div className="w-10 h-10 sm:w-16 sm:h-16 mx-auto rounded-lg sm:rounded-xl bg-gradient-to-r from-white to-gray-800 border border-gray-200 flex items-center justify-center">
                            <RefreshCw className="w-4 h-4 sm:w-6 sm:h-6 text-gray-500" />
                          </div>
                          <p className="font-semibold text-xs sm:text-base mt-2 sm:mt-3">Auto</p>
                          {appearance.theme === 'auto' && (
                            <div className="mt-1 sm:mt-2 flex items-center justify-center text-[10px] sm:text-sm font-semibold" style={{ color: appearance.primary_color }}>
                              <Check className="w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1" /> Actif
                            </div>
                          )}
                        </div>
                      </button>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500 mt-3 sm:mt-4">
                      Le thème automatique s'adapte aux préférences de votre système.
                    </p>
                  </div>

                  {/* Color Customization */}
                  <div className="p-4 sm:p-6 bg-gray-50 rounded-xl">
                    <h3 className="font-bold text-base sm:text-lg mb-3 sm:mb-4" style={{ color: appearance.primary_color }}>
                      <Palette className="w-4 h-4 sm:w-5 sm:h-5 inline mr-1.5 sm:mr-2" />
                      Couleurs personnalisées
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6">
                      Choisissez les couleurs qui correspondent à votre identité visuelle.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      {/* Primary Color */}
                      <div className="p-3 sm:p-4 bg-white rounded-lg sm:rounded-xl border-2 border-gray-200">
                        <label className="block text-xs sm:text-sm font-semibold mb-2 sm:mb-3 text-gray-700">
                          Couleur principale
                        </label>
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="relative">
                            <input
                              type="color"
                              value={appearance.primary_color}
                              onChange={(e) => setAppearance({ ...appearance, primary_color: e.target.value })}
                              className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl cursor-pointer border-2 border-gray-200 p-0.5 sm:p-1"
                              style={{ backgroundColor: appearance.primary_color }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <input
                              type="text"
                              value={appearance.primary_color}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                                  setAppearance({ ...appearance, primary_color: value });
                                }
                              }}
                              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border-2 rounded-lg text-xs sm:text-sm font-mono uppercase"
                              style={{ borderColor: appearance.primary_color }}
                              placeholder="#6A8A82"
                            />
                            <p className="text-[10px] sm:text-xs text-gray-500 mt-1 hidden sm:block">
                              Utilisée pour les éléments principaux
                            </p>
                          </div>
                        </div>
                        {/* Preview */}
                        <div className="mt-3 sm:mt-4 flex items-center gap-2">
                          <span className="text-[10px] sm:text-xs text-gray-500">Aperçu:</span>
                          <button
                            className="px-2 sm:px-3 py-1 sm:py-1.5 text-white text-[10px] sm:text-xs rounded-md sm:rounded-lg font-medium"
                            style={{ backgroundColor: appearance.primary_color }}
                          >
                            Bouton
                          </button>
                          <span className="text-xs sm:text-sm font-medium" style={{ color: appearance.primary_color }}>
                            Lien
                          </span>
                        </div>
                      </div>

                      {/* Secondary Color */}
                      <div className="p-3 sm:p-4 bg-white rounded-lg sm:rounded-xl border-2 border-gray-200">
                        <label className="block text-xs sm:text-sm font-semibold mb-2 sm:mb-3 text-gray-700">
                          Couleur secondaire
                        </label>
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="relative">
                            <input
                              type="color"
                              value={appearance.secondary_color}
                              onChange={(e) => setAppearance({ ...appearance, secondary_color: e.target.value })}
                              className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl cursor-pointer border-2 border-gray-200 p-0.5 sm:p-1"
                              style={{ backgroundColor: appearance.secondary_color }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <input
                              type="text"
                              value={appearance.secondary_color}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                                  setAppearance({ ...appearance, secondary_color: value });
                                }
                              }}
                              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border-2 rounded-lg text-xs sm:text-sm font-mono uppercase"
                              style={{ borderColor: appearance.secondary_color }}
                              placeholder="#B87333"
                            />
                            <p className="text-[10px] sm:text-xs text-gray-500 mt-1 hidden sm:block">
                              Utilisée pour les accents, badges
                            </p>
                          </div>
                        </div>
                        {/* Preview */}
                        <div className="mt-3 sm:mt-4 flex items-center gap-2">
                          <span className="text-[10px] sm:text-xs text-gray-500">Aperçu:</span>
                          <span
                            className="px-1.5 sm:px-2 py-0.5 text-white text-[10px] sm:text-xs rounded-full font-medium"
                            style={{ backgroundColor: appearance.secondary_color }}
                          >
                            Badge
                          </span>
                          <span className="text-xs sm:text-sm font-medium" style={{ color: appearance.secondary_color }}>
                            Accent
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Preset Colors */}
                    <div className="mt-4 sm:mt-6">
                      <p className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">Palettes prédéfinies</p>
                      <div className="flex flex-wrap gap-2 sm:gap-3">
                        {[
                          { primary: '#6A8A82', secondary: '#B87333', name: 'Défaut' },
                          { primary: '#3B82F6', secondary: '#F59E0B', name: 'Bleu' },
                          { primary: '#8B5CF6', secondary: '#EC4899', name: 'Violet' },
                          { primary: '#059669', secondary: '#DC2626', name: 'Vert' },
                          { primary: '#0891B2', secondary: '#7C3AED', name: 'Cyan' },
                          { primary: '#374151', secondary: '#F59E0B', name: 'Gris' },
                        ].map((palette) => (
                          <button
                            key={palette.name}
                            onClick={() => setAppearance({
                              ...appearance,
                              primary_color: palette.primary,
                              secondary_color: palette.secondary,
                            })}
                            className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border-2 transition-all hover:shadow-md ${
                              appearance.primary_color === palette.primary && appearance.secondary_color === palette.secondary
                                ? 'border-gray-800 shadow-md'
                                : 'border-gray-200'
                            }`}
                          >
                            <div className="flex">
                              <div
                                className="w-4 h-4 sm:w-5 sm:h-5 rounded-l-md"
                                style={{ backgroundColor: palette.primary }}
                              />
                              <div
                                className="w-4 h-4 sm:w-5 sm:h-5 rounded-r-md"
                                style={{ backgroundColor: palette.secondary }}
                              />
                            </div>
                            <span className="text-[10px] sm:text-xs font-medium text-gray-700">{palette.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleSaveAppearance}
                      disabled={isSaving}
                      className="flex items-center space-x-2 px-4 sm:px-8 py-2.5 sm:py-3 text-white rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                      style={{ backgroundColor: appearance.primary_color }}
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
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2" style={{ color: '#6A8A82' }}>
                      Sécurité du compte
                    </h2>
                    <p className="text-sm sm:text-base text-gray-600">Gérez votre mot de passe et paramètres de sécurité</p>
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    <div className="p-4 sm:p-6 border-2 rounded-lg sm:rounded-xl" style={{ borderColor: '#6A8A82' }}>
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                        <div className="flex items-start space-x-3 sm:space-x-4">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#6A8A82' }}>
                            <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-base sm:text-lg" style={{ color: '#6A8A82' }}>Mot de passe</h3>
                            <p className="text-gray-600 text-xs sm:text-sm">Modifiez votre mot de passe régulièrement</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setIsPasswordModalOpen(true)}
                          className="text-white transition-all self-start sm:flex-shrink-0 btn-primary"
                        >
                          Modifier
                        </button>
                      </div>
                    </div>

                    <div className="p-4 sm:p-6 border-2 border-gray-200 rounded-lg sm:rounded-xl opacity-75">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                        <div className="flex items-start space-x-3 sm:space-x-4">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center bg-gray-200 flex-shrink-0">
                            <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
                          </div>
                          <div>
                            <h3 className="font-bold text-base sm:text-lg text-gray-900">Authentification 2FA</h3>
                            <p className="text-gray-600 text-xs sm:text-sm">Couche de sécurité supplémentaire</p>
                            <span className="inline-block mt-1.5 sm:mt-2 px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold rounded-full bg-amber-100 text-amber-700">
                              Bientôt disponible
                            </span>
                          </div>
                        </div>
                        <button
                          disabled
                          className="px-4 sm:px-6 py-2 sm:py-2.5 border-2 rounded-lg font-medium text-sm sm:text-base transition-all cursor-not-allowed opacity-50 self-start sm:flex-shrink-0"
                          style={{ borderColor: '#6A8A82', color: '#6A8A82' }}
                        >
                          Activer
                        </button>
                      </div>
                    </div>

                    <div className="p-4 sm:p-6 bg-red-50 border-2 border-red-200 rounded-lg sm:rounded-xl">
                      <div className="flex items-start space-x-3 sm:space-x-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center bg-red-200 flex-shrink-0">
                          <Database className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-base sm:text-lg text-red-900">Zone de danger</h3>
                          <p className="text-red-700 text-xs sm:text-sm mb-3 sm:mb-4">Actions irréversibles sur votre compte</p>
                          <button
                            onClick={() => setIsDeleteModalOpen(true)}
                            className="px-4 sm:px-6 py-2 sm:py-2.5 bg-red-600 text-white rounded-lg font-medium text-sm sm:text-base hover:bg-red-700 transition-all"
                          >
                            Supprimer le compte
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b-2 flex items-center justify-between flex-shrink-0" style={{ borderColor: '#E8ECEC' }}>
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center" style={{ backgroundColor: '#6A8A82' }}>
                  <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <h2 className="text-base sm:text-lg font-bold" style={{ color: '#191919' }}>
                  Changer le mot de passe
                </h2>
              </div>
              <button
                onClick={closePasswordModal}
                disabled={isChangingPassword}
                className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4 overflow-y-auto">
              {passwordError && (
                <div className="bg-red-50 border border-red-200 rounded-lg sm:rounded-xl p-2.5 sm:p-3 flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 flex-shrink-0" />
                  <p className="text-red-700 text-xs sm:text-sm">{passwordError}</p>
                </div>
              )}

              {passwordSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg sm:rounded-xl p-2.5 sm:p-3 flex items-center space-x-2">
                  <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
                  <p className="text-green-700 text-xs sm:text-sm">Mot de passe changé avec succès !</p>
                </div>
              )}

              {/* Old Password */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2" style={{ color: '#6A8A82' }}>
                  Mot de passe actuel
                </label>
                <div className="relative">
                  <input
                    type={showOldPassword ? 'text' : 'password'}
                    value={passwordForm.old_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, old_password: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-10 sm:pr-12 border-2 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 transition-all text-sm sm:text-base text-gray-900 placeholder-gray-400"
                    style={{ borderColor: '#E8ECEC' }}
                    placeholder="Mot de passe actuel"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700"
                  >
                    {showOldPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2" style={{ color: '#6A8A82' }}>
                  Nouveau mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordForm.new_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-10 sm:pr-12 border-2 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 transition-all text-sm sm:text-base text-gray-900 placeholder-gray-400"
                    style={{ borderColor: '#E8ECEC' }}
                    placeholder="Nouveau mot de passe"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </button>
                </div>
                <p className="text-[10px] sm:text-xs text-gray-500 mt-1">Minimum 8 caractères</p>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2" style={{ color: '#6A8A82' }}>
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordForm.confirm_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-10 sm:pr-12 border-2 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 transition-all text-sm sm:text-base text-gray-900 placeholder-gray-400"
                    style={{ borderColor: '#E8ECEC' }}
                    placeholder="Confirmer le mot de passe"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-t-2 flex items-center justify-end space-x-2 sm:space-x-3 flex-shrink-0" style={{ borderColor: '#E8ECEC', backgroundColor: '#F9FAFB' }}>
              <button
                onClick={closePasswordModal}
                disabled={isChangingPassword}
                className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base transition-all hover:bg-gray-200 disabled:opacity-50"
                style={{ backgroundColor: '#E8ECEC', color: '#6B7280' }}
              >
                Annuler
              </button>
              <button
                onClick={handleChangePassword}
                disabled={isChangingPassword}
                className="text-white transition-all disabled:opacity-50 flex items-center space-x-1.5 sm:space-x-2 btn-primary"
              >
                {isChangingPassword ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Enregistrement...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Enregistrer</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b-2 flex items-center justify-between bg-red-50 flex-shrink-0" style={{ borderColor: '#fecaca' }}>
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center bg-red-600">
                  <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <h2 className="text-base sm:text-lg font-bold text-red-900">
                  Supprimer le compte
                </h2>
              </div>
              <button
                onClick={closeDeleteModal}
                disabled={isDeletingAccount}
                className="p-1.5 sm:p-2 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4 overflow-y-auto">
              <div className="bg-red-50 border border-red-200 rounded-lg sm:rounded-xl p-3 sm:p-4">
                <p className="text-red-800 text-xs sm:text-sm font-medium">
                  Cette action est irréversible. Toutes vos données seront définitivement supprimées :
                </p>
                <ul className="mt-1.5 sm:mt-2 text-red-700 text-[10px] sm:text-sm space-y-0.5 sm:space-y-1 list-disc list-inside">
                  <li>Votre profil et préférences</li>
                  <li>Vos missions et historiques</li>
                  <li>Toutes les données associées</li>
                </ul>
              </div>

              {deleteError && (
                <div className="bg-red-50 border border-red-200 rounded-lg sm:rounded-xl p-2.5 sm:p-3 flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 flex-shrink-0" />
                  <p className="text-red-700 text-xs sm:text-sm">{deleteError}</p>
                </div>
              )}

              {/* Confirmation Text */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2 text-red-800">
                  Tapez "SUPPRIMER" pour confirmer
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition-all text-sm sm:text-base text-gray-900 placeholder-gray-400"
                  style={{ borderColor: deleteConfirmText === 'SUPPRIMER' ? '#22c55e' : '#E8ECEC' }}
                  placeholder="SUPPRIMER"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2 text-red-800">
                  Entrez votre mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showDeletePassword ? 'text' : 'password'}
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-10 sm:pr-12 border-2 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition-all text-sm sm:text-base text-gray-900 placeholder-gray-400"
                    style={{ borderColor: '#E8ECEC' }}
                    placeholder="Votre mot de passe actuel"
                  />
                  <button
                    type="button"
                    onClick={() => setShowDeletePassword(!showDeletePassword)}
                    className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700"
                  >
                    {showDeletePassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-t-2 flex items-center justify-end space-x-2 sm:space-x-3 flex-shrink-0" style={{ borderColor: '#E8ECEC', backgroundColor: '#F9FAFB' }}>
              <button
                onClick={closeDeleteModal}
                disabled={isDeletingAccount}
                className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base transition-all hover:bg-gray-200 disabled:opacity-50"
                style={{ backgroundColor: '#E8ECEC', color: '#6B7280' }}
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeletingAccount || deleteConfirmText !== 'SUPPRIMER' || !deletePassword}
                className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base text-white transition-all hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1.5 sm:space-x-2 bg-red-600"
              >
                {isDeletingAccount ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Suppression...</span>
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4" />
                    <span className="hidden sm:inline">Supprimer définitivement</span>
                    <span className="sm:hidden">Supprimer</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
