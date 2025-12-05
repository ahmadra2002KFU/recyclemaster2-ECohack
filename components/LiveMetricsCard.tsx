
import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getThemeClasses } from '../utils/themeConfig';
import { Icon } from './Icon';
import { DeviceState } from '../types';

interface LiveMetricsCardProps {
  deviceState: DeviceState;
  targetDiameter: number;
  isDeviceOn: boolean;
}

const LiveMetricsCard: React.FC<LiveMetricsCardProps> = ({
  deviceState,
  targetDiameter,
  isDeviceOn,
}) => {
  const { theme } = useTheme();
  const { t, isRTL } = useLanguage();
  const colors = getThemeClasses(theme);

  const { currentDiameter, powerUsage, isRecording } = deviceState;

  // Check tolerance
  const tolerance = 0.05;
  const isInTolerance =
    currentDiameter > 0 && Math.abs(currentDiameter - targetDiameter) <= tolerance;

  // Determine power level color
  const getPowerColor = () => {
    if (!isDeviceOn || powerUsage === 0) return colors.textTertiary;
    if (powerUsage <= 200) return 'text-green-500';
    if (powerUsage <= 350) return 'text-amber-500';
    return 'text-red-500';
  };

  // Determine diameter color
  const getDiameterColor = () => {
    if (!isDeviceOn || currentDiameter === 0) return colors.textTertiary;
    return isInTolerance ? 'text-green-500' : 'text-red-500';
  };

  return (
    <div className={`p-4 ${colors.bgCard} rounded-2xl shadow-lg`}>
      <div className={`flex items-center justify-between mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <h3 className={`text-lg font-semibold ${colors.textPrimary}`}>
          {t('device.liveMetrics')}
        </h3>
        {isRecording && (
          <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <span className="text-xs text-red-500">{t('device.recording')}</span>
          </div>
        )}
      </div>

      <div className={`grid grid-cols-2 gap-4`}>
        {/* Current Diameter */}
        <div
          className={`p-4 rounded-xl ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
          }`}
        >
          <div className={`flex items-center gap-2 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Icon name="ruler" className={`h-5 w-5 ${getDiameterColor()}`} />
            <span className={`text-sm ${colors.textSecondary}`}>
              {t('device.currentDiameter')}
            </span>
          </div>
          <div className={`flex items-baseline gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <span className={`text-2xl font-bold ${getDiameterColor()}`}>
              {isDeviceOn ? currentDiameter.toFixed(2) : '--'}
            </span>
            <span className={`text-sm ${colors.textTertiary}`}>mm</span>
          </div>
          {isDeviceOn && currentDiameter > 0 && (
            <div className={`flex items-center gap-1 mt-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Icon
                name={isInTolerance ? 'trendingUp' : 'trendingDown'}
                className={`h-4 w-4 ${isInTolerance ? 'text-green-500' : 'text-red-500'}`}
              />
              <span
                className={`text-xs ${
                  isInTolerance ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {isInTolerance ? t('device.inTolerance') : t('device.outOfTolerance')}
              </span>
            </div>
          )}
        </div>

        {/* Power Usage */}
        <div
          className={`p-4 rounded-xl ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
          }`}
        >
          <div className={`flex items-center gap-2 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Icon name="bolt" className={`h-5 w-5 ${getPowerColor()}`} />
            <span className={`text-sm ${colors.textSecondary}`}>
              {t('device.powerUsage')}
            </span>
          </div>
          <div className={`flex items-baseline gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <span className={`text-2xl font-bold ${getPowerColor()}`}>
              {isDeviceOn ? powerUsage : '--'}
            </span>
            <span className={`text-sm ${colors.textTertiary}`}>W</span>
          </div>
          {isDeviceOn && powerUsage > 0 && (
            <div className={`mt-1`}>
              <div
                className={`h-1 rounded-full ${
                  theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
                } overflow-hidden`}
              >
                <div
                  className={`h-full transition-all duration-300 ${
                    powerUsage <= 200
                      ? 'bg-green-500'
                      : powerUsage <= 350
                      ? 'bg-amber-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(100, (powerUsage / 500) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveMetricsCard;
