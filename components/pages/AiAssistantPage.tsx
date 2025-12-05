
import React, { useState } from 'react';
import { AiAssistantMode } from '../../types';
import DeviceControlAI from '../ai/DeviceControlAI';
import SupportChatbot from '../ai/SupportChatbot';
import { Icon } from '../Icon';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { getThemeClasses } from '../../utils/themeConfig';

const AiAssistantPage: React.FC = () => {
  const { theme } = useTheme();
  const { t, isRTL } = useLanguage();
  const colors = getThemeClasses(theme);
  const [mode, setMode] = useState<AiAssistantMode>('control');

  const getButtonClass = (buttonMode: AiAssistantMode) =>
    `flex-1 py-3 px-4 text-center font-semibold rounded-lg transition-all duration-300 flex items-center justify-center ${isRTL ? 'space-x-reverse' : ''} space-x-2 ${
      mode === buttonMode
        ? `${colors.btnPrimary} text-white shadow-md`
        : `${colors.btnSecondary} ${colors.textSecondary} ${colors.btnSecondaryHover}`
    }`;

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className={`flex p-1 ${isRTL ? 'space-x-reverse' : ''} space-x-1 ${colors.bgCard} rounded-xl`}>
        <button onClick={() => setMode('control')} className={getButtonClass('control')}>
          <Icon name="cog" className="h-5 w-5" />
          <span>{t('ai.deviceControl')}</span>
        </button>
        <button onClick={() => setMode('support')} className={getButtonClass('support')}>
          <Icon name="robot" className="h-5 w-5" />
          <span>{t('ai.aiSupport')}</span>
        </button>
      </div>

      <div className="flex-1">
        {mode === 'control' && <DeviceControlAI />}
        {mode === 'support' && <SupportChatbot />}
      </div>
    </div>
  );
};

export default AiAssistantPage;
