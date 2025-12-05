
import React from 'react';
import { Page } from '../types';
import { Icon } from './Icon';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getThemeClasses } from '../utils/themeConfig';

interface BottomNavProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentPage, setCurrentPage }) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const colors = getThemeClasses(theme);

  const navItems = [
    { page: Page.AiAssistant, label: t('nav.aiAssistant'), icon: 'sparkles' as const },
    { page: Page.ManageDevice, label: t('nav.manageDevice'), icon: 'cog' as const },
    { page: Page.Analytics, label: t('nav.analytics'), icon: 'chart' as const },
    { page: Page.Profile, label: t('nav.profile'), icon: 'user' as const },
  ];

  return (
    <nav className={`fixed bottom-0 left-0 right-0 ${colors.bgNav} backdrop-blur-lg border-t ${colors.borderPrimary}`}>
      <div className="flex items-center justify-between max-w-2xl mx-auto">
        {/* EcoHack Watermark */}
        <a
          href="https://aahf.sa/en/singleaction/9"
          target="_blank"
          rel="noopener noreferrer"
          className={`flex flex-col items-center justify-center px-3 py-2 transition-opacity duration-200 hover:opacity-70 ${colors.textTertiary}`}
        >
          <span className="text-[9px] font-semibold leading-tight text-center">Made for</span>
          <span className="text-[10px] font-bold leading-tight text-center">EcoHack</span>
          <span className="text-[8px] leading-tight text-center">by FabLab</span>
        </a>

        {/* Navigation Items */}
        <div className="flex justify-around flex-1">
          {navItems.map((item) => (
            <button
              key={item.page}
              onClick={() => setCurrentPage(item.page)}
              className={`flex flex-col items-center justify-center w-full pt-3 pb-2 transition-colors duration-200 ${
                currentPage === item.page
                  ? colors.textAccent
                  : `${colors.textTertiary} ${colors.accentGreenHover}`
              }`}
            >
              <Icon name={item.icon} className="h-6 w-6 mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
              {currentPage === item.page && (
                <div className={`w-10 h-1 ${theme === 'dark' ? 'bg-green-400' : 'bg-green-600'} rounded-full mt-1`}></div>
              )}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;
