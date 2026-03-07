import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Car, Lock, Loader2, AlertCircle, CheckCircle, Eye, EyeOff, User, Phone } from 'lucide-react';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';

interface TokenData {
  email: string;
  first_name: string;
  last_name: string;
  organization_name: string;
}

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [tokenError, setTokenError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    password_confirm: '',
    phone_number: '',
  });

  // Verify token on mount
  useEffect(() => {
    if (!token) {
      setTokenError('Token manquant. Veuillez utiliser le lien complet de votre email.');
      setLoading(false);
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await authApi.signupVerifyToken(token);
        if (response.valid) {
          setTokenData(response);
          // Pre-fill username suggestion
          const suggestedUsername = `${response.first_name.toLowerCase()}.${response.last_name.toLowerCase()}`.replace(/\s+/g, '');
          setFormData(prev => ({ ...prev, username: suggestedUsername }));
        }
      } catch (err: any) {
        console.error('Token verification error:', err);
        if (err.response?.data?.errors?.token) {
          setTokenError(err.response.data.errors.token[0]);
        } else {
          setTokenError('Ce lien est invalide ou a expiré.');
        }
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setSubmitting(true);

    // Validation
    if (!formData.username.trim()) {
      setFieldErrors({ username: 'Le nom d\'utilisateur est requis' });
      setSubmitting(false);
      return;
    }

    if (formData.password.length < 8) {
      setFieldErrors({ password: 'Le mot de passe doit contenir au moins 8 caractères' });
      setSubmitting(false);
      return;
    }

    if (formData.password !== formData.password_confirm) {
      setFieldErrors({ password_confirm: 'Les mots de passe ne correspondent pas' });
      setSubmitting(false);
      return;
    }

    try {
      const response = await authApi.signupComplete({
        token: token!,
        username: formData.username,
        password: formData.password,
        password_confirm: formData.password_confirm,
        phone_number: formData.phone_number,
      });

      // Store auth tokens and user data
      login(response.access, response.refresh, response.user, response.organization);
      setSuccess(true);

      // Redirect after short delay
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err: any) {
      console.error('Signup complete error:', err);
      if (err.response?.data) {
        const data = err.response.data;
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
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" style={{ color: '#6A8A82' }} />
          <p className="text-gray-600">Vérification du lien...</p>
        </div>
      </div>
    );
  }

  // Token error state
  if (tokenError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-10" style={{ backgroundColor: '#6A8A82' }} />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-10" style={{ backgroundColor: '#B87333' }} />
        </div>

        <div className="relative z-10 w-full max-w-md px-6">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden p-8 text-center">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg bg-red-100">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>

            <h2 className="text-2xl font-bold mb-3" style={{ color: '#191919' }}>
              Lien invalide
            </h2>

            <p className="text-sm text-gray-600 mb-6">
              {tokenError}
            </p>

            <Link
              to="/signup"
              className="inline-flex items-center space-x-2 text-white transition-all duration-300 btn-primary"
            >
              <span>Recommencer l'inscription</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-10" style={{ backgroundColor: '#6A8A82' }} />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-10" style={{ backgroundColor: '#B87333' }} />
        </div>

        <div className="relative z-10 w-full max-w-md px-6">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden p-8 text-center">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg" style={{ backgroundColor: '#6A8A82' }}>
              <CheckCircle className="w-10 h-10 text-white" />
            </div>

            <h2 className="text-2xl font-bold mb-3" style={{ color: '#191919' }}>
              Compte créé !
            </h2>

            <p className="text-sm text-gray-600 mb-4">
              Bienvenue sur YaswaCar, <strong>{tokenData?.first_name}</strong> !
            </p>

            <p className="text-sm text-gray-500">
              Redirection vers le tableau de bord...
            </p>

            <Loader2 className="w-6 h-6 animate-spin mx-auto mt-4" style={{ color: '#6A8A82' }} />
          </div>
        </div>
      </div>
    );
  }

  // Main form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-10" style={{ backgroundColor: '#6A8A82' }} />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-10" style={{ backgroundColor: '#B87333' }} />
      </div>

      <div className="relative z-10 w-full max-w-md px-6">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
          {/* Header */}
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
                Finalisez votre compte
              </h2>
              <p className="text-sm text-gray-600">
                Bonjour <strong>{tokenData?.first_name}</strong>, créez votre mot de passe
              </p>
            </div>

            {/* Info card */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <div className="text-sm">
                <p><strong>Organisation:</strong> {tokenData?.organization_name}</p>
                <p><strong>Email:</strong> {tokenData?.email}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>
                  Nom d'utilisateur
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <User className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 ${fieldErrors.username ? 'border-red-400' : 'border-gray-200'} focus:outline-none transition-all text-sm text-gray-900`}
                    onFocus={(e) => !fieldErrors.username && (e.target.style.borderColor = '#6A8A82')}
                    onBlur={(e) => !fieldErrors.username && (e.target.style.borderColor = '#E5E7EB')}
                    placeholder="votre.nom"
                    required
                  />
                </div>
                {fieldErrors.username && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.username}</p>
                )}
              </div>

              {/* Phone (optional) */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>
                  Téléphone <span className="text-gray-400 font-normal">(optionnel)</span>
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Phone className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none transition-all text-sm text-gray-900"
                    onFocus={(e) => e.target.style.borderColor = '#6A8A82'}
                    onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                    placeholder="+243 xxx xxx xxx"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>
                  Mot de passe
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Lock className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full pl-12 pr-12 py-3 rounded-xl border-2 ${fieldErrors.password ? 'border-red-400' : 'border-gray-200'} focus:outline-none transition-all text-sm text-gray-900`}
                    onFocus={(e) => !fieldErrors.password && (e.target.style.borderColor = '#6A8A82')}
                    onBlur={(e) => !fieldErrors.password && (e.target.style.borderColor = '#E5E7EB')}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#191919' }}>
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Lock className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="password_confirm"
                    value={formData.password_confirm}
                    onChange={handleChange}
                    className={`w-full pl-12 pr-12 py-3 rounded-xl border-2 ${fieldErrors.password_confirm ? 'border-red-400' : 'border-gray-200'} focus:outline-none transition-all text-sm text-gray-900`}
                    onFocus={(e) => !fieldErrors.password_confirm && (e.target.style.borderColor = '#6A8A82')}
                    onBlur={(e) => !fieldErrors.password_confirm && (e.target.style.borderColor = '#E5E7EB')}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {fieldErrors.password_confirm && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.password_confirm}</p>
                )}
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
                disabled={submitting}
                className="w-full text-white transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center space-x-2 btn-primary"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Création en cours...</span>
                  </>
                ) : (
                  <span>Activer mon compte</span>
                )}
              </button>
            </form>
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
