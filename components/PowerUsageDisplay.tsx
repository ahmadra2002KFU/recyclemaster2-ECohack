
import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getThemeClasses } from '../utils/themeConfig';
import { Icon } from './Icon';

interface PowerUsageDisplayProps {
  powerUsage: number;
  maxPower?: number;
}

const PowerUsageDisplay: React.FC<PowerUsageDisplayProps> = ({
  powerUsage,
  maxPower = 500,
}) => {
  const { theme } = useTheme();
  const { t, isRTL } = useLanguage();
  const colors = getThemeClasses(theme);

  const percentage = Math.min(100, (powerUsage / maxPower) * 100);

  // Determine color based on power level
  const getBarColor = () => {
    if (percentage <= 40) return 'bg-green-500';
    if (percentage <= 70) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getTextColor = () => {
    if (percentage <= 40) return 'text-green-500';
    if (percentage <= 70) return 'text-amber-500';
    return 'text-red-500';
  };

  return (
    <div className={`p-4 ${colors.bgCard} rounded-xl`}>
      <div className={`flex items-center justify-between mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Icon name="bolt" className={`h-5 w-5 ${getTextColor()}`} />
          <span className={`text-sm font-medium ${colors.textSecondary}`}>
            {t('device.powerUsage')}
          </span>
        </div>
        <span className={`text-lg font-bold ${getTextColor()}`}>
          {powerUsage}W
        </span>
      </div>

      {/* Power gauge bar */}
      <div className={`h-3 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} rounded-full overflow-hidden`}>
        <div
          className={`h-full ${getBarColor()} rounded-full transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Scale markers */}
      <div className={`flex justify-between mt-1 text-xs ${colors.textTertiary}`}>
        <span>0W</span>
        <span>200W</span>
        <span>350W</span>
        <span>{maxPower}W</span>
      </div>
    </div>
  );
};

export default PowerUsageDisplay;
