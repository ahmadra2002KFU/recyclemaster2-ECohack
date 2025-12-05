
import React, { useContext, useState } from 'react';
import { AppContext } from '../../App';
import ControlSlider from '../ControlSlider';
import DiameterSlider from '../DiameterSlider';
import LiveMetricsCard from '../LiveMetricsCard';
import { Icon } from '../Icon';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useData } from '../../contexts/DataContext';
import { getThemeClasses } from '../../utils/themeConfig';

const ManageDevicePage: React.FC = () => {
  const context = useContext(AppContext);
  const { theme } = useTheme();
  const { t, isRTL } = useLanguage();
  const colors = getThemeClasses(theme);
  const { deviceState } = useData();

  if (!context) return null;

  const { deviceSettings, setDeviceSettings, isDeviceOn, setIsDeviceOn } = context;

  const handleSettingChange = <K extends keyof typeof deviceSettings>(
    key: K,
    value: typeof deviceSettings[K]
  ) => {
    setDeviceSettings((prev) => ({ ...prev, [key]: value }));
  };

  const toggleDevice = () => {
    const newState = !isDeviceOn;
    setIsDeviceOn(newState);
    // Toggle all components at once
    if (newState) {
      setDeviceSettings((prev) => ({
        ...prev,
        isShredding: true,
        isMelting: true,
        isExtruding: true,
        isFanOn: true,
      }));
    } else {
      setDeviceSettings((prev) => ({
        ...prev,
        isShredding: false,
        isMelting: false,
        isExtruding: false,
        isFanOn: false,
      }));
    }
  };

  const StatusIndicator: React.FC<{ label: string; isActive: boolean }> = ({
    label,
    isActive,
  }) => (
    <div
      className={`flex items-center ${
        isRTL ? 'space-x-reverse' : ''
      } space-x-2 p-3 ${colors.bgCard} rounded-lg`}
    >
      <div
        className={`w-3 h-3 rounded-full transition-colors duration-300 ${
          isActive ? colors.statusActive + ' animate-pulse' : colors.statusInactive
        }`}
      ></div>
      <span className={colors.textSecondary}>{label}</span>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Device Status */}
      <div className={`p-6 ${colors.bgCard} rounded-2xl shadow-lg`}>
        <h2 className={`text-xl font-semibold ${colors.textPrimary} mb-4`}>
          {t('device.status')}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatusIndicator
            label={t('device.shredder')}
            isActive={isDeviceOn && deviceSettings.isShredding}
          />
          <StatusIndicator
            label={t('device.melter')}
            isActive={isDeviceOn && deviceSettings.isMelting}
          />
          <StatusIndicator
            label={t('device.extruder')}
            isActive={isDeviceOn && deviceSettings.isExtruding}
          />
          <StatusIndicator
            label={t('device.fan')}
            isActive={isDeviceOn && deviceSettings.isFanOn}
          />
        </div>
      </div>

      {/* Live Metrics Card */}
      <LiveMetricsCard
        deviceState={deviceState}
        targetDiameter={deviceSettings.targetDiameter}
        isDeviceOn={isDeviceOn}
      />

      {/* Thermal Controls */}
      <div className={`p-6 ${colors.bgCard} rounded-2xl shadow-lg`}>
        <h2 className={`text-xl font-semibold ${colors.textPrimary} mb-2`}>
          {t('device.thermalControls')}
        </h2>
        <ControlSlider
          label={t('device.temperature')}
          value={deviceSettings.temperature}
          onChange={(v) => handleSettingChange('temperature', v)}
          min={30}
          max={250}
          unit="°C"
          disabled={!isDeviceOn}
        />
        <ControlSlider
          label={t('device.fanSpeed')}
          value={deviceSettings.fanSpeed}
          onChange={(v) => handleSettingChange('fanSpeed', v)}
          min={0}
          max={100}
          unit="%"
          disabled={!isDeviceOn}
        />
      </div>

      {/* Mechanical Controls */}
      <div className={`p-6 ${colors.bgCard} rounded-2xl shadow-lg`}>
        <h2 className={`text-xl font-semibold ${colors.textPrimary} mb-2`}>
          {t('device.mechanicalControls')}
        </h2>
        <ControlSlider
          label={t('device.shredderSpeed')}
          value={deviceSettings.shredderSpeed}
          onChange={(v) => handleSettingChange('shredderSpeed', v)}
          min={0}
          max={100}
          unit="%"
          disabled={!isDeviceOn}
        />
        <ControlSlider
          label={t('device.extrusionSpeed')}
          value={deviceSettings.extrusionSpeed}
          onChange={(v) => handleSettingChange('extrusionSpeed', v)}
          min={0}
          max={100}
          unit="%"
          disabled={!isDeviceOn}
        />
        <ControlSlider
          label={t('device.pullingSpeed')}
          value={deviceSettings.pullingSpeed}
          onChange={(v) => handleSettingChange('pullingSpeed', v)}
          min={0}
          max={100}
          unit="%"
          disabled={!isDeviceOn}
        />
      </div>

      {/* Output Control */}
      <div className={`p-6 ${colors.bgCard} rounded-2xl shadow-lg`}>
        <h2 className={`text-xl font-semibold ${colors.textPrimary} mb-2`}>
          {t('device.outputControl')}
        </h2>
        <DiameterSlider
          value={deviceSettings.targetDiameter}
          currentDiameter={deviceState.currentDiameter}
          onChange={(v) => handleSettingChange('targetDiameter', v)}
          disabled={!isDeviceOn}
        />
      </div>

      {/* Start/Stop Button */}
      <div className="flex justify-center mt-8 pb-4">
        <button
          onClick={toggleDevice}
          className={`px-8 py-4 rounded-full text-xl font-bold transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg flex items-center ${
            isRTL ? 'space-x-reverse' : ''
          } space-x-2 ${
            isDeviceOn
              ? `${colors.accentRed} ${colors.accentRedHover} text-white`
              : `${colors.btnPrimary} ${colors.btnPrimaryHover} text-white`
          }`}
        >
          <Icon name={isDeviceOn ? 'stop' : 'cog'} className="h-6 w-6" />
          <span>
            {isDeviceOn ? t('device.stopProcess') : t('device.startProcess')}
          </span>
        </button>
      </div>
    </div>
  );
};

export default ManageDevicePage;
