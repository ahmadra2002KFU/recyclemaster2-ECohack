
import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useData } from '../../contexts/DataContext';
import { getThemeClasses } from '../../utils/themeConfig';
import { DeviceReading, DateRangeOption } from '../../types';
import DateRangeSelector from '../DateRangeSelector';
import DiameterTempChart from '../charts/DiameterTempChart';
import DiameterSpeedChart from '../charts/DiameterSpeedChart';
import { Icon } from '../Icon';

const AnalyticsPage: React.FC = () => {
  const { theme } = useTheme();
  const { t, isRTL } = useLanguage();
  const colors = getThemeClasses(theme);
  const { getAnalyticsData, readingsCount, isDbReady } = useData();

  const [dateRange, setDateRange] = useState<DateRangeOption>('24h');
  const [readings, setReadings] = useState<DeviceReading[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!isDbReady) return;

      setIsLoading(true);
      try {
        const data = await getAnalyticsData(dateRange);
        setReadings(data);
      } catch (error) {
        console.error('Failed to load analytics data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [dateRange, isDbReady, getAnalyticsData]);

  // Calculate summary statistics
  const stats = React.useMemo(() => {
    if (readings.length === 0) {
      return {
        avgDiameter: 0,
        avgTemp: 0,
        avgPower: 0,
        dataPoints: 0,
      };
    }

    const sum = readings.reduce(
      (acc, r) => ({
        diameter: acc.diameter + r.currentDiameter,
        temp: acc.temp + r.temperature,
        power: acc.power + r.powerUsage,
      }),
      { diameter: 0, temp: 0, power: 0 }
    );

    return {
      avgDiameter: sum.diameter / readings.length,
      avgTemp: sum.temp / readings.length,
      avgPower: sum.power / readings.length,
      dataPoints: readings.length,
    };
  }, [readings]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
        <h2 className={`text-2xl font-bold ${colors.textPrimary}`}>
          {t('analytics.title')}
        </h2>
        <DateRangeSelector value={dateRange} onChange={setDateRange} />
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`p-4 ${colors.bgCard} rounded-xl`}>
          <div className={`flex items-center gap-2 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Icon name="ruler" className={`h-5 w-5 text-blue-500`} />
            <span className={`text-sm ${colors.textSecondary}`}>
              {t('analytics.avgDiameter')}
            </span>
          </div>
          <span className={`text-xl font-bold ${colors.textPrimary}`}>
            {stats.avgDiameter.toFixed(2)}mm
          </span>
        </div>

        <div className={`p-4 ${colors.bgCard} rounded-xl`}>
          <div className={`flex items-center gap-2 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Icon name="cog" className={`h-5 w-5 text-green-500`} />
            <span className={`text-sm ${colors.textSecondary}`}>
              {t('analytics.avgTemp')}
            </span>
          </div>
          <span className={`text-xl font-bold ${colors.textPrimary}`}>
            {stats.avgTemp.toFixed(1)}°C
          </span>
        </div>

        <div className={`p-4 ${colors.bgCard} rounded-xl`}>
          <div className={`flex items-center gap-2 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Icon name="bolt" className={`h-5 w-5 text-amber-500`} />
            <span className={`text-sm ${colors.textSecondary}`}>
              {t('analytics.avgPower')}
            </span>
          </div>
          <span className={`text-xl font-bold ${colors.textPrimary}`}>
            {stats.avgPower.toFixed(0)}W
          </span>
        </div>

        <div className={`p-4 ${colors.bgCard} rounded-xl`}>
          <div className={`flex items-center gap-2 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Icon name="chart" className={`h-5 w-5 text-purple-500`} />
            <span className={`text-sm ${colors.textSecondary}`}>
              {t('analytics.dataPoints')}
            </span>
          </div>
          <span className={`text-xl font-bold ${colors.textPrimary}`}>
            {stats.dataPoints}
          </span>
        </div>
      </div>

      {/* Charts */}
      {isLoading ? (
        <div className={`p-8 ${colors.bgCard} rounded-2xl text-center`}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className={colors.textSecondary}>{t('analytics.loading')}</p>
        </div>
      ) : readings.length === 0 ? (
        <div className={`p-8 ${colors.bgCard} rounded-2xl text-center`}>
          <Icon name="chart" className={`h-12 w-12 mx-auto mb-4 ${colors.textTertiary}`} />
          <p className={colors.textSecondary}>{t('analytics.noData')}</p>
          <p className={`text-sm ${colors.textTertiary} mt-2`}>
            {t('analytics.noDataHint')}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <DiameterTempChart data={readings} />
          <DiameterSpeedChart data={readings} />
        </div>
      )}

      {/* Database Info */}
      <div className={`p-4 ${colors.bgCard} rounded-xl`}>
        <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <span className={`text-sm ${colors.textSecondary}`}>
            {t('analytics.totalReadings')}
          </span>
          <span className={`text-sm font-medium ${colors.textPrimary}`}>
            {readingsCount}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
