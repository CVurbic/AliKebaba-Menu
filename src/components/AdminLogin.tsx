// components/AdminLogin.tsx
import { useState } from "react";
import { supabase } from "../supabaseClient";
import { useLanguage } from "../context/LanguageContext";
import { availableLanguages } from "../services/language";
import { Clock, MapPin } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { t, currentLanguage, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const [isLangOpen, setIsLangOpen] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Neočekivana greška");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero section */}
      <div className="relative h-[40vh] md:h-[60vh] bg-[#C41E3A]">
        <div className="absolute inset-0 bg-black/30" />
        
        {/* Language selector */}
        <div className="absolute top-4 right-4 z-10">
          <div className="relative">
            <button
              onClick={() => setIsLangOpen(!isLangOpen)}
              className="bg-white/80 backdrop-blur-sm rounded-lg shadow-md px-4 py-2 text-[#C41E3A] font-medium hover:bg-white/90 transition-colors flex items-center space-x-2"
            >
              <span>{availableLanguages.find(lang => lang.code === currentLanguage)?.name}</span>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className={`h-5 w-5 transition-transform ${isLangOpen ? 'rotate-180' : ''}`} 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>

            {isLangOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden">
                {availableLanguages.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code as 'hr' | 'en' | 'de');
                      setIsLangOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 hover:bg-red-50 transition-colors ${
                      currentLanguage === lang.code ? 'text-[#C41E3A] font-medium' : 'text-gray-700'
                    }`}
                  >
                    {lang.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Login Form */}
      <div className="max-w-md mx-auto py-12 px-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 border border-gray-200">
          <h2 className="text-3xl font-bold text-[#C41E3A] mb-8 text-center">
            {t('adminLogin')}
          </h2>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                {t('email')}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#C41E3A] focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                {t('password')}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#C41E3A] focus:border-transparent"
                required
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center p-2 bg-red-50 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#C41E3A] text-white py-3 rounded-lg font-medium hover:bg-[#9e172f] transition-colors disabled:opacity-50"
            >
              {loading ? t('loading') + '...' : t('login')}
            </button>
          </form>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#7a1627] py-8 text-white mt-12">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-8 grid gap-8 md:grid-cols-3">
            <div className="flex items-center justify-center md:justify-start">
              <MapPin className="mr-2 h-5 w-5" />
              <span>{t('address')}</span>
            </div>
            <div></div>
            <div className="flex flex-col items-center justify-center md:justify-start">
              <Clock className="mr-2 h-5 w-5" />
              <span>{t('workingHoursPonUto')}</span>
              <span>{t('workingHoursSriCet')}</span>
              <span>{t('workingHoursPetSub')}</span>
              <span>{t('workingHoursNed')}</span>
            </div>
          </div>
          <p className="text-center">© {new Date().getFullYear()} Ali Kebaba. {t('allRightsReserved')}</p>
        </div>
      </footer>
    </div>
  );
};

export default AdminLogin;