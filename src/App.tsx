import { useState } from 'react';
import { LanguageToggle } from './components/LanguageToggle';
import CJENIK_EN from "./resources/CJENIK_EN.png"
import CJENIK_HR from "./resources/CJENIK_HR.png"
import CJENIK_STEAK_EN from "./resources/CJENIK_STEAK_EN.png"
import CJENIK_STEAK_HR from "./resources/CJENIK_STEAK_HR.png"


function App() {
  const [language, setLanguage] = useState<'en' | 'hr'>('en');

  const toggleLanguage = () => {
    setLanguage(current => current === 'en' ? 'hr' : 'en');
  };

  const isWeekend = () => {
    const day = new Date().getDay();
    // 5 is Friday, 6 is Saturday
    return day === 5 || day === 6;
  };

  const menuUrl = isWeekend()
    ? (language === 'en'
      ? CJENIK_STEAK_EN// English weekend/steak menu
      : CJENIK_STEAK_HR) // Croatian weekend/steak menu
    : (language === 'en'
      ? CJENIK_EN// English weekday menu
      : CJENIK_HR); // Croatian weekday menu

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {language === 'en' ? 'Menu' : 'Cjenik'}
          </h1>
          <LanguageToggle
            currentLanguage={language}
            onToggle={toggleLanguage}
          />
        </div>

        {/* Menu Image */}
        <div className="bg-white rounded-lg shadow-lg p-4">
          <img
            src={menuUrl}
            alt={language === 'en' ? 'Restaurant Menu' : 'Restoranski Meni'}
            className="w-full h-auto rounded-md"
            style={{ maxHeight: '80vh', objectFit: 'contain' }}
          />
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-gray-600">
          <p>{language === 'en' ? '© 2025 AliKebaba, Virtus Cibus d.o.o. All rights reserved.' : '© 2025 AliKebaba, Virtus Cibus d.o.o. Sva prava pridržana.'}</p>
        </div>
      </div>
    </div>
  );
}

export default App;