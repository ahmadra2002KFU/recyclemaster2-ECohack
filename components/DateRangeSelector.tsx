
import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getThemeClasses } from '../utils/themeConfig';
import { DateRangeOption } from '../types';

interface DateRangeSelectorProps {
  value: DateRangeOption;
  onChange: (value: DateRangeOption) => void;
}

const OPTIONS: { value: DateRangeOption; labelKey: string }[] = [
  { value: '1h', labelKey: 'analytics.lastHour' },
  { value: '6h', labelKey: 'analytics.last6Hours' },
  { value: '24h', labelKey: 'analytics.last24Hours' },
  { value: '7d', labelKey: 'analytics.last7Days' },
];

const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  value,
  onChange,
}) => {
  const { theme } = useTheme();
  const { t, isRTL } = useLanguage();
  const colors = getThemeClasses(theme);

  return (
    <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            value === option.value
              ? colors.btnPrimary
              : `${colors.btnSecondary} ${colors.btnSecondaryHover}`
          }`}
        >
          {t(option.labelKey)}
        </button>
      ))}
    </div>
  );
};

export default DateRangeSelector;
