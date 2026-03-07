import { Loader2 } from 'lucide-react';

export default function GlobalLoader() {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center z-50">
      <div className="text-center">
        {/* Logo avec animation */}
        <div className="relative mb-8">
          <img src="/logo_banner.png" alt="YaswaCar" className="h-16 w-auto object-contain mx-auto animate-pulse" />
          {/* Cercles animés autour du logo */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 rounded-full border-4 border-transparent animate-spin" style={{
              borderTopColor: '#B87333',
              borderRightColor: '#B87333'
            }} />
          </div>
        </div>

        {/* Barre de chargement */}
        <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden mx-auto">
          <div
            className="h-full rounded-full animate-pulse"
            style={{
              width: '100%',
              background: 'linear-gradient(90deg, #6A8A82 0%, #B87333 50%, #6A8A82 100%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 2s infinite'
            }}
          />
        </div>

        <p className="text-xs text-gray-500 mt-6 flex items-center justify-center space-x-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Chargement en cours...</span>
        </p>
      </div>

      <style>{`
        @keyframes shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
    </div>
  );
}
