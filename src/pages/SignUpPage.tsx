import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Car, Mail, Loader2, AlertCircle, CheckCircle, ArrowLeft, User, Building2 } from 'lucide-react';
import { authApi } from '@/api/auth';

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    organization_name: '',
  });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear field error when user types
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setLoading(true);

    // Validation basique
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setFieldErrors({ email: 'Veuillez entrer une adresse email valide' });
      setLoading(false);
      return;
    }

    if (!formData.first_name.trim()) {
      setFieldErrors({ first_name: 'Le prénom est requis' });
      setLoading(false);
      return;
    }

    if (!formData.last_name.trim()) {
      setFieldErrors({ last_name: 'Le nom est requis' });
      setLoading(false);
      return;
    }

    if (!formData.organization_name.trim()) {
      setFieldErrors({ organization_name: 'Le nom de l\'organisation est requis' });
      setLoading(false);
      return;
    }

    try {
      await authApi.signupInitiate(formData);
      setEmailSent(true);
    } catch (err: any) {
      console.error('Signup error:', err);
      if (err.response?.data) {
        const data = err.response.data;
        // Handle field-specific errors
        if (typeof data === 'object') {
          const newFieldErrors: Record<string, string> = {};
          Object.keys(data).forEach(key => {
            if (Array.isArray(data[key])) {
              newFieldErrors[key] = data[key][0];
            } else if (typeof data[key] === 'string') {
              newFieldErrors[key] = data[key];
            }
          });
          if (Object.keys(newFieldErrors).length > 0) {
            setFieldErrors(newFieldErrors);
          } else if (data.error) {
            setError(data.error);
          } else if (data.detail) {
            setError(data.detail);
          }
        }
      } else {
        setError('Une erreur est survenue. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Affichage après envoi de l'email
  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-10" style={{ backgroundColor: '#6A8A82' }} />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-10" style={{ backgroundColor: '#B87333' }} />
        </div>

        <div className="relative z-10 w-full max-w-md px-6">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
            <div className="p-8 text-center">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg" style={{ backgroundColor: '#6A8A82' }}>
                <CheckCircle className="w-10 h-10 text-white" />
              </div>

              <h2 className="text-2xl font-bold mb-3" style={{ color: '#191919' }}>
                Vérifiez votre email
              </h2>

              <p className="text-sm text-gray-600 mb-6">
                Nous avons envoyé un lien de vérification à :
              </p>

              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <p className="font-semibold" style={{ color: '#6A8A82' }}>
                  {formData.email}
                </p>
              </div>

              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
                <p className="text-sm text-gray-700">
                  Cliquez sur le lien dans l'email pour activer votre compte et créer votre mot de passe.
                </p>
              </div>

              <p className="text-xs text-gray-500 mb-6">
                Vous n'avez pas reçu l'email ? Vérifiez votre dossier spam ou{' '}
                <button
                  onClick={() => setEmailSent(false)}
                  className="font-semibold hover:underline"
                  style={{ color: '#B87333' }}
                >
                  réessayez
                </button>
              </p>

              <Link
                to="/login"
                className="inline-flex items-center space-x-2 text-white transition-all duration-300 btn-primary"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Retour à la connexion</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-10" style={{ backgroundColor: '#6A8A82' }} />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-10" style={{ backgroundColor: '#B87333' }} />
      </div>

      <div className="relative z-10 w-full max-w-md px-6">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
          {/* Header with logo */}
          <div className="relative h-32" style={{ backgroundColor: '#6A8A82' }}>
            <div className="absolute inset-0" style={{
              backgroundImage: 'linear-gradient(135deg, rgba(106, 138, 130, 0.9) 0%, rgba(184, 115, 51, 0.7) 100%)'
            }} />
            <div className="relative h-full flex flex-col items-center justify-center">
              <img src="/logo_banner.png" alt="YaswaCar" className="h-16 w-auto object-contain" />
            </div>
          </div>

          {/* Form */}
          <div className="p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2" style={{ color: '#191919' }}>
                Créer un compte
              </h2>
              <p className="text-sm text-gray-600">
                Inscrivez votre organisation
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Organization name */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>
                  Nom de l'organisation
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Building2 className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="organization_name"
                    value={formData.organization_name}
                    onChange={handleChange}
                    className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 ${fieldErrors.organization_name ? 'border-red-400' : 'border-gray-200'} focus:outline-none transition-all text-sm text-gray-900`}
                    onFocus={(e) => !fieldErrors.organization_name && (e.target.style.borderColor = '#6A8A82')}
                    onBlur={(e) => !fieldErrors.organization_name && (e.target.style.borderColor = '#E5E7EB')}
                    placeholder="Ma Société SARL"
                    required
                  />
                </div>
                {fieldErrors.organization_name && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.organization_name}</p>
                )}
              </div>

              {/* First name & Last name */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>
                    Prénom
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <User className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 ${fieldErrors.first_name ? 'border-red-400' : 'border-gray-200'} focus:outline-none transition-all text-sm text-gray-900`}
                      onFocus={(e) => !fieldErrors.first_name && (e.target.style.borderColor = '#6A8A82')}
                      onBlur={(e) => !fieldErrors.first_name && (e.target.style.borderColor = '#E5E7EB')}
                      placeholder="John"
                      required
                    />
                  </div>
                  {fieldErrors.first_name && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.first_name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>
                    Nom
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-xl border-2 ${fieldErrors.last_name ? 'border-red-400' : 'border-gray-200'} focus:outline-none transition-all text-sm text-gray-900`}
                    onFocus={(e) => !fieldErrors.last_name && (e.target.style.borderColor = '#6A8A82')}
                    onBlur={(e) => !fieldErrors.last_name && (e.target.style.borderColor = '#E5E7EB')}
                    placeholder="Doe"
                    required
                  />
                  {fieldErrors.last_name && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.last_name}</p>
                  )}
                </div>
              </div>

              {/* Email field */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>
                  Adresse email
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Mail className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 ${fieldErrors.email ? 'border-red-400' : 'border-gray-200'} focus:outline-none transition-all text-sm text-gray-900`}
                    onFocus={(e) => !fieldErrors.email && (e.target.style.borderColor = '#6A8A82')}
                    onBlur={(e) => !fieldErrors.email && (e.target.style.borderColor = '#E5E7EB')}
                    placeholder="votre.email@exemple.com"
                    required
                    autoComplete="email"
                  />
                </div>
                {fieldErrors.email && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
                )}
              </div>

              {/* Info message */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-3">
                <p className="text-xs text-gray-700">
                  Un email de vérification sera envoyé à cette adresse. Vous pourrez ensuite créer votre mot de passe.
                </p>
              </div>

              {/* Error message */}
              {error && (
                <div className="flex items-start space-x-3 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full text-white transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center space-x-2 btn-primary"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Envoi en cours...</span>
                  </>
                ) : (
                  <span>Créer mon compte</span>
                )}
              </button>
            </form>

            {/* Back to login link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Vous avez déjà un compte ?{' '}
                <Link
                  to="/login"
                  className="font-semibold hover:underline"
                  style={{ color: '#6A8A82' }}
                >
                  Se connecter
                </Link>
              </p>
            </div>

            {/* Footer */}
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                En créant un compte, vous acceptez nos conditions d'utilisation
              </p>
            </div>
          </div>
        </div>

        {/* Version info */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-500">
            YaswaCar Fleet Management v1.0
          </p>
        </div>
      </div>
    </div>
  );
}
