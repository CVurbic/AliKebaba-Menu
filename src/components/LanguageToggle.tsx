
import { Languages } from 'lucide-react';

interface LanguageToggleProps {
  currentLanguage: 'en' | 'hr';
  onToggle: () => void;
}

export function LanguageToggle({ currentLanguage, onToggle }: LanguageToggleProps) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm"
      aria-label={currentLanguage === 'en' ? 'Switch to Croatian' : 'Prebaci na Engleski'}
    >
      <Languages className="w-4 h-4" />
      <span className="font-medium">
        {currentLanguage === 'en' ? 'Hrvatski' : 'English'}
      </span>
    </button>
  );
}