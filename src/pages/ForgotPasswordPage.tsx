import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Car, Mail, Loader2, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation basique de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Veuillez entrer une adresse email valide');
      setLoading(false);
      return;
    }

    try {
      // TODO: Implémenter l'appel API pour réinitialisation du mot de passe
      // await authApi.forgotPassword({ email });

      // Simuler un délai
      await new Promise(resolve => setTimeout(resolve, 1500));

      setEmailSent(true);
    } catch (err: any) {
      setError('Une erreur est survenue. Veuillez réessayer.');
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
                Email envoyé !
              </h2>

              <p className="text-sm text-gray-600 mb-6">
                Si un compte existe avec l'adresse :
              </p>

              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <p className="font-semibold" style={{ color: '#6A8A82' }}>
                  {email}
                </p>
              </div>

              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
                <p className="text-sm text-gray-700">
                  Vous recevrez un email avec un lien pour réinitialiser votre mot de passe.
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
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2" style={{ color: '#191919' }}>
                Mot de passe oublié ?
              </h2>
              <p className="text-sm text-gray-600">
                Pas de problème ! Entrez votre email pour réinitialiser votre mot de passe
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-gray-200 focus:outline-none transition-all text-sm text-gray-900"
                    onFocus={(e) => e.target.style.borderColor = '#6A8A82'}
                    onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                    placeholder="votre.email@rewisecar.com"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Info message */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                <p className="text-xs text-gray-700">
                  Nous vous enverrons un lien pour créer un nouveau mot de passe.
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
                  <span>Envoyer le lien de réinitialisation</span>
                )}
              </button>
            </form>

            {/* Back to login link */}
            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="inline-flex items-center space-x-2 text-sm font-medium hover:underline"
                style={{ color: '#6A8A82' }}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Retour à la connexion</span>
              </Link>
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
