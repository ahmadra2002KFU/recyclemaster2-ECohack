import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

const LanguageSelector: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  const { theme } = useTheme();

  return (
    <div className="flex gap-2">
      <button
        onClick={() => setLanguage('en')}
        className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
          language === 'en'
            ? theme === 'dark'
              ? 'bg-green-500 text-white'
              : 'bg-green-600 text-white'
            : theme === 'dark'
            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        English
      </button>
      <button
        onClick={() => setLanguage('ar')}
        className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
          language === 'ar'
            ? theme === 'dark'
              ? 'bg-green-500 text-white'
              : 'bg-green-600 text-white'
            : theme === 'dark'
            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        العربية
      </button>
    </div>
  );
};

export default LanguageSelector;

