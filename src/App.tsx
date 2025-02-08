import { useState, useEffect } from 'react';
import { LanguageToggle } from './components/LanguageToggle';
import CJENIK_EN from "./resources/CJENIK_EN.svg?raw"
import CJENIK_HR from "./resources/CJENIK_HR.svg?raw"
import CJENIK_STEAK_EN from "./resources/CJENIK_STEAK_EN.svg?raw"
import CJENIK_STEAK_HR from "./resources/CJENIK_STEAK_HR.svg?raw"


function App() {
  const [language, setLanguage] = useState<'en' | 'hr'>('en');
  const [currentSvgContent, setCurrentSvgContent] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);

  const toggleLanguage = () => {
    setLanguage(current => current === 'en' ? 'hr' : 'en');
  };

  const isWeekend = () => {
    const day = new Date().getDay();
    // 5 is Friday, 6 is Saturday
    return day === 5 || day === 6;
  };

  // Get the appropriate SVG content based on day and language
  useEffect(() => {
    const svgContent = isWeekend()
      ? (language === 'en' ? CJENIK_STEAK_EN : CJENIK_STEAK_HR)
      : (language === 'en' ? CJENIK_EN : CJENIK_HR);
    
    setCurrentSvgContent(svgContent);
  }, [language]);

  // Function to handle text updates in the SVG
  const handleTextEdit = (id: string, newValue: string) => {
    setCurrentSvgContent(prevContent => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(prevContent, 'image/svg+xml');
      const element = doc.getElementById(id);
      if (element) {
        element.textContent = newValue;
      }
      const serializer = new XMLSerializer();
      return serializer.serializeToString(doc);
    });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {language === 'en' ? 'Menu' : 'Cjenik'}
          </h1>
          <div className="flex gap-4 items-center">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              {isEditing ? 'Save Changes' : 'Edit Menu'}
            </button>
            <LanguageToggle
              currentLanguage={language}
              onToggle={toggleLanguage}
            />
          </div>
        </div>

        {/* Menu SVG */}
        <div className="bg-white rounded-lg shadow-lg p-4">
          <div 
            className="w-full"
            style={{ maxHeight: '80vh' }}
            dangerouslySetInnerHTML={{ __html: currentSvgContent }}
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