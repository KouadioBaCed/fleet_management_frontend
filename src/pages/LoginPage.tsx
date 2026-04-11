import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import { User, Lock, AlertCircle, Loader2, Eye, EyeOff, Shield, Clock, CheckCircle, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState<'credentials' | 'role' | 'network' | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showInactivityMessage, setShowInactivityMessage] = useState(false);
  const [showAccountDeletedMessage, setShowAccountDeletedMessage] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuthStore();

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  useEffect(() => {
    const state = location.state as { reason?: string } | null;
    if (state?.reason === 'inactivity') {
      setShowInactivityMessage(true);
      window.history.replaceState({}, document.title);
    } else if (state?.reason === 'account_deleted') {
      setShowAccountDeletedMessage(true);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setErrorType(null);
    setLoading(true);

    try {
      const { access, refresh, user, organization } = await authApi.loginWithProfile({
        username,
        password
      });
      login(access, refresh, user, organization);
      navigate('/');
    } catch (err: any) {
      if (err.message === 'ROLE_NOT_ALLOWED') {
        setErrorType('role');
        setError('Acces refuse. Cette interface est reservee aux administrateurs et superviseurs. Utilisez l\'application mobile pour les chauffeurs.');
      } else if (err.response?.status === 401) {
        setErrorType('credentials');
        setError('Identifiants incorrects. Verifiez votre nom d\'utilisateur et mot de passe.');
      } else if (err.code === 'ERR_NETWORK') {
        setErrorType('network');
        setError('Erreur de connexion au serveur. Verifiez votre connexion internet.');
      } else {
        setErrorType('credentials');
        setError('Une erreur est survenue. Veuillez reessayer.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#f5f7f6]">

      {/* Animated floating orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="login-orb login-orb-1" />
        <div className="login-orb login-orb-2" />
        <div className="login-orb login-orb-3" />
      </div>

      {/* Subtle grid pattern */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(rgba(106,138,130,0.06) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }} />

      <div
        className="relative z-10 w-full max-w-[420px] px-5 sm:px-6"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(40px)',
          transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Card */}
        <div
          className="rounded-3xl overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(24px)',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03), 0 20px 50px -12px rgba(106,138,130,0.18), 0 0 0 1px rgba(255,255,255,0.7)',
          }}
        >
          {/* Animated gradient bar */}
          <div className="h-1 login-gradient-bar" />

          {/* Logo */}
          <div
            className="flex justify-center pt-8 pb-1"
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'scale(1) translateY(0)' : 'scale(0.8) translateY(-10px)',
              transition: 'all 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.2s',
            }}
          >
            <img
              src="/logo_banner.png"
              alt="YaswaCar"
              className="h-14 sm:h-16 w-auto object-contain login-logo-float"
            />
          </div>

          {/* Thin separator */}
          <div className="flex justify-center py-3">
            <div
              className="h-px w-16 rounded-full"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(106,138,130,0.3), transparent)',
                opacity: mounted ? 1 : 0,
                transition: 'opacity 0.6s ease 0.4s',
              }}
            />
          </div>

          <div className="px-7 sm:px-9 pb-8">
            {/* Header */}
            <div
              className="text-center mb-6"
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? 'translateY(0)' : 'translateY(10px)',
                transition: 'all 0.6s ease 0.3s',
              }}
            >
              <h2 className="text-xl font-semibold text-gray-800">Connexion</h2>
              <p className="text-[13px] text-gray-400 mt-1.5 font-light">Accédez a votre espace de gestion</p>
            </div>

            {/* Inactivity message */}
            {showInactivityMessage && (
              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-blue-50/80 border border-blue-100 mb-5 login-fade-in">
                <Clock className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-blue-700">Session expiree</p>
                  <p className="text-[11px] text-blue-500 mt-0.5">Déconnecte pour inactivite.</p>
                </div>
                <button type="button" onClick={() => setShowInactivityMessage(false)} className="text-blue-300 hover:text-blue-500 text-lg leading-none">&times;</button>
              </div>
            )}

            {/* Account deleted message */}
            {showAccountDeletedMessage && (
              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-green-50/80 border border-green-100 mb-5 login-fade-in">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-green-700">Compte supprime avec succes</p>
                </div>
                <button type="button" onClick={() => setShowAccountDeletedMessage(false)} className="text-green-300 hover:text-green-500 text-lg leading-none">&times;</button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username */}
              <div
                style={{
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? 'translateY(0)' : 'translateY(15px)',
                  transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.4s',
                }}
              >
                <label className="block text-xs font-medium text-gray-500 mb-1.5 ml-1">Nom d'utilisateur</label>
                <div
                  className="relative rounded-2xl transition-all duration-300"
                  style={{
                    boxShadow: focusedField === 'username'
                      ? '0 0 0 2px rgba(106,138,130,0.2), 0 4px 12px rgba(106,138,130,0.08)'
                      : '0 0 0 1px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
                  }}
                >
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <User className="w-[18px] h-[18px] transition-colors duration-300" style={{ color: focusedField === 'username' ? '#6A8A82' : '#c0c8c5' }} />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onFocus={() => setFocusedField('username')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white text-sm text-gray-800 placeholder-gray-300 focus:outline-none"
                    placeholder="Entrez votre identifiant"
                    required
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Password */}
              <div
                style={{
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? 'translateY(0)' : 'translateY(15px)',
                  transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.5s',
                }}
              >
                <div className="flex items-center justify-between mb-1.5 ml-1">
                  <label className="block text-xs font-medium text-gray-500">Mot de passe</label>
                  <Link to="/forgot-password" className="text-[11px] font-medium transition-colors hover:underline" style={{ color: '#B87333' }}>
                    Oublie ?
                  </Link>
                </div>
                <div
                  className="relative rounded-2xl transition-all duration-300"
                  style={{
                    boxShadow: focusedField === 'password'
                      ? '0 0 0 2px rgba(184,115,51,0.2), 0 4px 12px rgba(184,115,51,0.08)'
                      : '0 0 0 1px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
                  }}
                >
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <Lock className="w-[18px] h-[18px] transition-colors duration-300" style={{ color: focusedField === 'password' ? '#B87333' : '#c0c8c5' }} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full pl-12 pr-12 py-3.5 rounded-2xl bg-white text-sm text-gray-800 placeholder-gray-300 focus:outline-none"
                    placeholder="Entrez votre mot de passe"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className={`flex items-start gap-3 p-3.5 rounded-2xl border login-fade-in ${
                  errorType === 'role' ? 'bg-amber-50/80 border-amber-100'
                    : errorType === 'network' ? 'bg-blue-50/80 border-blue-100'
                    : 'bg-red-50/80 border-red-100'
                }`}>
                  {errorType === 'role' ? (
                    <Shield className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${errorType === 'network' ? 'text-blue-500' : 'text-red-500'}`} />
                  )}
                  <div>
                    <p className={`text-xs font-medium ${
                      errorType === 'role' ? 'text-amber-700' : errorType === 'network' ? 'text-blue-700' : 'text-red-700'
                    }`}>{error}</p>
                    {errorType === 'role' && (
                      <p className="text-[11px] text-amber-500 mt-1">Utilisez l'application mobile pour les chauffeurs.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Submit */}
              <div
                style={{
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? 'translateY(0)' : 'translateY(15px)',
                  transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.6s',
                }}
              >
                <button
                  type="submit"
                  disabled={loading}
                  className="login-btn w-full py-3.5 rounded-2xl font-semibold text-white text-sm flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Connexion...</span>
                    </>
                  ) : (
                    <>
                      <span>Se connecter</span>
                      <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Separator */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-[11px] text-gray-300 font-medium">OU</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            {/* Sign up */}
            <div
              className="text-center"
              style={{
                opacity: mounted ? 1 : 0,
                transition: 'opacity 0.6s ease 0.7s',
              }}
            >
              <Link
                to="/signup"
                className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:underline"
                style={{ color: '#6A8A82' }}
              >
                Creer un compte
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between mt-5 px-2"
          style={{ opacity: mounted ? 0.5 : 0, transition: 'opacity 0.6s ease 0.8s' }}
        >
          <p className="text-[11px] text-gray-400">v1.0</p>
          <div className="flex items-center gap-1">
            <Shield className="w-3 h-3 text-gray-300" />
            <p className="text-[11px] text-gray-400">Admin / Superviseur</p>
          </div>
        </div>
      </div>

      <style>{`
        .login-gradient-bar {
          background: linear-gradient(90deg, #6A8A82, #B87333, #6A8A82);
          background-size: 200% 100%;
          animation: login-bar-shimmer 3s ease infinite;
        }

        @keyframes login-bar-shimmer {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        .login-logo-float {
          animation: login-float 4s ease-in-out infinite;
        }

        @keyframes login-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }

        .login-btn {
          background: linear-gradient(135deg, #6A8A82 0%, #5a7a72 40%, #B87333 100%);
          background-size: 200% 200%;
          animation: login-btn-gradient 4s ease infinite;
          box-shadow: 0 4px 14px rgba(106,138,130,0.35);
          transition: box-shadow 0.3s ease, transform 0.3s ease;
        }
        .login-btn:not(:disabled):hover {
          box-shadow: 0 6px 20px rgba(184,115,51,0.4);
          transform: translateY(-1px);
        }
        .login-btn:not(:disabled):active {
          transform: translateY(0);
          box-shadow: 0 2px 8px rgba(106,138,130,0.3);
        }
        @keyframes login-btn-gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        .login-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(60px);
        }
        .login-orb-1 {
          width: 300px; height: 300px;
          top: -100px; right: -80px;
          background: rgba(106,138,130,0.12);
          animation: login-drift-1 8s ease-in-out infinite;
        }
        .login-orb-2 {
          width: 250px; height: 250px;
          bottom: -60px; left: -60px;
          background: rgba(184,115,51,0.1);
          animation: login-drift-2 10s ease-in-out infinite;
        }
        .login-orb-3 {
          width: 150px; height: 150px;
          top: 40%; right: 20%;
          background: rgba(106,138,130,0.06);
          animation: login-drift-3 12s ease-in-out infinite;
        }

        @keyframes login-drift-1 {
          0%, 100% { transform: translate(0, 0); }
          33% { transform: translate(-20px, 15px); }
          66% { transform: translate(10px, -10px); }
        }
        @keyframes login-drift-2 {
          0%, 100% { transform: translate(0, 0); }
          33% { transform: translate(15px, -20px); }
          66% { transform: translate(-10px, 10px); }
        }
        @keyframes login-drift-3 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-15px, -15px); }
        }

        .login-fade-in {
          animation: login-fade-in 0.3s ease-out;
        }
        @keyframes login-fade-in {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
