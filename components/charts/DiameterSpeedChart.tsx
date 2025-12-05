
import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { getThemeClasses } from '../../utils/themeConfig';
import { DeviceReading } from '../../types';

interface DiameterSpeedChartProps {
  data: DeviceReading[];
}

const DiameterSpeedChart: React.FC<DiameterSpeedChartProps> = ({ data }) => {
  const { theme } = useTheme();
  const { t, isRTL } = useLanguage();
  const colors = getThemeClasses(theme);

  // Format data for the chart
  const chartData = data.map((reading) => ({
    time: new Date(reading.timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    }),
    diameter: reading.currentDiameter,
    extrusionSpeed: reading.extrusionSpeed,
    pullingSpeed: reading.pullingSpeed,
  }));

  // Theme-based colors
  const gridColor = theme === 'dark' ? '#374151' : '#e5e7eb';
  const textColor = theme === 'dark' ? '#9ca3af' : '#6b7280';
  const diameterColor = theme === 'dark' ? '#60a5fa' : '#2563eb';
  const extrusionColor = theme === 'dark' ? '#f472b6' : '#db2777';
  const pullingColor = theme === 'dark' ? '#a78bfa' : '#7c3aed';

  return (
    <div className={`p-4 ${colors.bgCard} rounded-2xl shadow-lg`}>
      <h3 className={`text-lg font-semibold ${colors.textPrimary} mb-4`}>
        {t('analytics.diameterVsSpeed')}
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis
              dataKey="time"
              tick={{ fill: textColor, fontSize: 12 }}
              tickLine={{ stroke: gridColor }}
              reversed={isRTL}
            />
            <YAxis
              yAxisId="left"
              tick={{ fill: textColor, fontSize: 12 }}
              tickLine={{ stroke: gridColor }}
              domain={[1.5, 2.0]}
              label={{
                value: 'mm',
                angle: -90,
                position: 'insideLeft',
                fill: textColor,
              }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fill: textColor, fontSize: 12 }}
              tickLine={{ stroke: gridColor }}
              domain={[0, 100]}
              label={{
                value: '%',
                angle: 90,
                position: 'insideRight',
                fill: textColor,
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                border: `1px solid ${gridColor}`,
                borderRadius: '8px',
              }}
              labelStyle={{ color: textColor }}
            />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="diameter"
              stroke={diameterColor}
              strokeWidth={2}
              dot={false}
              name={t('device.diameter')}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="extrusionSpeed"
              stroke={extrusionColor}
              strokeWidth={2}
              dot={false}
              name={t('device.extrusionSpeed')}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="pullingSpeed"
              stroke={pullingColor}
              strokeWidth={2}
              dot={false}
              name={t('device.pullingSpeed')}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DiameterSpeedChart;
