
import React, { useState, useMemo, useEffect } from 'react';
import { Page, DeviceSettings } from './types';
import BottomNav from './components/BottomNav';
import ManageDevicePage from './components/pages/ManageDevicePage';
import AiAssistantPage from './components/pages/AiAssistantPage';
import AnalyticsPage from './components/pages/AnalyticsPage';
import ProfilePage from './components/pages/ProfilePage';
import { useTheme } from './contexts/ThemeContext';
import { useLanguage } from './contexts/LanguageContext';
import { useData } from './contexts/DataContext';
import { getThemeClasses } from './utils/themeConfig';
import ThemeToggle from './components/ThemeToggle';

interface AppContextType {
  deviceSettings: DeviceSettings;
  setDeviceSettings: React.Dispatch<React.SetStateAction<DeviceSettings>>;
  isDeviceOn: boolean;
  setIsDeviceOn: React.Dispatch<React.SetStateAction<boolean>>;
}

export const AppContext = React.createContext<AppContextType | null>(null);

const App: React.FC = () => {
  const { theme } = useTheme();
  const { t, isRTL } = useLanguage();
  const { updateDeviceState } = useData();
  const colors = getThemeClasses(theme);

  const [currentPage, setCurrentPage] = useState<Page>(Page.ManageDevice);
  const [isDeviceOn, setIsDeviceOn] = useState(false);
  const [deviceSettings, setDeviceSettings] = useState<DeviceSettings>({
    temperature: 180,
    extrusionSpeed: 40,
    shredderSpeed: 60,
    pullingSpeed: 45,
    fanSpeed: 50,
    targetDiameter: 1.75,
    isShredding: false,
    isMelting: false,
    isExtruding: false,
    isFanOn: false,
  });

  const contextValue = useMemo(
    () => ({ deviceSettings, setDeviceSettings, isDeviceOn, setIsDeviceOn }),
    [deviceSettings, isDeviceOn]
  );

  // Sync device state with DataContext for recording/simulation
  useEffect(() => {
    updateDeviceState(deviceSettings, isDeviceOn);
  }, [deviceSettings, isDeviceOn, updateDeviceState]);

  const renderPage = () => {
    switch (currentPage) {
      case Page.ManageDevice:
        return <ManageDevicePage />;
      case Page.AiAssistant:
        return <AiAssistantPage />;
      case Page.Analytics:
        return <AnalyticsPage />;
      case Page.Profile:
        return <ProfilePage />;
      default:
        return <ManageDevicePage />;
    }
  };

  return (
    <AppContext.Provider value={contextValue}>
      <div className={`h-screen w-screen ${colors.bgPrimary} ${colors.textPrimary} flex flex-col font-sans`} dir={isRTL ? 'rtl' : 'ltr'}>
        <header className={`p-4 ${colors.bgHeader} backdrop-blur-sm border-b ${colors.borderPrimary} shadow-lg`}>
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            <div className="w-10"></div>
            <h1 className={`text-2xl font-bold text-center ${colors.textAccent} tracking-wider`}>
              {t('app.title')}
            </h1>
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 pb-24">
          {renderPage()}
        </main>
        <BottomNav currentPage={currentPage} setCurrentPage={setCurrentPage} />
      </div>
    </AppContext.Provider>
  );
};

export default App;
