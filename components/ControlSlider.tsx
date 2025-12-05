
import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeClasses } from '../utils/themeConfig';

interface ControlSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  unit: string;
  disabled: boolean;
}

const ControlSlider: React.FC<ControlSliderProps> = ({ label, value, onChange, min, max, unit, disabled }) => {
  const { theme } = useTheme();
  const colors = getThemeClasses(theme);
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className={`py-4 transition-opacity duration-300 ${disabled ? 'opacity-50' : 'opacity-100'}`}>
      <div className="flex justify-between items-center mb-2">
        <label className={`text-lg font-medium ${colors.textSecondary}`}>{label}</label>
        <span className={`text-lg font-bold ${colors.textAccent}`}>{value}{unit}</span>
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={disabled}
          className={`w-full h-2 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'} rounded-lg appearance-none cursor-pointer slider-thumb`}
        />
         <style>{`
          .slider-thumb::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 20px;
            height: 20px;
            background: ${theme === 'dark' ? '#4ade80' : '#16a34a'};
            cursor: pointer;
            border-radius: 50%;
            border: 2px solid ${theme === 'dark' ? '#1f2937' : '#ffffff'};
          }
          .slider-thumb::-moz-range-thumb {
            width: 20px;
            height: 20px;
            background: ${theme === 'dark' ? '#4ade80' : '#16a34a'};
            cursor: pointer;
            border-radius: 50%;
            border: 2px solid ${theme === 'dark' ? '#1f2937' : '#ffffff'};
          }
        `}</style>
      </div>
    </div>
  );
};

export default ControlSlider;
