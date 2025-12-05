
import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getThemeClasses } from '../utils/themeConfig';
import { Icon } from './Icon';

interface DiameterSliderProps {
  value: number;
  currentDiameter: number;
  onChange: (value: number) => void;
  disabled: boolean;
}

const PRESETS = [
  { value: 1.75, label: '1.75mm' },
  { value: 2.85, label: '2.85mm' },
];

const DiameterSlider: React.FC<DiameterSliderProps> = ({
  value,
  currentDiameter,
  onChange,
  disabled,
}) => {
  const { theme } = useTheme();
  const { t, isRTL } = useLanguage();
  const colors = getThemeClasses(theme);

  const min = 1.5;
  const max = 2.0;
  const step = 0.01;

  // Check if current diameter is within tolerance (±0.05mm)
  const tolerance = 0.05;
  const isInTolerance =
    currentDiameter > 0 && Math.abs(currentDiameter - value) <= tolerance;

  const handleIncrement = () => {
    if (!disabled && value < max) {
      onChange(Math.min(max, Math.round((value + step) * 100) / 100));
    }
  };

  const handleDecrement = () => {
    if (!disabled && value > min) {
      onChange(Math.max(min, Math.round((value - step) * 100) / 100));
    }
  };

  return (
    <div
      className={`py-4 transition-opacity duration-300 ${
        disabled ? 'opacity-50' : 'opacity-100'
      }`}
    >
      {/* Header with label and current value */}
      <div className={`flex justify-between items-center mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Icon name="ruler" className={`h-5 w-5 ${colors.textSecondary}`} />
          <label className={`text-lg font-medium ${colors.textSecondary}`}>
            {t('device.targetDiameter')}
          </label>
        </div>
        <span className={`text-lg font-bold ${colors.textAccent}`}>
          {value.toFixed(2)}mm
        </span>
      </div>

      {/* Current diameter indicator */}
      {currentDiameter > 0 && (
        <div
          className={`flex items-center justify-between mb-3 px-3 py-2 rounded-lg ${
            isInTolerance
              ? theme === 'dark'
                ? 'bg-green-900/30'
                : 'bg-green-100'
              : theme === 'dark'
              ? 'bg-red-900/30'
              : 'bg-red-100'
          } ${isRTL ? 'flex-row-reverse' : ''}`}
        >
          <span
            className={`text-sm ${
              isInTolerance ? 'text-green-500' : 'text-red-500'
            }`}
          >
            {t('device.currentDiameter')}: {currentDiameter.toFixed(2)}mm
          </span>
          <Icon
            name={isInTolerance ? 'check' : 'trendingDown'}
            className={`h-4 w-4 ${isInTolerance ? 'text-green-500' : 'text-red-500'}`}
          />
        </div>
      )}

      {/* Slider with increment/decrement buttons */}
      <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <button
          onClick={handleDecrement}
          disabled={disabled || value <= min}
          className={`p-2 rounded-lg ${colors.btnSecondary} ${
            colors.btnSecondaryHover
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <Icon name="minus" className="h-5 w-5" />
        </button>

        <div className="flex-1 relative">
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            disabled={disabled}
            className={`w-full h-2 ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
            } rounded-lg appearance-none cursor-pointer diameter-slider`}
          />
          <style>{`
            .diameter-slider::-webkit-slider-thumb {
              -webkit-appearance: none;
              appearance: none;
              width: 24px;
              height: 24px;
              background: ${theme === 'dark' ? '#60a5fa' : '#2563eb'};
              cursor: pointer;
              border-radius: 50%;
              border: 3px solid ${theme === 'dark' ? '#1f2937' : '#ffffff'};
            }
            .diameter-slider::-moz-range-thumb {
              width: 24px;
              height: 24px;
              background: ${theme === 'dark' ? '#60a5fa' : '#2563eb'};
              cursor: pointer;
              border-radius: 50%;
              border: 3px solid ${theme === 'dark' ? '#1f2937' : '#ffffff'};
            }
          `}</style>
        </div>

        <button
          onClick={handleIncrement}
          disabled={disabled || value >= max}
          className={`p-2 rounded-lg ${colors.btnSecondary} ${
            colors.btnSecondaryHover
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <Icon name="plus" className="h-5 w-5" />
        </button>
      </div>

      {/* Min/Max labels */}
      <div className={`flex justify-between mt-1 text-xs ${colors.textTertiary}`}>
        <span>{min}mm</span>
        <span>{max}mm</span>
      </div>

      {/* Preset buttons */}
      <div className={`flex gap-2 mt-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
        {PRESETS.map((preset) => (
          <button
            key={preset.value}
            onClick={() => onChange(preset.value)}
            disabled={disabled}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              value === preset.value
                ? colors.btnPrimary
                : `${colors.btnSecondary} ${colors.btnSecondaryHover}`
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default DiameterSlider;
